"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useControllableState, useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface CardStackDeckItem {
  /** Stable key. */
  id: string;
  /** Front-face content. Ignored when `renderItem` is supplied. */
  content?: React.ReactNode;
  /** Announced politely when this card reaches the front. Falls back to the id. */
  label?: string;
}

export interface CardStackDeckItemState {
  /** Index in `items`. */
  index: number;
  /** 0 = front of the deck. */
  slot: number;
  isFront: boolean;
}

export interface CardStackDeckProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** The cards, front to back at rest. */
  items: CardStackDeckItem[];
  /** Render override for the front face. */
  renderItem?: (item: CardStackDeckItem, state: CardStackDeckItemState) => React.ReactNode;
  /** Shown mid-flip on the card's back. Defaults to a patterned back. */
  cardBack?: React.ReactNode;
  /** Rest-fan geometry per slot: y offset, z depth, rotateZ. */
  fan?: { y?: number; z?: number; rotate?: number };
  /** Peak sideways travel of the sent card, in px. */
  arcWidth?: number;
  /** Peak z-lift of the sent card, in px. */
  lift?: number;
  /** Slot spring for send + ripple. */
  spring?: { stiffness?: number; damping?: number };
  /** Drag/tap the front card to shuffle. */
  dragToShuffle?: boolean;
  /** Render the prev/next buttons. */
  showControls?: boolean;
  /** Scene height in px (leaves room for the fan above the card). */
  height?: number;
  /** Card height in px. */
  cardHeight?: number;
  /** Controlled front-card index. */
  topIndex?: number;
  /** Uncontrolled initial front-card index. */
  defaultTopIndex?: number;
  /** Fires with the new front-card index. */
  onTopChange?: (index: number) => void;
  /** Accessible name for the deck group. */
  label?: string;
  /** Park the loop while scrolled offscreen or the tab is hidden. */
  pauseWhenHidden?: boolean;
  /** Force instant, motion-free reordering regardless of system preference. */
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
  settled(eps = 0.001): boolean {
    return Math.abs(this.v) < eps && Math.abs(this.target - this.x) < eps;
  }
}

interface CardState {
  /** Continuous slot position (0 = front). */
  p: Spring;
  /** Drag offset, front card only. */
  dx: Spring;
  /** +1 sending to the back, -1 returning to the front, 0 at rest. */
  arcDir: number;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
/** Past this many px of horizontal drag, the release commits a shuffle. */
const DRAG_COMMIT_PX = 90;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * CardStackDeck — a deck that handles like physical cards. Every card rides a
 * continuous slot spring (k=90, d=12); sending the front card retargets its slot
 * 0 → n-1, and the resulting progress drives the signature arc: a 210px side
 * swing, a 150px z-lift, and a full rotateY flip that shows the patterned back
 * at the apex before the card lands face-up behind the deck. The remaining cards
 * ripple one slot forward on the same constants. `preserve-3d` lets the browser
 * depth-sort, so there is no z-index management. Drag, tap, prev/next buttons and
 * arrow keys all drive the same state, and an aria-live region announces the new
 * front card. One rAF loop for the whole deck. Clean-room original.
 */
export function CardStackDeck({
  items,
  renderItem,
  cardBack,
  fan,
  arcWidth = 210,
  lift = 150,
  spring,
  dragToShuffle = true,
  showControls = true,
  height = 300,
  cardHeight = 210,
  topIndex,
  defaultTopIndex = 0,
  onTopChange,
  label = "Card deck",
  pauseWhenHidden = true,
  reducedMotion,
  className,
  style,
  ...props
}: CardStackDeckProps) {
  const n = items.length;
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const deckRef = React.useRef<HTMLDivElement | null>(null);
  const cardEls = React.useRef<Array<HTMLDivElement | null>>([]);
  const dimEls = React.useRef<Array<HTMLDivElement | null>>([]);

  const systemReduced = useReducedMotion();
  // Resolved after mount so SSR and first client render agree on data-motion.
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const staticMode = reducedMotion === true || (hydrated && systemReduced);
  const onScreen = useVisibilityPause(rootRef, { threshold: 0.05 });
  const paused = pauseWhenHidden && !onScreen;
  const animate = !staticMode && !paused && n > 0;

  const [top, setTop] = useControllableState<number>({
    value: topIndex,
    defaultValue: defaultTopIndex,
    onChange: onTopChange,
  });
  const safeTop = n > 0 ? ((top % n) + n) % n : 0;

  const fanY = fan?.y ?? 18;
  const fanZ = fan?.z ?? 62;
  const fanR = fan?.rotate ?? 2.2;
  const stiffness = spring?.stiffness ?? 90;
  const damping = spring?.damping ?? 12;

  const statesRef = React.useRef<CardState[]>([]);
  const busyRef = React.useRef(false);
  const prevTopRef = React.useRef(safeTop);
  const liveRef = React.useRef({ n, fanY, fanZ, fanR, arcWidth, lift, staticMode });
  liveRef.current = { n, fanY, fanZ, fanR, arcWidth, lift, staticMode };

  // (Re)build spring state whenever the deck size changes — slot 0 is `safeTop`.
  if (statesRef.current.length !== n) {
    statesRef.current = Array.from({ length: n }, (_, i) => ({
      p: new Spring(n > 0 ? ((i - safeTop) % n + n) % n : 0, stiffness, damping),
      dx: new Spring(0, 200, 16),
      arcDir: 0,
    }));
    prevTopRef.current = safeTop;
    busyRef.current = false;
  }

  React.useEffect(() => {
    statesRef.current.forEach((s) => {
      s.p.k = stiffness;
      s.p.d = damping;
    });
  }, [stiffness, damping]);

  const paintCard = React.useCallback((i: number, t: number) => {
    const s = statesRef.current[i];
    const el = cardEls.current[i];
    if (!s || !el) return;
    const { n: count, fanY: fy, fanZ: fz, fanR: fr, arcWidth: aw, lift: lf } = liveRef.current;
    const span = Math.max(1, count - 1);
    const p = s.p.x;
    const q = clamp(p / span, 0, 1);
    const arc = Math.sin(q * Math.PI) * s.arcDir;
    // The front card breathes so a resting deck never looks like a static image.
    const idle = p < 0.5 && t > 0 ? 1 - p * 2 : 0;
    const x = arc * aw + s.dx.x;
    const y = -p * fy + Math.sin(t * 1.2) * 2 * idle;
    const z = -p * fz + Math.abs(arc) * lf;
    const rz = p * fr + s.dx.x * 0.06 + Math.sin(t * 0.8) * 0.7 * idle;
    const ry = s.arcDir !== 0 ? q * 360 : 0;
    const sc = 1 - clamp(p, 0, span) * 0.05;
    el.style.transform =
      `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px)` +
      ` rotateZ(${rz.toFixed(3)}deg) rotateY(${ry.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
    const dim = dimEls.current[i];
    if (dim) dim.style.opacity = Math.min(0.6, Math.max(0, p) * 0.14).toFixed(3);
  }, []);

  const layoutStatic = React.useCallback(
    (front: number) => {
      const count = liveRef.current.n;
      statesRef.current.forEach((s, i) => {
        const slot = count > 0 ? ((i - front) % count + count) % count : 0;
        s.p.x = s.p.target = slot;
        s.p.v = 0;
        s.dx.x = s.dx.target = 0;
        s.dx.v = 0;
        s.arcDir = 0;
        paintCard(i, 0);
      });
      busyRef.current = false;
    },
    [paintCard],
  );

  // Retarget slot springs whenever the front card changes (from any source).
  React.useEffect(() => {
    const count = liveRef.current.n;
    if (count === 0) return;
    const prev = prevTopRef.current;
    prevTopRef.current = safeTop;
    if (liveRef.current.staticMode) {
      layoutStatic(safeTop);
      return;
    }
    const delta = ((safeTop - prev) % count + count) % count;
    statesRef.current.forEach((s, i) => {
      const slot = ((i - safeTop) % count + count) % count;
      // Only the wrapping card arcs; a multi-step jump just retargets everyone.
      if (delta === 1 && i === prev) s.arcDir = 1;
      else if (delta === count - 1 && i === safeTop) s.arcDir = -1;
      s.p.target = slot;
    });
    if (delta !== 0) busyRef.current = true;
  }, [safeTop, layoutStatic]);

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
      let allSettled = true;
      for (let i = 0; i < statesRef.current.length; i++) {
        const s = statesRef.current[i];
        s.p.step(dt);
        s.dx.step(dt);
        if (!s.p.settled(0.002) || !s.dx.settled(0.02)) allSettled = false;
        if (s.arcDir !== 0 && s.p.settled(0.01)) s.arcDir = 0;
        paintCard(i, t);
      }
      if (allSettled) busyRef.current = false;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animate, paintCard]);

  React.useEffect(() => {
    if (staticMode) layoutStatic(safeTop);
  }, [staticMode, safeTop, layoutStatic]);

  const shuffle = React.useCallback(
    (dir: number) => {
      const count = liveRef.current.n;
      if (count < 2) return;
      if (!liveRef.current.staticMode && busyRef.current) return;
      setTop(((safeTop + (dir > 0 ? 1 : -1)) % count + count) % count);
    },
    [safeTop, setTop],
  );

  /* ---- drag on the front card ---- */
  const dragRef = React.useRef<{ id: number; x0: number; moved: boolean } | null>(null);

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragToShuffle) return;
      const front = cardEls.current[safeTop];
      if (!front) return;
      if (!liveRef.current.staticMode && busyRef.current) return;
      const target = e.target;
      if (!(target instanceof Node) || !front.contains(target)) return;
      dragRef.current = { id: e.pointerId, x0: e.clientX, moved: false };
      if (front.setPointerCapture) front.setPointerCapture(e.pointerId);
    },
    [dragToShuffle, safeTop],
  );

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.id || liveRef.current.staticMode) return;
      const dx = e.clientX - drag.x0;
      if (Math.abs(dx) > 4) drag.moved = true;
      const s = statesRef.current[safeTop];
      if (!s) return;
      s.dx.x = dx;
      s.dx.target = dx;
      s.dx.v = 0;
    },
    [safeTop],
  );

  const endDrag = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0;
      const wasTap = !drag.moved;
      dragRef.current = null;
      const s = statesRef.current[safeTop];
      if (s) {
        s.dx.target = 0;
        if (liveRef.current.staticMode) s.dx.x = 0;
      }
      if (Math.abs(dx) > DRAG_COMMIT_PX) shuffle(dx > 0 ? 1 : -1);
      else if (wasTap) shuffle(1);
    },
    [safeTop, shuffle],
  );

  const cancelDrag = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.id) return;
      dragRef.current = null;
      const s = statesRef.current[safeTop];
      if (s) s.dx.target = 0;
    },
    [safeTop],
  );

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
        shuffle(1);
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        shuffle(-1);
        e.preventDefault();
      }
    },
    [shuffle],
  );

  const frontItem = items[safeTop];
  const frontLabel = frontItem ? frontItem.label ?? frontItem.id : "";

  const defaultBack = (
    <div
      className="absolute inset-0 rounded-[inherit]"
      style={{
        background:
          "repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-accent, #4f7cff) 14%, transparent) 0 2px, transparent 2px 12px)," +
          " linear-gradient(150deg, var(--color-surface-2, #192337), var(--color-surface, #111827))",
      }}
    />
  );

  return (
    <div ref={rootRef} className={cn("w-full", className)} style={style} {...props}>
      <div
        role="group"
        aria-roledescription="card deck"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        data-motion={staticMode ? "static" : "animated"}
        data-paused={paused ? "true" : "false"}
        className="relative w-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent,#4f7cff)] focus-visible:ring-offset-8 focus-visible:ring-offset-transparent"
        style={{ perspective: "1300px" }}
      >
        <div
          ref={deckRef}
          className="relative w-full"
          style={{ height: `${height}px`, transformStyle: "preserve-3d", touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={cancelDrag}
        >
          {items.map((item, i) => {
            const slot = n > 0 ? ((i - safeTop) % n + n) % n : 0;
            const isFront = slot === 0;
            return (
              <div
                key={item.id}
                ref={(el) => {
                  cardEls.current[i] = el;
                }}
                aria-hidden={!isFront}
                data-card-slot={slot}
                className={cn(
                  "absolute inset-0 m-auto w-full rounded-[14px] will-change-transform",
                  dragToShuffle && isFront ? "cursor-grab active:cursor-grabbing" : null,
                )}
                style={{ height: `${cardHeight}px`, transformStyle: "preserve-3d" }}
              >
                <div
                  className="absolute inset-0 flex flex-col overflow-hidden rounded-[inherit] border border-[var(--color-border-strong,#354863)] bg-[var(--color-surface,#111827)]"
                  style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                >
                  {renderItem ? renderItem(item, { index: i, slot, isFront }) : item.content}
                </div>
                <div
                  aria-hidden="true"
                  className="absolute inset-0 overflow-hidden rounded-[inherit] border border-[var(--color-border-strong,#354863)]"
                  style={{
                    transform: "rotateY(180deg)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  {cardBack ?? defaultBack}
                </div>
                {/* Depth dim is an opacity overlay, never a filter — a filter
                    would flatten the preserve-3d context and kill the flip. */}
                <div
                  aria-hidden="true"
                  ref={(el) => {
                    dimEls.current[i] = el;
                  }}
                  className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[var(--color-bg,#080c14)] opacity-0"
                  style={{ transform: "translateZ(2px)" }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {showControls ? (
        <div className="mt-5 flex justify-center gap-2.5">
          <button
            type="button"
            onClick={() => shuffle(-1)}
            aria-label="Bring the previous card to the front"
            className="inline-flex min-h-[32px] items-center rounded-full border border-[var(--color-border,#263449)] bg-[var(--color-surface,#111827)] px-4 py-1.5 text-[12px] text-[var(--color-fg-secondary,#cbd5e1)] transition-colors hover:border-[var(--color-accent,#4f7cff)] hover:text-[var(--color-accent-text,#7f9fff)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent,#4f7cff)]"
          >
            <span aria-hidden="true">&#8592;&nbsp;</span>prev
          </button>
          <button
            type="button"
            onClick={() => shuffle(1)}
            aria-label="Send the front card to the back"
            className="inline-flex min-h-[32px] items-center rounded-full border border-[var(--color-border,#263449)] bg-[var(--color-surface,#111827)] px-4 py-1.5 text-[12px] text-[var(--color-fg-secondary,#cbd5e1)] transition-colors hover:border-[var(--color-accent,#4f7cff)] hover:text-[var(--color-accent-text,#7f9fff)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent,#4f7cff)]"
          >
            next<span aria-hidden="true">&nbsp;&#8594;</span>
          </button>
        </div>
      ) : null}

      <div aria-live="polite" className="sr-only">
        {frontLabel ? `Front card: ${frontLabel}, ${safeTop + 1} of ${n}` : ""}
      </div>
    </div>
  );
}

export default CardStackDeck;
