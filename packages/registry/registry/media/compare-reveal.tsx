"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useControllableState, useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/** A comparison side: an image descriptor, or any node you render yourself. */
export type CompareRevealSource = React.ReactNode | { src: string; alt?: string };

export interface CompareRevealProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** The "before" side, revealed from the left edge to the divider. */
  before: CompareRevealSource;
  /** The "after" side, filling the rest of the frame. */
  after: CompareRevealSource;
  /** Uncontrolled starting divider position, 0–100. */
  defaultPosition?: number;
  /** Controlled divider position, 0–100. */
  position?: number;
  /** Fires with the new target percentage on drag, key, or snap. */
  onPositionChange?: (pct: number) => void;
  /** Play the one-time self-demonstrating sweep on first viewport entry. */
  introSweep?: boolean;
  /** Divider spring — 140/18 (ζ≈0.76) reads as elastic resistance. */
  stiffness?: number;
  damping?: number;
  /** Corner chips, [before, after]. */
  labels?: [string, string];
  /** Percentage the divider snaps to on double-click. */
  snapOnDoubleClick?: number;
  /** Force the still variant regardless of system preference. */
  reducedMotion?: boolean;
  /** Stop the rAF loop while scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Constants (Motion Lab ship spec)                                           */
/* -------------------------------------------------------------------------- */

const SPRING_K = 140;
const SPRING_C = 18;
/** Intro sweep: 50 → 96 → 4 → 50 over 2.6s, cubic ease per leg. */
const SWEEP_SECONDS = 2.6;
const KEY_STEP = 2;
const KEY_STEP_LARGE = 10;
/** A side's chip fades out once that side narrows past this percentage. */
const LABEL_FADE = 12;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function sweepAt(u: number): number {
  if (u < 0.38) return lerp(50, 96, easeInOutCubic(u / 0.38));
  if (u < 0.78) return lerp(96, 4, easeInOutCubic((u - 0.38) / 0.4));
  return lerp(4, 50, easeInOutCubic((u - 0.78) / 0.22));
}

function isImageSource(v: CompareRevealSource): v is { src: string; alt?: string } {
  return typeof v === "object" && v !== null && !React.isValidElement(v) && "src" in v;
}

function renderSide(source: CompareRevealSource): React.ReactNode {
  if (isImageSource(source)) {
    return <img src={source.src} alt={source.alt ?? ""} draggable={false} className="h-full w-full object-cover" />;
  }
  return source;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * CompareReveal — a before/after comparator whose divider chases the pointer
 * through a spring (k=140, c=18, ζ≈0.76), so the lag reads as elastic resistance
 * and the release as a soft snap. On first viewport entry it demonstrates itself
 * once — 50 → 96 → 4 → 50 over 2.6s — and replays only if that sweep was
 * interrupted. Double-click snaps home with the same spring.
 *
 * The handle is a real button with slider semantics: arrows move 2%,
 * Shift+arrows 10%, Home/End pin the ends, and aria-valuenow tracks the reveal.
 * The reveal itself is a clip-path inset on a composited layer, so both sides are
 * painted once and never per frame. Clean-room original.
 */
export function CompareReveal({
  before,
  after,
  defaultPosition = 50,
  position,
  onPositionChange,
  introSweep = true,
  stiffness = SPRING_K,
  damping = SPRING_C,
  labels = ["Before", "After"],
  snapOnDoubleClick = 50,
  reducedMotion,
  pauseWhenHidden = true,
  className,
  ...props
}: CompareRevealProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const topRef = React.useRef<HTMLDivElement | null>(null);
  const dividerRef = React.useRef<HTMLDivElement | null>(null);
  const handleRef = React.useRef<HTMLButtonElement | null>(null);
  const labelRefs = React.useRef<Array<HTMLElement | null>>([]);
  const paintRef = React.useRef<() => void>(() => {});

  const systemReduced = useReducedMotion();
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const still = reducedMotion === true || (hydrated && systemReduced);

  const onScreen = useVisibilityPause(rootRef, { threshold: 0.2 });
  const animate = !still && (!pauseWhenHidden || onScreen);

  const [pct, setPct] = useControllableState<number>({
    value: position,
    defaultValue: clamp(defaultPosition, 0, 100),
    onChange: (v) => onPositionChange?.(v),
  });

  // Seeded from the RESOLVED initial value so the first imperative paint agrees
  // with the rendered aria-valuenow (a controlled `position` wins).
  const initialPct = clamp(position ?? defaultPosition, 0, 100);
  const sim = React.useRef({
    x: initialPct,
    v: 0,
    target: initialPct,
    dragging: false,
    pointerId: null as number | null,
    introActive: false,
    introDone: false,
    introStart: 0,
  });

  const params = React.useRef({ stiffness, damping, still, introSweep });
  params.current = { stiffness, damping, still, introSweep };

  /** Latest committed percentage, read by the loop without re-subscribing. */
  const pctRef = React.useRef(pct);
  pctRef.current = pct;

  /* ---------------------------------------------------------------- loop -- */

  React.useEffect(() => {
    const paint = () => {
      const x = clamp(sim.current.x, 0, 100);
      const top = topRef.current;
      if (top) top.style.clipPath = `inset(0 ${(100 - x).toFixed(3)}% 0 0)`;
      const divider = dividerRef.current;
      if (divider) divider.style.left = `${x.toFixed(3)}%`;
      handleRef.current?.setAttribute("aria-valuenow", String(Math.round(x)));
      const l0 = labelRefs.current[0];
      const l1 = labelRefs.current[1];
      if (l0) l0.style.opacity = x > LABEL_FADE ? "1" : "0";
      if (l1) l1.style.opacity = x < 100 - LABEL_FADE ? "1" : "0";
    };
    paintRef.current = paint;
    paint();

    if (!animate) {
      // Still mode is fully functional — it just maps input 1:1 with no spring.
      sim.current.introDone = true;
      sim.current.introActive = false;
      // Leaving the viewport mid-sweep re-arms the demo for the next entry.
      return () => {
        if (sim.current.introActive) {
          sim.current.introActive = false;
          sim.current.introDone = false;
        }
      };
    }

    if (params.current.introSweep && !sim.current.introDone) {
      sim.current.introActive = true;
      sim.current.introStart = performance.now() / 1000;
    }

    let raf = 0;
    let last = performance.now();
    const frame = (ts: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (ts - last) / 1000));
      last = ts;
      const now = ts / 1000;
      const p = params.current;
      const s = sim.current;

      if (s.introActive) {
        const u = (now - s.introStart) / SWEEP_SECONDS;
        if (u >= 1) {
          s.introActive = false;
          s.introDone = true;
          s.target = clamp(pctRef.current, 0, 100);
        } else {
          s.target = sweepAt(u);
        }
      }
      s.v += ((s.target - s.x) * p.stiffness - s.v * p.damping) * dt;
      s.x += s.v * dt;
      if (s.x < 0) {
        s.x = 0;
        s.v = 0;
      }
      if (s.x > 100) {
        s.x = 100;
        s.v = 0;
      }
      paint();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      if (sim.current.introActive) {
        sim.current.introActive = false;
        sim.current.introDone = false;
        sim.current.target = clamp(pctRef.current, 0, 100);
      }
    };
  }, [animate]);

  // Every input path commits through state, and the spring target follows state
  // — so a controlled parent that ignores the change keeps the divider put.
  const commit = React.useCallback(
    (next: number) => {
      const s = sim.current;
      s.introActive = false;
      s.introDone = true;
      setPct(clamp(next, 0, 100));
    },
    [setPct],
  );

  React.useEffect(() => {
    const s = sim.current;
    if (s.introActive) return;
    const t = clamp(pct, 0, 100);
    if (Math.abs(s.target - t) < 0.0001) return;
    s.target = t;
    if (params.current.still) {
      s.x = t;
      s.v = 0;
      paintRef.current();
    }
  }, [pct]);

  /* ------------------------------------------------------------- pointer -- */

  const positionFromEvent = (clientX: number) => {
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    commit(((clientX - rect.left) / Math.max(1, rect.width)) * 100);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    sim.current.dragging = true;
    sim.current.pointerId = e.pointerId;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    positionFromEvent(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sim.current.dragging || e.pointerId !== sim.current.pointerId) return;
    positionFromEvent(e.clientX);
  };

  const endDrag = () => {
    sim.current.dragging = false;
    sim.current.pointerId = null;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const step = e.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    const base = sim.current.target;
    let next = base;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = base + step;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = base - step;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 100;
    else return;
    e.preventDefault();
    commit(next);
  };

  const shown = Math.round(clamp(pct, 0, 100));

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={props["aria-label"] ?? `Comparison: ${labels[0]} versus ${labels[1]}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={() => commit(snapOnDoubleClick)}
      data-motion={still ? "static" : "animated"}
      className={cn(
        "relative aspect-[16/10] w-full touch-pan-y select-none overflow-hidden rounded-[16px]",
        "border border-[var(--color-border,#263449)] bg-[var(--color-bg-elevated,#0d1420)] cursor-ew-resize",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0">{renderSide(after)}</div>
      <div ref={topRef} className="absolute inset-0 will-change-[clip-path]" style={{ clipPath: `inset(0 ${100 - shown}% 0 0)` }}>
        {renderSide(before)}
      </div>

      {([labels[0], labels[1]] as const).map((text, i) => (
        <span
          key={text + i}
          ref={(el) => {
            labelRefs.current[i] = el;
          }}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-4 z-[8] rounded-full px-3 py-1.5 transition-opacity duration-300",
            "border border-[rgba(160,186,224,0.3)] bg-[rgba(6,10,20,0.55)] backdrop-blur-[6px]",
            "font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#eef4ff]",
            i === 0 ? "left-4" : "right-4",
          )}
        >
          {text}
        </span>
      ))}

      {/* The rule itself carries no semantics (no role, no text) — it must NOT be
          aria-hidden, because the interactive handle lives inside it. */}
      <div
        ref={dividerRef}
        className="pointer-events-none absolute bottom-0 top-0 z-10 -ml-px w-0.5 will-change-[left]"
        style={{
          left: `${shown}%`,
          background: "color-mix(in oklab, var(--color-signature, #ff6b5e) 85%, white)",
        }}
      >
        <button
          ref={handleRef}
          type="button"
          role="slider"
          aria-label={`Reveal divider, ${labels[0]} to ${labels[1]}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={shown}
          aria-valuetext={`${shown}% ${labels[0]}`}
          onKeyDown={onKeyDown}
          className={cn(
            "pointer-events-auto absolute left-1/2 top-1/2 grid h-[46px] w-[46px] -translate-x-1/2 -translate-y-1/2",
            "cursor-ew-resize place-items-center rounded-full p-0 backdrop-blur-[4px] transition-shadow duration-200",
            "border-2 border-[var(--color-signature,#ff6b5e)] text-[var(--color-signature,#ff6b5e)]",
            "bg-[color-mix(in_oklab,var(--color-bg-elevated,#0d1420)_82%,transparent)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signature,#ff6b5e)] focus-visible:ring-offset-2",
          )}
          style={{
            boxShadow:
              "0 0 0 6px color-mix(in oklab, var(--color-signature, #ff6b5e) 18%, transparent), 0 0 26px color-mix(in oklab, var(--color-signature, #ff6b5e) 45%, transparent)",
          }}
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
            <path d="M6 1 L1 7 L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 1 L17 7 L12 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default CompareReveal;
