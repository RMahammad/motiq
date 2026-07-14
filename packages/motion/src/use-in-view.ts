"use client";
import * as React from "react";

export interface UseInViewOptions {
  once?: boolean;
  rootMargin?: string;
  /** IntersectionObserver threshold (0–1). */
  amount?: number;
  /** When false, the hook reports `true` immediately and creates no observer (mount trigger). */
  enabled?: boolean;
  onChange?: (inView: boolean) => void;
}

/**
 * Shared viewport-detection hook powering Reveal, InView and Stagger. Returns a ref to
 * attach and the current in-view boolean. SSR-safe (observer only runs after hydrate);
 * disconnects on reveal (`once`) and on unmount. Advanced/public API.
 */
export function useInView<T extends Element = HTMLDivElement>(
  options: UseInViewOptions = {},
): readonly [React.RefObject<T | null>, boolean] {
  const {
    once = true,
    rootMargin = "0px 0px -10% 0px",
    amount = 0,
    enabled = true,
    onChange,
  } = options;
  const ref = React.useRef<T | null>(null);
  const [inView, setInView] = React.useState(!enabled);

  React.useEffect(() => {
    if (!enabled) {
      setInView(true);
      return;
    }
    const el = ref.current;
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
  }, [enabled, once, rootMargin, amount, onChange]);

  return [ref, inView] as const;
}
