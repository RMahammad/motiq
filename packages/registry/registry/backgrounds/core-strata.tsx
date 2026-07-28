"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface CoreStrataRect {
  /** 0–1 left edge of the readable safe area. */
  x: number;
  /** 0–1 top edge of the readable safe area. */
  y: number;
  /** 0–1 width of the readable safe area. */
  w: number;
  /** 0–1 height of the readable safe area. */
  h: number;
}

export interface CoreStrataProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Sediment band density — more, thinner bands and more frequent marker seams at higher values. ~0.4–1.8. */
  density?: number;
  /** Overall luminance/opacity of the strata field (0–1.4). */
  intensity?: number;
  /** Vertical core-scroll + survey-beam speed multiplier. 0 parks the beam at `readingLine` (still legible). */
  speed?: number;
  /** Number of baked diagonal fault breaks that vertically offset the strata columns (clamped 1–6). */
  faults?: number;
  /** 0–1 vertical position of the fixed reading-line datum; also where the survey beam parks when motion stops. */
  readingLine?: number;
  /** Region where a radial quiet-zone scrim dims the strata so foreground text stays readable. */
  safeArea?: CoreStrataRect;
  /** Marker/ignition + reading-line color. Defaults to the fixed Motion Lab amber (#e8a852) when unset. */
  accent?: string;
  /** Deterministic seed for the generated geometry (SSR-stable). */
  seed?: number;
  /** Pause the scroll + beam sweep when scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
  /** Force the static, motion-free variant regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Deterministic model                                                       */
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
const smoothstep = (t: number) => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};

/** Fixed logical field the strata are baked into; drawn "slice"-cropped into the
 *  measured canvas (like the previous SVG's preserveAspectRatio="slice"), so the
 *  geometry model doesn't need to be rebuilt on every resize. */
const LOGICAL_W = 1200;
const LOGICAL_H = 760;
const PERIOD = LOGICAL_H * 1.4 + 2;

interface Band {
  y: number;
  h: number;
  tone: number;
  mark: boolean;
}

interface LayerModel {
  /** Vertical scroll speed (logical px/sec at speed=1). */
  speed: number;
  /** Depth dimming — deeper (slower) layers read fainter. */
  dim: number;
  bands: Band[];
}

interface FaultDef {
  /** Column boundary x at y=0 (logical). */
  x0: number;
  /** Extra x at y=LOGICAL_H, purely decorative (the diagonal break line). */
  skew: number;
}

interface StrataModel {
  layers: LayerModel[];
  faults: FaultDef[];
  /** Per-column vertical throw (index 0 = leftmost column, unshifted). */
  throws: number[];
}

/** Three parallax depths: deep/slow/dim → near/fast/bright, mirroring the
 *  Motion Lab "Deep Scan" choreography. */
const LAYER_DEFS = [
  { speed: 12, dim: 0.3, markEveryBase: 60 },
  { speed: 26, dim: 0.55, markEveryBase: 9 },
  { speed: 46, dim: 1, markEveryBase: 6 },
] as const;

function buildModel(seed: number, density: number, faultCountRaw: number): StrataModel {
  const rng = makeRng(seed >>> 0);
  const den = clamp(density, 0.4, 1.8);

  const layers: LayerModel[] = LAYER_DEFS.map((def) => {
    const markEvery = clamp(Math.round(def.markEveryBase / den), 3, 140);
    const hScale = clamp(1 / den, 0.55, 1.8);
    const bands: Band[] = [];
    let y = 0;
    while (y < PERIOD && bands.length < 200) {
      const h = (10 + rng() * 34) * hScale;
      bands.push({
        y,
        h,
        tone: 0.25 + rng() * 0.75,
        mark: bands.length % markEvery === markEvery - 1,
      });
      y += h + 2;
    }
    return { speed: def.speed, dim: def.dim, bands };
  });

  const faultCount = clamp(Math.round(faultCountRaw), 1, 6);
  const faults: FaultDef[] = [];
  for (let i = 0; i < faultCount; i++) {
    const raw = LOGICAL_W * ((i + 0.5) / faultCount) + (rng() - 0.5) * (LOGICAL_W / faultCount) * 0.6;
    const skew = (rng() - 0.5) * LOGICAL_W * 0.08;
    faults.push({ x0: clamp(raw, 10, LOGICAL_W - 10), skew });
  }
  faults.sort((a, b) => a.x0 - b.x0);

  const throws: number[] = [0];
  for (let i = 0; i < faultCount; i++) throws.push(throws[i] + (rng() - 0.5) * 40);

  return { layers, faults, throws };
}

/** For the parked/still frame: pick a marker band near the middle of the list
 *  (deterministic, seed-stable) and return the scroll offset that centers it
 *  exactly on `sy` — so the still frame always shows a lit marker, not a
 *  coincidence of whatever time value was passed in. */
function forcedOffsetFor(bands: Band[], sy: number): number {
  const markers = bands.filter((b) => b.mark);
  if (!markers.length) return 0;
  const chosen = markers[Math.floor(markers.length / 2)];
  const center = chosen.y + chosen.h / 2;
  return ((center - sy) % PERIOD + PERIOD) % PERIOD;
}

/* -------------------------------------------------------------------------- */
/* Canvas colors                                                              */
/* -------------------------------------------------------------------------- */

/** Fixed Motion Lab "Deep Scan" palette. This is a deliberate committed-dark,
 *  single-visual-world design — colors are NOT resolved from theme tokens, so
 *  the field renders pixel-identical to the lab prototype regardless of host
 *  page or theme. `accent` overrides only the amber marker/beam hue. */
const LAB = {
  ground: "#0a0b10", // canvas ground + quiet-zone scrim base
  line: "#232636", // fault-break seam stroke
  amber: "#e8a852", // marker seams + survey beam (accent-overridable)
  streak: "#ffd696", // ignition streak flare through a lit seam
  beamCore: "#ffe2b2", // survey beam hairline core — rgba(255,226,178,.75)
  violet: "#7c74be", // non-marker sediment tint
} as const;

/** Add an alpha channel to a fixed hex/rgb color for gradients. */
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
 * CoreStrata — a geological core-sample scanner background: three parallax
 * depths of sediment bands drift upward at different speeds while a luminous
 * survey beam sweeps down and up the field, igniting amber marker seams
 * (bloom + horizontal streak) the instant it crosses them. Baked diagonal
 * fault breaks step the columns vertically for a physical, layered read. One
 * `<canvas>` + one requestAnimationFrame loop — no per-frame React state, no
 * WebGL, and no `Math.random`/`Date.now` at render, so server and client
 * first paint match (geometry is a deterministic mulberry32 model keyed by
 * `seed`, baked into a fixed logical field and slice-projected into the
 * measured canvas). Decorative: renders `children` as foreground content
 * behind a frosted readability scrim over the safe area. Clean-room original.
 */
export function CoreStrata({
  density = 1,
  intensity = 1,
  speed = 1,
  faults = 3,
  readingLine = 0.62,
  safeArea = { x: 0.04, y: 0.12, w: 0.56, h: 0.76 },
  accent,
  seed = 1,
  pauseWhenHidden = true,
  reducedMotion,
  className,
  style,
  children,
  ...props
}: CoreStrataProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `mk-cs-${uid}`;
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const systemReduced = useReducedMotion();
  // The system preference isn't known at SSR, so ignore it until after mount —
  // server and first client render agree on data-motion (no hydration mismatch);
  // the static snapshot engages a frame later if reduced motion is on.
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  // Frozen for ANY reason (reduced-motion, an explicit still, or speed<=0) reads
  // as `data-motion="static"` and never starts the loop — consistent across the batch.
  const staticMode = reducedMotion === true || speed <= 0 || (hydrated && systemReduced);
  const onScreen = useVisibilityPause(wrapRef, { threshold: 0.01 });
  const paused = pauseWhenHidden && !onScreen;
  const animate = !staticMode && !paused;

  const model = React.useMemo(() => buildModel(seed, density, faults), [seed, density, faults]);

  // Live prop mirror so the rAF loop reads fresh values without re-subscribing.
  const paramsRef = React.useRef({ intensity, speed, readingLine, safeArea, accent });
  paramsRef.current = { intensity, speed, readingLine, safeArea, accent };

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
      const { intensity: inten, speed: spd, readingLine: rl, accent: acc } = paramsRef.current;

      const W = width;
      const H = height;
      // Opaque lab ground FIRST — the additive 'lighter' glow below assumes a
      // dark ground, so this makes the component self-contained and
      // pixel-identical to the lab regardless of host page/theme.
      ctx.fillStyle = LAB.ground;
      ctx.fillRect(0, 0, W, H);
      const glow = clamp(inten, 0, 1.4);
      const scale = Math.max(W / LOGICAL_W, H / LOGICAL_H);
      const offX = (W - LOGICAL_W * scale) / 2;
      const offY = (H - LOGICAL_H * scale) / 2;
      const px = (lx: number) => lx * scale + offX;
      const py = (ly: number) => ly * scale + offY;

      const stalled = spd <= 0 || staticMode;
      const tempo = clamp(spd, 0.05, 4);
      const readingFrac = clamp(rl, 0, 1);
      const markerColor = acc || LAB.amber;

      // Survey beam: an eased bounce top↔bottom (period 9s at speed=1), parked
      // at the reading line when stalled.
      let sy: number;
      if (stalled) {
        sy = readingFrac * LOGICAL_H;
      } else {
        const SCAN = 9;
        const sp = ((timeSec * tempo) % SCAN) / SCAN;
        sy = LOGICAL_H * 0.08 + LOGICAL_H * 0.84 * (sp < 0.5 ? smoothstep(sp * 2) : smoothstep(2 - sp * 2));
      }

      // Strata layers — deepest/slowest first, so nearer/faster layers paint on top.
      model.layers.forEach((layer) => {
        const off = stalled
          ? forcedOffsetFor(layer.bands, sy)
          : (timeSec * tempo * layer.speed) % PERIOD;

        layer.bands.forEach((band) => {
          let y = band.y - off;
          if (y < -band.h) y += PERIOD;
          if (y > PERIOD + 4) return;

          for (let ci = 0; ci <= model.faults.length; ci++) {
            const colX0 = ci === 0 ? 0 : model.faults[ci - 1].x0;
            const colX1 = ci === model.faults.length ? LOGICAL_W : model.faults[ci].x0;
            const by = y + model.throws[ci];
            const sx0 = px(colX0);
            const sx1 = px(colX1);
            const sy0 = py(by);
            const sh = band.h * scale;

            if (band.mark) {
              const near = Math.abs(by + band.h / 2 - sy);
              const lit = Math.exp(-(near * near) / (2 * 46 * 46));
              ctx.fillStyle = withAlpha(markerColor, clamp((0.18 + 0.65 * lit) * layer.dim * glow, 0, 1));
              ctx.fillRect(sx0, sy0, sx1 - sx0, sh);
              if (lit > 0.25) {
                // Ignition streak — a horizontal additive flare through the seam.
                ctx.save();
                ctx.globalCompositeOperation = "lighter";
                const g = ctx.createLinearGradient(sx0, sy0, sx1, sy0);
                g.addColorStop(0, withAlpha(markerColor, 0));
                g.addColorStop(0.5, withAlpha(LAB.streak, clamp(0.45 * lit * layer.dim * glow, 0, 1)));
                g.addColorStop(1, withAlpha(markerColor, 0));
                ctx.fillStyle = g;
                ctx.fillRect(sx0, sy0 - 2 * scale, sx1 - sx0, sh + 4 * scale);
                ctx.restore();
                ctx.fillStyle = withAlpha(markerColor, clamp((0.2 + 0.7 * lit) * layer.dim * glow, 0, 1));
                ctx.fillRect(sx0, sy0, sx1 - sx0, sh);
              }
            } else {
              ctx.fillStyle = withAlpha(LAB.violet, clamp(band.tone * 0.16 * layer.dim * glow, 0, 1));
              ctx.fillRect(sx0, sy0, sx1 - sx0, sh);
            }
          }
        });
      });

      // Baked fault breaks — faint diagonal seams hinting the column throws.
      model.faults.forEach((f) => {
        ctx.save();
        ctx.strokeStyle = withAlpha(LAB.line, 0.4 * glow);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px(f.x0), py(0));
        ctx.lineTo(px(f.x0 + f.skew), py(LOGICAL_H));
        ctx.stroke();
        ctx.restore();
      });

      // Survey beam glow + hairline (screen-space, full width).
      const beamY = py(sy);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const bg = ctx.createLinearGradient(0, beamY - 70 * scale, 0, beamY + 70 * scale);
      bg.addColorStop(0, withAlpha(markerColor, 0));
      bg.addColorStop(0.5, withAlpha(markerColor, clamp(0.16 * glow, 0, 1)));
      bg.addColorStop(1, withAlpha(markerColor, 0));
      ctx.fillStyle = bg;
      ctx.fillRect(0, beamY - 70 * scale, W, 140 * scale);
      // Beam core hairline — fixed lab value rgba(255,226,178,.75) at glow=1.
      ctx.fillStyle = withAlpha(LAB.beamCore, clamp(0.75 * glow, 0, 1));
      ctx.fillRect(0, beamY - 0.7, W, 1.4);
      ctx.restore();

      // Fixed reading-line datum: a faint dashed reference + two end ticks.
      const lineY = py(readingFrac * LOGICAL_H);
      ctx.save();
      ctx.strokeStyle = withAlpha(markerColor, clamp(0.32 * glow, 0, 1));
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 7]);
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(W, lineY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1.4;
      [14, W - 14].forEach((tx) => {
        ctx.beginPath();
        ctx.moveTo(tx, lineY - 8);
        ctx.lineTo(tx, lineY + 8);
        ctx.stroke();
      });
      ctx.restore();

      // Quiet-zone scrim — painted LAST, in the lab ground color with the exact
      // Deep Scan alpha falloff, so strata and lit seams dim under the copy
      // without erasing them.
      paintQuietZone(ctx, W, H, paramsRef.current.safeArea, 0.85, 0.6, 0.45);
    };

    let raf = 0;
    let startTime = 0;
    const loop = (now: number) => {
      if (!startTime) startTime = now;
      draw((now - startTime) / 1000);
      raf = requestAnimationFrame(loop);
    };

    if (animate) raf = requestAnimationFrame(loop);
    else draw(7.3);

    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          measure();
          if (!animate) draw(7.3);
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
.${cls} .mk-cs-canvas { display: block; width: 100%; height: 100%; }
.${cls} .mk-cs-fallback { display: none; }
@media (forced-colors: active) {
  .${cls} .mk-cs-canvas { display: none; }
  .${cls} .mk-cs-fallback {
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
        <canvas ref={canvasRef} className="mk-cs-canvas" />
        <div className="mk-cs-fallback" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </div>

      {/* Readability comes solely from the canvas-painted quiet zone (drawn last
          each frame, exact Motion Lab values). No DOM blur layer — a backdrop
          filter on top of it stacks into a visible dark ellipse. */}
      {children != null ? <div className="relative z-10">{children}</div> : null}
    </div>
  );
}

export default CoreStrata;
