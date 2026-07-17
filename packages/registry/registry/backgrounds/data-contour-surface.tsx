"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useVisibilityPause,
  resolveComposition,
  compositionScrimStyle,
  contentFalloff,
  labelHiddenAt,
  type ContentPlacement,
  type ResolvedComposition,
} from "@/lib/motionstack";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface ContourPoint {
  /** 0–1 horizontal position of the pressure point. */
  x: number;
  /** 0–1 vertical position of the pressure point. */
  y: number;
  /** Signed magnitude — positive raises the field, negative lowers it. */
  value: number;
  /** Falloff radius in field space (0–1). Wider = broader influence. Default 0.2. */
  radius?: number;
}

export interface ContourRegion {
  /** 0–1 left edge. */
  x: number;
  /** 0–1 top edge. */
  y: number;
  /** 0–1 width. */
  w: number;
  /** 0–1 height. */
  h: number;
}

export interface DataContourSurfaceProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Focal pressure points that define the scalar field. Omit for deterministic sample data. */
  points?: ContourPoint[];
  /** Field values that get emphasized iso-lines (heavier weight, never color alone). */
  thresholds?: number[];
  /** Region brightened above the rest — the reading in focus. */
  activeRegion?: ContourRegion;
  /** Regions rendered as ghosted, dashed overlays for comparison. */
  comparisonRegions?: ContourRegion[];
  /**
   * Where the foreground content sits. The contour field runs full-bleed on every
   * placement; a frosted-glass scrim behind the copy keeps text readable (via blur,
   * not a hard cut) while the field stays visible underneath. "none" = full-bleed,
   * no scrim.
   */
  contentPlacement?: ContentPlacement;
  /** Extra ramp width (0–1) over which the field returns to full strength past the content. */
  safeAreaPadding?: number;
  /** How strongly the field softens (never below a visible floor) behind content (0–1). */
  safeAreaStrength?: number;
  /** Draw the region annotations (active-region ticks, comparison frames). Default true. */
  showLabels?: boolean;
  /** Drop region annotations that fall inside/near the readable region. Default true. */
  hideLabelsNearContent?: boolean;
  /** Region where contours thin so foreground text stays readable (0–1 coords). */
  safeArea?: ContourRegion;
  /** Grid-resolution multiplier (~0.4–1.6); capped and coarsened on small containers. */
  density?: number;
  /** Overall luminance/opacity of the field (0–1.4). */
  intensity?: number;
  /** Drift speed multiplier. 0 holds a still field (contours still legible). */
  speed?: number;
  /** Pointer nudges the field toward the cursor (never the sole effect). */
  interactive?: boolean;
  /** Pause drift + transitions when scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
  /** Deterministic seed reserved for future generated data (SSR-stable). */
  seed?: number;
  /** Force the static, motion-free variant regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Pure field maths (deterministic — no browser globals, no randomness)       */
/* -------------------------------------------------------------------------- */

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const TAU = Math.PI * 2;

/** mulberry32 — deterministic scatter with no Math.random / Date.now (SSR-stable). */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Add an alpha channel to a resolved token color (hex or rgb/rgba) for gradients. */
function withAlpha(color: string, a: number): string {
  const v = Math.max(0, Math.min(1, a));
  const c = color.trim();
  if (c.startsWith("#")) {
    let h = c.slice(1);
    if (h.length === 3) h = h.split("").map((d) => d + d).join("");
    const n = parseInt(h.slice(0, 6), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${v})`;
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).slice(0, 3);
    if (parts.length === 3) return `rgba(${parts.join(", ")}, ${v})`;
  }
  return c;
}

/**
 * Signed scalar field at (x, y) — the sum of every point's Gaussian influence.
 * Positive `value` raises the field, negative lowers it, so contours literally
 * encode the supplied data. Pure and deterministic: identical inputs always
 * return the identical output, which is what makes the server render and the
 * reduced-motion frame reproducible.
 */
export function sampleField(points: ReadonlyArray<ContourPoint>, x: number, y: number): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const r = p.radius && p.radius > 0 ? p.radius : 0.2;
    const dx = x - p.x;
    const dy = y - p.y;
    sum += p.value * Math.exp(-(dx * dx + dy * dy) / (2 * r * r));
  }
  return sum;
}

/** Sample the field onto a (cols+1)×(rows+1) node grid in row-major order. */
function buildGrid(points: ReadonlyArray<ContourPoint>, cols: number, rows: number): Float64Array {
  const g = new Float64Array((cols + 1) * (rows + 1));
  let i = 0;
  for (let iy = 0; iy <= rows; iy++) {
    const y = iy / rows;
    for (let ix = 0; ix <= cols; ix++) {
      g[i++] = sampleField(points, ix / cols, y);
    }
  }
  return g;
}

interface Level {
  v: number;
  /** Emphasized threshold — heavier stroke so it reads without relying on color. */
  emph: boolean;
}

/** Auto iso-levels spread across the field range plus the emphasized thresholds. */
function computeLevels(grid: Float64Array, thresholds: ReadonlyArray<number>): { levels: Level[]; span: number } {
  let mn = Infinity;
  let mx = -Infinity;
  for (let i = 0; i < grid.length; i++) {
    const v = grid[i];
    if (v < mn) mn = v;
    if (v > mx) mx = v;
  }
  const span = mx - mn || 1;
  const levels: Level[] = [];
  const count = 8;
  for (let k = 1; k <= count; k++) levels.push({ v: mn + span * (k / (count + 1)), emph: false });
  for (const t of thresholds) levels.push({ v: t, emph: true });
  levels.sort((a, b) => a.v - b.v);
  return { levels, span };
}

/**
 * Marching squares over the node grid: emits contour line segments (flat
 * x0,y0,x1,y1 in 0–1 space) where the field crosses `level`. Saddle cells are
 * disambiguated by the cell-center average so lines never cross.
 */
function marchingSquares(grid: Float64Array, cols: number, rows: number, level: number, out: number[]): void {
  const at = (ix: number, iy: number) => grid[iy * (cols + 1) + ix];
  const lx = (a: number, b: number, va: number, vb: number) => {
    const d = vb - va;
    return d === 0 ? a : a + (b - a) * ((level - va) / d);
  };
  for (let iy = 0; iy < rows; iy++) {
    for (let ix = 0; ix < cols; ix++) {
      const tl = at(ix, iy);
      const tr = at(ix + 1, iy);
      const br = at(ix + 1, iy + 1);
      const bl = at(ix, iy + 1);
      const x0 = ix / cols;
      const x1 = (ix + 1) / cols;
      const y0 = iy / rows;
      const y1 = (iy + 1) / rows;
      const at0 = tl > level;
      const at1 = tr > level;
      const at2 = br > level;
      const at3 = bl > level;
      const pts: number[] = [];
      let count = 0;
      if (at0 !== at1) { pts.push(lx(x0, x1, tl, tr), y0); count++; } // top
      if (at1 !== at2) { pts.push(x1, lx(y0, y1, tr, br)); count++; } // right
      if (at2 !== at3) { pts.push(lx(x0, x1, bl, br), y1); count++; } // bottom
      if (at0 !== at3) { pts.push(x0, lx(y0, y1, tl, bl)); count++; } // left
      if (count === 2) {
        out.push(pts[0], pts[1], pts[2], pts[3]);
      } else if (count === 4) {
        const center = (tl + tr + br + bl) / 4 > level;
        if (center) out.push(pts[0], pts[1], pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]);
        else out.push(pts[0], pts[1], pts[6], pts[7], pts[2], pts[3], pts[4], pts[5]);
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Deterministic sample data (clearly fictional operational-metrics field)    */
/* -------------------------------------------------------------------------- */

const DEFAULT_POINTS: ContourPoint[] = [
  { x: 0.64, y: 0.36, value: 1.0, radius: 0.22 },
  { x: 0.83, y: 0.58, value: 0.62, radius: 0.18 },
  { x: 0.5, y: 0.67, value: -0.55, radius: 0.2 },
  { x: 0.73, y: 0.8, value: 0.42, radius: 0.16 },
  { x: 0.34, y: 0.5, value: -0.4, radius: 0.22 },
  { x: 0.22, y: 0.3, value: 0.34, radius: 0.18 },
];
const DEFAULT_THRESHOLDS = [-0.35, 0.35, 0.7];
const DEFAULT_ACTIVE: ContourRegion = { x: 0.54, y: 0.22, w: 0.36, h: 0.44 };
const DEFAULT_COMPARISON: ContourRegion[] = [{ x: 0.28, y: 0.44, w: 0.28, h: 0.32 }];
const DEFAULT_SAFE: ContourRegion = { x: 0.04, y: 0.12, w: 0.46, h: 0.74 };

/* -------------------------------------------------------------------------- */
/* Colour resolution — reads tokens off the live element, never during render  */
/* -------------------------------------------------------------------------- */

interface Palette {
  accent: string;
  secondary: string;
  fg: string;
  muted: string;
  surface: string;
  border: string;
  /** Elevated background — used only to bake the corner vignette (adds depth). */
  bg: string;
}

function resolvePalette(el: Element): Palette {
  const cs = getComputedStyle(el);
  const g = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb;
  const secondary = g("--color-secondary-accent", g("--color-info", "#37b6ff"));
  const surface = g("--color-surface", "#ffffff");
  return {
    accent: g("--color-accent", "#6d5efc"),
    secondary,
    fg: g("--color-fg", "#0b0b12"),
    muted: g("--color-muted", "#8a8a99"),
    surface,
    border: g("--color-border", "#e5e5ee"),
    bg: g("--color-bg-elevated", g("--color-bg", surface)),
  };
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

interface Dims {
  w: number;
  h: number;
  cols: number;
  rows: number;
  dpr: number;
}

interface LiveProps {
  points: ContourPoint[];
  thresholds: number[];
  activeRegion?: ContourRegion;
  comparisonRegions: ContourRegion[];
  safeArea?: ContourRegion;
  density: number;
  intensity: number;
  speed: number;
  /** Resolved content-placement composition — drives the mask + contour falloff. */
  comp: ResolvedComposition;
  showLabels: boolean;
  hideLabelsNearContent: boolean;
}

const inRect = (r: ContourRegion | undefined, x: number, y: number) =>
  !!r && x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;

/**
 * DataContourSurface — a data-driven contour background. A set of focal
 * `points` (each signed positive/negative) defines a scalar field via a pure
 * Gaussian sum; a single Canvas 2D layer renders that field as marching-squares
 * iso-lines. Emphasized `thresholds` get heavier bands (a non-color cue), an
 * `activeRegion` brightens, and `comparisonRegions` render as dashed ghosts.
 * When `points`/`thresholds` change the field EASES to the new shape over one
 * rAF-driven transition; a subtle drift rides on top. The first drawn frame and
 * the reduced-motion frame are a deterministic function of the data alone (no
 * randomness, no time at render), so server and client agree. One canvas, one
 * rAF loop, DPR-capped, ResizeObserver-driven, and fully paused offscreen.
 * The field runs full-bleed on every placement; a frosted-glass scrim behind the
 * copy keeps text readable (blur, not a hard cut) while the contours stay visible
 * underneath. Decorative: `children` render as foreground. Clean-room original —
 * not a topographic texture or a shader-uniform effect.
 */
export function DataContourSurface({
  points,
  thresholds,
  activeRegion,
  comparisonRegions,
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
}: DataContourSurfaceProps) {
  void seed; // reserved for future generated datasets; kept for API stability
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `mk-dcs-${uid}`;

  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const systemReduced = useReducedMotion();
  const staticMode = reducedMotion === true;
  const onScreen = useVisibilityPause(wrapRef, { threshold: 0.01 });
  const paused = pauseWhenHidden && !onScreen;

  // Resolve incoming data to concrete arrays once per render (fictional defaults).
  const resolvedPoints = points && points.length ? points : DEFAULT_POINTS;
  const resolvedThresholds = thresholds && thresholds.length ? thresholds : DEFAULT_THRESHOLDS;
  const resolvedActive = activeRegion ?? (points ? undefined : DEFAULT_ACTIVE);
  const resolvedComparison = comparisonRegions ?? (points ? [] : DEFAULT_COMPARISON);

  // Composition: a content-placement preset (or explicit safeArea) resolves the
  // readable region. The field runs full-bleed regardless; a glass scrim (below)
  // sits behind the copy, and contours softly floor there so they stay visible
  // through the blur instead of being masked away. With no placement and no
  // safeArea, fall back to the original left-side rect for the field's gentle dip.
  const comp = React.useMemo(
    () => resolveComposition({ contentPlacement, safeArea, safeAreaPadding, safeAreaStrength }),
    [contentPlacement, safeArea, safeAreaPadding, safeAreaStrength],
  );
  const scrimStyle = comp.hasSafe ? compositionScrimStyle(comp) : undefined;
  const legacySafe = comp.hasSafe ? comp.safe : DEFAULT_SAFE;

  // Latest props live in a ref so the rAF loop reads them without re-subscribing.
  const propsRef = React.useRef<LiveProps>({
    points: resolvedPoints,
    thresholds: resolvedThresholds,
    activeRegion: resolvedActive,
    comparisonRegions: resolvedComparison,
    safeArea: legacySafe,
    density,
    intensity,
    speed,
    comp,
    showLabels,
    hideLabelsNearContent,
  });
  propsRef.current = {
    points: resolvedPoints,
    thresholds: resolvedThresholds,
    activeRegion: resolvedActive,
    comparisonRegions: resolvedComparison,
    safeArea: legacySafe,
    density,
    intensity,
    speed,
    comp,
    showLabels,
    hideLabelsNearContent,
  };

  // Pointer offset (0 when not interactive) — nudges points toward the cursor.
  const pointerRef = React.useRef({ x: 0, y: 0, on: 0 });

  // Grid / transition state shared across frames.
  const dimsRef = React.useRef<Dims>({ w: 0, h: 0, cols: 24, rows: 16, dpr: 1 });
  const fromRef = React.useRef<Float64Array | null>(null);
  const toRef = React.useRef<Float64Array | null>(null);
  const dispRef = React.useRef<Float64Array | null>(null);
  const spatialRef = React.useRef<Float64Array | null>(null);
  const levelsRef = React.useRef<Level[]>([]);
  const spanRef = React.useRef(1);
  const transRef = React.useRef({ start: 0, dur: 600, active: false });

  const engineRef = React.useRef<{
    setData: (snap: boolean) => void;
    requestDraw: () => void;
    start: () => void;
    stop: () => void;
  } | null>(null);

  const staticRef = React.useRef(staticMode);
  staticRef.current = staticMode;
  const pausedRef = React.useRef(paused);
  pausedRef.current = paused;

  // Data signature — a change retargets the field (eased when animating, else snapped).
  const dataSig = React.useMemo(
    () => JSON.stringify([resolvedPoints, resolvedThresholds]),
    [resolvedPoints, resolvedThresholds],
  );

  /* ----------------------------- Engine setup ---------------------------- */
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    // jsdom (tests) and any headless context return null (or throw) here — bail cleanly.
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      ctx = null;
    }
    if (!ctx) return;

    let rafId = 0;
    let running = false;
    let startTime = 0;

    // Deterministic ambient motes that fill the whole field so no corner reads as
    // dead space (the composition falloff still quiets them behind the copy). Seed
    // is a fixed constant — no Math.random/Date.now, so the scatter is SSR-stable.
    const ambRng = makeRng(0x51ed7ac3);
    const ambient = Array.from({ length: 62 }, () => ({
      x: ambRng(),
      y: ambRng(),
      r: 0.5 + ambRng() * 1.3,
      ph: ambRng(),
      sp: 0.12 + ambRng() * 0.5,
      cool: ambRng() > 0.62,
    }));

    const effectivePoints = (): ContourPoint[] => {
      const p = propsRef.current;
      const ptr = pointerRef.current;
      if (!ptr.on) return p.points;
      // Interactive nudge: pull each point a little toward the cursor.
      return p.points.map((pt) => ({
        ...pt,
        x: pt.x + (ptr.x - pt.x) * 0.06 * ptr.on,
        y: pt.y + (ptr.y - pt.y) * 0.06 * ptr.on,
      }));
    };

    const measure = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
      const dsty = propsRef.current.density;
      // The field is full-bleed, so grid resolution follows the container size.
      const cols = clamp(Math.round((w / 26) * dsty), 12, 52);
      const rows = clamp(Math.round((h / 26) * dsty), 8, 30);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const prev = dimsRef.current;
      dimsRef.current = { w, h, cols, rows, dpr };
      const nodes = (cols + 1) * (rows + 1);
      if (!spatialRef.current || spatialRef.current.length !== nodes) {
        const sp = new Float64Array(nodes);
        let i = 0;
        for (let iy = 0; iy <= rows; iy++) {
          for (let ix = 0; ix <= cols; ix++) sp[i++] = Math.sin(ix * 0.9 + iy * 0.55) * Math.sin(iy * 0.75 - ix * 0.3);
        }
        spatialRef.current = sp;
        dispRef.current = new Float64Array(nodes);
      }
      return prev.cols !== cols || prev.rows !== rows;
    };

    // Retarget the field to the current data. `snap` jumps instantly (used for
    // the first frame, reduced motion, and while paused); otherwise it eases.
    const setData = (snap: boolean) => {
      const { cols, rows } = dimsRef.current;
      const next = buildGrid(effectivePoints(), cols, rows);
      const { levels, span } = computeLevels(next, propsRef.current.thresholds);
      levelsRef.current = levels;
      spanRef.current = span;
      const to = toRef.current;
      if (snap || !to || (dispRef.current && to.length !== next.length)) {
        fromRef.current = next;
        toRef.current = next;
        transRef.current.active = false;
      } else {
        // Freeze the currently displayed base as the transition's start.
        const from = fromRef.current ?? to;
        const trans = transRef.current;
        const t = trans.active ? clamp((performance.now() - trans.start) / trans.dur, 0, 1) : 1;
        const mix = t * t * (3 - 2 * t);
        const base = new Float64Array(to.length);
        for (let i = 0; i < base.length; i++) base[i] = from[i] + (to[i] - from[i]) * mix;
        fromRef.current = base;
        toRef.current = next;
        transRef.current = { start: performance.now(), dur: 600, active: true };
      }
    };

    const strokeContours = (
      grid: Float64Array,
      cols: number,
      rows: number,
      w: number,
      h: number,
      pal: Palette,
      p: LiveProps,
      opt: { boost: number; colorOverride?: string; alphaScale: number; dim?: (x: number, y: number) => number },
    ) => {
      // Full-bleed: field 0–1 maps straight to pixels, and a segment's midpoint in
      // field space is also its canvas-0–1 position, so the soft-floor `dim`
      // agrees with the copy's actual location.
      const dim = opt.dim;
      const segs: number[] = [];
      for (const lv of levelsRef.current) {
        segs.length = 0;
        marchingSquares(grid, cols, rows, lv.v, segs);
        if (!segs.length) continue;
        const col = opt.colorOverride ?? (lv.v >= 0 ? pal.accent : pal.secondary);
        ctx.lineWidth = lv.emph ? 2.4 : 1.2;
        ctx.strokeStyle = col;
        const baseA = ((lv.emph ? 0.64 : 0.34) * p.intensity + opt.boost) * opt.alphaScale;
        // Full-strength pass — segments away from the copy (dim ≈ 1) batch into one
        // path. With no composition (dim undefined) that's every segment.
        ctx.beginPath();
        let anyMain = false;
        for (let i = 0; i < segs.length; i += 4) {
          if (dim && dim((segs[i] + segs[i + 2]) / 2, (segs[i + 1] + segs[i + 3]) / 2) < 0.995) continue;
          ctx.moveTo(segs[i] * w, segs[i + 1] * h);
          ctx.lineTo(segs[i + 2] * w, segs[i + 3] * h);
          anyMain = true;
        }
        if (anyMain) {
          // Emphasized thresholds get a soft ridge glow beneath the crisp band so
          // they read as lit contours, not flat wires (a non-color depth cue too).
          if (lv.emph) {
            ctx.save();
            ctx.lineWidth = 6.5;
            ctx.globalAlpha = clamp(baseA * 0.3, 0, 1);
            ctx.stroke();
            ctx.restore();
          }
          ctx.globalAlpha = clamp(baseA, 0, 1);
          ctx.stroke();
        }
        // Behind-copy pass — segments in the readable region stay visible at a soft
        // floor (never masked away); the glass scrim blurs them for readability.
        // Per-segment because alpha varies across the ramp; the band is bounded so
        // cost stays low.
        if (dim) {
          for (let i = 0; i < segs.length; i += 4) {
            const d = dim((segs[i] + segs[i + 2]) / 2, (segs[i + 1] + segs[i + 3]) / 2);
            if (d >= 0.995) continue;
            ctx.globalAlpha = clamp(baseA * d, 0, 1);
            ctx.beginPath();
            ctx.moveTo(segs[i] * w, segs[i + 1] * h);
            ctx.lineTo(segs[i + 2] * w, segs[i + 3] * h);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    const draw = (elapsed: number): boolean => {
      const { w, h, cols, rows } = dimsRef.current;
      const p = propsRef.current;
      // Full-bleed: the field runs edge-to-edge, so 0–1 field coords map straight to
      // pixels and a field point's canvas-0–1 position is the point itself.
      const rectPx = (rr: ContourRegion) => ({
        x: rr.x * w,
        y: rr.y * h,
        w: rr.w * w,
        h: rr.h * h,
      });
      const from = fromRef.current;
      const to = toRef.current;
      const disp = dispRef.current;
      const spatial = spatialRef.current;
      if (!from || !to || !disp || !spatial) return false;
      const pal = resolvePalette(canvas);

      // Ease the transition, then add a drift that is exactly zero at elapsed 0
      // (so the first frame + the reduced-motion frame are pure data).
      const trans = transRef.current;
      let mix = 1;
      if (trans.active) {
        const t = clamp((performance.now() - trans.start) / trans.dur, 0, 1);
        mix = t * t * (3 - 2 * t);
        if (t >= 1) {
          trans.active = false;
          fromRef.current = to;
        }
      }
      const driftAmp = p.speed > 0 && !staticRef.current ? 0.05 * p.intensity * spanRef.current : 0;
      const phase = Math.sin(elapsed * 0.6 * p.speed);
      for (let i = 0; i < disp.length; i++) {
        disp[i] = from[i] + (to[i] - from[i]) * mix + driftAmp * spatial[i] * phase;
      }

      ctx.clearRect(0, 0, w, h);

      const glow = clamp(p.intensity, 0, 1.4);
      // Contour falloff behind the copy — built once, then shared by the lighting,
      // the field fills, the motes, and every contour pass so they all agree on
      // where the copy sits.
      const fall = p.comp.hasSafe ? contentFalloff(p.comp) : undefined;
      const safeR = p.safeArea;
      // Soft floor (~0.66): behind the copy the field softens but stays visible —
      // the glass scrim blurs it for readability — instead of fading to ~0, so the
      // landscape is full-bleed under centered copy and on mobile. `softDim` also
      // dips inside the legacy safe rect (the no-composition default); `fallDim` is
      // the composition-only version used inside the region overlays.
      const FLOOR = 0.66;
      const soft = (v: number) => FLOOR + (1 - FLOOR) * clamp(v, 0, 1);
      const fallDim = (cx: number, cy: number) => soft(fall ? fall(cx, cy) : 1);
      const softDim = (cx: number, cy: number) => {
        let d = fall ? fall(cx, cy) : 1;
        if (inRect(safeR, cx, cy)) d *= 0.62;
        return soft(d);
      };

      /* Baked stage lighting — a lit backdrop so the surface reads as premium
         wherever it lands (catalog, hero, or a customer install), not a flat plate.
         A cool spotlight sits over the data's focal side, a soft floor lift grounds
         the field, and a corner vignette adds depth. Token-driven → correct in
         both light and dark. */
      const focalFx = p.comp.placement === "right" ? 0.36 : 0.62;
      const fcx = focalFx * w;
      const fcy = 0.42 * h;
      const R = Math.hypot(w, h);
      const spot = ctx.createRadialGradient(fcx, fcy, 0, fcx, fcy, R * 0.66);
      spot.addColorStop(0, withAlpha(pal.accent, 0.2 * glow));
      spot.addColorStop(0.4, withAlpha(pal.secondary, 0.07 * glow));
      spot.addColorStop(1, "transparent");
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, w, h);
      const floor = ctx.createLinearGradient(0, h, 0, h * 0.5);
      floor.addColorStop(0, withAlpha(pal.accent, 0.06 * glow));
      floor.addColorStop(1, "transparent");
      ctx.fillStyle = floor;
      ctx.fillRect(0, 0, w, h);
      const vig = ctx.createRadialGradient(w / 2, h / 2, R * 0.34, w / 2, h / 2, R * 0.74);
      vig.addColorStop(0, "transparent");
      vig.addColorStop(1, withAlpha(pal.bg, 0.5));
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      /* Field-fill glows — each pressure point blooms in its own light (accent when
         it raises the field, cool when it lowers it) so the surface fills with the
         data's actual shape, not a few sparse wires. One radial per point. */
      for (const pt of p.points) {
        const cd = softDim(pt.x, pt.y);
        const cx = pt.x * w;
        const cy = pt.y * h;
        const rad = (pt.radius && pt.radius > 0 ? pt.radius : 0.2) * w * 1.15;
        const pos = pt.value >= 0;
        const a = clamp((pos ? 0.2 : 0.15) * Math.min(1, Math.abs(pt.value)) * glow * cd, 0, 0.34);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, rad));
        g.addColorStop(0, withAlpha(pos ? pal.accent : pal.secondary, a));
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      /* Ambient signal motes — faint deterministic dots across the whole field so
         no region reads as dead, quieted behind the copy by the same falloff. */
      const motesStalled = staticRef.current || p.speed <= 0;
      const ms = clamp(w / 1180, 0.86, 1.1);
      for (const a of ambient) {
        const drift = motesStalled ? 0 : Math.sin(elapsed * a.sp + a.ph * TAU) * 0.01;
        const cx = a.x * w;
        const cy = (a.y + drift) * h;
        const d = softDim(a.x, a.y + drift);
        const tw = 0.45 + 0.55 * Math.abs(Math.sin((motesStalled ? a.ph * 6 : elapsed) * a.sp * 1.4 + a.ph * 9));
        ctx.globalAlpha = clamp(0.17 * glow * d * tw, 0, 0.5);
        ctx.fillStyle = a.cool ? pal.secondary : pal.accent;
        ctx.beginPath();
        ctx.arc(cx, cy, a.r * ms, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      // A region annotation (frame / corner ticks) is drawn only when labels are
      // on and it doesn't sit behind the copy. Centre is field-space = canvas 0–1
      // (full-bleed), so the readability test matches the copy's actual position.
      const showAnnotation = (fx: number, fy: number) =>
        p.showLabels &&
        !(p.hideLabelsNearContent && p.comp.hasSafe && labelHiddenAt(p.comp, fx, fy));

      // Base contour field.
      strokeContours(disp, cols, rows, w, h, pal, p, { boost: 0, alphaScale: 1, dim: softDim });

      // Comparison regions — ghosted, dashed, muted (the non-color "aside" cue).
      for (const cr of p.comparisonRegions) {
        const r = rectPx(cr);
        ctx.save();
        ctx.beginPath();
        ctx.rect(r.x, r.y, r.w, r.h);
        ctx.clip();
        ctx.setLineDash([4, 5]);
        strokeContours(disp, cols, rows, w, h, pal, p, {
          boost: 0,
          colorOverride: pal.muted,
          alphaScale: 0.5,
          dim: fallDim,
        });
        ctx.restore();
        if (!showAnnotation(cr.x + cr.w / 2, cr.y + cr.h / 2)) continue;
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.globalAlpha = 0.38;
        ctx.strokeStyle = pal.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        ctx.restore();
      }

      // Active region — brightened contours + corner ticks (brightness is not
      // the only signal; the ticks read in forced-colors-adjacent contexts too).
      if (p.activeRegion) {
        const ar = p.activeRegion;
        const r = rectPx(ar);
        ctx.save();
        ctx.beginPath();
        ctx.rect(r.x, r.y, r.w, r.h);
        ctx.clip();
        strokeContours(disp, cols, rows, w, h, pal, p, {
          boost: 0.32,
          alphaScale: 1,
          dim: fallDim,
        });
        ctx.restore();
        if (!showAnnotation(ar.x + ar.w / 2, ar.y + ar.h / 2)) {
          return trans.active || driftAmp !== 0;
        }
        const t = Math.min(18, r.w * 0.18, r.h * 0.18);
        ctx.save();
        ctx.globalAlpha = clamp(0.75 * p.intensity, 0.3, 1);
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y + t); ctx.lineTo(r.x, r.y); ctx.lineTo(r.x + t, r.y);
        ctx.moveTo(r.x + r.w - t, r.y); ctx.lineTo(r.x + r.w, r.y); ctx.lineTo(r.x + r.w, r.y + t);
        ctx.moveTo(r.x + r.w, r.y + r.h - t); ctx.lineTo(r.x + r.w, r.y + r.h); ctx.lineTo(r.x + r.w - t, r.y + r.h);
        ctx.moveTo(r.x + t, r.y + r.h); ctx.lineTo(r.x, r.y + r.h); ctx.lineTo(r.x, r.y + r.h - t);
        ctx.stroke();
        ctx.restore();
      }

      return trans.active || driftAmp !== 0;
    };

    const tick = (now: number) => {
      if (!running) return;
      if (!startTime) startTime = now;
      const elapsed = (now - startTime) / 1000;
      const keepGoing = draw(elapsed);
      // Idle out when there is nothing left to animate (drift off + no transition).
      if (!keepGoing && !transRef.current.active) {
        running = false;
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || staticRef.current || pausedRef.current) return;
      running = true;
      startTime = 0;
      // Redraw the DPR transform each frame origin.
      const { dpr } = dimsRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rafId = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const requestDraw = () => {
      const { dpr } = dimsRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(0);
    };

    // Initial sizing + snap to the data, then a deterministic first frame.
    measure();
    setData(true);
    ctx.setTransform(dimsRef.current.dpr, 0, 0, dimsRef.current.dpr, 0, 0);
    draw(0);

    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          const changed = measure();
          if (changed) setData(true);
          ctx.setTransform(dimsRef.current.dpr, 0, 0, dimsRef.current.dpr, 0, 0);
          if (staticRef.current || pausedRef.current) draw(0);
          else start();
        })
      : null;
    ro?.observe(wrap);

    engineRef.current = { setData, requestDraw, start, stop };

    return () => {
      stop();
      ro?.disconnect();
      engineRef.current = null;
    };
    // Rebuild the engine only when the motion mode flips; data/size are handled live.
  }, [staticMode]);

  /* --------------------------- Run / pause loop -------------------------- */
  React.useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (staticMode || paused) {
      engine.stop();
      engine.requestDraw();
    } else {
      engine.start();
    }
  }, [staticMode, paused]);

  /* ---------------------- Data change → eased retarget ------------------- */
  React.useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const snap = staticMode || paused;
    engine.setData(snap);
    if (snap) engine.requestDraw();
    else engine.start();
    // Depend on the serialized data so region-only prop changes don't retrigger.
  }, [dataSig, staticMode, paused]);

  /* ----------------- Region / intensity change → redraw ------------------ */
  React.useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (staticMode || paused) engine.requestDraw();
    else engine.start();
  }, [
    resolvedActive,
    resolvedComparison,
    comp,
    showLabels,
    hideLabelsNearContent,
    intensity,
    speed,
    density,
    staticMode,
    paused,
  ]);

  /* --------------------------- Pointer nudge ----------------------------- */
  React.useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !interactive || staticMode) return;
    const host = wrap.parentElement ?? wrap;
    const onMove = (e: PointerEvent) => {
      if (systemReduced) return;
      const r = wrap.getBoundingClientRect();
      if (!r.width || !r.height) return;
      pointerRef.current = {
        x: clamp((e.clientX - r.left) / r.width, 0, 1),
        y: clamp((e.clientY - r.top) / r.height, 0, 1),
        on: 1,
      };
      engineRef.current?.setData(false);
      if (!pausedRef.current) engineRef.current?.start();
    };
    const onLeave = () => {
      pointerRef.current = { ...pointerRef.current, on: 0 };
      engineRef.current?.setData(false);
      if (!pausedRef.current) engineRef.current?.start();
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [interactive, staticMode, systemReduced]);

  const css = `
.${cls} { position: absolute; inset: 0; }
.${cls} canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.${cls} .mk-dcs-fallback { display: none; }
/* Forced-colors: canvas has no system-color equivalent, so hide it and show a
   CanvasText-bordered plate behind the children to keep foreground legible. */
@media (forced-colors: active) {
  .${cls} canvas { display: none; }
  .${cls} .mk-dcs-fallback {
    display: block; position: absolute; inset: 0;
    border: 1px solid CanvasText; background: Canvas; forced-color-adjust: none;
  }
}`.trim();

  return (
    <div className={cn("relative isolate overflow-hidden", className)} style={style} {...props}>
      <div
        ref={wrapRef}
        aria-hidden="true"
        data-motion={staticMode ? "static" : "animated"}
        data-paused={paused ? "true" : "false"}
        className={cn("pointer-events-none absolute inset-0 overflow-hidden", cls)}
      >
        {/* Full-bleed canvas — no mask; the field runs edge-to-edge so the
            contours stay visible on every side, including behind centered copy. */}
        <canvas ref={canvasRef} />
        <div className="mk-dcs-fallback" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </div>

      {children != null ? (
        <>
          {/* Glass scrim behind the copy: a soft wash + feathered backdrop blur so
              text stays readable while the animated field continues underneath —
              no hard cut. */}
          {scrimStyle ? (
            <div aria-hidden className="pointer-events-none absolute inset-0 z-0" style={scrimStyle} />
          ) : null}
          <div className="relative z-10">{children}</div>
        </>
      ) : null}
    </div>
  );
}

export default DataContourSurface;
