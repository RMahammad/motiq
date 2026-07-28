"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useControllableState, useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface FilmstripFrame {
  /** Stable key. */
  id: string;
  /** Image URL rendered as a plain `<img>` (use `node` for anything richer). */
  src?: string;
  /** Alternative text for `src`. */
  alt?: string;
  /** Arbitrary frame content — takes precedence over `src`. */
  node?: React.ReactNode;
  /** Short phase name shown in the readout (e.g. "dawn", "step 3"). */
  label?: string;
}

export interface FilmstripScrubProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** 8–24 stills read best. */
  frames: FilmstripFrame[];
  /** Timecode base used by the monospace readout. */
  fps?: number;
  /** Idle auto-scrub speed in frames/s (0 disables autoplay). */
  idleSpeed?: number;
  /** Playhead spring stiffness — 90/16 lands with one soft overshoot (ζ≈0.84). */
  stiffness?: number;
  /** Playhead spring damping. */
  damping?: number;
  /** Scrub on hover as well as drag. */
  hoverScrub?: boolean;
  /** Ping-pong the idle scrub at the ends instead of stopping. */
  loop?: boolean;
  /** Seconds of stillness before autoplay resumes. */
  resumeAfter?: number;
  /** Controlled frame index. */
  frameIndex?: number;
  /** Uncontrolled initial frame index. */
  defaultFrameIndex?: number;
  /** Fires when the nearest frame changes. */
  onFrameIndexChange?: (index: number) => void;
  /** Accessible name for the scrubber. */
  scrubberLabel?: string;
  /** Force the still variant regardless of system preference. */
  reducedMotion?: boolean;
  /** Stop the rAF loop while scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Constants (Motion Lab ship spec)                                           */
/* -------------------------------------------------------------------------- */

const SPRING_K = 90;
const SPRING_C = 16;
const IDLE_SPEED = 0.9;
const RESUME_AFTER = 3;
const FPS = 24;
/** Frame-tick divisions drawn under the strip. */
const TICKS = 48;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

function timecode(p: number, fps: number): string {
  const ss = Math.floor(p);
  const ff = Math.floor((p - ss) * fps);
  return `00:00:${String(ss).padStart(2, "0")}:${String(ff).padStart(2, "0")}`;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * FilmstripScrub — a horizontal filmstrip with a spring-loaded playhead. Hover
 * or drag the strip and the target moves instantly while the playhead chases it
 * through a spring (k=90, c=16, ζ≈0.84) that lands with a single soft overshoot;
 * the large preview crossfades frame ⌊p⌋ into ⌈p⌉ by the fractional part, so the
 * blend reads as time passing rather than a dissolve. Frame ticks and a 24fps
 * monospace timecode track the position, and the strip scrubs itself at
 * 0.9 frames/s once left alone for three seconds.
 *
 * The strip is a real slider (arrow keys step a frame, Home/End jump to the
 * ends, aria-valuenow tracks it). One rAF loop per instance writes opacity and
 * the playhead offset straight to the DOM — no per-frame React state. Clean-room
 * original.
 */
export function FilmstripScrub({
  frames,
  fps = FPS,
  idleSpeed = IDLE_SPEED,
  stiffness = SPRING_K,
  damping = SPRING_C,
  hoverScrub = true,
  loop = true,
  resumeAfter = RESUME_AFTER,
  frameIndex,
  defaultFrameIndex = 0,
  onFrameIndexChange,
  scrubberLabel,
  reducedMotion,
  pauseWhenHidden = true,
  className,
  ...props
}: FilmstripScrubProps) {
  const n = frames.length;
  const maxIndex = Math.max(0, n - 1);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const stripRef = React.useRef<HTMLDivElement | null>(null);
  const playheadRef = React.useRef<HTMLDivElement | null>(null);
  const layerRefs = React.useRef<Array<HTMLElement | null>>([]);
  const thumbRefs = React.useRef<Array<HTMLElement | null>>([]);
  const tcRef = React.useRef<HTMLElement | null>(null);
  /** Latest frame painter, owned by the loop effect (instant path when still). */
  const paintRef = React.useRef<() => void>(() => {});

  const systemReduced = useReducedMotion();
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const still = reducedMotion === true || (hydrated && systemReduced);

  const onScreen = useVisibilityPause(rootRef, { threshold: 0.05 });
  const animate = n > 0 && !still && (!pauseWhenHidden || onScreen);

  const [index, setIndex] = useControllableState<number>({
    value: frameIndex,
    defaultValue: clamp(defaultFrameIndex, 0, maxIndex),
    onChange: (i) => onFrameIndexChange?.(i),
  });
  const setIndexRef = React.useRef(setIndex);
  setIndexRef.current = setIndex;

  // Seeded from the RESOLVED initial frame so the first paint agrees with the
  // rendered aria-valuenow (a controlled `frameIndex` wins).
  const initialIndex = clamp(frameIndex ?? defaultFrameIndex, 0, maxIndex);
  const sim = React.useRef({
    p: initialIndex,
    v: 0,
    target: initialIndex,
    dir: 1,
    lastInteract: -100,
    dragging: false,
    // Seeded with the initial frame so the first paint doesn't fire a spurious
    // onFrameIndexChange.
    shown: initialIndex,
    pointerId: null as number | null,
  });

  const params = React.useRef({ n, maxIndex, fps, idleSpeed, stiffness, damping, loop, resumeAfter, still });
  params.current = { n, maxIndex, fps, idleSpeed, stiffness, damping, loop, resumeAfter, still };

  /* ---------------------------------------------------------------- loop -- */

  React.useEffect(() => {
    if (n === 0) return;

    const paint = () => {
      const p = params.current;
      const s = sim.current;
      const i0 = clamp(Math.floor(s.p), 0, p.maxIndex);
      const i1 = clamp(Math.ceil(s.p), 0, p.maxIndex);
      const frac = s.p - i0;

      for (let i = 0; i < p.n; i++) {
        const el = layerRefs.current[i];
        if (!el) continue;
        const opacity = i === i0 ? 1 : i === i1 ? frac : 0;
        const next = opacity.toFixed(3);
        if (el.style.opacity !== next) el.style.opacity = next;
      }

      const head = playheadRef.current;
      if (head) {
        const frac01 = p.maxIndex > 0 ? clamp(s.p / p.maxIndex, 0, 1) : 0;
        head.style.left = `${(frac01 * 100).toFixed(3)}%`;
      }
      if (tcRef.current) tcRef.current.textContent = timecode(s.p, p.fps);

      const act = clamp(Math.round(s.p), 0, p.maxIndex);
      if (act !== s.shown) {
        const prev = thumbRefs.current[s.shown];
        if (prev) prev.dataset.active = "false";
        const nextEl = thumbRefs.current[act];
        if (nextEl) nextEl.dataset.active = "true";
        s.shown = act;
        setIndexRef.current(act);
      }
    };
    paintRef.current = paint;
    paint();

    if (!animate) return;

    let raf = 0;
    let last = performance.now();
    const frame = (ts: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (ts - last) / 1000));
      last = ts;
      const now = ts / 1000;
      const p = params.current;
      const s = sim.current;

      if (!s.dragging && p.idleSpeed > 0 && now - s.lastInteract > p.resumeAfter) {
        s.target += s.dir * p.idleSpeed * dt;
        if (s.target >= p.maxIndex) {
          s.target = p.maxIndex;
          s.dir = p.loop ? -1 : 0;
        }
        if (s.target <= 0) {
          s.target = 0;
          s.dir = p.loop ? 1 : 0;
        }
      }
      s.v += ((s.target - s.p) * p.stiffness - s.v * p.damping) * dt;
      s.p = clamp(s.p + s.v * dt, 0, p.maxIndex);
      paint();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animate, n]);

  const snapTo = React.useCallback((next: number) => {
    const p = params.current;
    const s = sim.current;
    s.target = clamp(next, 0, p.maxIndex);
    s.lastInteract = performance.now() / 1000;
    if (p.still) {
      s.p = s.target;
      s.v = 0;
      paintRef.current();
    }
  }, []);

  // A controlled `frameIndex` change (or an external jump) seeks the playhead.
  React.useEffect(() => {
    if (n === 0) return;
    if (index === sim.current.shown) return;
    snapTo(index);
  }, [index, n, snapTo]);

  /* ------------------------------------------------------------- pointer -- */

  const seekFromEvent = (clientX: number) => {
    const strip = stripRef.current;
    if (!strip) return;
    const rect = strip.getBoundingClientRect();
    const frac = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    const next = frac * params.current.maxIndex;
    snapTo(next);
    setIndex(clamp(Math.round(next), 0, params.current.maxIndex));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    sim.current.dragging = true;
    sim.current.pointerId = e.pointerId;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    seekFromEvent(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (sim.current.dragging ? e.pointerId === sim.current.pointerId : hoverScrub && e.pointerType === "mouse") {
      seekFromEvent(e.clientX);
    }
  };

  const endDrag = () => {
    sim.current.dragging = false;
    sim.current.pointerId = null;
    sim.current.lastInteract = performance.now() / 1000;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (n === 0) return;
    const cur = clamp(Math.round(sim.current.target), 0, maxIndex);
    let next = cur;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = clamp(cur + 1, 0, maxIndex);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = clamp(cur - 1, 0, maxIndex);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = maxIndex;
    else return;
    e.preventDefault();
    setIndex(next);
    snapTo(next);
  };

  const activeFrame = n > 0 ? frames[clamp(index, 0, maxIndex)] : undefined;

  return (
    <div
      ref={rootRef}
      data-motion={still ? "static" : "animated"}
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-[16px]",
        "border border-[var(--color-border,#263449)] bg-[var(--color-bg-elevated,#0d1420)]",
        className,
      )}
      {...props}
    >
      {/* Preview — every frame is stacked; the loop crossfades two of them. */}
      <div className="relative aspect-[16/9] w-full border-b border-[var(--color-border,#263449)]">
        {frames.map((frame, i) => (
          <div
            key={frame.id}
            ref={(el) => {
              layerRefs.current[i] = el;
            }}
            aria-hidden={i === index ? undefined : true}
            className="absolute inset-0 overflow-hidden"
            style={{ opacity: i === index ? 1 : 0 }}
          >
            {frame.node ??
              (frame.src ? (
                <img src={frame.src} alt={frame.alt ?? ""} draggable={false} className="h-full w-full object-cover" />
              ) : null)}
          </div>
        ))}

        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-3.5 top-3.5 flex items-center gap-2.5 rounded-[6px] px-3 py-1.5",
            "border border-[rgba(160,186,224,0.25)] bg-[rgba(6,10,20,0.55)] backdrop-blur-[6px]",
            "font-mono text-[12px] text-[#eef4ff]",
          )}
        >
          <span className="h-[7px] w-[7px] rounded-full bg-[var(--color-success,#32d583)]" />
          <span ref={tcRef} className="tracking-[0.06em]">
            {timecode(index, fps)}
          </span>
          {activeFrame?.label ? (
            <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-warning,#f6b94a)]">
              {activeFrame.label}
            </span>
          ) : null}
        </div>
      </div>

      {/* Strip — a real slider. */}
      <div
        role="slider"
        tabIndex={0}
        aria-label={scrubberLabel ?? "Timeline scrubber"}
        aria-valuemin={0}
        aria-valuemax={maxIndex}
        aria-valuenow={clamp(index, 0, maxIndex)}
        aria-valuetext={
          activeFrame?.label
            ? `Frame ${index + 1} of ${n}, ${activeFrame.label}`
            : `Frame ${index + 1} of ${n}`
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        className={cn(
          "relative h-[116px] shrink-0 touch-pan-y select-none bg-[var(--color-surface,#111827)] px-4 pb-6 pt-3",
          "cursor-ew-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
          "focus-visible:ring-[var(--color-accent,#4f7cff)]",
        )}
      >
        <div ref={stripRef} className="relative flex h-full gap-[3px] overflow-hidden rounded-[6px]">
          {frames.map((frame, i) => (
            <div
              key={frame.id}
              ref={(el) => {
                thumbRefs.current[i] = el;
              }}
              aria-hidden="true"
              data-active={i === index ? "true" : "false"}
              className={cn(
                "relative min-w-0 flex-1 opacity-60 transition-opacity duration-100",
                "data-[active=true]:opacity-100",
                "data-[active=true]:after:absolute data-[active=true]:after:inset-0",
                "data-[active=true]:after:rounded-[3px] data-[active=true]:after:border-2",
                "data-[active=true]:after:border-[var(--color-accent,#4f7cff)] data-[active=true]:after:content-['']",
              )}
            >
              {frame.node ??
                (frame.src ? (
                  <img src={frame.src} alt="" draggable={false} className="h-full w-full object-cover" />
                ) : null)}
            </div>
          ))}
        </div>

        {/* Playhead overlay — same box as the strip, but outside its overflow
            clip so the handle cap isn't cropped. */}
        <div aria-hidden="true" className="pointer-events-none absolute bottom-6 left-4 right-4 top-3">
          <div
            ref={playheadRef}
            className="absolute -top-1.5 bottom-0 z-[12] -ml-px w-0.5 bg-[var(--color-accent,#4f7cff)] will-change-[left]"
            style={{ left: `${maxIndex > 0 ? (clamp(index, 0, maxIndex) / maxIndex) * 100 : 0}%` }}
          >
            <span
              className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-[3px] bg-[var(--color-accent,#4f7cff)]"
              style={{ boxShadow: "0 0 0 3px color-mix(in oklab, var(--color-accent, #4f7cff) 25%, transparent)" }}
            />
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 bottom-2.5 h-2"
          style={{
            background: `repeating-linear-gradient(to right, var(--color-border-strong, #354863) 0 1px, transparent 1px calc(100% / ${TICKS}))`,
          }}
        />
      </div>
    </div>
  );
}

export default FilmstripScrub;
