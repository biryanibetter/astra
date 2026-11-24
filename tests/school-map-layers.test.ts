import { createRequire } from "node:module";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { SCHOOL_GEOJSON } from "@/lib/school-locations";
import { SCHOOL_MAP_LAYERS } from "@/lib/school-map-layers";

const maplibreRequire = createRequire(
  resolve(process.cwd(), "node_modules/maplibre-gl/dist/maplibre-gl.mjs"),
);
const { validateStyleMin } = maplibreRequire(
  "@maplibre/maplibre-gl-style-spec",
) as {
  validateStyleMin: (style: unknown) => unknown[];
};

it("offline-validates the static app-owned source and layers", () => {
  const errors = validateStyleMin({
    version: 8,
    sources: {
      "astra-schools": {
        type: "geojson",
        data: SCHOOL_GEOJSON,
        cluster: true,
        clusterRadius: 42,
        maxzoom: 19,
        clusterMaxZoom: 18,
      },
    },
    layers: SCHOOL_MAP_LAYERS,
  });

  expect(errors).toEqual([]);
});
