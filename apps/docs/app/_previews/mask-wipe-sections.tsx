"use client";

import * as React from "react";

import { MaskWipeSections, type WipeSection } from "@/registry/scroll/mask-wipe-sections";
import { ControlBar, ControlSegmented, ControlToggle, ControlDivider } from "../_components/preview-controls";

const BARS = [38, 52, 44, 66, 58, 74, 69, 88];

function Chapter({
  kicker,
  kickerColor,
  title,
  body,
  children,
}: {
  kicker: string;
  kickerColor: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: kickerColor }}>
        {kicker}
      </div>
      <h3 className="mb-2.5 text-[clamp(22px,3.6vw,34px)] font-bold leading-tight tracking-tight text-[var(--color-fg)]">
        {title}
      </h3>
      <p className="mb-4 max-w-[460px] text-[14px] text-[var(--color-fg-secondary)]">{body}</p>
      {children}
    </>
  );
}

const SECTIONS: WipeSection[] = [
  {
    label: "draft",
    node: (
      <Chapter
        kicker="Chapter 1 · Draft"
        kickerColor="var(--color-accent-text)"
        title="Start with the motion, not the mockup"
        body="Every component begins as a choreography sheet: progress ranges, easing constants, and the one moment the eye should follow."
      >
        <div className="flex flex-wrap gap-2">
          {["progress map", "easing table", "focal beat"].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-[var(--color-border-strong)] bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] px-2.5 py-[5px] font-mono text-[11px] text-[var(--color-fg-secondary)]"
            >
              {chip}
            </span>
          ))}
        </div>
      </Chapter>
    ),
  },
  {
    wipe: "sweep",
    label: "angled sweep",
    node: (
      <Chapter
        kicker="Chapter 2 · Build"
        kickerColor="var(--color-secondary-accent)"
        title="One rAF loop, delta-time everywhere"
        body="The runtime is a single integrator per component. Springs and lerps consume real frame time, so a dropped frame never changes the destination."
      >
        <pre className="max-w-[380px] overflow-hidden whitespace-pre rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 font-mono text-[11.5px] leading-[1.7] text-[var(--color-fg-secondary)]">
{`p  = damp(p, target, 9, dt)
s += (k*(goal - s) - c*v) * dt
clip = polygon(edge(p))`}
        </pre>
      </Chapter>
    ),
  },
  {
    wipe: "iris",
    label: "iris",
    origin: [78, 30],
    node: (
      <Chapter
        kicker="Chapter 3 · Ship"
        kickerColor="var(--color-success)"
        title="Registry-first, install in one line"
        body="Components land as shadcn registry entries — copy the URL, own the source. No runtime dependency, no version treadmill."
      >
        <div className="flex max-w-[360px] items-center gap-2.5 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 text-[13px] text-[var(--color-fg)]">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-success)] shadow-[0_0_12px_var(--color-success)]" />
          <span>
            <b>mask-wipe-sections</b> published
          </span>
        </div>
      </Chapter>
    ),
  },
  {
    wipe: "curtain",
    label: "curtain",
    node: (
      <Chapter
        kicker="Chapter 4 · Learn"
        kickerColor="var(--color-warning)"
        title="Measure the feel, keep the receipts"
        body="Every batch ships with frame-budget traces and reduced-motion snapshots, so the polish survives the next refactor."
      >
        <div aria-hidden className="flex h-16 max-w-[320px] items-end gap-[7px]">
          {BARS.map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-t-[3px] bg-[linear-gradient(180deg,var(--color-warning),color-mix(in_oklab,var(--color-warning)_35%,transparent))]"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </Chapter>
    ),
  },
];

export function MaskWipeSectionsPreview() {
  const [dwell, setDwell] = React.useState("0.05");
  const [edgeGlow, setEdgeGlow] = React.useState(true);
  const [progress, setProgress] = React.useState(true);
  const [motion, setMotion] = React.useState(true);
  const [engaged, setEngaged] = React.useState(false);
  const [active, setActive] = React.useState(0);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
        onScrollCapture={() => setEngaged(true)}
        onPointerDown={() => setEngaged(true)}
      >
        <MaskWipeSections
          scrollMode="container"
          height={460}
          sections={SECTIONS}
          dwell={Number(dwell)}
          edgeGlow={edgeGlow}
          showProgress={progress}
          onSectionChange={setActive}
          reducedMotion={!motion || undefined}
        />

        {motion ? (
          <span
            aria-hidden
            className={`pointer-events-none absolute bottom-3.5 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-[7px] rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg-elevated)_82%,transparent)] px-3 py-1.5 font-mono text-[11px] text-[var(--color-fg-secondary)] transition-opacity duration-300 ${
              engaged ? "opacity-0" : "opacity-100"
            }`}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="motion-safe:animate-bounce">
              <path
                d="M1 3.5 L5 7.5 L9 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            scroll inside this stage
          </span>
        ) : null}
      </div>

      <ControlBar label="Mask wipe controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Dwell</span>
        <ControlSegmented
          label="Held beat between wipes"
          value={dwell}
          onChange={setDwell}
          options={[
            { value: "0", label: "none" },
            { value: "0.05", label: "0.05" },
            { value: "0.12", label: "0.12" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={edgeGlow} onPressedChange={setEdgeGlow}>
          Edge glow
        </ControlToggle>
        <ControlToggle pressed={progress} onPressedChange={setProgress}>
          Wipe HUD
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
        <span aria-live="polite" className="ml-auto text-[12px] text-[var(--color-muted)]">
          Chapter {active + 1} of {SECTIONS.length}
        </span>
      </ControlBar>
    </div>
  );
}

export default MaskWipeSectionsPreview;
