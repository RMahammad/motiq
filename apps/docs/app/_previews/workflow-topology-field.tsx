"use client";

import * as React from "react";

import { WorkflowTopologyField } from "@/registry/backgrounds/workflow-topology-field";
import { type ContentPlacement } from "@/lib/motionstack";
import { HeroContent, useHeroPlacement, type HeroCopy } from "../_components/hero-frame";
import {
  ControlBar,
  ControlSegmented,
  ControlToggle,
  ControlDivider,
} from "../_components/preview-controls";

/** The component's built-in `defaultTopology()` spans the full width
 *  (completed → active → failed → pending). The composition's falloff + mask
 *  carves the content half, so Left/Right/Center all stay balanced. */
const COPY: HeroCopy = {
  eyebrow: "Live workflow",
  title: "Your orchestration, drawn as it runs.",
  copy: "The active path flows and a failed node keeps its glyph — readable without color.",
  primary: "Open builder",
  secondary: "View runs",
};

export function WorkflowTopologyFieldPreview() {
  const [placement, setPlacement] = React.useState<ContentPlacement>("left");
  const [density, setDensity] = React.useState(1);
  const [speed, setSpeed] = React.useState(1);
  const [motion, setMotion] = React.useState(true);
  const [interactive, setInteractive] = React.useState(true);
  const [showSafe, setShowSafe] = React.useState(false);
  const effective = useHeroPlacement(placement);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-md)]">
        <WorkflowTopologyField
          contentPlacement={effective}
          density={density}
          speed={speed}
          interactive={interactive}
          reducedMotion={!motion || undefined}
          className="min-h-[440px]"
        >
          <HeroContent placement={effective} copy={COPY} showSafe={showSafe} />
        </WorkflowTopologyField>
      </div>

      <ControlBar label="Background controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Content</span>
        <ControlSegmented
          label="Content placement"
          value={placement}
          onChange={(v) => setPlacement(v as ContentPlacement)}
          options={[
            { value: "left", label: "Left" },
            { value: "right", label: "Right" },
            { value: "center", label: "Center" },
          ]}
        />
        <ControlDivider />
        <label className="flex items-center gap-2 whitespace-nowrap text-[12.5px] font-medium text-[var(--color-muted)]">
          Density
          <input
            type="range"
            min={0.4}
            max={1.6}
            step={0.1}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="h-1 w-20 cursor-pointer accent-[var(--color-accent)]"
            aria-label="Lattice density"
          />
        </label>
        <label className="flex items-center gap-2 whitespace-nowrap text-[12.5px] font-medium text-[var(--color-muted)]">
          Speed
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="h-1 w-20 cursor-pointer accent-[var(--color-accent)]"
            aria-label="Flow speed"
          />
        </label>
        <ControlDivider />
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
        <ControlToggle pressed={interactive} onPressedChange={setInteractive}>
          Interactive
        </ControlToggle>
        <ControlToggle pressed={showSafe} onPressedChange={setShowSafe}>
          Show safe area
        </ControlToggle>
      </ControlBar>
    </div>
  );
}

export default WorkflowTopologyFieldPreview;
