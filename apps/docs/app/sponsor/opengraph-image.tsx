import { ImageResponse } from "next/og";

import { product } from "../../lib/product";

// Social card for the sponsor page, using the same brand system as the
// per-component cards (deep ink, azure accent, M mark).
export const alt = `Support ${product.productName} — sponsor open-source product motion`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ACCENT = "#4f7cff";

export default function Image() {
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
          background: `radial-gradient(circle at 15% 0%, ${ACCENT}26 0%, #0a0a0b 55%)`,
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
              border: `1px solid ${ACCENT}`,
              color: ACCENT,
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            Open-source sponsorship
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 82, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2, maxWidth: 1000 }}>
            Keep product motion open.
          </div>
          <div style={{ fontSize: 28, color: "#b7b7c9", lineHeight: 1.35, maxWidth: 940 }}>
            Sponsorship funds new components, documentation, accessibility testing, and long-term maintenance.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 22, color: "#8a8a9a" }}>
          free &amp; open source · accessible · reduced-motion-safe · editable source
        </div>
      </div>
    ),
    { ...size },
  );
}
