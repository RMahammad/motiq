"use client";

import * as React from "react";

import { QueuePulseLanes, type LaneData } from "@/registry/backgrounds/queue-pulse-lanes";
import { type ContentPlacement } from "@/lib/motionstack";
import { HeroContent, useHeroPlacement, type HeroCopy } from "../_components/hero-frame";
import {
  ControlBar,
  ControlSegmented,
  ControlToggle,
  ControlDivider,
} from "../_components/preview-controls";

/** Five full-field lanes — one of each state. The composition carves the content
 *  half; the lanes fill the other, so every placement stays balanced. */
const LANES: LaneData[] = [
  { id: "webhooks", label: "webhooks", queued: 4, active: 3, completed: 46, capacity: 14, throughput: 9 },
  { id: "image-resize", label: "image-resize", queued: 23, active: 6, completed: 31, capacity: 24, throughput: 5 },
  { id: "email-digest", label: "email-digest", queued: 9, active: 0, completed: 17, capacity: 12, blocked: true },
  { id: "csv-import", label: "csv-import", queued: 6, active: 2, completed: 20, capacity: 11, delayed: true, throughput: 3 },
  { id: "thumbnails", label: "thumbnails", queued: 1, active: 1, completed: 88, capacity: 10, throughput: 7 },
];

const COPY: HeroCopy = {
  eyebrow: "Queue throughput",
  title: "Every queue, moving at its own pace.",
  copy: "Congested lanes pack tighter; blocked work stops at a marked cap — readable without color.",
  primary: "Open queues",
  secondary: "View workers",
};

export function QueuePulseLanesPreview() {
  const [placement, setPlacement] = React.useState<ContentPlacement>("left");
  const [density, setDensity] = React.useState(1);
  const [speed, setSpeed] = React.useState(1);
  const [intensity, setIntensity] = React.useState(1);
  const [motion, setMotion] = React.useState(true);
  const [showSafe, setShowSafe] = React.useState(false);
  const effective = useHeroPlacement(placement);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-md)]">
        <QueuePulseLanes
          lanes={LANES}
          contentPlacement={effective}
          density={density}
          speed={speed}
          intensity={intensity}
          reducedMotion={!motion || undefined}
          className="min-h-[580px] lg:min-h-[440px]"
        >
          <HeroContent placement={effective} copy={COPY} showSafe={showSafe} />
        </QueuePulseLanes>
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
          <input type="range" min={0.5} max={1.6} step={0.1} value={density} onChange={(e) => setDensity(Number(e.target.value))} className="h-1 w-16 cursor-pointer accent-[var(--color-accent)]" aria-label="Pulse density" />
        </label>
        <label className="flex items-center gap-2 whitespace-nowrap text-[12.5px] font-medium text-[var(--color-muted)]">
          Speed
          <input type="range" min={0} max={2} step={0.1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="h-1 w-16 cursor-pointer accent-[var(--color-accent)]" aria-label="Flow speed" />
        </label>
        <label className="flex items-center gap-2 whitespace-nowrap text-[12.5px] font-medium text-[var(--color-muted)]">
          Intensity
          <input type="range" min={0.4} max={1.4} step={0.1} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="h-1 w-16 cursor-pointer accent-[var(--color-accent)]" aria-label="Field intensity" />
        </label>
        <ControlDivider />
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
        <ControlToggle pressed={showSafe} onPressedChange={setShowSafe}>
          Show safe area
        </ControlToggle>
      </ControlBar>
    </div>
  );
}

export default QueuePulseLanesPreview;
