"use client";
import * as React from "react";

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
 * SSR-safe (initial `false`; observer only runs after hydrate); cleans up on unmount.
 * When NOT to use: if you just want an entrance animation, use `Reveal`.
 */
export const InView = React.forwardRef<HTMLDivElement, InViewProps>(function InView(
  { once = true, rootMargin = "0px 0px -10% 0px", amount = 0, onChange, children, ...rest },
  ref,
) {
  const innerRef = React.useRef<HTMLDivElement | null>(null);
  React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          onChange?.(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
          onChange?.(false);
        }
      },
      { rootMargin, threshold: amount },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, rootMargin, amount, onChange]);

  return (
    <div ref={innerRef} data-inview={inView} {...rest}>
      {typeof children === "function" ? children(inView) : children}
    </div>
  );
});
