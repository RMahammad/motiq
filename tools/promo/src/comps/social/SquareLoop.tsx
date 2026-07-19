import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { enter } from "../../helpers";
import { brand, colors, monoFamily } from "../../theme";
import { Logomark, Stage } from "../../shared";
import { ComposerDemo } from "../Showcase";
import { KpiMorphDemo } from "../category/demos-collab-data";
import { DeliveryStatesDemo, VariantSelectorDemo } from "../category/demos-flows";

export const squareSchema = z.object({
  heading: z.string(),
});

export const squareDefaults: z.infer<typeof squareSchema> = {
  heading: "Animated React components",
};

const Cell: React.FC<{ children: React.ReactNode; delay: number }> = ({ children, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enter({ frame, fps, delay });
  return (
    <div
      style={{
        width: 452,
        height: 330,
        borderRadius: 22,
        border: `1px solid ${colors.border}`,
        background: colors.surface,
        boxShadow: "0 18px 50px rgba(0,0,0,0.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [34, 0])}px)`,
      }}
    >
      {children}
    </div>
  );
};

export const SquareLoop: React.FC<z.infer<typeof squareSchema>> = ({ heading }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headIn = enter({ frame, fps, delay: 4 });
  const cmdIn = enter({ frame, fps, delay: 30 });
  return (
    <Stage glowY="8%">
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 54 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: headIn }}>
          <Logomark size={54} />
          <span style={{ fontSize: 46, fontWeight: 800, letterSpacing: -1.5, color: colors.fg }}>
            {brand.name}
          </span>
        </div>
        <div
          style={{
            marginTop: 14,
            marginBottom: 34,
            fontSize: 33,
            fontWeight: 600,
            color: colors.fgSecondary,
            opacity: headIn,
            transform: `translateY(${interpolate(headIn, [0, 1], [16, 0])}px)`,
          }}
        >
          {heading} · free & open source
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 452px)", gap: 24 }}>
          <Cell delay={14}>
            <KpiMorphDemo />
          </Cell>
          <Cell delay={20}>
            <VariantSelectorDemo />
          </Cell>
          <Cell delay={26}>
            <ComposerDemo />
          </Cell>
          <Cell delay={32}>
            <DeliveryStatesDemo />
          </Cell>
        </div>
        <div
          style={{
            marginTop: 36,
            padding: "16px 30px",
            borderRadius: 14,
            border: `1px solid ${colors.borderStrong}`,
            background: colors.surface,
            fontFamily: monoFamily,
            fontSize: 24,
            color: colors.fgSecondary,
            opacity: cmdIn,
            transform: `translateY(${interpolate(cmdIn, [0, 1], [14, 0])}px)`,
          }}
        >
          <span style={{ color: colors.success }}>❯ </span>
          npx shadcn add {brand.domain}/r/…
        </div>
      </AbsoluteFill>
    </Stage>
  );
};
