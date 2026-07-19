import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { enter } from "../../helpers";
import { colors } from "../../theme";
import { Badge, Stage } from "../../shared";

export const categorySchema = z.object({
  kicker: z.string(),
  heading: z.string(),
  sub: z.string(),
});

export type CategoryText = z.infer<typeof categorySchema>;

export type CategoryTile = {
  /** Real catalog component name — shown in the tile's label bar. */
  label: string;
  demo: React.FC;
};

export const CatTile: React.FC<{ tile: CategoryTile; delay: number }> = ({ tile, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = enter({ frame, fps, delay });
  const Demo = tile.demo;
  return (
    <div
      style={{
        width: 364,
        height: 384,
        borderRadius: 20,
        border: `1px solid ${colors.border}`,
        background: colors.surface,
        boxShadow: "0 18px 50px rgba(0,0,0,0.42)",
        overflow: "hidden",
        position: "relative",
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px) scale(${interpolate(p, [0, 1], [0.95, 1])})`,
      }}
    >
      <div
        style={{
          height: 328,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <Demo />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 20px",
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: 0.2,
          color: colors.fgSecondary,
          borderTop: `1px solid ${colors.border}`,
          background: colors.bgElevated,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: colors.accent,
            boxShadow: `0 0 10px ${colors.accent}`,
          }}
        />
        {tile.label}
      </div>
    </div>
  );
};

export const CategoryShowcase: React.FC<CategoryText & { tiles: CategoryTile[] }> = ({
  kicker,
  heading,
  sub,
  tiles,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headIn = enter({ frame, fps, delay: 4 });
  const subIn = enter({ frame, fps, delay: 12 });
  return (
    <Stage glowY="10%">
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 36 }}>
        <Badge delay={0}>{kicker}</Badge>
        <div
          style={{
            marginTop: 14,
            fontSize: 46,
            fontWeight: 800,
            letterSpacing: -1.4,
            color: colors.fg,
            opacity: headIn,
            transform: `translateY(${interpolate(headIn, [0, 1], [20, 0])}px)`,
          }}
        >
          {heading}
        </div>
        <div
          style={{
            marginTop: 8,
            marginBottom: 26,
            fontSize: 21,
            fontWeight: 500,
            color: colors.muted,
            opacity: subIn,
            transform: `translateY(${interpolate(subIn, [0, 1], [14, 0])}px)`,
          }}
        >
          {sub}
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {tiles.map((tile, i) => (
            <CatTile key={tile.label} tile={tile} delay={18 + i * 7} />
          ))}
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

/** Builds a registered-composition config from text + three tile demos. */
export const makeCategory = (
  id: string,
  defaults: CategoryText,
  tiles: CategoryTile[],
): {
  id: string;
  defaults: CategoryText;
  component: React.FC<CategoryText>;
} => ({
  id,
  defaults,
  component: (props: CategoryText) => <CategoryShowcase {...props} tiles={tiles} />,
});
