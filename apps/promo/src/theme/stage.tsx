import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

import { brand, safeArea, type LayoutKind } from "../campaign";
import { enter, ramp, rampE } from "./anim";
import { monoFamily, sansFamily } from "./fonts";

/**
 * Root stage: real Motiq dark theme (tokens cascade from
 * packages/tokens/styles.css via [data-theme]) + deterministic promo CSS.
 */
export const PromoRoot: React.FC<{
  children: React.ReactNode;
  theme?: "dark" | "light";
}> = ({ children, theme = "dark" }) => (
  <AbsoluteFill
    data-theme={theme}
    className={`motiq-promo ${theme === "dark" ? "dark" : ""}`}
    style={{
      backgroundColor: "var(--color-bg)",
      color: "var(--color-fg)",
      fontFamily: sansFamily,
      // Override the token font stacks so registry components render Inter /
      // JetBrains Mono identically on every machine.
      ["--font-sans" as never]: sansFamily,
      ["--font-mono" as never]: monoFamily,
      overflow: "hidden",
    }}
  >
    {children}
  </AbsoluteFill>
);

/** Safe-margin content frame per output layout. */
export const Safe: React.FC<{
  layout: LayoutKind;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ layout, children, style }) => {
  const m = safeArea[layout];
  return (
    <AbsoluteFill
      style={{
        paddingLeft: m.x,
        paddingRight: m.x,
        paddingTop: m.top,
        paddingBottom: m.bottom,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Subtle depth: faint top glow + edge vignette. Restrained by design. */
export const Atmosphere: React.FC<{ glow?: number }> = ({ glow = 0.5 }) => (
  <>
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 60% 42% at 50% 12%, var(--color-card-glow), transparent 72%)",
        opacity: glow,
      }}
    />
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 120% 100% at 50% 50%, transparent 62%, rgba(0,3,10,0.42) 100%)",
      }}
    />
  </>
);

/** Spring entrance wrapper: fade + rise + settle. */
export const Rise: React.FC<{
  delay?: number;
  distance?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, distance = 16, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enter({ frame, fps, delay });
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * distance}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Console-style window chrome around a component panel (decorative). */
export const Window: React.FC<{
  title: string;
  meta?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  padding?: number;
}> = ({ title, meta, children, style, padding = 16 }) => (
  <div
    style={{
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--color-border)",
      background: "var(--color-bg-secondary)",
      boxShadow: "var(--shadow-md)",
      overflow: "hidden",
      ...style,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        borderBottom: "1px solid var(--color-border)",
        padding: "10px 16px",
      }}
    >
      <span style={{ display: "flex", gap: 6 }} aria-hidden>
        {(["--color-error", "--color-warning", "--color-success"] as const).map((v) => (
          <span
            key={v}
            style={{
              height: 10,
              width: 10,
              borderRadius: 999,
              background: `var(${v})`,
              opacity: 0.7,
            }}
          />
        ))}
      </span>
      <span
        style={{
          marginLeft: 4,
          fontFamily: monoFamily,
          fontSize: 12.5,
          color: "var(--color-muted)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {title}
      </span>
      {meta ? (
        <span
          style={{
            marginLeft: "auto",
            fontFamily: monoFamily,
            fontSize: 11.5,
            color: "var(--color-muted)",
            flexShrink: 0,
          }}
        >
          {meta}
        </span>
      ) : null}
    </div>
    <div style={{ padding }}>{children}</div>
  </div>
);

/** Pack/category kicker chip. */
export const Kicker: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      borderRadius: 999,
      border: "1px solid var(--color-border-strong)",
      background: "var(--color-surface)",
      padding: "6px 14px",
      fontSize: 15,
      fontWeight: 600,
      letterSpacing: 0.4,
      color: "var(--color-accent-text)",
      textTransform: "uppercase",
    }}
  >
    <span
      aria-hidden
      style={{
        width: 7,
        height: 7,
        borderRadius: 999,
        background: "var(--color-accent)",
      }}
    />
    {children}
  </span>
);

/** Single primary headline — large enough to survive GIF compression. */
export const Headline: React.FC<{
  children: React.ReactNode;
  size?: number;
  style?: React.CSSProperties;
}> = ({ children, size = 46, style }) => (
  <h1
    style={{
      margin: 0,
      fontSize: size,
      lineHeight: 1.12,
      fontWeight: 700,
      letterSpacing: -0.8,
      color: "var(--color-fg)",
      textWrap: "balance",
      ...style,
    }}
  >
    {children}
  </h1>
);

export const Support: React.FC<{ children: React.ReactNode; size?: number }> = ({
  children,
  size = 21,
}) => (
  <p
    style={{
      margin: 0,
      fontSize: size,
      lineHeight: 1.4,
      color: "var(--color-fg-secondary)",
    }}
  >
    {children}
  </p>
);

/** Motiq wordmark: rounded logomark + name. Kept small and quiet. */
export const Wordmark: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.32 }}>
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background:
          "linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end))",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 800,
        fontSize: size * 0.52,
        letterSpacing: -0.5,
        boxShadow: "var(--shadow-md)",
      }}
    >
      M
    </span>
    <span
      style={{
        fontSize: size * 0.62,
        fontWeight: 700,
        letterSpacing: -0.6,
        color: "var(--color-fg)",
      }}
    >
      {brand.name}
    </span>
  </span>
);

/** Mono install-command chip with a block caret typed on by frame. */
export const InstallChip: React.FC<{
  command: string;
  /** 0–1 typing progress; 1 = fully typed. */
  progress?: number;
  fontSize?: number;
}> = ({ command, progress = 1, fontSize = 19 }) => {
  const chars = Math.round(command.length * Math.min(1, Math.max(0, progress)));
  const text = command.slice(0, chars);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border-strong)",
        background: "var(--color-code-bg)",
        padding: "13px 20px",
        fontFamily: monoFamily,
        fontSize,
        color: "var(--color-code-fg)",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ color: "var(--color-success)", fontWeight: 600 }}>$</span>
      <span>
        {text}
        {chars < command.length ? (
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: Math.max(8, fontSize * 0.48),
              height: fontSize * 1.05,
              verticalAlign: "text-bottom",
              marginLeft: 2,
              background: "var(--color-accent)",
            }}
          />
        ) : null}
      </span>
    </span>
  );
};

/**
 * Scene shell used by every composition: fades/slides the scene in and out of
 * its Sequence window (eased, with a small rise + 0.97→1 settle) and applies a
 * very slow settle-zoom for depth (never a constant zoom).
 */
export const SceneShell: React.FC<{
  duration: number;
  children: React.ReactNode;
  fadeIn?: number;
  fadeOut?: number;
  drift?: number;
  /** Entrance rise in px and scale settle; 0 disables the transform. */
  rise?: number;
  /**
   * Opacity windows, when they should be SHORTER than the transform windows.
   * Overlapping scenes fade complementarily over the same span (in over the
   * first `opacityIn` frames, out over the last `opacityOut`), so combined
   * opacity stays ~1 and no near-empty frame appears mid-transition.
   */
  opacityIn?: number;
  opacityOut?: number;
}> = ({
  duration,
  children,
  fadeIn = 6,
  fadeOut = 6,
  drift = 0.012,
  rise = 0,
  opacityIn,
  opacityOut,
}) => {
  const frame = useCurrentFrame();
  const inWindow = opacityIn ?? fadeIn;
  const outWindow = opacityOut ?? fadeOut;
  const inP = fadeIn === 0 ? 1 : rampE(frame, 0, fadeIn);
  const outP = fadeOut === 0 ? 0 : rampE(frame, duration - fadeOut, duration);
  const oIn = inWindow === 0 ? 1 : rampE(frame, 0, inWindow);
  const oOut = outWindow === 0 ? 0 : rampE(frame, duration - outWindow, duration);
  const opacity = Math.min(oIn, 1 - oOut);
  // Enter 0.97→1, exit 1→0.97; small vertical travel both ways.
  const settle = rise > 0 ? 0.97 + 0.03 * Math.min(inP, 1 - outP) : 1;
  const scale = settle * (1 + ramp(frame, 0, duration) * drift);
  const translate = rise > 0 ? (1 - inP) * rise - outP * rise * 0.8 : 0;
  return (
    <AbsoluteFill style={{ opacity, transform: `translateY(${translate}px) scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
};

/**
 * README-hero scene heading: small pack label over one large readable
 * headline. Replaces the small top-right pill treatment.
 */
export const SceneHeading: React.FC<{
  pack: string;
  heading: string;
  delay?: number;
}> = ({ pack, heading, delay = 2 }) => {
  const frame = useCurrentFrame();
  const p = rampE(frame, delay, delay + 14);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 12}px)` }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13.5,
          fontWeight: 700,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: "var(--color-accent-text)",
          marginBottom: 8,
        }}
      >
        <span
          aria-hidden
          style={{ width: 7, height: 7, borderRadius: 999, background: "var(--color-accent)" }}
        />
        {pack}
      </div>
      <Headline size={34}>{heading}</Headline>
    </div>
  );
};

/** Center-anchored zoom for a component panel (layout box is unscaled). */
export const Zoom: React.FC<{
  factor: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ factor, children, style }) => (
  <div style={{ transform: `scale(${factor})`, transformOrigin: "center", ...style }}>
    {children}
  </div>
);
