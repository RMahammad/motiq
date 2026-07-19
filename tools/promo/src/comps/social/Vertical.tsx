import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { enter } from "../../helpers";
import { brand, colors, monoFamily } from "../../theme";
import { Badge, Logomark, Stage } from "../../shared";
import { ResponseStreamDemo } from "../category/demos-ai-dev";
import { StreamingRowsDemo } from "../category/demos-collab-data";
import { CheckoutProgressDemo } from "../category/demos-flows";

export const verticalSchema = z.object({
  hook: z.string(),
});

export const verticalDefaults: z.infer<typeof verticalSchema> = {
  hook: "Stop building UI animation from scratch",
};

const Card: React.FC<{ label: string; children: React.ReactNode; delay: number }> = ({
  label,
  children,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enter({ frame, fps, delay });
  return (
    <div
      style={{
        width: 720,
        height: 400,
        borderRadius: 26,
        border: `1px solid ${colors.border}`,
        background: colors.surface,
        boxShadow: "0 22px 60px rgba(0,0,0,0.45)",
        overflow: "hidden",
        position: "relative",
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [46, 0])}px) scale(${interpolate(p, [0, 1], [0.95, 1])})`,
      }}
    >
      <div style={{ height: 336, display: "flex", alignItems: "center", justifyContent: "center", transform: "scale(1.12)" }}>
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 26px",
          fontSize: 22,
          fontWeight: 600,
          color: colors.fgSecondary,
          borderTop: `1px solid ${colors.border}`,
          background: colors.bgElevated,
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: 999, background: colors.accent, boxShadow: `0 0 12px ${colors.accent}` }} />
        {label}
      </div>
    </div>
  );
};

export const Vertical: React.FC<z.infer<typeof verticalSchema>> = ({ hook }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headIn = enter({ frame, fps, delay: 4 });
  const ctaIn = enter({ frame, fps, delay: 44 });
  return (
    <Stage glowY="6%">
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 90 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: headIn }}>
          <Logomark size={52} />
          <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: -1.2, color: colors.fg }}>{brand.name}</span>
        </div>
        <div
          style={{
            marginTop: 26,
            marginBottom: 40,
            maxWidth: 860,
            textAlign: "center",
            fontSize: 62,
            fontWeight: 800,
            letterSpacing: -2,
            lineHeight: 1.14,
            color: colors.fg,
            opacity: headIn,
            transform: `translateY(${interpolate(headIn, [0, 1], [26, 0])}px)`,
          }}
        >
          {hook}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          <Card label="AI Response Stream" delay={16}>
            <ResponseStreamDemo />
          </Card>
          <Card label="Streaming Data Rows" delay={26}>
            <StreamingRowsDemo />
          </Card>
          <Card label="Checkout Progress" delay={36}>
            <CheckoutProgressDemo />
          </Card>
        </div>
        <div style={{ marginTop: 44, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, opacity: ctaIn, transform: `translateY(${interpolate(ctaIn, [0, 1], [18, 0])}px)` }}>
          <div
            style={{
              padding: "18px 34px",
              borderRadius: 16,
              border: `1px solid ${colors.borderStrong}`,
              background: colors.surface,
              fontFamily: monoFamily,
              fontSize: 27,
              color: colors.fgSecondary,
            }}
          >
            <span style={{ color: colors.success }}>❯ </span>
            npx shadcn add {brand.domain}/r/…
          </div>
          <Badge delay={50}>60+ components & blocks · free & open source · {brand.domain}</Badge>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};
