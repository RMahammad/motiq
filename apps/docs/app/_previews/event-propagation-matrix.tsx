"use client";

import * as React from "react";

import { EventPropagationMatrix } from "@/registry/backgrounds/event-propagation-matrix";
import { type ContentPlacement } from "@/lib/motionstack";
import { HeroContent, useHeroPlacement, type HeroCopy } from "../_components/hero-frame";
import {
  ControlBar,
  ControlSegmented,
  ControlToggle,
  ControlDivider,
} from "../_components/preview-controls";

const COPY: HeroCopy = {
  eyebrow: "Event stream",
  title: "Every webhook, propagated and audited.",
  copy: "Events spread lane-by-lane across the matrix; failures halt with a glyph — readable without color.",
  primary: "View event log",
  secondary: "Configure webhooks",
};

export function EventPropagationMatrixPreview() {
  const [placement, setPlacement] = React.useState<ContentPlacement>("left");
  const [density, setDensity] = React.useState(1);
  const [intensity, setIntensity] = React.useState(1);
  const [speed, setSpeed] = React.useState(1);
  const [motion, setMotion] = React.useState(true);
  const [interactive, setInteractive] = React.useState(true);
  const [showSafe, setShowSafe] = React.useState(false);
  const effective = useHeroPlacement(placement);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-md)]">
        <EventPropagationMatrix
          contentPlacement={effective}
          density={density}
          intensity={intensity}
          speed={speed}
          interactive={interactive}
          reducedMotion={!motion || undefined}
          className="min-h-[600px] lg:min-h-[440px]"
        >
          <HeroContent placement={effective} copy={COPY} showSafe={showSafe} minH="min-h-[600px] lg:min-h-[440px]" />
        </EventPropagationMatrix>
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
            min={0.5}
            max={1.6}
            step={0.1}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="h-1 w-16 cursor-pointer accent-[var(--color-accent)]"
            aria-label="Base-cell density"
          />
        </label>
        <label className="flex items-center gap-2 whitespace-nowrap text-[12.5px] font-medium text-[var(--color-muted)]">
          Intensity
          <input
            type="range"
            min={0.4}
            max={1.4}
            step={0.1}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="h-1 w-16 cursor-pointer accent-[var(--color-accent)]"
            aria-label="Field intensity"
          />
        </label>
        <ControlDivider />
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Speed</span>
        <ControlSegmented
          label="Propagation speed"
          value={String(speed)}
          onChange={(v) => setSpeed(Number(v))}
          options={[
            { value: "0.5", label: "0.5×" },
            { value: "1", label: "1×" },
            { value: "1.5", label: "1.5×" },
            { value: "2", label: "2×" },
          ]}
        />
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

export default EventPropagationMatrixPreview;
