"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useControllableState, useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface OrbitalGalleryItem {
  /** Stable key. */
  id: string;
  /** Image URL rendered as a plain `<img>` (use `node` for anything richer). */
  src?: string;
  /** Alternative text for `src`. Empty string marks the art as decorative. */
  alt?: string;
  /** Arbitrary media node — takes precedence over `src`. */
  node?: React.ReactNode;
  /** Short title shown in the card footer and announced when the card fronts. */
  caption?: string;
}

export interface OrbitalGalleryProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** 6–12 cards read best; the ring divides 360° evenly between them. */
  items: OrbitalGalleryItem[];
  /** Ring radius in px. Derived from `cardWidth` and the item count when unset. */
  radius?: number;
  /** Card size in px (the ring scales down on narrow containers). */
  cardWidth?: number;
  cardHeight?: number;
  /** Idle drift speed in rad/s once the ring has been still for 2.5s. */
  autoRotate?: number;
  /** Inertia decay constant (1/s) — velocity follows v·e^(−friction·t). */
  friction?: number;
  /** Rear-card dimming at the back of the ring, 0–1. */
  dimRear?: number;
  /** Rear-card blur in px at the back of the ring. */
  blurRear?: number;
  /** Controlled index of the fronted card. */
  activeIndex?: number;
  /** Uncontrolled initial fronted card. */
  defaultActiveIndex?: number;
  /** Fires whenever a different card reaches the front (drag, flick, key, click). */
  onActiveIndexChange?: (index: number, item: OrbitalGalleryItem) => void;
  /** Show the footer bar with the fronted card's caption + position. */
  showCaptionBar?: boolean;
  /** Keyboard/pointer affordance text in the caption bar. */
  hint?: React.ReactNode;
  /** Force the static variant (no drift, no inertia) regardless of system preference. */
  reducedMotion?: boolean;
  /** Stop the rAF loop while scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Physics constants (Motion Lab "Media in Motion" ship spec)                 */
/* -------------------------------------------------------------------------- */

const TAU = Math.PI * 2;
/** Pointer travel → rotation, 1:1 grab feel. */
const RAD_PER_PX = 0.0045;
/** Release-velocity smoothing (25% EMA on the newest sample). */
const VEL_EMA = 0.25;
/** Flick clamp, rad/s — a hard flick spins roughly two revolutions. */
const MAX_FLICK = 6;
/** Focus spring — slightly under-damped so a card lands with one soft settle. */
const FOCUS_K = 26;
const FOCUS_C = 9.5;
/** Seconds of stillness before the idle drift takes over. */
const IDLE_DELAY = 2.5;
/** Horizontal wheel → rotation + impulse. */
const WHEEL_RAD = 0.0022;
const WHEEL_VEL = 0.012;
const WHEEL_CLAMP = 5;
/** Depth cue: scale spans SCALE_MIN → SCALE_MIN + SCALE_SPAN across cos θ. */
const SCALE_MIN = 0.94;
const SCALE_SPAN = 0.12;
/** Blur is quantized to this step so the filter string rarely invalidates. */
const BLUR_STEP = 0.25;
/** Pointer travel (px) under which a release still counts as a click. */
const CLICK_SLOP = 6;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * OrbitalGallery — media cards on a perspective ring you can grab and flick.
 * The ring carries real momentum (velocity clamped to ±6 rad/s, decaying as
 * v·e^(−2.2t)) and coasts to a stop; the front card scales and sharpens while
 * rear cards fall back into dimmed haze by cos θ. Click or arrow-key a card and
 * an under-damped spring springs it to the front.
 *
 * One rAF loop per instance writes only transforms/opacity/filter straight to
 * the card elements — no per-frame React state. Pauses offscreen. Clean-room
 * original.
 */
export function OrbitalGallery({
  items,
  radius,
  cardWidth = 190,
  cardHeight = 250,
  autoRotate = 0.14,
  friction = 2.2,
  dimRear = 0.78,
  blurRear = 2.2,
  activeIndex,
  defaultActiveIndex = 0,
  onActiveIndexChange,
  showCaptionBar = true,
  hint = "drag · flick · arrows",
  reducedMotion,
  pauseWhenHidden = true,
  className,
  ...props
}: OrbitalGalleryProps) {
  const n = items.length;
  const step = n > 0 ? TAU / n : TAU;
  const ringRadius = radius ?? Math.round((cardWidth / (2 * Math.tan(Math.PI / Math.max(3, n)))) * 1.15);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const scaleRef = React.useRef<HTMLDivElement | null>(null);
  const cardRefs = React.useRef<Array<HTMLElement | null>>([]);
  const dimRefs = React.useRef<Array<HTMLElement | null>>([]);
  const blurRefs = React.useRef<number[]>([]);
  /** Latest frame painter, owned by the loop effect — handlers call it for the
   *  instant (reduced-motion) path where no loop is running. */
  const paintRef = React.useRef<() => void>(() => {});

  const systemReduced = useReducedMotion();
  // The system preference is unknown during SSR, so only fold it in after mount.
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const still = reducedMotion === true || (hydrated && systemReduced);

  const onScreen = useVisibilityPause(rootRef, { threshold: 0.05 });
  const animate = n > 0 && !still && (!pauseWhenHidden || onScreen);

  const [active, setActive] = useControllableState<number>({
    value: activeIndex,
    defaultValue: clamp(defaultActiveIndex, 0, Math.max(0, n - 1)),
    onChange: (i) => onActiveIndexChange?.(i, items[i]),
  });
  const setActiveRef = React.useRef(setActive);
  setActiveRef.current = setActive;

  // Seeded from the RESOLVED initial card so the first paint doesn't fight a
  // controlled `activeIndex`.
  const initialIndex = clamp(activeIndex ?? defaultActiveIndex, 0, Math.max(0, n - 1));
  const sim = React.useRef({
    rot: -initialIndex * step,
    vel: 0.9,
    dragging: false,
    focusTarget: null as number | null,
    lastInteract: -100,
    // Seeded with the initial front card so the first paint doesn't fire a
    // spurious onActiveIndexChange.
    front: initialIndex,
    pointerId: null as number | null,
    px: 0,
    pt: 0,
    moved: 0,
    pvel: 0,
    scale: 1,
  });

  const params = React.useRef({ step, n, ringRadius, autoRotate, friction, dimRear, blurRear, still });
  params.current = { step, n, ringRadius, autoRotate, friction, dimRear, blurRear, still };

  /* ---------------------------------------------------------------- loop -- */

  React.useEffect(() => {
    if (n === 0) return;

    const paint = () => {
      const p = params.current;
      const s = sim.current;
      let best = -2;
      let bestI = 0;
      for (let i = 0; i < p.n; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const a = s.rot + i * p.step;
        const c = Math.cos(a);
        const depth = (c + 1) / 2;
        const scale = SCALE_MIN + depth * SCALE_SPAN;
        el.style.transform = `rotateY(${a.toFixed(4)}rad) translateZ(${p.ringRadius}px) scale(${scale.toFixed(3)})`;
        const blur = Math.round(((1 - depth) * p.blurRear) / BLUR_STEP) * BLUR_STEP;
        if (blur !== blurRefs.current[i]) {
          el.style.filter = blur > 0.2 ? `blur(${blur}px)` : "none";
          blurRefs.current[i] = blur;
        }
        const dim = dimRefs.current[i];
        if (dim) dim.style.opacity = ((1 - depth) * p.dimRear).toFixed(3);
        if (c > best) {
          best = c;
          bestI = i;
        }
      }
      if (bestI !== s.front) {
        s.front = bestI;
        setActiveRef.current(bestI);
      }
    };
    paintRef.current = paint;

    const fitScale = () => {
      const root = rootRef.current;
      const wrap = scaleRef.current;
      if (!root || !wrap) return;
      const p = params.current;
      const need = p.ringRadius * 2 + cardWidth * 0.4;
      const next = clamp(root.clientWidth / Math.max(1, need), 0.55, 1);
      if (Math.abs(next - sim.current.scale) > 0.01) {
        sim.current.scale = next;
        wrap.style.transform = `scale(${next.toFixed(3)})`;
      }
    };
    fitScale();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fitScale) : null;
    if (rootRef.current) ro?.observe(rootRef.current);

    paint();

    if (!animate) {
      return () => ro?.disconnect();
    }

    let raf = 0;
    let last = performance.now();
    const frame = (ts: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (ts - last) / 1000));
      last = ts;
      const now = ts / 1000;
      const p = params.current;
      const s = sim.current;
      if (s.dragging) {
        // Rotation is applied 1:1 in pointermove; nothing to integrate.
      } else if (s.focusTarget !== null) {
        const diff = s.focusTarget - s.rot;
        s.vel += (diff * FOCUS_K - s.vel * FOCUS_C) * dt;
        s.rot += s.vel * dt;
        if (Math.abs(diff) < 0.002 && Math.abs(s.vel) < 0.01) {
          s.rot = s.focusTarget;
          s.vel = 0;
          s.focusTarget = null;
        }
      } else {
        s.rot += s.vel * dt;
        s.vel *= Math.exp(-p.friction * dt);
        if (now - s.lastInteract > IDLE_DELAY && Math.abs(s.vel) < 0.3) {
          s.vel += (p.autoRotate - s.vel) * Math.min(1, dt * 0.9);
        }
      }
      paint();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [animate, n, cardWidth]);

  /* ------------------------------------------------------------ focusing -- */

  const focusIndex = React.useCallback((i: number) => {
    const p = params.current;
    const s = sim.current;
    if (p.n === 0) return;
    const base = -i * p.step;
    const target = base + Math.round((s.rot - base) / TAU) * TAU;
    s.lastInteract = performance.now() / 1000;
    if (p.still) {
      s.rot = target;
      s.vel = 0;
      s.focusTarget = null;
      paintRef.current();
    } else {
      s.focusTarget = target;
    }
  }, []);

  // An `activeIndex` change that did NOT come from the loop (controlled update,
  // click, key) springs the ring to that card.
  React.useEffect(() => {
    if (n === 0) return;
    if (active === sim.current.front) return;
    focusIndex(clamp(active, 0, n - 1));
  }, [active, n, focusIndex]);

  /* ------------------------------------------------------------- pointer -- */

  const mark = () => {
    sim.current.lastInteract = performance.now() / 1000;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const s = sim.current;
    s.dragging = true;
    s.focusTarget = null;
    s.moved = 0;
    s.px = e.clientX;
    s.pt = performance.now();
    s.pvel = 0;
    s.pointerId = e.pointerId;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    mark();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    if (!s.dragging || e.pointerId !== s.pointerId) return;
    const nx = e.clientX;
    const nt = performance.now();
    const dx = nx - s.px;
    const dts = Math.max(0.001, (nt - s.pt) / 1000);
    s.moved += Math.abs(dx);
    const dr = dx * RAD_PER_PX;
    s.rot += dr;
    s.pvel = (1 - VEL_EMA) * s.pvel + VEL_EMA * (dr / dts);
    s.px = nx;
    s.pt = nt;
    if (params.current.still) paintRef.current();
    mark();
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    if (!s.dragging || e.pointerId !== s.pointerId) return;
    s.dragging = false;
    s.pointerId = null;
    s.vel = params.current.still ? 0 : clamp(s.pvel, -MAX_FLICK, MAX_FLICK);
    mark();
  };

  // React attaches `wheel` passively at the root container, so preventDefault()
  // there is a no-op — the horizontal-wheel spin needs a native listener.
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || !animate) return;
    const onWheel = (e: WheelEvent) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!d) return;
      e.preventDefault();
      const s = sim.current;
      s.focusTarget = null;
      s.rot += d * WHEEL_RAD;
      s.vel = clamp(s.vel + d * WHEEL_VEL, -WHEEL_CLAMP, WHEEL_CLAMP);
      s.lastInteract = performance.now() / 1000;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [animate]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (n === 0) return;
    let next = active;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (active + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (active - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else return;
    e.preventDefault();
    setActive(next);
    focusIndex(next);
    cardRefs.current[next]?.focus({ preventScroll: true });
  };

  const activeItem = n > 0 ? items[clamp(active, 0, n - 1)] : undefined;

  return (
    <div
      ref={rootRef}
      role="group"
      aria-roledescription="carousel"
      aria-label={props["aria-label"] ?? "Media gallery"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      data-motion={still ? "static" : "animated"}
      className={cn(
        "relative w-full touch-pan-y select-none overflow-hidden rounded-[16px]",
        "border border-[var(--color-border,#263449)] bg-[var(--color-bg-elevated,#0d1420)]",
        "min-h-[420px] cursor-grab active:cursor-grabbing sm:min-h-[480px]",
        className,
      )}
      {...props}
    >
      {/* Floor bloom — decorative. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 left-1/2 h-[110px] w-[min(560px,90%)] -translate-x-1/2 blur-[4px]"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, color-mix(in oklab, var(--color-accent, #4f7cff) 22%, transparent), transparent 70%)",
        }}
      />

      <div
        className="absolute inset-x-0 top-0 grid place-items-center"
        style={{ bottom: showCaptionBar ? 52 : 0, perspective: "1150px" }}
      >
        <div ref={scaleRef} className="relative h-0 w-0 [transform-style:preserve-3d]">
          <div className="absolute [transform-style:preserve-3d]">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                tabIndex={i === active ? 0 : -1}
                aria-current={i === active ? "true" : undefined}
                onClick={(e) => {
                  // detail === 0 means a keyboard activation, which must never be
                  // swallowed by the leftover travel of an earlier drag.
                  if (e.detail !== 0 && sim.current.moved > CLICK_SLOP) return;
                  setActive(i);
                  focusIndex(i);
                }}
                className={cn(
                  "absolute block overflow-hidden rounded-[10px] p-0 text-left will-change-transform",
                  "border border-[var(--color-border-strong,#354863)] bg-[var(--color-surface-2,#192337)]",
                  "shadow-[0_18px_40px_-18px_rgba(2,6,16,0.55)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent,#4f7cff)] focus-visible:ring-offset-2",
                )}
                style={{
                  left: -cardWidth / 2,
                  top: -cardHeight / 2,
                  width: cardWidth,
                  height: cardHeight,
                }}
              >
                <span className="absolute inset-x-0 top-0 block h-[82%] overflow-hidden">
                  {item.node ?? (
                    item.src ? (
                      <img
                        src={item.src}
                        alt={item.alt ?? ""}
                        draggable={false}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="block h-full w-full"
                        style={{
                          background:
                            "linear-gradient(140deg, color-mix(in oklab, var(--color-accent, #4f7cff) 32%, transparent), color-mix(in oklab, var(--color-secondary-accent, #22c7d9) 26%, transparent))",
                        }}
                      />
                    )
                  )}
                </span>
                <span
                  className={cn(
                    "absolute inset-x-0 bottom-0 flex h-[18%] items-center gap-2 truncate px-3",
                    "border-t border-[var(--color-border,#263449)] bg-[var(--color-surface,#111827)]",
                    "text-[11.5px] font-semibold text-[var(--color-fg,#f8fafc)]",
                  )}
                >
                  <span className="font-mono text-[10px] text-[var(--color-muted,#9caabd)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate">{item.caption ?? item.alt ?? `Item ${i + 1}`}</span>
                </span>
                <span
                  aria-hidden="true"
                  ref={(el) => {
                    dimRefs.current[i] = el;
                  }}
                  className="pointer-events-none absolute inset-0 opacity-0"
                  style={{ background: "var(--color-bg, #080c14)" }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {showCaptionBar ? (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 flex h-[52px] items-center gap-3 px-4",
            "border-t border-[var(--color-border,#263449)]",
            "bg-[color-mix(in_oklab,var(--color-surface,#111827)_86%,transparent)] backdrop-blur-[8px]",
          )}
        >
          <span className="truncate text-[13px] font-semibold text-[var(--color-fg,#f8fafc)]">
            {activeItem?.caption ?? activeItem?.alt ?? "—"}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-[var(--color-muted,#9caabd)]">
            {String(Math.min(active + 1, n)).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </span>
          <span className="ml-auto hidden shrink-0 font-mono text-[10.5px] tracking-[0.06em] text-[var(--color-muted,#9caabd)] sm:block">
            {hint}
          </span>
        </div>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {activeItem ? `${activeItem.caption ?? activeItem.alt ?? `Item ${active + 1}`}, ${active + 1} of ${n}` : ""}
      </p>
    </div>
  );
}

export default OrbitalGallery;
