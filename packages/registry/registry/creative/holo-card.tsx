"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type HoloCardFoil = "azure" | "spectral" | "none";

export interface HoloCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card content. Laid out as a full-height column so a header/mid/footer trio reads like a pass. */
  children?: React.ReactNode;
  /** Peak lean in degrees at the card edge. 14 reproduces the lab's ±11° / ±15° pair. */
  maxTilt?: number;
  /** Tilt spring. Deliberately underdamped (ζ≈0.46) so release overshoots ~6% once. */
  spring?: { stiffness?: number; damping?: number };
  /** Iridescent foil sheet pinned to the raw pointer. */
  foil?: HoloCardFoil;
  /** Specular glare hotspot. */
  glare?: boolean;
  /** Counter-moving ground shadow under the card. */
  shadow?: boolean;
  /** Ambient sway before/after any pointer input. */
  idleSway?: boolean;
  /** Card aspect ratio (width / height). Pass 0 to let the content size the card. */
  aspect?: number;
  /** Accessible name for the tilt surface. */
  label?: string;
  /** Fires with the settled spring angles (rotateX, rotateY) as they change. */
  onTilt?: (rx: number, ry: number) => void;
  /** Park the loop while scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
  /** Force the static, motion-free resting pose regardless of system preference. */
  reducedMotion?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Physics                                                                    */
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

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Lab tilt envelope: rotateX ±11°, rotateY ±15° at maxTilt = 14. */
const TILT_X_RATIO = 11 / 14;
const TILT_Y_RATIO = 15 / 14;
/** Static resting pose used under reduced motion — still dimensional, zero movement. */
const REST = { rx: -6, ry: 8, px: 0.62, py: 0.3 };

const ACCENT = "var(--color-accent, #4f7cff)";
const ACCENT_TEXT = "var(--color-accent-text, #7f9fff)";
const CYAN = "var(--color-secondary-accent, #22c7d9)";

function foilBackground(foil: HoloCardFoil): string | undefined {
  if (foil === "none") return undefined;
  // A 1px repeating rake sells the "printed foil" texture under the conic sheet.
  const rake =
    "repeating-linear-gradient(115deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 5px)";
  const at = "at calc(var(--mk-holo-px, 0.5) * 100%) calc(var(--mk-holo-py, 0.5) * 100%)";
  if (foil === "azure") {
    return `${rake}, conic-gradient(from 210deg ${at}, ${ACCENT} 0deg, ${ACCENT_TEXT} 120deg, ${ACCENT} 240deg, ${ACCENT_TEXT} 360deg)`;
  }
  const mint = `color-mix(in srgb, ${CYAN} 52%, #ffffff)`;
  const deep = `color-mix(in srgb, ${ACCENT} 78%, #000000)`;
  return `${rake}, conic-gradient(from 210deg ${at}, ${ACCENT} 0deg, ${CYAN} 90deg, ${mint} 160deg, ${ACCENT} 230deg, ${deep} 300deg, ${ACCENT} 360deg)`;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * HoloCard — a 3D tilt card that behaves like a physical foil pass. Two
 * underdamped springs (k=120, d=10) chase the pointer so the card lags ~80ms
 * and overshoots ~6% on release, while the specular glare and the iridescent
 * conic foil stay pinned to the RAW pointer position — light is instant, mass
 * is not. A ground shadow counter-translates against the lean. One rAF loop per
 * instance with delta-time, paused offscreen; all motion is transform + custom
 * properties, so card content never repaints. Clean-room original.
 */
export function HoloCard({
  children,
  maxTilt = 14,
  spring,
  foil = "spectral",
  glare = true,
  shadow = true,
  idleSway = true,
  aspect = 1.586,
  label = "Interactive tilt card",
  onTilt,
  pauseWhenHidden = true,
  reducedMotion,
  className,
  style,
  ...props
}: HoloCardProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `mk-holo-${uid}`;
  const hintId = `${cls}-hint`;

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const shadowRef = React.useRef<HTMLDivElement | null>(null);

  const systemReduced = useReducedMotion();
  // The system preference is unknown during SSR, so it only joins after mount —
  // server and first client render agree on data-motion (no hydration mismatch).
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const staticMode = reducedMotion === true || (hydrated && systemReduced);
  const onScreen = useVisibilityPause(rootRef, { threshold: 0.05 });
  const paused = pauseWhenHidden && !onScreen;
  const animate = !staticMode && !paused;

  const maxY = Math.abs(maxTilt) * TILT_Y_RATIO;
  const maxX = Math.abs(maxTilt) * TILT_X_RATIO;

  const stiffness = spring?.stiffness ?? 120;
  const damping = spring?.damping ?? 10;

  // Mutable motion state lives in refs — the loop never triggers a React render.
  const springsRef = React.useRef({ sx: new Spring(0, stiffness, damping), sy: new Spring(0, stiffness, damping) });
  const lightRef = React.useRef({ px: 0.5, py: 0.5, hovering: false });
  const emittedRef = React.useRef({ rx: 0, ry: 0 });
  const liveRef = React.useRef({ maxX, maxY, idleSway, onTilt, staticMode });
  liveRef.current = { maxX, maxY, idleSway, onTilt, staticMode };

  React.useEffect(() => {
    springsRef.current.sx.k = stiffness;
    springsRef.current.sy.k = stiffness;
    springsRef.current.sx.d = damping;
    springsRef.current.sy.d = damping;
  }, [stiffness, damping]);

  const render = React.useCallback((rx: number, ry: number) => {
    const card = cardRef.current;
    if (!card) return;
    const { px, py } = lightRef.current;
    const { maxX: mx, maxY: my, onTilt: cb } = liveRef.current;
    card.style.transform = `rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`;
    card.style.setProperty("--mk-holo-px", px.toFixed(4));
    card.style.setProperty("--mk-holo-py", py.toFixed(4));
    // Foil hue swings with the lean AND across the card's width, so the sheet
    // shifts color as the light travels rather than merely moving.
    card.style.setProperty("--mk-holo-hue", (ry * 4 + (px - 0.5) * 40).toFixed(2));
    const lean = (Math.abs(rx) + Math.abs(ry)) / Math.max(1, mx + my);
    card.style.setProperty("--mk-holo-glare-o", (0.22 + lean * 0.4).toFixed(3));
    const sh = shadowRef.current;
    if (sh) {
      sh.style.transform = `translate3d(${(-ry * 1.8).toFixed(2)}px, ${(rx * 1.2).toFixed(2)}px, 0) scale(${(1 + lean * 0.08).toFixed(3)})`;
      sh.style.opacity = (0.75 + lean * 0.25).toFixed(3);
    }
    const prev = emittedRef.current;
    if (cb && (Math.abs(prev.rx - rx) > 0.05 || Math.abs(prev.ry - ry) > 0.05)) {
      emittedRef.current = { rx, ry };
      cb(rx, ry);
    }
  }, []);

  React.useEffect(() => {
    if (!animate) return;
    let raf = 0;
    let last = 0;
    let t = 0;
    const frame = (now: number) => {
      if (!last) last = now;
      const dt = clamp((now - last) / 1000, 0, 0.05);
      last = now;
      t += dt;
      const { sx, sy } = springsRef.current;
      const light = lightRef.current;
      const { maxX: mx, maxY: my, idleSway: sway } = liveRef.current;
      if (!light.hovering) {
        if (sway) {
          sy.target = clamp(Math.sin(t * 0.5) * 4, -my, my);
          sx.target = clamp(Math.cos(t * 0.37) * 3, -mx, mx);
        } else {
          sy.target = 0;
          sx.target = 0;
        }
        // Light drifts back to center faster than the card unwinds.
        const rate = Math.min(1, dt * 2);
        light.px += (0.5 - light.px) * rate;
        light.py += (0.5 - light.py) * rate;
      }
      render(sx.step(dt), sy.step(dt));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animate, render]);

  // Static resting pose — a designed still, not a flattened card.
  React.useEffect(() => {
    if (!staticMode) return;
    const { sx, sy } = springsRef.current;
    sx.x = sx.target = REST.rx;
    sy.x = sy.target = REST.ry;
    sx.v = 0;
    sy.v = 0;
    lightRef.current = { px: REST.px, py: REST.py, hovering: false };
    render(REST.rx, REST.ry);
  }, [staticMode, render]);

  const trackPointer = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (liveRef.current.staticMode) return;
      const card = cardRef.current;
      if (!card) return;
      const r = card.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const px = clamp((e.clientX - r.left) / r.width, 0, 1);
      const py = clamp((e.clientY - r.top) / r.height, 0, 1);
      const light = lightRef.current;
      light.px = px;
      light.py = py;
      light.hovering = true;
      const { maxX: mx, maxY: my } = liveRef.current;
      springsRef.current.sy.target = (px - 0.5) * 2 * my;
      springsRef.current.sx.target = -(py - 0.5) * 2 * mx;
    },
    [],
  );

  const release = React.useCallback(() => {
    lightRef.current.hovering = false;
  }, []);

  const onKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (liveRef.current.staticMode) return;
    const { sx, sy } = springsRef.current;
    const { maxX: mx, maxY: my } = liveRef.current;
    const step = 4;
    let used = true;
    if (e.key === "ArrowLeft") sy.target = Math.max(-my, sy.target - step);
    else if (e.key === "ArrowRight") sy.target = Math.min(my, sy.target + step);
    else if (e.key === "ArrowUp") sx.target = Math.min(mx, sx.target + step);
    else if (e.key === "ArrowDown") sx.target = Math.max(-mx, sx.target - step);
    else if (e.key === "Escape") {
      sx.target = 0;
      sy.target = 0;
    } else used = false;
    if (used) {
      lightRef.current.hovering = true;
      e.preventDefault();
    }
  }, []);

  const foilBg = foilBackground(foil);

  // Theme-reactive material values. Light default, dark via media query, an
  // explicit data-theme/.dark ancestor wins — mirrors the token cascade.
  const css = `
.${cls} {
  --mk-holo-blend: soft-light;
  --mk-holo-foil-o: 0.5;
  --mk-holo-glare: rgba(255, 255, 255, 0.75);
  --mk-holo-shadow: rgba(16, 24, 40, 0.22);
  --mk-holo-stroke: rgba(255, 255, 255, 0.85);
}
@media (prefers-color-scheme: dark) {
  .${cls} {
    --mk-holo-blend: color-dodge;
    --mk-holo-foil-o: 0.32;
    --mk-holo-glare: rgba(255, 255, 255, 0.5);
    --mk-holo-shadow: rgba(2, 5, 12, 0.65);
    --mk-holo-stroke: rgba(255, 255, 255, 0.16);
  }
}
[data-theme="dark"] .${cls}, .dark .${cls} {
  --mk-holo-blend: color-dodge;
  --mk-holo-foil-o: 0.32;
  --mk-holo-glare: rgba(255, 255, 255, 0.5);
  --mk-holo-shadow: rgba(2, 5, 12, 0.65);
  --mk-holo-stroke: rgba(255, 255, 255, 0.16);
}
[data-theme="light"] .${cls}, .light .${cls} {
  --mk-holo-blend: soft-light;
  --mk-holo-foil-o: 0.5;
  --mk-holo-glare: rgba(255, 255, 255, 0.75);
  --mk-holo-shadow: rgba(16, 24, 40, 0.22);
  --mk-holo-stroke: rgba(255, 255, 255, 0.85);
}
.${cls} .mk-holo-card { touch-action: none; }
.${cls} .mk-holo-foil {
  mix-blend-mode: var(--mk-holo-blend);
  opacity: var(--mk-holo-foil-o);
  filter: hue-rotate(calc(var(--mk-holo-hue, 0) * 1deg)) saturate(1.25);
  transform: translateZ(0);
}
.${cls} .mk-holo-glare {
  mix-blend-mode: screen;
  opacity: var(--mk-holo-glare-o, 0.35);
  transform: translateZ(0);
}
@media (forced-colors: active) {
  .${cls} .mk-holo-foil, .${cls} .mk-holo-glare, .${cls} .mk-holo-shadow { display: none; }
}`.trim();

  return (
    <div
      ref={rootRef}
      data-motion={staticMode ? "static" : "animated"}
      data-paused={paused ? "true" : "false"}
      className={cn("relative w-full", cls, className)}
      style={{ perspective: "1100px", ...style }}
      onPointerMove={trackPointer}
      onPointerDown={trackPointer}
      onPointerLeave={release}
      onPointerCancel={release}
      onPointerUp={(e) => {
        // A touch lift ends the interaction; a mouse keeps tracking until it leaves.
        if (e.pointerType !== "mouse") release();
      }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {shadow ? (
        <div
          ref={shadowRef}
          aria-hidden="true"
          className="mk-holo-shadow pointer-events-none absolute bottom-[-26px] left-[8%] right-[8%] h-11 rounded-[50%] will-change-transform"
          style={{
            background: "radial-gradient(50% 50% at 50% 50%, var(--mk-holo-shadow), transparent 70%)",
          }}
        />
      ) : null}

      <div
        ref={cardRef}
        role="group"
        aria-label={label}
        aria-describedby={hintId}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onBlur={release}
        className={cn(
          "mk-holo-card relative w-full select-none overflow-hidden rounded-2xl outline-none will-change-transform",
          "border border-[var(--color-border-strong,#354863)]",
          "focus-visible:ring-2 focus-visible:ring-[var(--color-accent,#4f7cff)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        )}
        style={{
          aspectRatio: aspect > 0 ? String(aspect) : undefined,
          transformStyle: "preserve-3d",
          background:
            "linear-gradient(145deg, var(--color-surface-2, #192337), var(--color-surface, #111827) 55%, var(--color-surface-2, #192337))",
          boxShadow: "inset 0 1px 0 var(--mk-holo-stroke)",
        }}
      >
        {foilBg ? (
          <div
            aria-hidden="true"
            className="mk-holo-foil pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{ background: foilBg }}
          />
        ) : null}

        <div className="relative flex h-full w-full flex-col justify-between gap-3 p-5" style={{ transform: "translateZ(1px)" }}>
          {children}
        </div>

        {glare ? (
          <div
            aria-hidden="true"
            className="mk-holo-glare pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              background:
                "radial-gradient(200px circle at calc(var(--mk-holo-px, 0.5) * 100%) calc(var(--mk-holo-py, 0.5) * 100%), var(--mk-holo-glare), transparent 65%)",
            }}
          />
        ) : null}
      </div>

      <span id={hintId} className="sr-only">
        Use the arrow keys to tilt the card, Escape to level it.
      </span>
    </div>
  );
}

export default HoloCard;
