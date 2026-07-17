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
} from "@/lib/motionstack";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/** A cell address in the matrix: `row` = region/stream, `col` = time/lane. */
export interface MatrixCell {
  row: number;
  col: number;
}

export type EventSeverity = "info" | "warning" | "critical" | number;

/** Which way an event propagates through the grid from its origin cell. */
export type PropagationDirection = "forward" | "out" | "down";

export interface EventData {
  /** Stable id (used for deterministic fallback placement). */
  id: string;
  /** Origin cell. If omitted, derived deterministically from `id` + seed. */
  origin?: MatrixCell;
  /** Alternative origin as a region row index — placed at a stable column. */
  originId?: number;
  /** Free-form category label — biases hue toward the secondary accent. */
  category?: string;
  /** Severity — drives reach + color (never color alone; see glyph/weight). */
  severity?: EventSeverity;
  /** Propagation shape along the matrix. Default "out". */
  direction?: PropagationDirection;
  /** Region rows (row indices) this event also reaches. */
  affectedRegions?: number[];
  /** Acknowledged events dim and carry a check glyph. */
  acknowledged?: boolean;
  /** Failed propagation halts early and is marked with a × glyph. */
  failed?: boolean;
  /** Old/settled events render quietly in the history band (no propagation). */
  history?: boolean;
}

export interface MatrixRect {
  /** 0–1 left edge of the readable safe area. */
  x: number;
  /** 0–1 top edge of the readable safe area. */
  y: number;
  /** 0–1 width of the readable safe area. */
  w: number;
  /** 0–1 height of the readable safe area. */
  h: number;
}

export interface EventPropagationMatrixProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Application-defined events. Omit to render a deterministic default set. */
  events?: EventData[];
  /** Matrix rows (regions/streams). */
  rows?: number;
  /** Matrix columns (time/lanes). */
  cols?: number;
  /**
   * Where the foreground content sits. Sets a strict readable region: the matrix
   * runs full-bleed and a frosted-glass scrim behind the copy keeps text readable
   * (readability via blur, not a hard cut), while base cells soften and labels
   * drop out there. "none" = full-bleed matrix with no scrim (legacy `safeArea`
   * still applies if given).
   */
  contentPlacement?: ContentPlacement;
  /** Extra ramp width (0–1) over which the matrix fades back in past content. */
  safeAreaPadding?: number;
  /** How strongly the matrix is suppressed behind content (0–1). */
  safeAreaStrength?: number;
  /** Show text labels (history annotations). Default true (auto-hidden near content). */
  showLabels?: boolean;
  /** Hide labels that fall inside/near the readable region. Default true. */
  hideLabelsNearContent?: boolean;
  /** Region where the matrix quiets so foreground text stays readable (0–1). Legacy; prefer `contentPlacement`. */
  safeArea?: MatrixRect;
  /** Base-cell density multiplier (~0.5–1.6). */
  density?: number;
  /** Overall luminance/opacity of the field (0–1.4). */
  intensity?: number;
  /** Propagation speed multiplier. 0 stops motion (still legible). */
  speed?: number;
  /** Pointer highlights the nearest lane (never the sole effect). */
  interactive?: boolean;
  /** Pause propagation when scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
  /** Deterministic seed for the generated defaults (SSR-stable). */
  seed?: number;
  /** Force the static, motion-free variant regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Deterministic geometry                                                     */
/* -------------------------------------------------------------------------- */

/** Fixed logical field; the SVG scales to any container via `slice`. */
const W = 1200;
const H = 760;
const PAD_X = 84;
const PAD_Y = 96;

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
const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

type Level = "info" | "warning" | "critical";

function levelOf(sev: EventSeverity | undefined): Level {
  if (typeof sev === "number") return sev >= 0.66 ? "critical" : sev >= 0.33 ? "warning" : "info";
  return sev ?? "info";
}

/** Reach (in cells) before propagation fades — bounded so overlap stays calm. */
const REACH: Record<Level, number> = { info: 3, warning: 4, critical: 5 };

interface Placed {
  cx: number;
  cy: number;
}

/** Grid → pixel center of a cell. */
function cellCenter(row: number, col: number, rows: number, cols: number): Placed {
  const stepX = cols > 1 ? (W - 2 * PAD_X) / (cols - 1) : 0;
  const stepY = rows > 1 ? (H - 2 * PAD_Y) / (rows - 1) : 0;
  return { cx: round1(PAD_X + col * stepX), cy: round1(PAD_Y + row * stepY) };
}

interface PulseCell {
  row: number;
  col: number;
  cx: number;
  cy: number;
  reach: number;
  /** Per-cell overlap damping (1 = first arrival, lower for later overlaps). */
  damp: number;
  /** Parent cell (one step toward the origin) for the grid link, if any. */
  parent?: { row: number; col: number; cx: number; cy: number };
}

interface ResolvedEvent {
  id: string;
  level: Level;
  origin: MatrixCell;
  ox: number;
  oy: number;
  failed: boolean;
  acknowledged: boolean;
  category?: string;
  cells: PulseCell[];
  delayStep: number;
  eventOffset: number;
}

/** Directional reach metric — `undefined` means the cell is not on this wave. */
function reachOf(
  dir: PropagationDirection,
  dr: number,
  dc: number,
): number | undefined {
  if (dir === "forward") return dc < 0 ? undefined : dc + Math.abs(dr) * 1.4;
  if (dir === "down") return dr < 0 ? undefined : dr + Math.abs(dc) * 1.4;
  return Math.abs(dr) + Math.abs(dc); // "out"
}

/**
 * Resolve one event into the set of matrix cells its wave reaches, each tagged
 * with a propagation distance (drives animation-delay) and a parent link so the
 * wave reads as travelling *through the grid*, not as a free-space circle.
 */
function resolveEvent(
  ev: EventData,
  index: number,
  rows: number,
  cols: number,
  seed: number,
): ResolvedEvent {
  const rng = makeRng((seed >>> 0) + index * 0x9e3779b1 + ev.id.length * 131);
  const origin: MatrixCell =
    ev.origin ??
    (ev.originId != null
      ? { row: clamp(ev.originId, 0, rows - 1), col: Math.max(0, Math.round(cols * 0.2)) }
      : { row: Math.floor(rng() * rows), col: Math.floor(rng() * cols) });
  const r0 = clamp(Math.round(origin.row), 0, rows - 1);
  const c0 = clamp(Math.round(origin.col), 0, cols - 1);
  const o = cellCenter(r0, c0, rows, cols);
  const level = levelOf(ev.severity);
  const dir = ev.direction ?? "out";
  const failed = ev.failed === true;
  // Failed propagation halts early; healthy waves reach their severity radius.
  const maxReach = failed ? 1.6 : REACH[level];

  const cells: PulseCell[] = [];
  const seen = new Set<string>();
  const push = (row: number, col: number, reach: number) => {
    const key = `${row},${col}`;
    if (seen.has(key)) return;
    seen.add(key);
    const c = cellCenter(row, col, rows, cols);
    cells.push({ row, col, cx: c.cx, cy: c.cy, reach, damp: 1 });
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const reach = reachOf(dir, r - r0, c - c0);
      if (reach === undefined || reach > maxReach) continue;
      push(r, c, round2(reach));
    }
  }
  // Regions the app explicitly names light as whole rows (Manhattan arrival).
  if (!failed && ev.affectedRegions) {
    for (const rr of ev.affectedRegions) {
      const row = clamp(Math.round(rr), 0, rows - 1);
      for (let c = 0; c < cols; c++) {
        push(row, c, round2(Math.abs(row - r0) + Math.abs(c - c0)));
      }
    }
  }

  // Attach each cell to a parent one orthogonal step closer to the origin so the
  // links trace the grid lattice (never a diagonal shortcut through open space).
  const byKey = new Map(cells.map((c) => [`${c.row},${c.col}`, c]));
  for (const cell of cells) {
    if (cell.row === r0 && cell.col === c0) continue;
    const cands: PulseCell[] = [];
    const nb = [
      [cell.row - 1, cell.col],
      [cell.row + 1, cell.col],
      [cell.row, cell.col - 1],
      [cell.row, cell.col + 1],
    ];
    for (const [nr, nc] of nb) {
      const p = byKey.get(`${nr},${nc}`);
      if (p && p.reach < cell.reach) cands.push(p);
    }
    cands.sort((a, b) => a.reach - b.reach);
    const p = cands[0];
    if (p) cell.parent = { row: p.row, col: p.col, cx: p.cx, cy: p.cy };
  }

  return {
    id: ev.id,
    level,
    origin: { row: r0, col: c0 },
    ox: o.cx,
    oy: o.cy,
    failed,
    acknowledged: ev.acknowledged === true,
    category: ev.category,
    cells,
    // Wave step per cell of distance — critical waves travel a touch faster.
    delayStep: level === "critical" ? 0.16 : 0.2,
    eventOffset: round2(index * 0.85),
  };
}

/** History marks — settled events shown as quiet ticks in a bottom band. */
interface HistoryMark {
  x: number;
  y: number;
  failed: boolean;
}

function defaultEvents(): EventData[] {
  return [
    { id: "evt-ingest", origin: { row: 1, col: 1 }, category: "webhook", severity: "info", direction: "forward" },
    { id: "evt-fanout", origin: { row: 3, col: 4 }, category: "audit", severity: "warning", direction: "out", affectedRegions: [4] },
    { id: "evt-deadletter", origin: { row: 2, col: 6 }, category: "delivery", severity: "critical", direction: "out", failed: true },
    { id: "evt-ack", origin: { row: 4, col: 2 }, category: "audit", severity: "warning", direction: "down", acknowledged: true },
    { id: "evt-old-1", severity: "info", history: true },
    { id: "evt-old-2", severity: "critical", history: true, failed: true },
  ];
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * EventPropagationMatrix — a temporal background for event-driven, webhook, and
 * audit products. The field is a *structured cell matrix* (rows = regions/
 * streams, cols = time/lanes). Each event lights its origin cell and then
 * propagates cell-by-cell *along the grid* with an increasing per-cell delay, so
 * it reads as a wave travelling THROUGH the matrix — not a free-space ripple.
 * Multiple events overlap without chaos (bounded reach + capped per-cell peak),
 * failed propagation halts and is marked with a non-color × glyph, acknowledged
 * events dim behind a check glyph, and old events settle into a quiet history
 * band. SVG + CSS keyframes only — no canvas, no per-frame React state, and no
 * `Math.random`/`Date.now` at render, so server and client render identical
 * markup. Decorative: the field runs full-bleed and renders `children` over a
 * frosted-glass scrim, so the matrix stays visible (blurred) behind the copy
 * rather than being masked away. Clean-room original.
 */
export function EventPropagationMatrix({
  events,
  rows = 6,
  cols = 10,
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
}: EventPropagationMatrixProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `mk-epm-${uid}`;
  const bgRef = React.useRef<HTMLDivElement | null>(null);

  const systemReduced = useReducedMotion();
  const staticMode = reducedMotion === true;
  const onScreen = useVisibilityPause(bgRef, { threshold: 0.01 });
  const paused = pauseWhenHidden && !onScreen;

  const nrows = Math.max(2, Math.round(rows));
  const ncols = Math.max(2, Math.round(cols));
  const mobileRows = Math.min(nrows, 4);
  const mobileCols = Math.min(ncols, 6);

  // Container size, measured after mount so the field can reflow into an open
  // band on narrow/stacked layouts. Initialised to a desktop default so the
  // server and the first client render agree (no hydration mismatch); the
  // ResizeObserver updates it a frame later.
  const [box, setBox] = React.useState<{ w: number; h: number }>({ w: W, h: H });
  React.useEffect(() => {
    const el = bgRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth || W;
      const h = el.clientHeight || H;
      setBox((prev) => (Math.abs(prev.w - w) < 0.5 && Math.abs(prev.h - h) < 0.5 ? prev : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Narrow containers get a smaller, better-spaced matrix so cells stay legible
  // once the field is packed into a short band (the outer lanes/rows would be
  // near-invisible on a phone).
  const narrow = box.w < 640;
  const effRows = narrow ? Math.min(nrows, 4) : nrows;
  const effCols = narrow ? Math.min(ncols, 6) : ncols;

  const model = React.useMemo(() => {
    const src = events && events.length ? events : defaultEvents();
    const live: ResolvedEvent[] = [];
    const history: HistoryMark[] = [];

    // Bound the number of concurrently propagating events so overlap stays calm.
    const liveSrc = src.filter((e) => !e.history).slice(0, 4);
    liveSrc.forEach((e, i) => live.push(resolveEvent(e, i, effRows, effCols, seed)));

    // Cap per-cell intensity: when several waves reach the same cell, later
    // arrivals are damped so a busy cell never blows out. Computed once here so
    // render stays pure (no mutation during render).
    const hits = new Map<string, number>();
    for (const e of live) {
      for (const cell of e.cells) {
        if (cell.row === e.origin.row && cell.col === e.origin.col) continue;
        const key = `${cell.row},${cell.col}`;
        const prior = hits.get(key) ?? 0;
        hits.set(key, prior + 1);
        cell.damp = prior === 0 ? 1 : prior === 1 ? 0.6 : 0.4;
      }
    }

    const historySrc = src.filter((e) => e.history);
    const hy = H - PAD_Y * 0.42;
    historySrc.forEach((e, i) => {
      const rng = makeRng((seed >>> 0) + 977 + i * 40503);
      const n = 4 + Math.round(rng() * 4);
      for (let k = 0; k < n; k++) {
        history.push({
          x: round1(PAD_X + rng() * (W - 2 * PAD_X)),
          y: round1(hy + (rng() - 0.5) * 22),
          failed: e.failed === true && rng() < 0.4,
        });
      }
    });

    // Base matrix dots at every intersection (faint), thinned by density.
    const baseDots: Array<{ cx: number; cy: number; row: number; col: number; o: number }> = [];
    const rng = makeRng((seed >>> 0) + 17);
    for (let r = 0; r < effRows; r++) {
      for (let c = 0; c < effCols; c++) {
        const p = cellCenter(r, c, effRows, effCols);
        const keep = density >= 1 || rng() < clamp(density, 0.35, 1);
        if (!keep) continue;
        baseDots.push({ cx: p.cx, cy: p.cy, row: r, col: c, o: round2(0.14 + rng() * 0.08) });
      }
    }

    // Ambient signal motes — deterministic faint sparks scattered across the WHOLE
    // field (not only grid intersections) so no corner reads as dead space. They
    // twinkle gently and quiet behind the copy via the same falloff as everything
    // else. Same idea as the canvas sibling's motes, in SVG.
    const mrng = makeRng((seed >>> 0) + 0x51ed3);
    const mx0 = PAD_X - 14;
    const mx1 = W - PAD_X + 14;
    const my0 = PAD_Y - 14;
    const my1 = H - PAD_Y + 14;
    const motes = Array.from({ length: 56 }, () => ({
      x: round1(mx0 + mrng() * (mx1 - mx0)),
      y: round1(my0 + mrng() * (my1 - my0)),
      r: round2(0.7 + mrng() * 1.7),
      warm: mrng() > 0.66,
      o: round2(0.16 + mrng() * 0.18),
      delay: round2(mrng() * 5),
      dur: round2(2.8 + mrng() * 3.4),
    }));

    return { live, history, baseDots, motes };
  }, [events, effRows, effCols, density, seed]);

  // Pointer lane highlight — writes CSS vars only (no per-frame React re-render).
  React.useEffect(() => {
    const el = bgRef.current;
    if (!el || !interactive || staticMode) return;
    let raf = 0;
    let nx = W / 2;
    const apply = () => {
      raf = 0;
      el.style.setProperty("--epm-cx", String(round1(nx)));
      el.style.setProperty("--epm-cursor", "1");
    };
    const onMove = (e: PointerEvent) => {
      if (systemReduced) return;
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      // Snap to the nearest lane so the highlight rides the matrix, not the cursor.
      const raw = ((e.clientX - r.left) / r.width) * W;
      const stepX = ncols > 1 ? (W - 2 * PAD_X) / (ncols - 1) : 0;
      const col = clamp(Math.round((raw - PAD_X) / (stepX || 1)), 0, ncols - 1);
      nx = PAD_X + col * stepX;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => el.style.setProperty("--epm-cursor", "0");
    const host = el.parentElement ?? el;
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [interactive, staticMode, systemReduced, ncols]);

  // Composition: a strict content-placement preset. The matrix runs full-bleed;
  // a frosted-glass scrim behind the copy (not a CSS mask) keeps text readable, so
  // the field stays visible under the copy. Base cells still soften and labels
  // drop there. Legacy `safeArea` (no placement) keeps the elliptical SVG mask.
  const comp = React.useMemo(
    () => resolveComposition({ contentPlacement, safeArea, safeAreaPadding, safeAreaStrength }),
    [contentPlacement, safeArea, safeAreaPadding, safeAreaStrength],
  );
  const scrimStyle = comp.hasSafe ? compositionScrimStyle(comp) : undefined;
  const falloff = React.useMemo(() => contentFalloff(comp), [comp]);
  const showLabel = (x01: number, y01: number) =>
    showLabels && !(hideLabelsNearContent && comp.hasSafe && labelHiddenAt(comp, x01, y01));

  const legacySafe = safeArea ?? { x: 0.04, y: 0.16, w: 0.48, h: 0.68 };
  const sa = {
    cx: (legacySafe.x + legacySafe.w / 2) * W,
    cy: (legacySafe.y + legacySafe.h / 2) * H,
    rx: (legacySafe.w / 2) * W * 1.14,
    ry: (legacySafe.h / 2) * H * 1.14,
  };

  const cyc = round1(clamp(5 / (speed > 0 ? speed : 1), 2, 16));
  const laneW = effCols > 1 ? round1((W - 2 * PAD_X) / (effCols - 1)) : 60;

  const colorFor = (e: ResolvedEvent): string => {
    if (e.failed) return "var(--color-error)";
    if (e.category === "webhook") return "var(--color-secondary-accent, var(--color-info))";
    if (e.level === "critical") return "var(--color-error)";
    if (e.level === "warning") return "var(--color-warning)";
    return "var(--color-accent)";
  };

  /* -- Adaptive band layout --------------------------------------------------
     On a stacked layout (content top/bottom, or a narrow container) the wide
     logical field is packed into an open band on the free side and scaled up so
     cells, waves, and glyphs read at a comfortable on-screen size — instead of
     the fixed-viewBox "slice" cropping the matrix to a faint middle strip. On a
     roomy desktop we keep the original full-bleed field. Everything below is
     derived from the post-mount `box`, so it never differs at hydration. */
  const stacked =
    contentPlacement === "top" ||
    contentPlacement === "bottom" ||
    (narrow && (contentPlacement === "left" || contentPlacement === "right"));
  const bandMode = narrow || stacked;
  // A narrow layout also lifts contrast so the field pops on a small, dim phone.
  const vivid = narrow ? 1.4 : 1;

  // Behind-copy softening for the full-bleed desktop field: instead of masking the
  // matrix away, keep it lit and only dim it toward the copy (floor ~0.6) so it
  // reads as a live matrix behind frosted glass — the scrim's blur does the
  // readability work. In band mode the field is remapped to the measured box, so
  // logical falloff no longer tracks screen position; there the scrim alone softens.
  const softFall = (x01: number, y01: number) =>
    comp.hasSafe && !bandMode ? round2(0.58 + 0.42 * falloff(x01, y01)) : 1;

  const gridStepX = effCols > 1 ? (W - 2 * PAD_X) / (effCols - 1) : 0;
  const gridStepY = effRows > 1 ? (H - 2 * PAD_Y) / (effRows - 1) : 0;

  // Whether the quiet history band is drawn — full-bleed desktop only; a packed
  // mobile band stays focused on the live matrix.
  const showHistory = !bandMode;

  // Logical bounding box of the drawn field (grid + a margin for origin rings).
  const fieldPad = bandMode ? 44 : 18;
  const fieldY1 = showHistory ? H - PAD_Y * 0.42 : H - PAD_Y;
  const field = {
    x: PAD_X - fieldPad,
    y: PAD_Y - fieldPad,
    w: W - 2 * PAD_X + 2 * fieldPad,
    h: fieldY1 - PAD_Y + 2 * fieldPad,
  };

  // Target band (fractions of the measured box). With the glass-scrim architecture
  // the field no longer dodges to a "free" side — in band mode it fills the whole
  // measured box (full-bleed behind the copy on narrow/stacked layouts); the scrim
  // keeps the copy readable. `upperBand`/`lowerBand` still steer the stage light.
  const upperBand = contentPlacement === "bottom";
  const lowerBand = contentPlacement === "top" || (narrow && (contentPlacement === "left" || contentPlacement === "right"));
  const band = { x: 0.02, y: 0.03, w: 0.96, h: 0.94 };

  // Band mode maps the logical field into the measured box with INDEPENDENT x/y
  // scales, so the matrix fills the whole frame (no letterboxed strip) on a tall
  // phone. Marks are drawn at fixed on-screen px sizes and grid/glyph geometry is
  // axis-aligned, so nothing distorts — only the cell spacing stretches (a grid
  // with non-square cells is still a grid). Same trick as the canvas sibling,
  // which maps node positions by box.w/box.h separately and draws fixed-size dots.
  const bandPx = { x: band.x * box.w, y: band.y * box.h, w: band.w * box.w, h: band.h * box.h };
  // Identity map rounds to round1 (matching `cellCenter`) so grid lanes and the
  // cells that snap to them share byte-identical coordinates (SSR-stable).
  const MX = bandMode
    ? (x: number) => round2(bandPx.x + ((x - field.x) / field.w) * bandPx.w)
    : (x: number) => round1(x);
  const MY = bandMode
    ? (y: number) => round2(bandPx.y + ((y - field.y) / field.h) * bandPx.h)
    : (y: number) => round1(y);

  // Radii/strokes are already in the render coordinate system (box px in band
  // mode, logical units on desktop), so no fit-scale compensation is needed.
  const rk = 1;
  const vecStroke = undefined;

  const viewBox = bandMode ? `0 0 ${round1(box.w)} ${round1(box.h)}` : `0 0 ${W} ${H}`;
  const par = bandMode ? "xMidYMid meet" : "xMidYMid slice";

  const gridStroke = `color-mix(in oklab, var(--color-border-strong, var(--color-border)) ${round1(clamp(78 * intensity * vivid, 42, 96))}%, transparent)`;
  const dotFill = `color-mix(in oklab, var(--color-fg) ${round1(clamp(24 * intensity * vivid, 12, 42))}%, transparent)`;

  /* Baked stage lighting — a lit backdrop so the component reads as premium
     wherever it renders (catalog card, hero, or a customer install), not a flat
     dark box. A cool accent spotlight sits over the graphic's focal side, a soft
     floor lift adds ground, and a corner vignette frames the field. Token-driven
     via stop colors → correct in light and dark. Positions follow the copy so the
     light always lands on the open (graphic) side. Same spirit as the canvas
     sibling's `withAlpha` spotlight, expressed with SVG gradients. */
  const glow = clamp(intensity, 0, 1.4);
  const spotX = contentPlacement === "left" ? 68 : contentPlacement === "right" ? 32 : 50;
  const spotY = upperBand ? 30 : lowerBand ? 68 : 46;
  const spotCore = round2(clamp(0.22 * glow, 0, 0.4));
  const spotMid = round2(clamp(0.08 * glow, 0, 0.16));
  const floorOp = round2(clamp(0.08 * glow, 0, 0.15));

  // Hide the outer lanes/rows on small screens so mobile shows a smaller matrix.
  const mobileHide: string[] = [];
  for (let c = mobileCols; c < ncols; c++) mobileHide.push(`.${cls} [data-c="${c}"]`);
  for (let r = mobileRows; r < nrows; r++) mobileHide.push(`.${cls} [data-r="${r}"]`);

  const css = `
.${cls} { position: absolute; inset: 0; }
.${cls} svg { width: 100%; height: 100%; display: block; }
.${cls} .mk-epm-pulse, .${cls} .mk-epm-origin {
  transform-box: fill-box; transform-origin: center;
  opacity: var(--pk, 0.4);
}
.${cls} .mk-epm-link { opacity: var(--pk, 0.24); }
.${cls} .mk-epm-mote { opacity: var(--mo, 0.2); }
.${cls}.mk-epm-animated .mk-epm-mote {
  animation: ${cls}-twinkle var(--mdur, 4s) ease-in-out infinite;
  animation-delay: var(--md, 0s);
}
.${cls}.mk-epm-animated .mk-epm-pulse {
  animation: ${cls}-arrive var(--cyc, 5s) ease-out infinite backwards;
  animation-delay: var(--dl, 0s);
}
.${cls}.mk-epm-animated .mk-epm-link {
  animation: ${cls}-trace var(--cyc, 5s) ease-out infinite backwards;
  animation-delay: var(--dl, 0s);
}
.${cls}.mk-epm-animated .mk-epm-origin {
  animation: ${cls}-emit var(--cyc, 5s) ease-in-out infinite;
  animation-delay: var(--dl, 0s);
}
@keyframes ${cls}-arrive {
  0% { opacity: 0; transform: scale(0.45); }
  16% { opacity: var(--pk, 0.4); transform: scale(1); }
  55% { opacity: calc(var(--pk, 0.4) * 0.42); transform: scale(0.94); }
  100% { opacity: 0; transform: scale(0.86); }
}
@keyframes ${cls}-trace {
  0% { opacity: 0; }
  16% { opacity: var(--pk, 0.24); }
  70% { opacity: calc(var(--pk, 0.24) * 0.3); }
  100% { opacity: 0; }
}
@keyframes ${cls}-emit {
  0%, 100% { opacity: 0.85; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.12); }
}
@keyframes ${cls}-twinkle {
  0%, 100% { opacity: calc(var(--mo, 0.2) * 0.4); }
  50% { opacity: var(--mo, 0.2); }
}
.${cls}[data-paused="true"] .mk-epm-pulse,
.${cls}[data-paused="true"] .mk-epm-link,
.${cls}[data-paused="true"] .mk-epm-mote,
.${cls}[data-paused="true"] .mk-epm-origin { animation-play-state: paused !important; }
${interactive ? `.${cls} .mk-epm-lane {
  transform: translateX(calc((var(--epm-cx, 600) - ${round1(laneW / 2)}) * 1px));
  opacity: calc(var(--epm-cursor, 0) * 0.5);
}` : ""}
@media (max-width: 640px) {
${mobileHide.length ? `  ${mobileHide.join(",\n  ")} { display: none; }` : ""}
}
@media (prefers-reduced-motion: reduce) {
  .${cls} .mk-epm-pulse, .${cls} .mk-epm-link, .${cls} .mk-epm-mote, .${cls} .mk-epm-origin { animation: none !important; }
}
/* Forced-colors: drop tints/masks and fall back to plain CanvasText strokes so
   the matrix, origins, and status glyphs stay legible. */
@media (forced-colors: active) {
  .${cls} .mk-epm-wash, .${cls} .mk-epm-lane, .${cls} .mk-epm-pulse, .${cls} .mk-epm-link, .${cls} .mk-epm-mote { display: none; }
  .${cls} svg { forced-color-adjust: none; }
  .${cls} .mk-epm-grid { stroke: CanvasText !important; stroke-opacity: 0.4 !important; }
  .${cls} .mk-epm-dot { fill: CanvasText !important; }
  .${cls} .mk-epm-origin { fill: Canvas !important; stroke: CanvasText !important; opacity: 1 !important; }
  .${cls} .mk-epm-glyph { stroke: CanvasText !important; }
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
          !staticMode && "mk-epm-animated",
        )}
      >
        <svg viewBox={viewBox} preserveAspectRatio={par} role="presentation">
          <defs>
            {/* Cool accent spotlight over the graphic's focal side. */}
            <radialGradient id={`epm-spot-${uid}`} cx={`${spotX}%`} cy={`${spotY}%`} r="72%">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={spotCore} />
              <stop offset="40%" stopColor="var(--color-secondary-accent, var(--color-info))" stopOpacity={spotMid} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </radialGradient>
            {/* Soft floor lift from the bottom edge for ground/depth. */}
            <linearGradient id={`epm-floor-${uid}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={floorOp} />
              <stop offset="55%" stopColor="var(--color-accent)" stopOpacity="0" />
            </linearGradient>
            {/* Corner vignette that frames the field (bg color → deepens edges). */}
            <radialGradient id={`epm-vig-${uid}`} cx="50%" cy="50%" r="75%">
              <stop offset="52%" stopColor="var(--color-bg)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--color-bg)" stopOpacity="0.55" />
            </radialGradient>
            <radialGradient id={`epm-safegrad-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgb(20,20,20)" />
              <stop offset="62%" stopColor="rgb(120,120,120)" />
              <stop offset="100%" stopColor="#fff" />
            </radialGradient>
            <mask id={`epm-safe-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
              <rect x="0" y="0" width={W} height={H} fill="#fff" />
              <ellipse cx={round1(sa.cx)} cy={round1(sa.cy)} rx={round1(sa.rx)} ry={round1(sa.ry)} fill={`url(#epm-safegrad-${uid})`} />
            </mask>
          </defs>

          {/* Baked stage lighting (backdrop, under the matrix). */}
          <rect className="mk-epm-wash" x="0" y="0" width="100%" height="100%" fill={`url(#epm-spot-${uid})`} />
          <rect className="mk-epm-wash" x="0" y="0" width="100%" height="100%" fill={`url(#epm-floor-${uid})`} />
          <rect className="mk-epm-wash" x="0" y="0" width="100%" height="100%" fill={`url(#epm-vig-${uid})`} />

          <g mask={comp.hasSafe || bandMode ? undefined : `url(#epm-safe-${uid})`}>
            {/* Structural grid lines — the matrix the events propagate through. */}
            <g className="mk-epm-grid-group" stroke={gridStroke} strokeWidth={bandMode ? 1.1 : 1} vectorEffect={vecStroke} fill="none">
              {Array.from({ length: effCols }).map((_, c) => (
                <line
                  key={`vl-${c}`}
                  className="mk-epm-grid"
                  data-c={c}
                  x1={MX(PAD_X + c * gridStepX)}
                  y1={MY(PAD_Y)}
                  x2={MX(PAD_X + c * gridStepX)}
                  y2={MY(H - PAD_Y)}
                  strokeOpacity={bandMode ? 0.72 : 0.55}
                  vectorEffect={vecStroke}
                />
              ))}
              {Array.from({ length: effRows }).map((_, r) => (
                <line
                  key={`hl-${r}`}
                  className="mk-epm-grid"
                  data-r={r}
                  x1={MX(PAD_X)}
                  y1={MY(PAD_Y + r * gridStepY)}
                  x2={MX(W - PAD_X)}
                  y2={MY(PAD_Y + r * gridStepY)}
                  strokeOpacity={bandMode ? 0.72 : 0.55}
                  vectorEffect={vecStroke}
                />
              ))}
            </g>

            {/* Faint base cells at intersections. Full-bleed: cells stay drawn
                everywhere (including behind the copy) and only soften toward it
                (floor ~0.6) so the matrix reads as lit under the frosted-glass
                scrim instead of being cut away. */}
            {model.baseDots.map((d, i) => (
              <circle
                key={`dot-${i}`}
                className="mk-epm-dot"
                data-r={d.row}
                data-c={d.col}
                cx={MX(d.cx)}
                cy={MY(d.cy)}
                r={round2((bandMode ? 2.6 : 2) * rk)}
                fill={dotFill}
                fillOpacity={round2(clamp(d.o * vivid * softFall(d.cx / W, d.cy / H), 0, 0.5))}
              />
            ))}

            {/* Ambient signal motes — faint sparks filling the whole field so no
                region reads as dead. Full-bleed: kept everywhere, softened toward
                the copy on desktop by the same floor as the base cells. */}
            {model.motes.map((m, i) => (
              <circle
                key={`mote-${i}`}
                className="mk-epm-mote"
                cx={MX(m.x)}
                cy={MY(m.y)}
                r={round2(m.r * rk)}
                fill={m.warm ? "var(--color-accent)" : "var(--color-secondary-accent, var(--color-info))"}
                style={{
                  "--mo": round2(clamp(m.o * intensity * vivid * softFall(m.x / W, m.y / H), 0, 0.55)),
                  "--md": `${m.delay}s`,
                  "--mdur": `${m.dur}s`,
                } as React.CSSProperties}
              />
            ))}

            {/* Live propagation — links first (behind), then arriving cells. */}
            {model.live.map((e) => {
              const color = colorFor(e);
              const ackScale = e.acknowledged ? 0.5 : 1;
              return (
                <g key={e.id} style={{ "--cyc": `${cyc}s` } as React.CSSProperties}>
                  {/* Grid links from each cell back to its parent (wave path). */}
                  {e.cells.map((cell, ci) => {
                    if (!cell.parent) return null;
                    const dl = round2(e.eventOffset + cell.reach * e.delayStep);
                    const pk = round2(clamp(0.34 * intensity * vivid * ackScale * softFall(cell.cx / W, cell.cy / H), 0.08, 0.52));
                    return (
                      <line
                        key={`lnk-${e.id}-${ci}`}
                        className="mk-epm-link"
                        data-r={cell.row}
                        data-c={cell.col}
                        x1={MX(cell.parent.cx)}
                        y1={MY(cell.parent.cy)}
                        x2={MX(cell.cx)}
                        y2={MY(cell.cy)}
                        stroke={color}
                        strokeWidth={bandMode ? 1.6 : 1.4}
                        strokeLinecap="round"
                        vectorEffect={vecStroke}
                        style={{ "--dl": `${dl}s`, "--pk": pk } as React.CSSProperties}
                      />
                    );
                  })}
                  {/* Arriving cells. First-arrival at each cell gets full peak; a
                      later overlap from another event is damped (per-cell cap). */}
                  {e.cells.map((cell, ci) => {
                    const isOrigin = cell.row === e.origin.row && cell.col === e.origin.col;
                    if (isOrigin) return null;
                    const dl = round2(e.eventOffset + cell.reach * e.delayStep);
                    const peak = round2(clamp(0.62 * intensity * vivid * ackScale * cell.damp * softFall(cell.cx / W, cell.cy / H), 0.08, bandMode ? 0.88 : 0.7));
                    const r = round2(clamp((bandMode ? 5 : 4.5) - cell.reach * 0.35, bandMode ? 2.8 : 2.4, bandMode ? 5 : 4.5) * rk);
                    return (
                      <circle
                        key={`pls-${e.id}-${ci}`}
                        className="mk-epm-pulse"
                        data-r={cell.row}
                        data-c={cell.col}
                        cx={MX(cell.cx)}
                        cy={MY(cell.cy)}
                        r={r}
                        fill={color}
                        style={{ "--dl": `${dl}s`, "--pk": peak } as React.CSSProperties}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Origins + non-color status glyphs (drawn on top). */}
            {model.live.map((e) => {
              const color = colorFor(e);
              const strong = "var(--color-fg)";
              const ox = MX(e.ox);
              const oy = MY(e.oy);
              return (
                <g key={`org-${e.id}`} data-r={e.origin.row} data-c={e.origin.col} style={{ "--cyc": `${cyc}s` } as React.CSSProperties}>
                  <circle
                    className="mk-epm-origin"
                    cx={ox}
                    cy={oy}
                    r={round2((e.acknowledged ? 6 : 7) * rk)}
                    fill="var(--color-surface)"
                    stroke={color}
                    strokeWidth={e.failed || !e.acknowledged ? 2 : 1.4}
                    strokeOpacity={round2(clamp((e.acknowledged ? 0.55 : 0.95) * intensity, 0.3, 1))}
                    vectorEffect={vecStroke}
                    style={{ "--pk": e.acknowledged ? 0.6 : 0.95 } as React.CSSProperties}
                  />
                  {/* Status glyph — legible without color. */}
                  {e.failed ? (
                    <path
                      className="mk-epm-glyph"
                      d={`M ${round2(ox - 2.8 * rk)} ${round2(oy - 2.8 * rk)} l ${round2(5.6 * rk)} ${round2(5.6 * rk)} M ${round2(ox + 2.8 * rk)} ${round2(oy - 2.8 * rk)} l ${round2(-5.6 * rk)} ${round2(5.6 * rk)}`}
                      fill="none"
                      stroke={color}
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      vectorEffect={vecStroke}
                    />
                  ) : e.acknowledged ? (
                    <path
                      className="mk-epm-glyph"
                      d={`M ${round2(ox - 3 * rk)} ${round2(oy)} l ${round2(2 * rk)} ${round2(2.4 * rk)} l ${round2(4.2 * rk)} ${round2(-5 * rk)}`}
                      fill="none"
                      stroke="var(--color-muted)"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect={vecStroke}
                    />
                  ) : (
                    <circle className="mk-epm-glyph" cx={ox} cy={oy} r={round2(2.2 * rk)} fill={color} stroke={strong} strokeWidth={0.6} strokeOpacity={0.3} vectorEffect={vecStroke} />
                  )}
                </g>
              );
            })}

            {/* Quiet history band — old events settled into a low-opacity trail.
                Full-bleed desktop only; a packed mobile band stays focused. */}
            {showHistory ? (
            <g className="mk-epm-history" opacity={round2(clamp(0.5 * intensity, 0.2, 0.6))}>
              <line
                x1={PAD_X}
                y1={round1(H - PAD_Y * 0.42)}
                x2={W - PAD_X}
                y2={round1(H - PAD_Y * 0.42)}
                stroke="var(--color-border)"
                strokeWidth={1}
                strokeDasharray="2 8"
                strokeOpacity={0.5}
              />
              {model.history.map((h, i) =>
                !showLabel(h.x / W, h.y / H) ? null : h.failed ? (
                  <path
                    key={`hx-${i}`}
                    className="mk-epm-glyph"
                    d={`M ${h.x - 2} ${h.y - 2} l 4 4 M ${h.x + 2} ${h.y - 2} l -4 4`}
                    fill="none"
                    stroke="var(--color-muted)"
                    strokeWidth={1.2}
                    strokeLinecap="round"
                  />
                ) : (
                  <circle key={`hd-${i}`} cx={h.x} cy={h.y} r={2} fill="var(--color-muted)" fillOpacity={0.55} />
                ),
              )}
            </g>
            ) : null}

            {interactive && !bandMode ? (
              <rect className="mk-epm-lane" x={0} y={PAD_Y - 20} width={laneW} height={H - 2 * PAD_Y + 40} rx={8} fill="var(--color-accent)" fillOpacity={0.12} />
            ) : null}
          </g>
        </svg>

        <style dangerouslySetInnerHTML={{ __html: css }} />
      </div>

      {children != null ? (
        <>
          {/* Glass scrim behind the copy: a soft wash + feathered backdrop blur so
              the text stays readable while the full-bleed matrix keeps propagating
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

export default EventPropagationMatrix;
