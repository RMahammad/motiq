"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export interface AnimatedListProps
  extends React.HTMLAttributes<HTMLUListElement> {
  /** Milliseconds of stagger applied to entering items, by DOM order. */
  stagger?: number;
}

/**
 * AnimatedList — a semantic `<ul>` whose `<li>` children fade/slide in with a
 * stagger and animate out cleanly when removed.
 *
 * Usage: pass keyed children (each `AnimatedListItem` needs a stable `key`) so
 * AnimatePresence can track add/remove. `layout` handles reordering.
 *
 * Accessibility: it stays a real list (`<ul>`/`<li>`), so list semantics and
 * keyboard focus are preserved; exit animation does not steal focus. Under
 * `prefers-reduced-motion` items appear/leave instantly. Clean-room original.
 */
export function AnimatedList({
  stagger = 60,
  className,
  children,
  ...props
}: AnimatedListProps) {
  // Provide the stagger to items via context so index-based delay works even
  // when consumers wrap items.
  return (
    <StaggerContext.Provider value={stagger}>
      <ul className={cn("flex flex-col gap-2", className)} {...props}>
        <AnimatePresence initial={false}>{children}</AnimatePresence>
      </ul>
    </StaggerContext.Provider>
  );
}

const StaggerContext = React.createContext<number>(60);

export interface AnimatedListItemProps
  extends React.LiHTMLAttributes<HTMLLIElement> {
  /** Position in the list, used to stagger the entrance. */
  index?: number;
}

export const AnimatedListItem = React.forwardRef<
  HTMLLIElement,
  AnimatedListItemProps
>(({ index = 0, className, children, ...props }, ref) => {
  const reduce = useReducedMotion();
  const stagger = React.useContext(StaggerContext);
  const delay = reduce ? 0 : (index * stagger) / 1000;

  return (
    <motion.li
      ref={ref}
      layout={reduce ? false : "position"}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: reduce ? 0 : 0.26, ease: [0.2, 0, 0, 1], delay }}
      className={cn(
        "rounded-xl border border-[var(--color-border,#e4e7ec)]",
        "bg-[var(--color-surface,#fff)] px-4 py-3 text-sm text-[var(--color-fg,#111318)]",
        "[will-change:transform,opacity]",
        className,
      )}
      {...(props as React.ComponentProps<typeof motion.li>)}
    >
      {children}
    </motion.li>
  );
});
AnimatedListItem.displayName = "AnimatedListItem";

export default AnimatedList;
