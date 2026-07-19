import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

import { brand, claims, installCommand } from "../campaign";
import { enter, inOut, ramp, rampE } from "../theme/anim";
import { Headline, InstallChip, Support, Wordmark } from "../theme/stage";
import { TopologyBackdrop } from "./TopologyBackdrop";

/** Centered brand lockup — the hero's frame 0 and its loop target. */
const BrandLockup: React.FC<{ opacity?: number; scale?: number; size?: number }> = ({
  opacity = 1,
  scale = 1,
  size = 76,
}) => (
  <AbsoluteFill
    style={{
      alignItems: "center",
      justifyContent: "center",
      opacity,
      transform: `scale(${scale})`,
    }}
  >
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
      <Wordmark size={size} />
      <Headline size={42} style={{ textAlign: "center" }}>
        {brand.tagline}
      </Headline>
    </div>
  </AbsoluteFill>
);

/**
 * Hero intro: the lockup is already on screen at frame 0 (the outro hands it
 * back for a seamless loop), settles 1.5% with the house easing, and holds
 * long enough to read while the backdrop's Trigger/Ingest columns activate.
 * No cinematic logo reveal by design.
 */
export const IntroScene: React.FC<{
  absFrame: number;
  backdropPeriod: number;
  backdrop?: boolean;
}> = ({ absFrame, backdropPeriod, backdrop = true }) => {
  const frame = useCurrentFrame();
  const settle = rampE(frame, 0, 18);
  return (
    <AbsoluteFill>
      {backdrop ? <TopologyBackdrop frame={absFrame} period={backdropPeriod} /> : null}
      <BrandLockup scale={1.015 - settle * 0.015} />
    </AbsoluteFill>
  );
};

/** Phase boundaries the outro needs (local start-of-phase frames). */
export interface OutroPhaseAt {
  enter: number;
  claims: number;
  install: number;
  assembled: number;
  copyOut: number;
  lockupIn: number;
  lockupHold: number;
}

/**
 * Hero outro, phase-driven: claims reveal progressively → install command
 * types and stays fully visible through the assembled hold → copy clears →
 * the lockup returns to exactly the intro pose and holds for the loop.
 */
export const OutroScene: React.FC<{
  absFrame: number;
  backdropPeriod: number;
  at: OutroPhaseAt;
  backdrop?: boolean;
}> = ({ absFrame, backdropPeriod, at, backdrop = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Copy fades during copyOut and is fully gone before the lockup returns.
  const copyOpacity = inOut(frame, at.enter, at.lockupIn - 2, 6, 10);
  const lockupIn = rampE(frame, at.lockupIn, at.lockupHold - 2);

  const lines = [claims.components, claims.packs, claims.source];

  return (
    <AbsoluteFill>
      {backdrop ? <TopologyBackdrop frame={absFrame} period={backdropPeriod} /> : null}
      <AbsoluteFill
        style={{ alignItems: "center", justifyContent: "center", opacity: copyOpacity }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            {lines.map((line, i) => {
              const p = enter({ frame, fps, delay: at.claims + i * 8 });
              return (
                <div
                  key={line}
                  style={{ opacity: p, transform: `translateY(${(1 - p) * 12}px)` }}
                >
                  <Headline size={36} style={{ textAlign: "center" }}>
                    {line}
                  </Headline>
                </div>
              );
            })}
          </div>
          <div style={{ opacity: enter({ frame, fps, delay: at.install }), marginTop: 4 }}>
            <InstallChip
              command={installCommand}
              progress={ramp(frame, at.install, at.assembled - 2)}
              fontSize={18}
            />
          </div>
          <div
            style={{
              opacity: enter({ frame, fps, delay: at.install + 8 }),
              textAlign: "center",
            }}
          >
            <Headline size={31} style={{ color: "var(--color-accent-text)" }}>
              {claims.license}
            </Headline>
            <div style={{ marginTop: 6 }}>
              <Support size={17}>{claims.licenseSub}</Support>
            </div>
          </div>
        </div>
      </AbsoluteFill>
      <BrandLockup opacity={lockupIn} />
    </AbsoluteFill>
  );
};
