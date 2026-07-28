"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface ChartRecorderRect {
  /** 0–1 left edge of the readable safe area. */
  x: number;
  /** 0–1 top edge of the readable safe area. */
  y: number;
  /** 0–1 width of the readable safe area. */
  w: number;
  /** 0–1 height of the readable safe area. */
  h: number;
}

export interface ChartRecorderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of instrument lanes (2–5). Default 5 (the full violet→cyan spectrum). */
  lanes?: number;
  /** Tick/lattice detail density multiplier. ~0.6–1.6. */
  density?: number;
  /** Overall ink luminance/glow of the field (0–1.4). */
  intensity?: number;
  /** Pen-sweep speed multiplier. 0 freezes on a single rich still frame. */
  speed?: number;
  /** Region where lanes thin/quiet down so foreground text stays readable (0–1 coords). */
  safeArea?: ChartRecorderRect;
  /**
   * Violet end of the lane spectrum (any CSS color). Overrides lane 0's fixed
   * Motion Lab hue (`#9e84ff`); the remaining lanes always keep their exact
   * lab colors. Omit to use the fixed lab spectrum as-is.
   */
  accent?: string;
  /** Deterministic seed for the generated geometry (SSR-stable). */
  seed?: number;
  /** Pause the sweep when scrolled offscreen or the tab is hidden. */
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
const TAU = Math.PI * 2;

interface Harmonic {
  /** Full sine cycles across the whole travel width (resolution-independent). */
  cycles: number;
  /** Amplitude as a fraction of the lane slot height. */
  a: number;
  p: number;
  /** Drift rate (rad/sec) — the trace keeps evolving, never a frozen shape. */
  dr: number;
}

interface LanePacket {
  u: number;
  v: number;
  s: number;
  tw: number;
}

interface LaneModel {
  /** 0–1 fraction down the lane board — (index + 0.5) / laneCount. */
  cyFrac: number;
  h: [Harmonic, Harmonic];
  /** 2 event positions, 0–1 fraction along travel. */
  events: number[];
  packets: LanePacket[];
  /** Pen progress speed, fraction of travel per second. */
  speed: number;
  phase: number;
}

/** Reference width the seeded spatial frequencies were tuned against, so lane
 *  wave density reads the same regardless of the container's actual pixel width. */
const NOMINAL_TRAVEL = 1200 * 0.9;

function buildLanes(seed: number, n: number): LaneModel[] {
  return Array.from({ length: n }, (_, i) => {
    const rng = makeRng((seed >>> 0) * 2654435761 + i * 40503 + 13);
    const h: [Harmonic, Harmonic] = [
      { cycles: (0.004 + rng() * 0.005) * NOMINAL_TRAVEL, a: 0.46 * (0.6 + rng() * 0.4), p: rng() * TAU, dr: 0.14 + rng() * 0.18 },
      { cycles: (0.011 + rng() * 0.007) * NOMINAL_TRAVEL, a: 0.46 * (0.25 + rng() * 0.3), p: rng() * TAU, dr: -0.22 - rng() * 0.2 },
    ];
    const events = Array.from({ length: 2 }, () => 0.16 + rng() * 0.76);
    const packets: LanePacket[] = Array.from({ length: 9 }, () => ({
      u: rng(),
      v: 0.014 + rng() * 0.03,
      s: 0.8 + rng() * 1.6,
      tw: rng() * TAU,
    }));
    return {
      cyFrac: (i + 0.5) / n,
      h,
      events,
      packets,
      speed: 0.07 + rng() * 0.05,
      phase: rng(),
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Canvas colors                                                             */
/* -------------------------------------------------------------------------- */

/**
 * FIXED Motion Lab palette — this background is a committed-dark, single-
 * visual-world design. Colors are NOT resolved from CSS tokens; they are the
 * exact lab hex/rgb values so the shipped component matches the prototype
 * pixel-for-pixel regardless of host page or theme. Only lane 0 (via the
 * `accent` prop) is an intentional override point.
 */
const LAB = {
  /** Opaque canvas ground, painted first every frame. */
  ground: "#0a0b10",
  /** Exact 5-lane violet→cyan spectrum from the lab (`c-recorder`). */
  laneColors: [
    [158, 132, 255],
    [124, 108, 255],
    [96, 168, 255],
    [62, 200, 232],
    [53, 213, 229],
  ] as Array<[number, number, number]>,
  /** Aurora undercurrent hues — fixed, independent of the `accent` prop. */
  auroraViolet: [124, 108, 255] as [number, number, number],
  auroraCyan: [53, 213, 229] as [number, number, number],
  /** Reactive instrument lattice dot color. */
  lattice: [150, 150, 200] as [number, number, number],
  /** Baseline time-tick color (`--muted` in the lab, `#8f95ab`). */
  ticks: "#8f95ab",
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
 *  parse the optional `accent` override prop; every other hue is fixed. */
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

/** 0 (outside) → 1 (center) elliptical falloff around the safe area — quiets
 *  wave amplitude and lattice glow near readable copy (no runtime mask). */
function safeFalloff(px: number, py: number, W: number, H: number, sa: ChartRecorderRect): number {
  const cx = (sa.x + sa.w / 2) * W;
  const cy = (sa.y + sa.h / 2) * H;
  const rx = Math.max(1, (sa.w / 2) * W * 1.1);
  const ry = Math.max(1, (sa.h / 2) * H * 1.1);
  const dx = (px - cx) / rx;
  const dy = (py - cy) / ry;
  return clamp(1 - Math.hypot(dx, dy), 0, 1);
}

/** Lane trace height at a given fraction `u` (0–1) along the travel. `po` offsets
 *  the phase (braided companion bands), `ampScale` scales amplitude (ghost vs
 *  braid passes). Amplitude is quieted near the safe area (never a runtime mask). */
function laneY(
  l: LaneModel, u: number, t: number, po: number, ampScale: number,
  slot: number, cyPx: number, safeQ: number,
): number {
  let d = 0;
  for (const h of l.h) d += h.a * slot * ampScale * Math.sin(u * h.cycles * TAU + h.p + po + t * h.dr);
  const q = 1 - 0.75 * safeQ;
  return cyPx - d * q;
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
 * ChartRecorderBackground — a live multi-channel signal-recorder field: 2–5
 * instrument lanes (a fixed violet→cyan Motion Lab spectrum) each carry a
 * calm, seeded,
 * continuously-evolving waveform with braided companion harmonics, ~9 streaming
 * data-packet particles, a triple-pass bloom pen trail (white-hot fading into
 * the lane's own hue), a read-head hairline, and a reactive dot lattice that
 * brightens near the pens. Lanes occasionally fire an "event": a double ring +
 * lane flash + vertical beam burst timed to the pen's own revolution — computed
 * statelessly from each lane's phase (no growing arrays, so a single still frame
 * and the live loop render identically). One `<canvas>` + one
 * requestAnimationFrame loop — no per-frame React state, no WebGL, and no
 * `Math.random`/`Date.now` at render, so server and client first paint match.
 * Decorative: renders `children` as foreground content over a frosted scrim.
 * Committed-dark: paints an opaque `#0a0b10` ground first every frame and
 * uses the fixed Motion Lab palette (not CSS tokens), so it looks identical
 * regardless of host page or theme — pixel-matched to the Motion Lab
 * prototype. Clean-room original — not a port of any real telemetry/EKG/
 * oscilloscope feed.
 */
export function ChartRecorderBackground({
  lanes = 5,
  density = 1,
  intensity = 1,
  speed = 1,
  safeArea = { x: 0.04, y: 0.12, w: 0.52, h: 0.76 },
  accent,
  seed = 1,
  pauseWhenHidden = true,
  reducedMotion,
  className,
  style,
  children,
  ...props
}: ChartRecorderProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `mk-cr-${uid}`;
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

  const laneCount = clamp(Math.round(lanes), 2, 5);
  const model = React.useMemo(() => buildLanes(seed, laneCount), [seed, laneCount]);

  // Live prop mirror so the rAF loop reads fresh values without re-subscribing.
  const paramsRef = React.useRef({ density, intensity, speed, safeArea, accent });
  paramsRef.current = { density, intensity, speed, safeArea, accent };

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
      const { density: den, intensity: inten, safeArea: sa, accent: accentProp } = paramsRef.current;

      const W = width;
      const H = height;
      ctx.clearRect(0, 0, W, H);
      // Opaque lab ground — the FIRST canvas op every frame. The additive
      // 'lighter' glow below assumes a dark ground, so this makes the
      // component self-contained and pixel-identical regardless of host
      // page background or theme.
      ctx.fillStyle = LAB.ground;
      ctx.fillRect(0, 0, W, H);
      const glow = clamp(inten, 0, 1.4);
      const t = timeSec;

      const n = model.length;
      const top = H * 0.1;
      const bh = H * 0.8;
      const slot = bh / n;
      const x0 = W * 0.05;
      const x1 = W * 0.95;
      const travel = x1 - x0;

      // Fixed lab spectrum — only lane 0 is overridable via `accent`.
      const laneColors = model.map((_, i) => (i === 0 && accentProp ? parseRgb(accentProp) : LAB.laneColors[i]));

      // Aurora undercurrent — two soft drifting washes, additive. Fixed lab
      // hues, independent of the `accent` override (which only touches lane 0).
      ctx.globalCompositeOperation = "lighter";
      const [ar, ag, ab] = LAB.auroraViolet;
      const a1 = ctx.createRadialGradient(W * 0.72 + Math.sin(t * 0.16) * 80, H * 0.28, 0, W * 0.72, H * 0.28, W * 0.55);
      a1.addColorStop(0, `rgba(${ar},${ag},${ab},${0.06 * glow})`);
      a1.addColorStop(1, `rgba(${ar},${ag},${ab},0)`);
      ctx.fillStyle = a1;
      ctx.fillRect(0, 0, W, H);
      const [cr0, cg0, cb0] = LAB.auroraCyan;
      const a2 = ctx.createRadialGradient(W * 0.3, H * 0.82 + Math.cos(t * 0.13) * 60, 0, W * 0.3, H * 0.82, W * 0.5);
      a2.addColorStop(0, `rgba(${cr0},${cg0},${cb0},${0.05 * glow})`);
      a2.addColorStop(1, `rgba(${cr0},${cg0},${cb0},0)`);
      ctx.fillStyle = a2;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";

      // Current pen head per lane — drives the reactive lattice + read heads.
      const pens = model.map((l) => {
        const cyPx = top + bh * l.cyFrac;
        const prog = (t * l.speed + l.phase) % 1;
        const px = x0 + prog * travel;
        const safeQ = safeFalloff(px, cyPx, W, H, sa);
        const py = laneY(l, prog, t, 0, 1, slot, cyPx, safeQ);
        return { px, py };
      });

      // Reactive instrument lattice.
      const pitch = clamp(40 / clamp(den, 0.4, 1.8), 22, 60);
      const [mr, mg, mb] = LAB.lattice;
      for (let gy = top; gy <= top + bh; gy += pitch) {
        for (let gx = x0; gx <= x1; gx += pitch) {
          let al = 0.035;
          for (const p of pens) {
            const dd = (gx - p.px) * (gx - p.px) + (gy - p.py) * (gy - p.py);
            al += 0.2 * Math.exp(-dd / (2 * 95 * 95));
          }
          ctx.fillStyle = `rgba(${mr},${mg},${mb},${clamp(al * glow, 0, 0.3)})`;
          ctx.fillRect(gx - 0.7, gy - 0.7, 1.4, 1.4);
        }
      }

      // Baseline time ticks.
      const tickCount = Math.max(8, Math.round(24 * den));
      ctx.strokeStyle = withAlpha(LAB.ticks, 0.2 * glow);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= tickCount; i++) {
        const x = x0 + (travel * i) / tickCount;
        ctx.moveTo(x, H * 0.925);
        ctx.lineTo(x, H * 0.925 + 6);
      }
      ctx.stroke();

      model.forEach((l, li) => {
        const cyPx = top + bh * l.cyFrac;
        const [cr, cg, cb] = laneColors[li];
        const { px, py } = pens[li];
        const lt = cyPx - slot * 0.46;
        const lb = cyPx + slot * 0.46;

        ctx.globalCompositeOperation = "lighter";

        // Braided companion bands.
        ctx.strokeStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${0.1 * glow})`;
        ctx.lineWidth = 1;
        for (const po of [0.9, -0.9]) {
          ctx.beginPath();
          for (let x = x0; x <= x1; x += 9) {
            const u = (x - x0) / travel;
            const safeQ = safeFalloff(x, cyPx, W, H, sa);
            const y = laneY(l, u, t, po, 0.62, slot, cyPx, safeQ);
            if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        // Ghost main trace: soft glow + a sharper core.
        const tracePath = () => {
          ctx.beginPath();
          for (let x = x0; x <= x1; x += 7) {
            const u = (x - x0) / travel;
            const safeQ = safeFalloff(x, cyPx, W, H, sa);
            const y = laneY(l, u, t, 0, 1, slot, cyPx, safeQ);
            if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
        };
        ctx.strokeStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${0.055 * glow})`;
        ctx.lineWidth = 8;
        tracePath();
        ctx.stroke();
        ctx.strokeStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${0.22 * glow})`;
        ctx.lineWidth = 1.4;
        tracePath();
        ctx.stroke();

        // Streaming data packets.
        for (const pk of l.packets) {
          const u = (pk.u + t * pk.v) % 1;
          const x = x0 + u * travel;
          const safeQ = safeFalloff(x, cyPx, W, H, sa);
          const y = laneY(l, u, t, 0, 1, slot, cyPx, safeQ);
          const fl = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 3 + pk.tw));
          const pgk = ctx.createRadialGradient(x, y, 0, x, y, 6 * pk.s);
          pgk.addColorStop(0, `rgba(255,255,255,${0.5 * fl * glow})`);
          pgk.addColorStop(0.4, `rgba(${cr | 0},${cg | 0},${cb | 0},${0.3 * fl * glow})`);
          pgk.addColorStop(1, `rgba(${cr | 0},${cg | 0},${cb | 0},0)`);
          ctx.fillStyle = pgk;
          ctx.beginPath();
          ctx.arc(x, y, 6 * pk.s, 0, TAU);
          ctx.fill();
        }

        // Hot pen trail — triple-pass bloom, white-hot near the head fading
        // into the lane's own hue.
        const trail = travel * 0.24;
        const SEG = 28;
        const passes: Array<[number, number]> = [[12, 0.05], [5, 0.13], [2, 0.55]];
        for (const [w, ap] of passes) {
          for (let s = 0; s < SEG; s++) {
            const xa = px - (s / SEG) * trail;
            const xb = px - ((s + 1) / SEG) * trail;
            if (xb < x0) break;
            const k = 1 - s / SEG;
            const wr = cr + (255 - cr) * k * 0.8;
            const wg = cg + (255 - cg) * k * 0.8;
            const wb = cb + (255 - cb) * k * 0.5;
            const uxa = (xa - x0) / travel;
            const uxb = (xb - x0) / travel;
            const ya = laneY(l, uxa, t, 0, 1, slot, cyPx, safeFalloff(xa, cyPx, W, H, sa));
            const yb = laneY(l, uxb, t, 0, 1, slot, cyPx, safeFalloff(xb, cyPx, W, H, sa));
            ctx.strokeStyle = `rgba(${wr | 0},${wg | 0},${wb | 0},${(ap * k * k + 0.02) * glow})`;
            ctx.lineWidth = w * k + 0.6;
            ctx.beginPath();
            ctx.moveTo(xa, ya);
            ctx.lineTo(xb, yb);
            ctx.stroke();
          }
        }

        // Read-head hairline.
        const rh = ctx.createLinearGradient(0, lt, 0, lb);
        rh.addColorStop(0, `rgba(${cr | 0},${cg | 0},${cb | 0},0)`);
        rh.addColorStop(0.5, `rgba(${cr | 0},${cg | 0},${cb | 0},${0.38 * glow})`);
        rh.addColorStop(1, `rgba(${cr | 0},${cg | 0},${cb | 0},0)`);
        ctx.strokeStyle = rh;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, lt);
        ctx.lineTo(px, lb);
        ctx.stroke();
        ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${0.8 * glow})`;
        ctx.fillRect(px - 2.5, lt - 1, 5, 2);
        ctx.fillRect(px - 2.5, lb - 1, 5, 2);

        // Pen head.
        const pg = ctx.createRadialGradient(px, py, 0, px, py, 28);
        pg.addColorStop(0, `rgba(255,255,255,${0.95 * glow})`);
        pg.addColorStop(0.25, `rgba(${cr | 0},${cg | 0},${cb | 0},${0.65 * glow})`);
        pg.addColorStop(1, `rgba(${cr | 0},${cg | 0},${cb | 0},0)`);
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(px, py, 28, 0, TAU);
        ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${0.9 * glow})`;
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, TAU);
        ctx.fill();

        // Nib sparks.
        for (let s = 0; s < 5; s++) {
          const jx = px - (s * 8 + (Math.sin(t * 27 + s * 2.2 + li) * 0.5 + 0.5) * 6);
          const jy = py + Math.sin(t * 34 + s * 1.9 + li * 2) * 3.6 * (s / 5 + 0.3);
          const sa2 = (1 - s / 5) * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 44 + s + li)));
          ctx.fillStyle = `rgba(255,255,255,${clamp(sa2 * 0.7 * glow, 0, 0.85)})`;
          ctx.beginPath();
          ctx.arc(jx, jy, 1.5 * (1 - s / 7), 0, TAU);
          ctx.fill();
        }

        // Event markers (static dots — the payoff burst is drawn in a later pass).
        for (const ev of l.events) {
          const ex = x0 + ev * travel;
          const ey = laneY(l, ev, t, 0, 1, slot, cyPx, safeFalloff(ex, cyPx, W, H, sa));
          ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${0.55 * glow})`;
          ctx.beginPath();
          ctx.arc(ex, ey, 2.2, 0, TAU);
          ctx.fill();
        }

        ctx.globalCompositeOperation = "source-over";
      });

      // Event payoffs — double ring + lane flash + vertical beam burst, timed
      // statelessly to how long ago the pen last crossed each event (no
      // accumulating arrays, so the live loop and the static still frame agree).
      ctx.globalCompositeOperation = "lighter";
      model.forEach((l, li) => {
        const cyPx = top + bh * l.cyFrac;
        const lt = cyPx - slot * 0.46;
        const lb = cyPx + slot * 0.46;
        const [cr, cg, cb] = laneColors[li];
        const prog = (t * l.speed + l.phase) % 1;
        for (const ev of l.events) {
          const wrapped = (((prog - ev) % 1) + 1) % 1;
          const age = wrapped / l.speed;
          if (age > 1.7) continue;
          const ex = x0 + ev * travel;
          const ey = laneY(l, ev, t, 0, 1, slot, cyPx, safeFalloff(ex, cyPx, W, H, sa));

          const ringA = 1 - age / 1.7;
          ctx.strokeStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${0.5 * ringA * glow})`;
          ctx.lineWidth = 1.7;
          ctx.beginPath();
          ctx.arc(ex, ey, age * 85, 0, TAU);
          ctx.stroke();
          ctx.strokeStyle = `rgba(255,255,255,${0.35 * ringA * glow})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(ex, ey, age * 52, 0, TAU);
          ctx.stroke();

          if (age < 0.7) {
            const beamA = 1 - age / 0.7;
            const bg = ctx.createLinearGradient(ex - 16, 0, ex + 16, 0);
            bg.addColorStop(0, `rgba(${cr | 0},${cg | 0},${cb | 0},0)`);
            bg.addColorStop(0.5, `rgba(${cr | 0},${cg | 0},${cb | 0},${0.3 * beamA * glow})`);
            bg.addColorStop(1, `rgba(${cr | 0},${cg | 0},${cb | 0},0)`);
            ctx.fillStyle = bg;
            ctx.fillRect(ex - 16, lt - 8, 32, lb - lt + 16);
          }

          if (age < 0.9) {
            const flashA = 1 - age / 0.9;
            const fg = ctx.createLinearGradient(x0, 0, x1, 0);
            fg.addColorStop(0, `rgba(${cr | 0},${cg | 0},${cb | 0},0)`);
            fg.addColorStop(0.5, `rgba(${cr | 0},${cg | 0},${cb | 0},${0.22 * flashA * glow})`);
            fg.addColorStop(1, `rgba(${cr | 0},${cg | 0},${cb | 0},0)`);
            ctx.fillStyle = fg;
            ctx.fillRect(x0, ey - 1.4, travel, 2.8);
          }
        }
      });
      ctx.globalCompositeOperation = "source-over";

      // Hero quiet zone — drawn LAST so lattice, trails and pens dim under the
      // copy. Exact lab formula: fixed center/radius, `rgba(10,11,16,a)` (the
      // lab ground), independent of the `safeArea` prop (which only shapes the
      // amplitude/lattice quieting above, not this readability scrim).
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
.${cls} .mk-cr-canvas { display: block; width: 100%; height: 100%; }
.${cls} .mk-cr-fallback { display: none; }
@media (forced-colors: active) {
  .${cls} .mk-cr-canvas { display: none; }
  .${cls} .mk-cr-fallback {
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
        <canvas ref={canvasRef} className="mk-cr-canvas" />
        <div className="mk-cr-fallback" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </div>

      {/* Readability comes solely from the canvas-painted quiet zone (drawn last
          each frame, exact Motion Lab values). No DOM blur layer — a backdrop
          filter on top of it stacks into a visible dark ellipse. */}
      {children != null ? <div className="relative z-10">{children}</div> : null}
    </div>
  );
}

export default ChartRecorderBackground;
