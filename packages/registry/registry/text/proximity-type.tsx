"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/** How reaction strength decays with distance from the pointer. */
export type ProximityFalloff = "smooth" | "linear";

export interface ProximityTypeProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** The real string. Rendered readable on the server and to screen readers. */
  text: string;
  /** Reaction radius around the pointer, in px. */
  radius?: number;
  /** Numeric font-weight range `[far, under the pointer]`. */
  weightRange?: [number, number];
  /** Weight the line rests at (and breathes around) with no pointer. */
  restWeight?: number;
  /** Peak letter-spacing directly under the pointer, e.g. `"0.06em"`. */
  spacing?: string;
  /** Accent glow + color lerp on the hottest characters. */
  glow?: boolean;
  /** Breathing weight wave that travels the line after 2s of pointer idle. */
  idleWave?: boolean;
  /** Distance curve. */
  falloff?: ProximityFalloff;
  /** Element tag for the rendered text. */
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  /** Force the static, motion-free variant regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

/** Exponential-smoothing rate — the lag between target and actual IS the gravity. */
const CHASE = 14;
/** Pointer is considered gone after this long without a move (ms). */
const IDLE_AFTER = 2000;
/** Idle breathing wave: amplitude, angular speed, per-character phase offset. */
const WAVE_AMPLITUDE = 170;
const WAVE_SPEED = 1.9;
const WAVE_PHASE = 0.5;
/** Character centers are re-measured at most this often while active (seconds). */
const RECALC_EVERY = 0.7;
/** Below this heat a character is returned to its plain rest style. */
const HEAT_FLOOR = 0.015;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * ProximityType — a headline with gravity: every character leans toward the
 * pointer by getting heavier.
 *
 * Per character the pointer distance drives a falloff `t`, which targets a
 * numeric font weight (340 → 900), letter-spacing, an accent color lerp and a
 * glow. Weights chase their targets with exponential smoothing
 * (`1 − e^(−14·dt)`), so the type visibly lags the cursor — that lag is the
 * whole effect. With no pointer for 2s a weight wave (rest ± 170) travels the
 * line and the type breathes.
 *
 * Weight is animated as an inline numeric `fontWeight`, which modern system UI
 * fonts (SF Pro, Segoe UI Variable, Roboto Flex) honour continuously and older
 * fonts snap to their nearest static cut — it degrades to a bold/regular pulse
 * rather than breaking. The animated layer is `aria-hidden` and unselectable;
 * the real string sits in a visually-hidden sibling. One rAF loop per instance,
 * parked offscreen; character centers are cached, never read mid-frame.
 * Clean-room original.
 */
export function ProximityType({
  text,
  radius = 180,
  weightRange = [340, 900],
  restWeight = 430,
  spacing = "0.06em",
  glow = true,
  idleWave = true,
  falloff = "smooth",
  as: Tag = "p",
  reducedMotion,
  className,
  style,
  ...rest
}: ProximityTypeProps) {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const charRefs = React.useRef<Array<HTMLSpanElement | null>>([]);
  const rafRef = React.useRef<number | null>(null);
  const pointerRef = React.useRef({ x: -1e5, y: -1e5, at: -Infinity });

  const systemReduced = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  // Behaviour reads the live preference immediately (effects are client-only);
  // the RENDERED attribute waits for mount so SSR markup can never disagree.
  const reduceNow = reducedMotion ?? systemReduced;
  const reduce = reducedMotion ?? (mounted ? systemReduced : false);

  const visible = useVisibilityPause(rootRef, { threshold: 0.12 });

  const [wLo, wHi] = weightRange;
  const spacingMax = React.useMemo(() => {
    const n = parseFloat(spacing);
    return Number.isFinite(n) ? n : 0.06;
  }, [spacing]);
  const spacingUnit = React.useMemo(() => spacing.replace(/[\d.\-+\s]/g, "") || "em", [spacing]);

  const words = React.useMemo(() => text.split(" ").map((w) => Array.from(w)), [text]);
  const total = React.useMemo(() => words.reduce((n, w) => n + w.length, 0), [words]);

  const resetStatic = React.useCallback(() => {
    for (const el of charRefs.current) {
      if (!el) continue;
      el.style.fontWeight = "";
      el.style.color = "";
      el.style.textShadow = "";
      el.style.letterSpacing = "";
    }
  }, []);

  React.useEffect(() => {
    if (reduceNow || !visible) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (reduceNow) resetStatic();
      return;
    }

    const cells = charRefs.current.filter((el): el is HTMLSpanElement => el !== null);
    if (cells.length === 0) return;

    const cx = new Float64Array(cells.length);
    const cy = new Float64Array(cells.length);
    const weight = new Float64Array(cells.length).fill(restWeight);
    const lastWeight = new Float64Array(cells.length).fill(-1);
    const heat = new Float64Array(cells.length);
    const hot = new Uint8Array(cells.length);

    const measure = () => {
      for (let i = 0; i < cells.length; i += 1) {
        const r = cells[i].getBoundingClientRect();
        cx[i] = r.left + r.width / 2;
        cy[i] = r.top + r.height / 2;
      }
    };
    measure();

    let last = performance.now();
    let clock = 0;
    let recalc = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      clock += dt;
      const p = pointerRef.current;
      const active = now - p.at < IDLE_AFTER;
      recalc += dt;
      if (recalc > RECALC_EVERY) {
        recalc = 0;
        if (active) measure();
      }
      const k = 1 - Math.exp(-CHASE * dt);

      for (let i = 0; i < cells.length; i += 1) {
        const el = cells[i];
        let target: number;
        let heatTarget = 0;
        if (active) {
          const dx = p.x - cx[i];
          const dy = p.y - cy[i];
          const d = Math.sqrt(dx * dx + dy * dy);
          let f = d < radius ? 1 - d / radius : 0;
          if (falloff === "smooth") f = f * f * (3 - 2 * f);
          target = wLo + (wHi - wLo) * f;
          heatTarget = f;
        } else if (idleWave) {
          target = restWeight + WAVE_AMPLITUDE * Math.sin(clock * WAVE_SPEED - i * WAVE_PHASE);
        } else {
          target = restWeight;
        }

        weight[i] += (target - weight[i]) * k;
        heat[i] += (heatTarget - heat[i]) * k;

        const wr = Math.round(weight[i]);
        if (wr !== lastWeight[i]) {
          el.style.fontWeight = String(wr);
          lastWeight[i] = wr;
        }

        const g = heat[i];
        if (g > HEAT_FLOOR) {
          const pct = (g * 100).toFixed(1);
          el.style.color = `color-mix(in oklab, var(--color-accent-text, #7f9fff) ${pct}%, var(--color-fg, #f8fafc))`;
          if (glow) {
            el.style.textShadow = `0 0 ${Math.round(22 * g)}px color-mix(in oklab, var(--color-accent, #4f7cff) ${(50 * g).toFixed(1)}%, transparent)`;
          }
          el.style.letterSpacing = `${(spacingMax * g).toFixed(3)}${spacingUnit}`;
          hot[i] = 1;
        } else if (hot[i]) {
          el.style.color = "";
          el.style.textShadow = "";
          el.style.letterSpacing = "";
          hot[i] = 0;
        }
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    let pending = false;
    const requestMeasure = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        measure();
      });
    };
    window.addEventListener("resize", requestMeasure);
    window.addEventListener("scroll", requestMeasure, { passive: true });

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      window.removeEventListener("resize", requestMeasure);
      window.removeEventListener("scroll", requestMeasure);
      resetStatic();
    };
  }, [falloff, glow, idleWave, radius, reduceNow, resetStatic, restWeight, spacingMax, spacingUnit, visible, wHi, wLo]);

  const onPointer = React.useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (reduceNow) return;
      pointerRef.current = { x: e.clientX, y: e.clientY, at: performance.now() };
    },
    [reduceNow],
  );
  const onPointerLeave = React.useCallback(() => {
    pointerRef.current = { ...pointerRef.current, at: -Infinity };
  }, []);

  let cursor = -1;
  return (
    <Tag
      ref={rootRef as React.Ref<never>}
      data-motion={reduce ? "static" : "animated"}
      data-chars={total}
      onPointerMove={onPointer}
      onPointerDown={onPointer}
      onPointerLeave={onPointerLeave}
      className={cn(
        "w-full text-balance text-[clamp(1.9rem,6.5vw,4.4rem)] leading-[1.12] tracking-[0.005em]",
        !reduce && "cursor-default touch-none",
        className,
      )}
      style={{ fontWeight: restWeight, ...style }}
      {...rest}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="select-none">
        {words.map((word, w) => (
          <React.Fragment key={w}>
            <span className="inline-block whitespace-pre">
              {word.map((ch, c) => {
                cursor += 1;
                const at = cursor;
                return (
                  <span
                    key={c}
                    data-mk-char={ch}
                    ref={(el) => {
                      charRefs.current[at] = el;
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
            {w < words.length - 1 ? " " : null}
          </React.Fragment>
        ))}
      </span>
    </Tag>
  );
}

ProximityType.displayName = "ProximityType";

export default ProximityType;
