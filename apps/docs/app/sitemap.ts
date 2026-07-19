import type { MetadataRoute } from "next";

import { catalog, categories, itemsByCategory } from "../lib/catalog";
import { packs } from "../lib/packs";
import { absoluteUrl } from "../lib/seo";
import { effectiveRelease, catalogBaseline } from "../lib/server/versioning";

// Full sitemap of indexable pages: static marketing routes, category landing
// pages, every component detail page, every workflow pack, and legal pages.
// lastModified comes from the versioning table (freshness signal). Functional/
// account routes (portal, preview, api, purchase) are excluded and also blocked
// in robots.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseline = new Date(catalogBaseline().releaseDate);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1, lastModified: baseline },
    { url: absoluteUrl("/getting-started"), changeFrequency: "monthly", priority: 0.9, lastModified: baseline },
    { url: absoluteUrl("/components"), changeFrequency: "weekly", priority: 0.9, lastModified: baseline },
    { url: absoluteUrl("/packs"), changeFrequency: "weekly", priority: 0.8, lastModified: baseline },
    { url: absoluteUrl("/updates"), changeFrequency: "weekly", priority: 0.5, lastModified: baseline },
    { url: absoluteUrl("/sponsor"), changeFrequency: "monthly", priority: 0.6, lastModified: baseline },
    { url: absoluteUrl("/legal/license"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/legal/terms"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/legal/privacy"), changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((c) => itemsByCategory(c.id).some((it) => (it.kind ?? "component") === "component"))
    .map((c) => ({
      url: absoluteUrl(`/components/category/${c.id}`),
      changeFrequency: "weekly",
      priority: 0.75,
      lastModified: baseline,
    }));

  const componentRoutes: MetadataRoute.Sitemap = catalog.map((item) => ({
    url: absoluteUrl(`/components/${item.slug}`),
    changeFrequency: "monthly",
    priority: 0.7,
    lastModified: new Date(effectiveRelease(item.registryItem).releaseDate),
  }));

  const packRoutes: MetadataRoute.Sitemap = packs.map((pack) => ({
    url: absoluteUrl(`/packs/${pack.slug}`),
    changeFrequency: "monthly",
    priority: 0.6,
    lastModified: baseline,
  }));

  return [...staticRoutes, ...categoryRoutes, ...componentRoutes, ...packRoutes];
}
