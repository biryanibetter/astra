import { describe, expect, it } from "vitest";
import {
  formatFileSize,
  formatGrade,
} from "../src/components/review-step-format";

describe("review step formatting", () => {
  it.each([
    ["grade-6-year-7", "Grade 6 / Year 7"],
    ["grade-12-year-13", "Grade 12 / Year 13"],
  ])("formats %s as a readable academic label", (value, label) => {
    expect(formatGrade(value)).toBe(label);
  });

  it("does not expose unknown internal grade values", () => {
    expect(formatGrade("year-13")).toBe("Not provided");
  });

  it.each([
    [0, "0 B"],
    [9, "9 B"],
    [1536, "1.5 KB"],
    [1048576, "1 MB"],
  ])("formats a %i-byte document size", (size, label) => {
    expect(formatFileSize(size)).toBe(label);
  });
});
