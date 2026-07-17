"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useVisibilityPause,
  resolveComposition,
  compositionScrimStyle,
  contentFalloff,
  type ContentPlacement,
} from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type LaneStatus = "flowing" | "congested" | "delayed" | "blocked" | "settling";

export interface LaneData {
  /** Stable id (used as the React key). */
  id: string;
  /** Optional short label rendered quietly at the lane head. */
  label?: string;
  /** Items waiting to be processed — drives congestion vs. capacity. */
  queued: number;
  /** Items currently in flight — drives the base pulse count. */
  active: number;
  /** Items already done — fades into the tail history band. */
  completed: number;
  /** Delayed work: slower, dashed cadence (non-color signal). */
  delayed?: boolean;
  /** Blocked: flow stops at a non-color bar cap + glyph. */
  blocked?: boolean;
  /** Throughput hint (items/interval) — nudges pulse count upward. */
  throughput?: number;
  /** Lane capacity — the reference for the congestion ratio. */
  capacity?: number;
  /** Explicit status override; otherwise derived from the counts. */
  status?: LaneStatus;
}

export interface QueueRect {
  /** 0–1 left edge of the readable safe area. */
  x: number;
  /** 0–1 top edge of the readable safe area. */
  y: number;
  /** 0–1 width of the readable safe area. */
  w: number;
  /** 0–1 height of the readable safe area. */
  h: number;
}

export interface QueuePulseLanesProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Application-defined queue lanes. Omit to render a deterministic default set. */
  lanes?: LaneData[];
  /**
   * Where the foreground content sits. The lanes always run full-bleed across the
   * whole field; this places a frosted-glass scrim behind the copy (so text stays
   * readable while the live lanes continue underneath) and drops any label near the
   * copy — the one prop needed for a readable hero. "none" = full-bleed, no scrim.
   */
  contentPlacement?: ContentPlacement;
  /** Focus/feather of the readable scrim behind the copy (0–1). */
  safeAreaPadding?: number;
  /** How strongly the scrim behind the copy is concentrated (0–1). */
  safeAreaStrength?: number;
  /** Show lane labels. Default true (auto-hidden near content). */
  showLabels?: boolean;
  /** Hide labels that fall inside/near the readable region. Default true. */
  hideLabelsNearContent?: boolean;
  /** Region where lanes quiet down so foreground text stays readable (0–1 coords). */
  safeArea?: QueueRect;
  /** Pulse-count multiplier per lane (~0.5–1.6). */
  density?: number;
  /** Overall luminance/opacity of the field (0–1.4). */
  intensity?: number;
  /** Flow speed multiplier. 0 freezes the pulses (still legible). */
  speed?: number;
  /** Pointer lifts the nearest lane with a soft highlight (never the sole effect). */
  interactive?: boolean;
  /** Pause the pulses when scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
  /** Deterministic seed for pulse phase/jitter (SSR-stable). */
  seed?: number;
  /** Force the static, motion-free snapshot regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Deterministic geometry                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The logical HEIGHT is fixed; the logical WIDTH tracks the container's aspect
 * ratio so the SVG viewBox always matches the container and the wide lane board
 * is never cropped to a sliver. Aspect is measured after mount (ResizeObserver)
 * into state seeded with a desktop default, so SSR and the first client paint
 * agree — then the layout re-flows to the real shape.
 */
const VH = 760;
/** Desktop-shaped default so server + first client render match (no hydration gap). */
const DEFAULT_ASPECT = 1200 / 760;
/** Keyframe fallback only — the real travel is written per-layout via `--travel`. */
const DEFAULT_TRAVEL = 1040;
/** Below this container width the board drops to a few taller, legible lanes. */
const MOBILE_LANES = 4;
const NARROW_W = 640;

/** mulberry32 — no Math.random / Date.now at render (SSR-stable). */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

interface Pulse {
  x: number;
  y: number;
  w: number;
  h: number;
  delay: number;
  dur: number;
}

/** A faint ambient signal dot that fills the field so no corner reads as dead. */
interface Mote {
  /** 0–1 field position. */
  x: number;
  y: number;
  /** Radius in logical units. */
  r: number;
  /** Warm (accent) vs cool (cyan) tint. */
  warm: boolean;
  /** Twinkle period + phase delay (seconds). */
  dur: number;
  delay: number;
}

/** ~54 deterministic scattered motes across the whole field (SSR-stable). */
function buildMotes(seed: number): Mote[] {
  const rng = makeRng((seed >>> 0) * 0x85ebca6b + 0x27d4eb2f);
  return Array.from({ length: 54 }, () => ({
    x: Math.round(rng() * 1000) / 1000,
    y: Math.round(rng() * 1000) / 1000,
    r: round1(1.6 + rng() * 2.4),
    warm: rng() > 0.66,
    dur: round1(3.4 + rng() * 4.2),
    delay: round1(-rng() * 6),
  }));
}

interface Lane {
  id: string;
  label?: string;
  status: LaneStatus;
  /** Short status stat shown in the lane-head chip (e.g. "4 queued", "88 done"). */
  stat: string;
  cy: number;
  h: number;
  /** 0–1 occupancy (queued+active over capacity) — drives fill + rhythm. */
  occ: number;
  /** 0–1 share of the track already completed (history band + stop position). */
  done: number;
  /** Occupied width up to the flow front (fill bar / stop cap). */
  fillW: number;
  historyW: number;
  pulses: Pulse[];
  delayed: boolean;
  blocked: boolean;
}

/** Aggregate readouts for the glassy metric chips — honest sums of the lane data. */
interface QueueMetrics {
  queued: number;
  active: number;
  throughput: number;
}

function computeMetrics(src: LaneData[]): QueueMetrics {
  return src.reduce<QueueMetrics>(
    (acc, l) => ({
      queued: acc.queued + Math.max(0, l.queued),
      active: acc.active + Math.max(0, l.active),
      throughput: acc.throughput + Math.max(0, l.throughput ?? 0),
    }),
    { queued: 0, active: 0, throughput: 0 },
  );
}

/** One short status line per lane, derived from its state — the chip's stat. */
function laneStat(status: LaneStatus, queued: number, active: number, completed: number): string {
  switch (status) {
    case "blocked":
      return "blocked";
    case "delayed":
      return "delayed";
    case "congested":
      return `${queued} queued`;
    case "settling":
      return `${completed} done`;
    default:
      return queued > 0 ? `${queued} queued` : `${active} active`;
  }
}

/**
 * The rectangle the lane board occupies in logical coords. The board is always
 * full-bleed — lanes span the whole width and height on every placement, so the
 * portion behind the copy stays visible (softened by the frosted scrim) rather
 * than being carved away or pushed into a band. Narrow layouts keep the first few
 * taller lanes for legibility.
 */
interface Board {
  /** Track start / end X (shared by every lane). */
  x0: number;
  x1: number;
  /** Band top / bottom Y that the lanes are distributed across. */
  top: number;
  bottom: number;
  /** Pulse travel distance (x1 − x0). */
  travel: number;
  /** How many lanes are drawn (mobile keeps the first few, taller ones). */
  count: number;
}

function computeBoard(narrow: boolean, vw: number, vh: number, laneCount: number): Board {
  // Full-bleed on every placement: the lanes fill the whole field and simply
  // soften under the copy behind the glass scrim, so they read as one live queue.
  const bx = vw * 0.05;
  const bw = vw * 0.9;
  const byTop = vh * 0.1;
  const bh = vh * 0.8;

  const pad = clamp(bw * 0.035, 10, 46);
  const x0 = round1(bx + pad);
  const x1 = round1(bx + bw - pad);
  const count = narrow ? Math.min(MOBILE_LANES, laneCount) : laneCount;
  return { x0, x1, top: round1(byTop), bottom: round1(byTop + bh), travel: round1(x1 - x0), count };
}

/** Five lanes that read as a real queue board: one of each meaningful state. */
function defaultLanes(): LaneData[] {
  return [
    { id: "webhooks", label: "webhooks", queued: 4, active: 3, completed: 46, capacity: 14, throughput: 9 },
    { id: "image-resize", label: "image-resize", queued: 23, active: 6, completed: 31, capacity: 24, throughput: 5 },
    { id: "email-digest", label: "email-digest", queued: 9, active: 0, completed: 17, capacity: 12, blocked: true },
    { id: "csv-import", label: "csv-import", queued: 6, active: 2, completed: 20, capacity: 11, delayed: true, throughput: 3 },
    { id: "thumbnails", label: "thumbnails", queued: 1, active: 1, completed: 88, capacity: 10, throughput: 7 },
  ];
}

function deriveStatus(l: LaneData, occ: number, done: number): LaneStatus {
  if (l.status) return l.status;
  if (l.blocked) return "blocked";
  if (l.delayed) return "delayed";
  if (occ >= 0.68) return "congested";
  if (done >= 0.8 && occ < 0.35) return "settling";
  return "flowing";
}

/** Turn app data into positioned lanes with a seeded, deterministic rhythm. */
function buildLanes(
  src: LaneData[],
  seed: number,
  density: number,
  speed: number,
  board: Board,
): Lane[] {
  const rng = makeRng(seed);
  const shown = src.slice(0, Math.max(1, board.count));
  const n = Math.max(1, shown.length);
  const slot = (board.bottom - board.top) / n;
  // Confident, weighty tracks that fill their slot — not thin bars.
  const bandH = clamp(slot * 0.6, 26, 82);
  const travel = board.travel;

  return shown.map((l, i) => {
    const queued = Math.max(0, l.queued);
    const active = Math.max(0, l.active);
    const completed = Math.max(0, l.completed);
    const cap = Math.max(1, l.capacity ?? queued + active + 1);
    const occ = clamp((queued + active) / cap, 0, 1.25);
    const total = queued + active + completed + 1;
    const done = clamp(completed / total, 0, 1);
    const status = deriveStatus(l, occ, done);
    const cy = round1(board.top + slot * (i + 0.5));

    // Completed work settles into a faint band at the lane tail.
    const historyW = round1(clamp(done, 0, 1) * travel * 0.42);
    // Flow front: how far the occupied queue reaches (also the stop position).
    const fillW = round1(clamp(0.16 + occ * 0.6, 0.12, 0.86) * travel);

    // Congestion changes rhythm: denser AND slower under load.
    const base = 2 + Math.round((active * 0.5 + (l.throughput ?? active)) * 0.4);
    const count = l.blocked
      ? 0
      : clamp(Math.round((base + occ * 5) * density), 1, 9);
    const slow = l.delayed ? 1.7 : 1;
    const dur = round1(clamp((5.2 + occ * 7) * slow / Math.max(0.001, speed), 2.4, 24));
    // Fatter capsules sit proud in the taller track so pulses read clearly.
    const ph = clamp(bandH * 0.56, 10, 26);

    const pulses: Pulse[] = [];
    for (let k = 0; k < count; k++) {
      // Even spacing along the loop + a small seeded jitter so lanes never lock-step.
      const jitter = (rng() - 0.5) * (dur / count) * 0.5;
      const yJit = round1((rng() - 0.5) * (bandH - ph) * 0.5);
      pulses.push({
        x: board.x0,
        y: round1(cy - ph / 2 + yJit),
        w: round1(clamp(40 - occ * 10, 22, 46)),
        h: round1(ph),
        delay: round1(-(dur * k) / count + jitter),
        dur,
      });
    }

    return {
      id: l.id,
      label: l.label,
      status,
      stat: laneStat(status, queued, active, completed),
      cy,
      h: round1(bandH),
      occ: round1(occ),
      done: round1(done),
      fillW,
      historyW,
      pulses,
      delayed: !!l.delayed,
      blocked: !!l.blocked,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * QueuePulseLanes — an atmospheric background that renders an application's
 * queue/throughput lanes rather than decorative streaks. Each lane is a
 * horizontal track: pulses (capsules) flow left→right, congestion (queued vs.
 * capacity) makes them denser *and* slower, completed work fades into a tail
 * history band, delayed lanes drift with a dashed cadence, and blocked lanes
 * stop at a non-color bar cap + glyph (legible in monochrome). The lanes run
 * full-bleed; a frosted-glass scrim behind the copy keeps it readable while the
 * queue stays visible underneath. SVG + CSS keyframes only — no canvas, no WebGL,
 * no per-frame React state, and no `Math.random`/`Date.now` at render, so server
 * and client produce identical markup. Decorative: renders `children` as
 * foreground content above the lanes. Clean-room original — not a neon
 * comet/laser effect.
 */
export function QueuePulseLanes({
  lanes,
  contentPlacement = "none",
  safeAreaPadding,
  safeAreaStrength,
  showLabels = true,
  hideLabelsNearContent = true,
  safeArea,
  density = 1,
  intensity = 1,
  speed = 1,
  interactive = false,
  pauseWhenHidden = true,
  seed = 1,
  reducedMotion,
  className,
  style,
  children,
  ...props
}: QueuePulseLanesProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `mk-qpl-${uid}`;
  const bgRef = React.useRef<HTMLDivElement | null>(null);

  const systemReduced = useReducedMotion();
  const staticMode = reducedMotion === true;
  const onScreen = useVisibilityPause(bgRef, { threshold: 0.01 });
  const paused = pauseWhenHidden && !onScreen;

  // Container shape drives the viewBox so the wide board never crops to a sliver.
  // Seeded with a desktop-shaped default so SSR === first client paint; the
  // ResizeObserver re-flows the layout to the real width/aspect after mount.
  const [env, setEnv] = React.useState<{ aspect: number; narrow: boolean }>({
    aspect: DEFAULT_ASPECT,
    narrow: false,
  });
  React.useEffect(() => {
    const el = bgRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const aspect = Math.round(clamp(w / h, 0.42, 3.4) * 20) / 20; // 0.05 buckets → low churn
      const narrow = w < NARROW_W;
      setEnv((prev) =>
        prev.narrow === narrow && Math.abs(prev.aspect - aspect) < 0.001 ? prev : { aspect, narrow },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const vw = round1(VH * env.aspect);

  // Composition: a content-placement preset that drives a frosted-glass scrim
  // behind the copy (readability comes from blur, not from carving the field
  // away) + hides labels there. Legacy `safeArea` (no placement) keeps the gentle
  // elliptical thinning for backward compatibility.
  const comp = React.useMemo(
    () => resolveComposition({ contentPlacement, safeArea, safeAreaPadding, safeAreaStrength }),
    [contentPlacement, safeArea, safeAreaPadding, safeAreaStrength],
  );

  const board = React.useMemo(() => {
    const laneCount = lanes && lanes.length ? lanes.length : defaultLanes().length;
    return computeBoard(env.narrow, vw, VH, laneCount);
  }, [env.narrow, vw, lanes]);

  const model = React.useMemo(() => {
    const src = lanes && lanes.length ? lanes : defaultLanes();
    return buildLanes(src, seed, density, speed, board);
  }, [lanes, seed, density, speed, board]);

  // Aggregate readouts for the glassy metric chips — honest sums of the source
  // data (not fabricated), so they stay truthful for any consumer's lanes.
  const metrics = React.useMemo(
    () => computeMetrics(lanes && lanes.length ? lanes : defaultLanes()),
    [lanes],
  );

  const motes = React.useMemo(() => buildMotes(seed), [seed]);
  const fall = React.useMemo(() => contentFalloff(comp), [comp]);

  // Pointer highlight — writes CSS vars only (no per-frame React re-render).
  React.useEffect(() => {
    const el = bgRef.current;
    if (!el || !interactive || staticMode) return;
    let raf = 0;
    let ny = VH / 2;
    const apply = () => {
      raf = 0;
      el.style.setProperty("--qpl-cy", String(round1(ny)));
      el.style.setProperty("--qpl-cursor", "1");
    };
    const onMove = (e: PointerEvent) => {
      if (systemReduced) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      ny = ((e.clientY - r.top) / r.height) * VH;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => el.style.setProperty("--qpl-cursor", "0");
    const host = el.parentElement ?? el;
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [interactive, staticMode, systemReduced]);

  const scrimStyle = comp.hasSafe ? compositionScrimStyle(comp) : undefined;
  const legacySafe = safeArea ?? { x: 0.04, y: 0.12, w: 0.5, h: 0.76 };
  const sa = {
    cx: (legacySafe.x + legacySafe.w / 2) * vw,
    cy: (legacySafe.y + legacySafe.h / 2) * VH,
    rx: (legacySafe.w / 2) * vw * 1.14,
    ry: (legacySafe.h / 2) * VH * 1.14,
  };
  const azure = "var(--color-accent)";
  const cyan = "var(--color-secondary-accent, var(--color-info))";
  const warn = "var(--color-warning)";
  const err = "var(--color-error)";
  const good = "var(--color-success)";
  const bg = "var(--color-bg-elevated, var(--color-bg))";
  const track = `color-mix(in oklab, var(--color-fg) ${round1(clamp(12 * intensity, 6, 20))}%, transparent)`;
  const line = `color-mix(in oklab, var(--color-fg) ${round1(clamp(18 * intensity, 8, 28))}%, transparent)`;
  // Focal point of the baked spotlight (opposite the copy) in 0–1 field coords.
  const focal = comp.hasSafe
    ? comp.focal
    : { x: (board.x0 + board.x1) / 2 / vw, y: (board.top + board.bottom) / 2 / VH };
  const glow = clamp(intensity, 0, 1.4);
  const laneGlow = (s: LaneStatus) =>
    s === "blocked" ? err : s === "delayed" ? warn : s === "settling" ? cyan : azure;

  const pulseColor = (s: LaneStatus) =>
    s === "delayed" ? warn : s === "settling" ? cyan : azure;
  const pulseOpacity = (s: LaneStatus) =>
    round1(clamp((s === "settling" ? 0.5 : 0.82) * intensity, 0.2, 1));

  // The copy occupies one horizontal side; anchor lane-head chips + metric chips
  // on the OPEN side (opposite the focal copy) so labels never sit under text.
  const openRight = comp.hasSafe && comp.focal.x >= 0.55;
  // Rough logical text width — SSR-stable (no DOM measurement during render).
  const estText = (t: string, fs: number) => t.length * fs * 0.56;
  // A chip only shows where it lands CLEARLY outside the copy's frosted-glass
  // scrim, so a text badge never sits half-blurred. The falloff rect alone isn't
  // enough — the scrim's backdrop-blur feathers past it — so this mirrors the
  // scrim ellipse (compositionScrimStyle) and keeps the chip past its clear edge.
  const chipClear = (cx: number, cy: number) => {
    if (!comp.hasSafe || !hideLabelsNearContent) return true;
    const p = comp.placement;
    const midX = comp.safe.x + comp.safe.w / 2;
    const midY = comp.safe.y + comp.safe.h / 2;
    const fx = p === "left" ? 0.24 : p === "right" ? 0.76 : midX;
    const fy = p === "top" ? 0.3 : p === "bottom" ? 0.7 : midY;
    const vert = p === "top" || p === "bottom";
    const rw = (vert ? 82 : 40) / 100 + 0.04; // feather horizontal radius
    const rh = (vert ? 52 : 86) / 100 + 0.08; // feather vertical radius
    const ex = (cx / vw - fx) / rw;
    const ey = (cy / VH - fy) / rh;
    return Math.hypot(ex, ey) >= 0.8; // past the feather's transparent stop (~0.84)
  };
  const chipVisible = (cx: number, cy: number) => showLabels && chipClear(cx, cy);

  const css = `
.${cls} { position: absolute; inset: 0; }
.${cls} svg { width: 100%; height: 100%; display: block; }
.${cls} .mk-qpl-pulse {
  transform: translateX(0);
  will-change: transform, opacity;
}
.${cls}.mk-qpl-animated .mk-qpl-pulse {
  animation: ${cls}-run var(--dur, 6s) linear infinite;
  animation-delay: var(--delay, 0s);
}
.${cls}.mk-qpl-animated .mk-qpl-lane[data-delayed="true"] .mk-qpl-pulse {
  stroke-dasharray: 4 5;
}
@keyframes ${cls}-run {
  0% { transform: translateX(0); opacity: 0; }
  8% { opacity: var(--po, 0.8); }
  90% { opacity: var(--po, 0.8); }
  100% { transform: translateX(var(--travel, ${DEFAULT_TRAVEL}px)); opacity: 0; }
}
.${cls} .mk-qpl-mote { will-change: opacity; }
.${cls}.mk-qpl-animated .mk-qpl-mote {
  animation: ${cls}-tw var(--tw, 5s) ease-in-out var(--twd, 0s) infinite;
}
@keyframes ${cls}-tw {
  0%, 100% { opacity: 0.28; }
  50% { opacity: 1; }
}
.${cls}[data-paused="true"] .mk-qpl-pulse,
.${cls}[data-paused="true"] .mk-qpl-mote { animation-play-state: paused !important; }
${interactive ? `.${cls} .mk-qpl-cursor {
  transform: translateY(calc((var(--qpl-cy, ${VH / 2}) - ${VH / 2}) * 1px));
  opacity: calc(var(--qpl-cursor, 0) * ${round1(0.5 * intensity)});
}` : ""}
.${cls} .mk-qpl-chip text, .${cls} .mk-qpl-metric text { paint-order: stroke; }
@media (prefers-reduced-motion: reduce) {
  .${cls} .mk-qpl-pulse { animation: none !important; display: none !important; }
  .${cls} .mk-qpl-mote { animation: none !important; opacity: 0.6; }
}
/* Forced-colors: drop gradients/masks and fall back to plain CanvasText strokes
   so lane structure + status stay legible. */
@media (forced-colors: active) {
  .${cls} .mk-qpl-wash, .${cls} .mk-qpl-light, .${cls} .mk-qpl-mote,
  .${cls} .mk-qpl-laneglow, .${cls} .mk-qpl-history, .${cls} .mk-qpl-cursor,
  .${cls} .mk-qpl-pulse, .${cls} .mk-qpl-chipglow, .${cls} .mk-qpl-metricglow { display: none; }
  .${cls} svg { forced-color-adjust: none; }
  .${cls} .mk-qpl-track { stroke: CanvasText !important; stroke-opacity: 0.5 !important; }
  .${cls} .mk-qpl-fill { fill: CanvasText !important; fill-opacity: 0.4 !important; }
  .${cls} .mk-qpl-stop, .${cls} .mk-qpl-glyph { stroke: CanvasText !important; fill: Canvas !important; }
  .${cls} .mk-qpl-chipbg, .${cls} .mk-qpl-metricbg { fill: Canvas !important; stroke: CanvasText !important; }
  .${cls} .mk-qpl-chip text, .${cls} .mk-qpl-metric text { fill: CanvasText !important; }
  .${cls} .mk-qpl-chipdot, .${cls} .mk-qpl-metricdot { fill: CanvasText !important; }
}`.trim();

  return (
    <div className={cn("relative isolate overflow-hidden", className)} style={style} {...props}>
      <div
        ref={bgRef}
        aria-hidden="true"
        data-paused={paused ? "true" : "false"}
        className={cn(
          "pointer-events-none absolute inset-0 overflow-hidden",
          cls,
          !staticMode && "mk-qpl-animated",
        )}
      >
        <svg viewBox={`0 0 ${vw} ${VH}`} preserveAspectRatio="xMidYMid slice" role="presentation">
          <defs>
            {/* Baked stage lighting — a cool spotlight over the lane side so the
                field reads as a lit premium stage (token-driven → right in both
                themes), not a flat black box. */}
            <radialGradient id={`qspot-${uid}`} cx={`${round1(focal.x * 100)}%`} cy={`${round1(clamp(focal.y - 0.06, 0, 1) * 100)}%`} r="82%">
              <stop offset="0%" stopColor={azure} stopOpacity={round1(0.2 * glow)} />
              <stop offset="34%" stopColor={cyan} stopOpacity={round1(0.08 * glow)} />
              <stop offset="72%" stopColor={azure} stopOpacity={round1(0.02 * glow)} />
              <stop offset="100%" stopColor={azure} stopOpacity="0" />
            </radialGradient>
            {/* Soft floor lift from the base edge. */}
            <linearGradient id={`qfloor-${uid}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={azure} stopOpacity={round1(0.07 * glow)} />
              <stop offset="46%" stopColor={azure} stopOpacity="0" />
            </linearGradient>
            {/* Corner vignette — settles the edges toward the surface. */}
            <radialGradient id={`qvig-${uid}`} cx="50%" cy="48%" r="72%">
              <stop offset="52%" stopColor={bg} stopOpacity="0" />
              <stop offset="100%" stopColor={bg} stopOpacity={round1(0.5 * clamp(glow + 0.2, 0.4, 1.2))} />
            </radialGradient>
            {/* Under-glow blur for each lane so tracks feel lit, not drawn. */}
            <filter id={`qglow-${uid}`} x="-6%" y="-160%" width="112%" height="420%">
              <feGaussianBlur stdDeviation="13" />
            </filter>
            <radialGradient id={`qsafegrad-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgb(20,20,20)" />
              <stop offset="62%" stopColor="rgb(122,122,122)" />
              <stop offset="100%" stopColor="#fff" />
            </radialGradient>
            <mask id={`qsafe-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width={vw} height={VH}>
              <rect x="0" y="0" width={vw} height={VH} fill="#fff" />
              <ellipse cx={round1(sa.cx)} cy={round1(sa.cy)} rx={round1(sa.rx)} ry={round1(sa.ry)} fill={`url(#qsafegrad-${uid})`} />
            </mask>
          </defs>

          {/* Lighting stack — spotlight + floor lift + vignette. */}
          <rect className="mk-qpl-light" x="0" y="0" width={vw} height={VH} fill={`url(#qspot-${uid})`} />
          <rect className="mk-qpl-light" x="0" y="0" width={vw} height={VH} fill={`url(#qfloor-${uid})`} />
          <rect className="mk-qpl-light" x="0" y="0" width={vw} height={VH} fill={`url(#qvig-${uid})`} />

          {/* Ambient signal motes — fill the whole field so no corner reads as
              dead. They run full-bleed under the copy too (softened, not removed):
              a high floor keeps them faintly alive behind the frosted scrim. */}
          <g className="mk-qpl-motes">
            {motes.map((m, k) => {
              const cx = round1(m.x * vw);
              const cy = round1(m.y * VH);
              // Soft floor (~0.6) so motes behind the copy stay visible through the
              // glass instead of blinking out at a hard edge.
              const d = 0.6 + 0.4 * fall(m.x, m.y);
              return (
                <circle
                  key={k}
                  className="mk-qpl-mote"
                  cx={cx}
                  cy={cy}
                  r={m.r}
                  fill={m.warm ? azure : cyan}
                  fillOpacity={round1(clamp((m.warm ? 0.22 : 0.28) * glow * d, 0.04, 0.5))}
                  style={{ "--tw": `${m.dur}s`, "--twd": `${m.delay}s` } as React.CSSProperties}
                />
              );
            })}
          </g>

          {interactive ? (
            <rect
              className="mk-qpl-cursor"
              x={round1(board.x0 - 6)}
              y={round1((board.top + board.bottom) / 2 - clamp((board.bottom - board.top) / Math.max(1, model.length), 20, 90) / 2)}
              width={round1(board.travel + 12)}
              height={round1(clamp((board.bottom - board.top) / Math.max(1, model.length), 20, 90))}
              rx={14}
              fill={azure}
              fillOpacity={0.14}
            />
          ) : null}

          <g mask={comp.hasSafe ? undefined : `url(#qsafe-${uid})`} style={{ "--travel": `${board.travel}px` } as React.CSSProperties}>
            {model.map((lane, i) => {
              const y = round1(lane.cy - lane.h / 2);
              const col = pulseColor(lane.status);
              const glyph = round1(clamp(lane.h * 0.3, 9, 16));
              return (
                <g
                  key={lane.id}
                  className="mk-qpl-lane"
                  data-i={i}
                  data-status={lane.status}
                  data-delayed={lane.delayed ? "true" : "false"}
                  data-blocked={lane.blocked ? "true" : "false"}
                >
                  {/* Tinted under-glow — a soft status-colored halo so the lane
                      reads as a lit, weighty track rather than a thin drawn bar. */}
                  <rect
                    className="mk-qpl-laneglow"
                    x={round1(board.x0 - lane.h * 0.4)}
                    y={round1(lane.cy - lane.h * 0.85)}
                    width={round1(board.travel + lane.h * 0.8)}
                    height={round1(lane.h * 1.7)}
                    rx={round1(lane.h * 0.85)}
                    fill={laneGlow(lane.status)}
                    fillOpacity={round1(clamp(0.12 * glow, 0.05, 0.2))}
                    filter={`url(#qglow-${uid})`}
                  />

                  {/* Capacity track — a subtle rounded rail (dashed when delayed). */}
                  <rect
                    className="mk-qpl-track"
                    x={board.x0}
                    y={y}
                    width={board.travel}
                    height={lane.h}
                    rx={round1(lane.h / 2)}
                    fill={track}
                    stroke={line}
                    strokeWidth={1}
                    strokeOpacity={0.7}
                    strokeDasharray={lane.delayed ? "7 6" : undefined}
                  />

                  {/* Completed work settled into a faint tail history band. */}
                  {lane.historyW > 2 ? (
                    <rect
                      className="mk-qpl-history"
                      x={round1(board.x1 - lane.historyW)}
                      y={y}
                      width={lane.historyW}
                      height={lane.h}
                      rx={round1(lane.h / 2)}
                      fill={cyan}
                      fillOpacity={round1(clamp(0.12 * intensity, 0.05, 0.24))}
                    />
                  ) : null}

                  {/* Occupancy fill — the static snapshot marker (reduced-motion safe). */}
                  <rect
                    className="mk-qpl-fill"
                    x={board.x0}
                    y={y}
                    width={lane.blocked ? lane.fillW : round1(clamp(lane.occ * board.travel * 0.62 + 24, 24, board.travel))}
                    height={lane.h}
                    rx={round1(lane.h / 2)}
                    fill={lane.status === "delayed" ? warn : lane.status === "settling" ? cyan : col}
                    fillOpacity={round1(clamp((lane.blocked ? 0.16 : 0.13) * intensity, 0.05, 0.28))}
                  />

                  {/* Flowing pulses — omitted in the static snapshot; CSS also
                      hides them under a system reduced-motion preference. */}
                  {!staticMode && lane.pulses.map((p, k) => (
                    <rect
                      key={k}
                      className="mk-qpl-pulse"
                      x={p.x}
                      y={p.y}
                      width={p.w}
                      height={p.h}
                      rx={round1(p.h / 2)}
                      fill={col}
                      style={{
                        "--dur": `${p.dur}s`,
                        "--delay": `${p.delay}s`,
                        "--po": String(pulseOpacity(lane.status)),
                      } as React.CSSProperties}
                    />
                  ))}

                  {/* Blocked: a non-color stop cap (bar) + square glyph — legible in mono. */}
                  {lane.blocked ? (
                    <g className="mk-qpl-stop">
                      <rect
                        x={round1(board.x0 + lane.fillW)}
                        y={round1(lane.cy - lane.h * 0.72)}
                        width={round1(clamp(lane.h * 0.14, 4, 8))}
                        height={round1(lane.h * 1.44)}
                        rx={1.5}
                        fill={err}
                        fillOpacity={round1(clamp(0.85 * intensity, 0.4, 1))}
                      />
                      <rect
                        className="mk-qpl-glyph"
                        x={round1(board.x0 + lane.fillW + clamp(lane.h * 0.3, 9, 16))}
                        y={round1(lane.cy - glyph / 2)}
                        width={glyph}
                        height={glyph}
                        rx={2}
                        fill="var(--color-surface)"
                        stroke={err}
                        strokeWidth={1.6}
                        strokeOpacity={round1(clamp(0.9 * intensity, 0.5, 1))}
                      />
                    </g>
                  ) : null}

                  {/* Delayed: a small clock-tick glyph at the head (non-color cue). */}
                  {lane.delayed && !lane.blocked ? (
                    <g className="mk-qpl-glyph">
                      <circle cx={round1(board.x0 + 12)} cy={lane.cy} r={round1(clamp(lane.h * 0.16, 5, 8))} fill="none" stroke={warn} strokeWidth={1.5} strokeOpacity={0.9} />
                      <path d={`M ${round1(board.x0 + 12)} ${round1(lane.cy - 2.6)} L ${round1(board.x0 + 12)} ${lane.cy} L ${round1(board.x0 + 15)} ${round1(lane.cy + 1.6)}`} fill="none" stroke={warn} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  ) : null}

                  {/* Lane-head chip — a glassy, state-tinted badge naming the lane
                      and its short status, anchored on the OPEN side (opposite the
                      copy) so it always lands in readable space. Dropped when it
                      would fall inside the content region. */}
                  {(() => {
                    const name = lane.label ?? lane.id;
                    const stat = lane.stat;
                    const fName = round1(clamp(lane.h * 0.32, 15, 21));
                    const fStat = round1(fName * 0.86);
                    const dotR = round1(fName * 0.24);
                    const padX = round1(fName * 0.72);
                    const gapDot = round1(fName * 0.55);
                    const gapStat = round1(fName * 0.62);
                    const nameW = estText(name, fName);
                    const statW = estText(stat, fStat) + round1(fStat * 1.4); // + "· "
                    const chipW = round1(padX * 2 + dotR * 2 + gapDot + nameW + gapStat + statW);
                    const chipH = round1(clamp(fName * 1.95, 30, 46));
                    const tint = laneGlow(lane.status);
                    const chipX = openRight ? round1(board.x1 - chipW - 6) : round1(board.x0 + 6);
                    const chipY = round1(lane.cy - chipH / 2);
                    const chipCx = chipX + chipW / 2;
                    if (!chipVisible(chipCx, lane.cy)) return null;
                    const tName = round1(chipX + padX + dotR * 2 + gapDot);
                    return (
                      <g className="mk-qpl-chip">
                        <rect
                          className="mk-qpl-chipglow"
                          x={round1(chipX - 3)}
                          y={round1(chipY - 1)}
                          width={round1(chipW + 6)}
                          height={round1(chipH + 6)}
                          rx={round1((chipH + 6) / 2)}
                          fill={tint}
                          fillOpacity={round1(clamp(0.18 * glow, 0.08, 0.3))}
                          filter={`url(#qglow-${uid})`}
                        />
                        <rect
                          className="mk-qpl-chipbg"
                          x={chipX}
                          y={chipY}
                          width={chipW}
                          height={chipH}
                          rx={round1(chipH / 2)}
                          fill="var(--color-surface)"
                          fillOpacity={round1(clamp(0.9 * intensity, 0.6, 0.96))}
                          stroke={tint}
                          strokeOpacity={round1(clamp(0.6 * intensity, 0.35, 0.9))}
                          strokeWidth={1.2}
                        />
                        <circle
                          className="mk-qpl-chipdot"
                          cx={round1(chipX + padX + dotR)}
                          cy={round1(lane.cy)}
                          r={dotR}
                          fill={tint}
                        />
                        <text
                          x={tName}
                          y={round1(lane.cy)}
                          dominantBaseline="central"
                          fontSize={fName}
                          style={{ fontFamily: "inherit", fontWeight: 600 }}
                        >
                          <tspan fill="var(--color-fg)">{name}</tspan>
                          <tspan
                            dx={gapStat}
                            fontSize={fStat}
                            fill={tint}
                          >{`· ${stat}`}</tspan>
                        </text>
                      </g>
                    );
                  })()}
                </g>
              );
            })}
          </g>

          {/* Live-metric chips — a few glassy stat pills (throughput / queued / in
              flight) for a real queue-dashboard feel. Honest aggregates of the lane
              data; anchored in the open margins and dropped over the copy. */}
          {(() => {
            const slots: Array<{ key: string; big: string; unit: string; x: number; y: number; dot: string }> = [
              { key: "tp", big: `${metrics.throughput}`, unit: "jobs / min", x: openRight ? 0.72 : 0.28, y: 0.05, dot: good },
              { key: "q", big: `${metrics.queued}`, unit: "queued", x: openRight ? 0.72 : 0.28, y: 0.95, dot: azure },
              { key: "a", big: `${metrics.active}`, unit: "in flight", x: 0.5, y: 0.05, dot: cyan },
            ];
            const fBig = round1(clamp(VH * 0.03, 17, 24));
            const fUnit = round1(fBig * 0.66);
            return slots.map((m) => {
              const dotR = round1(fBig * 0.22);
              const padX = round1(fBig * 0.7);
              const gap = round1(fBig * 0.42);
              const bigW = estText(m.big, fBig);
              const unitW = estText(m.unit, fUnit);
              const w = round1(padX * 2 + dotR * 2 + gap + bigW + gap + unitW);
              const h = round1(fBig * 1.7);
              const cx = m.x * vw;
              const cy = round1(m.y * VH);
              const bx = round1(clamp(cx - w / 2, 6, vw - 6 - w));
              const by = round1(cy - h / 2);
              if (!chipVisible(round1(bx + w / 2), cy)) return null;
              const tBig = round1(bx + padX + dotR * 2 + gap);
              return (
                <g className="mk-qpl-metric" key={m.key}>
                  <rect
                    className="mk-qpl-metricglow"
                    x={round1(bx - 3)}
                    y={round1(by - 1)}
                    width={round1(w + 6)}
                    height={round1(h + 6)}
                    rx={round1((h + 6) / 2)}
                    fill={m.dot}
                    fillOpacity={round1(clamp(0.16 * glow, 0.07, 0.28))}
                    filter={`url(#qglow-${uid})`}
                  />
                  <rect
                    className="mk-qpl-metricbg"
                    x={bx}
                    y={by}
                    width={w}
                    height={h}
                    rx={round1(h / 2)}
                    fill="var(--color-surface)"
                    fillOpacity={round1(clamp(0.9 * intensity, 0.6, 0.96))}
                    stroke={line}
                    strokeWidth={1}
                  />
                  <circle className="mk-qpl-metricdot" cx={round1(bx + padX + dotR)} cy={cy} r={dotR} fill={m.dot} />
                  <text
                    x={tBig}
                    y={cy}
                    dominantBaseline="central"
                    fontSize={fBig}
                    style={{ fontFamily: "inherit" }}
                  >
                    <tspan fill="var(--color-fg)" style={{ fontWeight: 700 }}>{m.big}</tspan>
                    <tspan dx={gap} fontSize={fUnit} fill="var(--color-muted)" style={{ fontWeight: 500 }}>{m.unit}</tspan>
                  </text>
                </g>
              );
            });
          })()}
        </svg>

        <style dangerouslySetInnerHTML={{ __html: css }} />
      </div>

      {children != null ? (
        <>
          {/* Glass scrim behind the copy: a soft wash + feathered backdrop blur so
              the text stays readable while the full-bleed lanes keep flowing
              underneath — no hard cut, no emptied content side. */}
          {scrimStyle ? (
            <div aria-hidden className="pointer-events-none absolute inset-0 z-0" style={scrimStyle} />
          ) : null}
          <div className="relative z-10">{children}</div>
        </>
      ) : null}
    </div>
  );
}

export default QueuePulseLanes;
