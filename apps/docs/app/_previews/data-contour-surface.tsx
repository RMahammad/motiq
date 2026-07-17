"use client";

import * as React from "react";

import {
  DataContourSurface,
  type ContourPoint,
  type ContourRegion,
} from "@/registry/backgrounds/data-contour-surface";
import { type ContentPlacement } from "@/lib/motionstack";
import { HeroContent, useHeroPlacement, type HeroCopy } from "../_components/hero-frame";
import {
  ControlBar,
  ControlSegmented,
  ControlToggle,
  ControlDivider,
} from "../_components/preview-controls";

/**
 * Fictional operational-metrics scenarios. Points fill the WHOLE field (mixed
 * signs across x and y) so the surface reads as one continuous landscape at any
 * placement — the composition mask and per-segment falloff carve whichever half
 * holds the copy. Each scenario supplies a different field + threshold set so
 * reviewers watch the contours ease from one reading to the next.
 */
type Scenario = "A" | "B" | "C";

/** Override datasets (B, C) that drive the field through the public `points` API.
 *  Scenario "A" is the shipped demo field — passed as no `points` so the demo
 *  extras (live-metric chips + active-window caption) show, mirroring the pattern
 *  the runtime-signal-map playground uses for its default state. */
const SCENARIOS: Record<
  "B" | "C",
  { points: ContourPoint[]; thresholds: number[]; active: ContourRegion; comparison: ContourRegion[] }
> = {
  B: {
    points: [
      { x: 0.18, y: 0.6, value: 1.05, radius: 0.26 },
      { x: 0.34, y: 0.22, value: -0.6, radius: 0.2 },
      { x: 0.56, y: 0.5, value: 0.55, radius: 0.2 },
      { x: 0.78, y: 0.28, value: 0.5, radius: 0.18 },
      { x: 0.88, y: 0.7, value: -0.5, radius: 0.2 },
      { x: 0.6, y: 0.84, value: 0.4, radius: 0.16 },
    ],
    thresholds: [-0.3, 0.4, 0.85],
    active: { x: 0.6, y: 0.32, w: 0.3, h: 0.42 },
    comparison: [{ x: 0.14, y: 0.18, w: 0.22, h: 0.3 }],
  },
  C: {
    points: [
      { x: 0.12, y: 0.4, value: 0.7, radius: 0.2 },
      { x: 0.3, y: 0.78, value: 0.55, radius: 0.2 },
      { x: 0.48, y: 0.24, value: -0.5, radius: 0.2 },
      { x: 0.68, y: 0.56, value: 0.9, radius: 0.24 },
      { x: 0.86, y: 0.34, value: 0.45, radius: 0.16 },
      { x: 0.9, y: 0.78, value: -0.45, radius: 0.2 },
    ],
    thresholds: [-0.4, 0.3, 0.6],
    active: { x: 0.58, y: 0.34, w: 0.34, h: 0.38 },
    comparison: [{ x: 0.22, y: 0.6, w: 0.22, h: 0.3 }],
  },
};

const COPY: HeroCopy = {
  eyebrow: "Live metrics",
  title: "Contours drawn from your data.",
  copy: "Pressure points shape the field; threshold bands read heavier and the active reading brightens.",
  primary: "Open dashboard",
  secondary: "Compare periods",
};

export function DataContourSurfacePreview() {
  const [scenario, setScenario] = React.useState<Scenario>("A");
  const [placement, setPlacement] = React.useState<ContentPlacement>("left");
  const [density, setDensity] = React.useState(1);
  const [intensity, setIntensity] = React.useState(1);
  const [speed, setSpeed] = React.useState(1);
  const [motion, setMotion] = React.useState(true);
  const [interactive, setInteractive] = React.useState(true);
  const [showSafe, setShowSafe] = React.useState(false);
  const effective = useHeroPlacement(placement);

  // Scenario "A" passes no data → the shipped demo field + live-metric chips; the
  // other scenarios override the field through the public `points` API.
  const s = scenario === "A" ? null : SCENARIOS[scenario];

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-md)]">
        <DataContourSurface
          points={s?.points}
          thresholds={s?.thresholds}
          activeRegion={s?.active}
          comparisonRegions={s?.comparison}
          contentPlacement={effective}
          density={density}
          intensity={intensity}
          speed={speed}
          interactive={interactive}
          reducedMotion={!motion || undefined}
          className="min-h-[440px]"
        >
          <HeroContent placement={effective} copy={COPY} showSafe={showSafe} />
        </DataContourSurface>
      </div>

      <ControlBar label="Contour surface controls">
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
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Scenario</span>
        <ControlSegmented
          label="Data scenario"
          value={scenario}
          onChange={(v) => setScenario(v as Scenario)}
          options={[
            { value: "A", label: "A" },
            { value: "B", label: "B" },
            { value: "C", label: "C" },
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
            aria-label="Field intensity"
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
            className="h-1 w-16 cursor-pointer accent-[var(--color-accent)]"
            aria-label="Drift speed"
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

export default DataContourSurfacePreview;
