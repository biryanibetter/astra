import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { pathwayValidation } from "../src/components/pathway-validation";
import { emptyPortfolioData } from "../src/components/portfolio-builder";
import { ReviewStep } from "../src/components/review-step";

function renderReview(
  track: "core" | "fellow",
  overrides: Record<string, unknown> = {},
) {
  const answers = {
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
    commitments: {},
    ...overrides,
  };
  return renderToStaticMarkup(
    createElement(ReviewStep, {
      track,
      answers,
      portfolio: emptyPortfolioData,
      completion: pathwayValidation(track, {
        ...answers,
        portfolio: emptyPortfolioData,
      }),
      onEdit: vi.fn(),
    }),
  );
}

describe("ReviewStep", () => {
  it.each(["core", "fellow"] as const)(
    "renders the %s overview and its response labels",
    (track) => {
      const markup = renderReview(track);
      expect(markup).toContain(
        `Astra ${track === "core" ? "Core" : "Fellow"} applicant`,
      );
      // Match HTML-encoded titles in both text and aria-label attributes.
      for (const encodedTitle of [
        "Personal Profile",
        "School &amp; Education",
        "Areas of Interest",
        "Application Responses",
        "Projects",
        "Supporting Links &amp; CV",
      ]) {
        expect(markup).toContain(encodedTitle);
        expect(markup).toContain(`aria-label="Edit ${encodedTitle}"`);
      }
      expect(markup).not.toContain("Projects &amp; Experience");
      expect(markup).not.toContain("Achievements");
      expect(markup).not.toContain("Supporting Links &amp; Documents");
    },
  );

  it("formats grades, shows pathway responses and omits unanswered optional text", () => {
    const markup = renderReview("core");
    expect(markup).toContain("Grade 9 / Year 10");
    expect(markup).not.toContain("grade-9-year-10");
    expect(markup).toContain("I can help organize school workshops.");
    expect(markup).toContain("Membership Commitments");
    expect(markup).not.toContain("Do you have any existing commitments");
    expect(renderReview("fellow")).not.toContain("Membership Commitments");
  });
});
