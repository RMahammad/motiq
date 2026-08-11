"use client";

import * as React from "react";

import { BorderBeamPanel } from "@/registry/creative/border-beam-panel";
import { ControlBar, ControlDivider, ControlSegmented, ControlToggle } from "../_components/preview-controls";

const SPEEDS: Record<string, { idle: number; hover: number }> = {
  calm: { idle: 24, hover: 150 },
  normal: { idle: 42, hover: 240 },
  quick: { idle: 70, hover: 360 },
};

export function BorderBeamPanelPreview() {
  const [beams, setBeams] = React.useState("2");
  const [glow, setGlow] = React.useState(true);
  const [motion, setMotion] = React.useState(true);
  const [tempo, setTempo] = React.useState("normal");

  const speed = SPEEDS[tempo] ?? SPEEDS.normal;

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="grid w-full place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-6 py-12">
        <div className="w-full max-w-[440px]">
          <BorderBeamPanel
            beams={beams === "1" ? 1 : 2}
            glow={glow}
            idleSpeed={speed.idle}
            hoverSpeed={speed.hover}
            reducedMotion={!motion || undefined}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent-text)]">Registry</span>
            <h3 className="mt-2.5 text-[21px] font-semibold tracking-tight text-[var(--color-fg)]">One command, zero setup</h3>
            <p className="mt-2.5 text-[14px] text-[var(--color-fg-secondary)]">
              Every Motiq component installs straight from the registry — the source lands in your project, typed and
              themeable, with nothing to version or configure.
            </p>
            <div className="mt-4 overflow-x-auto whitespace-nowrap rounded-md border border-[var(--color-border)] bg-[var(--color-code-bg)] px-3.5 py-2.5 font-mono text-[12px] text-[var(--color-code-fg)]">
              <span className="text-[var(--color-secondary-accent)]">$</span> npx shadcn add @motiq/border-beam-panel
            </div>
            <div className="mt-4 flex gap-4 font-mono text-[11px] text-[var(--color-muted)]">
              <span>
                <b className="font-semibold text-[var(--color-fg)]">2.1 kB</b> gzip
              </span>
              <span>
                <b className="font-semibold text-[var(--color-fg)]">0</b> deps
              </span>
              <span>
                <b className="font-semibold text-[var(--color-fg)]">MIT</b> license
              </span>
            </div>
          </BorderBeamPanel>
        </div>
      </div>

      <ControlBar label="Border beam controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Beams</span>
        <ControlSegmented
          label="Comet count"
          value={beams}
          onChange={setBeams}
          options={[
            { value: "1", label: "1" },
            { value: "2", label: "2 (coral)" },
          ]}
        />
        <ControlDivider />
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Orbit</span>
        <ControlSegmented
          label="Orbit speed"
          value={tempo}
          onChange={setTempo}
          options={[
            { value: "calm", label: "Calm" },
            { value: "normal", label: "Normal" },
            { value: "quick", label: "Quick" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={glow} onPressedChange={setGlow}>
          Cast glow
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
      </ControlBar>
    </div>
  );
}

export default BorderBeamPanelPreview;
