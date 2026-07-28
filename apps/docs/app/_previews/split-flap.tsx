"use client";

import * as React from "react";

import { SplitFlap } from "@/registry/text/split-flap";
import {
  ControlBar,
  ControlButton,
  ControlDivider,
  ControlSegmented,
  ControlToggle,
} from "../_components/preview-controls";

const PAGES: string[][] = [
  ["SHIP MOTION    ON TIME", "BLUR-TEXT      GATE 04", "SPLIT-FLAP    BOARDING", "HERO ENTRANCE  ON TIME"],
  ["OPEN SOURCE    ALL DAY", "MIT LICENSED   ON TIME", "ZERO LOCK-IN   ON TIME", "SIXTY FPS     BOARDING"],
  ["COPY · PASTE   SHIPPED", "NO API KEYS    ON TIME", "DARK MODE      GATE 22", "SHIP TONIGHT  BOARDING"],
];

export function SplitFlapPreview() {
  const [index, setIndex] = React.useState(0);
  const [interval, setIntervalMs] = React.useState("6000");
  const [flutter, setFlutter] = React.useState(true);
  const [motion, setMotion] = React.useState(true);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-5 py-8">
        <p className="mb-3 flex items-baseline justify-between px-0.5 font-mono text-[11.5px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
          <span>Motiq terminal — departures</span>
          <span className="text-[var(--color-success)]">live</span>
        </p>
        <SplitFlap
          messages={PAGES}
          index={index}
          onIndexChange={setIndex}
          interval={Number(interval)}
          flutter={flutter}
          reducedMotion={!motion || undefined}
          seed={11}
        />
      </div>

      <ControlBar label="Board controls">
        <ControlButton onClick={() => setIndex((i) => (i + 1) % PAGES.length)}>Next page</ControlButton>
        <ControlDivider />
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Rotate</span>
        <ControlSegmented
          label="Page interval"
          value={interval}
          onChange={setIntervalMs}
          options={[
            { value: "0", label: "Off" },
            { value: "6000", label: "6s" },
            { value: "3000", label: "3s" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={flutter} onPressedChange={setFlutter}>
          Idle flutter
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
      </ControlBar>
    </div>
  );
}

export default SplitFlapPreview;
