"use client";

import * as React from "react";

import { MagneticDock, type DockItem } from "@/registry/cursor/magnetic-dock";
import { ControlBar, ControlDivider, ControlSegmented, ControlToggle, ControlHint } from "../_components/preview-controls";

const svg = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const ITEMS: DockItem[] = [
  { id: "compose", label: "Compose", icon: svg(<><path d="M4 20l3.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20z" /><path d="M13.5 6.5l3 3" /></>) },
  { id: "search", label: "Search", icon: svg(<><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></>) },
  { id: "deploy", label: "Deploy", icon: svg(<><path d="M12 19V5" /><path d="M6 11l6-6 6 6" /></>) },
  { id: "metrics", label: "Metrics", icon: svg(<><path d="M5 20V12" /><path d="M12 20V6" /><path d="M19 20v-5" /></>) },
  { id: "voice", label: "Voice", icon: svg(<><path d="M4 12v2" /><path d="M8 9v8" /><path d="M12 5v14" /><path d="M16 8v9" /><path d="M20 11v4" /></>) },
  { id: "vault", label: "Vault", icon: svg(<><rect x="5" y="10" width="14" height="9" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>) },
  { id: "prism", label: "Prism", icon: svg(<><path d="M12 4l8 15H4l8-15z" /><path d="M12 4v15" /></>) },
  { id: "relay", label: "Relay", icon: svg(<><path d="M21 4L10.5 13.5" /><path d="M21 4l-6.5 16-4-6.5L4 9.5 21 4z" /></>) },
];

export function MagneticDockPreview() {
  const [magnetRadius, setMagnetRadius] = React.useState(78);
  const [swell, setSwell] = React.useState<"subtle" | "classic" | "showpiece">("classic");
  const [idleWave, setIdleWave] = React.useState(true);
  const [tooltip, setTooltip] = React.useState(true);
  const [motion, setMotion] = React.useState(true);
  const [picked, setPicked] = React.useState<string | null>(null);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-md)]"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -20%, color-mix(in oklab, var(--color-accent) 9%, transparent), transparent 60%), var(--color-bg-elevated)",
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-10 text-center" aria-hidden>
          <div className="text-[clamp(20px,3.2vw,30px)] font-bold tracking-tight text-[var(--color-fg)]">Workspace</div>
          <div className="mt-1.5 font-mono text-[12.5px] text-[var(--color-muted)]">
            8 apps · field radius {magnetRadius}px
          </div>
        </div>

        <MagneticDock
          items={ITEMS}
          magnetRadius={magnetRadius}
          maxScale={swell === "subtle" ? 1.35 : swell === "classic" ? 1.5 : 1.95}
          lift={swell === "subtle" ? 16 : swell === "classic" ? 24 : 40}
          idleWave={idleWave}
          tooltip={tooltip}
          reducedMotion={!motion || undefined}
          onSelect={setPicked}
          className="pt-24 pb-6"
        />
      </div>

      <ControlBar label="Dock controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Field σ</span>
        <ControlSegmented
          label="Magnet radius"
          value={String(magnetRadius)}
          onChange={(v) => setMagnetRadius(Number(v))}
          options={[
            { value: "48", label: "48px" },
            { value: "78", label: "78px" },
            { value: "120", label: "120px" },
          ]}
        />
        <ControlDivider />
        <ControlSegmented
          label="Swell"
          value={swell}
          onChange={(v) => setSwell(v as "subtle" | "classic" | "showpiece")}
          options={[
            { value: "subtle", label: "Subtle" },
            { value: "classic", label: "Classic" },
            { value: "showpiece", label: "Showpiece" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={idleWave} onPressedChange={setIdleWave}>
          Idle wave
        </ControlToggle>
        <ControlToggle pressed={tooltip} onPressedChange={setTooltip}>
          Tooltip
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
        <ControlHint live>{picked ? `Launched "${picked}"` : "Sweep the dock, or Tab through it"}</ControlHint>
      </ControlBar>
    </div>
  );
}

export default MagneticDockPreview;
