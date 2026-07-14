"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "motion/react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

type TransitionKind = "spring" | "tween";

const SPRING: Transition = { type: "spring", stiffness: 520, damping: 42, mass: 1 };
const TWEEN: Transition = { duration: 0.24, ease: [0.2, 0, 0, 1] };

interface TabsAnimationContextValue {
  /** Stable id so every List gets its own sliding indicator layout group. */
  layoutId: string;
  transition: TransitionKind;
  directionAware: boolean;
  value: string | undefined;
  reduce: boolean;
}

const TabsAnimationContext =
  React.createContext<TabsAnimationContextValue | null>(null);

function useTabsAnimation() {
  const ctx = React.useContext(TabsAnimationContext);
  if (!ctx) {
    throw new Error("AnimatedTabs.* must be rendered inside <AnimatedTabs>.");
  }
  return ctx;
}

export interface AnimatedTabsProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  /** Slide content in the direction of travel between tabs. */
  directionAware?: boolean;
  /** Motion feel for the active indicator + content. */
  transition?: TransitionKind;
}

/**
 * AnimatedTabs — Radix Tabs with a Motion `layoutId` sliding active indicator
 * and cross-faded content.
 *
 * Accessibility: Radix owns roles (`tablist`/`tab`/`tabpanel`), arrow-key
 * roving focus, and controlled/uncontrolled value — untouched here. The
 * indicator is purely decorative. Under `prefers-reduced-motion` the indicator
 * and content swap instantly. Content is keyed by active value inside
 * AnimatePresence with `mode="wait"`, so rapid switching never leaves a stale
 * panel mounted. Clean-room original.
 */
export function AnimatedTabs({
  directionAware = false,
  transition = "spring",
  value: valueProp,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: AnimatedTabsProps) {
  const reduce = useReducedMotion();
  const reactId = React.useId();
  const [value, setValue] = React.useState<string | undefined>(
    valueProp ?? defaultValue,
  );

  React.useEffect(() => {
    if (valueProp !== undefined) setValue(valueProp);
  }, [valueProp]);

  const handleValueChange = React.useCallback(
    (next: string) => {
      if (valueProp === undefined) setValue(next);
      onValueChange?.(next);
    },
    [valueProp, onValueChange],
  );

  const ctx = React.useMemo<TabsAnimationContextValue>(
    () => ({
      layoutId: `animated-tabs-indicator-${reactId}`,
      transition,
      directionAware,
      value,
      reduce: !!reduce,
    }),
    [reactId, transition, directionAware, value, reduce],
  );

  return (
    <TabsAnimationContext.Provider value={ctx}>
      <TabsPrimitive.Root
        // Root is always driven by our mirrored state so the indicator/content
        // can read the active value; consumer control is preserved via effect.
        value={value}
        onValueChange={handleValueChange}
        className={cn("w-full", className)}
        {...props}
      >
        {children}
      </TabsPrimitive.Root>
    </TabsAnimationContext.Provider>
  );
}

export const AnimatedTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center gap-1 rounded-xl border border-[var(--color-border,#e4e7ec)]",
      "bg-[var(--color-surface,#fff)] p-1",
      className,
    )}
    {...props}
  />
));
AnimatedTabsList.displayName = "AnimatedTabsList";

export interface AnimatedTabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {}

export const AnimatedTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  AnimatedTabsTriggerProps
>(({ className, children, value, ...props }, ref) => {
  const { layoutId, transition, value: active, reduce } = useTabsAnimation();
  const isActive = active === value;
  const spring = transition === "spring" ? SPRING : TWEEN;

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      className={cn(
        "relative z-0 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
        "text-[var(--color-fg,#111318)]/60 data-[state=active]:text-[var(--color-fg,#111318)]",
        // Outline-based focus + a forced-colors active boundary, since the tinted
        // pill (bg-accent/12) is dropped in high-contrast and all tabs would read
        // identically. The active tab gets a Highlight outline in forced-colors.
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-style:solid] focus-visible:[outline-color:var(--color-accent,#695cff)]",
        "data-[state=active]:forced-colors:[outline-style:solid] data-[state=active]:forced-colors:outline-2 data-[state=active]:forced-colors:[outline-offset:-2px] data-[state=active]:forced-colors:[outline-color:Highlight]",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {isActive ? (
        <motion.span
          aria-hidden="true"
          layoutId={reduce ? undefined : layoutId}
          className="absolute inset-0 -z-10 rounded-lg bg-[var(--color-accent,#695cff)]/12"
          transition={spring}
        />
      ) : null}
      <span className="relative">{children}</span>
    </TabsPrimitive.Trigger>
  );
});
AnimatedTabsTrigger.displayName = "AnimatedTabsTrigger";

export interface AnimatedTabsContentProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {}

export const AnimatedTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  AnimatedTabsContentProps
>(({ className, children, value, ...props }, ref) => {
  const {
    transition,
    directionAware,
    value: active,
    reduce,
  } = useTabsAnimation();
  const isActive = active === value;
  const spring = transition === "spring" ? SPRING : TWEEN;
  const offset = directionAware ? 24 : 8;

  return (
    <TabsPrimitive.Content
      ref={ref}
      value={value}
      // Keep the panel mounted so Radix retains it in the a11y tree; Motion
      // handles the visual enter/exit. `forceMount` + AnimatePresence lets the
      // outgoing panel finish its exit before unmount.
      forceMount
      className={cn(
        "mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent,#695cff)]",
        !isActive && "pointer-events-none",
        className,
      )}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isActive ? (
          <motion.div
            key={value}
            initial={reduce ? false : { opacity: 0, x: offset }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -offset }}
            transition={reduce ? { duration: 0 } : spring}
            className="[will-change:transform,opacity]"
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </TabsPrimitive.Content>
  );
});
AnimatedTabsContent.displayName = "AnimatedTabsContent";

export default AnimatedTabs;
