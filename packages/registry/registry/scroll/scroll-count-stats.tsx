"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface CountStat {
  /** Final value. Numbers are formatted with `format`; strings pass through verbatim ("48,210"). */
  value: number | string;
  /** The line under the number. Always readable — never encoded in the odometer alone. */
  label: string;
  /** Trailing unit rendered at a smaller size ("%", "ms", "×"). */
  suffix?: string;
  /** Optional trend series drawn as a sparkline inside this stat's window. */
  sparkline?: number[];
  /** Formats a numeric `value`. Defaults to deterministic comma grouping (SSR-stable). */
  format?: (value: number) => string;
}

export interface ScrollCountStatsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "title"> {
  /** The stats band. Each stat counts up inside its own staggered window. */
  stats: CountStat[];
  /** Band heading. The signature underline draws itself beneath it. */
  title?: React.ReactNode;
  /** Small line under the heading. */
  description?: React.ReactNode;
  /** `"signature"` draws the coral underline under `title`; `"none"` omits it. */
  underline?: "signature" | "none";
  /**
   * `"page"` (default) scrubs the band from the document scroll with a tall sticky
   * wrapper. `"container"` gives the component a keyboard-scrollable stage of its
   * own so it works inside a card or docs preview.
   */
  scrollMode?: "page" | "container";
  /** Scroll distance as a multiple of the scene height. */
  scrollLength?: number;
  /** Per-digit roll stagger, in progress units (most significant digit first). */
  stagger?: number;
  /** Overshoot past the target digit, in rows. */
  overshoot?: number;
  /** Progress smoothing rate (λ per second). */
  smoothing?: number;
  /** Scene height. Defaults to `100vh` in page mode, `520px` in container mode. */
  height?: number | string;
  /** Odometer row height in px — one digit's height. Drives the numeral size. */
  rowHeight?: number;
  /** Render the scrub percentage readout. */
  showProgress?: boolean;
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
  /** Coral. The signature underline is the only place this batch spends it. */
  signature: "var(--color-signature, #ff6b5e)",
  surface: "var(--color-surface, #111827)",
  border: "var(--color-border, #263449)",
  fg: "var(--color-fg, #f8fafc)",
  fg2: "var(--color-fg-secondary, #cbd5e1)",
  muted: "var(--color-muted, #9caabd)",
  bgElevated: "var(--color-bg-elevated, #0d1420)",
} as const;

/** Sparkline stroke rotates per stat so three columns don't read as one series. */
const SPARK_CYCLE = [T.accent, T.accent2, T.success];

/** Stat `i` starts at LEAD + i·STEP and runs for SPAN. */
const STAT_LEAD = 0.06;
const STAT_STEP = 0.12;
const STAT_SPAN = 0.55;
/** The underline draws across this window. */
const UNDERLINE_START = 0.52;
const UNDERLINE_SPAN = 0.26;
/** Overshoot occupies the last 35% of a digit's roll. */
const BUMP_TAIL = 0.35;
/** 0–9 repeated this many times, so `10 + digit` rows plus overshoot always fits. */
const STRIP_REPS = 3;
/** Sparkline viewBox. */
const SPARK_W = 120;
const SPARK_H = 36;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const damp = (cur: number, tgt: number, lambda: number, dt: number) =>
  cur + (tgt - cur) * (1 - Math.exp(-lambda * dt));

const px = (v: number | string) => (typeof v === "number" ? `${v}px` : v);

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/** Locale-independent comma grouping — identical on the server and the client. */
function groupThousands(n: number): string {
  const neg = n < 0;
  const [int, frac] = Math.abs(n).toString().split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${neg ? "-" : ""}${grouped}${frac ? `.${frac}` : ""}`;
}

interface Glyph {
  ch: string;
  /** -1 for separators (".", ",", " ") which never roll. */
  digit: number;
  /** Index among the rolling digits only — drives the stagger. */
  order: number;
}

interface StatModel {
  display: string;
  glyphs: Glyph[];
  digitCount: number;
  spark: { line: string; area: string } | null;
}

function buildStat(stat: CountStat): StatModel {
  const display =
    typeof stat.value === "number" ? (stat.format ?? groupThousands)(stat.value) : stat.value;
  const glyphs: Glyph[] = [];
  let order = 0;
  for (const ch of display) {
    if (ch >= "0" && ch <= "9") {
      glyphs.push({ ch, digit: Number(ch), order: order++ });
    } else {
      glyphs.push({ ch, digit: -1, order: -1 });
    }
  }
  return { display, glyphs, digitCount: order, spark: buildSpark(stat.sparkline) };
}

function buildSpark(series: number[] | undefined): { line: string; area: string } | null {
  if (!series || series.length < 2) return null;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const step = (SPARK_W - 4) / (series.length - 1);
  const pts = series.map((v, i) => {
    const x = 2 + i * step;
    const y = SPARK_H - 2 - ((v - min) / range) * (SPARK_H - 8);
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  const line = `M${pts.join(" L")}`;
  return { line, area: `${line} L${(SPARK_W - 2).toFixed(1)} ${SPARK_H - 2} L2 ${SPARK_H - 2} Z` };
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * ScrollCountStats — a stats band that is a pure function of scroll progress, so
 * scrolling back rewinds it digit by digit instead of counting once and going
 * inert. Each value rolls on per-digit odometer columns (most significant first,
 * staggered, with a small overshoot that passes the target and settles exactly on
 * it), the coral signature underline draws itself under the heading, and each
 * sparkline traces in inside its stat's window. Columns are fixed-height overflow
 * crops so a roll is one translate3d per column and glyphs never spill. The true
 * values are always in the accessible tree — the rolling glyphs are decoration.
 * Clean-room original.
 */
export function ScrollCountStats({
  stats,
  title,
  description,
  underline = "signature",
  scrollMode = "page",
  scrollLength = 2.6,
  stagger = 0.055,
  overshoot = 0.35,
  smoothing = 9,
  height,
  rowHeight = 46,
  showProgress = false,
  label = "Statistics band. Scroll to count the values up; scroll back to rewind them.",
  reducedMotion,
  className,
  style,
  ...props
}: ScrollCountStatsProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const sceneRef = React.useRef<HTMLDivElement | null>(null);
  const stripRefs = React.useRef<Array<Array<HTMLSpanElement | null>>>([]);
  const lineRefs = React.useRef<Array<SVGPathElement | null>>([]);
  const areaRefs = React.useRef<Array<SVGPathElement | null>>([]);
  const underlineRef = React.useRef<SVGPathElement | null>(null);
  const scrubRef = React.useRef<HTMLSpanElement | null>(null);
  const rowRef = React.useRef<HTMLSpanElement | null>(null);

  const systemReduced = useReducedMotion();
  const [enhanced, setEnhanced] = React.useState(false);
  useIsoLayoutEffect(() => setEnhanced(true), []);
  const staticMode = reducedMotion === true || (enhanced && systemReduced);
  const scrubbing = enhanced && !staticMode;

  const onScreen = useVisibilityPause(rootRef, { threshold: 0.01 });
  const animate = scrubbing && onScreen;

  const container = scrollMode === "container";
  const sceneH = px(height ?? (container ? 520 : "100vh"));

  const models = React.useMemo(() => stats.map(buildStat), [stats]);
  if (stripRefs.current.length !== models.length) {
    stripRefs.current = models.map((_, i) => stripRefs.current[i] ?? []);
  }

  const paramsRef = React.useRef({ models, stagger, overshoot, rowHeight });
  paramsRef.current = { models, stagger, overshoot, rowHeight };
  /** Measured row height — the odometer crop, re-read on resize/font changes. */
  const measuredRowRef = React.useRef(rowHeight);

  const applyRef = React.useRef<(p: number) => void>(() => {});
  applyRef.current = (p: number) => {
    const { models: defs, stagger: stg, overshoot: over } = paramsRef.current;
    const row = measuredRowRef.current || paramsRef.current.rowHeight;

    for (let i = 0; i < defs.length; i++) {
      const ps = clamp((p - STAT_LEAD - i * STAT_STEP) / STAT_SPAN, 0, 1);
      const model = defs[i];
      // Compress the per-digit windows so the last digit still finishes at ps = 1.
      const span = Math.max(0.001, 1 - stg * (model.digitCount - 1));
      const strips = stripRefs.current[i] ?? [];
      for (let g = 0; g < model.glyphs.length; g++) {
        const glyph = model.glyphs[g];
        const el = strips[g];
        if (!el || glyph.digit < 0) continue;
        const pd = clamp((ps - glyph.order * stg) / span, 0, 1);
        const roll = easeOut(pd);
        const bump = over * Math.sin(Math.PI * clamp((pd - (1 - BUMP_TAIL)) / BUMP_TAIL, 0, 1));
        const pos = (10 + glyph.digit) * roll + bump;
        el.style.transform = `translate3d(0, ${(-pos * row).toFixed(2)}px, 0)`;
      }

      if (model.spark) {
        const sp = easeOut(clamp((ps - 0.1) / 0.8, 0, 1));
        const line = lineRefs.current[i];
        const area = areaRefs.current[i];
        if (line) line.style.strokeDashoffset = (1 - sp).toFixed(4);
        if (area) area.style.opacity = (sp * 0.5).toFixed(3);
      }
    }

    if (underlineRef.current) {
      const u = easeOut(clamp((p - UNDERLINE_START) / UNDERLINE_SPAN, 0, 1));
      underlineRef.current.style.strokeDashoffset = (1 - u).toFixed(4);
    }

    const scrub = scrubRef.current;
    if (scrub) {
      const pct = Math.round(p * 100);
      if (scrub.dataset.pct !== String(pct)) {
        scrub.dataset.pct = String(pct);
        scrub.textContent = `scrub ${String(pct).padStart(3, "0")}%`;
      }
    }
  };

  // Measure the real crop height once the enhanced tree is laid out, and again on
  // resize — a font or zoom change must not desync the roll from the crop.
  useIsoLayoutEffect(() => {
    if (!scrubbing) return;
    const measure = () => {
      const h = rowRef.current?.getBoundingClientRect().height ?? 0;
      if (h > 8) measuredRowRef.current = h;
    };
    measure();
    applyRef.current(0);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      measure();
    });
    if (rowRef.current) ro.observe(rowRef.current);
    return () => ro.disconnect();
  }, [scrubbing, models]);

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

  const rowVar = `${rowHeight}px`;
  const glyphStyle: React.CSSProperties = {
    height: rowVar,
    lineHeight: rowVar,
    fontSize: `calc(${rowVar} * 0.8)`,
  };

  const scene = (
    <div
      ref={sceneRef}
      className={cn("relative flex w-full flex-col justify-center px-[clamp(22px,6%,60px)] py-10", scrubbing && "sticky top-0 overflow-hidden")}
      style={{
        ...(scrubbing ? { height: sceneH } : null),
        background: `radial-gradient(60% 50% at 50% 0%, color-mix(in oklab, ${T.accent} 8%, transparent), transparent 70%), ${T.bgElevated}`,
      }}
    >
      {title ? (
        <div className="mb-8">
          <h3
            className="relative inline-block text-[clamp(24px,3.4vw,34px)] font-bold leading-tight tracking-tight"
            style={{ color: T.fg }}
          >
            {title}
            {underline === "signature" ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 260 20"
                preserveAspectRatio="none"
                className="pointer-events-none absolute -bottom-3 -left-0.5 h-5 w-[calc(100%+8px)] overflow-visible"
              >
                <path
                  ref={underlineRef}
                  d="M4 13 C 58 5, 116 18, 158 10 C 196 3, 232 12, 256 9"
                  pathLength={1}
                  fill="none"
                  stroke={T.signature}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray={1}
                  // Server markup is the drawn state; the loop scrubs it after mount.
                  strokeDashoffset={0}
                />
              </svg>
            ) : null}
          </h3>
          {description ? (
            <p className="mt-4 font-mono text-[13px]" style={{ color: T.muted }}>
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      <div role="list" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((model, i) => {
          const stat = stats[i];
          const spark = SPARK_CYCLE[i % SPARK_CYCLE.length];
          return (
            <div
              key={`${stat.label}-${i}`}
              role="listitem"
              className="rounded-[10px] border px-[18px] pb-3.5 pt-[18px]"
              style={{ background: T.surface, borderColor: T.border }}
            >
              {/* True value for assistive tech; the glyph columns below are decoration. */}
              <span className="sr-only">
                {model.display}
                {stat.suffix ?? ""}
              </span>
              <div
                aria-hidden="true"
                className="flex items-end tabular-nums [font-variant-numeric:tabular-nums]"
                style={{ color: T.fg }}
              >
                {model.glyphs.map((glyph, g) =>
                  glyph.digit < 0 ? (
                    <span key={g} className="block font-bold" style={glyphStyle}>
                      {glyph.ch}
                    </span>
                  ) : (
                    <span key={g} className="block overflow-hidden" style={{ height: rowVar }}>
                      <span
                        ref={(el) => {
                          const arr = stripRefs.current[i];
                          if (arr) arr[g] = el;
                        }}
                        className="block"
                        style={{
                          willChange: scrubbing ? "transform" : undefined,
                          // Resting state = the final digit, so no-JS shows the real number.
                          transform: `translate3d(0, calc(${rowVar} * ${-(10 + glyph.digit)}), 0)`,
                        }}
                      >
                        {Array.from({ length: STRIP_REPS * 10 }, (_, r) => (
                          <span
                            key={r}
                            ref={i === 0 && g === 0 && r === 0 ? rowRef : undefined}
                            className="block font-bold tracking-tight"
                            style={glyphStyle}
                          >
                            {r % 10}
                          </span>
                        ))}
                      </span>
                    </span>
                  ),
                )}
                {stat.suffix ? (
                  <span
                    className="ml-[3px] font-bold"
                    style={{ color: T.fg2, fontSize: `calc(${rowVar} * 0.45)`, lineHeight: rowVar }}
                  >
                    {stat.suffix}
                  </span>
                ) : null}
              </div>
              <div className="mt-1.5 min-h-8 text-[12px]" style={{ color: T.muted }}>
                {stat.label}
              </div>
              {model.spark ? (
                <svg
                  aria-hidden="true"
                  viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
                  preserveAspectRatio="none"
                  className="mt-2.5 block h-10 w-full"
                >
                  <path
                    ref={(el) => {
                      areaRefs.current[i] = el;
                    }}
                    d={model.spark.area}
                    fill={`color-mix(in oklab, ${spark} 22%, transparent)`}
                    style={{ opacity: 0.5 }}
                  />
                  <path
                    ref={(el) => {
                      lineRefs.current[i] = el;
                    }}
                    d={model.spark.line}
                    pathLength={1}
                    fill="none"
                    stroke={spark}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeDasharray={1}
                    strokeDashoffset={0}
                  />
                </svg>
              ) : null}
            </div>
          );
        })}
      </div>

      {showProgress && scrubbing ? (
        <span
          ref={scrubRef}
          aria-hidden="true"
          className="absolute right-4 top-3.5 rounded-md border px-2.5 py-1 font-mono text-[10.5px] tabular-nums"
          style={{
            color: T.fg2,
            borderColor: T.border,
            background: `color-mix(in oklab, ${T.bgElevated} 85%, transparent)`,
          }}
        >
          scrub 000%
        </span>
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

ScrollCountStats.displayName = "ScrollCountStats";

export default ScrollCountStats;
