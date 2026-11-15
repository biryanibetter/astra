import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { normalizeLocations } from "./lib/school-import.mjs";

const root = new URL("../src/data/", import.meta.url);
const base = "https://myschools.edu.gov.qa/server/rest/services/";
const layers = [
  { sector: "public", path: "V2/SchoolsEN/MapServer/0", fields: {
    id: "IndependentSchools.OBJECTID", name: "NSIS_SCHOOL_VIEW.SCHOOL_NAME_END",
    nameAr: "NSIS_SCHOOL_VIEW.SCHOOL_NAME_ARA", stage: "IndependentSchools.LEVEL_NAME_EN",
    locality: "IndependentSchools.DISTRICT_NAME_EN", municipality: "IndependentSchools.MNCP_NAME_EN",
  } },
  { sector: "private", path: "Hosted/PrivateSchoolsView/FeatureServer/0", fields: {
    id: "objectid", name: "name", nameAr: "aname", stage: "category",
    locality: "district_name_en", municipality: "mncp_name_en",
  } },
  { sector: "specialized", path: "V2/SchoolsEN/MapServer/2", fields: {
    id: "OBJECTID", name: "ENGLISHNAME", stage: "LEVEL_NAME_EN",
    locality: "DISTRICT_NAME_EN", municipality: "MNCP_NAME_EN",
  } },
];

async function query(url, params) {
  const response = await fetch(`${url}/query?${new URLSearchParams({ f: "json", ...params })}`, {
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`Source returned ${response.status}: ${url}`);
  const data = await response.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data;
}

const rows = [];
const sources = [];
for (const layer of layers) {
  const url = base + layer.path;
  const before = await query(url, { where: "1=1", returnCountOnly: "true" });
  const data = await query(url, {
    where: "1=1", outFields: Object.values(layer.fields).join(","),
    outSR: "4326", returnGeometry: "true",
  });
  const after = await query(url, { where: "1=1", returnCountOnly: "true" });
  if (data.exceededTransferLimit || data.features.length !== before.count || before.count !== after.count) {
    throw new Error(`Incomplete or changing source: ${layer.sector}. Snapshot not written.`);
  }
  for (const feature of data.features) {
    const attributes = feature.attributes;
    const id = attributes[layer.fields.id];
    rows.push({
      id: `${layer.sector}-${id}`, sector: layer.sector,
      name: attributes[layer.fields.name], nameAr: attributes[layer.fields.nameAr] ?? "",
      stage: attributes[layer.fields.stage], locality: attributes[layer.fields.locality],
      municipality: attributes[layer.fields.municipality],
      coordinates: [feature.geometry?.x, feature.geometry?.y],
      source: `${url}/query?${new URLSearchParams({ where: `${layer.fields.id}=${id}`, outFields: Object.values(layer.fields).join(","), outSR: "4326", f: "pjson" })}`,
    });
  }
  sources.push({ sector: layer.sector, url, queriedRows: data.features.length, uniqueSourceIds: new Set(data.features.map((f) => f.attributes[layer.fields.id])).size });
}
const { features, rejected, duplicatesRemoved } = normalizeLocations(rows);
const eligible = (feature) => feature.properties.stages.some((stage) =>
  /\b(preparatory|secondary)\b/i.test(stage),
);
const eligibleLocations = features.filter(eligible);
const unresolvedEligibility = features.filter((feature) =>
  feature.properties.stages.length === 0 || feature.properties.stages.includes("Specialized"),
).length;
const manifest = {
  retrievedAt: new Date().toISOString(), publisher: "Qatar Ministry of Education and Higher Education — My School",
  portal: "https://myschools.edu.gov.qa/myschool/?culture=En",
  sources, queriedRows: rows.length, loadedLocations: features.length, duplicatesRemoved, rejected,
  bySector: Object.fromEntries(layers.map((layer) => [layer.sector, features.filter((f) => f.properties.sector === layer.sector).length])),
  eligibility: {
    policy: "Include only official stage labels explicitly naming Preparatory or Secondary. Exclude all other and generic Specialized labels pending grade verification.",
    eligibleLocations: eligibleLocations.length,
    unresolvedLocations: unresolvedEligibility,
    excludedLocations: features.length - eligibleLocations.length,
  },
  kindergartenOnly: features.filter((f) => f.properties.stages.every((s) => /^kindergar[dt]en$/i.test(s))).length,
  policy: "Exact normalized name + sector + identical source coordinates only. Co-located stages merge; separate coordinates remain separate listed locations. Coordinates are source-projected WGS84, not invented or averaged.",
  coverage: "All rows returned by these three public layers at retrieval, less recorded duplicates/exclusions. Stage labels are source-provided categories, not exact grade ranges; campuses are represented as individual source records but not independently verified against a national register or ground survey. Not a count of unique institutions or Astra affiliations.",
  rights: "Publicly accessible official facts; no explicit open-data redistribution license found on these layer metadata. Attribution retained. Confirm reuse terms before public launch. No personal contact, owner, director, student or staff fields requested or imported.",
};
await mkdir(root, { recursive: true });
await writeFile(new URL("qatar-schools.json", root), JSON.stringify({ type: "FeatureCollection", features }, null, 2) + "\n");
await writeFile(new URL("qatar-schools-manifest.json", root), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({ output: fileURLToPath(root), ...manifest }, null, 2));
