"use client";

import * as React from "react";

import { DecryptText } from "@/registry/text/decrypt-text";
import {
  ControlBar,
  ControlButton,
  ControlDivider,
  ControlSegmented,
  ControlToggle,
} from "../_components/preview-controls";

const HEADLINE = "Ship interfaces that feel alive.";
const COMMAND = "motiq add decrypt-text — resolved in 84ms";

type SpeedKey = "slow" | "normal" | "fast";
const SPEEDS: Record<SpeedKey, { speed: number; stagger: number }> = {
  slow: { speed: 70, stagger: 90 },
  normal: { speed: 45, stagger: 55 },
  fast: { speed: 28, stagger: 32 },
};

export function DecryptTextPreview() {
  const [speed, setSpeed] = React.useState<SpeedKey>("normal");
  const [terminal, setTerminal] = React.useState(true);
  const [looping, setLooping] = React.useState(true);
  const [motion, setMotion] = React.useState(true);
  // Remounting is the honest "replay from scratch" for a mount-triggered run.
  const [run, setRun] = React.useState(0);

  const preset = SPEEDS[speed];

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="grid w-full place-items-center gap-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-6 py-12 text-center">
        <DecryptText
          key={`h-${run}-${speed}`}
          text={HEADLINE}
          as="h2"
          trigger="mount"
          speed={preset.speed}
          stagger={preset.stagger}
          loop={looping ? 7000 : false}
          reducedMotion={!motion || undefined}
          seed={7}
        />
        {terminal ? (
          <DecryptText
            key={`t-${run}-${speed}`}
            text={COMMAND}
            variant="terminal"
            trigger="mount"
            speed={preset.speed}
            stagger={Math.round(preset.stagger * 0.6)}
            startDelay={900}
            loop={looping ? 7000 : false}
            reducedMotion={!motion || undefined}
            seed={13}
            className="w-auto"
          />
        ) : null}
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-muted)]">
          hover the headline to re-encrypt
        </p>
      </div>

      <ControlBar label="Decrypt controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Speed</span>
        <ControlSegmented
          label="Decrypt speed"
          value={speed}
          onChange={setSpeed}
          options={[
            { value: "slow", label: "Slow" },
            { value: "normal", label: "Normal" },
            { value: "fast", label: "Fast" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={terminal} onPressedChange={setTerminal}>
          Terminal variant
        </ControlToggle>
        <ControlToggle pressed={looping} onPressedChange={setLooping}>
          Auto re-run
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
        <ControlDivider />
        <ControlButton onClick={() => setRun((n) => n + 1)}>Replay</ControlButton>
      </ControlBar>
    </div>
  );
}

export default DecryptTextPreview;
