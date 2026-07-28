"use client";

import * as React from "react";

import { LiquidFillHeadline } from "@/registry/text/liquid-fill-headline";
import { ControlBar, ControlDivider, ControlToggle } from "../_components/preview-controls";

const HEADLINE = "Set it in motion";

export function LiquidFillHeadlinePreview() {
  const [shimmer, setShimmer] = React.useState(true);
  const [loop, setLoop] = React.useState(true);
  const [manual, setManual] = React.useState(false);
  const [level, setLevel] = React.useState(0.62);
  const [motion, setMotion] = React.useState(true);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="grid w-full place-items-center gap-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-6 py-16 text-center">
        <LiquidFillHeadline
          text={HEADLINE}
          as="h2"
          shimmer={shimmer}
          loop={loop}
          level={manual ? level : undefined}
          reducedMotion={!motion || undefined}
        />
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-muted)]">
          {manual ? "level is driven by the slider" : "tap the headline to re-pour"}
        </p>
      </div>

      <ControlBar label="Liquid fill controls">
        <ControlToggle pressed={shimmer} onPressedChange={setShimmer}>
          Shimmer
        </ControlToggle>
        <ControlToggle pressed={loop} onPressedChange={setLoop}>
          Loop
        </ControlToggle>
        <ControlToggle pressed={manual} onPressedChange={setManual}>
          Controlled level
        </ControlToggle>
        <ControlDivider />
        <label className="flex items-center gap-2 whitespace-nowrap text-[12.5px] font-medium text-[var(--color-muted)]">
          Level
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={level}
            disabled={!manual}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="h-1 w-28 cursor-pointer accent-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fill level"
          />
        </label>
        <ControlDivider />
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
      </ControlBar>
    </div>
  );
}

export default LiquidFillHeadlinePreview;
