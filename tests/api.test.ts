import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitApplication } from "@/lib/server/submit";

const application = {
  fullName: "Synthetic Applicant",
  email: "synthetic@example.com",
  school: "Test School",
  grade: "Year 10",
  ageEligible: true,
  interests: ["Technology"],
  membership: "ASTRA Network",
  introduction: "",
  privacyAcknowledged: true,
  website: "",
  turnstileToken: "synthetic-token",
};
const acceptedId = "01234567-89ab-4cde-8fab-0123456789ab";
function request(body: unknown = application) {
  return new Request("http://localhost:3000/api/applications", {
    method: "POST",
    headers: {
      Origin: "http://localhost:3000",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
function configure() {
  vi.stubEnv("APPLICATIONS_OPEN", "true");
  vi.stubEnv("PRIVACY_REVIEWED", "true");
  vi.stubEnv("SITE_URL", "http://localhost:3000");
  vi.stubEnv("CONTACT_EMAIL", "test@example.com");
  vi.stubEnv("SUPABASE_URL", "https://synthetic.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "synthetic-service-role-key-only");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "synthetic-turnstile-secret");
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "synthetic-site-key");
  vi.stubEnv(
    "APPLICATION_IP_SALT",
    "synthetic-private-salt-at-least-32-characters",
  );
  vi.stubEnv("VERCEL", "");
}
describe("application HTTP boundary", () => {
  beforeEach(() => {
    configure();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  it("fails closed when live intake is not approved", async () => {
    vi.stubEnv("PRIVACY_REVIEWED", "false");
    const response = await submitApplication(request());
    expect(response.status).toBe(503);
  });
  it("rejects cross-origin submissions before service access", async () => {
    const incoming = new Request("http://localhost:3000/api/applications", {
      method: "POST",
      headers: { Origin: "https://other.example" },
    });
    const response = await submitApplication(incoming);
    expect(response.status).toBe(403);
  });
  it("rejects bodies exceeding the real streamed size limit", async () => {
    const response = await submitApplication(
      request({ introduction: "x".repeat(20_000) }),
    );
    expect(response.status).toBe(413);
  });
  it("rejects malformed JSON without exposing parser errors", async () => {
    const incoming = new Request("http://localhost:3000/api/applications", {
      method: "POST",
      headers: {
        Origin: "http://localhost:3000",
        "Content-Type": "application/json",
      },
      body: "{",
    });
    const response = await submitApplication(incoming);
    expect(response.status).toBe(400);
  });
  it("returns success only after a downstream insert is acknowledged", async () => {
    const writes: unknown[] = [];
    vi.stubGlobal(
      "fetch",
      async (input: string | URL | Request, init?: RequestInit) => {
        const url = input instanceof Request ? input.url : String(input);
        if (url.includes("consume_application_limit"))
          return Response.json(true);
        if (url.includes("siteverify"))
          return Response.json({
            success: true,
            hostname: "localhost",
            action: "application",
          });
        writes.push(init?.body);
        return Response.json({ id: acceptedId }, { status: 201 });
      },
    );
    const response = await submitApplication(request());
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: acceptedId });
    expect(writes).toHaveLength(1);
  });
  it("never returns success when persistence fails", async () => {
    vi.stubGlobal("fetch", async (input: string | URL | Request) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.includes("consume_application_limit")) return Response.json(true);
      if (url.includes("siteverify"))
        return Response.json({
          success: true,
          hostname: "localhost",
          action: "application",
        });
      return Response.json(
        { code: "23505", message: "internal database details" },
        { status: 409 },
      );
    });
    const response = await submitApplication(request());
    expect(response.status).toBe(409);
    expect(await response.text()).not.toContain("internal database details");
  });
  it("rejects an exhausted shared rate limit before bot verification", async () => {
    vi.stubGlobal("fetch", async () => Response.json(false));
    const response = await submitApplication(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("3600");
  });
  it("rejects a token issued for a different hostname", async () => {
    vi.stubGlobal("fetch", async (input: string | URL | Request) => {
      const url = input instanceof Request ? input.url : String(input);
      return url.includes("consume_application_limit")
        ? Response.json(true)
        : Response.json({
            success: true,
            hostname: "attacker.example",
            action: "application",
          });
    });
    const response = await submitApplication(request());
    expect(response.status).toBe(400);
  });
  it("rejects a valid token used for another action", async () => {
    vi.stubGlobal("fetch", async (input: string | URL | Request) => {
      const url = input instanceof Request ? input.url : String(input);
      return url.includes("consume_application_limit")
        ? Response.json(true)
        : Response.json({
            success: true,
            hostname: "localhost",
            action: "login",
          });
    });
    const response = await submitApplication(request());
    expect(response.status).toBe(400);
  });
  it("fails closed when the rate-limit store is unreachable", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("Synthetic network outage");
    });
    const response = await submitApplication(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("Synthetic network outage");
  });
});
