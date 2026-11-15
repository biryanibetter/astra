import { expect, test } from "@playwright/test";

test("Cloudflare serves metadata and licensed local assets", async ({
  request,
}) => {
  for (const path of [
    "/robots.txt",
    "/sitemap.xml",
    "/opengraph-image",
    "/icon.png",
    "/branding/astra-logo-light.png",
    "/fonts/inter.woff2",
    "/maplibre-gl-worker.mjs",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect((await response.body()).length, path).toBeGreaterThan(0);
  }
});

test("Cloudflare serves public routes with the existing security headers", async ({
  request,
}) => {
  for (const path of ["/", "/apply/core", "/apply/fellow", "/the-idea"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
    expect(response.headers()["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
  }
});

test("Cloudflare rejects every prepared API without reading applicant data", async ({
  request,
}) => {
  for (const path of [
    "/api/applications",
    "/api/pathway/email",
    "/api/pathway/eligibility",
    "/api/pathway-applications",
    "/api/admin/applications",
    "/api/admin/session",
    "/api/admin/maintenance",
  ]) {
    for (const method of ["GET", "POST"]) {
      const response = await request.fetch(path, { method });
      expect(response.status(), `${method} ${path}`).toBe(503);
      expect(response.headers()["cache-control"]).toBe("no-store, private");
      expect(await response.json()).toEqual({
        message: "Live submissions are disabled.",
      });
    }
  }
});
