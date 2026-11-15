import { isValidElement } from "react";
import { afterEach, expect, it, vi } from "vitest";
import Apply from "@/app/apply/[track]/page";

afterEach(() => vi.unstubAllEnvs());

it.each([
  ["SUPABASE_SERVICE_ROLE_KEY", ""],
  ["APPLICATIONS_OPEN", "false"],
  ["PRIVACY_REVIEWED", "false"],
  ["APPLICATION_AUTH_CAPTCHA_ENABLED", "false"],
])(
  "keeps configuration and verification out of the local form with %s disabled",
  async (key, value) => {
    const env = {
      SITE_URL: "https://astra.example.org",
      SUPABASE_URL: "https://supabase.invalid",
      SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-credential-not-a-real-key",
      SUPABASE_PUBLISHABLE_KEY:
        "synthetic-publishable-credential-not-a-real-key",
      APPLICATION_IP_SALT: "synthetic-test-ip-salt-not-for-production",
      APPLICATION_DUPLICATE_SALT:
        "synthetic-test-duplicate-salt-not-for-production",
      APPLICATION_AUTH_CAPTCHA_ENABLED: "true",
      APPLICATIONS_OPEN: "true",
      PRIVACY_REVIEWED: "true",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    };
    for (const [name, setting] of Object.entries(env))
      vi.stubEnv(name, setting);
    vi.stubEnv(key, value);
    const page = await Apply({
      params: Promise.resolve({ track: "core" }),
      searchParams: Promise.resolve({}),
    });
    const application = page.props.children[1];
    expect(isValidElement(application)).toBe(true);
    expect(application.props).not.toHaveProperty("verificationAvailable");
    expect(JSON.stringify(application.props)).not.toContain(
      "synthetic-service-credential",
    );
  },
);
