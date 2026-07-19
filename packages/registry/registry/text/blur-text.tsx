"use client";

import * as React from "react";
import { motion, useReducedMotion, type Transition } from "motion/react";

import { cn } from "@/lib/utils";

type AnimateBy = "words" | "chars";
type Direction = "top" | "bottom";

export interface BlurTextProps {
  /** The text to reveal. */
  text: string;
  className?: string;
  /** Milliseconds of stagger between each segment. */
  delay?: number;
  /** Reveal word-by-word or character-by-character. */
  animateBy?: AnimateBy;
  /** Which side each segment drifts in from. */
  direction?: Direction;
  /** Animate only the first time it enters the viewport. */
  once?: boolean;
  /** Element tag to render (e.g. "h1", "p"). */
  as?: React.ElementType;
}

const EASE: Transition["ease"] = [0.2, 0, 0, 1];

/**
 * BlurText — reveals text segment-by-segment with a de-blur + drift.
 *
 * Accessibility: the full string is exposed once via `aria-label`; the animated
 * segments are `aria-hidden`. Under `prefers-reduced-motion` the text renders in
 * its final state with no animation. Clean-room original.
 */
export function BlurText({
  text,
  className,
  delay = 60,
  animateBy = "words",
  direction = "top",
  once = true,
  as: Tag = "span",
}: BlurTextProps) {
  const reduce = useReducedMotion();
  const segments = React.useMemo(
    () => (animateBy === "words" ? text.split(" ") : Array.from(text)),
    [text, animateBy],
  );
  const y = direction === "top" ? -14 : 14;

  return (
    <Tag className={cn("inline-flex flex-wrap", className)} aria-label={text}>
      {segments.map((seg, i) => (
        <motion.span
          key={`${seg}-${i}`}
          aria-hidden="true"
          className="inline-block whitespace-pre [will-change:transform,filter]"
          initial={reduce ? false : { opacity: 0, y, filter: "blur(8px)" }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once, margin: "-10% 0px" }}
          transition={{ duration: 0.5, ease: EASE, delay: (i * delay) / 1000 }}
        >
          {seg}
          {animateBy === "words" && i < segments.length - 1 ? " " : null}
        </motion.span>
      ))}
    </Tag>
  );
}

export default BlurText;
