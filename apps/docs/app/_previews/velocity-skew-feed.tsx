"use client";

import * as React from "react";

import { VelocitySkewFeed } from "@/registry/scroll/velocity-skew-feed";
import { ControlBar, ControlSegmented, ControlToggle, ControlDivider } from "../_components/preview-controls";

/** Fixed activity log — no randomness, so server and client render identically. */
const FEED: Array<[string, string, string, string]> = [
  ["Mira Chen", "approved the release checklist", "2m", "review"],
  ["deploy-bot", "shipped v0.9.4 to production", "6m", "deploy"],
  ["Jonas Weber", "commented on the parallax RFC", "11m", "rfc"],
  ["Priya Nair", "merged scroll-count-stats #482", "18m", "merge"],
  ["Ana Sofia Duarte", "recorded a 60 fps capture for the docs", "24m", "docs"],
  ["Motiq CI", "216 interaction tests passed", "31m", "ci"],
  ["Leo Marchetti", "tuned the curtain wipe damping", "44m", "motion"],
  ["Sara Kim", "filed a Safari clip-path repro", "1h", "bug"],
  ["deploy-bot", "preview built for velocity-skew-feed", "1h", "deploy"],
  ["Tomás Rivera", "proposed reduced-motion snapshot tests", "2h", "a11y"],
  ["Ingrid Halvorsen", "rewrote the odometer stagger math", "3h", "motion"],
  ["Motiq CI", "bundle size check passed — 8.4 kB gzip", "3h", "ci"],
  ["Mira Chen", "opened milestone: Batch 07 launch", "4h", "plan"],
  ["Jonas Weber", "added a pointer-parallax touch fallback", "5h", "motion"],
  ["Priya Nair", "published the lab report draft", "6h", "docs"],
  ["Ana Sofia Duarte", "archived the violet theme tokens", "7h", "design"],
];

const AVATAR_TINTS = [
  "var(--color-accent)",
  "var(--color-secondary-accent)",
  "var(--color-success)",
  "var(--color-accent-text)",
  "var(--color-warning)",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function VelocitySkewFeedPreview() {
  const [maxSkew, setMaxSkew] = React.useState("6.5");
  const [meter, setMeter] = React.useState(true);
  const [motion, setMotion] = React.useState(true);
  const [engaged, setEngaged] = React.useState(false);

  const items = React.useMemo(
    () =>
      FEED.map(([who, what, when, tag], i) => (
        <article
          key={`${who}-${i}`}
          className="flex items-start gap-3 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3"
        >
          <span
            aria-hidden
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-[var(--color-bg)]"
            style={{
              background: `linear-gradient(135deg, ${AVATAR_TINTS[i % AVATAR_TINTS.length]}, color-mix(in oklab, ${
                AVATAR_TINTS[(i + 2) % AVATAR_TINTS.length]
              } 60%, var(--color-bg)))`,
            }}
          >
            {initials(who)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] text-[var(--color-fg)]">
              <b className="font-semibold">{who}</b> {what}
            </span>
            <span className="mt-[3px] flex items-center gap-2">
              <span className="font-mono text-[10.5px] text-[var(--color-muted)]">{when} ago</span>
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-[9.5px] tracking-[0.05em] text-[var(--color-fg-secondary)]">
                {tag}
              </span>
            </span>
          </span>
        </article>
      )),
    [],
  );

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
        onScrollCapture={() => setEngaged(true)}
        onPointerDown={() => setEngaged(true)}
      >
        <VelocitySkewFeed
          scrollMode="container"
          height={460}
          items={items}
          maxSkew={Number(maxSkew)}
          meter={meter}
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
            flick this feed fast
          </span>
        ) : null}
      </div>

      <ControlBar label="Velocity skew feed controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Max shear</span>
        <ControlSegmented
          label="Maximum shear in degrees"
          value={maxSkew}
          onChange={setMaxSkew}
          options={[
            { value: "3", label: "3°" },
            { value: "6.5", label: "6.5°" },
            { value: "10", label: "10°" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={meter} onPressedChange={setMeter}>
          Velocity meter
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
      </ControlBar>
    </div>
  );
}

export default VelocitySkewFeedPreview;
