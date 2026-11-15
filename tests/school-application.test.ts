import { describe, expect, it } from "vitest";
import { applicationSchema } from "@/lib/application";
import {
  type SchoolApplicationInput,
  schoolApplicationFieldsSchema,
  toMembershipApplication,
} from "@/lib/school-application";
import { getSchool } from "@/lib/schools";

const input: SchoolApplicationInput = {
  intent: "interest",
  fullName: "Alex Example",
  email: "alex@example.com",
  grade: "11",
  ageEligible: true,
  interests: ["Technology"],
  experience: "",
  motivation: "",
  privacyAcknowledged: true,
  website: "",
};
describe("private school application adapter", () => {
  it("accepts interest without collecting unnecessary narrative", () => {
    expect(schoolApplicationFieldsSchema.safeParse(input).success).toBe(true);
  });
  it("requires founding experience and motivation", () => {
    const result = schoolApplicationFieldsSchema.safeParse({
      ...input,
      intent: "founding",
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["experience", "motivation"]),
      );
  });
  it.each([
    { fullName: "A" },
    { email: "invalid" },
    { grade: "" },
    { ageEligible: false },
    { privacyAcknowledged: false },
    { website: "spam" },
    { interests: [] },
    { interests: ["Technology", "Technology"] },
    { experience: "x".repeat(351) },
    { motivation: "x".repeat(351) },
  ])("rejects invalid or over-collected data %j", (override) => {
    expect(
      schoolApplicationFieldsSchema.safeParse({ ...input, ...override })
        .success,
    ).toBe(false);
  });
  it.each(["interest", "founding"] as const)(
    "maps %s to the existing secure intake contract",
    (intent) => {
      const school = getSchool("birla-public-school");
      expect(school).toBeDefined();
      if (!school) return;
      const result = toMembershipApplication(
        {
          ...input,
          intent,
          experience: "I organized a student project.",
          motivation: "I want to connect curious students at my school.",
        },
        school,
        "synthetic-token",
      );
      expect(applicationSchema.safeParse(result).success).toBe(true);
      expect(result.school).toBe("Birla Public School");
      expect(result.membership).toBe(
        intent === "founding" ? "School Representative" : "ASTRA Network",
      );
      expect(result.introduction).toContain(`Intent: ${intent}`);
      expect(result.introduction).toContain("birla-public-school");
      expect(result.introduction.length).toBeLessThanOrEqual(1000);
    },
  );
});
