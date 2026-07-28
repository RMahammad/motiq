"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/** `inview` runs the pour timeline on screen; `manual` waits for `level`/replay. */
export type LiquidFillTrigger = "inview" | "manual";

export interface LiquidFillHeadlineProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** The real string. Rendered readable on the server and to screen readers. */
  text: string;
  /** Rise duration in ms. */
  fillMs?: number;
  /** How long the full headline is held before draining, in ms. */
  holdMs?: number;
  /** Drain duration in ms. */
  drainMs?: number;
  /** Wave height at full slosh, in % of the headline box. */
  amplitude?: number;
  /** Two or more CSS colors for the liquid gradient (top → bottom). */
  gradient?: string[];
  /** The coral shimmer sweep at the moment the headline fills. */
  shimmer?: boolean;
  /** Keep pouring / draining on a loop. */
  loop?: boolean;
  /** Controlled fill level, 0–1. Setting it takes the timeline out of the picture. */
  level?: number;
  /** What starts the pour. */
  trigger?: LiquidFillTrigger;
  /** Restart the pour on pointer down anywhere on the headline. */
  replayOnPointer?: boolean;
  /** Element tag for the rendered headline. */
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  /** Force the static variant: a fully filled gradient headline, no motion. */
  reducedMotion?: boolean;
  /** Fires each time the headline reaches full. */
  onFilled?: () => void;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

/** Polygon resolution — 24 points is smooth at headline scale and cheap. */
const POINTS = 24;
/** Timeline segments not exposed as props (seconds). */
const SETTLE_S = 0.8;
const SHIMMER_S = 1.0;
const GAP_S = 0.8;
/** Level (% of the box) at empty and at full — full overshoots the cap slightly. */
const LEVEL_EMPTY = 108;
const LEVEL_FULL = -6;
/** The back layer rides higher and out of phase, which reads as depth. */
const BACK_OFFSET = 3.5;
const BACK_PHASE = 1.4;
const BACK_AMP = 1.15;
/** Wave phase speeds (rad/s) — coprime-ish so the slosh never repeats. */
const WAVE_A = 3.1;
const WAVE_B = -4.3;

const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeInCubic = (x: number) => x * x * x;
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** The 24-point polygon IS the wave; rebuilt every frame from two sines. */
function clipPolygon(level: number, amp: number, offset: number, wave: number): string {
  let pts = "";
  for (let i = 0; i < POINTS; i += 1) {
    const x = i * (100 / (POINTS - 1));
    const y =
      level +
      amp * Math.sin(x * 0.11 + wave * WAVE_A + offset) +
      amp * 0.6 * Math.sin(x * 0.183 + wave * WAVE_B + offset * 1.7);
    pts += `${x.toFixed(1)}% ${y.toFixed(1)}%, `;
  }
  return `polygon(0% 120%, ${pts}100% 120%)`;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * LiquidFillHeadline — an outlined wordmark that fills with liquid.
 *
 * Two gradient text layers sit behind a stroked outline; each is clipped by a
 * 24-point `clip-path` polygon rebuilt per frame from two out-of-phase sines —
 * the polygon *is* the wave. The level rises `108% → −6%` over 3s ease-in-out,
 * the amplitude decays to zero over a 0.8s settle, and then a 1s coral-white
 * shimmer sweeps across the filled letters: the page's one signature moment.
 *
 * Deliberately NOT an SVG luminance mask — gradient/gray mask content silently
 * no-ops in Chromium. This is `clip-path` alpha clipping over
 * `background-clip: text`, which recolors itself with the theme for free.
 * The four text layers sit under one `aria-hidden` stack with the readable
 * string in a visually-hidden sibling. Two clip-path writes and one
 * background-position write per frame; parks offscreen; reduced motion renders
 * the headline fully poured. Clean-room original.
 */
export function LiquidFillHeadline({
  text,
  fillMs = 3000,
  holdMs = 1400,
  drainMs = 1000,
  amplitude = 4.5,
  gradient,
  shimmer = true,
  loop = true,
  level,
  trigger = "inview",
  replayOnPointer = true,
  as: Tag = "p",
  reducedMotion,
  onFilled,
  className,
  ...rest
}: LiquidFillHeadlineProps) {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const fillRef = React.useRef<HTMLSpanElement | null>(null);
  const backRef = React.useRef<HTMLSpanElement | null>(null);
  const shineRef = React.useRef<HTMLSpanElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const timelineRef = React.useRef(0);
  const onFilledRef = React.useRef(onFilled);
  onFilledRef.current = onFilled;

  const systemReduced = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  // Behaviour reads the live preference immediately (effects are client-only);
  // the RENDERED attribute waits for mount so SSR markup can never disagree.
  const reduceNow = reducedMotion ?? systemReduced;
  const reduce = reducedMotion ?? (mounted ? systemReduced : false);

  const visible = useVisibilityPause(rootRef, { threshold: 0.12 });
  const controlled = level !== undefined;

  const apply = React.useCallback((lv: number, amp: number, wave: number) => {
    if (fillRef.current) fillRef.current.style.clipPath = clipPolygon(lv, amp, 0, wave);
    if (backRef.current) {
      backRef.current.style.clipPath = clipPolygon(lv - BACK_OFFSET, amp * BACK_AMP, BACK_PHASE, wave);
    }
  }, []);

  const setStatic = React.useCallback(() => {
    if (fillRef.current) fillRef.current.style.clipPath = "none";
    // An empty polygon hides the back layer entirely — "none" would show it.
    if (backRef.current) backRef.current.style.clipPath = "polygon(0 0, 0 0, 0 0)";
    if (shineRef.current) shineRef.current.style.opacity = "0";
  }, []);

  // The server paints a FULL headline (no-JS reads as a finished gradient
  // wordmark); with JS the glass is emptied before the first client paint.
  const primed = React.useRef(false);
  React.useLayoutEffect(() => {
    if (primed.current || reduceNow || controlled) return;
    primed.current = true;
    apply(LEVEL_EMPTY, 0, 0);
  }, [apply, controlled, reduceNow]);

  /* ---- Controlled level: no timeline, just a gently sloshing surface ----- */
  React.useEffect(() => {
    if (!controlled) return;
    if (reduceNow || !visible) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (reduceNow) {
        const lv = LEVEL_EMPTY + (LEVEL_FULL - LEVEL_EMPTY) * clamp01(level);
        apply(lv, 0, 0);
        if (shineRef.current) shineRef.current.style.opacity = "0";
      }
      return;
    }
    let last = performance.now();
    let wave = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      wave += dt;
      const lv = LEVEL_EMPTY + (LEVEL_FULL - LEVEL_EMPTY) * clamp01(level);
      apply(lv, amplitude * 0.45, wave);
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [amplitude, apply, controlled, level, reduceNow, visible]);

  /* ---- The pour timeline ------------------------------------------------- */
  React.useEffect(() => {
    if (controlled) return;
    if (reduceNow) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      setStatic();
      return;
    }
    if (!visible || trigger === "manual") {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (trigger === "manual" && timelineRef.current === 0) apply(LEVEL_EMPTY, 0, 0);
      return;
    }

    const rise = Math.max(0.05, fillMs / 1000);
    const hold = Math.max(0, holdMs / 1000);
    const drain = Math.max(0.05, drainMs / 1000);
    const shim = shimmer ? SHIMMER_S : 0;
    const span = LEVEL_EMPTY - LEVEL_FULL;
    const total = rise + SETTLE_S + shim + hold + drain + GAP_S;

    let last = performance.now();
    let wave = 0;
    let flushed = false;
    let filledFired = false;

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      wave += dt;
      timelineRef.current += dt;
      if (timelineRef.current >= total) {
        if (!loop) {
          timelineRef.current = total;
          apply(LEVEL_FULL, 0, wave);
          rafRef.current = null;
          return;
        }
        timelineRef.current -= total;
        filledFired = false;
      }

      let t = timelineRef.current;
      const shine = shineRef.current;
      if (t < rise) {
        apply(LEVEL_EMPTY - span * easeInOutCubic(t / rise), amplitude, wave);
        if (shine) shine.style.opacity = "0";
        flushed = false;
      } else if ((t -= rise) < SETTLE_S) {
        apply(LEVEL_FULL, amplitude * (1 - t / SETTLE_S), wave);
        flushed = false;
      } else if ((t -= SETTLE_S) < shim) {
        if (!flushed) {
          apply(LEVEL_FULL, 0, wave);
          flushed = true;
        }
        if (!filledFired) {
          filledFired = true;
          onFilledRef.current?.();
        }
        const q = t / shim;
        if (shine) {
          shine.style.opacity = Math.sin(Math.PI * q).toFixed(3);
          shine.style.backgroundPosition = `${(120 - 150 * q).toFixed(1)}% 0%`;
        }
      } else if ((t -= shim) < hold) {
        if (!flushed) {
          apply(LEVEL_FULL, 0, wave);
          flushed = true;
        }
        if (!filledFired) {
          filledFired = true;
          onFilledRef.current?.();
        }
        if (shine) shine.style.opacity = "0";
      } else if ((t -= hold) < drain) {
        apply(LEVEL_FULL + span * easeInCubic(t / drain), amplitude * 0.78, wave);
        flushed = false;
      } else {
        apply(LEVEL_EMPTY, 0, wave);
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [amplitude, apply, controlled, drainMs, fillMs, holdMs, loop, reduceNow, setStatic, shimmer, trigger, visible]);

  const onPointerDown = React.useCallback(() => {
    if (reduceNow || controlled || !replayOnPointer) return;
    timelineRef.current = 0;
  }, [controlled, reduceNow, replayOnPointer]);

  const stops = gradient && gradient.length >= 2 ? gradient : null;
  const fillGradient = stops
    ? `linear-gradient(180deg, ${stops.join(", ")})`
    : "linear-gradient(180deg, var(--color-secondary-accent, #22c7d9), var(--color-accent, #4f7cff) 46%, var(--color-accent-text, #7f9fff) 100%)";
  const backGradient = stops
    ? `linear-gradient(180deg, ${stops[0]}, ${stops[stops.length - 1]} 80%)`
    : "linear-gradient(180deg, color-mix(in oklab, var(--color-secondary-accent, #22c7d9) 65%, var(--color-accent, #4f7cff)), color-mix(in oklab, var(--color-accent, #4f7cff) 72%, var(--color-bg, #080c14)) 80%)";

  const layer: React.CSSProperties = {
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };

  return (
    <Tag
      ref={rootRef as React.Ref<never>}
      data-motion={reduce ? "static" : "animated"}
      data-controlled={controlled ? "true" : "false"}
      onPointerDown={onPointerDown}
      className={cn(
        "block w-full text-[clamp(2rem,8.5vw,5.6rem)] font-extrabold leading-[1.05] tracking-[-0.03em]",
        className,
      )}
      {...rest}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="relative inline-block max-w-full select-none break-words align-top">
        <span
          className="block"
          style={{
            color: "transparent",
            WebkitTextStroke: "1.5px color-mix(in oklab, var(--color-fg, #f8fafc) 24%, var(--color-border-strong, #354863))",
            paintOrder: "stroke",
          }}
        >
          {text}
        </span>
        <span
          ref={backRef}
          className="absolute inset-0 block [will-change:clip-path]"
          style={{ ...layer, backgroundImage: backGradient, opacity: 0.55 }}
        >
          {text}
        </span>
        <span
          ref={fillRef}
          className="absolute inset-0 block [will-change:clip-path]"
          style={{ ...layer, backgroundImage: fillGradient }}
        >
          {text}
        </span>
        {shimmer ? (
          <span
            ref={shineRef}
            className="absolute inset-0 block opacity-0 [will-change:opacity,background-position]"
            style={{
              ...layer,
              // The one coral moment in the set — signature, used once, on arrival.
              backgroundImage:
                "linear-gradient(112deg, transparent 34%, color-mix(in oklab, var(--color-signature, #ff6b5e) 55%, #ffffff) 48%, #ffffff 50%, color-mix(in oklab, var(--color-signature, #ff6b5e) 55%, #ffffff) 52%, transparent 66%)",
              backgroundSize: "240% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            {text}
          </span>
        ) : null}
      </span>
    </Tag>
  );
}

LiquidFillHeadline.displayName = "LiquidFillHeadline";

export default LiquidFillHeadline;
