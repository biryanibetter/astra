import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import {
  emptyPortfolioData,
  PortfolioBuilder,
} from "../src/components/portfolio-builder";

it("offers optional portfolio entries, supporting links and local PDF documents", () => {
  const markup = renderToStaticMarkup(
    createElement(PortfolioBuilder, {
      value: emptyPortfolioData,
      onChange: () => {},
    }),
  );
  expect(markup).toContain("Build your profile.");
  expect(markup).toContain('type="file"');
  expect(markup.match(/type="file"/g)).toHaveLength(1);
  for (const feature of ["Add your first project", "Add your first link"]) {
    expect(markup).toContain(feature);
  }
  expect(markup).not.toContain("YOUR WORK, YOUR WAY");
  expect(markup).not.toContain("Every field is optional");
  expect(markup).not.toContain("Nothing is uploaded or saved.");
  expect(markup).not.toContain("Add experience");
  expect(markup).not.toContain("Add achievement");
  expect(markup).not.toContain("Supporting documents");
});
