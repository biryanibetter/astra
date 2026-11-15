import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
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
      "core-idea": "First project: a school workshop.",
      "core-experience": "Second project: a student resource site.",
      "core-responsibilities": ["Plan and coordinate tasks"],
      "core-time": "3–4 hours",
      "core-skills": "Build facilitation skills.",
      "fellow-field": "Research & academia",
      "fellow-project": "First project: a school workshop.",
      "fellow-contribution": "Second project: a student resource site.",
      "fellow-evidence": "A tested prototype.",
      "fellow-next-year": "Expand the study.",
      "fellow-contribution-to-astra": "Share findings with peers.",
    },
    ageEligible: true,
    ...overrides,
  };
  return renderToStaticMarkup(
    createElement(ReviewStep, {
      track,
      answers,
      portfolio: emptyPortfolioData,
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

  it("formats grade values and keeps project responses distinct", () => {
    const markup = renderReview("core");
    expect(markup).toContain("Grade 9 / Year 10");
    expect(markup).not.toContain("grade-9-year-10");
    expect(markup).toContain("First project: a school workshop.");
    expect(markup).toContain("Second project: a student resource site.");
    expect(markup.split("First project: a school workshop.")).toHaveLength(2);
    expect(
      markup.split("Second project: a student resource site."),
    ).toHaveLength(2);
  });
});
