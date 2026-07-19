import React from "react";
import { Composition } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { Intro, introDefaults, introSchema } from "./comps/Intro";
import { Install, installDefaults, installSchema } from "./comps/Install";
import { Showcase, showcaseDefaults, showcaseSchema } from "./comps/Showcase";
import { Pillars, pillarsDefaults, pillarsSchema } from "./comps/Pillars";
import { OpenSource, openSourceDefaults, openSourceSchema } from "./comps/OpenSource";
import { categories } from "./comps/category";
import { categorySchema } from "./comps/category/Layout";
import { Trailer, TRAILER_DURATION, trailerDefaults, trailerSchema } from "./comps/social/Trailer";
import { SquareLoop, squareDefaults, squareSchema } from "./comps/social/SquareLoop";
import { Vertical, verticalDefaults, verticalSchema } from "./comps/social/Vertical";
import { StaticCard, cardDefaults, cardSchema } from "./comps/social/StaticCard";

loadInter("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] });
loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] });

const base = { width: 1200, height: 675, fps: 30 } as const;

export const Root: React.FC = () => (
  <>
    <Composition
      id="motiq-intro"
      component={Intro}
      schema={introSchema}
      defaultProps={introDefaults}
      durationInFrames={180}
      {...base}
    />
    <Composition
      id="motiq-install"
      component={Install}
      schema={installSchema}
      defaultProps={installDefaults}
      durationInFrames={240}
      {...base}
    />
    <Composition
      id="motiq-showcase"
      component={Showcase}
      schema={showcaseSchema}
      defaultProps={showcaseDefaults}
      durationInFrames={240}
      {...base}
    />
    <Composition
      id="motiq-pillars"
      component={Pillars}
      schema={pillarsSchema}
      defaultProps={pillarsDefaults}
      durationInFrames={210}
      {...base}
    />
    <Composition
      id="motiq-free"
      component={OpenSource}
      schema={openSourceSchema}
      defaultProps={openSourceDefaults}
      durationInFrames={195}
      {...base}
    />
    {categories.map((cat) => (
      <Composition
        key={cat.id}
        id={cat.id}
        component={cat.component}
        schema={categorySchema}
        defaultProps={cat.defaults}
        durationInFrames={240}
        {...base}
      />
    ))}
    <Composition
      id="motiq-trailer"
      component={Trailer}
      schema={trailerSchema}
      defaultProps={trailerDefaults}
      durationInFrames={TRAILER_DURATION}
      width={1280}
      height={720}
      fps={30}
    />
    <Composition
      id="motiq-square"
      component={SquareLoop}
      schema={squareSchema}
      defaultProps={squareDefaults}
      durationInFrames={360}
      width={1080}
      height={1080}
      fps={30}
    />
    <Composition
      id="motiq-vertical"
      component={Vertical}
      schema={verticalSchema}
      defaultProps={verticalDefaults}
      durationInFrames={360}
      width={1080}
      height={1920}
      fps={30}
    />
    <Composition
      id="motiq-card"
      component={StaticCard}
      schema={cardSchema}
      defaultProps={cardDefaults}
      durationInFrames={200}
      {...base}
    />
  </>
);
