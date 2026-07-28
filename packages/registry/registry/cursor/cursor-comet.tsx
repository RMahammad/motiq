"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface CursorCometProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Fixed particle pool size (clamped 24–800). No allocation happens per frame. */
  particleBudget?: number;
  /** 0–1 fraction of pointer velocity each particle inherits, reversed. */
  velocityGain?: number;
  /** Exponential drag coefficient, per second. */
  drag?: number;
  /** Head/young-particle color — any CSS color, resolved from tokens by default. */
  headColor?: string;
  /** Tail/old-particle color. */
  tailColor?: string;
  /** Ionization spark color — the rare signature moment. */
  sparkColor?: string;
  /** Pointer speed (px/s) above which coral sparks ignite at the head. */
  sparkThreshold?: number;
  /** Coil the particles into an ambient orbit ring when the pointer is away. */
  idleOrbit?: boolean;
  /** Deterministic seed for the particle jitter (SSR-stable markup). */
  seed?: number;
  /** Stop the rAF loop when scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
  /** Force the static, motion-free variant regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** mulberry32 — deterministic jitter, no Math.random at render or module scope. */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Resolve any computed CSS color string (rgb/rgba/#hex) to an [r,g,b] triple. */
function parseRgb(input: string): [number, number, number] {
  const c = input.trim();
  if (c.startsWith("#")) {
    let h = c.slice(1);
    if (h.length === 3) h = h.split("").map((d) => d + d).join("");
    const n = Number.parseInt(h.slice(0, 6), 16);
    if (Number.isNaN(n)) return [128, 128, 128];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = c.match(/-?[\d.]+/g);
  if (m && m.length >= 3) return [Number(m[0]), Number(m[1]), Number(m[2])];
  return [128, 128, 128];
}

const rgba = (c: [number, number, number], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/** Pre-rendered 64px radial-gradient sprite — drawImage beats per-particle gradients. */
function makeSprite(color: [number, number, number], hot: boolean): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  if (!g) return null;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, rgba(color, hot ? 0.9 : 0.62));
  gr.addColorStop(0.3, rgba(color, hot ? 0.4 : 0.28));
  gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return c;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  sz: number;
  spark: boolean;
}

interface Sprites {
  azure: HTMLCanvasElement | null;
  cyan: HTMLCanvasElement | null;
  coral: HTMLCanvasElement | null;
  core: HTMLCanvasElement | null;
}

interface PointerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  inside: boolean;
  t: number;
}

/** Max tracked pointer speed, px/s — clamps a teleporting pointer into physics. */
const SPEED_CAP = 3000;
/** Idle orbit radius, px. */
const ORBIT = 62;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * CursorComet — a canvas particle comet that reads pointer VELOCITY, not just
 * position: slow movement holds a tight ember, a fast flick ionizes into a long
 * azure→cyan plume with coral sparks past `sparkThreshold`. Particles inherit a
 * reversed fraction of the pointer velocity plus radial jitter, then fly under
 * exponential drag; colour crossfades across each particle's life. Left alone,
 * a virtual head wanders a Lissajous path and the particles feel a soft radial
 * spring toward a 62px orbit ring, so the region never plays dead. Fixed pool
 * (no GC churn), pre-rendered sprites drawn with `lighter` compositing, DPR
 * capped at 2×, one rAF loop. Decorative: the canvas is aria-hidden and never
 * intercepts pointer events, so wrapped content stays fully interactive.
 * Clean-room original.
 */
export function CursorComet({
  particleBudget = 240,
  velocityGain = 0.22,
  drag = 2.2,
  headColor = "var(--color-accent, #4f7cff)",
  tailColor = "var(--color-secondary-accent, #22c7d9)",
  sparkColor = "var(--color-signature, #ff6b5e)",
  sparkThreshold = 900,
  idleOrbit = true,
  seed = 1,
  pauseWhenHidden = true,
  reducedMotion,
  className,
  style,
  children,
  ...props
}: CursorCometProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const probeRef = React.useRef<HTMLSpanElement | null>(null);
  const pointerRef = React.useRef<PointerState>({ x: -1e4, y: -1e4, vx: 0, vy: 0, inside: false, t: 0 });

  const systemReduced = useReducedMotion();
  // Resolve the system preference post-mount only, so SSR and first client
  // render agree on data-motion (no hydration mismatch).
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const staticMode = reducedMotion === true || (hydrated && systemReduced);
  const onScreen = useVisibilityPause(rootRef, { threshold: 0.06 });
  const paused = pauseWhenHidden && !onScreen;
  const animate = !staticMode && !paused;

  const budget = clamp(Math.round(particleBudget), 24, 800);

  // Live prop mirror so the rAF loop reads fresh values without re-subscribing.
  const params = React.useRef({ velocityGain, drag, sparkThreshold, idleOrbit });
  params.current = { velocityGain, drag, sparkThreshold, idleOrbit };

  React.useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    // jsdom / unsupported contexts return null — render markup, skip drawing.
    if (!ctx) return;

    let w = 1;
    let h = 1;
    const measure = () => {
      const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
      w = root.clientWidth || 1;
      h = root.clientHeight || 1;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    measure();

    /* Colours are read from a probe span inside this component, so tokens
       resolve against whatever theme scope the component actually sits in. */
    let signature = "";
    let sprites: Sprites = { azure: null, cyan: null, coral: null, core: null };
    const readColors = (): string => {
      const probe = probeRef.current;
      if (!probe || typeof window === "undefined") return "";
      const kids = probe.children;
      let out = "";
      for (let i = 0; i < kids.length; i++) out += `${window.getComputedStyle(kids[i]).color}|`;
      return out;
    };
    const buildSprites = () => {
      const probe = probeRef.current;
      if (!probe || typeof window === "undefined") return;
      const kids = probe.children;
      const col = (i: number) => parseRgb(kids[i] ? window.getComputedStyle(kids[i]).color : "#888");
      sprites = {
        azure: makeSprite(col(0), false),
        cyan: makeSprite(col(1), false),
        coral: makeSprite(col(2), true),
        core: makeSprite(col(3), true),
      };
      signature = readColors();
    };
    buildSprites();

    const rng = makeRng(seed);
    const parts: Particle[] = Array.from({ length: budget }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      max: 1,
      sz: 1,
      spark: false,
    }));
    let cursor = 0;
    let emitAcc = 0;
    const head = { x: 0, y: 0 };
    const prevHead = { x: 0, y: 0, has: false };

    const spawn = (x: number, y: number, vx: number, vy: number, life: number, sz: number, spark: boolean) => {
      const pt = parts[cursor];
      cursor = (cursor + 1) % parts.length;
      pt.x = x;
      pt.y = y;
      pt.vx = vx;
      pt.vy = vy;
      pt.life = life;
      pt.max = life;
      pt.sz = sz;
      pt.spark = spark;
    };

    const step = (dt: number, t: number) => {
      const cfg = params.current;
      const p = pointerRef.current;
      const idle = !p.inside;
      const ax = w * 0.5 + Math.sin(t * 0.4) * w * 0.28;
      const ay = h * 0.5 + Math.sin(t * 0.63 + 1.7) * h * 0.2;
      head.x = idle ? ax : p.x;
      head.y = idle ? ay : p.y;

      const speed = Math.hypot(p.vx, p.vy);
      // Pointer velocity decays on its own so a parked cursor stops emitting a tail.
      p.vx *= Math.exp(-5 * dt);
      p.vy *= Math.exp(-5 * dt);

      const rate = idle ? 160 : 110 + speed * 0.6;
      emitAcc += rate * dt;
      let count = Math.floor(emitAcc);
      emitAcc -= count;
      count = Math.min(count, 14);
      if (!prevHead.has) {
        prevHead.x = head.x;
        prevHead.y = head.y;
        prevHead.has = true;
      }
      for (let e = 0; e < count; e++) {
        // Distribute spawns along the head's path this frame, so fast flicks lay
        // particles into a tail instead of one clump.
        const frac = count > 1 ? (e + rng()) / count : rng();
        let hx = prevHead.x + (head.x - prevHead.x) * frac;
        let hy = prevHead.y + (head.y - prevHead.y) * frac;
        const ang = rng() * Math.PI * 2;
        const jr = rng() * (4 + speed * 0.008);
        let jx = Math.cos(ang) * jr;
        let jy = Math.sin(ang) * jr;
        const launch = 30 + rng() * 40;
        let vx = -p.vx * cfg.velocityGain + Math.cos(ang) * launch;
        let vy = -p.vy * cfg.velocityGain + Math.sin(ang) * launch;
        if (idle && cfg.idleOrbit) {
          // Seed onto the orbit ring with tangential motion.
          hx = head.x;
          hy = head.y;
          const oa = rng() * Math.PI * 2;
          jx = Math.cos(oa) * ORBIT;
          jy = Math.sin(oa) * ORBIT;
          vx = -Math.sin(oa) * 55;
          vy = Math.cos(oa) * 55;
        }
        const life = idle ? 0.9 + rng() * 0.9 : 0.5 + rng() * 0.9 * clamp(speed / 1400, 0.2, 1);
        spawn(hx + jx, hy + jy, vx, vy, life, (idle ? 5 : 6) + rng() * 8, false);
      }
      prevHead.x = head.x;
      prevHead.y = head.y;

      // Ionization sparks — reserved for peak energy, the one signature moment.
      if (!idle && speed > cfg.sparkThreshold) {
        for (let s = 0; s < 2; s++) {
          const sa = rng() * Math.PI * 2;
          spawn(
            head.x,
            head.y,
            -p.vx * 0.32 + Math.cos(sa) * 90,
            -p.vy * 0.32 + Math.sin(sa) * 90,
            0.28 + rng() * 0.2,
            3.5 + rng() * 3,
            true,
          );
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      const decay = Math.exp(-cfg.drag * dt);
      for (let i = 0; i < parts.length; i++) {
        const pt = parts[i];
        if (pt.life <= 0) continue;
        pt.life -= dt;
        if (idle && cfg.idleOrbit && !pt.spark) {
          // Soft radial spring toward the orbit ring + a mild tangential swirl.
          const dx = pt.x - head.x;
          const dy = pt.y - head.y;
          const d = Math.hypot(dx, dy) || 1;
          const pull = (ORBIT - d) * 3.2;
          pt.vx += (dx / d) * pull * dt * 10;
          pt.vy += (dy / d) * pull * dt * 10;
          pt.vx += (-dy / d) * 34 * dt;
          pt.vy += (dx / d) * 34 * dt;
        }
        pt.vx *= decay;
        pt.vy *= decay;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        const a = clamp(pt.life / pt.max, 0, 1);
        const size = pt.sz * (0.5 + a * 0.9) * 2.4;
        const img = pt.spark ? sprites.coral : a > 0.55 ? sprites.azure : sprites.cyan;
        if (!img) continue;
        ctx.globalAlpha = a * (pt.spark ? 0.95 : 0.5);
        ctx.drawImage(img, pt.x - size / 2, pt.y - size / 2, size, size);
      }

      // Comet head: layered glow + hot core.
      if (sprites.azure) {
        ctx.globalAlpha = idle ? 0.5 : 0.8;
        ctx.drawImage(sprites.azure, head.x - 30, head.y - 30, 60, 60);
      }
      if (sprites.core) {
        ctx.globalAlpha = idle ? 0.35 : 0.65;
        ctx.drawImage(sprites.core, head.x - 5, head.y - 5, 10, 10);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    const renderStatic = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      const cx = w / 2;
      const cy = h / 2;
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        const r = ORBIT + Math.sin(i * 2.4) * 8;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r * 0.72;
        const img = i % 2 ? sprites.azure : sprites.cyan;
        if (!img) continue;
        const s = 10 + (i % 3) * 5;
        ctx.globalAlpha = 0.55;
        ctx.drawImage(img, x - s / 2, y - s / 2, s, s);
      }
      ctx.globalAlpha = 0.7;
      if (sprites.azure) ctx.drawImage(sprites.azure, cx - 26, cy - 26, 52, 52);
      if (sprites.core) ctx.drawImage(sprites.core, cx - 6, cy - 6, 12, 12);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    let raf = 0;
    let last = 0;
    let start = 0;
    let themeAcc = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!start) start = now;
      let dt = (now - last) / 1000;
      last = now;
      if (!(dt > 0) || dt > 0.05) dt = 0.016;
      // Cheap, mechanism-agnostic theme watch: re-resolve the token colours twice
      // a second and rebuild sprites only when they actually changed.
      themeAcc += dt;
      if (themeAcc > 0.5) {
        themeAcc = 0;
        if (readColors() !== signature) buildSprites();
      }
      step(dt, (now - start) / 1000);
    };

    if (animate) {
      last = typeof performance !== "undefined" ? performance.now() : 0;
      raf = requestAnimationFrame(loop);
    } else {
      renderStatic();
    }

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            measure();
            if (!animate) renderStatic();
          })
        : null;
    ro?.observe(root);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [animate, budget, seed]);

  const track = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (!root) return;
    const r = root.getBoundingClientRect();
    const nx = e.clientX - r.left;
    const ny = e.clientY - r.top;
    const now = typeof performance !== "undefined" ? performance.now() : 0;
    const p = pointerRef.current;
    if (p.t) {
      const dt = Math.max(8, now - p.t) / 1000;
      p.vx = clamp((nx - p.x) / dt, -SPEED_CAP, SPEED_CAP);
      p.vy = clamp((ny - p.y) / dt, -SPEED_CAP, SPEED_CAP);
    }
    p.x = nx;
    p.y = ny;
    p.t = now;
    p.inside = true;
  }, []);

  const release = React.useCallback(() => {
    const p = pointerRef.current;
    p.inside = false;
    p.vx = 0;
    p.vy = 0;
    p.t = 0;
  }, []);

  return (
    <div
      ref={rootRef}
      data-motion={staticMode ? "static" : "animated"}
      data-paused={paused ? "true" : "false"}
      className={cn("relative w-full", className)}
      // pan-y keeps the page scrollable while a finger drags the comet around.
      style={{ touchAction: "pan-y", minHeight: children == null ? 240 : undefined, ...style }}
      onPointerMove={track}
      onPointerDown={track}
      onPointerLeave={release}
      onPointerCancel={release}
      {...props}
    >
      {children}
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 block h-full w-full" />
      {/* Token colour probes: `getComputedStyle().color` resolves var()/color-mix
          against this component's own theme scope, for the canvas sprites. */}
      <span ref={probeRef} aria-hidden="true" className="pointer-events-none absolute h-0 w-0 overflow-hidden">
        <span style={{ color: headColor }} />
        <span style={{ color: tailColor }} />
        <span style={{ color: sparkColor }} />
        <span style={{ color: "var(--color-fg, #f8fafc)" }} />
      </span>
    </div>
  );
}

CursorComet.displayName = "CursorComet";

export default CursorComet;
