"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface TorchLag {
  stiffness: number;
  damping: number;
}

export interface TorchRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The finished, always-readable layer. It sits in flow and sets the height. */
  front: React.ReactNode;
  /** The layer the torch uncovers — a blueprint twin, a before/after render, an annotated spec. */
  reveal: React.ReactNode;
  /** Torch radius in px. */
  radius?: number;
  /** 0–1 edge softness of the alpha mask (0 = hard circle, 1 = fully feathered). */
  softness?: number;
  /** 0–1 flame flicker amount; 0 holds a perfectly steady beam. */
  flicker?: number;
  /** Follow spring — lower stiffness reads as hand-held rather than parented. */
  lag?: TorchLag;
  /** Patrol a Lissajous path across the hero when the pointer is away. */
  idlePatrol?: boolean;
  /** Static presentation when motion is off: a 55/45 split, or hide the reveal layer. */
  reducedFallback?: "split" | "off";
  /** Classes for the reveal layer wrapper (it paints an opaque backdrop by default). */
  revealClassName?: string;
  /** Deterministic seed for the patrol phase (SSR-stable). */
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

/** Flicker is two incommensurate sines; amplitudes are calibrated so the default
 *  `flicker` of 0.35 reproduces the lab's 5px @ 9Hz + 2.5px @ 23Hz breathing. */
const FLICKER_A1 = 5 / 0.35;
const FLICKER_A2 = 2.5 / 0.35;
/** Glow sprite box, px — a screen-blended halo riding the torch. */
const GLOW_BOX = 420;

interface PointerState {
  x: number;
  y: number;
  inside: boolean;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * TorchReveal — a finished hero with a second layer hiding above it. A soft,
 * flickering torch around the pointer uncovers the `reveal` layer (a blueprint
 * twin, a wireframe, a before/after render) as if inspecting the build behind
 * the paint. The reveal is a CSS **alpha mask** — a `radial-gradient` whose
 * centre and radius live in custom properties, so JS writes three numbers per
 * frame and never a new layout. SVG luminance masks with gradient content are a
 * silent no-op in Chromium, so they are deliberately not used here. The torch
 * position springs after the pointer (hand-held, not parented), the radius
 * breathes on two incommensurate sines, and unattended it patrols a Lissajous
 * path so the story tells itself. Reduced motion swaps to a static split view.
 * Clean-room original.
 */
export function TorchReveal({
  front,
  reveal,
  radius = 175,
  softness = 0.48,
  flicker = 0.35,
  lag = { stiffness: 260, damping: 24 },
  idlePatrol = true,
  reducedFallback = "split",
  revealClassName,
  seed = 1,
  pauseWhenHidden = true,
  reducedMotion,
  className,
  style,
  ...props
}: TorchRevealProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const maskRef = React.useRef<HTMLDivElement | null>(null);
  const glowRef = React.useRef<HTMLDivElement | null>(null);
  const pointerRef = React.useRef<PointerState>({ x: -1e4, y: -1e4, inside: false });

  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `mk-torch-${uid}`;

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
  const params = React.useRef({ radius, flicker, lag, idlePatrol });
  params.current = { radius, flicker, lag, idlePatrol };

  React.useEffect(() => {
    const root = rootRef.current;
    const mask = maskRef.current;
    if (!root || !mask) return;

    if (!animate) {
      // Park the mask off-canvas; the static split view is pure CSS below.
      mask.style.setProperty("--mk-tx", "-400");
      mask.style.setProperty("--mk-ty", "-400");
      if (glowRef.current) glowRef.current.style.transform = "translate3d(-999px,-999px,0)";
      return;
    }

    const tx = mkSpring(-400);
    const ty = mkSpring(-400);
    const rng = makeRng(seed);
    let idleT = rng() * 40;
    let raf = 0;
    let last = 0;
    let start = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!start) start = now;
      let dt = (now - last) / 1000;
      last = now;
      if (!(dt > 0) || dt > 0.05) dt = 0.016;
      idleT += dt;
      const t = (now - start) / 1000;

      const cfg = params.current;
      const p = pointerRef.current;
      const w = root.clientWidth;
      const h = root.clientHeight;
      let gx: number;
      let gy: number;
      if (p.inside) {
        gx = p.x;
        gy = p.y;
      } else if (cfg.idlePatrol) {
        gx = w * (0.5 + 0.36 * Math.sin(idleT * 0.3));
        gy = h * (0.5 + 0.3 * Math.sin(idleT * 0.43 + 0.9));
      } else {
        gx = w / 2;
        gy = h / 2;
      }
      spring(tx, gx, cfg.lag.stiffness, cfg.lag.damping, dt);
      spring(ty, gy, cfg.lag.stiffness, cfg.lag.damping, dt);
      const r = cfg.radius + (Math.sin(t * 9) * FLICKER_A1 + Math.sin(t * 23 + 1.3) * FLICKER_A2) * cfg.flicker;

      mask.style.setProperty("--mk-tx", tx.x.toFixed(1));
      mask.style.setProperty("--mk-ty", ty.x.toFixed(1));
      mask.style.setProperty("--mk-tr", r.toFixed(1));
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${(tx.x - GLOW_BOX / 2).toFixed(1)}px,${(
          ty.x -
          GLOW_BOX / 2
        ).toFixed(1)}px,0)`;
      }
    };

    last = typeof performance !== "undefined" ? performance.now() : 0;
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
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

  const core = `${Math.round((1 - Math.max(0, Math.min(1, softness))) * 100)}%`;
  const maskImage = `radial-gradient(circle calc(var(--mk-tr, ${radius}) * 1px) at calc(var(--mk-tx, -400) * 1px) calc(var(--mk-ty, -400) * 1px), #000 0 ${core}, transparent 100%)`;

  /* The halo screens on dark and multiplies on light — the token system's
     default scope is light, `.dark`/[data-theme="dark"] is dark. */
  const css = `
.${cls}-glow { mix-blend-mode: multiply; opacity: .4; }
.dark .${cls}-glow, [data-theme="dark"] .${cls}-glow { mix-blend-mode: screen; opacity: 1; }`.trim();

  const split = staticMode && reducedFallback === "split";

  return (
    <div
      ref={rootRef}
      data-motion={staticMode ? "static" : "animated"}
      data-paused={paused ? "true" : "false"}
      data-fallback={staticMode ? reducedFallback : undefined}
      className={cn("relative isolate w-full overflow-hidden", className)}
      // pan-y keeps the page scrollable while a finger carries the torch.
      style={{ touchAction: "pan-y", cursor: staticMode ? undefined : "none", ...style }}
      onPointerMove={track}
      onPointerDown={track}
      onPointerLeave={release}
      onPointerCancel={release}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Always-readable finished layer: in flow, so it sets the component height. */}
      <div className="relative z-[1]">{front}</div>

      {staticMode && reducedFallback === "off" ? null : (
        <div
          ref={maskRef}
          aria-hidden="true"
          className={cn("pointer-events-none absolute inset-0 z-[2]", revealClassName)}
          style={
            split
              ? // Static split: a hard 55/45 comparison with a dashed divider —
                // the "two layers" story survives with no pointer tracking at all.
                {
                  clipPath: "inset(0 0 0 55%)",
                  borderLeft: "1.5px dashed var(--color-secondary-accent, #22c7d9)",
                  background: revealClassName ? undefined : "var(--color-bg, #080c14)",
                }
              : {
                  maskImage,
                  WebkitMaskImage: maskImage,
                  background: revealClassName ? undefined : "var(--color-bg, #080c14)",
                }
          }
        >
          {reveal}
        </div>
      )}

      {staticMode ? null : (
        <div
          ref={glowRef}
          aria-hidden="true"
          className={cn("pointer-events-none absolute left-0 top-0 z-[3] h-[420px] w-[420px] rounded-full", `${cls}-glow`)}
          style={{
            transform: "translate3d(-999px,-999px,0)",
            willChange: "transform",
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--color-secondary-accent, #22c7d9) 16%, transparent), transparent 62%)",
          }}
        />
      )}
    </div>
  );
}

TorchReveal.displayName = "TorchReveal";

export default TorchReveal;
