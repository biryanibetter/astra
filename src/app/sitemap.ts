import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL || "http://localhost:3000";
  return ["", "/the-idea", "/network", "/about", "/contact", "/privacy"].map(
    (path) => ({
      url: `${base}${path}`,
      changeFrequency: "monthly",
      priority: path === "" ? 1 : 0.6,
    }),
  );
}
