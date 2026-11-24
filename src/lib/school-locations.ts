import snapshot from "@/data/qatar-schools.json";
import { SCHOOL_CAMPUS_MERGES } from "@/data/school-campus-merges";
import { normalizeSchoolSearch } from "./school-search";

export type SchoolLocation = {
  id: string;
  name: string;
  nameAr: string;
  locality: string;
  municipality: string;
  sector: string;
  stages: string[];
  sources: { id: string; url: string }[];
  coordinates: [number, number];
};

const SNAPSHOT_LOCATIONS: SchoolLocation[] = snapshot.features.map(
  (feature) => ({
    ...feature.properties,
    coordinates: [
      feature.geometry.coordinates[0] as number,
      feature.geometry.coordinates[1] as number,
    ],
  }),
);

// The Ministry snapshot supplies official school-stage labels per listed campus.
// Only stages explicitly covering Preparatory or Secondary are eligible; generic
// "Specialized" and missing/other stage labels stay out until grades are verified.
const eligibleLocations = SNAPSHOT_LOCATIONS.filter((school) =>
  school.stages.some((stage) => /\b(preparatory|secondary)\b/i.test(stage)),
);
const canonicalLocations = new Map(
  eligibleLocations
    .filter((school) => !SCHOOL_CAMPUS_MERGES[school.id])
    .map((school) => [school.id, { ...school }]),
);
for (const school of eligibleLocations) {
  const canonicalId = SCHOOL_CAMPUS_MERGES[school.id];
  const canonical = canonicalId
    ? canonicalLocations.get(canonicalId)
    : undefined;
  if (!canonical) continue;
  canonical.sources = [...canonical.sources, ...school.sources].filter(
    (source, index, sources) =>
      sources.findIndex((item) => item.id === source.id) === index,
  );
  canonical.stages = [...new Set([...canonical.stages, ...school.stages])];
}
export const SCHOOL_LOCATIONS = [...canonicalLocations.values()];
export const SCHOOL_LOCATIONS_UNRESOLVED = SNAPSHOT_LOCATIONS.filter(
  (school) =>
    school.stages.length === 0 || school.stages.includes("Specialized"),
).length;

const schoolFeatures = [];
let west = Infinity;
let south = Infinity;
let east = -Infinity;
let north = -Infinity;
for (const school of SCHOOL_LOCATIONS) {
  const [longitude, latitude] = school.coordinates;
  west = Math.min(west, longitude);
  south = Math.min(south, latitude);
  east = Math.max(east, longitude);
  north = Math.max(north, latitude);
  schoolFeatures.push({
    type: "Feature" as const,
    id: school.id,
    geometry: { type: "Point" as const, coordinates: school.coordinates },
    properties: { id: school.id, name: school.name },
  });
}

// Compute the fitted camera extent during feature creation, avoiding an
// additional pass over the static school coordinates when the map loads.
export const SCHOOL_MAP_FIT_BOUNDS: [[number, number], [number, number]] = [
  [west, south],
  [east, north],
];

// Keep the rendering source lean: full provenance is retained in the snapshot and search records.
export const SCHOOL_GEOJSON = {
  type: "FeatureCollection" as const,
  features: schoolFeatures,
};

const byId = new Map(SCHOOL_LOCATIONS.map((school) => [school.id, school]));
for (const school of SCHOOL_LOCATIONS) {
  for (const source of school.sources) byId.set(source.id, school);
}
const indexed = SCHOOL_LOCATIONS.map((school) => ({
  school,
  name: normalizeSchoolSearch(school.name),
}));

export function findSchoolLocation(id: string): SchoolLocation | undefined {
  return byId.get(id);
}

export function searchSchoolLocations(query: string): SchoolLocation[] {
  const phrase = normalizeSchoolSearch(query);
  if (!phrase) return [];
  return indexed
    .filter((item) => item.name.startsWith(phrase))
    .map((item) => item.school);
}
