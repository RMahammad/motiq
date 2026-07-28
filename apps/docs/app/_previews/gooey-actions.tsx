"use client";

import * as React from "react";

import { GooeyActions, type GooeyAction } from "@/registry/cursor/gooey-actions";
import { ControlBar, ControlDivider, ControlSegmented, ControlToggle, ControlHint } from "../_components/preview-controls";

const svg = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const ACTIONS: GooeyAction[] = [
  { id: "reply", label: "Reply", icon: svg(<><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 6 6v3" /></>) },
  { id: "star", label: "Star", icon: svg(<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" />) },
  {
    id: "share",
    label: "Share",
    icon: svg(
      <>
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="17" cy="6" r="2.5" />
        <circle cx="17" cy="18" r="2.5" />
        <path d="M8.3 10.8l6.4-3.6" />
        <path d="M8.3 13.2l6.4 3.6" />
      </>,
    ),
  },
  { id: "edit", label: "Edit", icon: svg(<path d="M4 20l3.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20z" />) },
  {
    id: "archive",
    label: "Archive",
    icon: svg(
      <>
        <rect x="3" y="4" width="18" height="5" rx="1" />
        <path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" />
        <path d="M10 13h4" />
      </>,
    ),
  },
];

export function GooeyActionsPreview() {
  const [radius, setRadius] = React.useState(118);
  const [magnet, setMagnet] = React.useState(true);
  const [autoPeek, setAutoPeek] = React.useState(true);
  const [motion, setMotion] = React.useState(true);
  const [committed, setCommitted] = React.useState<string | null>(null);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-md)]"
        style={{
          background:
            "radial-gradient(100% 100% at 50% 120%, color-mix(in oklab, var(--color-accent) 10%, transparent), transparent 55%), var(--color-bg-elevated)",
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-9 text-center" aria-hidden>
          <div className="text-[clamp(20px,3vw,28px)] font-bold tracking-tight text-[var(--color-fg)]">
            One button, five intents
          </div>
          <div className="mt-1 font-mono text-[12.5px] text-[var(--color-muted)]">
            goo: blur 10 → alpha ×24 −12
          </div>
        </div>

        <GooeyActions
          actions={ACTIONS}
          radius={radius}
          magnetRange={magnet ? 52 : 0}
          autoPeek={autoPeek}
          reducedMotion={!motion || undefined}
          onSelect={setCommitted}
          seed={4}
          className="min-h-[440px]"
        />
      </div>

      <ControlBar label="Action dial controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Radius</span>
        <ControlSegmented
          label="Bloom radius"
          value={String(radius)}
          onChange={(v) => setRadius(Number(v))}
          options={[
            { value: "90", label: "90px" },
            { value: "118", label: "118px" },
            { value: "150", label: "150px" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={magnet} onPressedChange={setMagnet}>
          Magnetic hover
        </ControlToggle>
        <ControlToggle pressed={autoPeek} onPressedChange={setAutoPeek}>
          Auto peek
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
        <ControlHint live>{committed ? `Committed "${committed}"` : "Click the core, or open it with Enter"}</ControlHint>
      </ControlBar>
    </div>
  );
}

export default GooeyActionsPreview;
