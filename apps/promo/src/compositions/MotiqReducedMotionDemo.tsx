import React from "react";
import { AbsoluteFill } from "remotion";

import { copy } from "../campaign";
import { PipelinePanel } from "../scenes/PipelineScene";
import { Headline, Kicker, PromoRoot, Support } from "../theme/stage";

/**
 * MotiqReducedMotionDemo — 1200×675 · 210 frames (7 s).
 * The same deployment story with ZERO promo choreography: no springs, no
 * fades, no drift. What remains is the library's real reduced-motion
 * contract — every state lands as an instant, fully-communicated cut
 * (icon + text + color, never color alone).
 */
export const MotiqReducedMotionDemo: React.FC = () => (
  <PromoRoot>
    <AbsoluteFill style={{ flexDirection: "row", padding: "48px 64px", gap: 44 }}>
      <div
        style={{
          flex: "0 0 34%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 18,
        }}
      >
        <Kicker>{copy.reduced.kicker}</Kicker>
        <Headline size={40}>{copy.reduced.headline}</Headline>
        <Support size={19}>
          States change with icons, text, and color — never color alone. This
          demo runs the components&apos; actual reduced-motion path.
        </Support>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <PipelinePanel
          beats={{
            buildDone: 25,
            testFail: 55,
            logsOpen: 70,
            retryFocus: 95,
            retryGo: 120,
            testPass: 150,
            deployDone: 175,
          }}
          width={640}
        />
      </div>
    </AbsoluteFill>
  </PromoRoot>
);
