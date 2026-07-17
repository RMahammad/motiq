"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useVisibilityPause,
  resolveComposition,
  compositionScrimStyle,
  labelHiddenAt,
  contentFalloff,
  type ContentPlacement,
} from "@/lib/motionstack";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface SafeRect {
  /** 0–1 left edge of the readable safe area. */
  x: number;
  /** 0–1 top edge of the readable safe area. */
  y: number;
  /** 0–1 width of the readable safe area. */
  w: number;
  /** 0–1 height of the readable safe area. */
  h: number;
}

export interface FocalPoint {
  /** 0–1 horizontal focal position (grid skews toward it under perspective). */
  x: number;
  /** 0–1 vertical focal position. */
  y: number;
}

export interface HighlightCell {
  /** Column index (0-based) into the current grid. */
  col: number;
  /** Row index (0-based) into the current grid. */
  row: number;
}

export interface AdaptiveSafeZoneGridProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * One or many regions where the grid quiets so foreground content stays readable
   * (0–1 coords). A single rect reads through the glass scrim like a placement; an
   * array keeps the multi-zone luminance mask for power users.
   */
  safeArea?: SafeRect | SafeRect[];
  /**
   * Where the foreground content sits. Derives a protected rect on that side and
   * reads the copy through a frosted-glass scrim — the grid stays full-bleed and
   * visible under the copy (softened, not cut away), so there is no hard edge. The
   * one prop needed for a readable hero. "none" = the raw content-agnostic grid.
   * An explicit `safeArea` array still keeps the multi-zone luminance-mask behavior.
   */
  contentPlacement?: ContentPlacement;
  /** Extra ramp width (0–1) over which the grid fades back in past the content. */
  safeAreaPadding?: number;
  /** How strongly the grid is suppressed behind content (0–1). */
  safeAreaStrength?: number;
  /** Where structure concentrates; the perspective skew leans toward it. */
  focalPoint?: FocalPoint;
  /** Grid line-count multiplier (~0.4–1.6). */
  density?: number;
  /** Overall luminance/opacity of the grid (0–1.4). */
  intensity?: number;
  /** Shimmer sweep speed multiplier. 0 stops the sweep (grid still legible). */
  speed?: number;
  /** Lean the grid into a subtle perspective skew toward the focal point. */
  perspective?: boolean;
  /** Strength of the perspective skew (0–3). */
  depth?: number;
  /** Cells to mark with a restrained accent tint + outline. */
  highlightCells?: HighlightCell[];
  /** Pointer lights the grid near the cursor (never the sole effect). */
  interactive?: boolean;
  /** Pause the shimmer when scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
  /** Deterministic seed for the per-line variation (SSR-stable). */
  seed?: number;
  /** Force the static, motion-free variant regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Deterministic geometry                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Fixed logical WIDTH; the field HEIGHT tracks the container aspect ratio so the
 * grid fills any shape without the wide-viewBox `slice` zoom that used to crop a
 * narrow/tall container down to a couple of lines. Desktop default keeps SSR and
 * first client paint identical; a ResizeObserver refines it after mount.
 */
const W = 1200;
const DEFAULT_H = 760;
const MIN_H = 460;
const MAX_H = 2200;

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

/** 1 at the frame edge → 0 at the centre; drives edge detail + emphasis. */
const edgeProx = (t: number) => 1 - clamp(Math.min(t, 1 - t) / 0.5, 0, 1);

interface GridLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  o: number;
}

/** A faint ambient dot that fills the field so no region reads as dead space. */
interface Mote {
  /** 0–1 field coords. */
  fx: number;
  fy: number;
  /** Radius in logical px. */
  r: number;
  /** Base opacity. */
  o: number;
  /** Accent-tinted (vs. cyan) — a warm/cool scatter. */
  warm: boolean;
  /** Per-mote twinkle timing so they don't pulse in lockstep. */
  dur: number;
  delay: number;
}

/** A lit lattice cell that gives the grid depth and a designed focal cluster. */
interface FocalCell {
  /** 0–1 field coords of the cell centre (for falloff quieting behind copy). */
  cx01: number;
  cy01: number;
  x: number;
  y: number;
  w: number;
  h: number;
  o: number;
}

interface GridModel {
  cols: number;
  rows: number;
  coarse: GridLine[];
  fine: GridLine[];
  motes: Mote[];
  focalCells: FocalCell[];
}

/**
 * A regular lattice whose per-line opacity RISES toward the frame edges and a
 * finer subdivision set that only surfaces near the edges — so detail collects
 * at the frame while the centre stays calm. It also seeds ambient signal motes
 * that fill the whole field (so no corner reads as dead) and a deterministic
 * cluster of lit focal cells concentrated toward the open side for depth. The
 * safe-area mask + falloff (applied in the component) then quiet whichever
 * regions hold foreground content.
 */
function buildGrid(
  seed: number,
  density: number,
  intensity: number,
  fieldH: number,
  focal: { x: number; y: number },
): GridModel {
  const rng = makeRng(seed);
  const cols = clamp(Math.round(12 * density), 4, 30);
  // Rows follow the field height so cells stay roughly square whatever the
  // container aspect — a tall mobile band gets more rows and reads as a full
  // lattice, not a handful of stretched cells.
  const cell = W / cols;
  const rows = clamp(Math.round(fieldH / cell), 3, 34);
  const coarse: GridLine[] = [];
  const fine: GridLine[] = [];

  for (let i = 0; i <= cols; i++) {
    const fx = i / cols;
    const e = edgeProx(fx);
    const o = clamp((0.16 + e * 0.2) * intensity * (0.76 + rng() * 0.44), 0.05, 0.6);
    coarse.push({ x1: round1(fx * W), y1: 0, x2: round1(fx * W), y2: fieldH, o: round1(o) });
  }
  for (let j = 0; j <= rows; j++) {
    const fy = j / rows;
    const e = edgeProx(fy);
    const o = clamp((0.16 + e * 0.2) * intensity * (0.76 + rng() * 0.44), 0.05, 0.6);
    coarse.push({ x1: 0, y1: round1(fy * fieldH), x2: W, y2: round1(fy * fieldH), o: round1(o) });
  }

  // Fine subdivisions sit between coarse lines; their opacity ∝ edgeProx², so
  // they fade to nothing in the centre and only add detail toward the frame.
  for (let i = 0; i < cols; i++) {
    const fx = (i + 0.5) / cols;
    const e = edgeProx(fx);
    const o = clamp(e * e * 0.15 * intensity * (0.7 + rng() * 0.5), 0, 0.36);
    if (o < 0.02) continue;
    fine.push({ x1: round1(fx * W), y1: 0, x2: round1(fx * W), y2: fieldH, o: round1(o) });
  }
  for (let j = 0; j < rows; j++) {
    const fy = (j + 0.5) / rows;
    const e = edgeProx(fy);
    const o = clamp(e * e * 0.15 * intensity * (0.7 + rng() * 0.5), 0, 0.36);
    if (o < 0.02) continue;
    fine.push({ x1: 0, y1: round1(fy * fieldH), x2: W, y2: round1(fy * fieldH), o: round1(o) });
  }

  // Ambient motes — a deterministic scatter over the whole field so the grid
  // reads as a lit, inhabited surface rather than an empty lattice. A few sit on
  // grid intersections (crisp), the rest drift freely; ~1 in 3 is accent-warm.
  const moteCount = clamp(Math.round(46 * Math.sqrt(density) * clamp(intensity, 0.6, 1.6)), 30, 96);
  const motes: Mote[] = [];
  for (let i = 0; i < moteCount; i++) {
    const snap = rng() > 0.62;
    const fx = snap ? clamp(Math.round(rng() * cols) / cols, 0, 1) : rng();
    const fy = snap ? clamp(Math.round(rng() * rows) / rows, 0, 1) : rng();
    const big = rng() > 0.86;
    motes.push({
      fx: round1(fx * 1000) / 1000,
      fy: round1(fy * 1000) / 1000,
      r: round1((big ? 2.4 : 1.1) + rng() * 1.4),
      o: round1(clamp((big ? 0.4 : 0.22) * intensity * (0.6 + rng() * 0.7), 0.06, 0.75)),
      warm: rng() > 0.66,
      dur: round1(3.4 + rng() * 3.6),
      delay: round1(-rng() * 6),
    });
  }

  // Lit focal cells — a designed cluster of accent-tinted cells drawn toward the
  // open side (where the graphic lives), giving the flat lattice real depth. Cell
  // probability rises near the focal point; capped so it stays restrained.
  const focalCells: FocalCell[] = [];
  const cw = W / cols;
  const ch = fieldH / rows;
  const maxCells = clamp(Math.round(7 + density * 4), 6, 16);
  for (let r = 0; r < rows && focalCells.length < maxCells; r++) {
    for (let c = 0; c < cols && focalCells.length < maxCells; c++) {
      const cx01 = (c + 0.5) / cols;
      const cy01 = (r + 0.5) / rows;
      const dist = Math.hypot(cx01 - focal.x, cy01 - focal.y);
      const near = clamp(1 - dist / 0.5, 0, 1);
      if (near <= 0) continue;
      if (rng() > near * near * 0.55) continue;
      focalCells.push({
        cx01: round1(cx01 * 1000) / 1000,
        cy01: round1(cy01 * 1000) / 1000,
        x: round1(c * cw),
        y: round1(r * ch),
        w: round1(cw),
        h: round1(ch),
        o: round1(clamp((0.16 + near * 0.5) * intensity * (0.6 + rng() * 0.6), 0.08, 0.85)),
      });
    }
  }

  return { cols, rows, coarse, fine, motes, focalCells };
}

/**
 * Rough advance-width estimate (in logical px) for sizing an SVG pill without a
 * canvas measure at render — digits/caps/symbols are wide, i/l/punctuation are
 * narrow. Only used to pad decorative chips, so an approximation is fine.
 */
function estWidth(text: string, size: number): number {
  let em = 0;
  for (const ch of text) {
    if (ch === " ") em += 0.32;
    else if (/[iIl.,:|']/.test(ch)) em += 0.3;
    else if (/[A-Z0-9×%@#]/.test(ch)) em += 0.62;
    else em += 0.52;
  }
  return em * size;
}

/** Normalise one-or-many safe areas to an array of ellipse mask geometry. */
function safeEllipses(safeArea: SafeRect | SafeRect[], fieldH: number) {
  const rects = Array.isArray(safeArea) ? safeArea : [safeArea];
  return rects.map((r) => ({
    cx: round1((r.x + r.w / 2) * W),
    cy: round1((r.y + r.h / 2) * fieldH),
    rx: round1((r.w / 2) * W * 1.12),
    ry: round1((r.h / 2) * fieldH * 1.12),
  }));
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * AdaptiveSafeZoneGrid — a content-aware structural grid for hero sections. A
 * single `contentPlacement` preset ("left"/"right"/"center"/…) reserves a
 * readable region and fades the grid behind the copy; power users can instead
 * pass one or many rectangular `safeArea`s. The grid runs full-bleed and a
 * frosted-glass scrim behind the copy keeps text readable (readability comes from
 * a backdrop blur, not from cutting the grid away), so the lattice stays visible
 * under the content with no hard edge, while detail still collects toward the
 * frame edges. An optional perspective skew leans the lattice toward a
 * `focalPoint`; highlighted cells mark focal structure; a restrained accent
 * shimmer sweeps the lines and pauses offscreen / under reduced motion. SVG +
 * CSS only — no canvas, no WebGL, no per-frame React state, and no
 * `Math.random`/`Date.now` at render, so server and client render identical
 * markup. Decorative: renders `children` as foreground content over the safe
 * area. Clean-room original — not a port of any moving-grid effect.
 */
export function AdaptiveSafeZoneGrid({
  safeArea,
  contentPlacement = "none",
  safeAreaPadding,
  safeAreaStrength,
  focalPoint = { x: 0.32, y: 0.5 },
  density = 1,
  intensity = 1,
  speed = 1,
  perspective = false,
  depth = 1,
  highlightCells,
  interactive = false,
  pauseWhenHidden = true,
  seed = 1,
  reducedMotion,
  className,
  style,
  children,
  ...props
}: AdaptiveSafeZoneGridProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `mk-aszg-${uid}`;
  const bgRef = React.useRef<HTMLDivElement | null>(null);

  const systemReduced = useReducedMotion();
  const staticMode = reducedMotion === true;
  const onScreen = useVisibilityPause(bgRef, { threshold: 0.01 });
  const paused = pauseWhenHidden && !onScreen;

  // Container shape, measured after mount. Initialised to a desktop default so
  // SSR and the first client render agree (no hydration mismatch); a
  // ResizeObserver then tracks the real aspect and whether it's a narrow layout.
  const [layout, setLayout] = React.useState({ fieldH: DEFAULT_H, narrow: false });
  React.useEffect(() => {
    const el = bgRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0 || h <= 0) return;
      const fieldH = clamp(Math.round(W / (w / h) / 20) * 20, MIN_H, MAX_H);
      const narrow = w < 640;
      setLayout((prev) =>
        prev.fieldH === fieldH && prev.narrow === narrow ? prev : { fieldH, narrow },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const fieldH = layout.fieldH;

  // Composition: a strict content-placement preset. An explicit single `safeArea`
  // overrides the preset rect; an array is left to the legacy multi-zone mask.
  const comp = React.useMemo(
    () =>
      resolveComposition({
        contentPlacement,
        safeArea: Array.isArray(safeArea) ? undefined : safeArea,
        safeAreaPadding,
        safeAreaStrength,
      }),
    [contentPlacement, safeArea, safeAreaPadding, safeAreaStrength],
  );

  // Stacked (content-on-top/bottom, or a narrow horizontal) layouts open a tall
  // band that must be filled with visible structure — lift vividness there so the
  // field never reads as an empty screen on mobile.
  const stacked =
    comp.placement === "top" ||
    comp.placement === "bottom" ||
    (layout.narrow && (comp.placement === "left" || comp.placement === "right"));
  const vividness = clamp(intensity * (stacked ? 1.45 : layout.narrow ? 1.24 : 1), 0, 1.75);

  // Concentrate structure + wash on the OPEN side (opposite the copy) so the glow
  // and lit cells fill the live band — e.g. low behind a top-placed headline —
  // rather than always sitting at the prop focal. Falls back to the focal when
  // unplaced. Computed before the grid so its focal cluster leans the right way.
  const washFocal = comp.hasSafe ? comp.focal : focalPoint;

  const grid = React.useMemo(
    () => buildGrid(seed, density, vividness, fieldH, washFocal),
    [seed, density, vividness, fieldH, washFocal],
  );

  // The SVG luminance mask is now only the multi-zone power-user path (an explicit
  // ARRAY of safe areas, with no single copy location to feather a scrim toward).
  // A single placement / safeArea instead runs the grid full-bleed and reads the
  // copy through a glass scrim, so nothing is cut away.
  const multiZone = Array.isArray(safeArea);
  const ellipses = React.useMemo(
    () => (multiZone ? safeEllipses(safeArea, fieldH) : []),
    [multiZone, safeArea, fieldH],
  );

  // Glass scrim behind the copy: a soft wash + feathered backdrop blur so the
  // full-bleed grid stays visible under the text without a hard edge.
  const scrimStyle = comp.hasSafe ? compositionScrimStyle(comp) : undefined;
  const falloff = React.useMemo(() => contentFalloff(comp), [comp]);

  // Behind the copy the grid is softened, never removed: a high opacity floor
  // keeps it reading as a lit lattice through the frosted glass (readability comes
  // from the scrim's backdrop blur, not from hiding the grid).
  const softDim = React.useMemo(() => {
    if (!comp.hasSafe) return (_x: number, _y: number) => 1;
    const floor = 0.62;
    return (x: number, y: number) => floor + (1 - floor) * falloff(x, y);
  }, [comp.hasSafe, falloff]);

  const cells = React.useMemo(() => {
    if (!highlightCells?.length) return [];
    const cw = W / grid.cols;
    const ch = fieldH / grid.rows;
    return highlightCells
      // Never let a highlighted cell sit behind the copy.
      .filter((c) => {
        if (!comp.hasSafe) return true;
        const cx01 = (clamp(c.col, 0, grid.cols - 1) + 0.5) / grid.cols;
        const cy01 = (clamp(c.row, 0, grid.rows - 1) + 0.5) / grid.rows;
        return !labelHiddenAt(comp, cx01, cy01);
      })
      .map((c) => ({
        x: round1(clamp(c.col, 0, grid.cols - 1) * cw),
        y: round1(clamp(c.row, 0, grid.rows - 1) * ch),
        w: round1(cw),
        h: round1(ch),
      }));
  }, [highlightCells, grid.cols, grid.rows, comp, fieldH]);

  // Pointer highlight — writes CSS vars only (no per-frame React re-render).
  React.useEffect(() => {
    const el = bgRef.current;
    if (!el || !interactive || staticMode) return;
    let raf = 0;
    let nx = W / 2;
    let ny = fieldH / 2;
    const apply = () => {
      raf = 0;
      el.style.setProperty("--aszg-cx", String(round1(nx)));
      el.style.setProperty("--aszg-cy", String(round1(ny)));
      el.style.setProperty("--aszg-cursor", "1");
    };
    const onMove = (e: PointerEvent) => {
      if (systemReduced) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      nx = ((e.clientX - r.left) / r.width) * W;
      ny = ((e.clientY - r.top) / r.height) * fieldH;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => el.style.setProperty("--aszg-cursor", "0");
    const host = el.parentElement ?? el;
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [interactive, staticMode, systemReduced, fieldH]);

  const sweepDur = speed > 0 && !staticMode ? round1(clamp(9 / speed, 2, 20)) : 0;
  const showShimmer = !staticMode && sweepDur > 0;

  // Perspective is a subtle static skew leaning toward the focal point. It sits
  // on the inner (lines) group only, so the safe-area mask stays aligned to the
  // container coordinates where the foreground text actually sits.
  const kx = perspective ? round1(clamp((focalPoint.y - 0.5) * clamp(depth, 0, 3) * 6, -9, 9)) : 0;
  const ky = perspective ? round1(clamp((focalPoint.x - 0.5) * clamp(depth, 0, 3) * 5, -7, 7)) : 0;
  const gridTransform = perspective
    ? `translate(${W / 2} ${fieldH / 2}) scale(1.08) skewX(${kx}) skewY(${ky}) translate(${-W / 2} ${-fieldH / 2})`
    : undefined;

  // Motes + focal cells run full-bleed and stay visible under the copy — softened
  // (not dropped) by `softDim` so the lit surface reads as a lattice behind the
  // frosted glass, never an empty band under centered content.
  const motes = grid.motes;
  const focalCells = grid.focalCells;

  const lineStroke = "color-mix(in oklab, var(--color-fg) 62%, transparent)";
  const fineStroke = "color-mix(in oklab, var(--color-fg) 44%, transparent)";
  const azure = "var(--color-accent)";
  const cyan = "var(--color-secondary-accent, var(--color-info))";
  const cellFill = "color-mix(in oklab, var(--color-accent) 12%, transparent)";
  const cellStroke = "color-mix(in oklab, var(--color-accent) 55%, transparent)";
  const surfaceTok = "var(--color-surface)";
  const borderTok = "var(--color-border)";
  const fgTok = "var(--color-fg)";
  const mutedTok = "var(--color-muted)";
  const successTok = "var(--color-success, var(--color-accent))";
  const accentFg = "var(--color-accent-fg, #fff)";
  const uiFont = "ui-sans-serif, system-ui, sans-serif";

  // Designed overlay — a grid-aligned "safe zone" callout, its lit cell cluster,
  // column axis ticks, and glassy live-metric chips. This is what lifts the field
  // from a bare lattice to a content-aware, dashboard-grade surface. Everything is
  // deterministic (positions derive from the focal point and grid, no RNG) and
  // upright (never skewed), and every piece self-quiets behind the copy via
  // `softDim` so nothing floats over the headline. Skipped for the multi-zone
  // luminance-mask power path, which keeps its bare geometry.
  const overlay = React.useMemo(() => {
    if (multiZone) return null;
    const cw = W / grid.cols;
    const ch = fieldH / grid.rows;
    const F = washFocal;
    const narrow = layout.narrow;
    const ui = narrow ? 1.9 : 1;
    const M = 18;
    const place = comp.placement;
    // A narrow phone hero stacks the copy on top/bottom, and that copy is taller
    // than the 0.5 safe rect it derives from — so treat a wider band as occupied
    // and keep the callout inside the clearly-open strip.
    const stackTop = narrow && (place === "top" || place === "none");
    const stackBottom = narrow && place === "bottom";

    // "SAFE ZONE" tab dimensions (needed before positioning so the tab clears the
    // copy on stacked layouts).
    const tabFs = 16 * ui;
    const tabText = "SAFE ZONE";
    const tabW = round1(estWidth(tabText, tabFs) + 22 * ui);
    const tabH = round1(24 * ui);

    // Safe-zone block snapped to a small block of cells around the focal point.
    // Compact on a phone so the whole callout fits the short open band.
    const colsSpan = clamp(Math.round(grid.cols * (narrow ? 0.34 : 0.26)), 2, 4);
    const rowsSpan = clamp(Math.round(grid.rows * (narrow ? 0.12 : 0.28)), 2, 4);
    const fc = clamp(Math.round(F.x * grid.cols), 0, grid.cols);
    const fr = clamp(Math.round(F.y * grid.rows), 0, grid.rows);
    let zc0 = clamp(fc - Math.round(colsSpan / 2), 0, grid.cols - colsSpan);
    let zr0 = clamp(fr - Math.round(rowsSpan / 2), 0, grid.rows - rowsSpan);
    // Push the zone fully clear of the (taller-than-safe) stacked copy.
    if (stackTop) {
      const minRow = Math.ceil((0.74 * fieldH + tabH) / ch);
      zr0 = clamp(Math.max(zr0, minRow), 0, grid.rows - rowsSpan);
    } else if (stackBottom) {
      const maxRow = Math.floor((0.26 * fieldH) / ch) - rowsSpan;
      zr0 = clamp(Math.min(zr0, maxRow), 0, grid.rows - rowsSpan);
    }
    const zx = round1(zc0 * cw);
    const zy = round1(zr0 * ch);
    const zw = round1(colsSpan * cw);
    const zh = round1(rowsSpan * ch);
    const zoneDim = softDim((zx + zw / 2) / W, (zy + zh / 2) / fieldH);
    // Only draw the callout where it's essentially fully lit — a centered copy
    // leaves no clean spot, so the grid stays ambient there rather than peeking a
    // dimmed frame from behind the headline.
    const showZone = zoneDim > 0.66;

    // Lit cells inside the zone — brightest at the focal cell, so the cluster
    // reads as a designed, glowing focus rather than scattered blobs.
    const cxF = zc0 + colsSpan / 2 - 0.5;
    const cyF = zr0 + rowsSpan / 2 - 0.5;
    const zoneCells = [] as Array<{
      x: number; y: number; w: number; h: number; fill: number; stroke: number; hero: boolean;
    }>;
    for (let r = 0; r < rowsSpan; r++) {
      for (let c = 0; c < colsSpan; c++) {
        const col = zc0 + c;
        const row = zr0 + r;
        const d = Math.hypot((col - cxF) / Math.max(1, colsSpan - 1), (row - cyF) / Math.max(1, rowsSpan - 1));
        const near = clamp(1 - d, 0.1, 1);
        zoneCells.push({
          x: round1(col * cw),
          y: round1(row * ch),
          w: round1(cw),
          h: round1(ch),
          fill: round1(clamp((0.05 + near * near * 0.26) * vividness * zoneDim, 0.02, 0.42)),
          stroke: round1(clamp((0.22 + near * 0.6) * zoneDim, 0.14, 0.95)),
          hero: near > 0.82,
        });
      }
    }

    // Column axis ticks over the lit block — small indices, skipped where the tab
    // sits so nothing overlaps it.
    const ticks = [] as Array<{ x: number; y: number; text: string }>;
    if (showZone) {
      for (let c = 0; c < colsSpan; c++) {
        const col = zc0 + c;
        const tx = (col + 0.5) * cw;
        if (tx < zx + tabW + 6 * ui) continue; // clear of the SAFE ZONE tab
        ticks.push({ x: round1(tx), y: round1(zy - 13 * ui), text: String(col + 1).padStart(2, "0") });
      }
    }

    // Glassy live-metric chips — sized deterministically, then slotted onto the
    // zone's perimeter. A chip is dropped if it would collide with the zone or
    // fall behind the copy, so the layout stays clean at every width. Beside a
    // full-height copy column (left/right) only above/below are clean; a stacked
    // phone hero gets a single chip centred in the open strip.
    const safePct = Math.round(clamp(comp.safe.w * comp.safe.h, 0, 1) * 100);
    const contents = [
      { value: `${grid.cols} × ${grid.rows}`, label: "columns" },
      { value: "60fps", label: "reflow" },
      { value: safePct > 0 ? `${safePct}%` : "auto", label: "safe area" },
    ];
    const fs = 25 * ui;
    const ls = 21 * ui;
    const padX = 21 * ui;
    const dotR = 6 * ui;
    const gap = 14 * ui;
    const chipH = 50 * ui;
    const chips = [] as Array<{
      bx: number; by: number; w: number; h: number; cy: number; dim: number;
      dotX: number; dotR: number; valueX: number; labelX: number;
      fs: number; ls: number; value: string; label: string;
    }>;
    const vertical = place === "left" || place === "right";
    const stacked = stackTop || stackBottom;
    contents.forEach((d, idx) => {
      // The phone hero's open strip is too short for a floating pill under the
      // callout, so it leans on the wide lit callout instead — no chips there.
      if (stacked) return;
      if (idx === 2 && vertical) return;
      const vw = estWidth(d.value, fs);
      const lw = estWidth(d.label, ls);
      const w = padX * 2 + dotR * 2 + gap + vw + gap * 0.85 + lw;
      let bx: number;
      let by: number;
      if (idx === 0) {
        bx = zx + zw / 2 - w / 2; by = zy - tabH - chipH - 22 * ui;          // above
      } else if (idx === 1) {
        bx = zx + zw / 2 - w / 2; by = zy + zh + 22 * ui;                    // below
      } else {
        bx = zx - w - 26 * ui; by = zy + zh / 2 - chipH / 2;                 // left
      }
      bx = clamp(bx, M, W - M - w);
      by = clamp(by, M, fieldH - M - chipH);
      const dim = softDim((bx + w / 2) / W, (by + chipH / 2) / fieldH);
      // Drop borderline-dim chips rather than floating a half-faded pill over the
      // copy edge — a chip only reads as premium at (near) full opacity.
      if (dim < 0.9) return;
      const overlapsZone = showZone && bx < zx + zw && bx + w > zx && by < zy + zh && by + chipH > zy;
      if (overlapsZone) return;
      const dotX = bx + padX + dotR;
      const valueX = dotX + dotR + gap;
      chips.push({
        bx: round1(bx), by: round1(by), w: round1(w), h: round1(chipH), cy: round1(by + chipH / 2),
        dim: round1(dim), dotX: round1(dotX), dotR: round1(dotR),
        valueX: round1(valueX), labelX: round1(valueX + vw + gap * 0.85),
        fs: round1(fs), ls: round1(ls), value: d.value, label: d.label,
      });
    });

    return {
      ui, zx, zy, zw, zh, radius: round1(13 * ui), zoneDim, showZone, zoneCells, ticks, chips,
      tabText, tabW, tabH, tabFs: round1(tabFs), tickFs: round1(15 * ui),
    };
  }, [multiZone, grid.cols, grid.rows, fieldH, washFocal, layout.narrow, comp.safe, comp.placement, vividness, softDim]);

  const css = `
.${cls} { position: absolute; inset: 0; }
.${cls} svg { width: 100%; height: 100%; display: block; }
.${cls} .mk-aszg-line, .${cls} .mk-aszg-fine { vector-effect: non-scaling-stroke; }
.${cls} .mk-aszg-band { fill: url(#aszg-band-${uid}); }
.${cls}.mk-aszg-animated .mk-aszg-band {
  animation: ${cls}-sweep var(--sweep, 9s) linear infinite;
  will-change: transform;
}
@keyframes ${cls}-sweep {
  from { transform: translateX(-1200px); }
  to { transform: translateX(1200px); }
}
.${cls}[data-paused="true"] .mk-aszg-band { animation-play-state: paused !important; }
.${cls}.mk-aszg-animated .mk-aszg-mote {
  animation: ${cls}-twinkle var(--tw, 4s) ease-in-out var(--td, 0s) infinite alternate;
  will-change: opacity;
}
@keyframes ${cls}-twinkle {
  from { opacity: 0.45; }
  to { opacity: 1; }
}
.${cls}[data-paused="true"] .mk-aszg-mote { animation-play-state: paused !important; }
${interactive ? `.${cls} .mk-aszg-cursor {
  transform: translate(calc(var(--aszg-cx,600) * 1px), calc(var(--aszg-cy,380) * 1px));
  opacity: calc(var(--aszg-cursor,0) * 0.55);
}` : ""}
@media (prefers-reduced-motion: reduce) {
  .${cls} .mk-aszg-band, .${cls} .mk-aszg-mote { animation: none !important; }
}
/* Forced-colors: drop washes/gradients/masks and fall back to plain CanvasText
   strokes so the grid stays legible. */
@media (forced-colors: active) {
  .${cls} .mk-aszg-wash, .${cls} .mk-aszg-light, .${cls} .mk-aszg-shimmer,
  .${cls} .mk-aszg-mote, .${cls} .mk-aszg-cursor, .${cls} .mk-aszg-glow2 { display: none; }
  .${cls} svg { forced-color-adjust: none; }
  .${cls} .mk-aszg-line, .${cls} .mk-aszg-fine { stroke: CanvasText !important; stroke-opacity: 0.45 !important; }
  .${cls} .mk-aszg-cell, .${cls} .mk-aszg-focal, .${cls} .mk-aszg-zonecell,
  .${cls} .mk-aszg-zone rect, .${cls} .mk-aszg-zone path { fill: transparent !important; stroke: CanvasText !important; }
  .${cls} .mk-aszg-chip-bg { fill: Canvas !important; stroke: CanvasText !important; fill-opacity: 1 !important; }
  .${cls} .mk-aszg-tab { fill: CanvasText !important; }
  .${cls} .mk-aszg-uitext, .${cls} .mk-aszg-overlay text { fill: CanvasText !important; fill-opacity: 1 !important; }
  .${cls} .mk-aszg-tab + text { fill: Canvas !important; }
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
          !staticMode && "mk-aszg-animated",
        )}
      >
        <svg viewBox={`0 0 ${W} ${fieldH}`} preserveAspectRatio="xMidYMid slice" role="presentation">
          <defs>
            {/* Baked stage lighting — a cool spotlight over the graphic's focal
                side, a soft floor lift, and a corner vignette so the grid reads
                as a lit surface (not a flat box) wherever it is used. All
                token-driven → correct in light and dark. */}
            <radialGradient
              id={`aszg-wash-${uid}`}
              cx={`${round1(washFocal.x * 100)}%`}
              cy={`${round1(clamp(washFocal.y - 0.05, 0, 1) * 100)}%`}
              r="78%"
            >
              <stop offset="0%" stopColor={azure} stopOpacity={round1(clamp(0.22 * vividness, 0.1, 0.4))} />
              <stop offset="38%" stopColor={cyan} stopOpacity={round1(clamp(0.1 * vividness, 0.04, 0.22))} />
              <stop offset="100%" stopColor={azure} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`aszg-floor-${uid}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={azure} stopOpacity={round1(clamp(0.09 * vividness, 0.03, 0.18))} />
              <stop offset="52%" stopColor={azure} stopOpacity="0" />
            </linearGradient>
            <radialGradient id={`aszg-vignette-${uid}`} cx="50%" cy="46%" r="72%">
              <stop offset="52%" stopColor="var(--color-bg)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--color-bg)" stopOpacity={round1(clamp(0.5 * clamp(vividness, 0.7, 1.4), 0.3, 0.62))} />
            </radialGradient>
            <filter id={`aszg-glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="9" />
            </filter>
            <filter id={`aszg-soft-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            {/* Lit-cell fill — brighter toward the top so each zone cell reads as
                a lit face, not a flat tint. */}
            <linearGradient id={`aszg-cell-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={azure} stopOpacity="1" />
              <stop offset="100%" stopColor={cyan} stopOpacity="0.35" />
            </linearGradient>

            {/* Attenuation: black (=hidden) at each safe-area centre, fading to
                transparent at its edge, so the grid quiets where content sits
                and multiple zones compose without hard seams. */}
            <radialGradient id={`aszg-fade-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000" stopOpacity="1" />
              <stop offset="58%" stopColor="#000" stopOpacity="0.62" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            <mask id={`aszg-safe-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={fieldH}>
              <rect x="0" y="0" width={W} height={fieldH} fill="#fff" />
              {ellipses.map((e, i) => (
                <ellipse
                  key={i}
                  className="mk-aszg-safe"
                  cx={e.cx}
                  cy={e.cy}
                  rx={e.rx}
                  ry={e.ry}
                  fill={`url(#aszg-fade-${uid})`}
                />
              ))}
            </mask>

            {/* Grid-shaped mask so the travelling shimmer band lights only the
                lines, never the whole rectangle. */}
            <mask id={`aszg-grid-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={fieldH}>
              <rect x="0" y="0" width={W} height={fieldH} fill="#000" />
              {grid.coarse.map((l, i) => (
                <line
                  key={i}
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke="#fff"
                  strokeOpacity={clamp(l.o * 4, 0.3, 1)}
                  strokeWidth={1.4}
                />
              ))}
            </mask>

            <linearGradient id={`aszg-band-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={azure} stopOpacity="0" />
              <stop offset="45%" stopColor={azure} stopOpacity={round1(clamp(0.85 * vividness, 0.4, 1))} />
              <stop offset="55%" stopColor={azure} stopOpacity={round1(clamp(0.85 * vividness, 0.4, 1))} />
              <stop offset="100%" stopColor={azure} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Baked lighting (below the grid, above the container surface). */}
          <rect className="mk-aszg-wash" x="0" y="0" width={W} height={fieldH} fill={`url(#aszg-wash-${uid})`} />
          <rect className="mk-aszg-light" x="0" y="0" width={W} height={fieldH} fill={`url(#aszg-floor-${uid})`} />

          <g mask={multiZone ? `url(#aszg-safe-${uid})` : undefined}>
            <g transform={gridTransform}>
              {/* Lit focal cells — soft accent pools that give the flat lattice
                  depth, blurred into a glow and clustered on the open side. */}
              {focalCells.length ? (
                <g className="mk-aszg-focal" filter={`url(#aszg-glow-${uid})`}>
                  {focalCells.map((c, i) => (
                    <rect
                      key={i}
                      x={c.x}
                      y={c.y}
                      width={c.w}
                      height={c.h}
                      fill={azure}
                      // Held back to a faint ambient wash: the designed zone cluster
                      // is the focal point now, so these only add distant depth.
                      fillOpacity={round1(clamp(c.o * 0.42 * softDim(c.cx01, c.cy01), 0, 0.5))}
                    />
                  ))}
                </g>
              ) : null}

              {/* Fine, edge-weighted detail (behind the coarse structure). Softened
                  (not removed) where the copy sits so it stays visible through the
                  frosted glass. */}
              <g>
                {grid.fine.map((l, i) => {
                  const px = l.x1 === l.x2 ? l.x1 / W : comp.safe.x + comp.safe.w / 2;
                  const py = l.y1 === l.y2 ? l.y1 / fieldH : comp.safe.y + comp.safe.h / 2;
                  const o = round1(l.o * softDim(px, py));
                  if (o < 0.02) return null;
                  return (
                    <line
                      key={i}
                      className="mk-aszg-fine"
                      x1={l.x1}
                      y1={l.y1}
                      x2={l.x2}
                      y2={l.y2}
                      stroke={fineStroke}
                      strokeOpacity={o}
                      strokeWidth={0.8}
                    />
                  );
                })}
              </g>

              {/* Highlighted cells — restrained accent tint + outline. */}
              {cells.map((c, i) => (
                <rect
                  key={i}
                  className="mk-aszg-cell"
                  x={c.x}
                  y={c.y}
                  width={c.w}
                  height={c.h}
                  fill={cellFill}
                  stroke={cellStroke}
                  strokeOpacity={round1(clamp(0.8 * vividness, 0.4, 1))}
                  strokeWidth={1.2}
                />
              ))}

              {/* Coarse structural grid — full-bleed. Softened a touch behind the
                  copy (high floor) so it still reads clearly through the glass. */}
              <g>
                {grid.coarse.map((l, i) => {
                  const px = l.x1 === l.x2 ? l.x1 / W : 0.5;
                  const py = l.y1 === l.y2 ? l.y1 / fieldH : 0.5;
                  return (
                    <line
                      key={i}
                      className="mk-aszg-line"
                      x1={l.x1}
                      y1={l.y1}
                      x2={l.x2}
                      y2={l.y2}
                      stroke={lineStroke}
                      strokeOpacity={round1(l.o * softDim(px, py))}
                      strokeWidth={1}
                    />
                  );
                })}
              </g>

              {/* Shimmer: an accent band swept behind the grid-shaped mask, so
                  only the lines glow as it travels. */}
              {showShimmer ? (
                <g
                  className="mk-aszg-shimmer"
                  mask={`url(#aszg-grid-${uid})`}
                  style={{ "--sweep": `${sweepDur}s` } as React.CSSProperties}
                >
                  <rect className="mk-aszg-band" x="0" y="0" width={W} height={fieldH} />
                </g>
              ) : null}

              {interactive ? (
                <circle className="mk-aszg-cursor" cx={0} cy={0} r={110} fill={azure} fillOpacity={0.14} />
              ) : null}
            </g>

            {/* Ambient motes — a lit scatter over the whole field so no region
                reads as dead. Outside the perspective transform so they stay
                round; softened (not removed) behind the copy like the lines. */}
            <g className="mk-aszg-motes">
              {motes.map((m, i) => (
                <circle
                  key={i}
                  className="mk-aszg-mote"
                  cx={round1(m.fx * W)}
                  cy={round1(m.fy * fieldH)}
                  r={m.r}
                  fill={m.warm ? azure : cyan}
                  fillOpacity={round1(clamp(m.o * softDim(m.fx, m.fy), 0, 1))}
                  style={{ "--tw": `${m.dur}s`, "--td": `${m.delay}s` } as React.CSSProperties}
                />
              ))}
            </g>
          </g>

          {/* Corner vignette — frames the field with depth, in light and dark. */}
          <rect className="mk-aszg-light" x="0" y="0" width={W} height={fieldH} fill={`url(#aszg-vignette-${uid})`} pointerEvents="none" />

          {/* Designed overlay: the safe-zone callout, lit cell cluster, column
              axis ticks and glassy metric chips — upright, on top, self-quieting
              behind the copy. */}
          {overlay ? (
            <g className="mk-aszg-overlay">
              {/* Lit cells inside the zone — a glowing focus cluster. */}
              {overlay.showZone
                ? overlay.zoneCells.map((c, i) => (
                    <g key={i}>
                      {c.hero ? (
                        <rect
                          className="mk-aszg-glow2"
                          x={c.x}
                          y={c.y}
                          width={c.w}
                          height={c.h}
                          fill={azure}
                          fillOpacity={round1(clamp(c.fill * 1.4, 0, 0.6))}
                          filter={`url(#aszg-soft-${uid})`}
                        />
                      ) : null}
                      <rect
                        className="mk-aszg-zonecell"
                        x={c.x}
                        y={c.y}
                        width={c.w}
                        height={c.h}
                        fill={`url(#aszg-cell-${uid})`}
                        fillOpacity={c.fill}
                        stroke={azure}
                        strokeOpacity={c.stroke}
                        strokeWidth={overlay.ui}
                      />
                    </g>
                  ))
                : null}

              {/* Safe-zone frame — a dashed accent guide with bright corner ticks
                  and a labelled tab: the component's concept, drawn. */}
              {overlay.showZone ? (
                <g className="mk-aszg-zone">
                  <rect
                    x={overlay.zx}
                    y={overlay.zy}
                    width={overlay.zw}
                    height={overlay.zh}
                    rx={overlay.radius}
                    fill={azure}
                    fillOpacity={round1(clamp(0.05 * overlay.zoneDim, 0, 0.1))}
                    stroke={azure}
                    strokeOpacity={round1(clamp(0.6 * overlay.zoneDim, 0, 1))}
                    strokeWidth={round1(1.6 * overlay.ui)}
                    strokeDasharray={`${round1(7 * overlay.ui)} ${round1(6 * overlay.ui)}`}
                  />
                  {[
                    [overlay.zx, overlay.zy, 1, 1],
                    [overlay.zx + overlay.zw, overlay.zy, -1, 1],
                    [overlay.zx, overlay.zy + overlay.zh, 1, -1],
                    [overlay.zx + overlay.zw, overlay.zy + overlay.zh, -1, -1],
                  ].map(([tx, ty, sx, sy], i) => {
                    const t = round1(11 * overlay.ui);
                    return (
                      <path
                        key={i}
                        d={`M ${round1(tx + sx * t)} ${ty} L ${tx} ${ty} L ${tx} ${round1(ty + sy * t)}`}
                        fill="none"
                        stroke={azure}
                        strokeOpacity={round1(clamp(0.95 * overlay.zoneDim, 0, 1))}
                        strokeWidth={round1(2 * overlay.ui)}
                        strokeLinecap="round"
                      />
                    );
                  })}
                  <g transform={`translate(${overlay.zx} ${round1(overlay.zy - overlay.tabH)})`}>
                    <rect
                      className="mk-aszg-tab"
                      width={overlay.tabW}
                      height={overlay.tabH}
                      rx={round1(6 * overlay.ui)}
                      fill={azure}
                      fillOpacity={round1(clamp(0.92 * overlay.zoneDim, 0, 1))}
                    />
                    <text
                      x={round1(overlay.tabW / 2)}
                      y={round1(overlay.tabH / 2 + 1)}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontFamily={uiFont}
                      fontSize={overlay.tabFs}
                      fontWeight={700}
                      letterSpacing={round1(1.2 * overlay.ui)}
                      fill={accentFg}
                      fillOpacity={round1(clamp(overlay.zoneDim, 0, 1))}
                    >
                      {overlay.tabText}
                    </text>
                  </g>
                </g>
              ) : null}

              {/* Column axis ticks over the lit block. */}
              {overlay.ticks.map((t, i) => (
                <text
                  key={i}
                  className="mk-aszg-uitext"
                  x={t.x}
                  y={t.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily={uiFont}
                  fontSize={overlay.tickFs}
                  fontWeight={600}
                  letterSpacing={round1(0.5 * overlay.ui)}
                  fill={mutedTok}
                  fillOpacity={round1(clamp(0.75 * overlay.zoneDim, 0, 1))}
                >
                  {t.text}
                </text>
              ))}

              {/* Glassy live-metric chips. */}
              {overlay.chips.map((c, i) => (
                <g key={i} className="mk-aszg-chip">
                  <rect
                    className="mk-aszg-glow2"
                    x={round1(c.bx - 3)}
                    y={round1(c.by + 3)}
                    width={round1(c.w + 6)}
                    height={c.h}
                    rx={round1(c.h / 2)}
                    fill={azure}
                    fillOpacity={round1(clamp(0.12 * c.dim, 0, 0.2))}
                    filter={`url(#aszg-glow-${uid})`}
                  />
                  <rect
                    className="mk-aszg-chip-bg"
                    x={c.bx}
                    y={c.by}
                    width={c.w}
                    height={c.h}
                    rx={round1(c.h / 2)}
                    fill={surfaceTok}
                    fillOpacity={round1(clamp(0.94 * c.dim, 0, 1))}
                    stroke={borderTok}
                    strokeOpacity={round1(clamp(c.dim, 0, 1))}
                    strokeWidth={overlay.ui}
                  />
                  <circle
                    cx={c.dotX}
                    cy={c.cy}
                    r={c.dotR}
                    fill={successTok}
                    fillOpacity={round1(clamp(c.dim, 0, 1))}
                  />
                  <text
                    className="mk-aszg-uitext"
                    x={c.valueX}
                    y={round1(c.cy + 1)}
                    dominantBaseline="central"
                    fontFamily={uiFont}
                    fontSize={c.fs}
                    fontWeight={700}
                    fill={fgTok}
                    fillOpacity={round1(clamp(c.dim, 0, 1))}
                  >
                    {c.value}
                  </text>
                  <text
                    className="mk-aszg-uitext"
                    x={c.labelX}
                    y={round1(c.cy + 1)}
                    dominantBaseline="central"
                    fontFamily={uiFont}
                    fontSize={c.ls}
                    fontWeight={500}
                    fill={mutedTok}
                    fillOpacity={round1(clamp(0.85 * c.dim, 0, 1))}
                  >
                    {c.label}
                  </text>
                </g>
              ))}
            </g>
          ) : null}
        </svg>

        <style dangerouslySetInnerHTML={{ __html: css }} />
      </div>

      {children != null ? (
        <>
          {/* Glass scrim behind the copy: a soft wash + feathered backdrop blur so
              text stays readable while the full-bleed grid continues underneath —
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

export default AdaptiveSafeZoneGrid;
