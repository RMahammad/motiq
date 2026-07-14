"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type TransitionKind = "slide" | "fade";

export interface RotatingTextProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Phrases to cycle through. */
  words: string[];
  /** Milliseconds each word is shown. Guarded to a 1200ms minimum. */
  interval?: number;
  /** Motion style between words. */
  transition?: TransitionKind;
}

/**
 * RotatingText — cycles through an array of words in place.
 *
 * Accessibility: an `aria-live="polite"` region announces only the current
 * word, so screen readers hear the change without the animated duplicates.
 * Cycling pauses on hover; the element is intentionally not focusable (no
 * role-less tab stop). Layout is stable (inline-grid stacks on one cell). Under
 * `prefers-reduced-motion` the text swaps with no transform. Clean-room
 * original.
 */
export function RotatingText({
  words,
  interval = 2200,
  transition = "slide",
  className,
  ...props
}: RotatingTextProps) {
  const reduce = useReducedMotion();
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  const safeWords = words.length > 0 ? words : [""];
  const delay = Math.max(1200, interval);

  React.useEffect(() => {
    if (paused || safeWords.length <= 1) return;
    const id = window.setTimeout(() => {
      setIndex((i) => (i + 1) % safeWords.length);
    }, delay);
    return () => window.clearTimeout(id);
  }, [index, paused, delay, safeWords.length]);

  // Keep the index valid if the words array shrinks.
  React.useEffect(() => {
    if (index >= safeWords.length) setIndex(0);
  }, [index, safeWords.length]);

  const current = safeWords[index] ?? "";
  const y = transition === "slide" ? "0.9em" : 0;

  return (
    <span
      className={cn("relative inline-grid align-bottom", className)}
      // Pause on hover so readers can keep up. We deliberately do NOT make this a
      // focusable element — a role-less tabbable span is an a11y smell (WCAG
      // 4.1.2); keyboard users are served by the polite live region + reduced-motion.
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      {...props}
    >
      {/* Polite live region: announces the current word only. */}
      <span aria-live="polite" className="sr-only">
        {current}
      </span>

      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={index}
          aria-hidden="true"
          // All words share cell [1/1/1/1] so width follows the widest via grid.
          className="col-start-1 row-start-1 inline-block whitespace-nowrap [will-change:transform,opacity]"
          initial={reduce ? false : { opacity: 0, y }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: `-${y}` }}
          transition={{ duration: reduce ? 0 : 0.32, ease: [0.2, 0, 0, 1] }}
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default RotatingText;
