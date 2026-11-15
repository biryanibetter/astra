import { describe, expect, it } from "vitest";
import {
  SCHOOL_LOCATIONS,
  searchSchoolLocations,
} from "@/lib/school-locations";
import { normalizeSchoolSearch } from "@/lib/school-search";

describe("school-name prefix search", () => {
  it.each(["A", "Al", "e"])('returns only names prefixed by "%s"', (query) => {
    const prefix = normalizeSchoolSearch(query);
    const results = searchSchoolLocations(query);

    expect(results.length).toBeGreaterThan(0);
    for (const school of results) {
      expect(normalizeSchoolSearch(school.name).startsWith(prefix)).toBe(true);
    }
  });

  it("narrows matches as the name prefix gets longer", () => {
    const aResults = searchSchoolLocations(" A ");
    const alResults = searchSchoolLocations(" Al ");

    expect(alResults.length).toBeGreaterThan(0);
    expect(
      alResults.every((school) => aResults.some(({ id }) => id === school.id)),
    ).toBe(true);
    expect(
      aResults.every((school) =>
        normalizeSchoolSearch(school.name).startsWith("a"),
      ),
    ).toBe(true);
  });

  it("trims and ignores case, and returns no results for an impossible prefix", () => {
    expect(searchSchoolLocations("  aL  ").map(({ id }) => id)).toEqual(
      searchSchoolLocations("Al").map(({ id }) => id),
    );
    expect(searchSchoolLocations("zzzz-not-a-school")).toEqual([]);
  });

  it("does not derive matches from localities or school-name substrings", () => {
    const substring = "ndian";
    expect(
      SCHOOL_LOCATIONS.some(
        (school) =>
          normalizeSchoolSearch(school.name).includes(substring) &&
          !normalizeSchoolSearch(school.name).startsWith(substring),
      ),
    ).toBe(true);
    expect(searchSchoolLocations(substring)).toEqual([]);
    expect(searchSchoolLocations("Wakra")).toEqual([]);
  });
});
