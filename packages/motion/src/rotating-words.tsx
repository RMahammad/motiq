"use client";
import * as React from "react";
import { cn } from "@scope/tokens/cn";
import { prefersReducedMotion } from "./prefers-reduced-motion";

export interface RotatingWordsProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  words: string[];
  /** ms between words. */
  interval?: number;
  /** Pause cycling on hover (default true). */
  pauseOnHover?: boolean;
  reducedMotion?: "respect" | "force" | "off";
}

/**
 * RotatingWords — cycles through a list of words with a fade. Announces the current word to
 * screen readers (`aria-live="polite"`). **Pauses on hover** and **stops entirely under reduced
 * motion** (shows the first word statically). ⚠️ For strict WCAG on auto-updating content, also
 * provide a visible pause control in your layout. docs/12.
 */
export const RotatingWords = React.forwardRef<HTMLSpanElement, RotatingWordsProps>(
  function RotatingWords(
    { words, interval = 2200, pauseOnHover = true, reducedMotion = "respect", className, ...rest },
    ref,
  ) {
    const [index, setIndex] = React.useState(0);
    const [paused, setPaused] = React.useState(false);
    const reduce =
      reducedMotion === "force" ||
      (reducedMotion === "respect" && prefersReducedMotion());

    React.useEffect(() => {
      if (reduce || paused || words.length <= 1) return;
      const id = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
      return () => clearInterval(id);
    }, [reduce, paused, words.length, interval]);

    const current = words[reduce ? 0 : index % Math.max(words.length, 1)] ?? words[0] ?? "";
    const pause = pauseOnHover ? { onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false) } : {};

    return (
      <span
        ref={ref}
        className={cn("scope-rotating-words", className)}
        aria-live="polite"
        {...pause}
        {...rest}
      >
        <span key={index} className="scope-rotating-words__word">
          {current}
        </span>
      </span>
    );
  },
);
