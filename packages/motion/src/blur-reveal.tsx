"use client";
import * as React from "react";
import { cn } from "@scope/tokens/cn";
import { useInView } from "./use-in-view";

export interface BlurRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Blur strength. */
  amount?: "sm" | "md" | "lg";
  duration?: "fast" | "normal" | "slow";
  trigger?: "mount" | "in-view";
  once?: boolean;
  reducedMotion?: "respect" | "force-reduce" | "allow";
  onVisibilityChange?: (visible: boolean) => void;
}

const BLUR: Record<NonNullable<BlurRevealProps["amount"]>, string> = {
  sm: "4px",
  md: "8px",
  lg: "16px",
};

/**
 * BlurReveal — entrance that fades + de-blurs its children into focus. CSS + IntersectionObserver
 * (via useInView); SSR-safe, reduced-motion aware (renders sharp/visible instantly), ref-forwarded.
 * A headline effect; keep `amount` modest to avoid GPU-heavy large blurs (docs/13).
 */
export const BlurReveal = React.forwardRef<HTMLDivElement, BlurRevealProps>(function BlurReveal(
  {
    amount = "md",
    duration = "normal",
    trigger = "in-view",
    once = true,
    reducedMotion = "respect",
    onVisibilityChange,
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  const [innerRef, shown] = useInView<HTMLDivElement>({
    once,
    enabled: trigger === "in-view",
    onChange: onVisibilityChange,
  });
  React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);

  const styleVars = {
    "--blur-amount": BLUR[amount],
    "--blur-duration": `var(--motion-duration-${duration})`,
    ...style,
  } as React.CSSProperties;

  return (
    <div
      ref={innerRef}
      data-motion={shown ? "shown" : "hidden"}
      data-reduced-motion={reducedMotion}
      className={cn("scope-blur-reveal", className)}
      style={styleVars}
      {...rest}
    >
      {children}
    </div>
  );
});
