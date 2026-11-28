import { describe, expect, it } from "vitest";
import {
  emptyPortfolioData,
  isPortfolioValid,
  type PortfolioData,
} from "../src/components/portfolio-builder";

const data = (overrides: Partial<PortfolioData> = {}): PortfolioData => ({
  ...emptyPortfolioData,
  ...overrides,
});

const acceptedFile = new File(["pdf"], "cv.pdf", { type: "application/pdf" });
const minimalProject = { id: "proj", title: "Project", description: "Desc" };

describe("isPortfolioValid", () => {
  it("accepts a portfolio with a valid project and CV", () => {
    expect(
      isPortfolioValid(
        data({
          projects: [minimalProject],
          cv: [{ id: "cv", file: acceptedFile, error: undefined }],
        }),
      ),
    ).toBe(true);
    expect(
      isPortfolioValid(
        data({
          projects: [minimalProject],
          cv: [{ id: "cv", file: acceptedFile, error: undefined }],
          links: [
            {
              id: "link",
              type: "GitHub",
              label: "Code",
              url: "https://github.com/example",
            },
          ],
        }),
      ),
    ).toBe(true);
  });

  it("accepts an empty portfolio or a valid link alone", () => {
    expect(isPortfolioValid(data())).toBe(true);
    expect(
      isPortfolioValid(
        data({
          links: [
            {
              id: "link",
              type: "GitHub",
              label: "Code",
              url: "https://github.com/example",
            },
          ],
        }),
      ),
    ).toBe(true);
  });

  it("accepts a portfolio with only a CV", () => {
    expect(
      isPortfolioValid(
        data({
          cv: [{ id: "cv", file: acceptedFile, error: undefined }],
        }),
      ),
    ).toBe(true);
  });

  it("accepts a portfolio with only a project", () => {
    expect(
      isPortfolioValid(
        data({
          projects: [minimalProject],
        }),
      ),
    ).toBe(true);
  });

  it.each(["javascript:alert(1)", "not a URL", "ftp://example.org"])(
    "rejects unsafe or malformed supporting link %s",
    (url) => {
      expect(
        isPortfolioValid(
          data({
            projects: [minimalProject],
            cv: [{ id: "cv", file: acceptedFile, error: undefined }],
            links: [{ id: "link", type: "Other", label: "", url }],
          }),
        ),
      ).toBe(false);
    },
  );

  it("rejects unsupported, oversized, and explicitly invalid files", () => {
    const id = "file";
    const oversized = new File(
      [new Uint8Array(5 * 1024 * 1024 + 1)],
      "cv.pdf",
      {
        type: "application/pdf",
      },
    );
    const unsupported = new File(["text"], "cv.txt", { type: "text/plain" });
    const accepted = new File(["pdf"], "cv.pdf", { type: "application/pdf" });
    expect(
      isPortfolioValid(
        data({
          projects: [minimalProject],
          cv: [{ id, file: oversized, error: undefined }],
        }),
      ),
    ).toBe(false);
    expect(
      isPortfolioValid(
        data({
          projects: [minimalProject],
          cv: [{ id, file: unsupported, error: undefined }],
        }),
      ),
    ).toBe(false);
    expect(
      isPortfolioValid(
        data({
          projects: [minimalProject],
          cv: [{ id, file: accepted, error: undefined }],
        }),
      ),
    ).toBe(true);
    expect(
      isPortfolioValid(
        data({
          projects: [minimalProject],
          cv: [{ id, file: accepted, error: "Unsupported file type" }],
        }),
      ),
    ).toBe(false);
  });
});
