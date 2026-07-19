"use client";

import * as React from "react";

import {
  LiveDataCommandHero,
  type DataHeroPhase,
} from "@/registry/blocks/live-data-command-hero";

import {
  ControlBar,
  ControlSegmented,
  ControlHint,
} from "../_components/preview-controls";

/* -------------------------------------------------------------------------
 * DEMO ONLY — an editable hero block for operational-data products. Every
 * signal, region, metric, and timestamp is fictional and provider-neutral;
 * there is NO real telemetry backend. A small EXTERNAL segmented switcher drives
 * the block's `phase` across the eight required states so the surface can be
 * inspected in each one.
 * ---------------------------------------------------------------------- */

const PHASE_OPTIONS: ReadonlyArray<{ value: DataHeroPhase; label: string }> = [
  { value: "initial", label: "Initial" },
  { value: "live", label: "Live" },
  { value: "filtering", label: "Filtering" },
  { value: "refreshing", label: "Refreshing" },
  { value: "partial-update", label: "Partial" },
  { value: "stale", label: "Stale" },
  { value: "error", label: "Error" },
  { value: "recovery", label: "Recovery" },
];

const HINT: Record<DataHeroPhase, string> = {
  initial: "First load - metrics, watchlist, and feed resolve from skeletons.",
  live: "Settled and streaming - KPIs and rows morph on each ambient tick.",
  filtering: "One active filter (Tier-1) narrows the watchlist; the count morphs.",
  refreshing: "A refresh is in flight - the refresh state shows working.",
  "partial-update": "Only some signals updated this cycle - partial refresh state.",
  stale: "Data is behind live; morphs freeze so nothing implies movement.",
  error: "The upstream endpoint failed - every surface shows an honest error.",
  recovery: "Refresh succeeded after a failure - the surface catches back up.",
};

export function LiveDataCommandHeroPreview() {
  const [phase, setPhase] = React.useState<DataHeroPhase>("live");

  return (
    <div className="flex w-full max-w-[1180px] flex-col gap-4">
      <ControlBar label="Hero phase">
        <ControlSegmented<DataHeroPhase>
          label="Data lifecycle phase"
          options={PHASE_OPTIONS}
          value={phase}
          onChange={setPhase}
        />
        <ControlHint live>{HINT[phase]}</ControlHint>
      </ControlBar>

      <LiveDataCommandHero phase={phase} onPhaseChange={setPhase} />
    </div>
  );
}

export default LiveDataCommandHeroPreview;
