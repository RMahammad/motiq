"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "motion/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";

type Animation = "scale" | "slide-up" | "fade";
type Origin = "center" | "top" | "bottom";
type MobileVariant = "sheet" | "centered";

const EASE: Transition["ease"] = [0.2, 0, 0, 1];
/** Critically-damped spring — physical settle, no visible bounce. */
const SPRING: Transition = { type: "spring", stiffness: 460, damping: 38, mass: 0.9 };

/** Desktop content variants keyed by animation style. */
function contentMotion(animation: Animation) {
  switch (animation) {
    case "slide-up":
      return { initial: { opacity: 0, y: 16, scale: 1 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 16, scale: 1 } };
    case "fade":
      return { initial: { opacity: 0, y: 0, scale: 1 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 0, scale: 1 } };
    case "scale":
    default:
      return { initial: { opacity: 0, y: 0, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 0, scale: 0.96 } };
  }
}

/** Mobile bottom-sheet slides up from the bottom edge. */
const SHEET_MOTION = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
} as const;

const ORIGIN_CLASS: Record<Origin, string> = {
  center: "origin-center",
  top: "origin-top",
  bottom: "origin-bottom",
};

/** SSR-safe media query (defaults to false on the server / first paint). */
function useIsMobile(query = "(max-width: 640px)") {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return matches;
}

export interface AnimatedDialogProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> {
  /** Desktop content entrance style. */
  animation?: Animation;
  /** Enter/exit duration in seconds. */
  duration?: number;
  /** Transform origin for the scaling content (desktop). */
  origin?: Origin;
  /** On ≤640px, render as a bottom sheet ("sheet", default) or keep it centered. */
  mobileVariant?: MobileVariant;
}

interface DialogAnimationContextValue {
  animation: Animation;
  duration: number;
  origin: Origin;
  mobileVariant: MobileVariant;
  open: boolean;
}

const DialogAnimationContext = React.createContext<DialogAnimationContextValue | null>(null);

function useDialogAnimation() {
  const ctx = React.useContext(DialogAnimationContext);
  if (!ctx) throw new Error("AnimatedDialog.* must be rendered inside <AnimatedDialog>.");
  return ctx;
}

/**
 * AnimatedDialog — a Radix Dialog upgraded into a signature overlay system.
 *
 * Substance over decoration: (1) an adaptive **mobile bottom sheet**
 * (`mobileVariant="sheet"`, default) that becomes a centered modal on desktop;
 * (2) a **long-content structure** (Header/Body/Footer) where the header and
 * footer stay pinned and only the body scrolls, so actions stay visible over long
 * content (capped by `max-h`); (3) a bounded, forced-colors-safe close.
 * Radix owns portal, focus trap + restore, Esc, overlay click, and aria-modal —
 * none of it re-implemented. AnimatePresence drives exit off the controlled
 * `open` state, so rapid open/close never leaves a stale layer. Reduced-motion
 * renders instantly. Clean-room original.
 */
export function AnimatedDialog({
  animation = "scale",
  duration = 0.22,
  origin = "center",
  mobileVariant = "sheet",
  open: openProp,
  defaultOpen,
  onOpenChange,
  children,
  ...props
}: AnimatedDialogProps) {
  // Derive `open` directly so controlled usage has no one-render lag: in
  // controlled mode `open` follows `openProp` immediately; uncontrolled tracks
  // local state. AnimatePresence + Radix both read this single value.
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen ?? false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const ctx = React.useMemo<DialogAnimationContextValue>(
    () => ({ animation, duration, origin, mobileVariant, open }),
    [animation, duration, origin, mobileVariant, open],
  );

  return (
    <DialogAnimationContext.Provider value={ctx}>
      <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} {...props}>
        {children}
      </DialogPrimitive.Root>
    </DialogAnimationContext.Provider>
  );
}

export const AnimatedDialogTrigger = DialogPrimitive.Trigger;
export const AnimatedDialogClose = DialogPrimitive.Close;

export const AnimatedDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold text-[var(--color-fg,#111318)]", className)} {...props} />
));
AnimatedDialogTitle.displayName = "AnimatedDialogTitle";

export const AnimatedDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("mt-1 text-sm text-[var(--color-fg,#111318)]/70", className)} {...props} />
));
AnimatedDialogDescription.displayName = "AnimatedDialogDescription";

/** Pinned header region (never scrolls). Pairs with Body + Footer. */
export function AnimatedDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shrink-0 px-6 pb-4 pt-6 pr-12", className)} {...props} />;
}
/** The single scroll region — capped by the content's max-height. */
export function AnimatedDialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-1", className)} {...props} />;
}
/** Pinned footer region (actions stay visible above the fold / keyboard). */
export function AnimatedDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "shrink-0 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border,#e4e7ec)] px-6 pb-6 pt-4",
        className,
      )}
      {...props}
    />
  );
}

export interface AnimatedDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Hide the built-in overlay (bring your own). */
  hideOverlay?: boolean;
  /** Show the built-in top-right close button. */
  showClose?: boolean;
}

export const AnimatedDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  AnimatedDialogContentProps
>(({ className, children, hideOverlay, showClose = true, ...props }, ref) => {
  const { animation, duration, origin, mobileVariant, open } = useDialogAnimation();
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const isSheet = mobileVariant === "sheet" && isMobile;

  const variants = isSheet ? SHEET_MOTION : contentMotion(animation);
  // Overlay fades on a tween; the surface settles on a critically-damped spring
  // for a physical (not bouncy) feel. Reduced motion → instant for both.
  const overlayTransition: Transition = reduce ? { duration: 0 } : { duration, ease: EASE };
  const contentTransition: Transition = reduce ? { duration: 0 } : SPRING;

  return (
    <AnimatePresence>
      {open ? (
        <DialogPrimitive.Portal forceMount>
          {!hideOverlay ? (
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={overlayTransition}
              />
            </DialogPrimitive.Overlay>
          ) : null}
          <DialogPrimitive.Content asChild forceMount ref={ref} {...props}>
            <motion.div
              className={cn(
                "z-50 flex flex-col overflow-hidden border border-[var(--color-border,#e4e7ec)]",
                "bg-[var(--color-surface,#fff)] text-[var(--color-fg,#111318)] focus:outline-none",
                // Considered depth: a layered graphite shadow + a hairline inner
                // edge ring (reads as a crafted surface, not a flat box).
                "shadow-[0_24px_70px_-16px_rgba(16,19,33,0.5)] ring-1 ring-inset ring-[color-mix(in_oklab,var(--color-fg,#111318)_5%,transparent)]",
                isSheet
                  ? "fixed inset-x-0 bottom-0 max-h-[90dvh] w-full rounded-t-2xl rounded-b-none border-b-0"
                  : cn("fixed left-1/2 top-1/2 max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl", ORIGIN_CLASS[origin]),
                className,
              )}
              initial={reduce ? false : variants.initial}
              animate={variants.animate}
              exit={variants.exit}
              transition={contentTransition}
            >
              {/* Refined top-edge sheen — a restrained premium detail, not decoration. */}
              <span aria-hidden className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_oklab,var(--color-fg,#111318)_16%,transparent)] to-transparent" />
              {isSheet ? (
                <span aria-hidden className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-[var(--color-fg,#111318)]/15" />
              ) : null}
              {showClose ? (
                <DialogPrimitive.Close
                  aria-label="Close"
                  className={cn(
                    "absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg border border-transparent text-[var(--color-fg,#111318)]/60",
                    "transition-colors hover:bg-[var(--color-fg,#111318)]/[0.06] hover:text-[var(--color-fg,#111318)] forced-colors:border-[ButtonText]",
                    "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-style:solid] focus-visible:[outline-color:var(--color-accent,#695cff)]",
                  )}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
                    <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </DialogPrimitive.Close>
              ) : null}
              {children}
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      ) : null}
    </AnimatePresence>
  );
});
AnimatedDialogContent.displayName = "AnimatedDialogContent";

export default AnimatedDialog;
