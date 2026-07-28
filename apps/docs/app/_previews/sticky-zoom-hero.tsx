"use client";

import * as React from "react";

import { StickyZoomHero } from "@/registry/scroll/sticky-zoom-hero";
import { ControlBar, ControlSegmented, ControlToggle, ControlDivider } from "../_components/preview-controls";

/** Designed bar heights — a fixed series so the demo chart is identical every render. */
const BARS = [34, 46, 40, 58, 52, 66, 61, 74, 69, 83, 78, 92];

const STAGES = [
  {
    caption: "Meet the workspace",
    body: "Every render metric on one calm surface, held at arm's length.",
    label: "framed",
    at: 0,
  },
  {
    caption: "Zoom into the detail",
    body: "The frame gives way — chrome thins out as the product fills the stage.",
    label: "zooming",
    at: 0.34,
  },
  {
    caption: "Full bleed, full focus",
    body: "At 100% the border disappears and the story continues inside the app.",
    label: "full bleed",
    at: 0.7,
  },
];

/** The consumer-supplied hero scene. Chart bars read `--mk-zoom` in pure CSS. */
function DashboardMock() {
  return (
    <div className="flex h-full min-h-[360px] flex-col">
      <div className="flex flex-[0_0_34px] items-center gap-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-3.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-signature)] opacity-65" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-warning)] opacity-65" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-success)] opacity-65" />
        <span className="mx-auto flex h-[18px] w-full max-w-[300px] flex-1 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] font-mono text-[9.5px] text-[var(--color-muted)]">
          app.motiq.dev/overview
        </span>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-[148px] shrink-0 flex-col gap-[9px] border-r border-[var(--color-border)] px-3 py-3.5 sm:flex">
          <span className="h-[22px] rounded-md border border-[color-mix(in_oklab,var(--color-accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-accent)_18%,var(--color-surface-2))]" />
          <span className="h-[22px] rounded-md bg-[var(--color-surface-2)]" />
          <span className="h-[22px] rounded-md bg-[var(--color-surface-2)]" />
          <span className="h-[22px] rounded-md bg-[var(--color-surface-2)]" />
          <span className="mt-auto h-[22px] rounded-md bg-[var(--color-surface-2)]" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3.5 px-5 py-4.5">
          <div className="flex items-baseline justify-between gap-2.5">
            <b className="text-[15px] tracking-tight text-[var(--color-fg)]">Render overview</b>
            <span className="font-mono text-[10px] text-[var(--color-muted)]">last 12 weeks</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { k: "Active teams", v: "1,284", d: "+12%", up: true },
              { k: "Render p95", v: "14.2 ms", d: "−8%", up: false },
              { k: "Exports", v: "32,904", d: "+21%", up: true },
            ].map((card) => (
              <div
                key={card.k}
                className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5"
              >
                <small className="block font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  {card.k}
                </small>
                <b className="text-[16px] tracking-tight text-[var(--color-fg)] tabular-nums">{card.v}</b>
                <em
                  className={`ml-1.5 font-mono text-[9.5px] not-italic ${
                    card.up ? "text-[var(--color-success)]" : "text-[var(--color-secondary-accent)]"
                  }`}
                >
                  {card.d}
                </em>
              </div>
            ))}
          </div>
          <div className="flex min-h-[90px] flex-1 items-end gap-1.5 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3.5 pb-2.5 pt-3">
            {BARS.map((h, i) => (
              // The wrapper carries the bar's real height; only the inner fill is
              // scaled, so growing a bar can never change the row's layout height.
              <span key={i} className="flex flex-1 items-end" style={{ height: `${h}%` }}>
                <span
                  className="block h-full w-full rounded-t-[3px] bg-[linear-gradient(180deg,var(--color-accent),color-mix(in_oklab,var(--color-accent)_40%,var(--color-secondary-accent)))]"
                  style={{
                    transformOrigin: "bottom",
                    transform: `scaleY(calc(0.3 + 0.7 * clamp(0, var(--mk-zoom, 1) * 1.6 - 0.1 - ${(i * 0.04).toFixed(2)}, 1)))`,
                  }}
                />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StickyZoomHeroPreview() {
  const [startScale, setStartScale] = React.useState("0.45");
  const [vignette, setVignette] = React.useState(true);
  const [progress, setProgress] = React.useState(true);
  const [motion, setMotion] = React.useState(true);
  const [engaged, setEngaged] = React.useState(false);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
        onScrollCapture={() => setEngaged(true)}
        onPointerDown={() => setEngaged(true)}
      >
        <StickyZoomHero
          scrollMode="container"
          height={460}
          stages={STAGES}
          startScale={Number(startScale)}
          vignette={vignette}
          showProgress={progress}
          reducedMotion={!motion || undefined}
        >
          <DashboardMock />
        </StickyZoomHero>

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

      <ControlBar label="Sticky zoom hero controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Start scale</span>
        <ControlSegmented
          label="Start scale"
          value={startScale}
          onChange={setStartScale}
          options={[
            { value: "0.35", label: "0.35" },
            { value: "0.45", label: "0.45" },
            { value: "0.6", label: "0.60" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={vignette} onPressedChange={setVignette}>
          Vignette
        </ControlToggle>
        <ControlToggle pressed={progress} onPressedChange={setProgress}>
          Progress HUD
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
      </ControlBar>
    </div>
  );
}

export default StickyZoomHeroPreview;
