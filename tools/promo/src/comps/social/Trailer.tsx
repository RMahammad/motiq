import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { enter, pop } from "../../helpers";
import { brand, colors, monoFamily } from "../../theme";
import { Badge, Logomark, Stage } from "../../shared";
import { Install, installDefaults } from "../Install";
import { Pillars, pillarsDefaults } from "../Pillars";
import { OpenSource, openSourceDefaults } from "../OpenSource";
import { categories } from "../category";
import { TopologyFieldDemo } from "../category/demos-backgrounds";

export const trailerSchema = z.object({
  hook: z.string(),
  hookSub: z.string(),
});

export const trailerDefaults: z.infer<typeof trailerSchema> = {
  hook: "Stop building UI animation from scratch.",
  hookSub: "Motiq — animated React & shadcn components, free & open source.",
};

// X autoplays muted: every scene must carry its message as on-screen text,
// and the product must be moving from frame 0 (no logo cold-open).
const HOOK_LEN = 80;
const MONTAGE_IDS = ["motiq-cat-ai", "motiq-cat-data-motion", "motiq-cat-collaboration", "motiq-cat-commerce"];
const MONTAGE_LEN = 90;
const INSTALL_LEN = 200;
const PILLARS_LEN = 150;
const OUTRO_LEN = 165;

export const TRAILER_DURATION =
  HOOK_LEN + MONTAGE_IDS.length * MONTAGE_LEN + INSTALL_LEN + PILLARS_LEN + OUTRO_LEN;

/** Wraps a 1200x675 composition and scales it to the 1280x720 trailer canvas. */
const Scaled: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill>
    <div style={{ width: 1200, height: 675, position: "relative", transform: "scale(1.0667)", transformOrigin: "top left" }}>
      {children}
    </div>
  </AbsoluteFill>
);

const HookScene: React.FC<{ hook: string; hookSub: string }> = ({ hook, hookSub }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = hook.split(" ");
  const subIn = enter({ frame, fps, delay: 26 });
  const markIn = pop({ frame, fps, delay: 2 });
  return (
    <Stage glowY="42%">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 0.4 }}>
        <div style={{ transform: "scale(2.6)" }}>
          <TopologyFieldDemo />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 34, padding: "0 120px" }}>
        <div style={{ transform: `scale(${markIn})` }}>
          <Logomark size={72} />
        </div>
        <div style={{ textAlign: "center", fontSize: 66, fontWeight: 800, letterSpacing: -2, lineHeight: 1.15, color: colors.fg }}>
          {words.map((w, i) => {
            const p = enter({ frame, fps, delay: 6 + i * 3 });
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  marginRight: 16,
                  opacity: p,
                  transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px)`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
        <div
          style={{
            fontSize: 27,
            fontWeight: 500,
            color: colors.fgSecondary,
            opacity: subIn,
            transform: `translateY(${interpolate(subIn, [0, 1], [16, 0])}px)`,
          }}
        >
          {hookSub}
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cmdIn = enter({ frame, fps, delay: 70 });
  return (
    <AbsoluteFill>
      <Scaled>
        <OpenSource {...openSourceDefaults} />
      </Scaled>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 34 }}>
        <div
          style={{
            fontFamily: monoFamily,
            fontSize: 20,
            color: colors.muted,
            opacity: cmdIn,
          }}
        >
          {brand.github}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Trailer: React.FC<z.infer<typeof trailerSchema>> = ({ hook, hookSub }) => {
  const montage = MONTAGE_IDS.map((id) => categories.find((c) => c.id === id)).filter(
    (c): c is NonNullable<typeof c> => c !== undefined,
  );
  let at = 0;
  const seq = (len: number) => {
    const from = at;
    at += len;
    return from;
  };
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      <Sequence from={seq(HOOK_LEN)} durationInFrames={HOOK_LEN}>
        <HookScene hook={hook} hookSub={hookSub} />
      </Sequence>
      {montage.map((cat) => (
        <Sequence key={cat.id} from={seq(MONTAGE_LEN)} durationInFrames={MONTAGE_LEN}>
          <Scaled>
            <cat.component {...cat.defaults} />
          </Scaled>
        </Sequence>
      ))}
      <Sequence from={seq(INSTALL_LEN)} durationInFrames={INSTALL_LEN}>
        <Scaled>
          <Install {...installDefaults} />
        </Scaled>
      </Sequence>
      <Sequence from={seq(PILLARS_LEN)} durationInFrames={PILLARS_LEN}>
        <Scaled>
          <Pillars {...pillarsDefaults} />
        </Scaled>
      </Sequence>
      <Sequence from={seq(OUTRO_LEN)} durationInFrames={OUTRO_LEN}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
