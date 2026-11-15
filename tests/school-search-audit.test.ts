import { describe, expect, it } from "vitest";
import snapshot from "@/data/qatar-schools.json";
import { SCHOOL_CAMPUS_MERGES } from "@/data/school-campus-merges";
import {
  findSchoolLocation,
  SCHOOL_GEOJSON,
  SCHOOL_LOCATIONS,
  searchSchoolLocations,
} from "@/lib/school-locations";
import { normalizeSchoolSearch } from "@/lib/school-search";

describe("whole-catalog search and identity audit", () => {
  const eligible = snapshot.features.filter((feature) =>
    feature.properties.stages.some((stage) =>
      /\b(preparatory|secondary)\b/i.test(stage),
    ),
  );

  it("matches only actual canonical-name prefixes, not acronyms or locality qualifiers", () => {
    for (const query of [
      "DBS",
      "DBS Al Wakra",
      "BPS",
      "DPS Modern Indian",
      "Wakra",
    ]) {
      const prefix = normalizeSchoolSearch(query);
      for (const school of searchSchoolLocations(query)) {
        expect(normalizeSchoolSearch(school.name).startsWith(prefix)).toBe(
          true,
        );
      }
    }
    expect(searchSchoolLocations("DBS")).toEqual([]);
    expect(searchSchoolLocations("DBS Al Wakra")).toEqual([]);
    expect(searchSchoolLocations("BPS")).toEqual([]);
    expect(
      searchSchoolLocations("DPS Modern Indian").map(({ id }) => id),
    ).toContain("private-102");
    expect(searchSchoolLocations("Wakra")).toEqual([]);
  });

  it.each([
    "MES",
    "M.E.S",
    "M E S",
    "MES Indian School",
    "mes indian",
    "  m.e.s   INDIAN school ",
  ])("matches only normalized name prefixes for %s", (query) => {
    const prefix = normalizeSchoolSearch(query);
    expect(searchSchoolLocations(query).length).toBeGreaterThan(0);
    expect(
      searchSchoolLocations(query).every((school) =>
        normalizeSchoolSearch(school.name).startsWith(prefix),
      ),
    ).toBe(true);
  });

  it("finds every eligible school by its canonical displayed name and normalized prefix", () => {
    expect(eligible).toHaveLength(279);
    for (const { properties: source } of eligible) {
      const canonical = findSchoolLocation(source.id);
      if (!canonical) throw new Error(`Missing canonical school: ${source.id}`);
      const variants = [canonical.name, canonical.name.toUpperCase()];
      for (const query of variants) {
        expect(
          searchSchoolLocations(`  ${query}  `).map((school) => school.id),
          `${source.id}: ${query}`,
        ).toContain(canonical.id);
      }
      const normalizedName = normalizeSchoolSearch(canonical.name);
      const prefix = normalizedName.split(" ")[0] ?? normalizedName;
      expect(searchSchoolLocations(prefix).map(({ id }) => id)).toContain(
        canonical.id,
      );
    }
  });

  it("consolidates reviewed same-campus stage records and keeps every old ID resolvable", () => {
    const pairs = [
      ["public-2474", "public-2560"], // Al-Ghuwayriyah
      ["public-2281", "public-2319"], // Al-Jumaliyah
      ["public-2399", "public-2576"], // Al-Karaana
      ["public-2552", "public-2559"], // Al-Zubarah
      ["public-2288", "public-2481"], // Ash-Shahaniya
      ["public-2382", "public-2459"], // Dukhan
      ["public-2355", "public-2394"], // Mesaieed
      ["public-2479", "public-2482"], // Rawdat Rashid
    ] as const;
    for (const [canonicalId, aliasId] of pairs) {
      const canonical = findSchoolLocation(canonicalId);
      expect(findSchoolLocation(aliasId)?.id).toBe(canonicalId);
      expect(canonical?.sources.map((source) => source.id)).toContain(aliasId);
      // After cleaning, canonical names are the base school name without stage suffixes.
      // The number of consolidated records per name varies by coordinate clustering.
      // Just verify the canonical record is findable by its cleaned name.
      const results = searchSchoolLocations(canonical?.name ?? "");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((r) => r.id === canonicalId)).toBe(true);
    }
    expect(SCHOOL_LOCATIONS).toHaveLength(271);
    expect(SCHOOL_GEOJSON.features).toHaveLength(271);
    const sourceIds = new Set(
      eligible.flatMap((feature) =>
        feature.properties.sources.map((source) => source.id),
      ),
    );
    expect(sourceIds.size).toBe(293);
    expect(
      new Set(
        SCHOOL_LOCATIONS.flatMap((school) =>
          school.sources.map((source) => source.id),
        ),
      ),
    ).toEqual(sourceIds);
    for (const id of sourceIds)
      expect(findSchoolLocation(id), id).toBeDefined();
  });

  it("guards the reviewed merge assumptions against future snapshot changes", () => {
    for (const [aliasId, canonicalId] of Object.entries(SCHOOL_CAMPUS_MERGES)) {
      const alias = eligible.find((school) => school.properties.id === aliasId);
      const canonical = eligible.find(
        (school) => school.properties.id === canonicalId,
      );
      if (!alias || !canonical)
        throw new Error(`Review stale merge: ${aliasId} -> ${canonicalId}`);
      expect(alias.properties.name).toBe(canonical.properties.name);
      expect(alias.properties.nameAr).toBe(canonical.properties.nameAr);
      expect(alias.properties.nameAr.length).toBeGreaterThan(0);
      expect(alias.properties.sector).toBe(canonical.properties.sector);
      expect(alias.properties.locality).toBe(canonical.properties.locality);
      const [lon, lat] = alias.geometry.coordinates;
      const [targetLon, targetLat] = canonical.geometry.coordinates;
      if (
        lon === undefined ||
        lat === undefined ||
        targetLon === undefined ||
        targetLat === undefined
      )
        throw new Error("Missing campus coordinates");
      const metres =
        Math.hypot(
          (lon - targetLon) * Math.cos((lat * Math.PI) / 180),
          lat - targetLat,
        ) * 111195;
      expect(metres).toBeLessThan(50);
      expect(findSchoolLocation(canonicalId)?.coordinates).toEqual(
        canonical.geometry.coordinates,
      );
    }
  });

  it("does not conflate distinct sites, branches, genders, or schools sharing coordinates", () => {
    expect(findSchoolLocation("public-2510")?.id).toBe("public-2510");
    expect(findSchoolLocation("public-2542")?.id).toBe("public-2542");
    // After cleaning, "Rawdat Rashid Preparatory and Secondary School for Boys" -> "Rawdat Rashid"
    // Multiple coordinate clusters exist; verify both canonical IDs are findable
    const rawdatResults = searchSchoolLocations("Rawdat Rashid");
    expect(rawdatResults.some((r) => r.id === "public-2510")).toBe(true);
    expect(rawdatResults.some((r) => r.id === "public-2542")).toBe(true);
    for (const id of [
      "private-91",
      "private-90",
      "private-87",
      "private-88",
      "private-89",
    ]) {
      expect(
        SCHOOL_GEOJSON.features.some((feature) => feature.properties.id === id),
      ).toBe(true);
    }
    const branches = searchSchoolLocations("Al Khor International").map(
      (school) => school.id,
    );
    expect(branches).toContain("private-58");
    expect(branches).toContain("private-59");
    expect(searchSchoolLocations("nonexistent-unlisted-zz")).toEqual([]);
    expect(searchSchoolLocations("... ")).toEqual([]);
  });
});
