"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface LoomDraftSafeArea {
  /** 0–1 left edge of the readable safe area. */
  x: number;
  /** 0–1 top edge of the readable safe area. */
  y: number;
  /** 0–1 width of the readable safe area. */
  w: number;
  /** 0–1 height of the readable safe area. */
  h: number;
}

export interface LoomDraftProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Warp/weft spacing multiplier — more threads and rows as it increases. ~0.4–1.6. */
  density?: number;
  /** Overall glow/ink contrast of the weave (0–1.4). */
  intensity?: number;
  /** Weaving speed multiplier. 0 (or reduced motion) freezes on a rich still frame. */
  speed?: number;
  /** Region where the weave dims toward the ground so foreground text stays readable
   *  (drives only the DOM frosted scrim behind `children` — the canvas quiet-zone
   *  gradient itself is fixed to the Motion Lab values for a pixel-identical look). */
  safeArea?: LoomDraftSafeArea;
  /** Overrides the ramp's cyan (B) stop — the mid color of the fixed violet→cyan→pink
   *  weft ramp. Accepts a plain `#hex` or `rgb()`/`rgba()` string; omit to use the
   *  exact Motion Lab cyan (`#35d5e5`). Values that need DOM resolution (e.g. `var(...)`)
   *  are ignored — this component is a fixed dark palette, not theme-aware. */
  accent?: string;
  /** Deterministic seed for the warp/weft/dust layout (SSR-stable). */
  seed?: number;
  /** Pause the loop when scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
  /** Pointer shimmer follows the cursor across the weave (never the sole effect). */
  interactive?: boolean;
  /** Force the static, motion-free variant regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Deterministic helpers                                                     */
/* -------------------------------------------------------------------------- */

const TAU = Math.PI * 2;
/** Rich still frame — mid-weave, a shuttle comet in flight (also the reduced-motion frame). */
const STILL_SECONDS = 7.3;

const DEFAULT_SAFE_AREA: LoomDraftSafeArea = { x: 0.04, y: 0.12, w: 0.56, h: 0.76 };

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
const smoothstep = (t: number) => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};

/* -------------------------------------------------------------------------- */
/* Canvas colors — FIXED Motion Lab palette. This is a deliberate committed-   */
/* dark, single-visual-world design: no getComputedStyle, no --color-* reads.  */
/* -------------------------------------------------------------------------- */

type RGB = [number, number, number];

const LAB_GROUND = "#0a0b10";
/** violet -> cyan -> pink weft ramp stops — exactly the lab's `ramp(u)` constants. */
const RAMP_VIOLET: RGB = [124, 108, 255]; // #7c6cff — ramp start (A), always fixed
const RAMP_CYAN: RGB = [53, 213, 229]; // #35d5e5 — ramp mid (B), overridable via `accent`
const RAMP_PINK: RGB = [255, 92, 147]; // #ff5c93 — ramp tail (C), always fixed
/** Mid-stop tint baked into the warp gradient — a literal lab constant, not a re-mix. */
const WARP_MID: RGB = [140, 124, 255];
/** Sheen + shuttle highlight constants — literal lab values, not derived mixes. */
const SHEEN_A: RGB = [190, 240, 255];
const SHEEN_B: RGB = [255, 190, 230];
const COMET_TRAIL_END: RGB = [210, 245, 255];
const COMET_HEAD_WHITE: RGB = [255, 255, 255];
const COMET_HEAD_MID: RGB = [150, 235, 255];
const SPARK: RGB = [200, 245, 255];

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

const mixRgb = (a: RGB, b: RGB, k: number): RGB => {
  const kk = clamp(k, 0, 1);
  return [a[0] + (b[0] - a[0]) * kk, a[1] + (b[1] - a[1]) * kk, a[2] + (b[2] - a[2]) * kk];
};

const rgba = (c: RGB, a: number) =>
  `rgba(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0}, ${clamp(a, 0, 1)})`;

/* -------------------------------------------------------------------------- */
/* Deterministic geometry — rebuilt on mount + resize (real container pixels) */
/* -------------------------------------------------------------------------- */

interface LoomGeometry {
  warpX: number[];
  sp: number;
  rowH: number;
  rows: number;
  rowSeed: { o: number }[];
  dust: { x: number; y: number; s: number; ph: number; warm: boolean }[];
}

function buildLoomGeometry(seed: number, density: number, W: number, H: number): LoomGeometry {
  const rng = makeRng((seed >>> 0) * 2654435761 + 17);
  const sp = clamp(24 / Math.max(0.4, density), 12, 40);
  const rowH = clamp(15 / Math.max(0.4, density), 8, 26);
  const warpN = Math.max(4, Math.round(W / sp));
  const warpX: number[] = [];
  for (let i = 0; i <= warpN; i++) warpX.push(i * (W / warpN));
  const rows = Math.ceil(H / rowH) + 2;
  const rowSeed = Array.from({ length: rows }, () => ({ o: 0.5 + rng() * 0.5 }));
  const dust = Array.from({ length: 34 }, () => ({
    x: rng(),
    y: rng(),
    s: 0.5 + rng() * 1.3,
    ph: rng() * TAU,
    warm: rng() < 0.5,
  }));
  return { warpX, sp, rowH, rows, rowSeed, dust };
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
 * LoomDraft — "Living Weave": a shuttle of light races the loom, laying luminous
 * weft into the fabric row by row (weave → gleam → dissolve → repeat), a diagonal
 * iridescent sheen rolls across the finished bolt, warp threads sway, and loom dust
 * drifts through the field. One `<canvas>` + one requestAnimationFrame loop — no
 * per-frame React state, no WebGL. Colors are the FIXED Motion Lab palette (opaque
 * `#0a0b10` ground painted first every frame, violet→cyan→pink weft ramp) — this is
 * a deliberate committed-dark design, not resolved from theme tokens; `accent` may
 * override the ramp's cyan stop. Pauses when scrolled offscreen/hidden and renders a
 * single rich still frame under reduced motion or `speed<=0`. Decorative: renders
 * `children` as foreground content over a frosted scrim above the safe area. Clean-room
 * original — not a port of any grid/thread/particle implementation.
 */
export function LoomDraft({
  density = 1,
  intensity = 1,
  speed = 1,
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
}: LoomDraftProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `mk-ld-${uid}`;
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const pointerRef = React.useRef<{ x: number; y: number; on: boolean }>({ x: -9999, y: -9999, on: false });

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
  const animate = !staticMode && !paused;

  // Geometry is a function of seed + density (and the live container size, handled
  // inside the mount effect's measure()); this mirrors the field on resize.
  const model = React.useMemo(() => ({ seed, density }), [seed, density]);

  // Live prop mirror so the rAF loop reads fresh values without re-subscribing.
  const paramsRef = React.useRef({ intensity, speed, safeArea, accent, interactive });
  paramsRef.current = { intensity, speed, safeArea, accent, interactive };

  // Pointer shimmer — the aria-hidden layer is pointer-events:none, so listen on
  // the actual interactive ancestor (the component root) the way the pointer
  // events really arrive.
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
    let geom: LoomGeometry = { warpX: [], sp: 24, rowH: 15, rows: 0, rowSeed: [], dust: [] };
    const measure = () => {
      const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
      width = wrap.clientWidth || 1;
      height = wrap.clientHeight || 1;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      geom = buildLoomGeometry(model.seed, model.density, width, height);
    };
    measure();

    const draw = (timeSec: number) => {
      const { intensity: inten, speed: spd0, accent: accentProp, interactive: inter } = paramsRef.current;

      const W = width;
      const H = height;
      // Opaque lab ground FIRST — makes the component self-contained and identical
      // to the Motion Lab regardless of host page/theme (the additive 'lighter'
      // glow below assumes a dark ground).
      ctx.fillStyle = LAB_GROUND;
      ctx.fillRect(0, 0, W, H);
      if (!geom.warpX.length) return;

      const glow = clamp(inten, 0, 1.4);
      const spd = clamp(spd0, 0, 4);
      const t = timeSec * spd;

      const accentRGB = RAMP_VIOLET;
      const secondaryRGB = parseAccentColor(accentProp, RAMP_CYAN);
      const signatureRGB = RAMP_PINK;
      const rampColor = (u: number): RGB => {
        const uu = clamp(u, 0, 1);
        return uu < 0.55
          ? mixRgb(accentRGB, secondaryRGB, uu / 0.55)
          : mixRgb(secondaryRGB, signatureRGB, (uu - 0.55) / 0.45);
      };

      const CYCLE = 24;
      const WEAVE = 16;
      const GLEAM = 4.5;
      const rows = geom.rows;
      const tc = t % CYCLE;
      const dissolve = tc > WEAVE + GLEAM ? smoothstep((tc - WEAVE - GLEAM) / (CYCLE - WEAVE - GLEAM)) : 0;
      const progress = tc < WEAVE ? (tc / WEAVE) * rows : rows;
      const kA = Math.floor(progress);
      const partial = progress - kA;

      // Ambient loom-light wash.
      ctx.globalCompositeOperation = "lighter";
      const g1 = ctx.createRadialGradient(W * 0.8 + Math.sin(t * 0.2) * 60, H * 0.25, 0, W * 0.8, H * 0.25, W * 0.5);
      g1.addColorStop(0, rgba(accentRGB, 0.055 * glow));
      g1.addColorStop(1, rgba(accentRGB, 0));
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);
      const g2 = ctx.createRadialGradient(W * 0.15, H * 0.85 + Math.cos(t * 0.17) * 50, 0, W * 0.15, H * 0.85, W * 0.45);
      g2.addColorStop(0, rgba(secondaryRGB, 0.05 * glow));
      g2.addColorStop(1, rgba(secondaryRGB, 0));
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";

      // Warp strands.
      for (let i = 0; i < geom.warpX.length; i++) {
        const x = geom.warpX[i];
        const sway = Math.sin(t * 0.7 + i * 0.42) * 2.6 + Math.sin(t * 1.3 + i * 1.1) * 0.8;
        const wg = ctx.createLinearGradient(0, 0, 0, H);
        wg.addColorStop(0, rgba(accentRGB, 0.1 * glow));
        wg.addColorStop(0.5, rgba(WARP_MID, (0.15 + 0.05 * Math.sin(t + i)) * glow));
        wg.addColorStop(1, rgba(secondaryRGB, 0.12 * glow));
        ctx.strokeStyle = wg;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.quadraticCurveTo(x + sway, H / 2, x, H);
        ctx.stroke();
      }

      const rowPath = (k: number, y: number) => {
        ctx.beginPath();
        for (let i = 0; i < geom.warpX.length; i++) {
          const x = geom.warpX[i] + Math.sin(t * 0.7 + i * 0.42) * 2.4 * (y / H);
          const over = ((i + k) % 2 ? 1 : -1) * 2.4;
          if (i === 0) ctx.moveTo(x, y + over);
          else ctx.lineTo(x, y + over);
        }
      };

      // Woven cloth.
      ctx.globalCompositeOperation = "lighter";
      const weaveTopY = H - Math.floor(progress) * geom.rowH - 8;
      const pointer = pointerRef.current;
      for (let k = 0; k < kA; k++) {
        const y = H - k * geom.rowH - 8 + dissolve * -14 * (k / Math.max(1, rows));
        if (y < -geom.rowH) break;
        const rs = geom.rowSeed[k % Math.max(1, rows)] ?? { o: 0.7 };
        const [cr, cg, cb] = rampColor(k / Math.max(1, rows) + Math.sin(t * 0.25) * 0.06);
        const heat = Math.exp(-Math.max(0, progress - k - 1) * 0.42);
        const fade = 1 - dissolve * 0.85;
        const pd = Math.abs(y - pointer.y);
        const pb = inter && pointer.on && pd < 90 ? (1 - pd / 90) * 0.3 : 0;
        const base = (0.1 + rs.o * 0.09 + pb) * fade;

        ctx.strokeStyle = rgba([cr, cg, cb], clamp(base * 0.5 + heat * 0.22, 0, 0.5) * glow);
        ctx.lineWidth = 7.5;
        rowPath(k, y);
        ctx.stroke();

        ctx.strokeStyle = rgba([cr, cg, cb], clamp(base + heat * 0.25, 0, 0.8) * glow);
        ctx.lineWidth = 2.1;
        rowPath(k, y);
        ctx.stroke();

        ctx.setLineDash([geom.sp, geom.sp]);
        ctx.lineDashOffset = (k % 2) * geom.sp;
        const bright: RGB = [Math.min(255, cr + 70), Math.min(255, cg + 70), Math.min(255, cb + 40)];
        ctx.strokeStyle = rgba(bright, clamp(base * 1.5 + heat * 0.5, 0, 0.95) * glow);
        ctx.lineWidth = 2.6;
        rowPath(k, y);
        ctx.stroke();
        ctx.setLineDash([]);

        if (heat > 0.2) {
          ctx.strokeStyle = rgba([255, 255, 255], heat * 0.3 * fade * glow);
          ctx.lineWidth = 1.2;
          rowPath(k, y);
          ctx.stroke();
        }
      }

      // Diagonal iridescent sheen rolling across the woven bolt.
      if (kA > 2) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, Math.max(0, weaveTopY), W, H - Math.max(0, weaveTopY));
        ctx.clip();
        const c = ((t * 0.13) % 1.6 - 0.3) * (W + H);
        const sg = ctx.createLinearGradient(c - 170, 0, c + 170, 340);
        const sA = tc > WEAVE && tc < WEAVE + GLEAM ? 0.34 : 0.15;
        sg.addColorStop(0, "rgba(255,255,255,0)");
        sg.addColorStop(0.45, rgba(SHEEN_A, sA * glow * (1 - dissolve)));
        sg.addColorStop(0.55, rgba(SHEEN_B, sA * 0.7 * glow * (1 - dissolve)));
        sg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = sg;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      // Shuttle comets (weaver + beater on the previous row).
      if (tc < WEAVE) {
        const comet = (k: number, p: number, scale: number) => {
          const y = H - k * geom.rowH - 8;
          const dir = k % 2 ? -1 : 1;
          const sx = dir > 0 ? p * W : W - p * W;
          const grad = ctx.createLinearGradient(sx - 170 * dir, y, sx, y);
          grad.addColorStop(0, rgba(secondaryRGB, 0));
          grad.addColorStop(1, rgba(COMET_TRAIL_END, 0.9 * scale * glow));
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          let started = false;
          for (let i = 0; i < geom.warpX.length; i++) {
            const x = geom.warpX[i];
            if (dir > 0 && x > sx) break;
            if (dir < 0 && x < sx) continue;
            const over = ((i + k) % 2 ? 1 : -1) * 2.4;
            if (!started) {
              ctx.moveTo(x, y + over);
              started = true;
            } else ctx.lineTo(x, y + over);
          }
          ctx.stroke();

          const cg = ctx.createRadialGradient(sx, y, 0, sx, y, 34 * scale);
          cg.addColorStop(0, rgba(COMET_HEAD_WHITE, 0.95 * scale * glow));
          cg.addColorStop(0.22, rgba(COMET_HEAD_MID, 0.6 * scale * glow));
          cg.addColorStop(1, rgba(secondaryRGB, 0));
          ctx.fillStyle = cg;
          ctx.beginPath();
          ctx.arc(sx, y, 34 * scale, 0, TAU);
          ctx.fill();

          for (let s = 0; s < 7; s++) {
            const jx = sx - dir * (s * 10 + (Math.sin(t * 23 + s * 2.7) * 0.5 + 0.5) * 7);
            const jy = y + Math.sin(t * 31 + s * 2.1 + k) * 4.2;
            const a = (1 - s / 7) * (0.5 + 0.5 * Math.sin(t * 40 + s)) * scale;
            ctx.fillStyle = rgba(SPARK, clamp(a, 0, 0.9) * glow);
            ctx.beginPath();
            ctx.arc(jx, jy, 1.6 * (1 - s / 9), 0, TAU);
            ctx.fill();
          }
        };
        comet(kA, partial, 1);
        if (kA > 0) comet(kA - 1, (partial + 0.45) % 1, 0.55);
      }

      // Loom dust.
      for (const d of geom.dust) {
        const dy = ((d.y - t * 0.012 * d.s) % 1 + 1) % 1;
        const dx = d.x + Math.sin(t * 0.5 + d.ph) * 0.012;
        const a = 0.04 + 0.05 * (0.5 + 0.5 * Math.sin(t * 1.2 + d.ph));
        ctx.fillStyle = rgba(d.warm ? accentRGB : secondaryRGB, a * glow);
        ctx.beginPath();
        ctx.arc(dx * W, dy * H, d.s, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // Quiet zone — exact Motion Lab values, drawn LAST so the whole weave dims
      // under the copy. Fixed to the lab's center/radius (not derived from
      // `safeArea`) so the canvas output matches the lab pixel-for-pixel; `safeArea`
      // still positions the DOM frosted scrim behind `children` below.
      paintQuietZone(ctx, W, H, paramsRef.current.safeArea, 0.9, 0.55, 0.52);
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
.${cls} .mk-ld-canvas { display: block; width: 100%; height: 100%; }
.${cls} .mk-ld-fallback { display: none; }
@media (forced-colors: active) {
  .${cls} .mk-ld-canvas { display: none; }
  .${cls} .mk-ld-fallback {
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
        <canvas ref={canvasRef} className="mk-ld-canvas" />
        <div className="mk-ld-fallback" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </div>

      {/* Readability comes solely from the canvas-painted quiet zone (drawn last
          each frame, exact Motion Lab values). No DOM blur layer — a backdrop
          filter on top of it stacks into a visible dark ellipse. */}
      {children != null ? <div className="relative z-10">{children}</div> : null}
    </div>
  );
}

export default LoomDraft;
