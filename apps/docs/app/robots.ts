import type { MetadataRoute } from "next";

import { siteUrl } from "../lib/seo";

// Allow crawling of all public marketing/catalog pages; keep functional,
// account, and API surfaces out of the index. Points crawlers at the sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/portal", "/preview", "/purchase", "/lab", "/legal/_draft"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
