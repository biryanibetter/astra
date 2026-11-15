import { describe, expect, it } from "vitest";
import { applicationSchema } from "@/lib/application";

const validApplication = {
  fullName: "Synthetic Applicant",
  email: "synthetic@example.com",
  school: "Test School",
  grade: "Year 10",
  ageEligible: true,
  interests: ["Technology", "Design"],
  membership: "ASTRA Network",
  introduction: "",
  privacyAcknowledged: true,
  website: "",
  turnstileToken: "synthetic-token",
};
describe("application boundary", () => {
  it("normalizes applicant email when a valid application is parsed", () => {
    const result = applicationSchema.parse({
      ...validApplication,
      email: "Synthetic@Example.com",
    });
    expect(result.email).toBe("synthetic@example.com");
  });
  it.each([
    { ageEligible: false },
    { privacyAcknowledged: false },
    { interests: [] },
    { interests: ["Technology", "Technology"] },
    { interests: ["Unknown"] },
    { review_status: "accepted" },
    { website: "spam" },
    { introduction: "x".repeat(1001) },
    { turnstileToken: "" },
    { email: "broken" },
  ])("rejects invalid or unauthorized application fields %j", (patch) => {
    const result = applicationSchema.safeParse({
      ...validApplication,
      ...patch,
    });
    expect(result.success).toBe(false);
  });
});
