import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";

import { copy, formats, installCommandPipeline } from "../campaign";
import { PipelinePanel } from "../scenes/PipelineScene";
import { enter, inOut } from "../theme/anim";
import { Atmosphere, Headline, InstallChip, Kicker, PromoRoot, Rise, SceneShell, Support } from "../theme/stage";

/**
 * DeploymentPipelineSpotlight — 1200×675 · 30 fps · 240 frames (8 s).
 * Full arc: build passes → tests fail (icon + text + color) → logs → keyboard
 * focus on Retry → retry → success. Ends on the pack's two copy lines.
 */
export const DeploymentPipelineSpotlight: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const D = formats.pipeline.durationInFrames;
  const storyEnd = 205;

  const copyOpacity = enter({ frame, fps, delay: storyEnd - 8 });
  const storyOpacity = inOut(frame, 0, storyEnd + 10, 0, 12);

  return (
    <PromoRoot>
      <Atmosphere />

      <AbsoluteFill style={{ opacity: storyOpacity, padding: "36px 56px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Rise>
            <Kicker>{copy.pipeline.kicker}</Kicker>
          </Rise>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 0,
          }}
        >
          <Rise delay={2}>
            <PipelinePanel
              beats={{
                buildDone: 28,
                testFail: 62,
                logsOpen: 78,
                retryFocus: 108,
                retryGo: 136,
                testPass: 168,
                deployDone: 192,
              }}
              width={700}
            />
          </Rise>
        </div>
      </AbsoluteFill>

      <Sequence from={storyEnd} durationInFrames={D - storyEnd} name="End copy">
        <SceneShell duration={D - storyEnd} fadeIn={0} fadeOut={0} drift={0}>
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: copyOpacity }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <Headline size={52}>{copy.pipeline.headline}</Headline>
              <Headline size={34} style={{ color: "var(--color-accent-text)" }}>
                {copy.pipeline.support}
              </Headline>
              <div style={{ marginTop: 10 }}>
                <InstallChip command={installCommandPipeline} fontSize={17} />
              </div>
            </div>
          </AbsoluteFill>
        </SceneShell>
      </Sequence>
    </PromoRoot>
  );
};
