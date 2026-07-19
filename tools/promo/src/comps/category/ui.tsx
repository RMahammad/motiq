import React from "react";
import { colors } from "../../theme";

/** Skeleton text bar. */
export const Skel: React.FC<{
  w: number;
  h?: number;
  tone?: "accent" | "muted" | "bright";
  style?: React.CSSProperties;
}> = ({ w, h = 8, tone = "muted", style }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: h / 2,
      background:
        tone === "accent" ? colors.accentText : tone === "bright" ? colors.fgSecondary : colors.surfaceStrong,
      opacity: tone === "accent" ? 0.9 : 1,
      ...style,
    }}
  />
);

/** Panel container used inside tiles. */
export const Panel: React.FC<{
  width: number;
  children: React.ReactNode;
  glow?: number;
  style?: React.CSSProperties;
}> = ({ width, children, glow = 0, style }) => (
  <div
    style={{
      width,
      borderRadius: 14,
      border: `1px solid ${colors.borderStrong}`,
      background: colors.bgElevated,
      padding: 16,
      boxShadow: glow > 0 ? `0 0 ${26 * glow}px rgba(79,124,255,${0.35 * glow})` : "0 10px 26px rgba(0,0,0,0.35)",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Small status chip. */
export const Chip: React.FC<{
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, color = colors.accentText, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "5px 12px",
      borderRadius: 999,
      border: `1px solid ${colors.borderStrong}`,
      background: colors.surface,
      color,
      fontSize: 14,
      fontWeight: 700,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Progress bar with animated fill (0..1). */
export const Bar: React.FC<{ value: number; width: number; color?: string }> = ({
  value,
  width,
  color = colors.accent,
}) => (
  <div
    style={{
      width,
      height: 8,
      borderRadius: 4,
      background: colors.surfaceStrong,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: `${Math.min(1, Math.max(0, value)) * 100}%`,
        height: "100%",
        borderRadius: 4,
        background: `linear-gradient(90deg, ${color}, ${colors.accentHover})`,
      }}
    />
  </div>
);

/** Circular check badge with draw progress (0..1). */
export const CheckDot: React.FC<{ p: number; size?: number; color?: string }> = ({
  p,
  size = 26,
  color = colors.success,
}) => {
  const len = 26;
  const c = Math.min(1, Math.max(0, p));
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: c > 0 ? color : colors.surfaceStrong,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${0.6 + c * 0.4})`,
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path
          d="M4.5 12.5l5 5L19.5 7"
          stroke="#0b1020"
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - c)}
        />
      </svg>
    </div>
  );
};

/** Deterministic spinner glyph. */
export const spinnerGlyph = (frame: number): string =>
  ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧"][Math.floor(frame / 4) % 8];

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
