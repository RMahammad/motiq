import { ImageResponse } from "next/og";

import { product } from "../lib/product";

// Site-wide social share card (Open Graph + Twitter). Applied automatically by
// Next's file convention to every route that doesn't define its own image.
export const alt = `${product.productName} — ${product.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "radial-gradient(circle at 20% 0%, #17162b 0%, #0a0a0b 55%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #7c5cff 0%, #4f7cff 100%)",
              borderRadius: 18,
              fontSize: 46,
              fontWeight: 700,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.5 }}>{product.productName}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, maxWidth: 940 }}>
            {product.tagline}
          </div>
          <div style={{ fontSize: 30, color: "#b7b7c9", maxWidth: 900 }}>
            Accessible · reduced-motion-safe · editable source.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
