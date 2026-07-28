"use client";

import * as React from "react";

import { CursorComet } from "@/registry/cursor/cursor-comet";
import { ControlBar, ControlDivider, ControlSegmented, ControlToggle, ControlHint } from "../_components/preview-controls";

export function CursorCometPreview() {
  const [budget, setBudget] = React.useState(240);
  const [sparkThreshold, setSparkThreshold] = React.useState(900);
  const [idleOrbit, setIdleOrbit] = React.useState(true);
  const [motion, setMotion] = React.useState(true);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div
        className="w-full overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-md)]"
        style={{
          background:
            "radial-gradient(90% 120% at 80% 110%, color-mix(in oklab, var(--color-secondary-accent) 7%, transparent), transparent 55%), radial-gradient(90% 120% at 15% -10%, color-mix(in oklab, var(--color-accent) 9%, transparent), transparent 55%), var(--color-bg)",
        }}
      >
        <CursorComet
          particleBudget={budget}
          sparkThreshold={sparkThreshold}
          idleOrbit={idleOrbit}
          reducedMotion={!motion || undefined}
          seed={7}
          className="cursor-crosshair"
        >
          <div className="grid min-h-[420px] place-items-center px-6 text-center">
            <div>
              <div
                className="text-[clamp(20px,3vw,28px)] font-bold tracking-tight"
                style={{ color: "color-mix(in oklab, var(--color-fg) 62%, transparent)" }}
              >
                Flick fast. Then drift.
              </div>
              <div className="mt-1 font-mono text-[12.5px] text-[var(--color-muted)]">
                tail length ∝ pointer velocity
              </div>
            </div>
          </div>
        </CursorComet>
      </div>

      <ControlBar label="Comet controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Pool</span>
        <ControlSegmented
          label="Particle budget"
          value={String(budget)}
          onChange={(v) => setBudget(Number(v))}
          options={[
            { value: "90", label: "90" },
            { value: "240", label: "240" },
            { value: "480", label: "480" },
          ]}
        />
        <ControlDivider />
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Spark at</span>
        <ControlSegmented
          label="Spark threshold"
          value={String(sparkThreshold)}
          onChange={(v) => setSparkThreshold(Number(v))}
          options={[
            { value: "400", label: "400" },
            { value: "900", label: "900" },
            { value: "1800", label: "1800" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={idleOrbit} onPressedChange={setIdleOrbit}>
          Idle orbit
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
        <ControlHint>px/s · coral sparks are the signature moment</ControlHint>
      </ControlBar>
    </div>
  );
}

export default CursorCometPreview;
