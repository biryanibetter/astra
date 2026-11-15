// Qatar plus a modest surrounding area: enough context to orient visitors,
// while preventing the map from drifting to unrelated parts of the world.
export const QATAR_MAP_BOUNDS: [[number, number], [number, number]] = [
  [50.35, 24.45],
  [52.05, 26.65],
];

// Keeps the entire country useful on desktop and mobile without allowing a
// zoomed-out world view. MapLibre still permits closer campus inspection.
export const QATAR_MAP_MIN_ZOOM = 7;
