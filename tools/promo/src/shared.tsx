import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fontFamily } from "./theme";
import { enter } from "./helpers";

/** Dark stage: base color, faint blueprint grid, and a slow-breathing accent glow. */
export const Stage: React.FC<{ children: React.ReactNode; glowX?: string; glowY?: string }> = ({
  children,
  glowX = "50%",
  glowY = "18%",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  // Full sine cycles over the composition so the loop point is seamless.
  const cycles = Math.max(1, Math.round(durationInFrames / (fps * 6)));
  const breathe = Math.sin((frame / durationInFrames) * Math.PI * 2 * cycles);
  const glowOpacity = 0.5 + breathe * 0.12;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, fontFamily, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${colors.border} 1px, transparent 1px), linear-gradient(90deg, ${colors.border} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          opacity: 0.16,
          maskImage: "radial-gradient(ellipse 90% 80% at 50% 40%, black 30%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 40%, black 30%, transparent 78%)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 55% 42% at ${glowX} ${glowY}, rgba(79,124,255,0.22), transparent 70%)`,
          opacity: glowOpacity,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

/** Motiq logomark: rounded square with a motion-trail "M" pulse. */
export const Logomark: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.28,
      background: `linear-gradient(135deg, ${colors.accent}, #315fea)`,
      boxShadow: `0 0 ${size * 0.6}px rgba(79,124,255,0.45), inset 0 1px 0 rgba(255,255,255,0.25)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 18V7.5L9.5 14L15 7.5V18"
        stroke="#fff"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={19.5} cy={16.5} r={1.8} fill="#fff" />
    </svg>
  </div>
);

/** Small pill badge used for kickers ("60+ components", "Free & open source"…). */
export const Badge: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enter({ frame, fps, delay });
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 18px",
        borderRadius: 999,
        border: `1px solid ${colors.borderStrong}`,
        background: colors.accentSoft,
        color: colors.accentText,
        fontSize: 20,
        fontWeight: 600,
        letterSpacing: 0.3,
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [14, 0])}px)`,
      }}
    >
      {children}
    </div>
  );
};

/** macOS-style window chrome for terminal / code panels. */
export const Window: React.FC<{
  title: string;
  width: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ title, width, children, style }) => (
  <div
    style={{
      width,
      borderRadius: 16,
      border: `1px solid ${colors.borderStrong}`,
      background: colors.bgElevated,
      boxShadow: "0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03) inset",
      overflow: "hidden",
      ...style,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "14px 18px",
        borderBottom: `1px solid ${colors.border}`,
        background: colors.surface,
      }}
    >
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
        <div key={c} style={{ width: 13, height: 13, borderRadius: 999, background: c }} />
      ))}
      <div
        style={{
          flex: 1,
          textAlign: "center",
          color: colors.muted,
          fontSize: 16,
          fontWeight: 500,
          marginRight: 55,
        }}
      >
        {title}
      </div>
    </div>
    {children}
  </div>
);
