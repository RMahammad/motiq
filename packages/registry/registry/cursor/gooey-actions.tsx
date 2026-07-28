"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useControllableState, useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface GooeyAction {
  /** Stable id passed back to `onSelect`. */
  id: string;
  /** Accessible name + hover/focus label chip text. */
  label: string;
  /** Optional glyph (an inline `<svg>` works best); falls back to the label initial. */
  icon?: React.ReactNode;
}

export interface GooeyActionsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** The satellite actions — 3–6 read best in the arc. */
  actions: GooeyAction[];
  /** Distance from the core to each satellite, in px. */
  radius?: number;
  /** Arc the satellites spread across, in degrees (screen space, −90° is up). */
  arc?: [number, number];
  /** Per-satellite launch delay, in ms. */
  stagger?: number;
  /** Bloom spring stiffness (underdamped by design — the goo necks, then snaps). */
  stiffness?: number;
  /** Bloom spring damping. */
  damping?: number;
  /** Pointer distance, in px, within which a satellite leans toward the cursor. */
  magnetRange?: number;
  /** Accessible name for the core button and its menu. */
  label?: string;
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Fired whenever the bloom opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Fired with the action id when a satellite is committed. */
  onSelect?: (id: string) => void;
  /** Tease the bloom every ~7s until the first interaction. */
  autoPeek?: boolean;
  /** Deterministic seed for the ambient ember phase (SSR-stable). */
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

const CORE_PX = 74;
const SAT_PX = 46;
/** Vertical anchor of the core inside the component box. */
const CORE_Y = 0.58;
/** Peak magnetic lean, as a fraction of the pointer gap. */
const MAGNET_PULL = 0.35;
/** Auto-peek: window length and extension amplitude. */
const PEEK_WINDOW = 1.4;
const PEEK_PERIOD = 7;
const PEEK_AMOUNT = 0.24;

interface SatState {
  ang: number;
  x: Spring;
  y: Spring;
  s: Spring;
}

interface PointerState {
  x: number;
  y: number;
  inside: boolean;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * GooeyActions — a floating action button that blooms into satellites through a
 * gooey metaball merge: solid blobs animate under an SVG `feGaussianBlur` +
 * alpha-contrast `feColorMatrix` filter while crisp icons ride an unfiltered
 * twin layer sharing the same transforms, so the goo stretches and necks but
 * the glyphs never blur. The bloom springs are deliberately underdamped
 * (ζ≈0.43, ~18% overshoot) with a per-satellite stagger, each satellite leans
 * toward the pointer within `magnetRange` so commit feels pre-confirmed, and
 * while closed two ember blobs orbit through the goo field with the core
 * breathing at 4%. Fully keyboard operable: real buttons, menu semantics with
 * roving focus, Escape closes and restores focus to the core. Reduced motion
 * keeps the goo look but opens instantly with a fade. Clean-room original.
 */
export function GooeyActions({
  actions,
  radius = 118,
  arc = [-160, -20],
  stagger = 45,
  stiffness = 230,
  damping = 13,
  magnetRange = 52,
  label = "Actions",
  open,
  defaultOpen = false,
  onOpenChange,
  onSelect,
  autoPeek = true,
  seed = 1,
  pauseWhenHidden = true,
  reducedMotion,
  className,
  style,
  ...props
}: GooeyActionsProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const fabRef = React.useRef<HTMLButtonElement | null>(null);
  const coreBlobRef = React.useRef<HTMLDivElement | null>(null);
  const amb1Ref = React.useRef<HTMLDivElement | null>(null);
  const amb2Ref = React.useRef<HTMLDivElement | null>(null);
  const satBlobsRef = React.useRef<Array<HTMLDivElement | null>>([]);
  const satBtnsRef = React.useRef<Array<HTMLButtonElement | null>>([]);
  const labelRef = React.useRef<HTMLDivElement | null>(null);
  const pointerRef = React.useRef<PointerState>({ x: -1e4, y: -1e4, inside: false });
  const focusedRef = React.useRef(-1);
  const nowRef = React.useRef(0);
  const toggleAtRef = React.useRef(-1e4);
  const interactedRef = React.useRef(false);

  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const filterId = `mk-goo-${uid}`;
  const menuId = `mk-goo-menu-${uid}`;

  const [isOpen, setIsOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const [activeIdx, setActiveIdx] = React.useState(0);
  const openRef = React.useRef(isOpen);

  const systemReduced = useReducedMotion();
  // Resolve the system preference post-mount only, so SSR and first client
  // render agree on data-motion (no hydration mismatch).
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const staticMode = reducedMotion === true || (hydrated && systemReduced);
  const onScreen = useVisibilityPause(rootRef, { threshold: 0.06 });
  const paused = pauseWhenHidden && !onScreen;
  const animate = !staticMode && !paused;

  const count = actions.length;
  const [a0, a1] = arc;

  // Live prop mirror so the rAF loop reads fresh values without re-subscribing.
  const params = React.useRef({ radius, stagger, stiffness, damping, magnetRange, autoPeek });
  params.current = { radius, stagger, stiffness, damping, magnetRange, autoPeek };

  // Rebuild the satellite ring whenever the count or the arc changes (lazy init;
  // the springs must survive re-renders, so they live in a ref, not state).
  const satsRef = React.useRef<SatState[]>([]);
  const ringKeyRef = React.useRef("");
  const ringKey = `${count}:${a0}:${a1}`;
  if (ringKeyRef.current !== ringKey) {
    ringKeyRef.current = ringKey;
    satsRef.current = Array.from({ length: count }, (_, i) => ({
      ang:
        ((count === 1 ? (a0 + a1) / 2 : a0 + (a1 - a0) * (i / (count - 1))) * Math.PI) / 180,
      x: mkSpring(0),
      y: mkSpring(0),
      s: mkSpring(0.6),
    }));
  }

  const center = React.useCallback(() => {
    const root = rootRef.current;
    if (!root) return { x: 0, y: 0 };
    return { x: root.clientWidth / 2, y: root.clientHeight * CORE_Y };
  }, []);

  const applyOne = React.useCallback((i: number) => {
    const s = satsRef.current[i];
    if (!s) return;
    const tr = `translate(-50%,-50%) translate3d(${s.x.x.toFixed(2)}px,${s.y.x.toFixed(2)}px,0) scale(${s.s.x.toFixed(3)})`;
    const blob = satBlobsRef.current[i];
    const btn = satBtnsRef.current[i];
    if (blob) blob.style.transform = tr;
    if (btn) {
      btn.style.transform = tr;
      // Icons fade in only once the satellite has actually left the core, so a
      // closed dial (or an auto-peek tease) never stacks glyphs under the plus.
      btn.style.opacity = Math.hypot(s.x.x, s.y.x) > SAT_PX ? "1" : "0";
    }
  }, []);

  const showLabelFor = React.useCallback(
    (i: number) => {
      const el = labelRef.current;
      const s = satsRef.current[i];
      if (!el || !s) return;
      const c = center();
      const next = actions[i]?.label ?? "";
      if (el.textContent !== next) el.textContent = next;
      el.style.transform = `translate3d(${(c.x + s.x.x - el.offsetWidth / 2).toFixed(1)}px,${(
        c.y +
        s.y.x -
        58
      ).toFixed(1)}px,0)`;
      el.style.opacity = "1";
    },
    [actions, center],
  );

  const hideLabel = React.useCallback(() => {
    if (labelRef.current) labelRef.current.style.opacity = "0";
  }, []);

  /** Snap every satellite to its resting place — the reduced-motion layout. */
  const layoutInstant = React.useCallback(
    (opened: boolean) => {
      const r = params.current.radius;
      satsRef.current.forEach((s, i) => {
        s.x.x = opened ? Math.cos(s.ang) * r : 0;
        s.y.x = opened ? Math.sin(s.ang) * r : 0;
        s.s.x = opened ? 1 : 0.6;
        s.x.v = 0;
        s.y.v = 0;
        s.s.v = 0;
        applyOne(i);
      });
      if (coreBlobRef.current) coreBlobRef.current.style.transform = "translate(-50%,-50%)";
      if (fabRef.current) fabRef.current.style.transform = "translate(-50%,-50%)";
      if (amb1Ref.current) amb1Ref.current.style.transform = "translate(-50%,-50%) scale(0)";
      if (amb2Ref.current) amb2Ref.current.style.transform = "translate(-50%,-50%) scale(0)";
    },
    [applyOne],
  );

  React.useEffect(() => {
    openRef.current = isOpen;
    toggleAtRef.current = nowRef.current;
    if (!isOpen) hideLabel();
    if (!animate) layoutInstant(isOpen);
  }, [isOpen, animate, layoutInstant, hideLabel]);

  React.useEffect(() => {
    if (!animate) return;
    const rng = makeRng(seed);
    const peekOffset = 3.5 + rng() * 2;
    const breathe = mkSpring(1);
    let raf = 0;
    let last = 0;
    let start = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!start) start = now;
      let dt = (now - last) / 1000;
      last = now;
      if (!(dt > 0) || dt > 0.05) dt = 0.016;
      const t = (now - start) / 1000;
      nowRef.current = t;

      const cfg = params.current;
      const opened = openRef.current;
      const p = pointerRef.current;
      const c = center();
      const staggerSec = cfg.stagger / 1000;

      // Auto-peek until the first interaction, so the affordance sells itself.
      let peek = 0;
      if (cfg.autoPeek && !interactedRef.current && !opened) {
        const ph = (t - peekOffset) % PEEK_PERIOD;
        if (ph > 0 && ph < PEEK_WINDOW) peek = Math.sin((ph / PEEK_WINDOW) * Math.PI) * PEEK_AMOUNT;
      }

      let hoverAny = -1;
      for (let i = 0; i < satsRef.current.length; i++) {
        const s = satsRef.current[i];
        const mounted = opened && t - toggleAtRef.current >= i * staggerSec;
        const ext = mounted ? 1 : peek;
        let tx = Math.cos(s.ang) * cfg.radius * ext;
        let ty = Math.sin(s.ang) * cfg.radius * ext;
        let ts = mounted ? 1 : peek > 0 ? 0.62 + peek : 0.6;

        if (opened && p.inside && cfg.magnetRange > 0) {
          const sx = c.x + s.x.x;
          const sy = c.y + s.y.x;
          const dx = p.x - sx;
          const dy = p.y - sy;
          const d = Math.hypot(dx, dy);
          if (d < cfg.magnetRange) {
            const pull = 1 - d / cfg.magnetRange;
            tx += dx * MAGNET_PULL * pull;
            ty += dy * MAGNET_PULL * pull;
            ts = 1 + 0.16 * pull;
            if (hoverAny < 0) hoverAny = i;
          }
        }

        spring(s.x, tx, cfg.stiffness, cfg.damping, dt);
        spring(s.y, ty, cfg.stiffness, cfg.damping, dt);
        spring(s.s, ts, 300, 20, dt);
        applyOne(i);
      }

      if (hoverAny >= 0) showLabelFor(hoverAny);
      else if (focusedRef.current >= 0) showLabelFor(focusedRef.current);
      else hideLabel();

      // Core breathing + ambient embers orbiting through the goo field.
      spring(breathe, opened ? 1.06 : 1 + Math.sin(t * 1.6) * 0.04, 200, 18, dt);
      const coreTr = `translate(-50%,-50%) scale(${breathe.x.toFixed(3)})`;
      if (coreBlobRef.current) coreBlobRef.current.style.transform = coreTr;
      if (fabRef.current) fabRef.current.style.transform = coreTr;

      const hideAmb = opened ? 0 : 1;
      if (amb1Ref.current) {
        const r1 = 46 + Math.sin(t * 0.7) * 12;
        const ang1 = t * 0.9;
        amb1Ref.current.style.transform = `translate(-50%,-50%) translate3d(${(Math.cos(ang1) * r1).toFixed(1)}px,${(
          Math.sin(ang1) *
          r1 *
          0.8
        ).toFixed(1)}px,0) scale(${hideAmb})`;
      }
      if (amb2Ref.current) {
        const r2 = 58 + Math.sin(t * 0.9 + 2) * 10;
        const ang2 = -t * 0.6 + 2.1;
        amb2Ref.current.style.transform = `translate(-50%,-50%) translate3d(${(Math.cos(ang2) * r2).toFixed(1)}px,${(
          Math.sin(ang2) *
          r2 *
          0.8
        ).toFixed(1)}px,0) scale(${hideAmb})`;
      }
    };

    last = typeof performance !== "undefined" ? performance.now() : 0;
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animate, ringKey, seed, applyOne, center, showLabelFor, hideLabel]);

  const track = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (!root) return;
    const r = root.getBoundingClientRect();
    pointerRef.current = { x: e.clientX - r.left, y: e.clientY - r.top, inside: true };
  }, []);

  const release = React.useCallback(() => {
    pointerRef.current = { x: -1e4, y: -1e4, inside: false };
  }, []);

  const focusSat = React.useCallback((i: number) => {
    setActiveIdx(i);
    satBtnsRef.current[i]?.focus();
  }, []);

  const closeAndRestore = React.useCallback(() => {
    interactedRef.current = true;
    setIsOpen(false);
    fabRef.current?.focus();
  }, [setIsOpen]);

  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen || count === 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      focusSat((activeIdx + 1) % count);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      focusSat((activeIdx - 1 + count) % count);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusSat(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusSat(count - 1);
    }
  };

  return (
    <div
      ref={rootRef}
      data-motion={staticMode ? "static" : "animated"}
      data-paused={paused ? "true" : "false"}
      data-open={isOpen ? "true" : "false"}
      className={cn("relative w-full", className)}
      style={{ minHeight: 300, ...style }}
      onPointerMove={track}
      onPointerDown={track}
      onPointerLeave={release}
      onPointerCancel={release}
      onKeyDown={(e) => {
        if (e.key === "Escape" && isOpen) {
          e.stopPropagation();
          closeAndRestore();
        }
      }}
      {...props}
    >
      {/* Goo filter: blur + alpha contrast. Wide region so blobs never clip. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -12"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Filtered blob field — solid shapes only, so the metaballs merge cleanly. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ filter: `url(#${filterId})` }}
      >
        <div
          ref={amb1Ref}
          className="absolute h-5 w-5 rounded-full"
          style={{ left: "50%", top: `${CORE_Y * 100}%`, background: "var(--color-accent, #4f7cff)", transform: "translate(-50%,-50%) scale(0)", willChange: "transform" }}
        />
        <div
          ref={amb2Ref}
          className="absolute h-3.5 w-3.5 rounded-full"
          style={{ left: "50%", top: `${CORE_Y * 100}%`, background: "var(--color-accent, #4f7cff)", transform: "translate(-50%,-50%) scale(0)", willChange: "transform" }}
        />
        {actions.map((action, i) => (
          <div
            key={action.id}
            ref={(el) => {
              satBlobsRef.current[i] = el;
            }}
            className="absolute rounded-full"
            style={{
              left: "50%",
              top: `${CORE_Y * 100}%`,
              width: SAT_PX,
              height: SAT_PX,
              background: "var(--color-accent, #4f7cff)",
              transform: "translate(-50%,-50%) scale(0.6)",
              willChange: "transform",
            }}
          />
        ))}
        <div
          ref={coreBlobRef}
          className="absolute rounded-full"
          style={{
            left: "50%",
            top: `${CORE_Y * 100}%`,
            width: CORE_PX,
            height: CORE_PX,
            background: "var(--color-accent, #4f7cff)",
            transform: "translate(-50%,-50%)",
            willChange: "transform",
          }}
        />
      </div>

      {/* Unfiltered twin layer: real buttons + crisp icons on the same transforms. */}
      <div className="pointer-events-none absolute inset-0 z-[2]">
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          aria-hidden={isOpen ? undefined : true}
          onKeyDown={onMenuKeyDown}
        >
          {actions.map((action, i) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              ref={(el) => {
                satBtnsRef.current[i] = el;
              }}
              data-action={action.id}
              // Closed satellites stay mounted (the goo has to animate them) but
              // are inert: not tabbable, not focusable, not exposed to AT.
              disabled={!isOpen}
              tabIndex={isOpen && i === Math.min(activeIdx, count - 1) ? 0 : -1}
              aria-label={action.label}
              onFocus={() => {
                focusedRef.current = i;
                setActiveIdx(i);
                showLabelFor(i);
              }}
              onBlur={() => {
                if (focusedRef.current === i) focusedRef.current = -1;
                hideLabel();
              }}
              onClick={() => {
                interactedRef.current = true;
                onSelect?.(action.id);
                closeAndRestore();
              }}
              className={cn(
                "absolute grid cursor-pointer place-items-center rounded-full border-0 p-0 opacity-0",
                "[&_svg]:h-[22px] [&_svg]:w-[22px] [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-secondary-accent,#22c7d9)]",
                staticMode && "transition-opacity duration-200",
              )}
              style={{
                left: "50%",
                top: `${CORE_Y * 100}%`,
                width: SAT_PX,
                height: SAT_PX,
                background: "transparent",
                color: "var(--color-bg, #080c14)",
                transform: "translate(-50%,-50%) scale(0.6)",
                // Declarative, so a satellite stays clickable even if the rAF loop
                // is parked (offscreen) while the dial is open.
                pointerEvents: isOpen ? "auto" : "none",
                willChange: "transform",
              }}
            >
              {action.icon ?? (
                <span aria-hidden="true" className="text-[15px] font-bold">
                  {action.label.slice(0, 1).toUpperCase()}
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          ref={fabRef}
          type="button"
          aria-label={label}
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-controls={menuId}
          onClick={(event) => {
            interactedRef.current = true;
            const next = !isOpen;
            setIsOpen(next);
            // detail === 0 means the click came from Enter/Space — move focus into
            // the menu, as the menu-button pattern expects. A mouse click doesn't.
            if (next && event.detail === 0) {
              setActiveIdx(0);
              requestAnimationFrame(() => satBtnsRef.current[0]?.focus());
            }
          }}
          className={cn(
            "pointer-events-auto absolute grid cursor-pointer place-items-center rounded-full border-0 p-0",
            "[&_svg]:h-[26px] [&_svg]:w-[26px] [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2",
            "[&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-[cubic-bezier(0.2,0,0,1)]",
            isOpen && "[&_svg]:rotate-45",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-secondary-accent,#22c7d9)]",
          )}
          style={{
            left: "50%",
            top: `${CORE_Y * 100}%`,
            width: CORE_PX,
            height: CORE_PX,
            background: "transparent",
            color: "var(--color-bg, #080c14)",
            transform: "translate(-50%,-50%)",
            willChange: "transform",
          }}
        >
          <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>

      <div
        ref={labelRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-[3] whitespace-nowrap rounded-[7px] px-2.5 py-1 text-[11.5px] font-semibold opacity-0 transition-opacity duration-150"
        style={{
          background: "var(--color-fg, #f8fafc)",
          color: "var(--color-bg, #080c14)",
          transform: "translate3d(-999px,-999px,0)",
        }}
      />
    </div>
  );
}

GooeyActions.displayName = "GooeyActions";

export default GooeyActions;
