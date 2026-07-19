import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";

import {
  heroDuration,
  heroHeadings,
  heroInner,
  heroOverlap,
  heroPhases,
  heroSpans,
} from "../campaign";
import { HeroAgentScene } from "../scenes/AgentScene";
import { IntroScene, OutroScene } from "../scenes/BrandScenes";
import { CollabPanels } from "../scenes/CollabScene";
import { DataDashboard } from "../scenes/DataScene";
import { PipelinePanel } from "../scenes/PipelineScene";
import { TopologyBackdrop } from "../scenes/TopologyBackdrop";
import { easeOut } from "../theme/anim";
import { Atmosphere, PromoRoot, SceneHeading, SceneShell, Zoom } from "../theme/stage";

/** Logical design size; the composition renders at ×2 (2560×1440). */
const STAGE_W = 1280;
const STAGE_H = 720;

/** Scene frame: large heading top-left, active component centered below. */
const HeroFrame: React.FC<{
  pack: string;
  heading: string;
  children: React.ReactNode;
}> = ({ pack, heading, children }) => (
  <AbsoluteFill style={{ padding: "42px 64px 46px" }}>
    <SceneHeading pack={pack} heading={heading} />
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 0,
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

/**
 * MotiqReadmeHero v3 — 2560×1440 · 30 fps · ~680 frames (~22.7 s), built to
 * loop. All timing derives from the phase objects in campaign.ts
 * (`heroPhases` → `heroSpans`): a scene's exit phase can only begin after its
 * completed-state hold, and the next scene overlaps just the final
 * `heroOverlap` frames of that exit. The workflow field, Trigger/Ingest
 * nodes, Deploy card, and central glow stay continuously visible.
 */
export const MotiqReadmeHero: React.FC = () => {
  const frame = useCurrentFrame();

  // Foreground scenes dim the field; hero and outro let it breathe.
  const backdropOpacity = interpolate(
    frame,
    [
      heroSpans.agent.from - 2,
      heroSpans.agent.from + 12,
      heroSpans.outro.from + heroPhases.outro.at.enter,
      heroSpans.outro.from + heroPhases.outro.at.claims + 6,
    ],
    [0.55, 0.16, 0.16, 0.55],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut },
  );

  // Transforms play over 12 frames; opacity crossfades complementarily over
  // the exact 6-frame scene overlap so combined brightness never dips.
  const shell = {
    fadeIn: 12,
    fadeOut: 12,
    opacityIn: heroOverlap,
    opacityOut: heroOverlap,
    rise: 20,
    drift: 0,
  } as const;

  return (
    <PromoRoot>
      <AbsoluteFill
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: "scale(2)",
          transformOrigin: "top left",
        }}
      >
        <Atmosphere glow={0.45} />
        <TopologyBackdrop frame={frame} period={heroDuration} opacity={backdropOpacity} />

        <Sequence from={heroSpans.hero.from} durationInFrames={heroSpans.hero.duration} name="Hero">
          <SceneShell
            duration={heroSpans.hero.duration}
            fadeIn={0}
            fadeOut={12}
            opacityOut={heroOverlap}
            drift={0}
          >
            <IntroScene absFrame={frame} backdropPeriod={heroDuration} backdrop={false} />
          </SceneShell>
        </Sequence>

        <Sequence
          from={heroSpans.agent.from}
          durationInFrames={heroSpans.agent.duration}
          name="AI Interface"
        >
          <SceneShell duration={heroSpans.agent.duration} {...shell}>
            <HeroFrame pack={heroHeadings.agent.pack} heading={heroHeadings.agent.heading}>
              <HeroAgentScene
                beats={heroInner.agent.beats}
                workspaceAt={heroInner.agent.workspaceAt}
                streamAt={heroInner.agent.streamAt}
              />
            </HeroFrame>
          </SceneShell>
        </Sequence>

        <Sequence
          from={heroSpans.pipeline.from}
          durationInFrames={heroSpans.pipeline.duration}
          name="Developer Tools"
        >
          <SceneShell duration={heroSpans.pipeline.duration} {...shell}>
            <HeroFrame
              pack={heroHeadings.pipeline.pack}
              heading={heroHeadings.pipeline.heading}
            >
              <Zoom factor={1.12}>
                <PipelinePanel beats={heroInner.pipeline} width={700} />
              </Zoom>
            </HeroFrame>
          </SceneShell>
        </Sequence>

        <Sequence
          from={heroSpans.data.from}
          durationInFrames={heroSpans.data.duration}
          name="Data Motion"
        >
          <SceneShell duration={heroSpans.data.duration} {...shell}>
            <HeroFrame pack={heroHeadings.data.pack} heading={heroHeadings.data.heading}>
              <Zoom factor={1.1} style={{ width: 900, maxWidth: "100%" }}>
                <DataDashboard beats={heroInner.data} width={900} />
              </Zoom>
            </HeroFrame>
          </SceneShell>
        </Sequence>

        <Sequence
          from={heroSpans.collab.from}
          durationInFrames={heroSpans.collab.duration}
          name="Collaboration"
        >
          <SceneShell duration={heroSpans.collab.duration} {...shell}>
            <HeroFrame pack={heroHeadings.collab.pack} heading={heroHeadings.collab.heading}>
              <CollabPanels beats={heroInner.collab} width={1085} />
            </HeroFrame>
          </SceneShell>
        </Sequence>

        <Sequence
          from={heroSpans.outro.from}
          durationInFrames={heroSpans.outro.duration}
          name="Outro"
        >
          <SceneShell
            duration={heroSpans.outro.duration}
            fadeIn={12}
            fadeOut={0}
            opacityIn={heroOverlap}
            drift={0}
          >
            <OutroScene
              absFrame={frame}
              backdropPeriod={heroDuration}
              at={heroPhases.outro.at}
              backdrop={false}
            />
          </SceneShell>
        </Sequence>
      </AbsoluteFill>
    </PromoRoot>
  );
};
