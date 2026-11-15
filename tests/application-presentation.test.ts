import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ApplicationIntroduction } from "@/components/application-presentation/application-introduction";
import { ApplicationProgress } from "@/components/application-presentation/application-progress";
import { ApplicationShell } from "@/components/application-presentation/application-shell";

describe("application presentation components", () => {
  it.each([
    ["core", "Your role in Astra"],
    ["fellow", "Your project at Astra"],
  ] as const)(
    "renders the %s introduction heading in SSR",
    (track, headline) => {
      const html = renderToStaticMarkup(
        createElement(ApplicationIntroduction, {
          track,
          onStart: () => undefined,
        }),
      );

      expect(html).toContain(headline.replace("'", "'"));
      // During SSR, the start button is not rendered (mounts client-side)
      expect(html.match(/aria-label="(?:Previous|Next) slide"/g)).toHaveLength(
        2,
      );
      expect(html).not.toContain("Show slide");
    },
  );

  it("centers the application title and provides a navigation slot", () => {
    const html = renderToStaticMarkup(
      createElement(
        ApplicationShell,
        {
          title: "Astra Core",
          backHref: "/#schools-heading",
          navigationControls: createElement(
            "button",
            { type: "button" },
            "Menu",
          ),
        },
        createElement("div", null, "Application content"),
      ),
    );

    expect(html).toContain("Astra Core");
    expect(html).toContain('aria-label="Back"');
    expect(html).toContain("Menu");
    expect(html).toContain("Application content");
  });

  it("renders five equally labeled progress stages", () => {
    const html = renderToStaticMarkup(
      createElement(ApplicationProgress, {
        currentStep: 2,
        steps: ["About you", "Interests", "Experience", "Portfolio", "Review"],
      }),
    );

    expect(html.match(/<li class="[^"]*progressStep/g)).toHaveLength(5);
    expect(html).toContain('aria-valuenow="3"');
    expect(html).toContain("Interests");
    expect(html).toContain("Review");
  });

  it("also renders the six-stage application timeline", () => {
    const steps = [
      "Introduction",
      "Personal Information",
      "Interests & Background",
      "Contribution & Ambitions",
      "Portfolio & CV",
      "Review",
    ];
    const html = renderToStaticMarkup(
      createElement(ApplicationProgress, { currentStep: 5, steps }),
    );

    expect(html.match(/<li class="[^"]*progressStep/g)).toHaveLength(6);
    // Assert the rendered text, rather than an unescaped HTML serialization.
    const document = new DOMParser().parseFromString(html, "text/html");
    expect(document.body.textContent).toContain("Portfolio & CV");
  });
});
