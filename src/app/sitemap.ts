import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL || "http://localhost:3000";
  return ["", "/network", "/about", "/events", "/contact", "/privacy"].map(
    (path) => ({
      url: `${base}${path}`,
      changeFrequency: "monthly",
      priority: path === "" ? 1 : 0.6,
    }),
  );
}
