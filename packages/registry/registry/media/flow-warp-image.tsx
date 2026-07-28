"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/** Anything the canvas can sample from: a URL, or an already-painted surface. */
export type FlowWarpSource = string | HTMLCanvasElement | HTMLImageElement;

export interface FlowWarpImageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Image URL (or a canvas/image element) sampled into the warping mesh. */
  src?: FlowWarpSource;
  /** Describes the picture for assistive tech. Empty string = purely decorative. */
  alt?: string;
  /** Mesh resolution as [columns, rows]. */
  grid?: [number, number];
  /** Per-node return spring stiffness. */
  stiffness?: number;
  /** Per-node damping. */
  damping?: number;
  /** Pointer push radius in CSS px. */
  radius?: number;
  /** Impulse gain multiplier (1 = the tuned default). */
  strength?: number;
  /** Throw a radial splash from the last pointer position on exit. */
  splashOnLeave?: boolean;
  /** Let a virtual pointer ride a Lissajous path after 3s of stillness. */
  idleWave?: boolean;
  /** Deterministic seed for the built-in fallback surface (used when `src` is unset). */
  seed?: number;
  /** Overlay content (labels, titles) rendered above the canvas. */
  overlay?: React.ReactNode;
  /** Force the still variant regardless of system preference. */
  reducedMotion?: boolean;
  /** Stop the rAF loop while scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Physics constants (Motion Lab ship spec)                                   */
/* -------------------------------------------------------------------------- */

const DEFAULT_GRID: [number, number] = [32, 20];
const K_DEFAULT = 90;
const C_DEFAULT = 8;
const PUSH_RADIUS = 140;
/** Base impulse gain; pointer speed adds SPEED_GAIN · |v|. */
const BASE_GAIN = 260;
const SPEED_GAIN = 0.45;
/** Pointer speed is clamped so a flick can't blow the mesh apart. */
const MAX_POINTER_SPEED = 3200;
const SPLASH_RADIUS = 230;
const SPLASH_POWER = 300;
const KEY_SPLASH_POWER = 130;
const KEY_BURST_POWER = 340;
/** Seconds of stillness before the idle swell takes over. */
const IDLE_DELAY = 3;
const IDLE_RADIUS = 115;
const KEY_STEP = 0.08;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** mulberry32 — deterministic, SSR-safe (no Math.random / Date.now). */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fallback surface so the component is never blank before/without an image. */
function paintFallback(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const rng = makeRng(seed);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#16233d");
  g.addColorStop(0.58, "#2c4a6b");
  g.addColorStop(1, "#0d1420");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let band = 0; band < 4; band++) {
    const base = h * (0.54 + band * 0.11);
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i <= 64; i++) {
      const x = (i / 64) * w;
      const u = (i / 64) * Math.PI * 2;
      ctx.lineTo(x, base + Math.sin(u * (1.4 + band) + band) * h * 0.035);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = `rgba(9, 17, 30, ${0.32 + band * 0.16})`;
    ctx.fill();
  }
  ctx.save();
  ctx.globalAlpha = 0.05;
  const dots = Math.floor((w * h) / 1200);
  for (let i = 0; i < dots; i++) {
    ctx.fillStyle = rng() > 0.5 ? "#ffffff" : "#000000";
    ctx.fillRect(rng() * w, rng() * h, 1, 1);
  }
  ctx.restore();
}

/** Cover-fit an image/canvas into the offscreen source at device resolution. */
function drawCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource, sw: number, sh: number, w: number, h: number) {
  const s = Math.max(w / sw, h / sh);
  const dw = sw * s;
  const dh = sh * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * FlowWarpImage — a media surface that liquefies under the pointer. The picture
 * is sampled once into an offscreen canvas and redrawn each frame as a mesh of
 * sub-rects whose corner nodes are individual springs (k=90, c=8): the pointer
 * pushes nodes outward with a (1−d/R)² falloff and they snap elastically back,
 * so the wake ripples for ~700ms. Leaving the frame throws a radial splash, and
 * after 3s of stillness a virtual pointer rides a Lissajous path so the surface
 * never dies.
 *
 * One canvas, one rAF loop, DPR capped at 2 — 640 drawImage calls per frame from
 * one source, no per-pixel work, no getImageData. Clean-room original.
 */
export function FlowWarpImage({
  src,
  alt = "",
  grid = DEFAULT_GRID,
  stiffness = K_DEFAULT,
  damping = C_DEFAULT,
  radius = PUSH_RADIUS,
  strength = 1,
  splashOnLeave = true,
  idleWave = true,
  seed = 12,
  overlay,
  reducedMotion,
  pauseWhenHidden = true,
  className,
  ...props
}: FlowWarpImageProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  /** Fires a splash at field coordinates 0–1; owned by the loop effect. */
  const splashRef = React.useRef<(nx: number, ny: number, power: number) => void>(() => {});

  const systemReduced = useReducedMotion();
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const still = reducedMotion === true || (hydrated && systemReduced);

  const onScreen = useVisibilityPause(rootRef, { threshold: 0.05 });
  const animate = !still && (!pauseWhenHidden || onScreen);

  const cols = Math.max(2, Math.round(grid[0]));
  const rows = Math.max(2, Math.round(grid[1]));

  const params = React.useRef({ stiffness, damping, radius, strength, splashOnLeave, idleWave, seed, src });
  params.current = { stiffness, damping, radius, strength, splashOnLeave, idleWave, seed, src };

  const pointer = React.useRef({ inside: false, x: 0, y: 0, px: 0, py: 0, last: -100, kx: 0.5, ky: 0.5 });

  React.useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    // jsdom / unsupported contexts return null — render markup, skip drawing.
    if (!ctx) return;

    const nx = cols + 1;
    const ny = rows + 1;
    // Flat [ox, oy, vx, vy] per node — one allocation for the whole mesh.
    const nodes = new Float32Array(nx * ny * 4);

    let W = 0;
    let H = 0;
    let dpr = 1;
    let source: HTMLCanvasElement | null = null;
    let disposed = false;

    const paintSource = () => {
      if (!source) return;
      const sctx = source.getContext("2d");
      if (!sctx) return;
      sctx.clearRect(0, 0, W, H);
      const s = params.current.src;
      if (typeof s !== "string" && s) {
        const sw = s instanceof HTMLCanvasElement ? s.width : s.naturalWidth || s.width;
        const sh = s instanceof HTMLCanvasElement ? s.height : s.naturalHeight || s.height;
        if (sw > 0 && sh > 0) {
          drawCover(sctx, s, sw, sh, W, H);
          return;
        }
      }
      paintFallback(sctx, W, H, params.current.seed);
    };

    const drawMesh = () => {
      if (!source || W === 0) return;
      ctx.clearRect(0, 0, W, H);
      const cw = W / cols;
      const ch = H / rows;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const a = (j * nx + i) * 4;
          const b = (j * nx + i + 1) * 4;
          const c = ((j + 1) * nx + i) * 4;
          const dx = i * cw + nodes[a];
          const dy = j * ch + nodes[a + 1];
          const dw = cw + nodes[b] - nodes[a];
          const dh = ch + nodes[c + 1] - nodes[a + 1];
          // +0.7 device px of bleed hides seams between neighbouring sub-rects.
          ctx.drawImage(source, i * cw, j * ch, cw, ch, dx, dy, dw + 0.7, dh + 0.7);
        }
      }
    };

    const measure = () => {
      const rect = root.getBoundingClientRect();
      const cssW = rect.width || root.clientWidth || 1;
      const cssH = rect.height || root.clientHeight || 1;
      dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
      W = Math.max(1, Math.round(cssW * dpr));
      H = Math.max(1, Math.round(cssH * dpr));
      canvas.width = W;
      canvas.height = H;
      if (!source) source = document.createElement("canvas");
      source.width = W;
      source.height = H;
      paintSource();
      nodes.fill(0);
      drawMesh();
    };

    const splash = (fx: number, fy: number, power: number) => {
      if (W === 0) return;
      const R = SPLASH_RADIUS * dpr;
      const cw = W / cols;
      const ch = H / rows;
      const px = fx * W;
      const py = fy * H;
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const ddx = i * cw - px;
          const ddy = j * ch - py;
          const d = Math.hypot(ddx, ddy);
          if (d < R && d > 0.001) {
            const fall = 1 - d / R;
            const idx = (j * nx + i) * 4;
            const f = fall * fall * power * dpr * params.current.strength;
            nodes[idx + 2] += (ddx / d) * f;
            nodes[idx + 3] += (ddy / d) * f;
          }
        }
      }
    };
    splashRef.current = splash;

    measure();

    // A URL source loads asynchronously; repaint the offscreen surface on load.
    let img: HTMLImageElement | null = null;
    const s = params.current.src;
    if (typeof s === "string" && s) {
      img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (disposed || !source) return;
        const sctx = source.getContext("2d");
        if (!sctx || !img) return;
        sctx.clearRect(0, 0, W, H);
        drawCover(sctx, img, img.naturalWidth || 1, img.naturalHeight || 1, W, H);
        drawMesh();
      };
      img.src = s;
    }

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => measure()) : null;
    ro?.observe(root);

    let raf = 0;
    if (animate) {
      let last = performance.now();
      const frame = (ts: number) => {
        const dt = Math.min(0.05, Math.max(0.001, (ts - last) / 1000));
        last = ts;
        const now = ts / 1000;
        const p = params.current;
        const pt = pointer.current;

        let active = false;
        let ax = 0;
        let ay = 0;
        let speed = 0;
        let R = p.radius * dpr;
        if (pt.inside) {
          ax = pt.x * W;
          ay = pt.y * H;
          speed = Math.min(Math.hypot((pt.x - pt.px) * W, (pt.y - pt.py) * H) / dt, MAX_POINTER_SPEED * dpr);
          pt.px = pt.x;
          pt.py = pt.y;
          active = true;
        } else if (p.idleWave && now - pt.last > IDLE_DELAY) {
          ax = W * (0.5 + 0.36 * Math.sin(now * 0.7));
          ay = H * (0.5 + 0.3 * Math.sin(now * 1.13 + 1.7));
          speed = 700 * dpr * (0.6 + 0.4 * Math.sin(now * 0.53));
          R = IDLE_RADIUS * dpr;
          active = true;
        }

        const cw = W / cols;
        const ch = H / rows;
        const gain = (BASE_GAIN * dpr + speed * SPEED_GAIN) * dt * p.strength;
        for (let j = 0; j < ny; j++) {
          for (let i = 0; i < nx; i++) {
            const idx = (j * nx + i) * 4;
            let ox = nodes[idx];
            let oy = nodes[idx + 1];
            let vx = nodes[idx + 2];
            let vy = nodes[idx + 3];
            if (active) {
              const ddx = i * cw - ax;
              const ddy = j * ch - ay;
              const d = Math.hypot(ddx, ddy);
              if (d < R && d > 0.001) {
                const fall = 1 - d / R;
                const f = fall * fall * gain;
                vx += (ddx / d) * f;
                vy += (ddy / d) * f;
              }
            }
            vx += (-p.stiffness * ox - p.damping * vx) * dt;
            vy += (-p.stiffness * oy - p.damping * vy) * dt;
            ox += vx * dt;
            oy += vy * dt;
            nodes[idx] = ox;
            nodes[idx + 1] = oy;
            nodes[idx + 2] = vx;
            nodes[idx + 3] = vy;
          }
        }
        drawMesh();
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    } else {
      nodes.fill(0);
      drawMesh();
    }

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      if (img) img.onload = null;
      ro?.disconnect();
      splashRef.current = () => {};
    };
  }, [animate, cols, rows, src, seed]);

  /* ------------------------------------------------------------- pointer -- */

  const toField = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1),
      y: clamp((e.clientY - rect.top) / Math.max(1, rect.height), 0, 1),
    };
  };

  const onPointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!animate) return;
    const p = toField(e);
    const pt = pointer.current;
    pt.inside = true;
    pt.x = pt.px = p.x;
    pt.y = pt.py = p.y;
    pt.last = performance.now() / 1000;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!animate) return;
    const p = toField(e);
    const pt = pointer.current;
    pt.inside = true;
    pt.x = p.x;
    pt.y = p.y;
    pt.last = performance.now() / 1000;
  };

  const onPointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!animate) return;
    const pt = pointer.current;
    if (pt.inside && params.current.splashOnLeave) {
      const p = toField(e);
      splashRef.current(p.x, p.y, SPLASH_POWER);
    }
    pt.inside = false;
    pt.last = performance.now() / 1000;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!animate) return;
    const pt = pointer.current;
    if (e.key === "ArrowLeft") pt.kx = clamp(pt.kx - KEY_STEP, 0.05, 0.95);
    else if (e.key === "ArrowRight") pt.kx = clamp(pt.kx + KEY_STEP, 0.05, 0.95);
    else if (e.key === "ArrowUp") pt.ky = clamp(pt.ky - KEY_STEP, 0.05, 0.95);
    else if (e.key === "ArrowDown") pt.ky = clamp(pt.ky + KEY_STEP, 0.05, 0.95);
    else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      pt.last = performance.now() / 1000;
      splashRef.current(pt.kx, pt.ky, KEY_BURST_POWER);
      return;
    } else return;
    e.preventDefault();
    pt.last = performance.now() / 1000;
    splashRef.current(pt.kx, pt.ky, KEY_SPLASH_POWER);
  };

  // With alt text the surface is a real image users can steer by keyboard; with
  // an empty alt it is decoration, so it is hidden AND not focusable (a focusable
  // node inside aria-hidden is an a11y violation).
  const decorative = alt === "";
  const focusable = !decorative && animate;
  // The keyboard affordance lives in the label itself: `role="img"` makes the
  // subtree presentational, so a visually-hidden hint element inside it would
  // never be announced.
  const label = focusable ? `${alt}. Interactive image: arrow keys ripple the surface, Space splashes it.` : alt;

  return (
    <div
      ref={rootRef}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      tabIndex={focusable ? 0 : undefined}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onKeyDown={onKeyDown}
      data-motion={still ? "static" : "animated"}
      className={cn(
        "relative aspect-[16/10] w-full touch-pan-y overflow-hidden rounded-[16px]",
        "border border-[var(--color-border,#263449)] bg-[var(--color-bg-elevated,#0d1420)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent,#4f7cff)] focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
      {overlay ? <div className="pointer-events-none absolute inset-0">{overlay}</div> : null}
    </div>
  );
}

export default FlowWarpImage;
