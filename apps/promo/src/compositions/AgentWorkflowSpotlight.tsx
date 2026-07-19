import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";

import { SourceCitationRail, CitationMarker } from "@/registry/ai/source-citation-rail";

import type { AgentBeats } from "../adapters/agent";
import { copy, installCommand } from "../campaign";
import { RAIL_SOURCES } from "../data/agent";
import { ComposerShot, StreamShot, TimelineActivityShot } from "../scenes/AgentScene";
import { enter, ramp } from "../theme/anim";
import { Atmosphere, Headline, InstallChip, Kicker, PromoRoot, Rise, SceneShell } from "../theme/stage";

/** One agent timeline drives the whole composition (absolute frames). */
const BEATS: AgentBeats = {
  promptStart: 8,
  promptSubmit: 55,
  runStart: 70,
  toolMetricsDone: 110,
  toolDeploysDone: 150,
  approvalAsk: 150,
  approvalOk: 185,
  streamStart: 190,
  streamEnd: 250,
};

const shift = (b: AgentBeats, by: number): AgentBeats =>
  Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v - by])) as unknown as AgentBeats;

const Shot: React.FC<{
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ title, children, footer }) => (
  <AbsoluteFill style={{ padding: "64px 64px 72px" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Rise>
        <Kicker>{copy.agent.kicker}</Kicker>
      </Rise>
    </div>
    {title ? (
      <Rise delay={2} style={{ marginTop: 18 }}>
        <Headline size={46}>{title}</Headline>
      </Rise>
    ) : null}
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 0,
        paddingTop: 18,
      }}
    >
      {children}
    </div>
    {footer}
  </AbsoluteFill>
);

/**
 * AgentWorkflowSpotlight — 1080×1080 · 30 fps · 285 frames (9.5 s).
 * Promotes the AI Interface Pack: composer → timeline + tool activity with a
 * real waiting_approval moment → streaming response + citation rail.
 */
export const AgentWorkflowSpotlight: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const railActive = frame < 225 ? "1" : frame < 255 ? "2" : "3";

  return (
    <PromoRoot>
      <Atmosphere />

      <Sequence from={0} durationInFrames={95} name="Prompt">
        <SceneShell duration={95} fadeIn={0}>
          <Shot title={copy.agent.headline}>
            <Rise delay={4}>
              <ComposerShot beats={shift(BEATS, 0)} width={820} />
            </Rise>
          </Shot>
        </SceneShell>
      </Sequence>

      <Sequence from={95} durationInFrames={100} name="Run + tools">
        <SceneShell duration={100}>
          <Shot title={copy.agent.support}>
            <TimelineActivityShot beats={shift(BEATS, 95)} />
          </Shot>
        </SceneShell>
      </Sequence>

      <Sequence from={195} durationInFrames={90} name="Stream + citations">
        <SceneShell duration={90} fadeOut={0}>
          <Shot
            footer={
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  opacity: enter({ frame, fps, delay: 240 }),
                }}
              >
                <Headline size={34} style={{ color: "var(--color-accent-text)" }}>
                  {copy.agent.closing}
                </Headline>
                <InstallChip command={installCommand} fontSize={16.5} />
              </div>
            }
          >
            <div style={{ display: "flex", gap: 20, width: "100%", alignItems: "flex-start" }}>
              <div style={{ flex: "0 0 55%", minWidth: 0 }}>
                <StreamShot beats={shift(BEATS, 195)} width={9999} />
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-md)",
                  overflow: "hidden",
                  opacity: ramp(frame, 205, 215),
                }}
              >
                <SourceCitationRail
                  sources={RAIL_SOURCES}
                  layout="list"
                  activeSourceId={railActive}
                  showExcerpts
                  title="Sources"
                >
                  <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: "var(--color-fg-secondary)" }}>
                    Deploy #8123 introduced a serial cart-validation call
                    <CitationMarker source="1" /> confirmed by the trace
                    <CitationMarker source="2" />; the runbook covers the rollback
                    <CitationMarker source="3" />.
                  </p>
                </SourceCitationRail>
              </div>
            </div>
          </Shot>
        </SceneShell>
      </Sequence>
    </PromoRoot>
  );
};
