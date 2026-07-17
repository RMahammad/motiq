import type { MetadataRoute } from "next";

import { catalog } from "../lib/catalog";
import { packs } from "../lib/packs";
import { absoluteUrl } from "../lib/seo";

// Full sitemap of indexable pages: static marketing routes, every component
// detail page, every workflow pack, and the legal pages. Functional/account
// routes (portal, preview, api, purchase) are intentionally excluded and also
// blocked in robots.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/components", priority: 0.9, changeFrequency: "weekly" },
    { path: "/packs", priority: 0.8, changeFrequency: "weekly" },
    { path: "/updates", priority: 0.5, changeFrequency: "weekly" },
    { path: "/legal/license", priority: 0.2, changeFrequency: "yearly" },
    { path: "/legal/terms", priority: 0.2, changeFrequency: "yearly" },
    { path: "/legal/privacy", priority: 0.2, changeFrequency: "yearly" },
  ];

  const componentRoutes = catalog.map((item) => ({
    path: `/components/${item.slug}`,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  const packRoutes = packs.map((pack) => ({
    path: `/packs/${pack.slug}`,
    priority: 0.6,
    changeFrequency: "monthly" as const,
  }));

  return [...staticRoutes, ...componentRoutes, ...packRoutes].map((r) => ({
    url: absoluteUrl(r.path),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
