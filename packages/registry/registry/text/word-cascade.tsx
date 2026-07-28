"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface WordCascadeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The passage. Plain text, or headings/paragraphs containing plain text. */
  children: React.ReactNode;
  /** ms of delay added per visual line. */
  lineStagger?: number;
  /** ms of delay added per word within a line. */
  wordStagger?: number;
  /** Spring stiffness (k). */
  stiffness?: number;
  /** Spring damping (c). Below ~2·sqrt(k) the words overshoot. */
  damping?: number;
  /** Where each word falls from, in px. Negative drops it in from above. */
  fromY?: number;
  /** Entry blur in px. */
  blur?: number;
  /** Max random rotation per word, in degrees (± this value). */
  rotate?: number;
  /** Re-run the cascade every time the block re-enters the viewport. */
  replayOnReenter?: boolean;
  /** Change this value to replay — any stable token (a counter, a step id). */
  replayToken?: string | number;
  /** Deterministic seed for the per-word rotation (SSR-stable). */
  seed?: number;
  /** Force the static variant: words render in place, no cascade. */
  reducedMotion?: boolean;
  /** Fires once each time the whole passage has settled. */
  onSettled?: () => void;
}

interface WordState {
  el: HTMLElement;
  delay: number;
  /** Spring progress 0 → 1 and its velocity. */
  s: number;
  v: number;
  rot: number;
  done: boolean;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

/** Words within this many px of each other count as the same visual line. */
const LINE_EPSILON = 3;
/** Settle thresholds — position and velocity must both be quiet. */
const SETTLE_S = 0.002;
const SETTLE_V = 0.05;
/** Opacity reaches full at 40% of the spring; blur clears just before rest. */
const OPACITY_GAIN = 2.4;
const BLUR_END = 0.9;

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

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Wrap every word of the passage in a span, preserving element structure. */
function wrapWords(node: React.ReactNode, key: { n: number }): React.ReactNode {
  if (node === null || node === undefined || typeof node === "boolean") return null;
  if (typeof node === "string" || typeof node === "number") {
    const words = String(node).replace(/\s+/g, " ").split(" ").filter(Boolean);
    return words.map((word) => {
      key.n += 1;
      return (
        <React.Fragment key={`w${key.n}`}>
          <span data-mk-word="" className="inline-block">
            {word}
          </span>{" "}
        </React.Fragment>
      );
    });
  }
  if (Array.isArray(node)) return node.map((child, i) => <React.Fragment key={`a${i}`}>{wrapWords(child, key)}</React.Fragment>);
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    if (node.type === React.Fragment) return wrapWords(props.children, key);
    if (typeof node.type === "string") {
      return React.cloneElement(node, undefined, wrapWords(props.children, key));
    }
  }
  // Custom components are rendered as-is (still inside the aria-hidden layer).
  return node;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * WordCascade — hero copy that arrives cast rather than printed.
 *
 * Words are measured into their real visual lines after layout, then each one
 * runs its own underdamped spring (`k=180, c=16`, dt-integrated) on a progress
 * value: `y = −44px·(1−s)` so the word falls past rest and bounces back (~6%
 * overshoot), with a random ±7° rotation, an 8px→0 blur and opacity keyed to
 * the first 40%. Delay is `line·150 + wordInLine·40ms`, so the passage reads as
 * directed waves rather than one fade.
 *
 * The animated copy is `aria-hidden`; the full passage lives in a
 * visually-hidden block, so reading order and native heading semantics stay
 * intact. Reduced motion renders the words in place instantly and replay is
 * inert. One rAF loop writes transform/opacity/filter only, blur is dropped the
 * moment a word settles, `will-change` is cleared after, and line measurement
 * happens once per play — never per frame. Clean-room original.
 */
export function WordCascade({
  children,
  lineStagger = 150,
  wordStagger = 40,
  stiffness = 180,
  damping = 16,
  fromY = -44,
  blur = 8,
  rotate = 7,
  replayOnReenter = true,
  replayToken,
  seed = 1,
  reducedMotion,
  onSettled,
  className,
  ...rest
}: WordCascadeProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const layerRef = React.useRef<HTMLDivElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const playedRef = React.useRef(false);
  const runRef = React.useRef(0);
  const onSettledRef = React.useRef(onSettled);
  onSettledRef.current = onSettled;

  const systemReduced = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  // Behaviour reads the live preference immediately (effects are client-only);
  // the RENDERED attribute waits for mount so SSR markup can never disagree.
  const reduceNow = reducedMotion ?? systemReduced;
  const reduce = reducedMotion ?? (mounted ? systemReduced : false);

  // 40% visible is the trigger point; leaving the viewport re-arms the cascade.
  const visible = useVisibilityPause(rootRef, { threshold: 0.4 });

  const wrapped = React.useMemo(() => wrapWords(children, { n: 0 }), [children]);

  const wordEls = React.useCallback(
    () => Array.from(layerRef.current?.querySelectorAll<HTMLElement>("[data-mk-word]") ?? []),
    [],
  );

  const clearStyles = React.useCallback((el: HTMLElement) => {
    el.style.transform = "";
    el.style.opacity = "";
    el.style.filter = "";
    el.style.willChange = "";
  }, []);

  const showAll = React.useCallback(() => {
    for (const el of wordEls()) clearStyles(el);
  }, [clearStyles, wordEls]);

  const stop = React.useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  /** Reset styles, measure real visual lines, then park every word off-rest. */
  const prepare = React.useCallback((): WordState[] => {
    const els = wordEls();
    for (const el of els) clearStyles(el);

    // One read pass AFTER the reset writes — never interleaved.
    const tops: number[] = [];
    const lines: number[] = [];
    for (const el of els) {
      const top = el.offsetTop;
      let line = tops.findIndex((t) => Math.abs(t - top) < LINE_EPSILON);
      if (line < 0) {
        tops.push(top);
        line = tops.length - 1;
      }
      lines.push(line);
    }

    const rng = makeRng(seed + runRef.current * 7919);
    runRef.current += 1;
    const perLine = new Map<number, number>();
    return els.map((el, i) => {
      const line = lines[i] ?? 0;
      const nth = (perLine.get(line) ?? 0) + 1;
      perLine.set(line, nth);
      const rot = (rng() * 2 - 1) * rotate;
      el.style.willChange = "transform, opacity, filter";
      el.style.opacity = "0";
      el.style.transform = `translateY(${fromY}px) rotate(${rot.toFixed(1)}deg)`;
      el.style.filter = `blur(${blur}px)`;
      return {
        el,
        delay: (line * lineStagger + (nth - 1) * wordStagger) / 1000,
        s: 0,
        v: 0,
        rot,
        done: false,
      };
    });
  }, [blur, clearStyles, fromY, lineStagger, rotate, seed, wordEls, wordStagger]);

  const play = React.useCallback(() => {
    stop();
    if (reduceNow) {
      showAll();
      return;
    }
    const words = prepare();
    if (words.length === 0) return;
    playedRef.current = true;

    let last = performance.now();
    let time = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      time += dt;
      let allDone = true;

      for (const w of words) {
        if (w.done) continue;
        if (time < w.delay) {
          allDone = false;
          continue;
        }
        // Underdamped spring on progress: overshoots rest, then eases back.
        w.v += (stiffness * (1 - w.s) - damping * w.v) * dt;
        w.s += w.v * dt;
        if (Math.abs(1 - w.s) < SETTLE_S && Math.abs(w.v) < SETTLE_V) {
          w.done = true;
          clearStyles(w.el);
          continue;
        }
        allDone = false;
        const sc = clamp01(w.s);
        const y = fromY * (1 - w.s);
        const rot = w.rot * (1 - sc);
        const b = Math.max(0, blur * (1 - sc / BLUR_END));
        w.el.style.transform = `translateY(${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg)`;
        w.el.style.filter = b > 0.15 ? `blur(${b.toFixed(1)}px)` : "";
        w.el.style.opacity = Math.min(1, sc * OPACITY_GAIN).toFixed(3);
      }

      if (allDone) {
        rafRef.current = null;
        onSettledRef.current?.();
        return;
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  }, [blur, clearStyles, damping, fromY, prepare, reduceNow, showAll, stiffness, stop]);

  // Trigger + re-arm. Leaving the viewport stops the loop; coming back replays
  // when `replayOnReenter`, otherwise the passage stays settled. Layout effect
  // so the parked state is written before the browser paints the words.
  React.useLayoutEffect(() => {
    if (reduceNow) {
      stop();
      showAll();
      return;
    }
    if (!visible) {
      stop();
      return;
    }
    if (!playedRef.current || replayOnReenter) play();
  }, [play, reduceNow, replayOnReenter, showAll, stop, visible]);

  // Explicit replay control — any change to the token re-runs the cascade.
  const firstToken = React.useRef(true);
  React.useEffect(() => {
    if (firstToken.current) {
      firstToken.current = false;
      return;
    }
    if (reduceNow) return;
    play();
  }, [play, reduceNow, replayToken]);

  React.useEffect(() => stop, [stop]);

  return (
    <div ref={rootRef} className={cn("w-full", className)} data-motion={reduce ? "static" : "animated"} {...rest}>
      {/* Accessible layer: the passage exactly once, semantics and order intact. */}
      <div className="sr-only">{children}</div>
      {/* Animated layer: decorative, hidden from AT. `relative` makes it the
          offsetParent, so every word's offsetTop shares one origin. */}
      <div ref={layerRef} aria-hidden="true" className="relative">
        {wrapped}
      </div>
    </div>
  );
}

WordCascade.displayName = "WordCascade";

export default WordCascade;
