import { describe, expect, it } from "vitest";
import { isManagedAuthCandidate } from "@/lib/pathway/auth-retention-policy";

describe("verification-account retention policy", () => {
  const cutoff = Date.parse("2026-10-01T00:00:00Z");
  const abandoned = {
    id: "synthetic",
    email: "synthetic@example.org",
    created_at: "2026-01-01T00:00:00Z",
    app_metadata: { astra_intake_managed: true },
  };
  it("includes old abandoned and unverified intake-created accounts", () => {
    expect(isManagedAuthCandidate(abandoned, cutoff)).toBe(true);
  });
  it("never selects untagged/shared accounts or recently signed-in applicants", () => {
    expect(
      isManagedAuthCandidate({ ...abandoned, app_metadata: {} }, cutoff),
    ).toBe(false);
    expect(
      isManagedAuthCandidate(
        {
          ...abandoned,
          app_metadata: {
            astra_intake_managed: true,
            astra_shared_account: true,
          },
        },
        cutoff,
      ),
    ).toBe(false);
    expect(
      isManagedAuthCandidate(
        { ...abandoned, last_sign_in_at: "2026-11-01T00:00:00Z" },
        cutoff,
      ),
    ).toBe(false);
  });
});
