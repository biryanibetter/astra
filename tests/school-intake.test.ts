import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toMembershipApplication } from "@/lib/school-application";
import { getSchool } from "@/lib/schools";
import { submitApplication } from "@/lib/server/submit";

describe("school applications through the existing private intake", () => {
  beforeEach(() => {
    for (const [key, value] of Object.entries({
      APPLICATIONS_OPEN: "true",
      PRIVACY_REVIEWED: "true",
      SITE_URL: "http://localhost:3000",
      CONTACT_EMAIL: "synthetic@example.com",
      SUPABASE_URL: "https://synthetic.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-role-key-only",
      TURNSTILE_SECRET_KEY: "synthetic-turnstile-secret",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "synthetic-site-key",
      APPLICATION_IP_SALT: "synthetic-private-salt-at-least-32-characters",
      VERCEL: "",
    }))
      vi.stubEnv(key, value);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it.each(["interest", "founding"] as const)(
    "stores %s intent privately only after acknowledged persistence",
    async (intent) => {
      const school = getSchool("birla-public-school");
      if (!school) throw new Error("Missing seed school");
      const application = toMembershipApplication(
        {
          intent,
          fullName: "Synthetic Applicant",
          email: "synthetic@example.com",
          grade: "11",
          ageEligible: true,
          interests: ["Technology"],
          experience: "I organized a student science project.",
          motivation: "I would like to help curious students work together.",
          privacyAcknowledged: true,
          website: "",
        },
        school,
        "synthetic-turnstile-token",
      );
      const writes: Record<string, unknown>[] = [];
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
          expect(url).toContain("membership_applications");
          writes.push(JSON.parse(String(init?.body)));
          return Response.json(
            { id: "01234567-89ab-4cde-8fab-0123456789ab" },
            { status: 201 },
          );
        },
      );
      const response = await submitApplication(
        new Request("http://localhost:3000/api/applications", {
          method: "POST",
          headers: {
            Origin: "http://localhost:3000",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(application),
        }),
      );
      expect(response.status).toBe(201);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(await response.json()).toEqual({
        id: "01234567-89ab-4cde-8fab-0123456789ab",
      });
      expect(writes).toHaveLength(1);
      expect(writes[0]?.school).toBe("Birla Public School");
      expect(writes[0]?.introduction).toContain(`Intent: ${intent}`);
      expect(writes[0]?.membership_interest).toBe(
        intent === "founding" ? "School Representative" : "ASTRA Network",
      );
    },
  );
});
