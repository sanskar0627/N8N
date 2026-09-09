import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.BETTER_AUTH_URL || "https://m9m.sanskarshukla.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // static public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/signup`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];

  return staticRoutes;
}
