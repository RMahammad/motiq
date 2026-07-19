import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";

import { claims, copy, installCommand, packs } from "../campaign";
import { StreamShot, TimelineShot } from "../scenes/AgentScene";
import { DataDashboard } from "../scenes/DataScene";
import { PipelinePanel } from "../scenes/PipelineScene";
import { enter, ramp } from "../theme/anim";
import { Atmosphere, Headline, InstallChip, Kicker, PromoRoot, Rise, SceneShell, Support, Wordmark } from "../theme/stage";

/** Vertical shot: kicker + big panel; copy strap near the bottom safe area. */
const VShot: React.FC<{ kicker: string; children: React.ReactNode }> = ({
  kicker,
  children,
}) => (
  <AbsoluteFill style={{ padding: "150px 70px 240px" }}>
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
        minHeight: 0,
      }}
    >
      <Rise>
        <Kicker>{kicker}</Kicker>
      </Rise>
      {children}
    </div>
  </AbsoluteFill>
);

/**
 * MotiqSocialVertical — 1080×1920 · 30 fps · 300 frames (10 s).
 * Redesigned for vertical viewing (not a crop): a working component is on
 * screen from the very first frame; copy closes the loop.
 */
export const MotiqSocialVertical: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <PromoRoot>
      <Atmosphere />

      <Sequence from={0} durationInFrames={80} name="Pipeline">
        <SceneShell duration={80} fadeIn={0}>
          <VShot kicker={packs.developerTools}>
            {/* transform doesn't grow the layout box — margin reserves room. */}
            <div style={{ transform: "scale(1.28)", transformOrigin: "center", margin: "90px 0" }}>
              <PipelinePanel
                beats={{ buildDone: 8, testFail: 26, logsOpen: 36, retryFocus: 50, retryGo: 64 }}
                width={700}
              />
            </div>
          </VShot>
        </SceneShell>
      </Sequence>

      <Sequence from={80} durationInFrames={90} name="Agent">
        <SceneShell duration={90}>
          <VShot kicker={packs.ai}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 24,
                width: "100%",
                alignItems: "center",
                transform: "scale(1.04)",
              }}
            >
              <TimelineShot
                width={900}
                beats={{
                  promptStart: -20,
                  promptSubmit: -10,
                  runStart: 0,
                  toolMetricsDone: 20,
                  toolDeploysDone: 38,
                  approvalAsk: 38,
                  approvalOk: 54,
                  streamStart: 56,
                  streamEnd: 84,
                }}
              />
              <StreamShot
                beats={{
                  promptStart: -20,
                  promptSubmit: -10,
                  runStart: 0,
                  toolMetricsDone: 20,
                  toolDeploysDone: 38,
                  approvalAsk: 38,
                  approvalOk: 54,
                  streamStart: 56,
                  streamEnd: 84,
                }}
                width={900}
              />
            </div>
          </VShot>
        </SceneShell>
      </Sequence>

      <Sequence from={170} durationInFrames={70} name="Data">
        <SceneShell duration={70}>
          <VShot kicker={packs.dataMotion}>
            <DataDashboard beats={{ refreshStart: 10, refreshEnd: 52 }} width={940} />
          </VShot>
        </SceneShell>
      </Sequence>

      <Sequence from={240} durationInFrames={60} name="Outro">
        <SceneShell duration={60} fadeOut={0}>
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 90px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26, textAlign: "center" }}>
              <Wordmark size={64} />
              <Headline size={52} style={{ opacity: enter({ frame, fps, delay: 244 }) }}>
                {copy.vertical.headline}
              </Headline>
              <Headline
                size={36}
                style={{ color: "var(--color-accent-text)", opacity: enter({ frame, fps, delay: 250 }) }}
              >
                {copy.vertical.support}
              </Headline>
              <div style={{ opacity: enter({ frame, fps, delay: 256 }) }}>
                <InstallChip
                  command={installCommand}
                  progress={ramp(frame, 256, 272)}
                  fontSize={17}
                />
              </div>
              <div style={{ opacity: enter({ frame, fps, delay: 262 }) }}>
                <Support size={22}>
                  {claims.license} {claims.licenseSub}
                </Support>
              </div>
            </div>
          </AbsoluteFill>
        </SceneShell>
      </Sequence>
    </PromoRoot>
  );
};
