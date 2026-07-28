"use client";

import * as React from "react";

import { HoloCard } from "@/registry/creative/holo-card";
import { ControlBar, ControlDivider, ControlSegmented, ControlToggle } from "../_components/preview-controls";

type Foil = "spectral" | "azure" | "none";

export function HoloCardPreview() {
  const [foil, setFoil] = React.useState<Foil>("spectral");
  const [glare, setGlare] = React.useState(true);
  const [shadow, setShadow] = React.useState(true);
  const [motion, setMotion] = React.useState(true);
  const [tilt, setTilt] = React.useState("14");

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="grid w-full place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-6 pb-14 pt-10">
        <div className="w-full max-w-[380px]">
          <HoloCard
            foil={foil}
            glare={glare}
            shadow={shadow}
            maxTilt={Number(tilt)}
            reducedMotion={!motion || undefined}
            label="Motiq open pass membership card"
          >
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-extrabold tracking-[0.22em] text-[var(--color-fg)]">MOTIQ</span>
              <span className="rounded border border-[var(--color-border-strong)] px-2 py-0.5 font-mono text-[9px] tracking-[0.2em] text-[var(--color-accent-text)]">
                OPEN PASS
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <svg viewBox="0 0 44 34" className="h-[34px] w-11 shrink-0" aria-hidden>
                <rect x="1" y="1" width="42" height="32" rx="6" fill="none" stroke="var(--color-border-strong)" strokeWidth="1.5" />
                <path
                  d="M1 12 h13 v10 h-13 M43 12 h-13 v10 h13 M17 1 v8 M27 1 v8 M17 33 v-8 M27 33 v-8"
                  fill="none"
                  stroke="var(--color-border-strong)"
                  strokeWidth="1.2"
                />
                <rect x="17" y="12" width="10" height="10" rx="2" fill="var(--color-accent)" opacity="0.55" />
              </svg>
              <div>
                <div className="text-[26px] font-bold leading-none tracking-tight text-[var(--color-fg)]">128</div>
                <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  components · all free
                </div>
              </div>
            </div>

            <div className="flex justify-between font-mono text-[10px] tracking-[0.06em] text-[var(--color-muted)]">
              <span>M-0128-2607</span>
              <span>MIT · SINCE 2026</span>
            </div>
          </HoloCard>
        </div>
      </div>

      <ControlBar label="Holo card controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Foil</span>
        <ControlSegmented<Foil>
          label="Foil sheet"
          value={foil}
          onChange={setFoil}
          options={[
            { value: "spectral", label: "Spectral" },
            { value: "azure", label: "Azure" },
            { value: "none", label: "None" },
          ]}
        />
        <ControlDivider />
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Max tilt</span>
        <ControlSegmented
          label="Maximum tilt"
          value={tilt}
          onChange={setTilt}
          options={[
            { value: "8", label: "8°" },
            { value: "14", label: "14°" },
            { value: "20", label: "20°" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={glare} onPressedChange={setGlare}>
          Glare
        </ControlToggle>
        <ControlToggle pressed={shadow} onPressedChange={setShadow}>
          Shadow
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
      </ControlBar>
    </div>
  );
}

export default HoloCardPreview;
