import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { enter, pop, seededRandom } from "../helpers";
import { brand, colors, monoFamily } from "../theme";
import { Badge, Logomark, Stage } from "../shared";

export const openSourceSchema = z.object({
  heading: z.string(),
  kicker: z.string(),
  particleSeed: z.number().int(),
});

export const openSourceDefaults: z.infer<typeof openSourceSchema> = {
  heading: "Free & open source",
  kicker: "Every component. Every block. No paywall.",
  particleSeed: 7,
};

const Particles: React.FC<{ seed: number }> = ({ seed }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const rand = seededRandom(seed);
  const particles = Array.from({ length: 26 }, () => ({
    x: rand() * width,
    y: rand() * height,
    size: 2 + rand() * 3.5,
    speed: 0.25 + rand() * 0.5,
    phase: rand() * Math.PI * 2,
  }));
  return (
    <AbsoluteFill>
      {particles.map((p, i) => {
        const y = (((p.y - frame * p.speed) % height) + height) % height;
        const cyclesForLoop = Math.max(1, Math.round(durationInFrames / 60));
        const twinkle =
          0.25 + 0.6 * (0.5 + 0.5 * Math.sin(p.phase + (frame / durationInFrames) * Math.PI * 2 * cyclesForLoop));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: y,
              width: p.size,
              height: p.size,
              borderRadius: 999,
              background: colors.accentText,
              opacity: twinkle,
              boxShadow: `0 0 ${p.size * 3}px rgba(127,159,255,0.6)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const OpenSource: React.FC<z.infer<typeof openSourceSchema>> = ({
  heading,
  kicker,
  particleSeed,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const markIn = pop({ frame, fps, delay: 2 });
  const headIn = enter({ frame, fps, delay: 12 });
  const starIn = pop({ frame, fps, delay: 40 });
  const cmdIn = enter({ frame, fps, delay: 54 });
  const starPulse = 1 + Math.sin((frame / 40) * Math.PI * 2) * 0.03;
  const starSpin = interpolate(frame, [40, 70], [-180, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Stage glowY="26%">
      <Particles seed={particleSeed} />
      <AbsoluteFill
        style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 30 }}
      >
        <div style={{ transform: `scale(${markIn})` }}>
          <Logomark size={84} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1.08,
              opacity: headIn,
              transform: `translateY(${interpolate(headIn, [0, 1], [30, 0])}px)`,
              background: `linear-gradient(110deg, ${colors.fg} 20%, ${colors.accentText} 55%, ${colors.fg} 85%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {heading}
          </div>
          <div style={{ marginTop: 16, opacity: headIn }}>
            <Badge delay={16}>{kicker}</Badge>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 26px",
              borderRadius: 12,
              background: colors.fg,
              color: "#0b1020",
              fontSize: 21,
              fontWeight: 700,
              transform: `scale(${Math.min(1, starIn) * starPulse})`,
              boxShadow: "0 14px 40px rgba(248,250,252,0.18)",
            }}
          >
            <svg
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="#0b1020"
              style={{ transform: `rotate(${starSpin}deg)` }}
            >
              <path d="M12 1.75l3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3 1.2-6.9-5-4.9 6.9-1z" />
            </svg>
            Star on GitHub
          </div>
          <div
            style={{
              padding: "14px 24px",
              borderRadius: 12,
              border: `1px solid ${colors.borderStrong}`,
              background: colors.surface,
              fontFamily: monoFamily,
              fontSize: 19,
              color: colors.fgSecondary,
              opacity: cmdIn,
              transform: `translateY(${interpolate(cmdIn, [0, 1], [14, 0])}px)`,
            }}
          >
            <span style={{ color: colors.success }}>❯ </span>
            npx shadcn add {brand.domain}/r/…
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 26,
            fontSize: 19,
            fontWeight: 600,
            color: colors.muted,
            opacity: cmdIn,
          }}
        >
          <span style={{ color: colors.accentText }}>{brand.domain}</span>
          <span>·</span>
          <span>{brand.github}</span>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};
