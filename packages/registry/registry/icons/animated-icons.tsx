"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type TriggerOn = "hover" | "tap" | "focus" | "mount" | "none";

interface BaseIconProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Icon size in px (width & height). */
  size?: number;
  /** What kicks off the animation. */
  triggerOn?: TriggerOn;
}

/**
 * Shared decorative-icon wrapper. Icons are `aria-hidden` and never focusable —
 * they inherit their meaning from the containing button/link. The wrapper is a
 * plain `<span>` so it does not disturb focus order.
 */
function useTrigger(triggerOn: TriggerOn) {
  const [active, setActive] = React.useState(triggerOn === "mount");

  React.useEffect(() => {
    if (triggerOn === "mount") setActive(true);
  }, [triggerOn]);

  const handlers: React.HTMLAttributes<HTMLSpanElement> = {};
  if (triggerOn === "hover") {
    handlers.onPointerEnter = () => setActive(true);
    handlers.onPointerLeave = () => setActive(false);
  } else if (triggerOn === "tap") {
    handlers.onPointerDown = () => setActive((a) => !a);
  } else if (triggerOn === "focus") {
    // The parent button owns focus; mirror its focus via focus-within on span.
    handlers.onFocusCapture = () => setActive(true);
    handlers.onBlurCapture = () => setActive(false);
  }

  return { active, handlers };
}

const EASE = [0.2, 0, 0, 1] as const;

/**
 * AnimatedArrow — a right-pointing arrow that nudges on trigger.
 *
 * Accessibility: decorative only (`aria-hidden`, `focusable="false"`, not
 * tabbable); a labelled parent control conveys meaning. Under
 * `prefers-reduced-motion` it renders static. Clean-room original.
 */
export const AnimatedArrow = React.forwardRef<HTMLSpanElement, BaseIconProps>(
  ({ size = 18, triggerOn = "hover", className, ...props }, ref) => {
    const reduce = useReducedMotion();
    const { active, handlers } = useTrigger(triggerOn);
    const nudge = reduce ? 0 : active && triggerOn !== "none" ? 3 : 0;

    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={cn("inline-flex", className)}
        {...handlers}
        {...props}
      >
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          focusable="false"
          aria-hidden="true"
        >
          {/* Whole arrow nudges right via a compositor-only translateX. */}
          <motion.g
            animate={{ x: nudge }}
            transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
          >
            <line x1="4" y1="12" x2="18" y2="12" />
            <polyline points="12 6 18 12 12 18" />
          </motion.g>
        </svg>
      </span>
    );
  },
);
AnimatedArrow.displayName = "AnimatedArrow";

export interface AnimatedCopyProps extends BaseIconProps {
  /** Controlled: show the check instead of the copy glyph. */
  copied?: boolean;
}

/**
 * AnimatedCopy — a copy glyph that swaps to a check with a brief scale.
 *
 * Accessibility: decorative only (`aria-hidden`, `focusable="false"`, not
 * tabbable); the parent button provides the label and live feedback. Can be
 * driven by a controlled `copied` prop. Under `prefers-reduced-motion` the swap
 * is instant. Clean-room original.
 */
export const AnimatedCopy = React.forwardRef<HTMLSpanElement, AnimatedCopyProps>(
  ({ size = 18, triggerOn = "hover", copied, className, ...props }, ref) => {
    const reduce = useReducedMotion();
    const { active, handlers } = useTrigger(triggerOn);
    // Controlled `copied` wins; otherwise a tap-trigger toggles the check.
    const showCheck = copied ?? (triggerOn === "tap" && active);

    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={cn("relative inline-flex", className)}
        style={{ width: size, height: size }}
        {...(copied === undefined ? handlers : {})}
        {...props}
      >
        <AnimatePresence initial={false} mode="wait">
          {showCheck ? (
            <motion.svg
              key="check"
              viewBox="0 0 24 24"
              width={size}
              height={size}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              focusable="false"
              aria-hidden="true"
              className="absolute inset-0"
              initial={reduce ? false : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
              transition={{ duration: reduce ? 0 : 0.18, ease: EASE }}
            >
              <path d="m5 12 5 5L20 7" />
            </motion.svg>
          ) : (
            <motion.svg
              key="copy"
              viewBox="0 0 24 24"
              width={size}
              height={size}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              focusable="false"
              aria-hidden="true"
              className="absolute inset-0"
              initial={reduce ? false : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
              transition={{ duration: reduce ? 0 : 0.18, ease: EASE }}
            >
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </motion.svg>
          )}
        </AnimatePresence>
      </span>
    );
  },
);
AnimatedCopy.displayName = "AnimatedCopy";
