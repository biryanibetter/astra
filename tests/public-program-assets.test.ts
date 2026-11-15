import { describe, expect, it } from "vitest";
import { programStockData } from "@/data/program-stock-data";
import { astraPrograms } from "@/data/programs";

describe("public release program asset safety", () => {
  it("uses the currently displayed licensed photos for legacy data fallbacks too", () => {
    for (const program of astraPrograms) {
      const displayedPhoto = programStockData.find(
        (photo) => photo.number === program.number,
      );
      expect(displayedPhoto).toBeDefined();
      expect(program.image.hero).toBe(displayedPhoto?.imagePath);
      expect(program.image.thumb).toBe(displayedPhoto?.imagePath);
      expect(program.image.alt).toBe(displayedPhoto?.altText);
    }
  });
});
