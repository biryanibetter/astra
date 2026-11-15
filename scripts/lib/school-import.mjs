// Only identity and geographic fields enter the distributable snapshot.
export function normalizeLocations(rows) {
  const features = [];
  const rejected = [];
  const bySite = new Map();
  for (const row of [...rows].sort((a, b) => a.id.localeCompare(b.id))) {
    const name = String(row.name ?? "").trim().replace(/\s+/g, " ");
    const [longitude, latitude] = row.coordinates ?? [];
    if (!name || !Number.isFinite(longitude) || !Number.isFinite(latitude) ||
      longitude < 50.7 || longitude > 51.8 || latitude < 24.4 || latitude > 26.3) {
      rejected.push({ id: row.id, reason: !name ? "Missing source name" : "Invalid Qatar coordinate" });
      continue;
    }
    // Conservative: no fuzzy name matching, centroid creation or nearby-campus merging.
    const key = JSON.stringify([name.toLowerCase(), row.sector, longitude, latitude]);
    const source = { id: row.id, url: row.source };
    const existing = bySite.get(key);
    if (existing) {
      if (!existing.properties.sources.some((item) => item.id === row.id)) existing.properties.sources.push(source);
      if (row.stage && !existing.properties.stages.includes(row.stage)) existing.properties.stages.push(row.stage);
      continue;
    }
    const feature = {
      type: "Feature",
      id: row.id,
      geometry: { type: "Point", coordinates: [longitude, latitude] },
      properties: {
        id: row.id, name, nameAr: String(row.nameAr ?? "").trim(),
        locality: String(row.locality ?? "").trim(),
        municipality: String(row.municipality ?? "").trim(),
        sector: row.sector, stages: row.stage ? [row.stage] : [], sources: [source],
      },
    };
    bySite.set(key, feature);
    features.push(feature);
  }
  features.sort((a, b) => a.properties.name.localeCompare(b.properties.name, "en") || a.id.localeCompare(b.id));
  return { features, rejected, duplicatesRemoved: rows.length - features.length - rejected.length };
}
