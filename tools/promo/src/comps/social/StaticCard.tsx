import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { brand, colors, monoFamily } from "../../theme";
import { Logomark, Stage } from "../../shared";
import { CatTile } from "../category/Layout";
import { ToolCallDemo } from "../category/demos-ai-dev";
import { KpiMorphDemo } from "../category/demos-collab-data";

// Rendered as a still (frame ~140) for X image posts / link cards.
export const cardSchema = z.object({
  heading: z.string(),
  sub: z.string(),
});

export const cardDefaults: z.infer<typeof cardSchema> = {
  heading: "Beautiful animated React & shadcn components",
  sub: "Accessible. Reduced-motion safe. Installed as editable source.",
};

export const StaticCard: React.FC<z.infer<typeof cardSchema>> = ({ heading, sub }) => (
  <Stage glowX="26%" glowY="30%">
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: "0 70px", gap: 54 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Logomark size={58} />
          <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1.4, color: colors.fg }}>
            {brand.name}
          </span>
          <span
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: `1px solid ${colors.borderStrong}`,
              background: colors.accentSoft,
              color: colors.accentText,
              fontSize: 17,
              fontWeight: 700,
            }}
          >
            Free & open source
          </span>
        </div>
        <div style={{ fontSize: 51, fontWeight: 800, letterSpacing: -1.8, lineHeight: 1.16, color: colors.fg }}>
          {heading}
        </div>
        <div style={{ fontSize: 24, lineHeight: 1.5, color: colors.muted, maxWidth: 520 }}>{sub}</div>
        <div
          style={{
            alignSelf: "flex-start",
            padding: "14px 24px",
            borderRadius: 12,
            border: `1px solid ${colors.borderStrong}`,
            background: colors.surface,
            fontFamily: monoFamily,
            fontSize: 20,
            color: colors.fgSecondary,
          }}
        >
          <span style={{ color: colors.success }}>❯ </span>
          npx shadcn add {brand.domain}/r/…
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <CatTile tile={{ label: "Tool Call Activity", demo: ToolCallDemo }} delay={0} />
        <div
          style={{
            position: "absolute",
            left: -74,
            bottom: -26,
            transform: "scale(0.62)",
            transformOrigin: "bottom left",
            filter: "drop-shadow(0 24px 50px rgba(0,0,0,0.6))",
          }}
        >
          <CatTile tile={{ label: "KPI Number Morph", demo: KpiMorphDemo }} delay={0} />
        </div>
      </div>
    </AbsoluteFill>
  </Stage>
);
