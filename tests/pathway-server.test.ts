import { describe, expect, it } from "vitest";
import { pathwayQuestions } from "@/components/pathway-questions";
import { csvCell } from "@/lib/pathway/csv";
import { pathwaySubmissionSchema } from "@/lib/pathway/schema";

function input(track: "core" | "fellow" = "core") {
  return {
    track,
    fullName: "Synthetic Applicant",
    email: " Synthetic@Example.org ",
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
    projects: [{ title: "Example", description: "Synthetic project" }],
    links: [{ type: "Portfolio", label: "", url: "https://example.org/" }],
  };
}

describe("server pathway validation", () => {
  for (const track of ["core", "fellow"] as const) {
    it(`accepts ${track} and normalizes email`, () => {
      expect(pathwaySubmissionSchema.parse(input(track)).email).toBe(
        "synthetic@example.org",
      );
    });
    it(`enforces every ${track} character boundary`, () => {
      for (const q of pathwayQuestions[track].questions) {
        if (q.type !== "textarea") continue;
        for (const length of [q.minimum - 1, q.maximum + 1]) {
          const value = input(track);
          value.questionResponses[q.id] = "A".repeat(length);
          expect(pathwaySubmissionSchema.safeParse(value).success).toBe(false);
        }
      }
    });
  }
  it("rejects unknown questions, invalid choices and duplicate choices", () => {
    for (const response of [
      { ...input().questionResponses, unexpected: "data" },
      { ...input().questionResponses, "core-areas": ["not-an-option"] },
      {
        ...input().questionResponses,
        "core-areas": ["School network", "School network"],
      },
    ]) {
      expect(
        pathwaySubmissionSchema.safeParse({
          ...input(),
          questionResponses: response,
        }).success,
      ).toBe(false);
    }
  });
  it("enforces one-to-five projects and five links", () => {
    expect(
      pathwaySubmissionSchema.safeParse({ ...input(), projects: [] }).success,
    ).toBe(false);
    expect(
      pathwaySubmissionSchema.safeParse({
        ...input(),
        projects: Array(6).fill(input().projects[0]),
      }).success,
    ).toBe(false);
    expect(
      pathwaySubmissionSchema.safeParse({
        ...input(),
        links: Array(6).fill(input().links[0]),
      }).success,
    ).toBe(false);
  });
  it("rejects blank projects and credential-bearing or executable URLs", () => {
    expect(
      pathwaySubmissionSchema.safeParse({
        ...input(),
        projects: [{ title: " ", description: "" }],
      }).success,
    ).toBe(false);
    for (const url of [
      "javascript:alert(1)",
      "https://user:pass@example.org",
    ]) {
      expect(
        pathwaySubmissionSchema.safeParse({
          ...input(),
          links: [{ ...input().links[0], url }],
        }).success,
      ).toBe(false);
    }
  });
  it("treats injection text as data rather than removing or executing it", () => {
    const value = input();
    value.fullName = "<script>alert(1)</script>'; DROP TABLE applicants;--";
    expect(pathwaySubmissionSchema.parse(value).fullName).toBe(value.fullName);
  });
});

describe("CSV safety", () => {
  it("quotes delimiters and neutralizes spreadsheet formulas after whitespace", () => {
    expect(csvCell('hello,"world"')).toBe('"hello,""world"""');
    for (const value of [
      "=CMD()",
      " +1",
      "\t@SUM(1)",
      "-1",
      "\r=HYPERLINK()",
    ]) {
      expect(csvCell(value).startsWith(`"'`)).toBe(true);
    }
    expect(csvCell("Synthetic Applicant")).toBe('"Synthetic Applicant"');
  });
});
