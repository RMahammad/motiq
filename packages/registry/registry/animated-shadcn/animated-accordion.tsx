"use client";

import * as React from "react";
import { motion, useReducedMotion, type Transition } from "motion/react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";

import { cn } from "@/lib/utils";

const EASE: Transition["ease"] = [0.2, 0, 0, 1];

/**
 * AnimatedAccordion — Radix Accordion with Motion height/opacity reveal and a
 * rotating chevron.
 *
 * Accessibility: Radix owns the trigger button semantics, `aria-expanded`,
 * keyboard interaction, single/multiple modes, and disabled state — untouched.
 * The chevron is decorative (`aria-hidden`). Content animates on the
 * `data-state` attribute so it stays in the a11y tree throughout. Under
 * `prefers-reduced-motion` open/close is instant with no height animation.
 * Clean-room original.
 */
export const AnimatedAccordion = AccordionPrimitive.Root;

export const AnimatedAccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      "border-b border-[var(--color-border,#e4e7ec)] last:border-b-0",
      className,
    )}
    {...props}
  />
));
AnimatedAccordionItem.displayName = "AnimatedAccordionItem";

export interface AnimatedAccordionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {}

export const AnimatedAccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AnimatedAccordionTriggerProps
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "group flex flex-1 items-center justify-between gap-4 py-4 text-left text-sm font-medium",
        "text-[var(--color-fg,#111318)] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent,#695cff)]",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      {/* Decorative chevron; rotates via data-state, no motion component needed
          so it respects reduced-motion through CSS transitions we scope off. */}
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        width={18}
        height={18}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-[var(--color-fg,#111318)]/50 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AnimatedAccordionTrigger.displayName = "AnimatedAccordionTrigger";

export interface AnimatedAccordionContentProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> {}

/**
 * Mirror the `data-state` Radix stamps on the force-mounted content element so
 * Motion can drive the correct open/closed variant. A MutationObserver keeps
 * the value in sync without re-rendering Radix. Returns a callback ref.
 */
function useRadixOpenState(): [boolean, (node: HTMLElement | null) => void] {
  const [open, setOpen] = React.useState(false);
  const observerRef = React.useRef<MutationObserver | null>(null);

  const setRef = React.useCallback((node: HTMLElement | null) => {
    observerRef.current?.disconnect();
    if (!node) return;
    const read = () => setOpen(node.getAttribute("data-state") === "open");
    read();
    const observer = new MutationObserver(read);
    observer.observe(node, { attributes: true, attributeFilter: ["data-state"] });
    observerRef.current = observer;
  }, []);

  React.useEffect(() => () => observerRef.current?.disconnect(), []);

  return [open, setRef];
}

export const AnimatedAccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  AnimatedAccordionContentProps
>(({ className, children, ...props }, forwardedRef) => {
  const reduce = useReducedMotion();
  const [open, setStateRef] = useRadixOpenState();

  // Merge the forwarded ref with our internal state-tracking ref.
  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      setStateRef(node);
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef)
        (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node;
    },
    [setStateRef, forwardedRef],
  );

  return (
    // `forceMount` keeps the panel mounted so Motion can play both open and
    // close; Radix still stamps data-state, which we mirror to pick the variant.
    <AccordionPrimitive.Content forceMount asChild {...props}>
      <motion.div
        ref={setRef}
        // Animate the natural content height. `height: auto` measured by Motion
        // avoids reflow jank; opacity fades the body in tandem.
        initial={false}
        animate={
          reduce
            ? undefined
            : open
              ? { height: "auto", opacity: 1 }
              : { height: 0, opacity: 0 }
        }
        className={cn(
          "overflow-hidden text-sm text-[var(--color-fg,#111318)]/75",
          // Reduced motion: no height animation — collapse via display instead.
          reduce && "data-[state=closed]:hidden",
        )}
        transition={reduce ? { duration: 0 } : { duration: 0.26, ease: EASE }}
      >
        <div className="pb-4 pt-0">{children}</div>
      </motion.div>
    </AccordionPrimitive.Content>
  );
});
AnimatedAccordionContent.displayName = "AnimatedAccordionContent";

export default AnimatedAccordion;
