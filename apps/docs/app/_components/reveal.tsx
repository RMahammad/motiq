"use client";

import * as React from "react";

/**
 * Staggered scroll reveal for the homepage catalog grid (docs/61 §catalog).
 * Cards rise and fade in once as they enter the viewport — the entrance is the
 * section's one orchestrated moment; every other loop inside the cards is
 * ambient. Mirrors LazyPreview's observer conventions:
 *   - reveals immediately if the element is already on/near screen at mount,
 *     so above-the-fold cards never flash empty (or capture blank in shots);
 *   - one-shot: the observer disconnects after the first reveal;
 *   - reduced motion + no-JS both fall back to plain, fully visible content
 *     (see the `.reveal` rules in globals.css).
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  /** Stagger, in ms, applied as a transition-delay. */
  delay?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  /**
   * "idle" is the SSR state and renders NO attribute — the markup ships fully
   * visible, so a no-JS agent or a failed hydration can never blank the grid.
   * The hidden "out" state is only ever applied on the client, and only to
   * elements that are still below the fold, where the flip cannot be seen.
   */
  const [state, setState] = React.useState<"idle" | "out" | "in">("idle");
  const shown = state === "in";

  React.useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;

    // Geometry is the source of truth; the observer is only a cheap trigger.
    const check = () => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.94 && r.bottom > 0) {
        setState("in");
        return true;
      }
      return false;
    };
    // Already on/near screen at mount — leave it visible (no entrance) so
    // above-the-fold cards never flash empty and always render in captures.
    if (check()) return;
    // Below the fold: hide it now, invisibly, then animate it in on approach.
    setState("out");

    let io: IntersectionObserver | undefined;
    const cleanup = () => {
      io?.disconnect();
      window.removeEventListener("scroll", onMove);
      window.removeEventListener("resize", onMove);
    };
    function onMove() {
      if (check()) cleanup();
    }

    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(() => { if (check()) cleanup(); }, {
        rootMargin: "0px 0px -6% 0px",
        threshold: 0.06,
      });
      io.observe(el);
    }
    // Fallback: some embedded/background renderers report the document hidden
    // and never fire IntersectionObserver. Scroll + resize keep the reveal
    // honest there, so content can't get stuck invisible.
    window.addEventListener("scroll", onMove, { passive: true });
    window.addEventListener("resize", onMove, { passive: true });
    return cleanup;
  }, [shown]);

  return (
    <div
      ref={ref}
      className={`reveal ${className ?? ""}`}
      data-reveal={state === "idle" ? undefined : state}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
