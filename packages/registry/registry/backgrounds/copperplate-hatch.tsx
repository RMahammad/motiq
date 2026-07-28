"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface CopperplateFocalPoint {
  /** 0–1 horizontal position of a "light source" driving the tonal field. */
  x: number;
  /** 0–1 vertical position of a "light source" driving the tonal field. */
  y: number;
}

export interface CopperplateSafeArea {
  /** 0–1 left edge of the readable safe area. */
  x: number;
  /** 0–1 top edge of the readable safe area. */
  y: number;
  /** 0–1 width of the readable safe area. */
  w: number;
  /** 0–1 height of the readable safe area. */
  h: number;
}

export interface CopperplateHatchProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Hatch-stroke density multiplier (smaller pitch = more strokes). ~0.4–1.6. */
  density?: number;
  /** Overall ink/glint contrast of the plate (0–1.4). */
  intensity?: number;
  /** Light-wave travel speed multiplier. 0 (or reduced motion) freezes on a rich still frame. */
  speed?: number;
  /**
   * One or two "light source" points. The first drives the traveling radial light
   * (follows the pointer when `interactive`); the second, if given, is a static
   * secondary bright zone in the tonal field.
   */
  focalPoint?: CopperplateFocalPoint | CopperplateFocalPoint[];
  /** Region where the plate dims toward the ground so foreground text stays readable
   *  (drives only the DOM frosted scrim behind `children` — the canvas quiet-zone
   *  gradient itself is fixed to the Motion Lab values for a pixel-identical look). */
  safeArea?: CopperplateSafeArea;
  /** Overrides the metallic glint / focal light gold. Accepts a plain `#hex` or
   *  `rgb()`/`rgba()` string; omit to use the exact Motion Lab gold (`#eab365`).
   *  Values that need DOM resolution (e.g. `var(...)`) are ignored — this component
   *  is a fixed dark palette, not theme-aware. */
  accent?: string;
  /** Deterministic seed for the hatch field layout (SSR-stable). */
  seed?: number;
  /** Pause the loop when scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
  /** The focal light follows the pointer (never the sole effect). */
  interactive?: boolean;
  /** Force the static, motion-free variant regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Deterministic helpers                                                     */
/* -------------------------------------------------------------------------- */

const TAU = Math.PI * 2;
/** Rich still frame — the light mid-sweep, strokes glinting (also the reduced-motion frame). */
const STILL_SECONDS = 7.3;

/** Fixed engraver's cross-hatch directions (degrees) — never randomized, never move. */
const ANGLES = [32, -32, 90] as const;
const ANGLE_RAD = ANGLES.map((a) => (a * Math.PI) / 180);
/** Per-layer stroke budget so per-frame cost stays bounded on large canvases. */
const LAYER_CAP = [700, 500, 300] as const;

const DEFAULT_SAFE_AREA: CopperplateSafeArea = { x: 0.04, y: 0.12, w: 0.56, h: 0.76 };
const DEFAULT_FOCAL: CopperplateFocalPoint = { x: 0.62, y: 0.42 };

/** mulberry32 — no Math.random / Date.now at render or module scope (SSR-stable). */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/* -------------------------------------------------------------------------- */
/* Canvas colors — FIXED Motion Lab palette. This is a deliberate committed-   */
/* dark, single-visual-world design: no getComputedStyle, no --color-* reads.  */
/* -------------------------------------------------------------------------- */

type RGB = [number, number, number];

const LAB_GROUND = "#0a0b10";
/** candle-gold glint / focal light — overridable via `accent`. */
const GOLD: RGB = [234, 179, 101]; // #eab365
/** slate ink baseline for non-glinting strokes — always fixed, never accent-tied. */
const INK_SLATE: RGB = [158, 163, 196]; // #9ea3c4

/** Parse a plain CSS color (hex, or `rgb()`/`rgba()`) into an RGB triplet. Anything
 *  else (a `var(...)` reference, a named color, empty/unset) falls back to the fixed
 *  lab hue — this component no longer reads design tokens off the DOM. */
function parseAccentColor(value: string | undefined, fallback: RGB): RGB {
  if (!value) return fallback;
  const c = value.trim();
  if (c.startsWith("#")) {
    let h = c.slice(1);
    if (h.length === 3) h = h.split("").map((d) => d + d).join("");
    if (h.length !== 6) return fallback;
    const n = parseInt(h, 16);
    if (Number.isNaN(n)) return fallback;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = c.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).slice(0, 3).map(Number);
    if (parts.length === 3 && parts.every((p) => !Number.isNaN(p))) return [parts[0], parts[1], parts[2]];
  }
  return fallback;
}

const rgba = (c: RGB, a: number) =>
  `rgba(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0}, ${clamp(a, 0, 1)})`;

/* -------------------------------------------------------------------------- */
/* Deterministic field — rebuilt on mount + resize (real container pixels)    */
/* -------------------------------------------------------------------------- */

interface CopperStroke {
  x: number;
  y: number;
  li: number;
  base: number;
  th: number;
}

interface CopperState {
  strokes: CopperStroke[];
  /** Half-length of each hatch stroke (derived from the density-scaled step). */
  half: number;
  /** Current (lerped) light position. */
  fx: number;
  fy: number;
  /** Target light position (pointer, or the static default). */
  tx: number;
  ty: number;
}

interface FocalPx {
  x: number;
  y: number;
  amp: number;
  sigma: number;
}

function normalizeFocals(
  focalPoint: CopperplateHatchProps["focalPoint"],
  W: number,
  H: number,
): FocalPx[] {
  const list = Array.isArray(focalPoint) ? focalPoint : [focalPoint ?? DEFAULT_FOCAL];
  return list.slice(0, 2).map((f, i) => ({
    x: f.x * W,
    y: f.y * H,
    amp: 1 - i * 0.28,
    sigma: 230 - i * 40,
  }));
}

function buildCopperState(
  seed: number,
  density: number,
  focalPoint: CopperplateHatchProps["focalPoint"],
  W: number,
  H: number,
): CopperState {
  const rng = makeRng((seed >>> 0) * 2654435761 + 31);
  const step = clamp(24 / Math.max(0.4, density), 14, 40);
  const half = step * 0.46;
  const harm = [
    { f: 0.006 + rng() * 0.004, a: 0.22, p: rng() * TAU },
    { f: 0.009 + rng() * 0.004, a: 0.16, p: rng() * TAU },
  ];
  const focals = normalizeFocals(focalPoint, W, H);
  const secondary = focals[1];

  const strokes: CopperStroke[] = [];
  for (let li = 0; li < 3; li++) {
    const th = 0.34 + li * 0.3;
    const cap = LAYER_CAP[li] ?? 300;
    let count = 0;
    for (let y = 0; y < H + step && count < cap; y += step) {
      const rowIdx = Math.round(y / step);
      const rowOffset = (rowIdx % 2) * step * 0.5;
      for (let x = rowOffset; x < W + step && count < cap; x += step) {
        let v = 0;
        for (const h of harm) v += h.a * (0.5 + 0.5 * Math.sin(x * h.f + y * h.f * 0.7 + h.p));
        if (secondary) {
          const dx = x - secondary.x;
          const dy = y - secondary.y;
          v += secondary.amp * 0.9 * Math.exp(-(dx * dx + dy * dy) / (2 * secondary.sigma * secondary.sigma));
        }
        strokes.push({ x, y, li, base: v, th });
        count++;
      }
    }
  }

  const primary = focals[0] ?? { x: W * 0.62, y: H * 0.42, amp: 1, sigma: 230 };
  return { strokes, half, fx: primary.x, fy: primary.y, tx: primary.x, ty: primary.y };
}

/**
 * Paints the readable quiet zone — always the LAST canvas op. The Motion Lab's
 * pocket is a circle sized from `min(W, H)`, which stops covering the copy once
 * the container gets small or very wide (fixed-px text then spills past it), so
 * this keeps the lab's exact alpha falloff but shapes it as an ellipse anchored
 * to `safeArea`. Same look at lab proportions, legible copy at any size.
 */
function paintQuietZone(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  sa: { x: number; y: number; w: number; h: number },
  centerAlpha: number,
  midStop: number,
  midAlpha: number,
) {
  const cx = (sa.x + sa.w / 2) * W;
  const cy = (sa.y + sa.h / 2) * H;
  const rx = Math.max(sa.w * W * 1.05, W * 0.44, Math.min(W, H) * 0.5);
  const ry = Math.max(sa.h * H * 0.95, H * 0.52, Math.min(W, H) * 0.44);
  const k = ry / rx || 1;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, k);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(10,11,16,${centerAlpha})`);
  g.addColorStop(midStop, `rgba(10,11,16,${midAlpha})`);
  g.addColorStop(1, "rgba(10,11,16,0)");
  ctx.fillStyle = g;
  ctx.fillRect(-W * 2, (-H * 2) / k, W * 4, (H * 4) / k);
  ctx.restore();
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * CopperplateHatch — "Engraver's Light": waves of candle-gold light radiate from a
 * focal point, igniting each burin stroke as they pass through a fixed three-angle
 * crosshatch field, with a metallic glint over slate ink and a breathing contour
 * halo around the light. Move the pointer (when `interactive`) and the light
 * follows. One `<canvas>` + one requestAnimationFrame loop — no per-frame React
 * state, no WebGL. Colors are the FIXED Motion Lab palette (opaque `#0a0b10` ground
 * painted first every frame, slate ink + candle-gold glint) — this is a deliberate
 * committed-dark design, not resolved from theme tokens; `accent` may override the
 * gold. Pauses when scrolled offscreen/hidden and renders a single rich still frame
 * under reduced motion or `speed<=0`. Decorative: renders `children` as foreground
 * content over a frosted scrim above the safe area. Clean-room original — not a
 * port of any noise/dither/grain implementation.
 */
export function CopperplateHatch({
  density = 1,
  intensity = 1,
  speed = 1,
  focalPoint,
  safeArea = DEFAULT_SAFE_AREA,
  accent,
  seed = 1,
  pauseWhenHidden = true,
  interactive = false,
  reducedMotion,
  className,
  style,
  children,
  ...props
}: CopperplateHatchProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `mk-cph-${uid}`;
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const pointerRef = React.useRef<{ x: number; y: number; on: boolean }>({ x: 0, y: 0, on: false });

  const systemReduced = useReducedMotion();
  // The system preference isn't known at SSR, so ignore it until after mount —
  // server and first client render agree on data-motion (no hydration mismatch);
  // the static snapshot engages a frame later if reduced motion is on.
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  // Frozen for ANY reason (reduced-motion, an explicit still, or speed<=0) reads
  // as `data-motion="static"` — the honest signal, consistent across the batch.
  const staticMode = reducedMotion === true || speed <= 0 || (hydrated && systemReduced);
  const onScreen = useVisibilityPause(wrapRef, { threshold: 0.01 });
  const paused = pauseWhenHidden && !onScreen;
  const stalled = staticMode;
  const animate = !staticMode && !paused;

  // The hatch field is a function of seed + density + focalPoint (and the live
  // container size, handled inside the mount effect's measure()); keyed by VALUE
  // (not reference) so an inline focalPoint array doesn't force a rebuild every render.
  const focalKey = Array.isArray(focalPoint)
    ? focalPoint.map((f) => `${f.x},${f.y}`).join("|")
    : focalPoint
      ? `${focalPoint.x},${focalPoint.y}`
      : "";
  const model = React.useMemo(
    () => ({ seed, density, focalPoint }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed, density, focalKey],
  );

  // Live prop mirror so the rAF loop reads fresh values without re-subscribing.
  const paramsRef = React.useRef({ intensity, speed, safeArea, accent, interactive });
  paramsRef.current = { intensity, speed, safeArea, accent, interactive };

  // Focal light follows the pointer — the aria-hidden layer is pointer-events:none,
  // so listen on the actual interactive ancestor (the component root).
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el || !interactive || staticMode) return;
    const host = el.parentElement ?? el;
    const onMove = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      pointerRef.current = { x: ev.clientX - r.left, y: ev.clientY - r.top, on: true };
    };
    const onLeave = () => {
      pointerRef.current.on = false;
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [interactive, staticMode]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    // jsdom / unsupported contexts return null — render markup, skip drawing.
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let state: CopperState = { strokes: [], half: 11, fx: 0, fy: 0, tx: 0, ty: 0 };
    const measure = () => {
      const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
      width = wrap.clientWidth || 1;
      height = wrap.clientHeight || 1;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      state = buildCopperState(model.seed, model.density, model.focalPoint, width, height);
    };
    measure();

    const draw = (timeSec: number) => {
      const { intensity: inten, speed: spd0, accent: accentProp, interactive: inter } = paramsRef.current;

      const W = width;
      const H = height;
      // Opaque lab ground FIRST — makes the component self-contained and identical
      // to the Motion Lab regardless of host page/theme.
      ctx.fillStyle = LAB_GROUND;
      ctx.fillRect(0, 0, W, H);
      if (!state.strokes.length) return;

      const glow = clamp(inten, 0, 1.4);
      const spd = clamp(spd0, 0, 4);

      const pointer = pointerRef.current;
      if (inter && pointer.on) {
        state.tx = pointer.x;
        state.ty = pointer.y;
      }
      if (stalled) {
        state.fx = state.tx;
        state.fy = state.ty;
      } else {
        state.fx += (state.tx - state.fx) * 0.03;
        state.fy += (state.ty - state.fy) * 0.03;
      }

      const t = timeSec * spd;
      const maxR = Math.hypot(W, H) * 0.75;
      const span = maxR + 300;
      const w1 = ((t * 130) % span) - 100;
      const w2 = (((t * 130) + span / 2) % span) - 100;

      const accentRGB = parseAccentColor(accentProp, GOLD);

      for (const s of state.strokes) {
        const dx = s.x - state.fx;
        const dy = s.y - state.fy;
        const d = Math.hypot(dx, dy);
        const g = Math.exp(-(d * d) / (2 * 260 * 260));
        const tonal = s.base + g * 1.1;
        if (tonal < s.th) continue;
        const a1 = Math.exp(-((d - w1) ** 2) / (2 * 70 * 70));
        const a2 = Math.exp(-((d - w2) ** 2) / (2 * 70 * 70));
        const glint = Math.max(a1, a2 * 0.7);
        const ang = ANGLE_RAD[s.li];
        const dxs = Math.cos(ang) * state.half;
        const dys = Math.sin(ang) * state.half;
        const base = 0.1 + 0.1 * Math.sin(t * 0.5 + s.li * 2.1);

        if (glint > 0.05) {
          // Literal lab brightening: red channel fixed, green/blue lift toward a
          // pale gold as the wavefront passes — `rgba(234, 179+40g, 101+80g, a)`.
          const gr = accentRGB[0];
          const gg = Math.min(255, accentRGB[1] + 40 * glint);
          const gb = Math.min(255, accentRGB[2] + 80 * glint);
          ctx.strokeStyle = `rgba(${gr | 0}, ${gg | 0}, ${gb | 0}, ${clamp((base + glint * 0.85) * glow, 0, 0.95)})`;
        } else {
          ctx.strokeStyle = rgba(INK_SLATE, clamp((base + g * 0.14) * glow, 0, 1));
        }
        ctx.lineWidth = 1.1 + glint * 1.2;
        ctx.beginPath();
        ctx.moveTo(s.x - dxs, s.y - dys);
        ctx.lineTo(s.x + dxs, s.y + dys);
        ctx.stroke();
      }

      // Focal halo — breathes with a slow pulse.
      const hg = ctx.createRadialGradient(state.fx, state.fy, 0, state.fx, state.fy, 300);
      const pulse = 0.1 + 0.04 * Math.sin(t * 1.4);
      hg.addColorStop(0, rgba(accentRGB, pulse * glow));
      hg.addColorStop(1, rgba(accentRGB, 0));
      ctx.fillStyle = hg;
      ctx.fillRect(0, 0, W, H);

      // Quiet zone — exact Motion Lab values, drawn LAST so the plate dims under
      // the copy. Fixed to the lab's center/radius (not derived from `safeArea`)
      // so the canvas output matches the lab pixel-for-pixel; `safeArea` still
      // positions the DOM frosted scrim behind `children` below.
      paintQuietZone(ctx, W, H, paramsRef.current.safeArea, 0.82, 0.6, 0.42);
    };

    let raf = 0;
    let startTime = 0;
    const loop = (now: number) => {
      if (!startTime) startTime = now;
      draw((now - startTime) / 1000);
      raf = requestAnimationFrame(loop);
    };

    if (animate) raf = requestAnimationFrame(loop);
    else draw(STILL_SECONDS);

    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          measure();
          if (!animate) draw(STILL_SECONDS);
        })
      : null;
    ro?.observe(wrap);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [model, animate, staticMode]);

  const css = `
.${cls} { position: absolute; inset: 0; background: ${LAB_GROUND}; }
.${cls} .mk-cph-canvas { display: block; width: 100%; height: 100%; }
.${cls} .mk-cph-fallback { display: none; }
@media (forced-colors: active) {
  .${cls} .mk-cph-canvas { display: none; }
  .${cls} .mk-cph-fallback {
    display: block; position: absolute; inset: 7%;
    border: 1px solid CanvasText; border-radius: 14px; background: Canvas;
  }
}`.trim();

  return (
    <div className={cn("relative isolate overflow-hidden", className)} style={{ background: LAB_GROUND, ...style }} {...props}>
      <div
        ref={wrapRef}
        aria-hidden="true"
        data-paused={paused ? "true" : "false"}
        data-motion={staticMode ? "static" : "animated"}
        className={cn("pointer-events-none absolute inset-0 overflow-hidden", cls)}
      >
        <canvas ref={canvasRef} className="mk-cph-canvas" />
        <div className="mk-cph-fallback" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </div>

      {/* Readability comes solely from the canvas-painted quiet zone (drawn last
          each frame, exact Motion Lab values). No DOM blur layer — a backdrop
          filter on top of it stacks into a visible dark ellipse. */}
      {children != null ? <div className="relative z-10">{children}</div> : null}
    </div>
  );
}

export default CopperplateHatch;
