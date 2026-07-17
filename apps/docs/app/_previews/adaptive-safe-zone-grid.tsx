"use client";

import * as React from "react";

import { AdaptiveSafeZoneGrid } from "@/registry/backgrounds/adaptive-safe-zone-grid";
import { type ContentPlacement } from "@/lib/motionstack";
import { HeroContent, useHeroPlacement, type HeroCopy } from "../_components/hero-frame";
import {
  ControlBar,
  ControlSegmented,
  ControlToggle,
  ControlDivider,
} from "../_components/preview-controls";

const COPY: HeroCopy = {
  eyebrow: "Content-aware grid",
  title: "A grid that yields to your words.",
  copy: "Set one placement prop — the grid quiets behind the copy and collects toward the frame.",
  primary: "Start building",
  secondary: "See examples",
};

export function AdaptiveSafeZoneGridPreview() {
  const [placement, setPlacement] = React.useState<ContentPlacement>("left");
  const [density, setDensity] = React.useState(1);
  const [intensity, setIntensity] = React.useState(1);
  const [speed, setSpeed] = React.useState(1);
  const [perspective, setPerspective] = React.useState(false);
  const [motion, setMotion] = React.useState(true);
  const [interactive, setInteractive] = React.useState(true);
  const [showSafe, setShowSafe] = React.useState(false);
  const effective = useHeroPlacement(placement);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-md)]">
        <AdaptiveSafeZoneGrid
          contentPlacement={effective}
          density={density}
          intensity={intensity}
          speed={speed}
          perspective={perspective}
          depth={1.4}
          interactive={interactive}
          reducedMotion={!motion || undefined}
          highlightCells={[
            { col: 8, row: 1 },
            { col: 10, row: 4 },
            { col: 9, row: 6 },
          ]}
          className="min-h-[440px]"
        >
          <HeroContent placement={effective} copy={COPY} showSafe={showSafe} />
        </AdaptiveSafeZoneGrid>
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
            className="h-1 w-16 cursor-pointer accent-[var(--color-accent)]"
            aria-label="Grid density"
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
            aria-label="Grid intensity"
          />
        </label>
        <ControlDivider />
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Speed</span>
        <ControlSegmented
          label="Shimmer speed"
          value={String(speed)}
          onChange={(v) => setSpeed(Number(v))}
          options={[
            { value: "0", label: "Off" },
            { value: "0.6", label: "Slow" },
            { value: "1", label: "Normal" },
            { value: "1.6", label: "Fast" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={perspective} onPressedChange={setPerspective}>
          Perspective
        </ControlToggle>
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

export default AdaptiveSafeZoneGridPreview;
