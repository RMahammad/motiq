"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface VelocityMarqueeItem {
  /** Stable key. */
  id: string;
  /** Anything: a logo chip, a media card, an `<img>`. */
  node: React.ReactNode;
}

export interface VelocityMarqueeRow {
  /** Stable key. */
  id: string;
  items: VelocityMarqueeItem[];
  /** 1 scrolls left-to-right, -1 the other way. Defaults to alternating by index. */
  direction?: 1 | -1;
  /** Accessible name for this rail. */
  label?: string;
}

export interface VelocityMarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** One or more counter-rotating rails. */
  rows: VelocityMarqueeRow[];
  /** Resting drift speed in px/s. */
  baseSpeed?: number;
  /** Scroll-velocity → boost gain (boost = 1 + min(|v|·gain, maxBoost)). */
  velocityGain?: number;
  /** Ceiling on the scroll-driven surge (1 + maxBoost ≈ 6× at the default). */
  maxBoost?: number;
  /** Peak shear in degrees, signed by row direction. */
  maxSkew?: number;
  /** Speed multiplier for the rail under the pointer/keyboard focus. */
  hoverSlow?: number;
  /** Show the live boost meter chip. */
  showMeter?: boolean;
  /** Gap between items, px (also drives the seamless wrap width). */
  gap?: number;
  /** Force the still variant regardless of system preference. */
  reducedMotion?: boolean;
  /** Stop the rAF loop while scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Constants (Motion Lab ship spec)                                           */
/* -------------------------------------------------------------------------- */

const BASE_SPEED = 36;
const VELOCITY_GAIN = 0.006;
const MAX_BOOST = 5;
const MAX_SKEW = 10;
const HOVER_SLOW = 0.25;
const SKEW_GAIN = 0.012;
/** Scroll-velocity EMA (Hz) and the boost/skew relax rate (Hz) — ~600ms exhale. */
const VELOCITY_HZ = 8;
const RELAX_HZ = 6;
const HOVER_HZ = 8;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

interface RowState {
  off: number;
  loopW: number;
  hover: number;
  hTarget: number;
  dir: number;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * VelocityMarquee — counter-rotating media rails that feed on page-scroll
 * velocity. At rest the rows drift at 36px/s; shove the page and a smoothed
 * velocity reading surges them to ~6× while shearing them up to ±10° (signed by
 * row direction), then everything exhales back to the calm drift over ~600ms.
 * Hovering (or focusing) a rail eases it to a quarter speed and lifts the card
 * out of the stream.
 *
 * One passive scroll listener plus one rAF loop per instance; each row costs a
 * single translate3d + skewX per frame, and the card lift is a pure CSS
 * transition. Pauses offscreen. Clean-room original.
 */
export function VelocityMarquee({
  rows,
  baseSpeed = BASE_SPEED,
  velocityGain = VELOCITY_GAIN,
  maxBoost = MAX_BOOST,
  maxSkew = MAX_SKEW,
  hoverSlow = HOVER_SLOW,
  showMeter = true,
  gap = 18,
  reducedMotion,
  pauseWhenHidden = true,
  className,
  ...props
}: VelocityMarqueeProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const trackRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const meterRef = React.useRef<HTMLElement | null>(null);

  const systemReduced = useReducedMotion();
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const still = reducedMotion === true || (hydrated && systemReduced);

  const onScreen = useVisibilityPause(rootRef, { threshold: 0.05 });
  const animate = !still && rows.length > 0 && (!pauseWhenHidden || onScreen);

  const rowStates = React.useRef<RowState[]>([]);
  const params = React.useRef({ baseSpeed, velocityGain, maxBoost, maxSkew, hoverSlow, gap });
  params.current = { baseSpeed, velocityGain, maxBoost, maxSkew, hoverSlow, gap };

  // Keep one state object per row across renders (offsets survive prop tweaks).
  const dirs = rows.map((r, i) => r.direction ?? (i % 2 === 0 ? 1 : -1));
  if (rowStates.current.length !== rows.length) {
    rowStates.current = rows.map((_, i) => ({ off: 0, loopW: 1, hover: 1, hTarget: 1, dir: dirs[i] }));
  }
  rowStates.current.forEach((s, i) => {
    s.dir = dirs[i];
  });

  const setRowHover = (i: number, slowed: boolean) => {
    const s = rowStates.current[i];
    if (s) s.hTarget = slowed ? clamp(params.current.hoverSlow, 0.05, 1) : 1;
  };

  React.useEffect(() => {
    const measure = () => {
      rowStates.current.forEach((s, i) => {
        const track = trackRefs.current[i];
        if (!track) return;
        // Content is duplicated once, so half the scroll width (plus half a gap)
        // is the seamless wrap distance.
        s.loopW = Math.max(1, track.scrollWidth / 2 + params.current.gap / 2);
      });
    };
    measure();

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    trackRefs.current.forEach((t) => t && ro?.observe(t));

    const apply = (skew: number) => {
      rowStates.current.forEach((s, i) => {
        const track = trackRefs.current[i];
        if (!track) return;
        track.style.transform = `translate3d(${(-s.off).toFixed(2)}px,0,0) skewX(${(skew * s.dir).toFixed(2)}deg)`;
      });
    };

    if (!animate) {
      apply(0);
      if (meterRef.current) meterRef.current.textContent = "1.00×";
      return () => ro?.disconnect();
    }

    // Scroll position is sampled by ONE passive listener; the loop only reads the
    // cached value, so no frame ever forces a layout read.
    let scrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let prevY = scrollY;
    const onScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let sv = 0;
    let boost = 1;
    let skew = 0;
    let lastMeter = "";
    let raf = 0;
    let last = performance.now();

    const frame = (ts: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (ts - last) / 1000));
      last = ts;
      const p = params.current;

      const inst = (scrollY - prevY) / dt;
      prevY = scrollY;
      sv += (inst - sv) * Math.min(1, dt * VELOCITY_HZ);

      const targetBoost = 1 + Math.min(Math.abs(sv) * p.velocityGain, p.maxBoost);
      boost += (targetBoost - boost) * Math.min(1, dt * RELAX_HZ);
      const targetSkew = clamp(sv * SKEW_GAIN, -p.maxSkew, p.maxSkew);
      skew += (targetSkew - skew) * Math.min(1, dt * RELAX_HZ);

      rowStates.current.forEach((s) => {
        s.hover += (s.hTarget - s.hover) * Math.min(1, dt * HOVER_HZ);
        s.off += s.dir * p.baseSpeed * boost * s.hover * dt;
        s.off = ((s.off % s.loopW) + s.loopW) % s.loopW;
      });
      apply(skew);

      if (meterRef.current) {
        const text = `${boost.toFixed(2)}×`;
        if (text !== lastMeter) {
          meterRef.current.textContent = text;
          lastMeter = text;
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      ro?.disconnect();
    };
  }, [animate, rows.length]);

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={props["aria-label"] ?? "Media marquee"}
      data-motion={still ? "static" : "animated"}
      className={cn(
        "relative flex w-full flex-col justify-center gap-7 overflow-hidden rounded-[16px]",
        "border border-[var(--color-border,#263449)] bg-[var(--color-bg-elevated,#0d1420)]",
        "min-h-[320px] py-10",
        className,
      )}
      {...props}
    >
      {rows.map((row, i) => (
        <div key={row.id} className="w-full overflow-hidden">
          <div
            ref={(el) => {
              trackRefs.current[i] = el;
            }}
            role="group"
            aria-label={row.label ?? `Rail ${i + 1}`}
            onPointerEnter={() => setRowHover(i, true)}
            onPointerLeave={() => setRowHover(i, false)}
            onFocus={() => setRowHover(i, true)}
            onBlur={() => setRowHover(i, false)}
            className="flex w-max py-1.5 will-change-transform"
            style={{ gap }}
          >
            {/* The first copy is the canonical list; the second is a purely
                decorative duplicate that makes the wrap seamless. */}
            {[0, 1].map((copy) =>
              row.items.map((item) => (
                <div
                  key={`${copy}-${item.id}`}
                  // The duplicate is decoration only: hidden from AT and made
                  // non-focusable so consumer links never appear twice.
                  aria-hidden={copy === 1 ? true : undefined}
                  inert={copy === 1 ? true : undefined}
                  className={cn(
                    "flex-none rounded-[10px] transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
                    "hover:z-[5] hover:-translate-y-1.5 hover:scale-[1.04]",
                    "focus-within:z-[5] focus-within:-translate-y-1.5 focus-within:scale-[1.04]",
                  )}
                >
                  {item.node}
                </div>
              )),
            )}
          </div>
        </div>
      ))}

      {showMeter ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute bottom-3 right-3.5 rounded-full px-2.5 py-1",
            "border border-[var(--color-border,#263449)]",
            "bg-[color-mix(in_oklab,var(--color-bg-elevated,#0d1420)_78%,transparent)]",
            "font-mono text-[10.5px] tracking-[0.08em] text-[var(--color-muted,#9caabd)]",
          )}
        >
          boost{" "}
          <b
            ref={meterRef}
            className="font-semibold text-[var(--color-secondary-accent,#22c7d9)]"
          >
            1.00×
          </b>
        </span>
      ) : null}
    </div>
  );
}

export default VelocityMarquee;
