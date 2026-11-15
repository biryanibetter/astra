import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { createClient } from "@supabase/supabase-js";
import ky from "ky";
import { z } from "zod";
import { applicationSchema, PRIVACY_VERSION } from "@/lib/application";
import { applicationConfiguration } from "./config";

const botResponseSchema = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
  action: z.string().optional(),
});
const savedSchema = z.object({ id: z.uuid() });
const MAX_BODY = 16_384;
function reply(status: number, message: string) {
  return Response.json(
    { message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function submitApplication(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  if (
    !origin ||
    origin !== new URL(request.url).origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return reply(403, "This request is not allowed.");
  const configuration = applicationConfiguration();
  if (!configuration.success)
    return reply(
      503,
      "Live applications are unavailable. Please check back after intake opens.",
    );
  const env = configuration.data;
  if (process.env.NODE_ENV === "production" && process.env.VERCEL !== "1")
    return reply(
      503,
      "Applications require the configured trusted hosting environment.",
    );
  if (origin !== new URL(env.SITE_URL).origin)
    return reply(403, "This request is not allowed.");
  if (
    request.headers.get("content-type")?.split(";")[0]?.trim() !==
    "application/json"
  )
    return reply(415, "Send the application as JSON.");
  const declaredLength = request.headers.get("content-length");
  if (
    declaredLength &&
    (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_BODY)
  )
    return reply(413, "The application is too large.");
  if (!request.body) return reply(400, "The application is missing.");
  try {
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        length += chunk.value.byteLength;
        if (length > MAX_BODY) {
          await reader.cancel();
          return reply(413, "The application is too large.");
        }
        chunks.push(chunk.value);
      }
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    let json: unknown;
    try {
      json = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      );
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof TypeError)
        return reply(400, "The application could not be read.");
      throw error;
    }
    const parsed = applicationSchema.safeParse(json);
    if (!parsed.success)
      return reply(
        400,
        "Check the application fields and security confirmation.",
      );
    const input = parsed.data;
    const trustedAddress =
      process.env.VERCEL === "1"
        ? request.headers.get("x-vercel-forwarded-for")?.trim()
        : "local-development";
    if (
      !trustedAddress ||
      (process.env.VERCEL === "1" && isIP(trustedAddress) === 0)
    )
      return reply(503, "Applications are temporarily unavailable.");
    const fingerprint = createHmac("sha256", env.APPLICATION_IP_SALT)
      .update(trustedAddress)
      .digest("hex");
    const database = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (url, init) =>
            fetch(url, { ...init, signal: AbortSignal.timeout(10_000) }),
        },
      },
    );
    const limit = await database.rpc("consume_application_limit", {
      p_fingerprint: fingerprint,
    });
    if (limit.error || typeof limit.data !== "boolean")
      return reply(
        503,
        "Applications are temporarily unavailable. Please try later.",
      );
    if (!limit.data)
      return Response.json(
        { message: "Too many attempts. Please try again in an hour." },
        {
          status: 429,
          headers: { "Retry-After": "3600", "Cache-Control": "no-store" },
        },
      );
    const bot = botResponseSchema.safeParse(
      await ky
        .post("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          body: new URLSearchParams({
            secret: env.TURNSTILE_SECRET_KEY,
            response: input.turnstileToken,
          }),
          timeout: 10_000,
          retry: 0,
        })
        .json<unknown>(),
    );
    if (
      !bot.success ||
      !bot.data.success ||
      bot.data.hostname !== new URL(env.SITE_URL).hostname ||
      bot.data.action !== "application"
    )
      return reply(
        400,
        "The security check expired or failed. Please try again.",
      );
    const saved = await database
      .from("membership_applications")
      .insert({
        full_name: input.fullName,
        email: input.email,
        school: input.school,
        grade: input.grade,
        age_eligible: input.ageEligible,
        interests: input.interests,
        membership_interest: input.membership,
        introduction: input.introduction || null,
        privacy_version: PRIVACY_VERSION,
        privacy_acknowledged: input.privacyAcknowledged,
        expires_at: new Date(
          Date.now() + env.APPLICATION_RETENTION_DAYS * 86_400_000,
        ).toISOString(),
      })
      .select("id")
      .single();
    if (saved.error)
      return reply(
        saved.error.code === "23505" ? 409 : 503,
        "The application could not be accepted. If you have already applied, contact the team rather than submitting again.",
      );
    const result = savedSchema.safeParse(saved.data);
    if (!result.success)
      return reply(
        503,
        "We could not confirm receipt. Please contact the team before trying again.",
      );
    return Response.json(result.data, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof Error)
      return reply(
        503,
        "Applications are temporarily unavailable. Please try later.",
      );
    throw error;
  }
}
