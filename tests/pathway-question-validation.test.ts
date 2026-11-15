import { describe, expect, it } from "vitest";
import {
  countCharacters,
  validateCharacterCount,
} from "../src/components/pathway-question-validation";
import {
  getGradeLabel,
  pathwayQuestions,
} from "../src/components/pathway-questions";

describe("applicant grade labels", () => {
  it.each([
    ["grade-6-year-7", "Grade 6 / Year 7"],
    ["grade-7-year-8", "Grade 7 / Year 8"],
    ["grade-8-year-9", "Grade 8 / Year 9"],
    ["grade-9-year-10", "Grade 9 / Year 10"],
    ["grade-10-year-11", "Grade 10 / Year 11"],
    ["grade-11-year-12", "Grade 11 / Year 12"],
    ["grade-12-year-13", "Grade 12 / Year 13"],
  ])("maps %s to its human-readable label", (value, label) => {
    expect(getGradeLabel(value)).toBe(label);
  });

  it("does not invent a label for unsupported grades", () => {
    expect(getGradeLabel("grade-13-year-14")).toBe("");
  });
});

describe("pathway question character validation", () => {
  it("counts every typed character, including spaces and line breaks", () => {
    expect(countCharacters("abc def\ng")).toBe(9);
    expect(countCharacters("abcdef")).toBe(6);
    expect(countCharacters("abc ")).toBe(4);
    expect(countCharacters("🌟")).toBe(1);
  });

  it.each([
    ["below minimum", "ab", 3, 5, false],
    ["at minimum", "abc", 3, 5, true],
    ["inside range", "abcd", 3, 5, true],
    ["at maximum", "abcde", 3, 5, true],
    ["above maximum", "abcdef", 3, 5, false],
  ])("validates %s", (_label, answer, min, max, expected) => {
    expect(validateCharacterCount(answer, min, max).valid).toBe(expected);
  });

  it("requires a non-empty selection", () => {
    expect(validateCharacterCount("", 1, 5).message).toBe(
      "This answer is required.",
    );
  });

  it("rejects whitespace-only answers and reports character limits", () => {
    expect(validateCharacterCount("   ", 1, 5).message).toBe(
      "This answer is required.",
    );
    expect(validateCharacterCount("ab", 3, 5).message).toContain(
      "3 characters",
    );
    expect(validateCharacterCount("abcdef", 3, 5).message).toContain(
      "5 characters",
    );
  });

  it.each(["core", "fellow"] as const)(
    "defines six purposeful %s questions",
    (pathway) => {
      expect(pathwayQuestions[pathway].questions).toHaveLength(6);
      expect(
        pathwayQuestions[pathway].questions.filter(
          (question) => question.type === "textarea",
        ),
      ).toHaveLength(pathway === "core" ? 3 : 5);
    },
  );

  for (const pathway of ["core", "fellow"] as const) {
    for (const question of pathwayQuestions[pathway].questions) {
      if (question.type !== "textarea") continue;
      it(`${pathway} ${question.id} accepts exactly ${question.minimum} and ${question.maximum} characters`, () => {
        const atMinimum = "a".repeat(question.minimum);
        const atMaximum = "a".repeat(question.maximum);
        expect(
          validateCharacterCount(atMinimum, question.minimum, question.maximum)
            .valid,
        ).toBe(true);
        expect(
          validateCharacterCount(atMaximum, question.minimum, question.maximum)
            .valid,
        ).toBe(true);
      });
      it(`${pathway} ${question.id} rejects immediately outside both character-count boundaries`, () => {
        const belowMinimum = "a".repeat(question.minimum - 1);
        const aboveMaximum = "a".repeat(question.maximum + 1);
        expect(
          validateCharacterCount(
            belowMinimum,
            question.minimum,
            question.maximum,
          ).valid,
        ).toBe(false);
        expect(
          validateCharacterCount(
            aboveMaximum,
            question.minimum,
            question.maximum,
          ).valid,
        ).toBe(false);
      });
    }
  }
});
