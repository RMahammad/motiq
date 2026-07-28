"use client";

import * as React from "react";

import { ProximityType } from "@/registry/text/proximity-type";
import {
  ControlBar,
  ControlDivider,
  ControlSegmented,
  ControlToggle,
} from "../_components/preview-controls";

const LINE = "Gravity has a typeface.";

export function ProximityTypePreview() {
  const [radius, setRadius] = React.useState("180");
  const [glow, setGlow] = React.useState(true);
  const [idleWave, setIdleWave] = React.useState(true);
  const [smooth, setSmooth] = React.useState(true);
  const [motion, setMotion] = React.useState(true);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="grid w-full place-items-center gap-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-6 py-16 text-center">
        <ProximityType
          text={LINE}
          as="h2"
          radius={Number(radius)}
          glow={glow}
          idleWave={idleWave}
          falloff={smooth ? "smooth" : "linear"}
          reducedMotion={!motion || undefined}
        />
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-muted)]">
          move the pointer — or a finger — through the line
        </p>
      </div>

      <ControlBar label="Proximity controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Radius</span>
        <ControlSegmented
          label="Reaction radius"
          value={radius}
          onChange={setRadius}
          options={[
            { value: "110", label: "110px" },
            { value: "180", label: "180px" },
            { value: "280", label: "280px" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={smooth} onPressedChange={setSmooth}>
          Smooth falloff
        </ControlToggle>
        <ControlToggle pressed={glow} onPressedChange={setGlow}>
          Glow
        </ControlToggle>
        <ControlToggle pressed={idleWave} onPressedChange={setIdleWave}>
          Idle breathing
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
      </ControlBar>
    </div>
  );
}

export default ProximityTypePreview;
