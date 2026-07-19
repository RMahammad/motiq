"use client";

import * as React from "react";

import { LuminousTopography } from "@/registry/backgrounds/luminous-topography";
import {
  ControlBar,
  ControlSegmented,
  ControlToggle,
  ControlDivider,
} from "../_components/preview-controls";

const SAFE = { x: 0.05, y: 0.14, w: 0.5, h: 0.72 };

export function LuminousTopographyPreview() {
  const [density, setDensity] = React.useState(1.1);
  const [depth, setDepth] = React.useState(3);
  const [motion, setMotion] = React.useState(true);
  const [showSafe, setShowSafe] = React.useState(false);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-md)]">
        <LuminousTopography
          density={density}
          depth={depth}
          reducedMotion={!motion || undefined}
          focalPoint={[{ x: 0.74, y: 0.32 }, { x: 0.9, y: 0.72 }]}
          safeArea={SAFE}
          interactive
          className="min-h-[440px]"
        >
          {/* Foreground content sits over the safe area and stays readable. */}
          <div className="relative flex min-h-[440px] flex-col justify-center px-7 py-10 sm:px-10">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] px-3 py-1 text-[12px] text-[var(--color-muted)] backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> Ambient background
            </span>
            <h2 className="max-w-[16ch] text-[clamp(1.9rem,4.4vw,3rem)] font-semibold leading-[1.06] tracking-tight text-[var(--color-fg)]">
              Depth that reads like a map, not noise.
            </h2>
            <p className="mt-4 max-w-[42ch] text-[15px] leading-relaxed text-[var(--color-muted)]">
              Layered topographic contours flow around your focal points and thin out over the safe area - so the
              headline, copy, and CTA stay crisp on top.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-[14px] font-medium text-[var(--color-accent-fg,#fff)] shadow-[var(--shadow-sm)] transition-transform hover:-translate-y-0.5"
              >
                Get started
              </button>
              <button
                type="button"
                className="rounded-lg border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_65%,transparent)] px-4 py-2 text-[14px] font-medium text-[var(--color-fg)] backdrop-blur hover:border-[var(--color-accent)]"
              >
                View docs
              </button>
            </div>
          </div>

          {/* Safe-area visualizer (toggle). */}
          {showSafe ? (
            <div
              aria-hidden
              className="pointer-events-none absolute rounded-xl border-2 border-dashed border-[var(--color-accent)]"
              style={{
                left: `${SAFE.x * 100}%`,
                top: `${SAFE.y * 100}%`,
                width: `${SAFE.w * 100}%`,
                height: `${SAFE.h * 100}%`,
                background: "color-mix(in oklab, var(--color-accent) 6%, transparent)",
              }}
            >
              <span className="absolute -top-2.5 left-3 bg-[var(--color-bg)] px-1.5 text-[11px] font-medium text-[var(--color-accent)]">
                safe area
              </span>
            </div>
          ) : null}
        </LuminousTopography>
      </div>

      {/* Real controls, all wired to props. */}
      <ControlBar label="Background controls">
        <label className="flex items-center gap-2 whitespace-nowrap text-[12.5px] font-medium text-[var(--color-muted)]">
          Density
          <input
            type="range"
            min={0.4}
            max={1.6}
            step={0.1}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="h-1 w-24 cursor-pointer accent-[var(--color-accent)]"
            aria-label="Contour density"
          />
        </label>
        <ControlDivider />
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Depth</span>
        <ControlSegmented
          label="Depth layers"
          value={String(depth)}
          onChange={(v) => setDepth(Number(v))}
          options={[
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
        <ControlToggle pressed={showSafe} onPressedChange={setShowSafe}>
          Show safe area
        </ControlToggle>
      </ControlBar>
    </div>
  );
}
