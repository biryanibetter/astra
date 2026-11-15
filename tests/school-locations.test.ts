import { describe, expect, it } from "vitest";
import {
  findSchoolLocation,
  SCHOOL_GEOJSON,
  SCHOOL_LOCATIONS,
  SCHOOL_LOCATIONS_UNRESOLVED,
  searchSchoolLocations,
} from "@/lib/school-locations";
import { normalizeSchoolSearch } from "@/lib/school-search";

describe("Ministry location snapshot", () => {
  it("publishes only verified school stages serving Astra-age students", () => {
    expect(SCHOOL_LOCATIONS.length).toBeLessThan(657);
    expect(SCHOOL_LOCATIONS).toHaveLength(271);
    expect(SCHOOL_LOCATIONS_UNRESOLVED).toBe(23);
    expect(SCHOOL_GEOJSON.features).toHaveLength(SCHOOL_LOCATIONS.length);
    expect(new Set(SCHOOL_LOCATIONS.map((school) => school.id)).size).toBe(
      SCHOOL_LOCATIONS.length,
    );
    expect(
      SCHOOL_LOCATIONS.every((school) =>
        school.stages.some((stage) => /secondary|preparatory/i.test(stage)),
      ),
    ).toBe(true);
    expect(
      SCHOOL_LOCATIONS.some((school) =>
        school.stages.includes("Kindergarten+Primary +Preparatory+Secondary"),
      ),
    ).toBe(true);
    expect(
      SCHOOL_LOCATIONS.some((school) => school.stages.includes("Kindergarten")),
    ).toBe(false);
    expect(new Set(SCHOOL_LOCATIONS.map((school) => school.sector))).toEqual(
      new Set(["public", "private"]),
    );
    for (const school of SCHOOL_LOCATIONS) {
      expect(school.name.trim().length).toBeGreaterThan(0);
      expect(school.coordinates[0]).toBeGreaterThan(50.7);
      expect(school.coordinates[1]).toBeGreaterThan(24.4);
      expect(school.sources.length).toBeGreaterThan(0);
      expect(school.sources[0]?.url).toContain("https://myschools.edu.gov.qa/");
      expect(school).not.toHaveProperty("chapterStatus");
      expect(school).not.toHaveProperty("email");
    }
  });
  it("finds canonical English-name prefixes case-insensitively, not locality or alias matches", () => {
    const americanMatches = searchSchoolLocations("The American");
    expect(americanMatches.length).toBeGreaterThan(0);
    expect(
      americanMatches.every((school) =>
        normalizeSchoolSearch(school.name).startsWith("the american"),
      ),
    ).toBe(true);
    expect(
      searchSchoolLocations("  THE AMERICAN ").map(({ id }) => id),
    ).toEqual(americanMatches.map(({ id }) => id));
    expect(
      searchSchoolLocations("al rayyan").every((school) =>
        normalizeSchoolSearch(school.name).startsWith("al rayyan"),
      ),
    ).toBe(true);
    expect(searchSchoolLocations("Wakra")).toEqual([]);
    expect(searchSchoolLocations("nonexistent-unlisted-zz")).toEqual([]);
    expect(findSchoolLocation("invalid")).toBeUndefined();
    expect(searchSchoolLocations("")).toEqual([]);
    const canonical = SCHOOL_LOCATIONS.find((school) =>
      normalizeSchoolSearch(school.name).startsWith("abd al hameed"),
    );
    if (canonical) {
      expect(
        searchSchoolLocations(canonical.name).map(({ id }) => id),
      ).toContain(canonical.id);
      expect(
        searchSchoolLocations(
          normalizeSchoolSearch(canonical.name).split(" ")[0] ?? "",
        ).map(({ id }) => id),
      ).toContain(canonical.id);
    }
  });
  it("does not search an Arabic alias unless it is an actual canonical-name prefix", () => {
    const school = SCHOOL_LOCATIONS.find((item) => item.nameAr.length > 4);
    expect(school).toBeDefined();
    if (!school) return;
    const query = normalizeSchoolSearch(school.nameAr);
    const results = searchSchoolLocations(school.nameAr);
    expect(
      results.every((item) =>
        normalizeSchoolSearch(item.name).startsWith(query),
      ),
    ).toBe(true);
    expect(findSchoolLocation(school.id)?.name).toBe(school.name);
  });
});
