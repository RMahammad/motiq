"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/** What starts the first decrypt run. Hover re-triggering is separate. */
export type DecryptTextTrigger = "mount" | "inview" | "hover";

/** `display` = headline scale; `terminal` = mono CLI card with prompt + caret. */
export type DecryptTextVariant = "display" | "terminal";

export interface DecryptTextProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** The real string. Rendered readable on the server and to screen readers. */
  text: string;
  /** Scramble pool each unresolved character cycles through. */
  glyphs?: string;
  /** Glyph cycle floor in ms (each char jitters between `speed` and `speed + 35`). */
  speed?: number;
  /** Per-character lock-in stagger in ms. */
  stagger?: number;
  /** Delay before the first character can lock, in ms. */
  startDelay?: number;
  /** Random spread applied to every character's lock time, in ms (± this value). */
  jitter?: number;
  /** What starts the first run. */
  trigger?: DecryptTextTrigger;
  /** Visual treatment. */
  variant?: DecryptTextVariant;
  /** Re-run automatically this many ms after settling; `false` runs once. */
  loop?: number | false;
  /** Re-scramble on pointer enter (1.5s cooldown). */
  retriggerOnHover?: boolean;
  /** Deterministic seed for the per-character jitter (SSR-stable). */
  seed?: number;
  /** Element tag for the rendered text. */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  /** Force the static, resolved variant regardless of system preference. */
  reducedMotion?: boolean;
  /** Fires each time the line finishes resolving. */
  onDecrypted?: () => void;
}

interface CharItem {
  /** Index into the flat character list — drives the stagger ramp. */
  i: number;
  ch: string;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const POOL_DISPLAY = "#%&@$?!*+=/{}[]<>~^";
const POOL_TERMINAL = "abcdef0123456789$#%&*+=/|_~";
/** Cooldown before a hover can restart a run (ms). */
const HOVER_COOLDOWN = 1500;
/** Extra ms added to `speed` for the per-char cycle jitter ceiling. */
const CYCLE_SPREAD = 35;
/** Accent flash duration on lock-in (ms) — matches the prototype. */
const FLASH_MS = 420;

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

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * DecryptText — copy that arrives decoded rather than typed.
 *
 * Every glyph is already boiling at t=0; character *i* locks at
 * `startDelay + i·stagger ± jitter`, so the line resolves in a ragged
 * left-to-right sweep instead of a metronome. Lock-in snaps the real glyph in
 * behind a 420ms accent flash with a decaying glow.
 *
 * Server markup and reduced motion render the REAL string (progressive
 * enhancement — the scramble only ever exists after mount). The animated glyph
 * layer is `aria-hidden`; the readable string lives in a visually-hidden
 * sibling, so assistive tech never hears the scramble. One rAF loop per
 * instance writes `textContent` + a state attribute only — zero layout writes.
 * Clean-room original.
 */
export function DecryptText({
  text,
  glyphs,
  speed = 45,
  stagger = 55,
  startDelay = 350,
  jitter = 120,
  trigger = "inview",
  variant = "display",
  loop = 7000,
  retriggerOnHover = true,
  seed = 1,
  as: Tag = "p",
  reducedMotion,
  onDecrypted,
  className,
  ...rest
}: DecryptTextProps) {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const charRefs = React.useRef<Array<HTMLSpanElement | null>>([]);
  const rafRef = React.useRef<number | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStartRef = React.useRef(-Infinity);
  const playedRef = React.useRef(false);
  const runRef = React.useRef(0);
  const onDecryptedRef = React.useRef(onDecrypted);
  onDecryptedRef.current = onDecrypted;

  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const scope = `mk-dt-${uid}`;

  const systemReduced = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  // System preference is resolved post-mount only, so the SSR-rendered
  // attribute can never disagree with the first client render.
  // Behaviour reads the live preference immediately (effects are client-only);
  // the RENDERED attribute waits for mount so SSR markup can never disagree.
  const reduceNow = reducedMotion ?? systemReduced;
  const reduce = reducedMotion ?? (mounted ? systemReduced : false);

  const visible = useVisibilityPause(rootRef, { threshold: 0.12 });

  const pool = glyphs && glyphs.length > 0 ? glyphs : variant === "terminal" ? POOL_TERMINAL : POOL_DISPLAY;

  // Words keep their glyphs together so the line wraps on word boundaries.
  const words = React.useMemo(() => {
    const out: CharItem[][] = [];
    let i = 0;
    for (const word of text.split(" ")) {
      const item: CharItem[] = [];
      for (const ch of Array.from(word)) {
        item.push({ i, ch });
        i += 1;
      }
      out.push(item);
    }
    return out;
  }, [text]);

  const total = React.useMemo(() => words.reduce((n, w) => n + w.length, 0), [words]);

  const stop = React.useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const resolveAll = React.useCallback(() => {
    for (const el of charRefs.current) {
      if (!el) continue;
      el.textContent = el.dataset.mkChar ?? el.textContent;
      el.dataset.state = "plain";
    }
  }, []);

  const play = React.useCallback(() => {
    const rng = makeRng(seed + runRef.current * 7919);
    runRef.current += 1;
    stop();

    const cells = charRefs.current.filter((el): el is HTMLSpanElement => el !== null);
    if (cells.length === 0) return;

    lastStartRef.current = performance.now();
    playedRef.current = true;

    const lockAt = new Float64Array(cells.length);
    const nextAt = new Float64Array(cells.length);
    const locked = new Uint8Array(cells.length);
    cells.forEach((el, idx) => {
      lockAt[idx] = startDelay + idx * stagger + (rng() * 2 - 1) * jitter;
      nextAt[idx] = 0;
      el.dataset.state = "scramble";
      el.textContent = pool.charAt((rng() * pool.length) | 0);
    });

    let remaining = cells.length;
    const t0 = performance.now();

    const frame = () => {
      const now = performance.now() - t0;
      for (let idx = 0; idx < cells.length; idx += 1) {
        if (locked[idx]) continue;
        const el = cells[idx];
        if (now >= (lockAt[idx] ?? 0)) {
          el.textContent = el.dataset.mkChar ?? "";
          el.dataset.state = "lock";
          locked[idx] = 1;
          remaining -= 1;
        } else if (now >= (nextAt[idx] ?? 0)) {
          el.textContent = pool.charAt((rng() * pool.length) | 0);
          nextAt[idx] = now + speed + rng() * CYCLE_SPREAD;
        }
      }
      if (remaining <= 0) {
        rafRef.current = null;
        onDecryptedRef.current?.();
        if (loop !== false && loop > 0) {
          timerRef.current = setTimeout(() => {
            timerRef.current = null;
            play();
          }, loop);
        }
        return;
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  }, [jitter, loop, pool, seed, speed, stagger, startDelay, stop]);

  // Orchestration: reduced motion resolves and parks; otherwise the first run is
  // gated on the trigger and every run is parked while offscreen. Layout effect
  // so the first scrambled frame is written before the browser paints.
  React.useLayoutEffect(() => {
    if (reduceNow) {
      stop();
      resolveAll();
      return;
    }
    if (!visible) {
      stop();
      return;
    }
    if (trigger === "hover") {
      if (!playedRef.current) resolveAll();
      return;
    }
    if (!playedRef.current) {
      play();
      return;
    }
    // Coming back on screen after a completed run: re-arm the loop, don't restart.
    if (loop !== false && loop > 0 && rafRef.current == null && timerRef.current == null) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        play();
      }, Math.min(loop, 3000));
    }
  }, [loop, play, reduceNow, resolveAll, stop, trigger, visible]);

  React.useEffect(() => stop, [stop]);

  const onPointerEnter = React.useCallback(() => {
    if (reduceNow || !retriggerOnHover) return;
    if (rafRef.current != null) return;
    if (performance.now() - lastStartRef.current < HOVER_COOLDOWN) return;
    play();
  }, [play, reduceNow, retriggerOnHover]);

  const terminal = variant === "terminal";
  const scrambleColor = terminal
    ? "color-mix(in oklab, var(--color-muted, #9caabd) 80%, var(--color-secondary-accent, #22c7d9))"
    : "var(--color-muted, #9caabd)";
  const lockedColor = terminal
    ? "color-mix(in oklab, var(--color-fg, #f8fafc) 84%, var(--color-muted, #9caabd))"
    : "var(--color-fg, #f8fafc)";

  const css = `
.${scope} [data-mk-char]{color:${lockedColor};}
.${scope} [data-mk-char][data-state="scramble"]{color:${scrambleColor};}
.${scope} [data-mk-char][data-state="lock"]{color:${lockedColor};animation:${scope}-flash ${FLASH_MS}ms cubic-bezier(.2,0,0,1);}
@keyframes ${scope}-flash{0%{color:var(--color-accent-text, #7f9fff);text-shadow:0 0 24px color-mix(in oklab, var(--color-accent, #4f7cff) 70%, transparent);}100%{text-shadow:0 0 0 transparent;}}
.${scope} [data-mk-caret]{animation:${scope}-caret 1.1s steps(1) infinite;}
@keyframes ${scope}-caret{50%{opacity:0;}}
@media (prefers-reduced-motion: reduce){.${scope} [data-mk-char][data-state="lock"],.${scope} [data-mk-caret]{animation:none;}}
`;

  let cursor = -1;
  const glyphLayer = (
    <span aria-hidden="true" className="select-none">
      {words.map((word, w) => (
        <React.Fragment key={w}>
          <span className="inline-block whitespace-pre">
            {word.map((item) => {
              cursor += 1;
              const at = cursor;
              return (
                <span
                  key={item.i}
                  data-mk-char={item.ch}
                  data-state="plain"
                  ref={(el) => {
                    charRefs.current[at] = el;
                  }}
                >
                  {item.ch}
                </span>
              );
            })}
          </span>
          {w < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </span>
  );

  return (
    <Tag
      ref={rootRef as React.Ref<never>}
      data-motion={reduce ? "static" : "animated"}
      data-variant={variant}
      data-chars={total}
      onPointerEnter={onPointerEnter}
      className={cn(
        "w-full",
        terminal
          ? "block font-mono text-[clamp(0.78rem,2.4vw,1rem)] leading-relaxed"
          : "block text-balance text-[clamp(1.6rem,5.2vw,3.3rem)] font-extrabold leading-[1.15] tracking-[-0.02em]",
        className,
      )}
      {...rest}
    >
      <style>{css}</style>
      <span className="sr-only">{text}</span>
      {terminal ? (
        <span
          className={cn(
            scope,
            "inline-flex max-w-full flex-wrap items-baseline gap-x-1 rounded-[10px] border px-4 py-3 align-middle",
          )}
          style={{
            borderColor: "var(--color-border, #263449)",
            background: "color-mix(in oklab, var(--color-surface, #111827) 88%, transparent)",
            boxShadow: "var(--shadow-md, 0 12px 32px rgba(0,3,10,.5))",
          }}
        >
          <span aria-hidden="true" style={{ color: "var(--color-success, #32d583)" }}>
            $
          </span>
          {glyphLayer}
          <span
            aria-hidden="true"
            data-mk-caret=""
            className="inline-block h-[1.05em] w-[0.55em] align-text-bottom"
            style={{ background: "var(--color-success, #32d583)" }}
          />
        </span>
      ) : (
        <span className={cn(scope, "block")}>{glyphLayer}</span>
      )}
    </Tag>
  );
}

DecryptText.displayName = "DecryptText";

export default DecryptText;
