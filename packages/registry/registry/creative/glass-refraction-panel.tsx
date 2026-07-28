"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface GlassRefractionLayer {
  /** Stable key. */
  id: string;
  /** Layer content — a chip, a stat, a badge. */
  node: React.ReactNode;
  /** Parallax depth in px. Bigger travels further and reads nearer. */
  depth?: number;
  /** Placement inside the panel (percentages keep it fluid). */
  position?: Pick<React.CSSProperties, "top" | "right" | "bottom" | "left">;
}

export interface GlassRefractionPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content of the main (front) glass pane. */
  children?: React.ReactNode;
  /** Extra floating glass panes at their own depths. */
  layers?: GlassRefractionLayer[];
  /** Live scene painted behind the glass. */
  scene?: "orbs" | "none";
  /** Backdrop blur radius in px. */
  blur?: number;
  /** Depth multiplier for the parallax; 0 disables it. */
  parallax?: number;
  /** Sweep a specular band across the main pane on every viewport entry. */
  streakOnEnter?: boolean;
  /** Glass fill override (any CSS color). */
  tint?: string;
  /** Parallax spring — critically damped (ζ≈1.0) so panes settle without wobble. */
  spring?: { stiffness?: number; damping?: number };
  /** Depth of the main pane in px. */
  mainDepth?: number;
  /** Width of the main pane — any CSS length. The panel itself is always fluid. */
  paneWidth?: string;
  /** Minimum panel height in px. */
  minHeight?: number;
  /** Deterministic seed for the orb phases (SSR-stable). */
  seed?: number;
  /** Park the loop while scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
  /** Force the static, motion-free frame regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Physics + palette                                                          */
/* -------------------------------------------------------------------------- */

/** Hand-rolled delta-time spring — keeps the component dependency-free. */
class Spring {
  x: number;
  v = 0;
  target: number;
  k: number;
  d: number;
  constructor(value: number, k: number, d: number) {
    this.x = value;
    this.target = value;
    this.k = k;
    this.d = d;
  }
  step(dt: number): number {
    const a = this.k * (this.target - this.x) - this.d * this.v;
    this.v += a * dt;
    this.x += this.v * dt;
    return this.x;
  }
}

/** mulberry32 — no Math.random at render or module scope (SSR-stable). */
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

type Rgb = [number, number, number];

function toRgb(color: string, fallback: Rgb): Rgb {
  const c = color.trim();
  if (c.startsWith("#")) {
    let h = c.slice(1);
    if (h.length === 3) h = h.split("").map((d) => d + d).join("");
    const n = Number.parseInt(h.slice(0, 6), 16);
    if (Number.isNaN(n)) return fallback;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).slice(0, 3).map(Number);
    if (parts.length === 3 && parts.every((v) => !Number.isNaN(v))) return [parts[0], parts[1], parts[2]];
  }
  return fallback;
}

const rgba = (c: Rgb, a: number) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
/** Rec. 601 luma — decides additive (dark) vs soft-alpha (light) orb blending. */
const isDark = (c: Rgb) => (c[0] * 299 + c[1] * 587 + c[2] * 114) / 1000 < 128;

interface Palette {
  bg: string;
  dark: boolean;
  orbs: Rgb[];
}

function resolvePalette(el: Element): Palette {
  const cs = getComputedStyle(el);
  const g = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb;
  const accent = toRgb(g("--color-accent", "#4f7cff"), [79, 124, 255]);
  const cyan = toRgb(g("--color-secondary-accent", "#22c7d9"), [34, 199, 217]);
  const accentText = toRgb(g("--color-accent-text", "#7f9fff"), [127, 159, 255]);
  const bgHex = g("--color-bg-elevated", g("--color-bg", "#0d1420"));
  return { bg: bgHex, dark: isDark(toRgb(bgHex, [13, 20, 32])), orbs: [accent, cyan, accent, cyan, accentText] };
}

interface Orb {
  r: number;
  cx: number;
  cy: number;
  ax: number;
  ay: number;
  fx: number;
  fy: number;
  ph: number;
}

/** Lab orb field — lissajous drift, fixed proportions, seed only shifts phases. */
const ORB_DEFS: ReadonlyArray<Orb> = [
  { r: 0.34, cx: 0.24, cy: 0.3, ax: 0.16, ay: 0.12, fx: 0.11, fy: 0.09, ph: 0 },
  { r: 0.28, cx: 0.74, cy: 0.26, ax: 0.13, ay: 0.15, fx: 0.08, fy: 0.13, ph: 1.7 },
  { r: 0.3, cx: 0.52, cy: 0.72, ax: 0.18, ay: 0.1, fx: 0.1, fy: 0.07, ph: 3.1 },
  { r: 0.2, cx: 0.16, cy: 0.78, ax: 0.1, ay: 0.12, fx: 0.14, fy: 0.1, ph: 4.4 },
  { r: 0.16, cx: 0.86, cy: 0.66, ax: 0.09, ay: 0.13, fx: 0.12, fy: 0.15, ph: 5.6 },
];

/** The still frame is drawn at this scene time — a hand-picked good orb layout. */
const STILL_T = 1.5;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * GlassRefractionPanel — frosted panes over a live scene. Five gradient orbs
 * drift on lissajous paths across a DPR-capped canvas (additive in dark, soft
 * alpha in light, palette re-read from tokens on theme change), and each glass
 * pane parallaxes at its own depth on a critically damped spring (k=110, d=21),
 * so near panes travel further and the stack reads as real separation. On every
 * viewport entry a rotated specular band sweeps the main pane, delayed 180ms so
 * it reads as light rather than load-in. One rAF loop, translate3d-only layer
 * motion. Clean-room original.
 */
export function GlassRefractionPanel({
  children,
  layers,
  scene = "orbs",
  blur = 16,
  parallax = 1,
  streakOnEnter = true,
  tint,
  spring,
  mainDepth = 16,
  paneWidth = "min(340px, 82%)",
  minHeight = 380,
  seed = 1,
  pauseWhenHidden = true,
  reducedMotion,
  className,
  style,
  ...props
}: GlassRefractionPanelProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `mk-glass-${uid}`;
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const mainRef = React.useRef<HTMLDivElement | null>(null);
  const layerEls = React.useRef<Array<HTMLDivElement | null>>([]);

  const systemReduced = useReducedMotion();
  // Resolved after mount so SSR and first client render agree on data-motion.
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const staticMode = reducedMotion === true || (hydrated && systemReduced);
  const onScreen = useVisibilityPause(rootRef, { threshold: 0.05 });
  const paused = pauseWhenHidden && !onScreen;
  const animate = !staticMode && !paused;

  const stiffness = spring?.stiffness ?? 110;
  const damping = spring?.damping ?? 21;

  const extraLayers = React.useMemo(() => layers ?? [], [layers]);

  const orbs = React.useMemo(() => {
    const rng = makeRng(seed);
    return ORB_DEFS.map((o) => ({ ...o, ph: o.ph + rng() * 0.9 }));
  }, [seed]);

  // One spring pair per pane: index 0 is the main pane, then the extra layers.
  const depths = React.useMemo(
    () => [mainDepth, ...extraLayers.map((l) => l.depth ?? 20)],
    [mainDepth, extraLayers],
  );
  const springsRef = React.useRef<Array<{ x: Spring; y: Spring }>>([]);
  if (springsRef.current.length !== depths.length) {
    springsRef.current = depths.map(() => ({ x: new Spring(0, stiffness, damping), y: new Spring(0, stiffness, damping) }));
  }
  const pointerRef = React.useRef({ active: false, x: 0.5, y: 0.5 });
  const paletteRef = React.useRef<Palette | null>(null);
  const liveRef = React.useRef({ depths, parallax, scene });
  liveRef.current = { depths, parallax, scene };

  React.useEffect(() => {
    springsRef.current.forEach((s) => {
      s.x.k = stiffness;
      s.y.k = stiffness;
      s.x.d = damping;
      s.y.d = damping;
    });
  }, [stiffness, damping]);

  const paintLayers = React.useCallback(() => {
    const main = mainRef.current;
    const s0 = springsRef.current[0];
    if (main && s0) main.style.transform = `translate3d(${s0.x.x.toFixed(2)}px, ${s0.y.x.toFixed(2)}px, 0)`;
    for (let i = 0; i < layerEls.current.length; i++) {
      const el = layerEls.current[i];
      const s = springsRef.current[i + 1];
      if (el && s) el.style.transform = `translate3d(${s.x.x.toFixed(2)}px, ${s.y.x.toFixed(2)}px, 0)`;
    }
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const ctx = canvas.getContext("2d");
    // jsdom / unsupported contexts return null — render markup, skip drawing.
    if (!ctx) return;

    // Size is cached and only re-read on resize — never per frame (layout thrash).
    const measure = () => {
      const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
      const w = Math.max(1, Math.round((root.clientWidth || 1) * dpr));
      const h = Math.max(1, Math.round((root.clientHeight || 1) * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    measure();
    paletteRef.current = resolvePalette(root);

    const drawScene = (t: number) => {
      const pal = paletteRef.current;
      if (!pal) return;
      const W = canvas.width;
      const H = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, W, H);
      if (liveRef.current.scene === "none") return;
      ctx.globalCompositeOperation = pal.dark ? "lighter" : "source-over";
      const base = Math.max(W, H);
      const alpha = pal.dark ? 0.4 : 0.5;
      orbs.forEach((o, i) => {
        const x = (o.cx + Math.sin(t * o.fx * Math.PI * 2 + o.ph) * o.ax) * W;
        const y = (o.cy + Math.cos(t * o.fy * Math.PI * 2 + o.ph) * o.ay) * H;
        const r = o.r * base;
        const c = pal.orbs[i % pal.orbs.length];
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rgba(c, alpha));
        g.addColorStop(0.55, rgba(c, alpha * 0.35));
        g.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    let raf = 0;
    let last = 0;
    let t = 0;
    const frame = (now: number) => {
      if (!last) last = now;
      const dt = clamp((now - last) / 1000, 0, 0.05);
      last = now;
      t += dt;
      drawScene(t * 0.35);
      const { depths: dps, parallax: par } = liveRef.current;
      const p = pointerRef.current;
      // Idle targets keep drifting on a slow lissajous so the stack never freezes.
      const tx = p.active ? (p.x - 0.5) * 2 : Math.sin(t * 0.3) * 0.3;
      const ty = p.active ? (p.y - 0.5) * 2 : Math.cos(t * 0.23) * 0.3;
      springsRef.current.forEach((s, i) => {
        const depth = (dps[i] ?? 0) * par;
        s.x.target = tx * depth;
        s.y.target = ty * depth;
        s.x.step(dt);
        s.y.step(dt);
      });
      paintLayers();
      raf = requestAnimationFrame(frame);
    };

    if (animate) {
      raf = requestAnimationFrame(frame);
    } else {
      springsRef.current.forEach((s) => {
        s.x.x = s.x.target = 0;
        s.y.x = s.y.target = 0;
        s.x.v = 0;
        s.y.v = 0;
      });
      paintLayers();
      drawScene(STILL_T);
    }

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            measure();
            if (!animate) drawScene(STILL_T);
          })
        : null;
    ro?.observe(root);

    // Re-read tokens on theme change (media preference + a data-theme/class swap).
    const refresh = () => {
      paletteRef.current = resolvePalette(root);
      if (!animate) drawScene(STILL_T);
    };
    const mq = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    mq?.addEventListener("change", refresh);
    const mo =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(refresh)
        : null;
    if (typeof document !== "undefined") {
      mo?.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      mo?.disconnect();
      mq?.removeEventListener("change", refresh);
    };
  }, [animate, orbs, paintLayers]);

  /* ---- entrance streak: re-fires on every viewport entry ---- */
  const [sweepKey, setSweepKey] = React.useState(0);
  React.useEffect(() => {
    const main = mainRef.current;
    if (!streakOnEnter || staticMode || !main || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setSweepKey((k) => k + 1);
      },
      { threshold: 0.5 },
    );
    io.observe(main);
    return () => io.disconnect();
  }, [streakOnEnter, staticMode]);

  const onPointerMove = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (!root) return;
    const r = root.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    pointerRef.current = {
      active: true,
      x: clamp((e.clientX - r.left) / r.width, 0, 1),
      y: clamp((e.clientY - r.top) / r.height, 0, 1),
    };
  }, []);
  const onPointerLeave = React.useCallback(() => {
    pointerRef.current.active = false;
  }, []);

  const css = `
.${cls} {
  --mk-glass-fill: rgba(255, 255, 255, 0.55);
  --mk-glass-stroke: rgba(255, 255, 255, 0.85);
  --mk-glass-inner: rgba(16, 24, 40, 0.06);
  --mk-glass-glare: rgba(255, 255, 255, 0.75);
  --mk-glass-shadow: rgba(16, 24, 40, 0.22);
}
@media (prefers-color-scheme: dark) {
  .${cls} {
    --mk-glass-fill: rgba(255, 255, 255, 0.06);
    --mk-glass-stroke: rgba(255, 255, 255, 0.16);
    --mk-glass-inner: rgba(255, 255, 255, 0.05);
    --mk-glass-glare: rgba(255, 255, 255, 0.5);
    --mk-glass-shadow: rgba(2, 5, 12, 0.65);
  }
}
[data-theme="dark"] .${cls}, .dark .${cls} {
  --mk-glass-fill: rgba(255, 255, 255, 0.06);
  --mk-glass-stroke: rgba(255, 255, 255, 0.16);
  --mk-glass-inner: rgba(255, 255, 255, 0.05);
  --mk-glass-glare: rgba(255, 255, 255, 0.5);
  --mk-glass-shadow: rgba(2, 5, 12, 0.65);
}
[data-theme="light"] .${cls}, .light .${cls} {
  --mk-glass-fill: rgba(255, 255, 255, 0.55);
  --mk-glass-stroke: rgba(255, 255, 255, 0.85);
  --mk-glass-inner: rgba(16, 24, 40, 0.06);
  --mk-glass-glare: rgba(255, 255, 255, 0.75);
  --mk-glass-shadow: rgba(16, 24, 40, 0.22);
}
.${cls} .mk-glass-pane {
  position: absolute;
  background: ${tint ?? "var(--mk-glass-fill)"};
  -webkit-backdrop-filter: blur(${blur}px) saturate(1.45);
  backdrop-filter: blur(${blur}px) saturate(1.45);
  border: 1px solid var(--mk-glass-stroke);
  box-shadow:
    inset 0 1px 0 var(--mk-glass-stroke),
    inset 0 -14px 24px -18px var(--mk-glass-inner),
    0 18px 40px -18px var(--mk-glass-shadow);
  overflow: hidden;
  will-change: transform;
}
.${cls} .mk-glass-streak {
  position: absolute;
  top: -45%;
  bottom: -45%;
  left: 0;
  width: 36%;
  background: linear-gradient(100deg, transparent, var(--mk-glass-glare), transparent);
  opacity: 0.55;
  pointer-events: none;
  transform: translateX(-220%) rotate(16deg);
  animation: mk-glass-sweep-${uid} 950ms cubic-bezier(0.2, 0, 0, 1) 180ms both;
}
@keyframes mk-glass-sweep-${uid} {
  from { transform: translateX(-220%) rotate(16deg); }
  to { transform: translateX(420%) rotate(16deg); }
}
@media (prefers-reduced-motion: reduce) {
  .${cls} .mk-glass-streak { animation: none; }
}
@media (forced-colors: active) {
  .${cls} canvas, .${cls} .mk-glass-streak { display: none; }
  .${cls} .mk-glass-pane { background: Canvas; border-color: CanvasText; backdrop-filter: none; }
}`.trim();

  return (
    <div
      ref={rootRef}
      data-motion={staticMode ? "static" : "animated"}
      data-paused={paused ? "true" : "false"}
      onPointerMove={parallax > 0 && !staticMode ? onPointerMove : undefined}
      onPointerLeave={onPointerLeave}
      className={cn("relative isolate grid w-full place-items-center overflow-hidden rounded-2xl", cls, className)}
      style={{ minHeight: `${minHeight}px`, ...style }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full rounded-[inherit]" />

      {extraLayers.map((layer, i) => (
        <div
          key={layer.id}
          ref={(el) => {
            layerEls.current[i] = el;
          }}
          className="mk-glass-pane rounded-xl px-4 py-3 text-[11px] text-[var(--color-fg-secondary,#cbd5e1)]"
          style={layer.position ?? { top: "13%", left: "8%" }}
        >
          {layer.node}
        </div>
      ))}

      <div ref={mainRef} className="mk-glass-pane relative rounded-2xl p-7" style={{ width: paneWidth }}>
        {children}
        {streakOnEnter && !staticMode && sweepKey > 0 ? (
          <div key={sweepKey} aria-hidden="true" className="mk-glass-streak" />
        ) : null}
      </div>
    </div>
  );
}

export default GlassRefractionPanel;
