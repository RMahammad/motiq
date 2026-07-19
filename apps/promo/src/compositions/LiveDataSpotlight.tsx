import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

import { copy } from "../campaign";
import { DataDashboard } from "../scenes/DataScene";
import { enter } from "../theme/anim";
import { Atmosphere, Headline, Kicker, PromoRoot, Rise } from "../theme/stage";

/**
 * LiveDataSpotlight — 1080×1080 · 30 fps · 210 frames (7 s).
 * Promotes the Data Motion Pack: stable dashboard → refresh → new data →
 * KPIs morph, rows reorder → stable again.
 */
export const LiveDataSpotlight: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <PromoRoot>
      <Atmosphere />
      <AbsoluteFill style={{ padding: "64px 64px 72px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Rise>
            <Kicker>{copy.data.kicker}</Kicker>
          </Rise>
        </div>
        <Rise delay={2} style={{ marginTop: 18 }}>
          <Headline size={46} style={{ opacity: enter({ frame, fps, delay: 4 }) }}>
            {copy.data.headline}
          </Headline>
        </Rise>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 0,
            paddingTop: 20,
          }}
        >
          <Rise delay={6} style={{ width: "100%" }}>
            <DataDashboard beats={{ refreshStart: 55, refreshEnd: 150 }} width={952} />
          </Rise>
        </div>
      </AbsoluteFill>
    </PromoRoot>
  );
};
