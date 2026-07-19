import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { enter, pop } from "../helpers";
import { brand, colors, monoFamily } from "../theme";
import { Badge, Logomark, Stage } from "../shared";

export const introSchema = z.object({
  title: z.string(),
  tagline: z.string(),
  kicker: z.string(),
});

export const introDefaults: z.infer<typeof introSchema> = {
  title: brand.name,
  tagline: brand.tagline,
  kicker: "Animated component library",
};

export const Intro: React.FC<z.infer<typeof introSchema>> = ({ title, tagline, kicker }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const letters = title.split("");

  const markIn = pop({ frame, fps, delay: 4 });
  const taglineIn = enter({ frame, fps, delay: 36 });
  const pillIn = enter({ frame, fps, delay: 52 });
  // Shine sweep across the wordmark once the letters have landed.
  const shineX = interpolate(frame, [40, 85], [-30, 130], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Stage glowY="30%">
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 34,
        }}
      >
        <Badge delay={0}>{kicker}</Badge>

        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div style={{ transform: `scale(${markIn}) rotate(${interpolate(markIn, [0, 1], [-14, 0])}deg)` }}>
            <Logomark size={96} />
          </div>
          <div style={{ position: "relative", display: "flex" }}>
            {letters.map((letter, i) => {
              const p = enter({ frame, fps, delay: 10 + i * 3.5 });
              return (
                <span
                  key={i}
                  style={{
                    fontSize: 132,
                    fontWeight: 800,
                    letterSpacing: -4,
                    color: colors.fg,
                    display: "inline-block",
                    opacity: p,
                    transform: `translateY(${interpolate(p, [0, 1], [46, 0])}px)`,
                  }}
                >
                  {letter}
                </span>
              );
            })}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(105deg, transparent ${shineX - 18}%, rgba(127,159,255,0.5) ${shineX}%, transparent ${shineX + 18}%)`,
                mixBlendMode: "screen",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        <div
          style={{
            maxWidth: width * 0.62,
            textAlign: "center",
            fontSize: 30,
            lineHeight: 1.45,
            fontWeight: 500,
            color: colors.fgSecondary,
            opacity: taglineIn,
            transform: `translateY(${interpolate(taglineIn, [0, 1], [18, 0])}px)`,
          }}
        >
          {tagline}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 24px",
            borderRadius: 12,
            border: `1px solid ${colors.borderStrong}`,
            background: colors.surface,
            fontFamily: monoFamily,
            fontSize: 21,
            color: colors.accentText,
            opacity: pillIn,
            transform: `translateY(${interpolate(pillIn, [0, 1], [16, 0])}px)`,
            boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          }}
        >
          <span style={{ color: colors.success }}>▲</span>
          {brand.domain}
        </div>
      </AbsoluteFill>
    </Stage>
  );
};
