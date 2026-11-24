import { describe, expect, it } from "vitest";
import { SCHOOL_GEOJSON, SCHOOL_LOCATIONS } from "@/lib/school-locations";
import {
  QATAR_MAP_BOUNDS,
  QATAR_MAP_MIN_ZOOM,
  SCHOOL_MAP_FIT_BOUNDS,
} from "@/lib/school-map-bounds";

describe("school map camera bounds", () => {
  it("contains all listed preparatory and secondary school coordinates", () => {
    const [[west, south], [east, north]] = QATAR_MAP_BOUNDS;

    for (const {
      coordinates: [longitude, latitude],
    } of SCHOOL_LOCATIONS) {
      expect(longitude).toBeGreaterThanOrEqual(west);
      expect(longitude).toBeLessThanOrEqual(east);
      expect(latitude).toBeGreaterThanOrEqual(south);
      expect(latitude).toBeLessThanOrEqual(north);
    }
  });

  it("keeps bounds to a small surrounding region and a useful minimum zoom", () => {
    const [[west, south], [east, north]] = QATAR_MAP_BOUNDS;
    expect(east - west).toBeLessThan(2);
    expect(north - south).toBeLessThan(2.5);
    expect(QATAR_MAP_MIN_ZOOM).toBe(7);
  });

  it("precomputes the exact extent of all map feature coordinates", () => {
    const expected = SCHOOL_GEOJSON.features.reduce<
      [[number, number], [number, number]]
    >(
      (
        [[west, south], [east, north]],
        {
          geometry: {
            coordinates: [longitude, latitude],
          },
        },
      ) => [
        [Math.min(west, longitude), Math.min(south, latitude)],
        [Math.max(east, longitude), Math.max(north, latitude)],
      ],
      [
        [Infinity, Infinity],
        [-Infinity, -Infinity],
      ],
    );

    expect(SCHOOL_MAP_FIT_BOUNDS).toEqual(expected);
  });
});
