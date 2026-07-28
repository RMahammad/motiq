"use client";

import * as React from "react";

import { GlassRefractionPanel, type GlassRefractionLayer } from "@/registry/creative/glass-refraction-panel";
import { ControlBar, ControlDivider, ControlSegmented, ControlToggle } from "../_components/preview-controls";

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="shrink-0 text-[var(--color-secondary-accent)]">
    <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LAYERS: GlassRefractionLayer[] = [
  {
    id: "installs",
    depth: 26,
    position: { top: "13%", left: "8%" },
    node: (
      <span className="flex items-center gap-2 font-mono">
        <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-[var(--color-success)]" aria-hidden />
        <span>
          <b className="font-semibold text-[var(--color-fg)]">4,900+</b> installs / week
        </span>
      </span>
    ),
  },
  {
    id: "catalog",
    depth: 9,
    position: { bottom: "12%", right: "7%" },
    node: (
      <span className="font-mono">
        <b className="font-semibold text-[var(--color-fg)]">128</b> components · 24 categories
      </span>
    ),
  },
];

export function GlassRefractionPanelPreview() {
  const [blur, setBlur] = React.useState("16");
  const [parallax, setParallax] = React.useState(true);
  const [streak, setStreak] = React.useState(true);
  const [motion, setMotion] = React.useState(true);
  const [scene, setScene] = React.useState<"orbs" | "none">("orbs");

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <GlassRefractionPanel
        layers={LAYERS}
        scene={scene}
        blur={Number(blur)}
        parallax={parallax ? 1 : 0}
        streakOnEnter={streak}
        reducedMotion={!motion || undefined}
        minHeight={420}
        className="border border-[var(--color-border)]"
      >
        <h3 className="text-[20px] font-semibold tracking-tight text-[var(--color-fg)]">Everything ships free</h3>
        <p className="mt-2 text-[13.5px] text-[var(--color-fg-secondary)]">
          The full Motiq catalog — every card, background, and block — is open source and yours to keep.
        </p>
        <ul className="mt-4 grid gap-2.5 text-[13px] text-[var(--color-fg-secondary)]">
          <li className="flex items-center gap-2.5">
            <Check /> Full source, no obfuscation
          </li>
          <li className="flex items-center gap-2.5">
            <Check /> MIT licensed, commercial OK
          </li>
          <li className="flex items-center gap-2.5">
            <Check /> Copy the code or use the CLI
          </li>
        </ul>
        <button
          type="button"
          className="mt-5 rounded-md px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_6px_18px_-8px_var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          style={{
            background:
              "linear-gradient(160deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 70%, var(--color-secondary-accent)))",
          }}
        >
          Browse the catalog
        </button>
      </GlassRefractionPanel>

      <ControlBar label="Glass panel controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Blur</span>
        <ControlSegmented
          label="Backdrop blur"
          value={blur}
          onChange={setBlur}
          options={[
            { value: "8", label: "8px" },
            { value: "16", label: "16px" },
            { value: "26", label: "26px" },
          ]}
        />
        <ControlDivider />
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Scene</span>
        <ControlSegmented<"orbs" | "none">
          label="Scene behind the glass"
          value={scene}
          onChange={setScene}
          options={[
            { value: "orbs", label: "Orbs" },
            { value: "none", label: "None" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={parallax} onPressedChange={setParallax}>
          Parallax
        </ControlToggle>
        <ControlToggle pressed={streak} onPressedChange={setStreak}>
          Entrance streak
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
      </ControlBar>
    </div>
  );
}

export default GlassRefractionPanelPreview;
