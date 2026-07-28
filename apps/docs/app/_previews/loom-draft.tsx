"use client";

import * as React from "react";

import { LoomDraft } from "@/registry/backgrounds/loom-draft";
import {
  ControlBar,
  ControlToggle,
  ControlDivider,
} from "../_components/preview-controls";

const SAFE = { x: 0.05, y: 0.14, w: 0.5, h: 0.72 };

export function LoomDraftPreview() {
  const [density, setDensity] = React.useState(1);
  const [intensity, setIntensity] = React.useState(1);
  const [speed, setSpeed] = React.useState(1);
  const [motion, setMotion] = React.useState(true);
  const [interactive, setInteractive] = React.useState(true);
  const [showSafe, setShowSafe] = React.useState(false);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-md)]">
        <LoomDraft
          density={density}
          intensity={intensity}
          speed={speed}
          reducedMotion={!motion || undefined}
          interactive={interactive}
          safeArea={SAFE}
          className="min-h-[440px]"
        >
          {/* Foreground content sits over the safe area and stays readable. The
              component commits to a fixed dark palette (Motion Lab), so the hero
              uses the lab's own fixed light colors + text-shadow, not theme tokens. */}
          <div className="relative flex min-h-[440px] flex-col justify-center px-7 py-10 sm:px-10">
            <span
              className="mb-4 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[12px] backdrop-blur-[8px]"
              style={{ border: "1px solid #232636", background: "rgba(10,11,16,0.55)", color: "#8f95ab" }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#35d5e5" }} /> Ambient background
            </span>
            <h2
              className="max-w-[16ch] text-[clamp(1.9rem,4.4vw,3rem)] font-extrabold leading-[1.06] tracking-tight"
              style={{ color: "#eceef8", textShadow: "0 2px 26px rgba(10,11,16,0.95), 0 0 3px rgba(10,11,16,0.7)" }}
            >
              Structure that reads like cloth, not a grid.
            </h2>
            <p
              className="mt-4 max-w-[42ch] text-[15px] leading-relaxed"
              style={{ color: "#b7bccf", textShadow: "0 1px 18px rgba(10,11,16,0.95)" }}
            >
              Warp and weft cross in a seeded jacquard draft and breathe gently at the fabric&apos;s edge - simplifying
              to a plain weave behind your headline.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-[10px] px-4 py-2 text-[14px] font-bold transition-transform hover:-translate-y-0.5"
                style={{ background: "#35d5e5", color: "#0a0b10" }}
              >
                Get started
              </button>
              <button
                type="button"
                className="rounded-[10px] px-4 py-2 text-[14px] font-semibold backdrop-blur-[8px]"
                style={{ border: "1px solid #232636", background: "rgba(10,11,16,0.5)", color: "#eceef8" }}
              >
                View docs
              </button>
            </div>
          </div>

          {/* Safe-area visualizer (toggle). */}
          {showSafe ? (
            <div
              aria-hidden
              className="pointer-events-none absolute rounded-xl border-2 border-dashed"
              style={{
                left: `${SAFE.x * 100}%`,
                top: `${SAFE.y * 100}%`,
                width: `${SAFE.w * 100}%`,
                height: `${SAFE.h * 100}%`,
                borderColor: "#35d5e5",
                background: "rgba(53,213,229,0.06)",
              }}
            >
              <span className="absolute -top-2.5 left-3 px-1.5 text-[11px] font-medium" style={{ background: "#0a0b10", color: "#35d5e5" }}>
                safe area
              </span>
            </div>
          ) : null}
        </LoomDraft>
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
            className="h-1 w-16 cursor-pointer accent-[var(--color-accent)]"
            aria-label="Warp/weft density"
          />
        </label>
        <label className="flex items-center gap-2 whitespace-nowrap text-[12.5px] font-medium text-[var(--color-muted)]">
          Intensity
          <input
            type="range"
            min={0.4}
            max={1.4}
            step={0.1}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="h-1 w-16 cursor-pointer accent-[var(--color-accent)]"
            aria-label="Ink intensity"
          />
        </label>
        <label className="flex items-center gap-2 whitespace-nowrap text-[12.5px] font-medium text-[var(--color-muted)]">
          Speed
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="h-1 w-16 cursor-pointer accent-[var(--color-accent)]"
            aria-label="Breathing speed"
          />
        </label>
        <ControlDivider />
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
        <ControlToggle pressed={interactive} onPressedChange={setInteractive}>
          Interactive
        </ControlToggle>
        <ControlToggle pressed={showSafe} onPressedChange={setShowSafe}>
          Show safe area
        </ControlToggle>
      </ControlBar>
    </div>
  );
}

export default LoomDraftPreview;
