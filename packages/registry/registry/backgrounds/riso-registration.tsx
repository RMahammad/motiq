"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface RisoRegistrationRect {
  /** 0–1 left edge of the readable safe area. */
  x: number;
  /** 0–1 top edge of the readable safe area. */
  y: number;
  /** 0–1 width of the readable safe area. */
  w: number;
  /** 0–1 height of the readable safe area. */
  h: number;
}

export interface RisoRegistrationProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Dot pitch/count multiplier. ~0.6–1.6 (higher = finer dots). */
  density?: number;
  /** Overall ink opacity of both plates (0–1.4). */
  intensity?: number;
  /** Drift amplitude multiplier. 0 freezes on a single rich still frame. */
  speed?: number;
  /** Region where the field thins/dims so foreground text stays readable (0–1 coords). */
  safeArea?: RisoRegistrationRect;
  /**
   * Plate A ink color (any CSS color). Overrides the fixed Motion Lab pink
   * (`#ff5c93`). Omit to use the exact lab hue as-is.
   */
  accent?: string;
  /**
   * Plate B ink color (any CSS color). Overrides the fixed Motion Lab blue
   * (`#3aa0ff`). Omit to use the exact lab hue as-is.
   */
  secondary?: string;
  /** Deterministic seed for the plate drift/blink phasing (SSR-stable). */
  seed?: number;
  /** Pause the drift when scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
  /** Force the static, motion-free variant regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Deterministic model                                                        */
/* -------------------------------------------------------------------------- */

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
const ease = (x: number) => {
  const c = clamp(x, 0, 1);
  return c * c * (3 - 2 * c);
};
const TAU = Math.PI * 2;

/** Fixed screen-angle offset between the two halftone grids — the print-industry
 *  answer to moiré: two different dot-grid angles never fully beat together. */
const PLATE_B_ANGLE = (28 * Math.PI) / 180;
/** How often the plates hunt through a full drift → converge → lock → release cycle. */
const BEAT = 7.5;
/** Reference dot pitch at density = 1. */
const BASE_PITCH = 17;

interface RisoModel {
  /** Phase/frequency jitter on plate A's lissajous drift — seed-derived. */
  phA: number;
  freqA: number;
  /** Phase/frequency jitter on plate B's lissajous drift — seed-derived. */
  phB: number;
  freqB: number;
  /** Per-corner blink phase offset (radians), seed-derived so corners never sync. */
  cornerPhase: [number, number, number, number];
}

/** The halftone grid itself is a uniform deterministic tiling (no per-tile
 *  randomness, matching the choreography source); `seed` instead perturbs the
 *  lissajous drift phase/frequency and the corner-blink stagger, so different
 *  seeds read as genuinely different "presses" while staying SSR-stable. */
function buildModel(seed: number): RisoModel {
  const rng = makeRng(seed);
  return {
    phA: rng() * TAU,
    freqA: 0.85 + rng() * 0.3,
    phB: rng() * TAU,
    freqB: 0.85 + rng() * 0.3,
    cornerPhase: [rng() * TAU, rng() * TAU, rng() * TAU, rng() * TAU],
  };
}

/* -------------------------------------------------------------------------- */
/* Canvas colors                                                             */
/* -------------------------------------------------------------------------- */

/**
 * FIXED Motion Lab palette — this background is a committed-dark, single-
 * visual-world design. Colors are NOT resolved from CSS tokens; they are the
 * exact lab hex/rgba values so the shipped component matches the prototype
 * pixel-for-pixel regardless of host page or theme. `accent`/`secondary` are
 * the only intentional override points (plate A / plate B).
 */
const LAB = {
  /** Opaque canvas ground, painted first every frame. */
  ground: "#0a0b10",
  /** Plate A (pink) and plate B (blue) ink hues + their exact base alpha —
   *  together `rgba(255,92,147,.75)` / `rgba(58,160,255,.70)` from the lab. */
  plateAHex: "#ff5c93",
  plateAAlpha: 0.75,
  plateBHex: "#3aa0ff",
  plateBAlpha: 0.7,
  /** Corner registration crosshairs (`--ink` in the lab, `#eceef8`). */
  crosshair: "#eceef8",
};

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

/** Parse a CSS color (hex or rgb/rgba) into an [r,g,b] triple — used only to
 *  parse the optional `accent`/`secondary` override props; the fixed lab
 *  plate colors carry their own alpha and skip this entirely. */
function parseRgb(color: string): [number, number, number] {
  const c = color.trim();
  if (c.startsWith("#")) {
    let h = c.slice(1);
    if (h.length === 3) h = h.split("").map((d) => d + d).join("");
    const n = parseInt(h.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).slice(0, 3).map(Number);
    if (parts.length === 3) return [parts[0], parts[1], parts[2]];
  }
  return [255, 255, 255];
}

/** Stamp a rotated dot grid (one filled circle per tile) into the current path,
 *  oversized past the canvas edge so drift never reveals an empty border. */
function plate(ctx: CanvasRenderingContext2D, W: number, H: number, offx: number, offy: number, rotate: boolean, pitch: number, radius: number) {
  ctx.save();
  ctx.translate(W / 2 + offx, H / 2 + offy);
  if (rotate) ctx.rotate(PLATE_B_ANGLE);
  const span = Math.hypot(W, H) / 2 + 40;
  for (let y = -span; y < span; y += pitch) {
    for (let x = -span; x < span; x += pitch) {
      ctx.moveTo(x + radius, y);
      ctx.arc(x, y, radius, 0, TAU);
    }
  }
  ctx.restore();
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

const STILL_FRAME_SECONDS = 7.3;

/**
 * RisoRegistrationBackground — two halftone "ink plates" (rotated dot grids,
 * plate B offset ~28° from plate A — the print-industry screen-angle convention
 * so the grids never fully beat into moiré) drifting on independent lissajous
 * cycles, always screen-blended (the lab is a committed-dark, single-visual-
 * world design — the ground is always `#0a0b10`, so there's no light-ground
 * branch). Every `BEAT` seconds the plates converge, SNAP into register with a
 * roller-flash sweep, then release back into drift. Corner registration
 * crosshairs blink out of phase with both plates. One `<canvas>` + one
 * requestAnimationFrame loop — no per-frame React state, no WebGL, and no
 * `Math.random`/`Date.now` at render, so server and client first paint match.
 * Decorative: renders `children` as foreground content over a frosted scrim.
 * Committed-dark: paints an opaque `#0a0b10` ground first every frame and
 * uses the fixed Motion Lab palette (not CSS tokens), so it looks identical
 * regardless of host page or theme — pixel-matched to the Motion Lab
 * prototype. Clean-room original — not a port of any duotone/glitch/CMYK-
 * misregistration effect.
 */
export function RisoRegistrationBackground({
  density = 1,
  intensity = 1,
  speed = 1,
  safeArea = { x: 0.04, y: 0.12, w: 0.52, h: 0.76 },
  accent,
  secondary,
  seed = 1,
  pauseWhenHidden = true,
  reducedMotion,
  className,
  style,
  children,
  ...props
}: RisoRegistrationProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `mk-rr-${uid}`;
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const systemReduced = useReducedMotion();
  // The system preference isn't known at SSR, so ignore it until after mount —
  // server and first client render agree on data-motion (no hydration mismatch).
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const staticMode = reducedMotion === true || speed <= 0 || (hydrated && systemReduced);
  const onScreen = useVisibilityPause(wrapRef, { threshold: 0.01 });
  const paused = pauseWhenHidden && !onScreen;
  const animate = !staticMode && !paused;

  const model = React.useMemo(() => buildModel(seed), [seed]);

  // Live prop mirror so the rAF loop reads fresh values without re-subscribing.
  const paramsRef = React.useRef({ density, intensity, speed, safeArea, accent, secondary });
  paramsRef.current = { density, intensity, speed, safeArea, accent, secondary };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    // jsdom / unsupported contexts return null — render markup, skip drawing.
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const measure = () => {
      const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
      width = wrap.clientWidth || 1;
      height = wrap.clientHeight || 1;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    measure();

    const draw = (timeSec: number) => {
      const { density: den, intensity: inten, speed: spd, accent: accentProp, secondary: secondaryProp } = paramsRef.current;

      const W = width;
      const H = height;
      ctx.clearRect(0, 0, W, H);
      // Opaque lab ground — the FIRST canvas op every frame. The plates blend
      // via 'screen', which assumes a dark ground, so this makes the
      // component self-contained and pixel-identical regardless of host
      // page background or theme.
      ctx.fillStyle = LAB.ground;
      ctx.fillRect(0, 0, W, H);
      const glow = clamp(inten, 0, 1.4);
      const t = timeSec;

      // Fixed lab plate hues — `accent`/`secondary` are the only override points.
      const [par, pag, pab] = parseRgb(accentProp || LAB.plateAHex);
      const [pbr, pbg, pbb] = parseRgb(secondaryProp || LAB.plateBHex);

      const pitch = clamp(BASE_PITCH / clamp(den, 0.4, 1.8), 10, 32);

      const tb = (t % BEAT) / BEAT;
      // Lock envelope: drift → converge → locked flash → release.
      const lock = ease((tb - 0.72) / 0.1) * (1 - ease((tb - 0.88) / 0.12));
      const drift = 1 - lock;
      const driftScale = clamp(spd, 0, 2);

      const ax = Math.sin(t * 0.9 * model.freqA + model.phA) * 10 * driftScale * drift;
      const ay = Math.cos(t * 0.7 * model.freqA + model.phA * 0.6) * 7 * driftScale * drift;
      const bx = -Math.sin(t * 0.66 * model.freqB + 1.4 + model.phB) * 11 * driftScale * drift;
      const by = Math.sin(t * 0.83 * model.freqB + 0.6 + model.phB) * 8 * driftScale * drift;
      const rad = pitch * (0.3 - 0.05 * lock);

      // Always 'screen' — the lab is a committed-dark, single-visual-world
      // design (the ground is always #0a0b10), so there's no light-ground
      // branch to pick 'multiply' for anymore.
      ctx.globalCompositeOperation = "screen";
      const plateAlpha = clamp(LAB.plateAAlpha * glow, 0, 1);
      const plateAlphaB = clamp(LAB.plateBAlpha * glow, 0, 1);
      ctx.fillStyle = `rgba(${par},${pag},${pab},${plateAlpha})`;
      ctx.beginPath();
      plate(ctx, W, H, ax, ay, false, pitch, rad);
      ctx.fill();
      ctx.fillStyle = `rgba(${pbr},${pbg},${pbb},${plateAlphaB})`;
      ctx.beginPath();
      plate(ctx, W, H, bx, by, true, pitch, rad);
      ctx.fill();

      // Register flash + roller sweep at the lock beat.
      if (lock > 0) {
        ctx.fillStyle = `rgba(255,255,255,${lock * 0.06 * glow})`;
        ctx.fillRect(0, 0, W, H);
        const rx = ((tb - 0.72) / 0.28) * W * 1.4 - W * 0.2;
        const g = ctx.createLinearGradient(rx - 90, 0, rx + 90, 0);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.5, `rgba(255,255,255,${lock * 0.38 * glow})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(rx - 90, 0, 180, H);
      }
      ctx.globalCompositeOperation = "source-over";

      // Corner registration crosshairs — staggered blink, out of phase with
      // both plates.
      const inset = clamp(Math.min(W, H) * 0.06, 24, 46);
      const arm = inset * 0.32;
      const corners: Array<[number, number]> = [[inset, inset], [W - inset, inset], [inset, H - inset], [W - inset, H - inset]];
      ctx.strokeStyle = withAlpha(LAB.crosshair, 0.55 * glow);
      ctx.lineWidth = 1.4;
      corners.forEach(([cx, cy], i) => {
        const a = 0.45 + 0.4 * Math.max(0, Math.sin(t * 1.5 + cx * 0.01 + cy * 0.013 + model.cornerPhase[i]));
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.moveTo(cx - arm, cy);
        ctx.lineTo(cx + arm, cy);
        ctx.moveTo(cx, cy - arm);
        ctx.lineTo(cx, cy + arm);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      // Readable scrim over the hero zone — drawn LAST. Exact lab formula:
      // fixed center/radius, `rgba(10,11,16,a)` (the lab ground), independent
      // of the `safeArea` prop (which only shapes the DOM frosted scrim).
      paintQuietZone(ctx, W, H, paramsRef.current.safeArea, 0.93, 0.6, 0.55);
    };

    let raf = 0;
    let startTime = 0;
    const loop = (now: number) => {
      if (!startTime) startTime = now;
      draw((now - startTime) / 1000);
      raf = requestAnimationFrame(loop);
    };

    if (animate) raf = requestAnimationFrame(loop);
    else draw(STILL_FRAME_SECONDS);

    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          measure();
          if (!animate) draw(STILL_FRAME_SECONDS);
        })
      : null;
    ro?.observe(wrap);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [model, animate, staticMode]);

  const css = `
.${cls} { position: absolute; inset: 0; background: #0a0b10; }
.${cls} .mk-rr-canvas { display: block; width: 100%; height: 100%; }
.${cls} .mk-rr-fallback { display: none; }
@media (forced-colors: active) {
  .${cls} .mk-rr-canvas { display: none; }
  .${cls} .mk-rr-fallback {
    display: block; position: absolute; inset: 7%;
    border: 1px solid CanvasText; border-radius: 14px; background: Canvas;
  }
}`.trim();

  return (
    <div className={cn("relative isolate overflow-hidden", className)} style={style} {...props}>
      <div
        ref={wrapRef}
        aria-hidden="true"
        data-paused={paused ? "true" : "false"}
        data-motion={staticMode ? "static" : "animated"}
        className={cn("pointer-events-none absolute inset-0 overflow-hidden", cls)}
      >
        <canvas ref={canvasRef} className="mk-rr-canvas" />
        <div className="mk-rr-fallback" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </div>

      {/* Readability comes solely from the canvas-painted quiet zone (drawn last
          each frame, exact Motion Lab values). No DOM blur layer — a backdrop
          filter on top of it stacks into a visible dark ellipse. */}
      {children != null ? <div className="relative z-10">{children}</div> : null}
    </div>
  );
}

export default RisoRegistrationBackground;
