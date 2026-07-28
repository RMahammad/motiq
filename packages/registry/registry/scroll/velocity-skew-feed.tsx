"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface VelocitySkewFeedProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The feed cards. Each one gets its own shear/stretch wrapper. */
  items: React.ReactNode[];
  /**
   * `"container"` (default) scrolls the feed inside its own keyboard-operable
   * stage — the card/preview usage. `"page"` reacts to the document scroll and
   * lets the feed flow at whatever height its content needs.
   */
  scrollMode?: "page" | "container";
  /** Maximum shear in degrees at full speed. */
  maxSkew?: number;
  /** Spring stiffness (k). */
  stiffness?: number;
  /** Spring damping (c). Below ~2·√k the spring overshoots — that is the rubber snap. */
  damping?: number;
  /** Extra stretch along the scroll axis per degree of shear. */
  stretch?: number;
  /** Degrees of target shear per px/s of smoothed scroll velocity. */
  sensitivity?: number;
  /** Velocity smoothing rate (λ per second). */
  smoothing?: number;
  /** Render the velocity meter readout. Off by default — it is a debugging surface. */
  meter?: boolean;
  /** Full-scale velocity for the meter needle, in px/s. */
  meterScale?: number;
  /** Scroll axis. */
  axis?: "y" | "x";
  /** Stage height (container mode). */
  height?: number | string;
  /** Accessible name for the internal scroll region (container mode). */
  label?: string;
  /** Force the static, motion-free variant regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Constants + helpers                                                        */
/* -------------------------------------------------------------------------- */

const T = {
  accent: "var(--color-accent, #4f7cff)",
  accent2: "var(--color-secondary-accent, #22c7d9)",
  surface2: "var(--color-surface-2, #192337)",
  border: "var(--color-border, #263449)",
  borderStrong: "var(--color-border-strong, #354863)",
  fg: "var(--color-fg, #f8fafc)",
  muted: "var(--color-muted, #9caabd)",
  bgElevated: "var(--color-bg-elevated, #0d1420)",
} as const;

/** Peak readout decay per second. */
const PEAK_DECAY = 0.4;
/** Text readouts refresh every Nth frame — meter text must never drive layout work. */
const READ_EVERY = 5;
/** Below this the spring is considered asleep and transforms stop being written. */
const SLEEP_SKEW = 0.02;
const SLEEP_VEL = 2;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const damp = (cur: number, tgt: number, lambda: number, dt: number) =>
  cur + (tgt - cur) * (1 - Math.exp(-lambda * dt));

const px = (v: number | string) => (typeof v === "number" ? `${v}px` : v);

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/** Locale-independent grouping so the meter reads the same on any machine. */
function group(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * VelocitySkewFeed — a feed whose cards shear and stretch with scroll velocity and
 * rubber-snap back when you stop. Velocity is a smoothed Δscroll/Δt, and the shear
 * it targets is integrated through a real spring (`s″ = k(target − s) − c·s′`) with
 * frame delta-time, so a hard stop overshoots once and settles instead of easing
 * to a halt. Transforms are the only thing written, one per card per frame, and
 * the loop stops writing entirely once the spring's energy falls under threshold —
 * the effect costs nothing at rest. Reduced motion drops the physics and leaves a
 * plain, fully scrollable feed. Clean-room original.
 */
export function VelocitySkewFeed({
  items,
  scrollMode = "container",
  maxSkew = 6.5,
  stiffness = 90,
  damping = 14,
  stretch = 0.008,
  sensitivity = 0.0035,
  smoothing = 12,
  meter = false,
  meterScale = 2600,
  axis = "y",
  height = 540,
  label = "Activity feed. Scroll quickly to see the cards react to speed.",
  reducedMotion,
  className,
  style,
  ...props
}: VelocitySkewFeedProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const cardRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const needleRef = React.useRef<HTMLSpanElement | null>(null);
  const readRef = React.useRef<HTMLSpanElement | null>(null);
  const peakRef = React.useRef<HTMLSpanElement | null>(null);

  const systemReduced = useReducedMotion();
  const [enhanced, setEnhanced] = React.useState(false);
  useIsoLayoutEffect(() => setEnhanced(true), []);
  const staticMode = reducedMotion === true || (enhanced && systemReduced);
  const springing = enhanced && !staticMode;

  const onScreen = useVisibilityPause(rootRef, { threshold: 0.01 });
  const animate = springing && onScreen;

  const container = scrollMode === "container";
  const horizontal = axis === "x";
  const stageH = px(height);

  const paramsRef = React.useRef({ maxSkew, stiffness, damping, stretch, sensitivity, smoothing, meterScale, horizontal });
  paramsRef.current = { maxSkew, stiffness, damping, stretch, sensitivity, smoothing, meterScale, horizontal };

  React.useEffect(() => {
    const sc = scrollerRef.current;
    if (!container || !springing || !sc) return;
    // overscroll-behavior: contain stops native chaining, so relay at the ends.
    // Passive listener — the feed never preventDefaults a wheel event.
    const onWheel = (e: WheelEvent) => {
      const pos = horizontal ? sc.scrollLeft : sc.scrollTop;
      const max = horizontal ? sc.scrollWidth - sc.clientWidth : sc.scrollHeight - sc.clientHeight;
      const delta = horizontal ? e.deltaX : e.deltaY;
      if ((pos <= 0 && delta < 0) || (pos >= max - 1 && delta > 0)) window.scrollBy(0, e.deltaY);
    };
    sc.addEventListener("wheel", onWheel, { passive: true });
    return () => sc.removeEventListener("wheel", onWheel);
  }, [container, springing, horizontal]);

  React.useEffect(() => {
    if (!animate || typeof requestAnimationFrame === "undefined") return;
    const readPos = () => {
      const sc = scrollerRef.current;
      if (container && sc) return horizontal ? sc.scrollLeft : sc.scrollTop;
      if (typeof window === "undefined") return 0;
      return horizontal ? window.scrollX : window.scrollY;
    };

    let raf = 0;
    let last = 0;
    let lastPos = readPos();
    let vel = 0;
    let skew = 0;
    let skewV = 0;
    let peak = 0;
    let tick = 0;
    let wasActive = false;
    let lastRead = -1;
    let lastPeak = -1;

    const frame = (now: number) => {
      let dt = last ? (now - last) / 1000 : 0.016;
      if (!(dt > 0) || dt > 0.05) dt = 0.016;
      last = now;

      const { maxSkew: mx, stiffness: k, damping: c, stretch: st, sensitivity: sens, smoothing: lam, meterScale: scale } =
        paramsRef.current;

      const pos = readPos();
      const instant = (pos - lastPos) / dt;
      lastPos = pos;
      vel = damp(vel, instant, lam, dt);

      const target = clamp(vel * sens, -mx, mx);
      skewV += (k * (target - skew) - c * skewV) * dt;
      skew += skewV * dt;

      const active = Math.abs(skew) > SLEEP_SKEW || Math.abs(skewV) > SLEEP_SKEW || Math.abs(vel) > SLEEP_VEL;
      if (active || wasActive) {
        // One final identity write on the active → asleep edge so cards settle
        // exactly square instead of holding the last sub-threshold shear.
        const s = active ? skew : 0;
        const transform = horizontal
          ? `skewX(${s.toFixed(3)}deg) scaleX(${(1 + Math.abs(s) * st).toFixed(4)})`
          : `skewY(${s.toFixed(3)}deg) scaleY(${(1 + Math.abs(s) * st).toFixed(4)})`;
        for (const el of cardRefs.current) if (el) el.style.transform = transform;
        if (needleRef.current) {
          needleRef.current.style.transform = `scaleX(${clamp((active ? vel : 0) / scale, -1, 1).toFixed(3)})`;
        }
        wasActive = active;
      }

      peak = Math.max(peak * (1 - PEAK_DECAY * dt), Math.abs(vel));
      if (++tick % READ_EVERY === 0) {
        const rv = Math.round(Math.abs(vel) / 10) * 10;
        if (readRef.current && rv !== lastRead) {
          lastRead = rv;
          readRef.current.textContent = `${group(rv)} px/s`;
        }
        const pk = Math.round(peak / 10) * 10;
        if (peakRef.current && pk !== lastPeak) {
          lastPeak = pk;
          peakRef.current.textContent = `peak ${group(pk)} px/s`;
        }
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animate, container, horizontal]);

  const meterBar = meter ? (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none z-[8] flex items-center gap-3.5 border-b px-[18px] py-3",
        container ? "absolute inset-x-0 top-0" : "sticky top-0",
      )}
      style={{
        borderColor: T.border,
        background: `color-mix(in oklab, ${T.bgElevated} 97%, transparent)`,
      }}
    >
      <small className="whitespace-nowrap font-mono text-[9.5px] uppercase tracking-[0.12em]" style={{ color: T.muted }}>
        scroll velocity
      </small>
      <span className="relative h-1.5 flex-1 rounded-md" style={{ background: T.surface2 }}>
        <span className="absolute -bottom-[3px] -top-[3px] left-1/2 w-px" style={{ background: T.borderStrong }} />
        <span
          ref={needleRef}
          className="absolute bottom-0 left-1/2 top-0 w-1/2 origin-left rounded-md"
          style={{
            background: `linear-gradient(90deg, ${T.accent}, ${T.accent2})`,
            transform: "scaleX(0)",
            willChange: "transform",
          }}
        />
      </span>
      <span ref={readRef} className="min-w-[92px] text-right font-mono text-[11.5px] tabular-nums" style={{ color: T.fg }}>
        0 px/s
      </span>
      <span ref={peakRef} className="min-w-[108px] text-right font-mono text-[9.5px] tabular-nums" style={{ color: T.muted }}>
        peak 0 px/s
      </span>
    </div>
  ) : null;

  const feed = (
    <div
      className={cn(
        horizontal ? "flex flex-row items-stretch gap-2.5" : "flex flex-col gap-2.5",
        container && "p-[18px]",
        container && meter && "pt-[66px]",
      )}
    >
      {items.map((item, i) => (
        <div
          key={i}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          className={horizontal ? "shrink-0" : undefined}
          style={{ willChange: springing ? "transform" : undefined, transformOrigin: "center" }}
        >
          {item}
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={rootRef}
      data-motion={staticMode ? "static" : "animated"}
      data-scroll-mode={scrollMode}
      className={cn("w-full", className)}
      style={style}
      {...props}
    >
      {container ? (
        <div className="relative w-full overflow-hidden rounded-[inherit]" style={{ height: stageH }}>
          {meterBar}
          <div
            ref={scrollerRef}
            tabIndex={0}
            role="region"
            aria-label={label}
            className={cn(
              "h-full overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent,#4f7cff)]",
              horizontal ? "overflow-x-auto overflow-y-hidden" : "overflow-y-auto",
            )}
          >
            {feed}
          </div>
        </div>
      ) : (
        <>
          {meterBar}
          {feed}
        </>
      )}
    </div>
  );
}

VelocitySkewFeed.displayName = "VelocitySkewFeed";

export default VelocitySkewFeed;
