"use client";

import * as React from "react";

import { AuroraPanel } from "@/registry/creative/aurora-panel";
import { ControlBar, ControlDivider, ControlSegmented, ControlToggle } from "../_components/preview-controls";

export function AuroraPanelPreview() {
  const [ribbons, setRibbons] = React.useState("3");
  const [tempo, setTempo] = React.useState("1");
  const [grain, setGrain] = React.useState(true);
  const [lean, setLean] = React.useState(true);
  const [motion, setMotion] = React.useState(true);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="grid w-full place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-6 py-10">
        <div className="w-full max-w-[480px]">
          <AuroraPanel
            ribbons={Number(ribbons)}
            speed={Number(tempo)}
            grain={grain ? 0.4 : 0}
            lean={lean}
            reducedMotion={!motion || undefined}
            seed={7}
            overlay={
              <span className="rounded-full border border-white/20 bg-black/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white backdrop-blur-[6px]">
                Live surface
              </span>
            }
          >
            <div className="flex items-baseline gap-2.5">
              <h3 className="font-mono text-[18px] font-semibold tracking-tight text-[var(--color-fg)]">aurora-panel</h3>
              <span className="rounded-full border border-[color-mix(in_oklab,var(--color-success)_40%,transparent)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-success)]">
                New
              </span>
            </div>
            <p className="mt-2.5 text-[13.5px] text-[var(--color-fg-secondary)]">
              Three sinusoidal ribbons drift across a canvas header and lean toward the pointer — a contained sky for
              cards, not another full-page background.
            </p>
            <div className="mt-4 overflow-x-auto whitespace-nowrap rounded-md border border-[var(--color-border)] bg-[var(--color-code-bg)] px-3 py-2.5 font-mono text-[11.5px] text-[var(--color-code-fg)]">
              npx shadcn add @motiq/aurora-panel
            </div>
            <div className="mt-3.5 flex gap-4 font-mono text-[11px] text-[var(--color-muted)]">
              <span>
                <b className="font-semibold text-[var(--color-fg)]">3.4 kB</b> gzip
              </span>
              <span>
                <b className="font-semibold text-[var(--color-fg)]">Canvas 2D</b>
              </span>
              <span>
                <b className="font-semibold text-[var(--color-fg)]">rm-safe</b>
              </span>
            </div>
          </AuroraPanel>
        </div>
      </div>

      <ControlBar label="Aurora panel controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Ribbons</span>
        <ControlSegmented
          label="Ribbon count"
          value={ribbons}
          onChange={setRibbons}
          options={[
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "5", label: "5" },
          ]}
        />
        <ControlDivider />
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Speed</span>
        <ControlSegmented
          label="Drift speed"
          value={tempo}
          onChange={setTempo}
          options={[
            { value: "0.5", label: "Slow" },
            { value: "1", label: "Normal" },
            { value: "1.8", label: "Brisk" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={lean} onPressedChange={setLean}>
          Pointer lean
        </ControlToggle>
        <ControlToggle pressed={grain} onPressedChange={setGrain}>
          Grain
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
      </ControlBar>
    </div>
  );
}

export default AuroraPanelPreview;
