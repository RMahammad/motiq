"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface ParallaxLayer {
  /** Anything renderable — an SVG ridge, a gradient sky, floating cards. */
  node: React.ReactNode;
  /** 0 = far background (barely travels) … 1 = nearest foreground (travels most). */
  depth: number;
  /**
   * Max depth-of-field blur in px applied to this layer as the scene centers.
   * Set it on the far layers only; near layers should stay sharp.
   */
  blurAtDepth?: number;
}

export interface DepthParallaxSceneProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Back-to-front layers. Order is paint order; `depth` drives travel and drift. */
  layers: ParallaxLayer[];
  /**
   * `"page"` (default) reads the scene's position in the viewport — the landing-page
   * usage, with no scroll container of its own. `"container"` gives the component a
   * keyboard-scrollable stage so the effect works inside a card or docs preview.
   */
  scrollMode?: "page" | "container";
  /** Total vertical travel in px at depth 1 across the whole pass. */
  range?: number;
  /** Let the pointer nudge the layers. */
  pointer?: boolean;
  /** Horizontal pointer travel in px at depth 1 (vertical is ~54% of it). */
  pointerStrength?: number;
  /** Apply `blurAtDepth` to the layers that declare it. */
  depthOfField?: boolean;
  /** Idle sine drift before the pointer ever enters — the ambient life on load. */
  ambientDrift?: boolean;
  /** Scene height. */
  height?: number | string;
  /** Container mode only: pass distance as a multiple of the scene height. */
  scrollLength?: number;
  /** Progress smoothing rate (λ per second). */
  smoothing?: number;
  /** Accessible description — the scene is decorative and carries a single role="img". */
  label?: string;
  /** Force the static, motion-free variant regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Constants + helpers                                                        */
/* -------------------------------------------------------------------------- */

/** Vertical pointer travel as a fraction of `pointerStrength` (26px → 14px). */
const POINTER_Y_RATIO = 14 / 26;
/** Blur is quantized to this step so the filter isn't rewritten every frame. */
const BLUR_STEP = 0.2;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const damp = (cur: number, tgt: number, lambda: number, dt: number) =>
  cur + (tgt - cur) * (1 - Math.exp(-lambda * dt));

const px = (v: number | string) => (typeof v === "number" ? `${v}px` : v);

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * DepthParallaxScene — a world behind the glass: consumer-supplied layers travel
 * at depth-proportional rates as the scene passes through the viewport and drift
 * subtly with the pointer, while the far layers slip out of focus as the near ones
 * pass. Progress is measured with getBoundingClientRect inside one
 * requestAnimationFrame loop and smoothed through an exponential lerp; layers move
 * on translate3d only and the depth-of-field blur is quantized so the filter is
 * rewritten only when it actually changes. No scroll container in page mode, so
 * there is nothing to trap the wheel. Clean-room original.
 */
export function DepthParallaxScene({
  layers,
  scrollMode = "page",
  range = 180,
  pointer = true,
  pointerStrength = 26,
  depthOfField = true,
  ambientDrift = true,
  height = 560,
  scrollLength = 2,
  smoothing = 8,
  label = "Layered decorative scene that shifts with depth as the page scrolls.",
  reducedMotion,
  className,
  style,
  ...props
}: DepthParallaxSceneProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const sceneRef = React.useRef<HTMLDivElement | null>(null);
  const layerRefs = React.useRef<Array<HTMLDivElement | null>>([]);

  const systemReduced = useReducedMotion();
  const [enhanced, setEnhanced] = React.useState(false);
  useIsoLayoutEffect(() => setEnhanced(true), []);
  const staticMode = reducedMotion === true || (enhanced && systemReduced);
  const scrubbing = enhanced && !staticMode;

  const onScreen = useVisibilityPause(rootRef, { threshold: 0.01 });
  const animate = scrubbing && onScreen;

  const container = scrollMode === "container";
  const sceneH = px(height);
  // Container mode brackets the scene with lead-in/lead-out spacers so it travels
  // through the stage exactly the way it travels through the viewport in page mode.
  const spacer = Math.max(0, (scrollLength - 1) / 2);

  const paramsRef = React.useRef({ range, pointer, pointerStrength, depthOfField, ambientDrift, smoothing, layers });
  paramsRef.current = { range, pointer, pointerStrength, depthOfField, ambientDrift, smoothing, layers };

  const applyRef = React.useRef<(p: number, ptrX: number, ptrY: number) => void>(() => {});
  applyRef.current = (p, ptrX, ptrY) => {
    const { range: travel, pointerStrength: ps, depthOfField: dof, layers: defs } = paramsRef.current;
    for (let i = 0; i < defs.length; i++) {
      const el = layerRefs.current[i];
      if (!el) continue;
      const d = defs[i].depth;
      const ty = (0.5 - p) * travel * d + ptrY * ps * POINTER_Y_RATIO * d;
      const tx = ptrX * ps * d;
      el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;

      const maxBlur = defs[i].blurAtDepth;
      if (!dof || !maxBlur) continue;
      // Focus peaks when the scene is centered — that is when the near layers are
      // "passing", so the far ridge is the thing that goes soft.
      const focus = 1 - Math.abs(p - 0.5) * 2;
      const blur = Math.round((maxBlur * easeInOut(clamp(focus, 0, 1))) / BLUR_STEP) * BLUR_STEP;
      const key = blur.toFixed(1);
      if (el.dataset.blur !== key) {
        el.dataset.blur = key;
        el.style.filter = blur > 0.05 ? `blur(${key}px)` : "none";
      }
    }
  };

  useIsoLayoutEffect(() => {
    if (!scrubbing) return;
    applyRef.current(0.5, 0, 0);
  }, [scrubbing]);

  const pointerRef = React.useRef({ live: false, x: 0, y: 0 });

  React.useEffect(() => {
    const el = sceneRef.current;
    if (!scrubbing || !pointer || !el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointerRef.current = {
        live: true,
        x: clamp(((e.clientX - r.left) / (r.width || 1) - 0.5) * 2, -1, 1),
        y: clamp(((e.clientY - r.top) / (r.height || 1) - 0.5) * 2, -1, 1),
      };
    };
    const onLeave = () => {
      pointerRef.current = { live: false, x: 0, y: 0 };
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [scrubbing, pointer]);

  React.useEffect(() => {
    if (!animate || typeof requestAnimationFrame === "undefined") return;
    let raf = 0;
    let last = 0;
    let elapsed = 0;
    let p = 0.5;
    let dx = 0;
    let dy = 0;
    const frame = (now: number) => {
      let dt = last ? (now - last) / 1000 : 0.016;
      if (!(dt > 0) || dt > 0.05) dt = 0.016;
      last = now;
      elapsed += dt;

      const scene = sceneRef.current;
      const sc = scrollerRef.current;
      let target = 0.5;
      if (scene) {
        const r = scene.getBoundingClientRect();
        // Container mode measures against the stage box; page mode against the viewport.
        const view = container && sc ? sc.getBoundingClientRect() : null;
        const viewH = view ? view.height : typeof window !== "undefined" ? window.innerHeight || 800 : 800;
        const top = view ? r.top - view.top : r.top;
        target = clamp((viewH - top) / (viewH + r.height || 1), 0, 1);
      }
      p = damp(p, target, paramsRef.current.smoothing, dt);

      const { pointer: usePointer, ambientDrift: drift } = paramsRef.current;
      let tx = 0;
      let ty = 0;
      if (usePointer) {
        const ptr = pointerRef.current;
        if (ptr.live) {
          tx = ptr.x;
          ty = ptr.y;
        } else if (drift) {
          tx = Math.sin(elapsed * 0.5) * 0.22;
          ty = Math.cos(elapsed * 0.37) * 0.16;
        }
      }
      dx = damp(dx, tx, 4, dt);
      dy = damp(dy, ty, 4, dt);

      applyRef.current(p, dx, dy);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animate, container]);

  const scene = (
    <div
      ref={sceneRef}
      role="img"
      aria-label={label}
      className="relative w-full overflow-hidden"
      style={{ height: sceneH }}
    >
      {layers.map((layer, i) => (
        <div
          key={i}
          ref={(el) => {
            layerRefs.current[i] = el;
          }}
          aria-hidden="true"
          // Layers are oversized 14% on each axis so travel never reveals an edge.
          className="pointer-events-none absolute -left-[7%] -right-[7%] -top-[14%] -bottom-[14%]"
          style={{ willChange: scrubbing ? "transform" : undefined }}
        >
          {layer.node}
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={rootRef}
      data-motion={staticMode ? "static" : "animated"}
      data-scroll-mode={scrollMode}
      className={cn("w-full", className)}
      style={style}
      {...props}
    >
      {container && scrubbing ? (
        <div className="relative w-full overflow-hidden rounded-[inherit]" style={{ height: sceneH }}>
          <div
            ref={scrollerRef}
            tabIndex={0}
            role="region"
            aria-label="Parallax scene stage. Scroll or use the arrow keys to move the scene through its depth."
            className="h-full overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent,#4f7cff)]"
          >
            <div aria-hidden="true" style={{ height: `calc(${sceneH} * ${spacer})` }} />
            {scene}
            <div aria-hidden="true" style={{ height: `calc(${sceneH} * ${spacer})` }} />
          </div>
        </div>
      ) : (
        scene
      )}
    </div>
  );
}

DepthParallaxScene.displayName = "DepthParallaxScene";

export default DepthParallaxScene;
