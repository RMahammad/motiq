"use client";

import * as React from "react";

import { RisoRegistrationBackground } from "@/registry/backgrounds/riso-registration";
import {
  ControlBar,
  ControlToggle,
  ControlDivider,
} from "../_components/preview-controls";

const SAFE = { x: 0.05, y: 0.14, w: 0.5, h: 0.72 };

/**
 * The component now commits to a fixed dark Motion Lab palette (see
 * riso-registration.tsx) — the hero copy must match the lab's `.hero` styling
 * exactly (fixed light ink + text-shadow), NOT theme tokens, since those can
 * be dark-on-dark against the always-dark canvas.
 */
const LAB_ACCENT = "#ff5c93"; // Press Run stage accent (root --pink)

const heroPillStyle: React.CSSProperties = {
  color: "#8f95ab",
  border: "1px solid #232636",
  background: "rgba(10,11,16,.55)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  borderRadius: 999,
};

const heroTitleStyle: React.CSSProperties = {
  color: "#eceef8",
  fontWeight: 800,
  textShadow: "0 2px 26px rgba(10,11,16,.95), 0 0 3px rgba(10,11,16,.7)",
};

const heroBodyStyle: React.CSSProperties = {
  color: "#b7bccf",
  textShadow: "0 1px 18px rgba(10,11,16,.95)",
};

// Lab literal: the riso CTA gets a `color:#fff` override (pink is dimmer than
// the other stage accents, so the lab keeps the CTA label white there).
const heroCtaStyle: React.CSSProperties = {
  background: LAB_ACCENT,
  color: "#fff",
  fontWeight: 700,
  borderRadius: 10,
};

const heroGhostStyle: React.CSSProperties = {
  border: "1px solid #232636",
  color: "#eceef8",
  background: "rgba(10,11,16,.5)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  borderRadius: 10,
};

export function RisoRegistrationPreview() {
  const [density, setDensity] = React.useState(1);
  const [speed, setSpeed] = React.useState(1);
  const [intensity, setIntensity] = React.useState(1);
  const [motion, setMotion] = React.useState(true);
  const [showSafe, setShowSafe] = React.useState(false);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-md)]">
        <RisoRegistrationBackground
          density={density}
          speed={speed}
          intensity={intensity}
          reducedMotion={!motion || undefined}
          safeArea={SAFE}
          className="min-h-[440px]"
        >
          {/* Foreground content sits over the safe area and stays readable. */}
          <div className="relative flex min-h-[440px] flex-col justify-center px-7 py-10 sm:px-10">
            <span
              className="mb-4 inline-flex w-fit items-center gap-2 px-3 py-1 text-[12px] font-mono tracking-wide"
              style={heroPillStyle}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: LAB_ACCENT }} /> Ambient background
            </span>
            <h2
              className="max-w-[16ch] text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.06] tracking-tight"
              style={heroTitleStyle}
            >
              Two plates, never quite in register.
            </h2>
            <p className="mt-4 max-w-[42ch] text-[15px] leading-relaxed" style={heroBodyStyle}>
              Two halftone ink plates drift toward and past alignment on independent cycles, thinning
              over the safe area - so the headline, copy, and CTA stay crisp on top.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 text-[14px] transition-transform hover:-translate-y-0.5"
                style={heroCtaStyle}
              >
                Get started
              </button>
              <button type="button" className="px-4 py-2 text-[14px] font-semibold" style={heroGhostStyle}>
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
        </RisoRegistrationBackground>
      </div>

      {/* Real controls, all wired to props. */}
      <ControlBar label="Background controls">
        <label className="flex items-center gap-2 whitespace-nowrap text-[12.5px] font-medium text-[var(--color-muted)]">
          Density
          <input
            type="range"
            min={0.6}
            max={1.6}
            step={0.1}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="h-1 w-20 cursor-pointer accent-[var(--color-accent)]"
            aria-label="Dot density"
          />
        </label>
        <label className="flex items-center gap-2 whitespace-nowrap text-[12.5px] font-medium text-[var(--color-muted)]">
          Drift
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="h-1 w-20 cursor-pointer accent-[var(--color-accent)]"
            aria-label="Drift amount"
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
            className="h-1 w-20 cursor-pointer accent-[var(--color-accent)]"
            aria-label="Ink intensity"
          />
        </label>
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

export default RisoRegistrationPreview;
