"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface AuroraPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card body below the aurora roof. */
  children?: React.ReactNode;
  /** Roof height in px. */
  roofHeight?: number;
  /** Number of ribbons (clamped 2–5). */
  ribbons?: number;
  /** Ribbon colors, front to back. Defaults to the theme's cyan/azure pair. */
  colors?: string[];
  /** Ribbon opacity multiplier (0–1.6). */
  intensity?: number;
  /** Time multiplier for the ribbon drift. */
  speed?: number;
  /** Aurora leans toward the pointer over the roof. */
  lean?: boolean;
  /** Grain overlay opacity (0–1). */
  grain?: number;
  /** Badge slot pinned to the roof. */
  overlay?: React.ReactNode;
  /** Deterministic seed for grain + stars (SSR-stable). */
  seed?: number;
  /** Park the loop while scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
  /** Force the static, motion-free sky regardless of system preference. */
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
const isDark = (c: Rgb) => (c[0] * 299 + c[1] * 587 + c[2] * 114) / 1000 < 128;
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];
const hex = (c: Rgb) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

interface Palette {
  sky: string;
  dark: boolean;
  ribbons: Rgb[];
}

function resolvePalette(el: Element, colors: string[] | undefined): Palette {
  const cs = getComputedStyle(el);
  const g = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb;
  const bg = toRgb(g("--color-bg", "#080c14"), [8, 12, 20]);
  const accent = toRgb(g("--color-accent", "#4f7cff"), [79, 124, 255]);
  const cyan = toRgb(g("--color-secondary-accent", "#22c7d9"), [34, 199, 217]);
  const accentText = toRgb(g("--color-accent-text", "#7f9fff"), [127, 159, 255]);
  const dark = isDark(bg);
  // Dark: deepen the page ground into night sky. Light: tint it toward accent
  // so the ribbons read on a pale sky instead of washing out.
  const sky = dark ? mix(bg, [0, 0, 0], 0.18) : mix(bg, accent, 0.09);
  const fallback = [cyan, accent, accentText, cyan, accent];
  const ribbons = colors?.length
    ? colors.map((c, i) => toRgb(c, fallback[i % fallback.length]))
    : fallback;
  return { sky: hex(sky), dark, ribbons };
}

interface RibbonDef {
  /** Vertical placement as a fraction of the roof height. */
  yf: number;
  amp: number;
  th: number;
  w1: number;
  w2: number;
  s1: number;
  s2: number;
  /** How strongly this ribbon answers the lean (nearer ribbons lead). */
  leanW: number;
}

/** The first three are the lab's exact ribbons; 4–5 extend the sky outward. */
const RIBBON_DEFS: ReadonlyArray<RibbonDef> = [
  { yf: 0.4, amp: 26, th: 42, w1: 0.0185, w2: 0.031, s1: 0.16, s2: 0.23, leanW: 1.0 },
  { yf: 0.55, amp: 34, th: 56, w1: 0.015, w2: 0.026, s1: 0.1, s2: 0.17, leanW: 0.7 },
  { yf: 0.68, amp: 22, th: 38, w1: 0.021, w2: 0.034, s1: 0.13, s2: 0.2, leanW: 0.45 },
  { yf: 0.3, amp: 18, th: 30, w1: 0.0235, w2: 0.038, s1: 0.19, s2: 0.26, leanW: 1.15 },
  { yf: 0.79, amp: 28, th: 46, w1: 0.0128, w2: 0.022, s1: 0.08, s2: 0.14, leanW: 0.3 },
];

const STAR_COUNT = 40;
/** The still frame is drawn at this scene time — a hand-tuned good sky. */
const STILL_T = 2.0;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * AuroraPanel — a product card that carries its own sky. Three ribbons, each the
 * sum of two sines, drift across a canvas roof and are softened by a single GPU
 * CSS blur at 116% scale (edges hidden), with a seeded grain tile over the top.
 * Pointer x retargets a lean spring (k=50, d=14) that shifts each ribbon's phase
 * by up to 90px and lifts amplitude ~20%, weighted more on the nearer ribbons;
 * on leave it relaxes home over ~700ms. Additive compositing on a night sky in
 * dark, saturated source-over on a pale sky in light; 40 seeded stars shimmer in
 * dark only. One rAF loop, DPR capped at 2×. Clean-room original.
 */
export function AuroraPanel({
  children,
  roofHeight = 210,
  ribbons = 3,
  colors,
  intensity = 1,
  speed = 1,
  lean = true,
  grain = 0.4,
  overlay,
  seed = 1,
  pauseWhenHidden = true,
  reducedMotion,
  className,
  style,
  ...props
}: AuroraPanelProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const roofRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [grainUrl, setGrainUrl] = React.useState<string | null>(null);

  const systemReduced = useReducedMotion();
  // Resolved after mount so SSR and first client render agree on data-motion.
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const staticMode = reducedMotion === true || speed <= 0 || (hydrated && systemReduced);
  const onScreen = useVisibilityPause(rootRef, { threshold: 0.05 });
  const paused = pauseWhenHidden && !onScreen;
  const animate = !staticMode && !paused;

  const bands = React.useMemo(() => RIBBON_DEFS.slice(0, clamp(Math.round(ribbons), 2, 5)), [ribbons]);
  const stars = React.useMemo(() => {
    const rng = makeRng(seed);
    return Array.from({ length: STAR_COUNT }, () => ({
      x: rng(),
      y: rng() * 0.7,
      r: rng() * 1.1 + 0.4,
      ph: rng() * 6.28,
    }));
  }, [seed]);

  const leanRef = React.useRef(new Spring(0, 50, 14));
  const paletteRef = React.useRef<Palette | null>(null);
  const liveRef = React.useRef({ bands, intensity, speed, colors });
  liveRef.current = { bands, intensity, speed, colors };

  // Seeded grain tile — generated post-mount, so it never affects SSR markup.
  React.useEffect(() => {
    if (grain <= 0 || typeof document === "undefined") return;
    const tile = document.createElement("canvas");
    tile.width = 96;
    tile.height = 96;
    const nx = tile.getContext("2d");
    if (!nx) return;
    const img = nx.createImageData(96, 96);
    const rng = makeRng(seed ^ 0x9e3779b9);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (rng() * 255) | 0;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 26;
    }
    nx.putImageData(img, 0, 0);
    setGrainUrl(tile.toDataURL());
  }, [seed, grain]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const ctx = canvas.getContext("2d");
    // jsdom / unsupported contexts return null — render markup, skip drawing.
    if (!ctx) return;

    paletteRef.current = resolvePalette(root, liveRef.current.colors);

    // Size is cached and only re-read on resize — never per frame (layout thrash).
    let dpr = 1;
    let w = 1;
    let h = 1;
    const measure = () => {
      dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
      w = canvas.clientWidth || 1;
      h = canvas.clientHeight || 1;
      const W = Math.max(1, Math.round(w * dpr));
      const H = Math.max(1, Math.round(h * dpr));
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
    };
    measure();

    const draw = (t: number) => {
      const pal = paletteRef.current;
      if (!pal) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = pal.sky;
      ctx.fillRect(0, 0, w, h);

      const glow = clamp(liveRef.current.intensity, 0, 1.6);

      if (pal.dark) {
        ctx.fillStyle = "#dbe7ff";
        stars.forEach((st) => {
          ctx.globalAlpha = (0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.9 + st.ph))) * glow;
          ctx.beginPath();
          ctx.arc(st.x * w, st.y * h, st.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      }

      ctx.globalCompositeOperation = pal.dark ? "lighter" : "source-over";
      const L = leanRef.current.x;
      const defs = liveRef.current.bands;
      defs.forEach((rb, ri) => {
        const c = pal.ribbons[ri % pal.ribbons.length];
        const phase = L * 90 * rb.leanW;
        const amp = rb.amp * (1 + Math.abs(L) * 0.2 * rb.leanW);
        const baseY = rb.yf * h;
        const alpha = clamp((pal.dark ? 0.5 : 0.55) * glow, 0, 1);
        const step = 8;
        const yAt = (x: number) =>
          baseY +
          Math.sin((x + phase) * rb.w1 + t * rb.s1 * 6.283) * amp +
          Math.sin((x - phase * 0.6) * rb.w2 - t * rb.s2 * 6.283) * amp * 0.45;

        ctx.beginPath();
        for (let x = -step; x <= w + step; x += step) {
          if (x === -step) ctx.moveTo(x, yAt(x));
          else ctx.lineTo(x, yAt(x));
        }
        for (let x = w + step; x >= -step; x -= step) ctx.lineTo(x, yAt(x) + rb.th);
        ctx.closePath();

        const g = ctx.createLinearGradient(0, baseY - amp - 10, 0, baseY + rb.th + amp);
        g.addColorStop(0, rgba(c, 0));
        g.addColorStop(0.35, rgba(c, alpha));
        g.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = g;
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
      t += dt * Math.max(0, liveRef.current.speed);
      leanRef.current.step(dt);
      draw(t);
      raf = requestAnimationFrame(frame);
    };

    if (animate) {
      raf = requestAnimationFrame(frame);
    } else {
      leanRef.current.x = leanRef.current.target = 0;
      leanRef.current.v = 0;
      draw(STILL_T);
    }

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            measure();
            if (!animate) draw(STILL_T);
          })
        : null;
    ro?.observe(canvas);

    // Re-read tokens on theme change (media preference + a data-theme/class swap).
    const refresh = () => {
      paletteRef.current = resolvePalette(root, liveRef.current.colors);
      if (!animate) draw(STILL_T);
    };
    const mq = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    mq?.addEventListener("change", refresh);
    const mo = typeof MutationObserver !== "undefined" ? new MutationObserver(refresh) : null;
    if (typeof document !== "undefined") {
      mo?.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      mo?.disconnect();
      mq?.removeEventListener("change", refresh);
    };
  }, [animate, stars, colors]);

  const onRoofPointerMove = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const roof = roofRef.current;
    if (!roof) return;
    const r = roof.getBoundingClientRect();
    if (r.width === 0) return;
    leanRef.current.target = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1);
  }, []);
  const onRoofLeave = React.useCallback(() => {
    leanRef.current.target = 0;
  }, []);

  return (
    <div
      ref={rootRef}
      data-motion={staticMode ? "static" : "animated"}
      data-paused={paused ? "true" : "false"}
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-[var(--color-border,#263449)] bg-[var(--color-surface,#111827)]",
        "shadow-[0_24px_48px_-24px_rgba(2,5,12,0.55)]",
        className,
      )}
      style={style}
      {...props}
    >
      <div
        ref={roofRef}
        onPointerMove={lean && !staticMode ? onRoofPointerMove : undefined}
        onPointerLeave={onRoofLeave}
        className="relative overflow-hidden"
        // pan-y keeps mobile scrolling intact while the roof still tracks x.
        style={{ height: `${roofHeight}px`, touchAction: "pan-y" }}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute"
          // Drawn crisp, then softened by one compositor blur; the 116% box hides
          // the blurred edges that would otherwise reveal the canvas bounds.
          style={{ inset: "-8%", width: "116%", height: "116%", filter: "blur(9px) saturate(1.2)" }}
        />
        {grain > 0 && grainUrl ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: clamp(grain, 0, 1),
              mixBlendMode: "overlay",
              backgroundImage: `url(${grainUrl})`,
              backgroundRepeat: "repeat",
            }}
          />
        ) : null}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14"
          style={{ background: "linear-gradient(to bottom, transparent, var(--color-surface, #111827))" }}
        />
        {overlay ? <div className="absolute left-4 top-3.5">{overlay}</div> : null}
      </div>
      {children != null ? <div className="px-6 pb-6 pt-5">{children}</div> : null}
    </div>
  );
}

export default AuroraPanel;
