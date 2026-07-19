import { ImageResponse } from "next/og";

import { bySlug, catalog, categories } from "../../../lib/catalog";
import { product } from "../../../lib/product";

// Per-component social card. Each component page gets its own branded Open Graph
// image showing the component name + category, so shared links (Twitter, Discord,
// Slack) render a distinct, high-CTR preview instead of one generic card.
export const alt = "Component preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Pre-render one image per component at build time.
export function generateStaticParams() {
  return catalog.map((c) => ({ slug: c.slug }));
}

// One accent hue per workflow family so cards are visually separable at a glance.
const CATEGORY_ACCENT: Record<string, string> = {
  ai: "#4f7cff",
  "developer-tools": "#3e5ae8",
  collaboration: "#22c7d9",
  "data-motion": "#14b8a6",
  security: "#7c5cff",
  commerce: "#10b981",
  productivity: "#f59e0b",
  text: "#ff6b5e",
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = bySlug.get(slug);
  const name = item?.name ?? product.productName;
  const description = item?.description ?? product.tagline;
  const categoryLabel = categories.find((c) => c.id === item?.category)?.label ?? "Component";
  const accent = (item && CATEGORY_ACCENT[item.category]) || "#4f7cff";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: `radial-gradient(circle at 15% 0%, ${accent}26 0%, #0a0a0b 55%)`,
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #7c5cff 0%, #4f7cff 100%)",
                borderRadius: 13,
                fontSize: 32,
                fontWeight: 700,
              }}
            >
              M
            </div>
            <div style={{ fontSize: 26, fontWeight: 600 }}>{product.productName}</div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 18px",
              borderRadius: 999,
              border: `1px solid ${accent}`,
              color: accent,
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            {categoryLabel}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2, maxWidth: 1000 }}>
            {name}
          </div>
          <div style={{ fontSize: 28, color: "#b7b7c9", lineHeight: 1.35, maxWidth: 940 }}>
            {description.length > 130 ? `${description.slice(0, 130)}…` : description}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 22, color: "#8a8a9a" }}>
          npx shadcn add · accessible · reduced-motion-safe · editable source
        </div>
      </div>
    ),
    { ...size },
  );
}
