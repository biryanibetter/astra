import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  type PathwayAnswers,
  pathwayValidation,
} from "../src/components/pathway-validation";
import { emptyPortfolioData } from "../src/components/portfolio-builder";
import { ReviewStep } from "../src/components/review-step";

function renderReview(
  track: "core" | "fellow",
  overrides: Partial<PathwayAnswers> = {},
  completionOverride?: { completed: number; total: number; percentage: number },
) {
  const answers: PathwayAnswers = {
    fullName: "Sam Student",
    email: "sam@example.org",
    school: "Example School",
    grade: "grade-9-year-10",
    questionResponses: {
      "core-areas": ["Technology & AI", "Projects & programs"],
      "core-motivation": "I can help organize school workshops.",
      "core-availability": ["Friday", "Saturday"],
      "core-time": "3–4 hours",
      "core-in-person": "Yes",
      "fellow-field": "Research & academia",
      "fellow-motivation": "Explore clean energy.",
      "fellow-ambitions": "Learn how to design a study.",
      "fellow-activities": ["Research & innovation exhibitions"],
      "fellow-collaboration": "Depending on the project or opportunity.",
      "fellow-opportunities": ["Finding collaborators"],
    },
    ageEligible: true,
    commitments: {
      availability: true,
      conduct: true,
      meetings: true,
      review: true,
      tasks: true,
      updates: true,
    },
    portfolio: {
      ...emptyPortfolioData,
      projects: [
        { id: "1", title: "Test Project", description: "A test project" },
      ],
      links: [
        {
          id: "1",
          type: "github",
          label: "GitHub",
          url: "https://github.com/test",
        },
      ],
      cv: [
        {
          id: "1",
          file: new File(["test"], "cv.pdf", { type: "application/pdf" }),
          error: undefined,
        },
      ],
    },
    ...overrides,
  };

  const baseValidation = pathwayValidation(track, answers);
  const completion = completionOverride || baseValidation;

  return renderToStaticMarkup(
    createElement(ReviewStep, {
      track,
      answers,
      portfolio: answers.portfolio,
      completion,
      onEdit: vi.fn(),
    }),
  );
}

describe("ReviewStep - complete state", () => {
  it("renders overviewComplete class when Core application is 100% complete", () => {
    const markup = renderReview(
      "core",
      {},
      { completed: 17, total: 17, percentage: 100 },
    );
    // CSS modules hash class names, check for the overviewComplete suffix
    expect(markup).toContain("overviewComplete");
  });

  it("renders overviewComplete class when Fellow application is 100% complete", () => {
    const markup = renderReview(
      "fellow",
      {},
      { completed: 11, total: 11, percentage: 100 },
    );
    expect(markup).toContain("overviewComplete");
  });

  it("includes ShinyPerimeter when complete", () => {
    const markup = renderReview(
      "core",
      {},
      { completed: 17, total: 17, percentage: 100 },
    );
    expect(markup).toContain("shiny-button-border");
  });

  it("does NOT include ShinyPerimeter when incomplete", () => {
    const markup = renderReview(
      "core",
      {},
      { completed: 9, total: 17, percentage: 52 },
    );
    expect(markup).not.toContain("shiny-button-border");
  });
});
