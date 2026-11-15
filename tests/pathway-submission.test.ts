// @vitest-environment node
import { randomUUID } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { pathwayQuestions } from "@/components/pathway-questions";

const doubles = vi.hoisted(() => ({
  begin: { state: "new" } as Record<string, unknown>,
  finalError: false,
  uploadError: false,
  recovered: null as string | null,
  upload: vi.fn(),
  remove: vi.fn(),
  rpc: vi.fn(),
}));
const owner = "f861d0eb-6b2e-4c19-88ba-b33299c5362f";
const receipt = "b84aa7dc-62fc-4e3f-a258-c8b4c48c8cc2";
vi.mock("@/lib/server/pathway/auth", () => ({
  identity: async () => ({ id: owner, email: "synthetic@example.org" }),
}));
vi.mock("@/lib/server/pathway/client", async () => {
  const { createHash } = await import("node:crypto");
  return {
    config: () => ({ APPLICATION_RETENTION_DAYS: 90 }),
    rate: async () => {},
    digest: (value: string | Uint8Array) =>
      createHash("sha256").update(value).digest("hex"),
    duplicateFingerprint: (email: string) =>
      createHash("sha256").update(email).digest("hex"),
    database: () => ({
      rpc: doubles.rpc,
      storage: {
        from: () => ({ upload: doubles.upload, remove: doubles.remove }),
      },
      from: () => ({
        select: () => {
          const chain = {
            eq: () => chain,
            maybeSingle: async () => ({
              data: { application_id: doubles.recovered },
              error: null,
            }),
          };
          return chain;
        },
      }),
    }),
  };
});

import { submitPathway } from "@/lib/server/pathway/submit";

let pdf: Uint8Array<ArrayBuffer>;
beforeAll(async () => {
  const doc = await PDFDocument.create();
  doc.addPage();
  pdf = (await doc.save({
    useObjectStreams: false,
  })) as Uint8Array<ArrayBuffer>;
});
beforeEach(() => {
  vi.clearAllMocks();
  doubles.begin = { state: "new", round: randomUUID() };
  doubles.finalError = false;
  doubles.uploadError = false;
  doubles.recovered = null;
  doubles.upload.mockImplementation(async () => ({
    error: doubles.uploadError ? { message: "Synthetic failure" } : null,
  }));
  doubles.remove.mockResolvedValue({ error: null });
  doubles.rpc.mockImplementation(async (name: string) =>
    name === "astra_begin"
      ? { data: doubles.begin, error: null }
      : {
          data: doubles.finalError ? null : receipt,
          error: doubles.finalError ? { message: "Synthetic timeout" } : null,
        },
  );
});
function application(track: "core" | "fellow") {
  return {
    track,
    fullName: "Synthetic Applicant",
    email: "synthetic@example.org",
    school: "Synthetic School",
    grade: "grade-9-year-10",
    ageEligible: true,
    questionResponses: Object.fromEntries(
      pathwayQuestions[track].questions.map((q) => [
        q.id,
        q.type === "textarea"
          ? "A".repeat(q.minimum)
          : q.type === "multi-select"
            ? [q.options[0]]
            : q.options[0],
      ]),
    ),
    projects: [{ title: "Synthetic", description: "A project" }],
    links: [],
  };
}
function request(
  track: "core" | "fellow" = "core",
  bytes = pdf,
  key = randomUUID(),
) {
  const body = new FormData();
  body.set("application", JSON.stringify(application(track)));
  body.set("round", "87d74daf-05a7-4d86-8de1-9a4a2b65c54d");
  body.append(
    "cv",
    new Blob([bytes], { type: "application/pdf" }),
    "synthetic.pdf",
  );
  return new Request("http://localhost:3000/api/pathway-applications", {
    method: "POST",
    headers: { origin: "http://localhost:3000", "idempotency-key": key },
    body,
  });
}
describe("server submission orchestration with synthetic provider doubles", () => {
  for (const track of ["core", "fellow"] as const) {
    it(`confirms ${track} only after persistence`, async () => {
      const response = await submitPathway(request(track));
      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({ confirmed: true, id: receipt });
      expect(doubles.rpc.mock.calls.map((call) => call[0])).toEqual([
        "astra_begin",
        "astra_finalize",
      ]);
    });
  }
  it("rejects invalid PDF content without uploading anything", async () => {
    const response = await submitPathway(
      request("core", new TextEncoder().encode("not a PDF")),
    );
    expect(response.status).toBe(400);
    expect(doubles.upload).not.toHaveBeenCalled();
  });
  it("rejects duplicates without uploading or reporting success", async () => {
    doubles.begin = { state: "duplicate" };
    const response = await submitPathway(request());
    expect(response.status).toBe(409);
    expect(doubles.upload).not.toHaveBeenCalled();
    expect(await response.json()).not.toHaveProperty("confirmed", true);
  });
  it("cleans its own failed upload prefix and never finalizes", async () => {
    doubles.uploadError = true;
    const response = await submitPathway(request());
    expect(response.status).toBe(503);
    const path = doubles.upload.mock.calls[0]?.[0];
    expect(path).toMatch(/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.pdf$/u);
    expect(doubles.remove).toHaveBeenCalledWith([path]);
    expect(doubles.rpc.mock.calls.map((call) => call[0])).toEqual([
      "astra_begin",
    ]);
  });
  it("recovers a lost success response without deleting committed CVs", async () => {
    doubles.finalError = true;
    doubles.recovered = receipt;
    const response = await submitPathway(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toHaveProperty("confirmed", true);
    expect(doubles.remove).not.toHaveBeenCalled();
  });
  it("returns failure and retains CVs for reconciliation when commit outcome is unknown", async () => {
    doubles.finalError = true;
    const response = await submitPathway(request());
    expect(response.status).toBe(503);
    expect(await response.json()).not.toHaveProperty("confirmed", true);
    expect(doubles.remove).not.toHaveBeenCalled();
  });
  it("binds retries to the same content hash despite randomized object paths", async () => {
    const key = randomUUID();
    await submitPathway(request("core", pdf, key));
    await submitPathway(request("core", pdf, key));
    const starts = doubles.rpc.mock.calls.filter(
      (call) => call[0] === "astra_begin",
    );
    expect(starts[0]?.[1].p_hash).toBe(starts[1]?.[1].p_hash);
    expect(starts[0]?.[1].p_paths).not.toEqual(starts[1]?.[1].p_paths);
  });
});
