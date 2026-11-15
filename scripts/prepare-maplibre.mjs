import { copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Keep the static module worker in sync with the installed MapLibre version.
const distribution = dirname(fileURLToPath(import.meta.resolve("maplibre-gl")));
copyFileSync(join(distribution, "maplibre-gl-worker.mjs"), "public/maplibre-gl-worker.mjs");
copyFileSync(join(distribution, "../LICENSE.txt"), "public/maplibre-LICENSE.txt");
