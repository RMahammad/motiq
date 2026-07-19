"use client";
import * as React from "react";
import { Reveal } from "@scope/motion";
import { cn } from "@scope/tokens/cn";

export interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Wrap the button in a mount Reveal so it animates in on first render. */
  revealOnMount?: boolean;
}

/**
 * Minimal interactive component composing the motion primitive layer.
 * Demonstrates the @scope/react -> @scope/motion boundary and "use client".
 * Contract: docs/09-component-api-standard.md.
 */
export const AnimatedButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedButtonProps
>(function AnimatedButton({ className, children, revealOnMount, ...rest }, ref) {
  const button = (
    <button ref={ref} className={cn("scope-btn", className)} {...rest}>
      {children}
    </button>
  );
  return revealOnMount ? <Reveal trigger="mount">{button}</Reveal> : button;
});
