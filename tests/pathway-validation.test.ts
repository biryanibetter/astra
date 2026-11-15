import { describe, expect, it } from "vitest";
import { pathwayQuestions } from "../src/components/pathway-questions";
import {
  isPathwayStepValid,
  isResponseValid,
  type PathwayAnswers,
} from "../src/components/pathway-validation";
import { emptyPortfolioData } from "../src/components/portfolio-builder";

const questions = pathwayQuestions.core.questions;

const acceptedFile = new File(["pdf"], "cv.pdf", { type: "application/pdf" });
const minimalProject = { id: "proj", title: "Project", description: "Desc" };

function answers(overrides: Partial<PathwayAnswers> = {}): PathwayAnswers {
  return {
    fullName: "Sam Student",
    email: "sam@example.org",
    school: "Example School",
    grade: "grade-9-year-10",
    ageEligible: true,
    questionResponses: {
      "core-areas": ["Projects & programs"],
      "core-idea": "x".repeat(220),
      "core-experience": "x".repeat(220),
      "core-responsibilities": ["Plan and coordinate tasks"],
      "core-time": "3–4 hours",
      "core-skills": "x".repeat(220),
    },
    portfolio: {
      ...emptyPortfolioData,
      projects: [minimalProject],
      cv: [{ id: "cv", file: acceptedFile, error: undefined }],
    },
    ...overrides,
  };
}

describe("pathway response validation", () => {
  it("requires text answers to meet the configured minimum", () => {
    const textarea = questions[1];
    if (textarea.type !== "textarea") throw new Error("Expected a textarea");
    expect(isResponseValid(textarea, "")).toBe(false);
    expect(isResponseValid(textarea, "short")).toBe(false);
    expect(isResponseValid(textarea, "x".repeat(textarea.minimum))).toBe(true);
  });

  it("requires a selection for option questions", () => {
    expect(isResponseValid(questions[0], [])).toBe(false);
    expect(isResponseValid(questions[0], ["Projects & programs"])).toBe(true);
  });
});

describe("pathway step validation", () => {
  it("treats the introduction as always valid", () => {
    expect(isPathwayStepValid(0, answers(), questions)).toBe(true);
  });

  it("requires profile fields, age confirmation and the first question", () => {
    expect(isPathwayStepValid(1, answers(), questions)).toBe(true);
    expect(isPathwayStepValid(1, answers({ fullName: "" }), questions)).toBe(
      false,
    );
    expect(
      isPathwayStepValid(1, answers({ email: "not-an-email" }), questions),
    ).toBe(false);
    expect(isPathwayStepValid(1, answers({ grade: "" }), questions)).toBe(
      false,
    );
    expect(
      isPathwayStepValid(1, answers({ ageEligible: false }), questions),
    ).toBe(false);
    expect(
      isPathwayStepValid(
        1,
        answers({ questionResponses: { ...answers().questionResponses } }),
        questions,
      ),
    ).toBe(true);
  });

  it("requires every remaining question before leaving step two", () => {
    expect(isPathwayStepValid(2, answers(), questions)).toBe(true);
    const responses = { ...answers().questionResponses };
    delete responses["core-skills"];
    expect(
      isPathwayStepValid(
        2,
        answers({ questionResponses: responses }),
        questions,
      ),
    ).toBe(false);
  });

  it("rejects an invalid supporting link in the portfolio step", () => {
    expect(isPathwayStepValid(3, answers(), questions)).toBe(true);
    expect(
      isPathwayStepValid(
        3,
        answers({
          portfolio: {
            ...emptyPortfolioData,
            projects: [minimalProject],
            cv: [{ id: "cv", file: acceptedFile, error: undefined }],
            links: [{ id: "bad", type: "Portfolio", label: "", url: "nope" }],
          },
        }),
        questions,
      ),
    ).toBe(false);
  });

  it("rejects portfolio without a valid project", () => {
    expect(
      isPathwayStepValid(
        3,
        answers({
          portfolio: {
            ...emptyPortfolioData,
            cv: [{ id: "cv", file: acceptedFile, error: undefined }],
          },
        }),
        questions,
      ),
    ).toBe(false);
  });

  it("rejects portfolio without a valid CV", () => {
    expect(
      isPathwayStepValid(
        3,
        answers({
          portfolio: {
            ...emptyPortfolioData,
            projects: [minimalProject],
          },
        }),
        questions,
      ),
    ).toBe(false);
  });

  it("does not enable review until every earlier step is valid", () => {
    expect(isPathwayStepValid(4, answers(), questions)).toBe(true);
    expect(
      isPathwayStepValid(4, answers({ email: "not-an-email" }), questions),
    ).toBe(false);
    const responses = { ...answers().questionResponses };
    delete responses["core-idea"];
    expect(
      isPathwayStepValid(
        4,
        answers({ questionResponses: responses }),
        questions,
      ),
    ).toBe(false);
    expect(
      isPathwayStepValid(
        4,
        answers({
          portfolio: {
            ...emptyPortfolioData,
            cv: [{ id: "cv", file: acceptedFile, error: undefined }],
          },
        }),
        questions,
      ),
    ).toBe(false);
    expect(
      isPathwayStepValid(
        4,
        answers({
          portfolio: {
            ...emptyPortfolioData,
            projects: [minimalProject],
          },
        }),
        questions,
      ),
    ).toBe(false);
  });
});
