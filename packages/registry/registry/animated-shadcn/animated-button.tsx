"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";

import { cn } from "@/lib/utils";

type Variant = "solid" | "outline" | "ghost";

const VARIANT_CLASS: Record<Variant, string> = {
  // A transparent border keeps sizing identical across variants and, under
  // forced-colors (Windows High Contrast), the UA renders it as `ButtonText`,
  // giving the solid/ghost variants a visible boundary they'd otherwise lose.
  solid:
    "border border-transparent bg-[var(--color-accent,#695cff)] text-white hover:bg-[var(--color-accent,#695cff)]/90",
  outline:
    "border border-[var(--color-border,#e4e7ec)] bg-[var(--color-surface,#fff)] text-[var(--color-fg,#111318)] hover:bg-[var(--color-fg,#111318)]/[0.04]",
  ghost:
    "border border-transparent bg-transparent text-[var(--color-fg,#111318)] hover:bg-[var(--color-fg,#111318)]/[0.06]",
};

export interface AnimatedButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  /** Show an accessible spinner and disable interaction. */
  loading?: boolean;
  /** Briefly show a success check in place of the label. */
  success?: boolean;
}

/**
 * AnimatedButton — a real `<button>` with press feedback and loading/success
 * states.
 *
 * Accessibility: forwards its ref and spreads native button props, so type,
 * form, and disabled semantics are intact. `loading` sets `aria-busy` and
 * exposes a polite "Loading" status; the spinner + check SVGs are decorative
 * (`aria-hidden`). Focus-visible shows a 2px outline (survives forced-colors);
 * every variant keeps a boundary in high-contrast. Under `prefers-reduced-motion`
 * the press-scale is disabled. Clean-room original.
 */
export const AnimatedButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedButtonProps
>(
  (
    {
      variant = "solid",
      loading = false,
      success = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const reduce = useReducedMotion();
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-busy={loading || undefined}
        whileTap={reduce || isDisabled ? undefined : { scale: 0.96 }}
        transition={{ type: "spring", stiffness: 600, damping: 30 }}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium",
          "transition-colors [will-change:transform]",
          // Outline-based focus (not a box-shadow ring) so the focus indicator
          // survives forced-colors, where the UA forces the outline to `Highlight`.
          "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-style:solid] focus-visible:[outline-color:var(--color-accent,#695cff)]",
          "disabled:pointer-events-none disabled:opacity-60",
          VARIANT_CLASS[variant],
          className,
        )}
        {...props}
      >
        {/* Live region announces the busy state to assistive tech. */}
        {loading ? (
          <span className="sr-only" role="status" aria-live="polite">
            Loading
          </span>
        ) : null}

        <AnimatePresence initial={false} mode="wait">
          {loading ? (
            <motion.span
              key="spinner"
              aria-hidden="true"
              className="inline-flex"
              initial={reduce ? false : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
              transition={{ duration: reduce ? 0 : 0.15 }}
            >
              <svg
                viewBox="0 0 24 24"
                width={16}
                height={16}
                fill="none"
                className={reduce ? undefined : "animate-spin"}
                aria-hidden="true"
                focusable="false"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  strokeWidth="2.5"
                />
                <path
                  d="M21 12a9 9 0 0 0-9-9"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </motion.span>
          ) : success ? (
            <motion.span
              key="success"
              aria-hidden="true"
              className="inline-flex"
              initial={reduce ? false : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
              transition={{ duration: reduce ? 0 : 0.18 }}
            >
              <svg
                viewBox="0 0 24 24"
                width={16}
                height={16}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="m5 12 5 5L20 7" />
              </svg>
            </motion.span>
          ) : (
            <motion.span
              key="label"
              className="inline-flex items-center gap-2"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.15 }}
            >
              {children}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  },
);
AnimatedButton.displayName = "AnimatedButton";

export default AnimatedButton;
