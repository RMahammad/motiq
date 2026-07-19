import React from "react";
import { Composition, Still } from "remotion";

import { formats } from "./campaign";
import { AgentWorkflowSpotlight } from "./compositions/AgentWorkflowSpotlight";
import { DeploymentPipelineSpotlight } from "./compositions/DeploymentPipelineSpotlight";
import { LiveDataSpotlight } from "./compositions/LiveDataSpotlight";
import { MotiqPoster } from "./compositions/MotiqPoster";
import { MotiqReadmeHero } from "./compositions/MotiqReadmeHero";
import { MotiqReducedMotionDemo } from "./compositions/MotiqReducedMotionDemo";
import {
  MotiqShowcaseMosaic,
  ShowcaseAiInterfaceCard,
  ShowcaseCollaborationCard,
  ShowcaseDataMotionCard,
  ShowcaseDeveloperToolsCard,
} from "./compositions/MotiqShowcase";
import { MotiqSocialVertical } from "./compositions/MotiqSocialVertical";
import { showcaseFormats } from "./showcase";

const showcaseCards = [
  { format: showcaseFormats.aiCard, component: ShowcaseAiInterfaceCard },
  { format: showcaseFormats.pipelineCard, component: ShowcaseDeveloperToolsCard },
  { format: showcaseFormats.dataCard, component: ShowcaseDataMotionCard },
  { format: showcaseFormats.collabCard, component: ShowcaseCollaborationCard },
] as const;

export const Root: React.FC = () => (
  <>
    <Composition
      id={formats.readme.id}
      component={MotiqReadmeHero}
      width={formats.readme.width}
      height={formats.readme.height}
      fps={formats.readme.fps}
      durationInFrames={formats.readme.durationInFrames}
    />
    <Composition
      id={formats.pipeline.id}
      component={DeploymentPipelineSpotlight}
      width={formats.pipeline.width}
      height={formats.pipeline.height}
      fps={formats.pipeline.fps}
      durationInFrames={formats.pipeline.durationInFrames}
    />
    <Composition
      id={formats.agent.id}
      component={AgentWorkflowSpotlight}
      width={formats.agent.width}
      height={formats.agent.height}
      fps={formats.agent.fps}
      durationInFrames={formats.agent.durationInFrames}
    />
    <Composition
      id={formats.data.id}
      component={LiveDataSpotlight}
      width={formats.data.width}
      height={formats.data.height}
      fps={formats.data.fps}
      durationInFrames={formats.data.durationInFrames}
    />
    <Composition
      id={formats.vertical.id}
      component={MotiqSocialVertical}
      width={formats.vertical.width}
      height={formats.vertical.height}
      fps={formats.vertical.fps}
      durationInFrames={formats.vertical.durationInFrames}
    />
    <Composition
      id={formats.reduced.id}
      component={MotiqReducedMotionDemo}
      width={formats.reduced.width}
      height={formats.reduced.height}
      fps={formats.reduced.fps}
      durationInFrames={formats.reduced.durationInFrames}
    />
    <Still
      id={formats.poster.id}
      component={MotiqPoster}
      width={formats.poster.width}
      height={formats.poster.height}
    />
    <Composition
      id={showcaseFormats.mosaic.id}
      component={MotiqShowcaseMosaic}
      width={showcaseFormats.mosaic.width}
      height={showcaseFormats.mosaic.height}
      fps={showcaseFormats.mosaic.fps}
      durationInFrames={showcaseFormats.mosaic.durationInFrames}
    />
    {showcaseCards.map(({ format, component }) => (
      <Composition
        key={format.id}
        id={format.id}
        component={component}
        width={format.width}
        height={format.height}
        fps={format.fps}
        durationInFrames={format.durationInFrames}
      />
    ))}
  </>
);
