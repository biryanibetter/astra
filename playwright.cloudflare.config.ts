import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// Exercise built Worker output in workerd, not Next's Node development server.
const { globalSetup: _warmup, webServer: _server, ...shared } = base;
process.env.PLAYWRIGHT_PRODUCTION = "true";
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3110";

export default defineConfig({
  ...shared,
  testIgnore: [],
  testMatch: [
    "restored-local-form.spec.ts",
    "application-school-handoff.spec.ts",
    "reconciled-frontend.spec.ts",
    "cloudflare-runtime.spec.ts",
    "home-map-preparation.spec.ts",
    "lenis-defaults.spec.ts",
  ],
  outputDir: ".test-output/cloudflare/results",
  use: { ...base.use, baseURL },
  webServer: {
    command: `pnpm preview:cloudflare --port ${new URL(baseURL).port}`,
    url: `${baseURL}/network`,
    env: { WRANGLER_SEND_METRICS: "false" },
    reuseExistingServer: false,
    timeout: 60000,
  },
});
