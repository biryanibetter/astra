import { expect, it } from "vitest";
import {
  findSchoolLocation,
  searchSchoolLocations,
} from "@/lib/school-locations";
import { normalizeSchoolSearch } from "@/lib/school-search";

it("retains school identity and gender instead of bare location labels", () => {
  for (const query of ["me", "al ka"]) {
    const results = searchSchoolLocations(query);
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((s) =>
        normalizeSchoolSearch(s.name).startsWith(normalizeSchoolSearch(query)),
      ),
    ).toBe(true);
    expect(results.every((s) => /school/i.test(s.name))).toBe(true);
    expect(new Set(results.map((s) => s.name)).size).toBe(results.length);
  }
  expect(findSchoolLocation("public-2537")?.name).toContain("School for Boys");
  expect(findSchoolLocation("public-2565")?.name).toContain("School for Girls");
  expect(findSchoolLocation("public-2394")?.id).toBe("public-2355");
});
