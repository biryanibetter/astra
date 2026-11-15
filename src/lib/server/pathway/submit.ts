import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { validatePdf } from "@/lib/pathway/files";
import {
  MAX_CVS,
  MAX_REQUEST_BYTES,
  pathwaySubmissionSchema,
} from "@/lib/pathway/schema";
import { identity } from "./auth";
import { config, database, digest, duplicateFingerprint, rate } from "./client";
import { assertOrigin, HttpError, readBytes, reply, route } from "./http";

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, v]) => [key, canonical(v)]),
    );
  }
  return value;
}
const beginSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("new"), round: z.uuid() }),
  z.object({ state: z.literal("accepted"), id: z.uuid() }),
  ...(["conflict", "processing", "duplicate", "closed"] as const).map((state) =>
    z.object({ state: z.literal(state) }),
  ),
]);
async function processSubmission(request: Request) {
  assertOrigin(request);
  const env = config(true);
  const user = await identity();
  const key = z.uuid().safeParse(request.headers.get("idempotency-key"));
  if (!key.success)
    throw new HttpError(400, "A valid submission identity is required.");
  await rate(request, "submission", 15, user.email);
  const type = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data;\s*boundary=/iu.test(type))
    throw new HttpError(415, "Send the application and PDF files together.");
  const bytes = await readBytes(request, MAX_REQUEST_BYTES);
  let form: FormData;
  try {
    form = await new Response(bytes, {
      headers: { "Content-Type": type },
    }).formData();
  } catch {
    throw new HttpError(400, "The upload could not be read.");
  }
  if (
    [...form.keys()].some(
      (k) => k !== "application" && k !== "cv" && k !== "round",
    ) ||
    form.getAll("application").length !== 1 ||
    form.getAll("round").length !== 1
  ) {
    throw new HttpError(400, "Unexpected application fields.");
  }
  const raw = form.get("application");
  const round = z.uuid().safeParse(form.get("round"));
  if (!round.success)
    throw new HttpError(400, "Confirm the intake round before submitting.");
  let input: z.infer<typeof pathwaySubmissionSchema>;
  try {
    if (typeof raw !== "string" || raw.length > 32768) throw new Error();
    input = pathwaySubmissionSchema.parse(JSON.parse(raw));
  } catch {
    throw new HttpError(
      400,
      "Please check all required application fields and limits.",
    );
  }
  if (input.email !== user.email)
    throw new HttpError(403, "Verify the application email before submitting.");
  const files = form.getAll("cv");
  if (
    files.length < 1 ||
    files.length > MAX_CVS ||
    files.some((f) => typeof f === "string")
  ) {
    throw new HttpError(
      400,
      "Attach one to three PDF CV files, at most 5 MB each.",
    );
  }
  const prepared = [];
  for (const file of files) {
    if (typeof file === "string") throw new HttpError(400, "Invalid CV.");
    const buffer = new Uint8Array(await file.arrayBuffer());
    try {
      await validatePdf(buffer, file.type, file.name);
    } catch {
      throw new HttpError(
        400,
        "Use a flattened, unencrypted PDF CV (Print to PDF), at most 5 MB and 50 pages, without embedded/interactive or compressed object streams.",
      );
    }
    prepared.push({ buffer, hash: digest(buffer) });
  }
  const attempt = randomUUID();
  const metadata = prepared.map((f) => {
    const id = randomUUID();
    return {
      id,
      path: `${attempt}/${id}.pdf`,
      size: f.buffer.length,
      sha256: f.hash,
    };
  });
  const hash = digest(
    JSON.stringify(
      canonical({
        input,
        round: round.data,
        files: prepared.map((f) => f.hash),
      }),
    ),
  );
  const db = database();
  const begin = await db.rpc("astra_begin", {
    p_id: key.data,
    p_owner: user.id,
    p_round: round.data,
    p_email: user.email,
    p_email_hash: duplicateFingerprint(user.email),
    p_track: input.track,
    p_hash: hash,
    p_attempt: attempt,
    p_paths: metadata.map((f) => f.path),
  });
  if (begin.error)
    throw new HttpError(
      503,
      "The submission could not be started. Please retry.",
    );
  const state = beginSchema.parse(begin.data);
  if (state.state === "accepted")
    return reply({ id: state.id, confirmed: true });
  if (state.state === "duplicate")
    throw new HttpError(
      409,
      "You already submitted for this pathway in this intake round.",
    );
  if (state.state === "conflict")
    throw new HttpError(
      409,
      "This submission identity belongs to different answers. Restore your previous answers or contact the team.",
    );
  if (state.state === "processing")
    throw new HttpError(
      409,
      "Your submission is still being checked. Keep this page open and retry shortly.",
    );
  if (state.state === "closed")
    throw new HttpError(503, "This intake round is closed.");
  const storage = db.storage.from("astra-cvs");
  // Each lease owns a different randomized prefix, so failed attempts cannot erase
  // another attempt's files. Durable attempt rows reconcile ambiguous upload results.
  try {
    for (let i = 0; i < prepared.length; i++) {
      const file = prepared[i];
      const meta = metadata[i];
      if (!file || !meta) throw new Error("Missing file");
      const uploaded = await storage.upload(meta.path, file.buffer, {
        contentType: "application/pdf",
        cacheControl: "0",
        upsert: false,
      });
      if (uploaded.error) throw new Error("Upload failed");
    }
  } catch {
    await storage.remove(metadata.map((f) => f.path)).catch(() => {});
    throw new HttpError(
      503,
      "The CV upload could not be confirmed. Your answers are retained. Please retry shortly.",
    );
  }
  const saved = await db.rpc("astra_finalize", {
    p_id: key.data,
    p_attempt: attempt,
    p_owner: user.id,
    p_payload: input,
    p_files: metadata,
    p_days: env.APPLICATION_RETENTION_DAYS,
  });
  if (!saved.error && z.uuid().safeParse(saved.data).success) {
    return reply({ id: saved.data, confirmed: true }, 201);
  }
  // Never delete after an uncertain commit: the response may have been lost.
  const recovered = await db
    .from("astra_submission_requests")
    .select("application_id")
    .eq("id", key.data)
    .eq("owner_id", user.id)
    .eq("payload_hash", hash)
    .maybeSingle();
  const receipt = z.uuid().safeParse(recovered.data?.application_id);
  if (!recovered.error && receipt.success)
    return reply({ id: receipt.data, confirmed: true });
  throw new HttpError(
    503,
    "We could not confirm receipt yet. Keep this page open and retry with the same answers.",
  );
}
let inFlight = 0;
export const submitPathway = route(async (request) => {
  if (inFlight >= 2)
    throw new HttpError(
      503,
      "Uploads are busy. Your answers are retained; please retry shortly.",
    );
  inFlight++;
  try {
    return await processSubmission(request);
  } finally {
    inFlight--;
  }
});
