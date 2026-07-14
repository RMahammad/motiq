"use client";
import * as React from "react";
import { useInView } from "./use-in-view";

export interface InViewProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  once?: boolean;
  rootMargin?: string;
  /** IntersectionObserver threshold (0–1). */
  amount?: number;
  /** Called with the current in-view state (overrides the native DOM onChange). */
  onChange?: (inView: boolean) => void;
  children?: React.ReactNode | ((inView: boolean) => React.ReactNode);
}

/**
 * InView — behavioral primitive that reports when its wrapper enters the viewport.
 * Exposes state via `data-inview`, an `onChange` callback, and a render-prop.
 * SSR-safe (initial `false`); cleans up on unmount. Built on `useInView`.
 * When NOT to use: if you just want an entrance animation, use `Reveal`.
 */
export const InView = React.forwardRef<HTMLDivElement, InViewProps>(function InView(
  { once = true, rootMargin, amount = 0, onChange, children, ...rest },
  ref,
) {
  const [innerRef, inView] = useInView<HTMLDivElement>({ once, rootMargin, amount, onChange });
  React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);

  return (
    <div ref={innerRef} data-inview={inView} {...rest}>
      {typeof children === "function" ? children(inView) : children}
    </div>
  );
});
