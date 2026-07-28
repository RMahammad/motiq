"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type WipeStyle = "sweep" | "iris" | "curtain";

export interface WipeSection {
  /** The chapter's content. Fills the stage. */
  node: React.ReactNode;
  /** How this chapter cuts in over the previous one. Ignored on the first section. */
  wipe?: WipeStyle;
  /** Iris origin as `[x%, y%]` of the stage. Default `[78, 30]`. */
  origin?: [number, number];
  /** Leading-edge glow colour. Defaults to a rotating accent per chapter. */
  accent?: string;
  /** Short label for the progress HUD. */
  label?: string;
}

export interface MaskWipeSectionsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Chapters in cut order. The first is the base layer; each later one wipes over it. */
  sections: WipeSection[];
  /**
   * `"page"` (default) drives the cuts from the document scroll with a tall sticky
   * wrapper. `"container"` gives the component a keyboard-scrollable stage of its
   * own so it works inside a card or docs preview.
   */
  scrollMode?: "page" | "container";
  /** Scroll distance as a multiple of the scene height. */
  scrollLength?: number;
  /** Render the lit leading edge on each cut. */
  edgeGlow?: boolean;
  /** Held beat between wipes, in progress units. */
  dwell?: number;
  /** Render the per-wipe progress HUD. */
  showProgress?: boolean;
  /** Scene height. Defaults to `100vh` in page mode, `540px` in container mode. */
  height?: number | string;
  /** Progress smoothing rate (λ per second). */
  smoothing?: number;
  /** Fires with the frontmost fully-revealed section index whenever it changes. */
  onSectionChange?: (index: number) => void;
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
  success: "var(--color-success, #32d583)",
  warning: "var(--color-warning, #f6b94a)",
  border: "var(--color-border, #263449)",
  bgElevated: "var(--color-bg-elevated, #0d1420)",
  muted: "var(--color-muted, #9caabd)",
} as const;

/** Rotating leading-edge colours so consecutive cuts read as different chapters. */
const ACCENT_CYCLE = [T.accent, T.accent2, T.success, T.warning];
/** Dead progress at each end so the first and last chapters get a held beat. */
const LEAD = 0.06;
/** Slant of the angled sweep, in % of stage width. */
const SLANT = 12;
/** Iris ring stroke widths — set on the SVG circle so the stroke never scales. */
const RING_CORE = 2.5;
const RING_GLOW = 10;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const damp = (cur: number, tgt: number, lambda: number, dt: number) =>
  cur + (tgt - cur) * (1 - Math.exp(-lambda * dt));

const px = (v: number | string) => (typeof v === "number" ? `${v}px` : v);

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

interface WipeHandles {
  panel: HTMLDivElement | null;
  sweep: HTMLSpanElement | null;
  ringCore: SVGCircleElement | null;
  ringGlow: SVGCircleElement | null;
  curtainA: HTMLSpanElement | null;
  curtainB: HTMLSpanElement | null;
  seg: HTMLSpanElement | null;
}

const emptyHandles = (): WipeHandles => ({
  panel: null,
  sweep: null,
  ringCore: null,
  ringGlow: null,
  curtainA: null,
  curtainB: null,
  seg: null,
});

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * MaskWipeSections — chaptered storytelling with hard cuts instead of crossfades:
 * each section is revealed by a scroll-driven clip-path wipe (an angled sweep, an
 * expanding iris, or a centre-split curtain), led by a lit accent edge. The iris
 * ring is an SVG circle whose `r` attribute is animated, so the stroke hugs the
 * clip edge at a constant width instead of thickening the way a scaled bordered
 * element does. One requestAnimationFrame loop reads progress from layout and
 * smooths it through an exponential lerp; only the active wipe's style is written
 * each frame. Under reduced motion the sticky stack collapses and every chapter
 * reads as a plain stacked section. Clean-room original.
 */
export function MaskWipeSections({
  sections,
  scrollMode = "page",
  scrollLength = 3.8,
  edgeGlow = true,
  dwell = 0.05,
  showProgress = true,
  height,
  smoothing = 9,
  onSectionChange,
  label = "Chaptered story. Scroll or use the arrow keys to cut between chapters.",
  reducedMotion,
  className,
  style,
  ...props
}: MaskWipeSectionsProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const sceneRef = React.useRef<HTMLDivElement | null>(null);
  const handlesRef = React.useRef<WipeHandles[]>([]);
  if (handlesRef.current.length !== sections.length) {
    handlesRef.current = sections.map((_, i) => handlesRef.current[i] ?? emptyHandles());
  }

  const systemReduced = useReducedMotion();
  const [enhanced, setEnhanced] = React.useState(false);
  useIsoLayoutEffect(() => setEnhanced(true), []);
  const staticMode = reducedMotion === true || (enhanced && systemReduced);
  const scrubbing = enhanced && !staticMode;

  const onScreen = useVisibilityPause(rootRef, { threshold: 0.01 });
  const animate = scrubbing && onScreen;

  const container = scrollMode === "container";
  const sceneH = px(height ?? (container ? 540 : "100vh"));

  /** One [start, end] progress window per wiping section (index 1…n-1). */
  const windows = React.useMemo(() => {
    const n = Math.max(0, sections.length - 1);
    if (n === 0) return [] as Array<[number, number]>;
    const span = Math.max(0.02, (1 - 2 * LEAD - (n - 1) * dwell) / n);
    return Array.from({ length: n }, (_, k) => {
      const start = LEAD + k * (span + dwell);
      return [start, start + span] as [number, number];
    });
  }, [sections.length, dwell]);

  const sectionChangeRef = React.useRef(onSectionChange);
  sectionChangeRef.current = onSectionChange;
  const paramsRef = React.useRef({ sections, windows, edgeGlow });
  paramsRef.current = { sections, windows, edgeGlow };

  const applyRef = React.useRef<(p: number) => void>(() => {});
  applyRef.current = (p: number) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const W = scene.clientWidth || 700;
    const H = scene.clientHeight || 540;
    const { sections: defs, windows: wins, edgeGlow: glow } = paramsRef.current;

    let front = 0;
    for (let i = 1; i < defs.length; i++) {
      const h = handlesRef.current[i];
      const win = wins[i - 1];
      if (!h || !win) continue;
      const w = easeInOut(clamp((p - win[0]) / Math.max(0.001, win[1] - win[0]), 0, 1));
      if (w > 0.5) front = i;
      const lit = Math.sin(Math.PI * w);
      const wipe = defs[i].wipe ?? "sweep";

      if (wipe === "iris") {
        const [ox, oy] = defs[i].origin ?? [78, 30];
        const r = w * Math.hypot(W, H);
        if (h.panel) h.panel.style.clipPath = `circle(${r.toFixed(1)}px at ${ox}% ${oy}%)`;
        if (glow) {
          const rs = r.toFixed(1);
          // The ring is an SVG circle: animating `r` keeps stroke-width constant,
          // unlike scaling a bordered element (whose border scales with it).
          h.ringCore?.setAttribute("r", rs);
          h.ringGlow?.setAttribute("r", rs);
          if (h.ringCore) h.ringCore.style.opacity = (lit * 0.95).toFixed(3);
          if (h.ringGlow) h.ringGlow.style.opacity = (lit * 0.28).toFixed(3);
        }
      } else if (wipe === "curtain") {
        const inset = 50 * (1 - w);
        if (h.panel) h.panel.style.clipPath = `inset(0 ${inset.toFixed(2)}% 0 ${inset.toFixed(2)}%)`;
        if (glow) {
          const off = ((50 - inset) / 100) * W;
          if (h.curtainA) {
            h.curtainA.style.transform = `translate3d(${(W / 2 - off).toFixed(1)}px,0,0)`;
            h.curtainA.style.opacity = lit.toFixed(3);
          }
          if (h.curtainB) {
            h.curtainB.style.transform = `translate3d(${(W / 2 + off).toFixed(1)}px,0,0)`;
            h.curtainB.style.opacity = lit.toFixed(3);
          }
        }
      } else {
        const x = w * (100 + 2 * SLANT) - SLANT;
        if (h.panel) {
          h.panel.style.clipPath = `polygon(0 0, ${(x + SLANT).toFixed(2)}% 0, ${(x - SLANT).toFixed(2)}% 100%, 0 100%)`;
        }
        if (glow && h.sweep) {
          h.sweep.style.transform = `translate3d(${((x / 100) * W).toFixed(1)}px,0,0) rotate(8deg)`;
          h.sweep.style.opacity = lit.toFixed(3);
        }
      }

      if (h.seg) h.seg.style.transform = `scaleX(${w.toFixed(3)})`;
    }

    const root = rootRef.current;
    if (root && root.dataset.section !== String(front)) {
      root.dataset.section = String(front);
      sectionChangeRef.current?.(front);
    }
  };

  useIsoLayoutEffect(() => {
    if (!scrubbing) return;
    applyRef.current(0);
  }, [scrubbing, sections.length]);

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
      p = damp(p, target, smoothing, dt);
      applyRef.current(p);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animate, container, smoothing]);

  const setHandle = <K extends keyof WipeHandles>(i: number, key: K) => (el: WipeHandles[K]) => {
    const h = handlesRef.current[i];
    if (h) h[key] = el;
  };

  const scene = (
    <div
      ref={sceneRef}
      className={cn("relative w-full", scrubbing ? "sticky top-0 overflow-hidden" : "flex flex-col")}
      style={scrubbing ? { height: sceneH } : undefined}
    >
      {sections.map((section, i) => {
        const accent = section.accent ?? ACCENT_CYCLE[i % ACCENT_CYCLE.length];
        const wipe = section.wipe ?? "sweep";
        return (
          <React.Fragment key={i}>
            <div
              ref={setHandle(i, "panel")}
              className={cn(
                "flex flex-col justify-center px-[clamp(24px,6%,64px)] py-11",
                scrubbing ? "absolute inset-0" : "relative min-h-[300px] w-full",
              )}
              style={{
                zIndex: i,
                background: `linear-gradient(140deg, color-mix(in oklab, ${accent} 13%, ${T.bgElevated}), ${T.bgElevated} 58%)`,
                willChange: scrubbing && i > 0 ? "clip-path" : undefined,
              }}
            >
              {section.node}
            </div>

            {edgeGlow && scrubbing && i > 0 ? (
              <React.Fragment>
                {wipe === "iris" ? (
                  <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                    style={{ zIndex: sections.length + i }}
                  >
                    <circle
                      ref={setHandle(i, "ringGlow")}
                      cx={`${(section.origin ?? [78, 30])[0]}%`}
                      cy={`${(section.origin ?? [78, 30])[1]}%`}
                      r={0}
                      fill="none"
                      stroke={accent}
                      strokeWidth={RING_GLOW}
                      style={{ opacity: 0 }}
                    />
                    <circle
                      ref={setHandle(i, "ringCore")}
                      cx={`${(section.origin ?? [78, 30])[0]}%`}
                      cy={`${(section.origin ?? [78, 30])[1]}%`}
                      r={0}
                      fill="none"
                      stroke={accent}
                      strokeWidth={RING_CORE}
                      style={{ opacity: 0 }}
                    />
                  </svg>
                ) : wipe === "curtain" ? (
                  <React.Fragment>
                    <span
                      aria-hidden="true"
                      ref={setHandle(i, "curtainA")}
                      className="pointer-events-none absolute -bottom-[18%] -top-[18%] left-0 w-[3px]"
                      style={{
                        zIndex: sections.length + i,
                        opacity: 0,
                        background: `linear-gradient(180deg, transparent, ${accent}, transparent)`,
                        boxShadow: `0 0 18px 3px color-mix(in oklab, ${accent} 55%, transparent)`,
                        willChange: "transform, opacity",
                      }}
                    />
                    <span
                      aria-hidden="true"
                      ref={setHandle(i, "curtainB")}
                      className="pointer-events-none absolute -bottom-[18%] -top-[18%] left-0 w-[3px]"
                      style={{
                        zIndex: sections.length + i,
                        opacity: 0,
                        background: `linear-gradient(180deg, transparent, ${accent}, transparent)`,
                        boxShadow: `0 0 18px 3px color-mix(in oklab, ${accent} 55%, transparent)`,
                        willChange: "transform, opacity",
                      }}
                    />
                  </React.Fragment>
                ) : (
                  <span
                    aria-hidden="true"
                    ref={setHandle(i, "sweep")}
                    className="pointer-events-none absolute -bottom-[18%] -top-[18%] left-0 w-[3px]"
                    style={{
                      zIndex: sections.length + i,
                      opacity: 0,
                      background: `linear-gradient(180deg, transparent, ${accent}, transparent)`,
                      boxShadow: `0 0 18px 3px color-mix(in oklab, ${accent} 55%, transparent)`,
                      willChange: "transform, opacity",
                    }}
                  />
                )}
              </React.Fragment>
            ) : null}
          </React.Fragment>
        );
      })}

      {showProgress && scrubbing && sections.length > 1 ? (
        <div
          aria-hidden="true"
          className="absolute left-[18px] right-[18px] top-[14px] flex items-center gap-2"
          style={{ zIndex: sections.length * 2 + 1 }}
        >
          {sections.slice(1).map((section, k) => {
            const i = k + 1;
            const accent = section.accent ?? ACCENT_CYCLE[i % ACCENT_CYCLE.length];
            return (
              <span key={`seg-${i}`} className="flex flex-1 flex-col gap-1">
                <small className="font-mono text-[9px] uppercase tracking-[0.08em]" style={{ color: T.muted }}>
                  {section.label ?? `${section.wipe ?? "sweep"}`}
                </small>
                <span className="h-0.5 overflow-hidden rounded-sm" style={{ background: T.border }}>
                  <span
                    ref={setHandle(i, "seg")}
                    className="block h-full origin-left"
                    style={{ background: accent, transform: "scaleX(0)", willChange: "transform" }}
                  />
                </span>
              </span>
            );
          })}
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
      // Seeded so the first applied frame doesn't report a "change" into section 0.
      data-section={0}
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

MaskWipeSections.displayName = "MaskWipeSections";

export default MaskWipeSections;
