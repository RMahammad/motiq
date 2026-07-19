"use client";
import * as React from "react";
import { useInView } from "./use-in-view";
import { prefersReducedMotion } from "./prefers-reduced-motion";

export interface CounterProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  value: number;
  from?: number;
  /** Animation length in ms. */
  duration?: number;
  decimals?: number;
  /** Custom formatter (overrides `decimals`). */
  format?: (n: number) => string;
  /** Start counting when scrolled into view (else on mount). */
  startOnView?: boolean;
  reducedMotion?: "respect" | "force" | "off";
}

/**
 * Counter (AnimatedNumber) — counts from `from` to `value` with a rAF ease-out when it
 * enters view. SSR-safe (renders `from` initially), reduced-motion jumps to the final value,
 * cancels the frame on unmount/change. docs/12, docs/13.
 */
export const Counter = React.forwardRef<HTMLSpanElement, CounterProps>(function Counter(
  { value, from = 0, duration = 1200, decimals = 0, format, startOnView = true, reducedMotion = "respect", ...rest },
  ref,
) {
  const [innerRef, inView] = useInView<HTMLSpanElement>({ enabled: startOnView, once: true });
  React.useImperativeHandle(ref, () => innerRef.current as HTMLSpanElement);
  const active = startOnView ? inView : true;
  const [display, setDisplay] = React.useState(from);

  React.useEffect(() => {
    if (!active) return;
    const reduce =
      reducedMotion === "force" ||
      (reducedMotion === "respect" && prefersReducedMotion());
    if (reduce || duration <= 0) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else setDisplay(value);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, value, from, duration, reducedMotion]);

  const text = format ? format(display) : display.toFixed(decimals);
  return (
    <span ref={innerRef} {...rest}>
      {text}
    </span>
  );
});
