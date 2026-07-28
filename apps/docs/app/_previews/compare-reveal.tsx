"use client";

import * as React from "react";

import { CompareReveal } from "@/registry/media/compare-reveal";
import {
  ControlBar,
  ControlButton,
  ControlDivider,
  ControlHint,
  ControlToggle,
} from "../_components/preview-controls";
import { useComparePair } from "./media-scenes";

const SEED = 21;

export function CompareRevealPreview() {
  const [motion, setMotion] = React.useState(true);
  const [sweep, setSweep] = React.useState(true);
  const [position, setPosition] = React.useState(50);
  // Remounting is the honest way to re-arm a once-per-mount intro sweep.
  const [runs, setRuns] = React.useState(0);

  const [wireframe, render] = useComparePair(SEED, 1200, 750);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <CompareReveal
        key={runs}
        // The generated art lands one frame after mount; until then both sides are
        // plain surfaces (never an <img src="">, which browsers refetch the page).
        before={
          wireframe ? (
            { src: wireframe, alt: "Design v1 — wireframe pass of the valley scene" }
          ) : (
            <div className="h-full w-full bg-[var(--color-bg-elevated)]" />
          )
        }
        after={
          render ? (
            { src: render, alt: "Design v2 — finished render of the same valley scene" }
          ) : (
            <div className="h-full w-full bg-[var(--color-surface-2)]" />
          )
        }
        labels={["v1 wireframe", "v2 render"]}
        introSweep={sweep}
        position={position}
        onPositionChange={setPosition}
        reducedMotion={!motion || undefined}
      />

      <ControlBar label="Comparator controls">
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
        <ControlToggle pressed={sweep} onPressedChange={setSweep}>
          Intro sweep
        </ControlToggle>
        <ControlDivider />
        <ControlButton
          onClick={() => {
            setPosition(50);
            setRuns((r) => r + 1);
          }}
        >
          Replay sweep
        </ControlButton>
        <ControlHint live>Reveal at {Math.round(position)}% — double-click the frame to snap home.</ControlHint>
      </ControlBar>
    </div>
  );
}

export default CompareRevealPreview;
