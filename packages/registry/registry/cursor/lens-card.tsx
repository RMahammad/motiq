"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface LensLag {
  stiffness: number;
  damping: number;
}

export interface LensCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The content under the glass — text, charts, images, code all work. */
  children: React.ReactNode;
  /** Lens radius in px. */
  radius?: number;
  /** Optical magnification of the clipped clone. */
  magnification?: number;
  /** Chromatic fringe offset in px. 0 disables the dispersion layer. */
  chromatic?: number;
  /** Follow spring — lower stiffness reads as heavier glass. */
  lag?: LensLag;
  /** Draw the canvas grid that physically bends around the lens rim. */
  gridBend?: boolean;
  /** Drift the lens on a slow two-frequency orbit when the pointer is away. */
  idleDrift?: boolean;
  /** Render the rim highlight ring. */
  showRing?: boolean;
  /** Deterministic seed for the idle-drift phase (SSR-stable). */
  seed?: number;
  /** Stop the rAF loop when scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
  /** Force the static, motion-free variant regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Physics                                                                    */
/* -------------------------------------------------------------------------- */

interface Spring {
  x: number;
  v: number;
}

const mkSpring = (x = 0): Spring => ({ x, v: 0 });

/** Semi-implicit Euler spring with substeps — stable at low/irregular frame rates. */
function spring(s: Spring, target: number, k: number, c: number, dt: number): number {
  const n = dt > 0.012 ? Math.ceil(dt / 0.008) : 1;
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    s.v += (-k * (s.x - target) - c * s.v) * h;
    s.x += s.v * h;
  }
  return s.x;
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

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

/** Grid-bend field: spacing, polyline segment length, gaussian σ and amplitude. */
const GRID_GAP = 36;
const GRID_SEG = 14;
const BEND_SIGMA = 60;
const BEND_AMP = 16;
/** Ring artwork is authored at this diameter and scaled to the live radius. */
const RING_BOX = 208;

interface PointerState {
  x: number;
  y: number;
  inside: boolean;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * LensCard — a refraction lens that floats over your own content: everything
 * under the glass magnifies with a chromatic fringe, and the background grid
 * lines physically bend around the lens edge. The magnifier is a duplicated,
 * scaled clone clipped by a moving `circle()` with `translate = (1−s)·lens`, so
 * the point under the lens centre stays optically fixed — no CSS filters, no
 * repaint storms. A second clone at a slightly higher scale, offset and
 * hue-rotated, reads as edge dispersion for the cost of one composite. The lens
 * centre springs after the pointer (glass has mass) and drifts on a slow orbit
 * when unattended. Clip-path + transform are compositor-side; the only CPU work
 * is the grid canvas. Clean-room original.
 */
export function LensCard({
  children,
  radius = 104,
  magnification = 1.35,
  chromatic = 2.2,
  lag = { stiffness: 300, damping: 27 },
  gridBend = true,
  idleDrift = true,
  showRing = true,
  seed = 1,
  pauseWhenHidden = true,
  reducedMotion,
  className,
  style,
  ...props
}: LensCardProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const magRef = React.useRef<HTMLDivElement | null>(null);
  const magInnerRef = React.useRef<HTMLDivElement | null>(null);
  const chromaRef = React.useRef<HTMLDivElement | null>(null);
  const chromaInnerRef = React.useRef<HTMLDivElement | null>(null);
  const ringRef = React.useRef<HTMLDivElement | null>(null);
  const probeRef = React.useRef<HTMLSpanElement | null>(null);
  const pointerRef = React.useRef<PointerState>({ x: -1e4, y: -1e4, inside: false });

  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `mk-lens-${uid}`;

  const systemReduced = useReducedMotion();
  // Resolve the system preference post-mount only, so SSR and first client
  // render agree on data-motion (no hydration mismatch).
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const staticMode = reducedMotion === true || (hydrated && systemReduced);
  const onScreen = useVisibilityPause(rootRef, { threshold: 0.06 });
  const paused = pauseWhenHidden && !onScreen;
  const animate = !staticMode && !paused;

  // Live prop mirror so the rAF loop reads fresh values without re-subscribing.
  const params = React.useRef({ radius, magnification, chromatic, lag, gridBend, idleDrift });
  params.current = { radius, magnification, chromatic, lag, gridBend, idleDrift };

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const canvas = canvasRef.current;
    const ctx = canvas ? canvas.getContext("2d") : null;

    let w = 1;
    let h = 1;
    const measure = () => {
      w = root.clientWidth || 1;
      h = root.clientHeight || 1;
      if (!canvas || !ctx) return;
      const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    measure();

    const probeColor = (i: number): string => {
      const probe = probeRef.current;
      if (!probe || typeof window === "undefined") return "#888";
      const kid = probe.children[i];
      return kid ? window.getComputedStyle(kid).color : "#888";
    };

    const place = (x: number, y: number, r: number) => {
      const { magnification: mag, chromatic: chroma } = params.current;
      const mag2 = mag + 0.03; // the fringe clone rides a hair larger than the lens
      if (magRef.current) magRef.current.style.clipPath = `circle(${r.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`;
      if (magInnerRef.current) {
        magInnerRef.current.style.transform = `translate3d(${((1 - mag) * x).toFixed(2)}px,${((1 - mag) * y).toFixed(2)}px,0) scale(${mag})`;
      }
      if (chromaRef.current) {
        chromaRef.current.style.clipPath = `circle(${(r + 3).toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`;
      }
      if (chromaInnerRef.current) {
        chromaInnerRef.current.style.transform = `translate3d(${((1 - mag2) * x + chroma).toFixed(2)}px,${(
          (1 - mag2) * y +
          chroma * 0.64
        ).toFixed(2)}px,0) scale(${mag2})`;
      }
      if (ringRef.current) {
        const rs = (r * 2) / RING_BOX;
        ringRef.current.style.transform = `translate3d(${(x - RING_BOX / 2).toFixed(1)}px,${(y - RING_BOX / 2).toFixed(
          1,
        )}px,0) scale(${rs.toFixed(3)})`;
      }
    };

    const tmp: [number, number] = [0, 0];
    const drawGrid = (x: number, y: number, r: number) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      if (!params.current.gridBend) return;
      const reach = r * 1.9;

      const warp = (px: number, py: number) => {
        const dx = px - x;
        const dy = py - y;
        const d = Math.hypot(dx, dy);
        if (d > reach || d < 0.5) {
          tmp[0] = px;
          tmp[1] = py;
          return;
        }
        const e = d - r;
        let push = BEND_AMP * Math.exp(-(e * e) / (2 * BEND_SIGMA * BEND_SIGMA));
        // The bulge fades toward the centre, which the magnified layer covers anyway.
        if (d < r) push *= d / r;
        tmp[0] = px + (dx / d) * push;
        tmp[1] = py + (dy / d) * push;
      };

      const pass = (color: string, alpha: number, clipR: number) => {
        ctx.save();
        if (clipR) {
          ctx.beginPath();
          ctx.arc(x, y, clipR, 0, Math.PI * 2);
          ctx.clip();
        }
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let gx = GRID_GAP / 2; gx < w; gx += GRID_GAP) {
          for (let i = 0; i <= h; i += GRID_SEG) {
            warp(gx, i);
            if (i === 0) ctx.moveTo(tmp[0], tmp[1]);
            else ctx.lineTo(tmp[0], tmp[1]);
          }
        }
        for (let gy = GRID_GAP / 2; gy < h; gy += GRID_GAP) {
          for (let i = 0; i <= w; i += GRID_SEG) {
            warp(i, gy);
            if (i === 0) ctx.moveTo(tmp[0], tmp[1]);
            else ctx.lineTo(tmp[0], tmp[1]);
          }
        }
        ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 1;
      };

      pass(probeColor(0), 0.85, 0);
      pass(probeColor(1), 0.5, r * 1.7);
    };

    const lx = mkSpring(-200);
    const ly = mkSpring(-200);
    const pres = mkSpring(0);
    const rng = makeRng(seed);
    let idleT = rng() * 30;
    let raf = 0;
    let last = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      let dt = (now - last) / 1000;
      last = now;
      if (!(dt > 0) || dt > 0.05) dt = 0.016;
      idleT += dt;

      const cfg = params.current;
      const p = pointerRef.current;
      let tx: number;
      let ty: number;
      if (p.inside) {
        tx = p.x;
        ty = p.y;
      } else if (cfg.idleDrift) {
        tx = w * (0.5 + 0.3 * Math.sin(idleT * 0.33));
        ty = h * (0.5 + 0.26 * Math.sin(idleT * 0.47 + 1.2));
      } else {
        tx = w / 2;
        ty = h / 2;
      }
      spring(lx, tx, cfg.lag.stiffness, cfg.lag.damping, dt);
      spring(ly, ty, cfg.lag.stiffness, cfg.lag.damping, dt);
      // Radius springs 0 → full on entry with a mild overshoot.
      spring(pres, 1, 200, 18, dt);
      const r = Math.max(1, cfg.radius * clamp(pres.x, 0, 1.2));
      place(lx.x, ly.x, r);
      drawGrid(lx.x, ly.x, r);
    };

    const renderStatic = () => {
      // Designed still state: the lens parks centre-stage, zoom affordance intact.
      const x = w / 2;
      const y = h / 2;
      place(x, y, params.current.radius);
      drawGrid(x, y, params.current.radius);
    };

    if (animate) {
      last = typeof performance !== "undefined" ? performance.now() : 0;
      raf = requestAnimationFrame(frame);
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
  }, [animate, seed]);

  const track = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (!root) return;
    const r = root.getBoundingClientRect();
    pointerRef.current = { x: e.clientX - r.left, y: e.clientY - r.top, inside: true };
  }, []);

  const release = React.useCallback(() => {
    pointerRef.current = { x: -1e4, y: -1e4, inside: false };
  }, []);

  /* The dispersion clone screens on dark and multiplies on light — the token
     system's default scope is light, `.dark`/[data-theme="dark"] is dark. */
  const css = `
.${cls}-chroma { opacity: .18; mix-blend-mode: multiply; }
.dark .${cls}-chroma, [data-theme="dark"] .${cls}-chroma { opacity: .45; mix-blend-mode: screen; }`.trim();

  return (
    <div
      ref={rootRef}
      data-motion={staticMode ? "static" : "animated"}
      data-paused={paused ? "true" : "false"}
      className={cn("relative isolate w-full overflow-hidden", className)}
      // pan-y keeps the page scrollable while a finger carries the lens.
      style={{ touchAction: "pan-y", cursor: staticMode ? undefined : "none", ...style }}
      onPointerMove={track}
      onPointerDown={track}
      onPointerLeave={release}
      onPointerCancel={release}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {gridBend ? (
        <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] block h-full w-full" />
      ) : null}

      {/* The base layer is the only one screen readers see, and the only one in flow. */}
      <div className="relative z-[2]">{children}</div>

      {chromatic > 0 ? (
        <div
          ref={chromaRef}
          aria-hidden="true"
          className={cn("pointer-events-none absolute inset-0 z-[3]", `${cls}-chroma`)}
          style={{ clipPath: "circle(0px at -200px -200px)", filter: "hue-rotate(150deg) saturate(1.6)" }}
        >
          <div ref={chromaInnerRef} className="absolute inset-0" style={{ transformOrigin: "0 0", willChange: "transform" }}>
            {children}
          </div>
        </div>
      ) : null}

      <div
        ref={magRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[4]"
        style={{ clipPath: "circle(0px at -200px -200px)", background: "var(--color-bg, #080c14)" }}
      >
        <div ref={magInnerRef} className="absolute inset-0" style={{ transformOrigin: "0 0", willChange: "transform" }}>
          {children}
        </div>
      </div>

      {showRing ? (
        <div
          ref={ringRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-[5] h-[208px] w-[208px] rounded-full"
          style={{
            transform: "translate3d(-999px,-999px,0)",
            willChange: "transform",
            border: "1px solid color-mix(in oklab, var(--color-accent, #4f7cff) 60%, transparent)",
            boxShadow: [
              "inset 0 0 0 1.5px color-mix(in oklab, var(--color-secondary-accent, #22c7d9) 35%, transparent)",
              "inset 0 0 26px color-mix(in oklab, var(--color-accent, #4f7cff) 22%, transparent)",
              "0 0 34px color-mix(in oklab, var(--color-accent, #4f7cff) 30%, transparent)",
            ].join(", "),
            backgroundImage:
              "radial-gradient(circle at 32% 28%, color-mix(in oklab, var(--color-fg, #f8fafc) 14%, transparent), transparent 42%)",
          }}
        />
      ) : null}

      {/* Token colour probes for the canvas grid passes. */}
      <span ref={probeRef} aria-hidden="true" className="pointer-events-none absolute h-0 w-0 overflow-hidden">
        <span style={{ color: "var(--color-border, #263449)" }} />
        <span style={{ color: "var(--color-accent, #4f7cff)" }} />
      </span>
    </div>
  );
}

LensCard.displayName = "LensCard";

export default LensCard;
