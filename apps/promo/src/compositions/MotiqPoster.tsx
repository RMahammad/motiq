import React from "react";
import { AbsoluteFill } from "remotion";

import { brand, claims, installCommand } from "../campaign";
import { PipelinePanel } from "../scenes/PipelineScene";
import { TopologyBackdrop } from "../scenes/TopologyBackdrop";
import { Atmosphere, Headline, InstallChip, PromoRoot, Support, Wordmark } from "../theme/stage";

/**
 * MotiqPoster — 1200×675 poster frame (render with `remotion still --scale=2`
 * for a 2400×1350 PNG). Everything is settled state; no motion required.
 */
export const MotiqPoster: React.FC = () => (
  <PromoRoot>
    <TopologyBackdrop frame={150} period={225} opacity={0.35} showLabels={false} />
    <Atmosphere glow={0.65} />
    <AbsoluteFill style={{ flexDirection: "row", padding: "56px 64px", gap: 40 }}>
      <div
        style={{
          flex: "0 0 46%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 22,
        }}
      >
        <Wordmark size={58} />
        <Headline size={44}>{brand.tagline}</Headline>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[claims.components, claims.packs, claims.source].map((line) => (
            <Support key={line} size={21}>
              <span style={{ color: "var(--color-accent-text)", marginRight: 10 }}>—</span>
              {line}
            </Support>
          ))}
        </div>
        <InstallChip command={installCommand} fontSize={15.5} />
        <Headline size={26} style={{ color: "var(--color-accent-text)" }}>
          {claims.license}
        </Headline>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Settled success state: every beat is in the past at frame 0. */}
        <PipelinePanel
          beats={{
            buildDone: -100,
            testFail: -90,
            logsOpen: -80,
            retryFocus: -70,
            retryGo: -60,
            testPass: -50,
            deployDone: -40,
          }}
          width={440}
        />
      </div>
    </AbsoluteFill>
  </PromoRoot>
);
