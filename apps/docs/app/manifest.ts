import type { MetadataRoute } from "next";

import { product } from "../lib/product";

// Web app manifest — enables installability and gives browsers a name, theme,
// and start URL. Icons are supplied by the app/icon.tsx file convention.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${product.productName} — ${product.tagline}`,
    short_name: product.shortName,
    description: product.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    categories: ["developer", "productivity", "design"],
  };
}
