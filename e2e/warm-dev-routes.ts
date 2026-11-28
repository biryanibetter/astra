import { type FullConfig, request } from "@playwright/test";

/** Compile the route inventory before any in-memory application drafts exist.
 * Next's dev compiler can otherwise full-reload an open form as another worker
 * first visits a route sharing its components. Production has no Fast Refresh.
 */
export default async function warmDevRoutes(config: FullConfig) {
  if (process.env.PLAYWRIGHT_PRODUCTION === "true") return;
  const baseURL = config.projects[0]?.use.baseURL;
  if (!baseURL) throw new Error("Browser verification requires a baseURL.");
  const client = await request.newContext({
    baseURL,
  });
  try {
    for (const path of [
      "/",
      "/about",
      "/contact",
      "/privacy",
      "/network",
      "/join",
      "/programs",
      "/the-idea",
      "/schools",
      "/schools/birla-public-school",
      "/schools/birla-public-school/apply",
      "/apply/core",
      "/apply/fellow",
      "/apply/received",
      "/apply/unknown-pathway",
      "/schools/unknown-school",
      "/admin",
      "/admin/login",
      "/api/admin/applications",
      "/api/pathway/email",
      "/api/pathway/eligibility",
      "/api/pathway-applications",
    ]) {
      const response = await client.get(path);
      if (response.status() >= 500)
        throw new Error(`Dev warmup failed: ${path} (${response.status()})`);
      await response.body();
    }
  } finally {
    await client.dispose();
  }
}
