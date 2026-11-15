import { describe, expect, it } from "vitest";
import {
  CHAPTER_STATUSES,
  filterSchools,
  getSchool,
  SCHOOLS,
} from "@/lib/schools";

describe("sourced school directory", () => {
  it("lists five real identities without implying confirmed chapters", () => {
    expect(SCHOOLS).toHaveLength(5);
    expect(new Set(SCHOOLS.map((school) => school.slug)).size).toBe(5);
    for (const school of SCHOOLS) {
      expect(school.chapterStatus).toBe("unconfirmed");
      expect(school.sources.length).toBeGreaterThan(0);
      expect(new URL(school.website).protocol).toBe("https:");
    }
    expect(Object.keys(CHAPTER_STATUSES).sort()).toEqual([
      "active",
      "founding",
      "interest",
      "unconfirmed",
    ]);
  });
  it("searches case insensitively and filters only recorded statuses", () => {
    expect(filterSchools("  BIRLA ").map((school) => school.slug)).toEqual([
      "birla-public-school",
    ]);
    expect(filterSchools("", "unconfirmed")).toHaveLength(5);
    expect(filterSchools("", "active")).toEqual([]);
    expect(filterSchools("missing school")).toEqual([]);
    expect(getSchool("not-a-school")).toBeUndefined();
  });
  it("pins only source-backed locations and keeps unknown locations unpinned", () => {
    expect(getSchool("birla-public-school")?.coordinates).toMatchObject({
      latitude: 25.2111054,
      longitude: 51.5227159,
      source: "https://www.openstreetmap.org/way/242713202",
    });
    expect(getSchool("qatar-academy-doha")?.coordinates?.latitude).toBe(
      25.315984,
    );
    expect(getSchool("doha-college")?.coordinates).toBeUndefined();
    expect(getSchool("dps-modern-indian-school")?.coordinates).toBeUndefined();
    for (const school of SCHOOLS) {
      if (!school.coordinates) continue;
      expect(school.coordinates.latitude).toBeGreaterThan(24);
      expect(school.coordinates.latitude).toBeLessThan(27);
      expect(new URL(school.coordinates.source).protocol).toBe("https:");
    }
  });
});
