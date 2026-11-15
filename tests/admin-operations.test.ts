// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

// Only provider I/O and Next's cookie accessor are doubled. Authorization,
// query validation, review orchestration and response headers remain real.
const fixture = vi.hoisted(() => ({
  token: "synthetic-session" as string | undefined,
  role: "reviewer" as string | null,
  deleting: false,
  missingFile: false,
  auditError: false,
  calls: [] as { table: string; method: string; args: unknown[] }[],
  signed: vi.fn(),
  rpc: vi.fn(),
}));
const actor = "f861d0eb-6b2e-4c19-88ba-b33299c5362f";
const id = "b84aa7dc-62fc-4e3f-a258-c8b4c48c8cc2";
const fileId = "d2a26f11-4595-4a04-8b51-e2d148d2ba28";
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (fixture.token ? { value: fixture.token } : undefined),
  }),
}));
vi.mock("@/lib/server/pathway/client", () => ({
  authClient: () => ({
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: "f861d0eb-6b2e-4c19-88ba-b33299c5362f",
            email: "reviewer@example.org",
            email_confirmed_at: "2026-11-15T00:00:00Z",
          },
        },
        error: null,
      }),
    },
  }),
  database: () => ({
    from: (table: string) => {
      const record = (method: string, args: unknown[]) =>
        fixture.calls.push({ table, method, args });
      const singleResult = () => ({
        data:
          table === "astra_admin_roles"
            ? fixture.role && { role: fixture.role }
            : table === "astra_cv_files"
              ? fixture.missingFile
                ? null
                : { object_path: "synthetic-prefix/cv.pdf" }
              : { id, status: fixture.deleting ? "deleting" : "pending" },
        error: null,
      });
      const chain = {
        select: (...args: unknown[]) => {
          record("select", args);
          return chain;
        },
        eq: (...args: unknown[]) => {
          record("eq", args);
          return chain;
        },
        ilike: (...args: unknown[]) => {
          record("ilike", args);
          return chain;
        },
        order: (...args: unknown[]) => {
          record("order", args);
          return chain;
        },
        maybeSingle: async () => singleResult(),
        range: async (...args: unknown[]) => {
          record("range", args);
          return {
            data: [{ id, track: "core", status: "pending" }],
            count: 26,
            error: null,
          };
        },
        insert: async (...args: unknown[]) => {
          record("insert", args);
          return { error: fixture.auditError ? { message: "outage" } : null };
        },
      };
      return chain;
    },
    rpc: fixture.rpc,
    storage: { from: () => ({ createSignedUrl: fixture.signed }) },
  }),
}));

import { adminApplications } from "@/lib/server/pathway/admin";

beforeEach(() => {
  vi.clearAllMocks();
  fixture.token = "synthetic-session";
  fixture.role = "reviewer";
  fixture.deleting = false;
  fixture.missingFile = false;
  fixture.auditError = false;
  fixture.calls = [];
  fixture.signed.mockResolvedValue({
    data: { signedUrl: "https://storage.example.org/synthetic-download" },
    error: null,
  });
  fixture.rpc.mockResolvedValue({ error: null });
});
function request(method: string, query = "", body?: unknown) {
  return new Request(`http://localhost:3000/api/admin/applications${query}`, {
    method,
    headers: {
      origin: "http://localhost:3000",
      "content-type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
describe("review API with synthetic provider fixtures", () => {
  it("rejects an authenticated account without a current reviewer role", async () => {
    fixture.role = null;
    const response = await adminApplications(request("GET"));
    expect(response.status).toBe(403);
    expect(
      fixture.calls.some((call) => call.table === "astra_applications"),
    ).toBe(false);
  });
  it("emits bounded and escaped name/pathway/status/sort/page filters", async () => {
    const response = await adminApplications(
      request(
        "GET",
        "?q=Test%25_Name&track=core&status=pending&sort=status&direction=asc&page=2",
      ),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store, private");
    expect(await response.json()).toMatchObject({
      count: 26,
      page: 2,
      pageSize: 25,
    });
    const calls = fixture.calls.filter((c) => c.table === "astra_applications");
    expect(calls).toContainEqual({
      table: "astra_applications",
      method: "ilike",
      args: ["astra_profiles.full_name", "%Test\\%\\_Name%"],
    });
    for (const args of [
      ["track", "core"],
      ["status", "pending"],
    ])
      expect(calls).toContainEqual({
        table: "astra_applications",
        method: "eq",
        args,
      });
    expect(calls).toContainEqual({
      table: "astra_applications",
      method: "order",
      args: ["status", { ascending: true }],
    });
    expect(calls).toContainEqual({
      table: "astra_applications",
      method: "range",
      args: [25, 49],
    });
  });
  it("saves review status and notes only with the verified actor", async () => {
    const response = await adminApplications(
      request("PATCH", "", {
        id,
        status: "under_review",
        note: "Synthetic review",
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ saved: true });
    expect(fixture.rpc).toHaveBeenCalledWith("astra_review", {
      p_actor: actor,
      p_id: id,
      p_status: "under_review",
      p_note: "Synthetic review",
    });
  });
  it("rejects invalid filters and reviewer exports/deletions", async () => {
    for (const query of ["?page=0", "?sort=email", "?track=unknown"])
      expect((await adminApplications(request("GET", query))).status).toBe(400);
    expect(
      (await adminApplications(request("GET", "?export=csv"))).status,
    ).toBe(403);
    expect(
      (await adminApplications(request("DELETE", `?id=${id}`))).status,
    ).toBe(403);
    expect(fixture.rpc).not.toHaveBeenCalled();
  });
  it("authorizes and audits private CV access before issuing a 60-second download", async () => {
    const response = await adminApplications(
      request("POST", "", { id, fileId }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: "https://storage.example.org/synthetic-download",
      expiresIn: 60,
    });
    expect(fixture.signed).toHaveBeenCalledWith("synthetic-prefix/cv.pdf", 60, {
      download: "astra-cv.pdf",
    });
    expect(fixture.calls).toContainEqual({
      table: "astra_cv_files",
      method: "eq",
      args: ["application_id", id],
    });
    expect(fixture.calls).toContainEqual({
      table: "astra_cv_files",
      method: "eq",
      args: ["id", fileId],
    });
  });
  it("does not issue a CV link for anonymous, revoked, missing or deleting records", async () => {
    fixture.token = undefined;
    expect(
      (await adminApplications(request("POST", "", { id, fileId }))).status,
    ).toBe(401);
    fixture.token = "synthetic-session";
    fixture.role = null;
    expect(
      (await adminApplications(request("POST", "", { id, fileId }))).status,
    ).toBe(403);
    fixture.role = "reviewer";
    fixture.missingFile = true;
    expect(
      (await adminApplications(request("POST", "", { id, fileId }))).status,
    ).toBe(404);
    fixture.missingFile = false;
    fixture.deleting = true;
    expect(
      (await adminApplications(request("POST", "", { id, fileId }))).status,
    ).toBe(404);
    expect(fixture.signed).not.toHaveBeenCalled();
  });
  it("fails closed if CV access cannot be audited", async () => {
    fixture.auditError = true;
    expect(
      (await adminApplications(request("POST", "", { id, fileId }))).status,
    ).toBe(503);
    expect(fixture.signed).not.toHaveBeenCalled();
  });
});
