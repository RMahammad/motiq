"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface StickyZoomStage {
  /** Headline for this beat. */
  caption: string;
  /** Optional supporting line under the caption. */
  body?: string;
  /** Optional short label for the progress pill (falls back to `caption`). */
  label?: string;
  /** 0–1 smoothed progress at which this beat becomes active. Defaults to `index / stages.length`. */
  at?: number;
}

export interface StickyZoomHeroProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The hero scene held inside the frame — a screenshot, a live UI, anything. */
  children: React.ReactNode;
  /** 2–4 caption beats that crossfade as the frame opens up. */
  stages: StickyZoomStage[];
  /**
   * `"page"` (default) drives the zoom from the document scroll with a tall sticky
   * wrapper — the landing-page usage. `"container"` gives the component its own
   * keyboard-scrollable stage so it works inside a card or docs preview.
   */
  scrollMode?: "page" | "container";
  /** Scale of the framed card at rest. */
  startScale?: number;
  /** Scroll distance as a multiple of the scene height. */
  scrollLength?: number;
  /** Frame corner radius at rest, in px. Reaches 0 at full bleed. */
  radius?: number;
  /** Lift a vignette off the scene as it opens up. */
  vignette?: boolean;
  /** Render the progress bar + stage pills. */
  showProgress?: boolean;
  /** Scene height. Defaults to `100vh` in page mode, `540px` in container mode. */
  height?: number | string;
  /** Progress smoothing rate (λ per second) — higher tracks the scroll more tightly. */
  smoothing?: number;
  /** Fires with the active stage index whenever it changes. */
  onStageChange?: (index: number) => void;
  /** Accessible name for the internal scroll region (container mode). */
  label?: string;
  /** Force the static, motion-free variant regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Constants + helpers                                                        */
/* -------------------------------------------------------------------------- */

/** Semantic tokens with dark-default fallbacks so the component is drop-in themable. */
const T = {
  accent: "var(--color-accent, #4f7cff)",
  accentText: "var(--color-accent-text, #7f9fff)",
  accent2: "var(--color-secondary-accent, #22c7d9)",
  surface: "var(--color-surface, #111827)",
  border: "var(--color-border, #263449)",
  borderStrong: "var(--color-border-strong, #354863)",
  muted: "var(--color-muted, #9caabd)",
  fg: "var(--color-fg, #f8fafc)",
  fg2: "var(--color-fg-secondary, #cbd5e1)",
  bg: "var(--color-bg, #080c14)",
  bgElevated: "var(--color-bg-elevated, #0d1420)",
} as const;

const EASE = "cubic-bezier(0.2, 0, 0, 1)";
/** Zoom window: the frame idles, then opens across 55% of the scroll. */
const ZOOM_START = 0.15;
const ZOOM_SPAN = 0.55;
/** Vertical settle of the frame while it opens, in px. */
const RISE = 14;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
/** easeInOutCubic — the zoom curve. */
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Frame-rate independent exponential lerp: the damped scrub. */
const damp = (cur: number, tgt: number, lambda: number, dt: number) =>
  cur + (tgt - cur) * (1 - Math.exp(-lambda * dt));

const px = (v: number | string) => (typeof v === "number" ? `${v}px` : v);

/** State updates from a layout effect flush before paint, so the enhanced layout
 *  never flashes; on the server there is no layout phase to run in. */
const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * StickyZoomHero — the opening move of a product page: a framed hero card held at
 * arm's length scales to full bleed as you scroll, the corner radius closes to 0,
 * the vignette lifts, and captions crossfade through the beats. Progress is read
 * from layout inside a single requestAnimationFrame loop and smoothed through an
 * exponential lerp, so scrubbing feels damped instead of raw; only transform and
 * opacity animate. Server markup is the settled, fully readable scene, so the
 * hero works with JavaScript disabled and under reduced motion. Clean-room original.
 */
export function StickyZoomHero({
  children,
  stages,
  scrollMode = "page",
  startScale = 0.45,
  scrollLength = 3.2,
  radius = 16,
  vignette = true,
  showProgress = true,
  height,
  smoothing = 10,
  onStageChange,
  label = "Zoom hero. Scroll or use the arrow keys to open the frame to full bleed.",
  reducedMotion,
  className,
  style,
  ...props
}: StickyZoomHeroProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const sceneRef = React.useRef<HTMLDivElement | null>(null);
  const frameRef = React.useRef<HTMLDivElement | null>(null);
  const vignetteRef = React.useRef<HTMLDivElement | null>(null);
  const barRef = React.useRef<HTMLSpanElement | null>(null);
  const capRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const pillRefs = React.useRef<Array<HTMLSpanElement | null>>([]);

  const systemReduced = useReducedMotion();
  // The system preference isn't knowable on the server, so it is resolved after
  // mount — server and first client render agree on markup and data-motion.
  const [enhanced, setEnhanced] = React.useState(false);
  useIsoLayoutEffect(() => setEnhanced(true), []);
  const staticMode = reducedMotion === true || (enhanced && systemReduced);
  const scrubbing = enhanced && !staticMode;

  const onScreen = useVisibilityPause(rootRef, { threshold: 0.01 });
  const animate = scrubbing && onScreen;

  const container = scrollMode === "container";
  const sceneH = px(height ?? (container ? 540 : "100vh"));

  const thresholds = React.useMemo(
    () => stages.map((s, i) => (typeof s.at === "number" ? s.at : i / Math.max(1, stages.length))),
    [stages],
  );

  const stageChangeRef = React.useRef(onStageChange);
  stageChangeRef.current = onStageChange;
  const paramsRef = React.useRef({ startScale, radius, vignette, thresholds, smoothing });
  paramsRef.current = { startScale, radius, vignette, thresholds, smoothing };

  /** Writes one frame of the choreography. Pure function of smoothed progress. */
  const applyRef = React.useRef<(p: number) => void>(() => {});
  applyRef.current = (p: number) => {
    const { startScale: s0, radius: r0, vignette: vig, thresholds: at } = paramsRef.current;
    const e = easeInOut(clamp((p - ZOOM_START) / ZOOM_SPAN, 0, 1));

    // Publish progress as custom properties so consumer children can choreograph
    // in pure CSS (chart bars growing in, copy lifting) with no React re-render.
    const sceneEl = sceneRef.current;
    if (sceneEl) {
      sceneEl.style.setProperty("--mk-progress", p.toFixed(4));
      sceneEl.style.setProperty("--mk-zoom", e.toFixed(4));
    }

    const frame = frameRef.current;
    if (frame) {
      const scale = s0 + (1 - s0) * e;
      frame.style.transform = `translate3d(0, ${((1 - e) * RISE).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      // Radius is a paint, not a composite — quantize to whole px so a full pass
      // costs at most `radius` repaints instead of one per frame.
      const rad = Math.round(r0 * (1 - e));
      if (frame.dataset.radius !== String(rad)) {
        frame.dataset.radius = String(rad);
        frame.style.borderRadius = `${rad}px`;
      }
    }
    if (vignetteRef.current) vignetteRef.current.style.opacity = vig ? (0.85 * (1 - e)).toFixed(3) : "0";
    if (barRef.current) barRef.current.style.transform = `scaleX(${p.toFixed(4)})`;

    let idx = 0;
    for (let i = 0; i < at.length; i++) if (p >= at[i]) idx = i;
    const root = rootRef.current;
    if (root && root.dataset.stage !== String(idx)) {
      root.dataset.stage = String(idx);
      capRefs.current.forEach((el, i) => {
        if (!el) return;
        el.style.opacity = i === idx ? "1" : "0";
        el.style.transform = i === idx ? "translate3d(0,0,0)" : "translate3d(0,10px,0)";
      });
      pillRefs.current.forEach((el, i) => {
        if (!el) return;
        el.style.color = i === idx ? T.accentText : T.muted;
        el.style.borderColor = i === idx ? T.accent : T.border;
      });
      stageChangeRef.current?.(idx);
    }
  };

  // Install the scrubbed start state before the browser paints the enhanced tree.
  useIsoLayoutEffect(() => {
    if (!scrubbing) return;
    applyRef.current(0);
  }, [scrubbing]);

  // Container mode traps its own wheel via overscroll-behavior; relay at the ends
  // so the page keeps scrolling. Passive — the component never preventDefaults.
  React.useEffect(() => {
    const sc = scrollerRef.current;
    if (!container || !scrubbing || !sc) return;
    const onWheel = (e: WheelEvent) => {
      const atTop = sc.scrollTop <= 0;
      const atEnd = sc.scrollTop >= sc.scrollHeight - sc.clientHeight - 1;
      if ((atTop && e.deltaY < 0) || (atEnd && e.deltaY > 0)) window.scrollBy(0, e.deltaY);
    };
    sc.addEventListener("wheel", onWheel, { passive: true });
    return () => sc.removeEventListener("wheel", onWheel);
  }, [container, scrubbing]);

  React.useEffect(() => {
    if (!animate || typeof requestAnimationFrame === "undefined") return;
    let raf = 0;
    let last = 0;
    let p = 0;
    const frame = (now: number) => {
      let dt = last ? (now - last) / 1000 : 0.016;
      if (!(dt > 0) || dt > 0.05) dt = 0.016;
      last = now;
      // Progress is read from layout inside the loop — never from a scroll event
      // handler, so there is at most one layout read per frame.
      let target = 0;
      const sc = scrollerRef.current;
      const track = trackRef.current;
      const scene = sceneRef.current;
      if (container && sc) {
        const max = sc.scrollHeight - sc.clientHeight;
        target = max > 0 ? clamp(sc.scrollTop / max, 0, 1) : 0;
      } else if (track && scene) {
        const r = track.getBoundingClientRect();
        const travel = r.height - scene.getBoundingClientRect().height;
        target = travel > 0 ? clamp(-r.top / travel, 0, 1) : 0;
      }
      p = damp(p, target, paramsRef.current.smoothing, dt);
      applyRef.current(p);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animate, container]);

  const captions = (
    <div
      className={cn(
        scrubbing
          ? "pointer-events-none absolute bottom-11 left-5 right-5 z-[5]"
          : "relative z-[5] flex flex-col gap-3 px-5 py-6",
      )}
    >
      {stages.map((s, i) => (
        <div
          key={`${s.caption}-${i}`}
          ref={(el) => {
            capRefs.current[i] = el;
          }}
          data-zoom-caption={i}
          className={cn(
            "rounded-[10px] border px-[15px] py-3 backdrop-blur-[6px]",
            scrubbing && "absolute bottom-0 left-0 w-[min(330px,72%)]",
          )}
          style={{
            borderColor: T.border,
            background: `color-mix(in oklab, ${T.bgElevated} 86%, transparent)`,
            ...(scrubbing
              ? {
                  opacity: i === 0 ? 1 : 0,
                  transform: i === 0 ? "translate3d(0,0,0)" : "translate3d(0,10px,0)",
                  transition: `opacity 360ms ${EASE}, transform 360ms ${EASE}`,
                }
              : null),
          }}
        >
          <span className="block font-mono text-[10px] tracking-[0.08em]" style={{ color: T.accentText }}>
            {String(i + 1).padStart(2, "0")} · {s.label ?? "beat"}
          </span>
          <b className="mt-1 block text-[14px] font-semibold" style={{ color: T.fg }}>
            {s.caption}
          </b>
          {s.body ? (
            <span className="mt-0.5 block text-[12px] leading-snug" style={{ color: T.fg2 }}>
              {s.body}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );

  const scene = (
    <div
      ref={sceneRef}
      className={cn("relative w-full overflow-hidden", scrubbing && "sticky top-0")}
      style={scrubbing ? { height: sceneH } : undefined}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[20%]"
        style={{
          background: `radial-gradient(46% 42% at 50% 44%, color-mix(in oklab, ${T.accent} 16%, transparent), transparent 70%), radial-gradient(30% 30% at 72% 24%, color-mix(in oklab, ${T.accent2} 9%, transparent), transparent 70%)`,
        }}
      />

      <div
        ref={frameRef}
        className={cn("overflow-hidden border shadow-[var(--shadow-lg,0_28px_64px_-16px_rgba(0,3,10,0.72))]", scrubbing ? "absolute inset-0" : "relative w-full")}
        style={{
          background: T.surface,
          borderColor: T.borderStrong,
          borderRadius: `${radius}px`,
          transformOrigin: "50% 46%",
          willChange: scrubbing ? "transform" : undefined,
        }}
      >
        {children}
      </div>

      {vignette ? (
        <div
          ref={vignetteRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[3]"
          style={{
            opacity: 0,
            background: `radial-gradient(120% 92% at 50% 42%, transparent 42%, color-mix(in oklab, ${T.bg} 82%, #000) 100%)`,
            willChange: scrubbing ? "opacity" : undefined,
          }}
        />
      ) : null}

      {captions}

      {showProgress && scrubbing ? (
        <div aria-hidden="true" className="absolute left-[18px] right-[18px] top-[14px] z-[6] flex items-center gap-3.5">
          <span className="h-0.5 flex-1 overflow-hidden rounded-sm" style={{ background: T.border }}>
            <span
              ref={barRef}
              className="block h-full origin-left"
              style={{ background: T.accent, transform: "scaleX(0)", willChange: "transform" }}
            />
          </span>
          <span className="flex gap-1.5">
            {stages.map((s, i) => (
              <span
                key={`pill-${i}`}
                ref={(el) => {
                  pillRefs.current[i] = el;
                }}
                className="rounded-full border px-2 py-[3px] font-mono text-[9.5px] tracking-[0.06em] whitespace-nowrap"
                style={{
                  color: i === 0 ? T.accentText : T.muted,
                  borderColor: i === 0 ? T.accent : T.border,
                  background: `color-mix(in oklab, ${T.bgElevated} 80%, transparent)`,
                  transition: `color 220ms ${EASE}, border-color 220ms ${EASE}`,
                }}
              >
                {String(i + 1).padStart(2, "0")} {s.label ?? s.caption}
              </span>
            ))}
          </span>
        </div>
      ) : null}
    </div>
  );

  const track = (
    <div ref={trackRef} style={scrubbing ? { height: `calc(${sceneH} * ${scrollLength})` } : undefined}>
      {scene}
    </div>
  );

  return (
    <div
      ref={rootRef}
      data-motion={staticMode ? "static" : "animated"}
      data-scroll-mode={scrollMode}
      // Seeded so the first applied frame doesn't report a "change" into stage 0.
      data-stage={0}
      className={cn("w-full", className)}
      style={style}
      {...props}
    >
      {container && scrubbing ? (
        <div className="relative w-full overflow-hidden rounded-[inherit]" style={{ height: sceneH }}>
          <div
            ref={scrollerRef}
            tabIndex={0}
            role="region"
            aria-label={label}
            className="h-full overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent,#4f7cff)]"
          >
            {track}
          </div>
        </div>
      ) : (
        track
      )}
    </div>
  );
}

StickyZoomHero.displayName = "StickyZoomHero";

export default StickyZoomHero;
