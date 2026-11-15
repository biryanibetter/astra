import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3107";
const production = process.env.PLAYWRIGHT_PRODUCTION === "true";
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/warm-dev-routes.ts",
  workers: 2,
  outputDir: ".test-output/playwright/results",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "tablet",
      use: { viewport: { width: 768, height: 1024 }, hasTouch: true },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: `pnpm ${production ? "start" : "dev"} --port ${new URL(baseURL).port || "3107"}`,
    env: {
      NEXT_BUILD_DIR: production ? ".next-verification" : ".next-e2e",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
      // Local forms must work without configured authentication or live intake.
      SITE_URL: `https://${new URL(baseURL).host}`,
      SUPABASE_URL: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      SUPABASE_PUBLISHABLE_KEY: "",
      APPLICATION_AUTH_CAPTCHA_ENABLED: "false",
      APPLICATIONS_OPEN: "false",
      PRIVACY_REVIEWED: "false",
    },
    url: `${baseURL}/network`,
    reuseExistingServer: !process.env.CI,
  },
});
