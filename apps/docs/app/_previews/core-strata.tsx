"use client";

import * as React from "react";

import { CoreStrata } from "@/registry/backgrounds/core-strata";
import {
  ControlBar,
  ControlSegmented,
  ControlToggle,
  ControlDivider,
} from "../_components/preview-controls";

const SAFE = { x: 0.05, y: 0.14, w: 0.5, h: 0.72 };

/** Fixed Motion Lab "Deep Scan" hero colors — the component now paints an
 *  opaque dark ground, so the hero copy must use the lab's fixed light
 *  values (not theme tokens, which are dark-on-light and would go invisible
 *  in light mode). */
const LAB = {
  ground: "#0a0b10",
  line: "#232636",
  ink: "#eceef8",
  muted: "#8f95ab",
  body: "#b7bccf",
  amber: "#e8a852",
};

export function CoreStrataPreview() {
  const [density, setDensity] = React.useState(1.1);
  const [faults, setFaults] = React.useState(3);
  const [motion, setMotion] = React.useState(true);
  const [showSafe, setShowSafe] = React.useState(false);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div
        className="relative w-full overflow-hidden rounded-2xl shadow-[var(--shadow-md)]"
        style={{ border: `1px solid ${LAB.line}`, background: LAB.ground }}
      >
        <CoreStrata
          density={density}
          faults={faults}
          reducedMotion={!motion || undefined}
          safeArea={SAFE}
          className="min-h-[440px]"
        >
          {/* Foreground content sits over the safe area and stays readable.
              Fixed lab colors + text-shadow — the component paints an opaque
              dark ground, so these are NOT theme tokens. */}
          <div className="relative flex min-h-[440px] flex-col justify-center px-7 py-10 sm:px-10">
            <span
              className="mb-4 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[12px] backdrop-blur-[8px]"
              style={{ color: LAB.muted, border: `1px solid ${LAB.line}`, background: "rgba(10,11,16,.55)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: LAB.amber }} /> Ambient background
            </span>
            <h2
              className="max-w-[16ch] text-[clamp(1.9rem,4.4vw,3rem)] font-extrabold leading-[1.06] tracking-tight"
              style={{ color: LAB.ink, textShadow: "0 2px 26px rgba(10,11,16,.95), 0 0 3px rgba(10,11,16,.7)" }}
            >
              Depth that scrolls like a core sample, not decoration.
            </h2>
            <p
              className="mt-4 max-w-[42ch] text-[15px] leading-relaxed"
              style={{ color: LAB.body, textShadow: "0 1px 18px rgba(10,11,16,.95)" }}
            >
              Sediment bands drift upward past a fixed reading line, fault breaks step cleanly around your
              content, and marker bands catch light at the exact moment they pass.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-[10px] px-4 py-2 text-[14px] font-bold transition-transform hover:-translate-y-0.5"
                style={{ background: LAB.amber, color: LAB.ground }}
              >
                Get started
              </button>
              <button
                type="button"
                className="rounded-[10px] px-4 py-2 text-[14px] font-semibold backdrop-blur-[8px]"
                style={{ border: `1px solid ${LAB.line}`, color: LAB.ink, background: "rgba(10,11,16,.5)" }}
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
                borderColor: LAB.amber,
                background: "rgba(232,168,82,.06)",
              }}
            >
              <span
                className="absolute -top-2.5 left-3 px-1.5 text-[11px] font-medium"
                style={{ background: LAB.ground, color: LAB.amber }}
              >
                safe area
              </span>
            </div>
          ) : null}
        </CoreStrata>
      </div>

      {/* Real controls, all wired to props. */}
      <ControlBar label="Background controls">
        <label className="flex items-center gap-2 whitespace-nowrap text-[12.5px] font-medium text-[var(--color-muted)]">
          Density
          <input
            type="range"
            min={0.5}
            max={1.6}
            step={0.1}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="h-1 w-24 cursor-pointer accent-[var(--color-accent)]"
            aria-label="Sediment density"
          />
        </label>
        <ControlDivider />
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Faults</span>
        <ControlSegmented
          label="Fault breaks"
          value={String(faults)}
          onChange={(v) => setFaults(Number(v))}
          options={[
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

export default CoreStrataPreview;
