import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.BETTER_AUTH_URL || "https://m9m.sanskarshukla.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup"],
        disallow: [
          "/workflows/",
          "/credentials/",
          "/executions/",
          "/api/",
          "/monitoring",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
