import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { enter } from "../helpers";
import { colors } from "../theme";
import { Badge, Stage } from "../shared";

export const showcaseSchema = z.object({
  heading: z.string(),
  kicker: z.string(),
});

export const showcaseDefaults: z.infer<typeof showcaseSchema> = {
  heading: "60+ production-ready components & blocks",
  kicker: "Explore the catalog",
};

const Tile: React.FC<{
  label: string;
  delay: number;
  children: React.ReactNode;
}> = ({ label, delay, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enter({ frame, fps, delay });
  return (
    <div
      style={{
        width: 344,
        height: 196,
        borderRadius: 18,
        border: `1px solid ${colors.border}`,
        background: colors.surface,
        boxShadow: "0 16px 44px rgba(0,0,0,0.4)",
        overflow: "hidden",
        position: "relative",
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [34, 0])}px) scale(${interpolate(p, [0, 1], [0.94, 1])})`,
      }}
    >
      <div style={{ height: 148, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "10px 18px",
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: 0.4,
          color: colors.muted,
          borderTop: `1px solid ${colors.border}`,
          background: colors.bgElevated,
        }}
      >
        {label}
      </div>
    </div>
  );
};

/** Cycle helper: local frame within a repeating window, offset so tiles desync. */
const cycle = (frame: number, period: number, offset = 0) => (frame + offset) % period;

const ButtonsDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = cycle(frame, 75);
  const press = spring({ frame: local - 30, fps, config: { damping: 14, stiffness: 300 }, durationInFrames: 20 });
  const scale = 1 - Math.sin(Math.min(1, Math.max(0, press)) * Math.PI) * 0.08;
  const ripple = interpolate(local, [34, 62], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          inset: -6,
          borderRadius: 16,
          border: `2px solid rgba(79,124,255,${0.5 * (1 - ripple)})`,
          transform: `scale(${1 + ripple * 0.35})`,
        }}
      />
      <div
        style={{
          padding: "14px 34px",
          borderRadius: 12,
          background: `linear-gradient(135deg, ${colors.accentHover}, #315fea)`,
          color: "#fff",
          fontSize: 20,
          fontWeight: 700,
          transform: `scale(${scale})`,
          boxShadow: "0 10px 30px rgba(79,124,255,0.45)",
        }}
      >
        Get started
      </div>
    </div>
  );
};

export const ToggleDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const period = 70;
  const phase = Math.floor(frame / period) % 2;
  const local = frame % period;
  const move = spring({ frame: local - 8, fps, config: { damping: 18, stiffness: 240 } });
  const on = phase === 0 ? move : 1 - move;
  return (
    <div
      style={{
        width: 92,
        height: 50,
        borderRadius: 999,
        padding: 5,
        background: `color-mix(in srgb, ${colors.accent} ${on * 100}%, ${colors.surfaceStrong})`,
        border: `1px solid ${colors.borderStrong}`,
        boxShadow: on > 0.5 ? "0 0 26px rgba(79,124,255,0.5)" : "none",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          background: "#fff",
          transform: `translateX(${on * 42}px)`,
          boxShadow: "0 3px 8px rgba(0,0,0,0.4)",
        }}
      />
    </div>
  );
};

export const ChartDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = [0.45, 0.75, 0.55, 0.95, 0.65, 0.85];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 96 }}>
      {bars.map((base, i) => {
        const wave = Math.sin((frame / 30) * Math.PI * 0.5 + i * 0.9) * 0.14;
        const h = Math.max(0.15, base + wave) * 96;
        return (
          <div
            key={i}
            style={{
              width: 26,
              height: h,
              borderRadius: 7,
              background:
                i === 3
                  ? `linear-gradient(180deg, ${colors.accentHover}, ${colors.accent})`
                  : colors.surfaceStrong,
              border: `1px solid ${i === 3 ? colors.accent : colors.borderStrong}`,
            }}
          />
        );
      })}
    </div>
  );
};

export const KanbanDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const period = 110;
  const phase = Math.floor(frame / period) % 2;
  const local = frame % period;
  const move = spring({ frame: local - 20, fps, config: { damping: 20, stiffness: 160 } });
  const x = phase === 0 ? move : 1 - move;
  const lift = Math.sin(Math.min(1, Math.max(0, x)) * Math.PI);
  return (
    <div style={{ display: "flex", gap: 16, position: "relative" }}>
      {[0, 1].map((col) => (
        <div
          key={col}
          style={{
            width: 128,
            height: 104,
            borderRadius: 12,
            border: `1px dashed ${colors.borderStrong}`,
            background: colors.bgElevated,
            padding: 8,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 6 }}>
            {col === 0 ? "IN PROGRESS" : "DONE"}
          </div>
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 8,
          width: 112,
          borderRadius: 9,
          background: colors.surfaceRaised,
          border: `1px solid ${colors.accent}`,
          padding: "9px 10px",
          transform: `translateX(${x * 144}px) translateY(${-lift * 12}px) rotate(${lift * 4}deg)`,
          boxShadow: `0 ${6 + lift * 14}px ${16 + lift * 18}px rgba(0,0,0,0.45)`,
        }}
      >
        <div style={{ width: 62, height: 8, borderRadius: 4, background: colors.accentText, opacity: 0.9 }} />
        <div style={{ width: 84, height: 7, borderRadius: 4, background: colors.surfaceStrong, marginTop: 7 }} />
      </div>
    </div>
  );
};

export const ComposerDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const dots = "Generating" + ".".repeat((Math.floor(frame / 14) % 3) + 1);
  const glow = 0.35 + Math.sin((frame / 45) * Math.PI * 2) * 0.15;
  return (
    <div
      style={{
        width: 280,
        borderRadius: 14,
        border: `1px solid ${colors.borderStrong}`,
        background: colors.bgElevated,
        padding: 14,
        boxShadow: `0 0 30px rgba(79,124,255,${glow * 0.4})`,
      }}
    >
      <div style={{ fontSize: 16, color: colors.fgSecondary, marginBottom: 12 }}>
        {dots}
        <span
          style={{
            display: "inline-block",
            width: 9,
            height: 18,
            marginLeft: 3,
            verticalAlign: "text-bottom",
            background: Math.floor(frame / 16) % 2 === 0 ? colors.accentText : "transparent",
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 7 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                border: `1px solid ${colors.borderStrong}`,
                background: colors.surface,
              }}
            />
          ))}
        </div>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: colors.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${1 + glow * 0.12})`,
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <path d="M5 12h13M13 6l6 6-6 6" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export const AvatarsDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tints = ["#7f9fff", "#34d399", "#fbbf24", "#f472b6", "#22d3ee"];
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {tints.map((tint, i) => {
        const period = 150;
        const local = (frame + 20 - i * 16 + period) % period;
        const p = spring({ frame: local, fps, config: { damping: 15, stiffness: 220 }, durationInFrames: 30 });
        const shown = Math.min(1, p);
        return (
          <div
            key={tint}
            style={{
              width: 52,
              height: 52,
              borderRadius: 999,
              marginLeft: i === 0 ? 0 : -14,
              background: `linear-gradient(135deg, ${tint}, ${colors.surfaceStrong})`,
              border: `3px solid ${colors.surface}`,
              transform: `scale(${0.4 + shown * 0.6})`,
              opacity: 0.25 + shown * 0.75,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 700,
              color: "#0b1020",
            }}
          >
            {String.fromCharCode(65 + i)}
          </div>
        );
      })}
      <div
        style={{
          marginLeft: 14,
          padding: "7px 14px",
          borderRadius: 999,
          background: colors.accentSoft,
          border: `1px solid ${colors.borderStrong}`,
          color: colors.accentText,
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        +24 online
      </div>
    </div>
  );
};

export const Showcase: React.FC<z.infer<typeof showcaseSchema>> = ({ heading, kicker }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headIn = enter({ frame, fps, delay: 4 });
  const tiles: Array<{ label: string; node: React.ReactNode }> = [
    { label: "Buttons & CTAs", node: <ButtonsDemo /> },
    { label: "Switches & inputs", node: <ToggleDemo /> },
    { label: "Charts & data", node: <ChartDemo /> },
    { label: "Kanban & boards", node: <KanbanDemo /> },
    { label: "AI & chat", node: <ComposerDemo /> },
    { label: "Presence & avatars", node: <AvatarsDemo /> },
  ];
  return (
    <Stage glowY="12%">
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 44 }}>
        <Badge delay={0}>{kicker}</Badge>
        <div
          style={{
            marginTop: 18,
            marginBottom: 30,
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: -1.5,
            color: colors.fg,
            opacity: headIn,
            transform: `translateY(${interpolate(headIn, [0, 1], [22, 0])}px)`,
          }}
        >
          {heading}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 344px)",
            gap: 22,
          }}
        >
          {tiles.map((tile, i) => (
            <Tile key={tile.label} label={tile.label} delay={16 + i * 6}>
              {tile.node}
            </Tile>
          ))}
        </div>
      </AbsoluteFill>
    </Stage>
  );
};
