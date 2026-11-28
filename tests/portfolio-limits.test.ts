import { describe, expect, it } from "vitest";
import {
  canAddLink,
  canAddProject,
  emptyPortfolioData,
  isPortfolioValid,
  MAX_LINKS,
  MAX_PROJECTS,
  normalizeLinkUrl,
  validateLinkUrl,
  validateProjectDraft,
} from "../src/components/portfolio-builder";

describe("portfolio limits", () => {
  it("caps projects and links at five", () => {
    expect(MAX_PROJECTS).toBe(5);
    expect(MAX_LINKS).toBe(5);
  });

  it("allows adding below the limit and blocks at the limit", () => {
    for (let count = 0; count < MAX_PROJECTS; count += 1) {
      expect(canAddProject(count)).toBe(true);
    }
    for (let count = 0; count < MAX_LINKS; count += 1) {
      expect(canAddLink(count)).toBe(true);
    }
    expect(canAddProject(MAX_PROJECTS)).toBe(false);
    expect(canAddLink(MAX_LINKS)).toBe(false);
  });

  it("blocks adding while an entry is still being edited", () => {
    expect(canAddProject(0, true)).toBe(false);
    expect(canAddLink(0, true)).toBe(false);
  });

  it("re-enables adding after a removal drops the count below the limit", () => {
    expect(canAddProject(MAX_PROJECTS)).toBe(false);
    expect(canAddProject(MAX_PROJECTS - 1)).toBe(true);
    expect(canAddLink(MAX_LINKS)).toBe(false);
    expect(canAddLink(MAX_LINKS - 1)).toBe(true);
  });
});

describe("supporting link validation", () => {
  it.each([
    "https://github.com/example",
    "http://example.org/portfolio",
    "  https://example.org/portfolio  ",
  ])("accepts %s", (url) => {
    expect(validateLinkUrl(url)).toBeUndefined();
  });

  it.each([
    "",
    "   ",
    "example.org",
    "www.example.org",
    "javascript:alert(1)",
    "ftp://example.org/file",
  ])("rejects %s and explains why", (url) => {
    expect(validateLinkUrl(url)).toBeTruthy();
  });

  it("trims surrounding whitespace without changing the URL body", () => {
    expect(normalizeLinkUrl("  https://example.org/a?b=1  ")).toBe(
      "https://example.org/a?b=1",
    );
  });

  it("ignores empty entries and rejects unsafe links", () => {
    expect(
      isPortfolioValid({
        ...emptyPortfolioData,
        links: [{ id: "one", type: "Portfolio", label: "", url: "" }],
      }),
    ).toBe(true);
    expect(
      isPortfolioValid({
        ...emptyPortfolioData,
        links: [
          {
            id: "two",
            type: "Portfolio",
            label: "",
            url: "javascript:alert(1)",
          },
        ],
      }),
    ).toBe(false);
  });

  it("accepts an empty portfolio with or without a valid link", () => {
    expect(isPortfolioValid(emptyPortfolioData)).toBe(true);
    expect(
      isPortfolioValid({
        ...emptyPortfolioData,
        links: [
          {
            id: "three",
            type: "Portfolio",
            label: "Code",
            url: "https://github.com/example",
          },
        ],
      }),
    ).toBe(true);
  });
});

describe("project draft validation", () => {
  it("refuses to save a completely empty project", () => {
    expect(validateProjectDraft({ title: "", description: "" })).toBeTruthy();
    expect(
      validateProjectDraft({ title: "   ", description: "  " }),
    ).toBeTruthy();
  });

  it("allows a title-only or description-only project", () => {
    expect(
      validateProjectDraft({ title: "Community garden", description: "" }),
    ).toBeUndefined();
    expect(
      validateProjectDraft({ title: "", description: "Built a sensor" }),
    ).toBeUndefined();
  });

  it("rejects overlong project content", () => {
    expect(
      validateProjectDraft({ title: "x".repeat(121), description: "" }),
    ).toBeTruthy();
    expect(
      validateProjectDraft({ title: "Title", description: "x".repeat(601) }),
    ).toBeTruthy();
  });
});
