import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { astraPrograms } from "@/data/programs";

describe("Astra program chapter data", () => {
  it("contains the four approved chapters with complete content", () => {
    expect(astraPrograms).toHaveLength(4);
    expect(astraPrograms.map(({ number, title }) => [number, title])).toEqual([
      ["01", "Technology & AI"],
      ["02", "Build & Create"],
      ["03", "Business & Ideas"],
      ["04", "Science, Media & More"],
    ]);

    for (const program of astraPrograms) {
      expect(program.description.trim()).not.toBe("");
      expect(program.short.trim()).not.toBe("");
      expect(program.eyebrow.trim()).not.toBe("");
      expect(program.details.trim()).not.toBe("");
      expect(program.image.alt.trim()).not.toBe("");
      for (const asset of [program.image.hero, program.image.thumb]) {
        expect(existsSync(join(process.cwd(), "public", asset))).toBe(true);
      }
    }
  });
});
