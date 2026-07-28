"use client";

import * as React from "react";

import { ScrollCountStats, type CountStat } from "@/registry/scroll/scroll-count-stats";
import { ControlBar, ControlSegmented, ControlToggle, ControlDivider } from "../_components/preview-controls";

/** Fixed series — the sparklines trace the same shape on every render. */
const STATS: CountStat[] = [
  {
    value: 48210,
    label: "registry installs, trailing 90 days",
    sparkline: [6, 10, 8, 14, 12, 19, 17, 24, 22, 29, 31],
  },
  {
    value: "99.98",
    suffix: "%",
    label: "of scroll frames inside the 16.6 ms budget",
    sparkline: [12, 14, 11, 16, 14, 19, 18, 24, 22, 26, 28],
  },
  {
    value: 312,
    label: "easing-curve commits behind this batch",
    sparkline: [6, 5, 10, 8, 14, 12, 19, 17, 23, 22, 28],
  },
];

export function ScrollCountStatsPreview() {
  const [overshoot, setOvershoot] = React.useState("0.35");
  const [underline, setUnderline] = React.useState(true);
  const [scrub, setScrub] = React.useState(true);
  const [motion, setMotion] = React.useState(true);
  const [engaged, setEngaged] = React.useState(false);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
        onScrollCapture={() => setEngaged(true)}
        onPointerDown={() => setEngaged(true)}
      >
        <ScrollCountStats
          scrollMode="container"
          height={460}
          rowHeight={42}
          stats={STATS}
          title="Numbers that rewind"
          description="scrub note: scroll back — the whole band unwinds"
          underline={underline ? "signature" : "none"}
          overshoot={Number(overshoot)}
          showProgress={scrub}
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
            scroll inside · then scroll back
          </span>
        ) : null}
      </div>

      <ControlBar label="Scroll count stats controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Overshoot</span>
        <ControlSegmented
          label="Digit overshoot in rows"
          value={overshoot}
          onChange={setOvershoot}
          options={[
            { value: "0", label: "none" },
            { value: "0.35", label: "0.35" },
            { value: "0.7", label: "0.70" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={underline} onPressedChange={setUnderline}>
          Signature underline
        </ControlToggle>
        <ControlToggle pressed={scrub} onPressedChange={setScrub}>
          Scrub readout
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
      </ControlBar>
    </div>
  );
}

export default ScrollCountStatsPreview;
