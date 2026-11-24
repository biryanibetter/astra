import type * as maplibregl from "maplibre-gl";

// These app-owned layers are validated offline in school-map-layers.test.ts.
// The live style still uses MapLibre's normal validation path.
export const SCHOOL_MAP_LAYERS: maplibregl.AddLayerObject[] = [
  {
    id: "astra-clusters",
    type: "circle",
    source: "astra-schools",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#c6ccd5",
      "circle-radius": [
        "step",
        ["get", "point_count"],
        15,
        10,
        19,
        50,
        24,
        150,
        28,
      ],
      "circle-stroke-color": "#f5f6f8",
      "circle-stroke-width": 1,
    },
  },
  {
    id: "astra-cluster-count",
    type: "symbol",
    source: "astra-schools",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["Noto Sans Regular"],
      "text-size": 11,
    },
    paint: { "text-color": "#101114" },
  },
  {
    id: "astra-points",
    type: "circle",
    source: "astra-schools",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 4, 14, 6],
      "circle-color": "#c6ccd5",
      "circle-stroke-color": "#fff",
      "circle-stroke-width": 1.2,
    },
  },
  {
    id: "astra-selected",
    type: "circle",
    source: "astra-schools",
    filter: ["==", ["get", "id"], ""],
    paint: {
      "circle-radius": 10,
      "circle-color": "#ffffff",
      "circle-opacity": 0.12,
      "circle-stroke-color": "#fff",
      "circle-stroke-width": 1.2,
    },
  },
];
