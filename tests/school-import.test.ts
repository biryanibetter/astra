import { describe, expect, it } from "vitest";
import { normalizeLocations } from "../scripts/lib/school-import.mjs";

const row = (overrides = {}) => ({
  id: "public-1",
  name: " Example   School ",
  nameAr: "مدرسة",
  locality: "Doha",
  municipality: "Doha Municipality",
  sector: "public",
  stage: "Primary",
  coordinates: [51.5, 25.3],
  source: "https://myschools.edu.gov.qa/example/1",
  ...overrides,
});

describe("public school location import", () => {
  it("merges duplicate source rows and co-located stages, retaining provenance", () => {
    const result = normalizeLocations([
      row(),
      row(),
      row({
        id: "public-2",
        stage: "Secondary",
        source: "https://myschools.edu.gov.qa/example/2",
      }),
    ]);
    expect(result.features).toHaveLength(1);
    expect(result.features[0]?.properties.name).toBe("Example School");
    expect(result.features[0]?.properties.stages).toEqual([
      "Primary",
      "Secondary",
    ]);
    expect(result.features[0]?.properties.sources).toHaveLength(2);
    expect(result.duplicatesRemoved).toBe(2);
  });
  it("does not merge same-name schools at distinct locations or different schools sharing a site", () => {
    const result = normalizeLocations([
      row(),
      row({ id: "public-2", coordinates: [51.6, 25.3] }),
      row({ id: "public-3", name: "Another School" }),
    ]);
    expect(result.features).toHaveLength(3);
  });
  it("rejects absent names, nonnumeric coordinates and locations outside Qatar without guessing", () => {
    const result = normalizeLocations([
      row({ name: "" }),
      row({ coordinates: [0, 0] }),
      row({ coordinates: [null, 25.3] }),
      row({ coordinates: [51.5, Number.NaN] }),
    ]);
    expect(result.features).toEqual([]);
    expect(result.rejected).toHaveLength(4);
  });
});
