"use client";

import * as React from "react";

/**
 * Defers mounting an interactive preview until it scrolls near the viewport.
 * A static shell renders first (no ambient work, no client cost) so pack pages
 * don't mount every heavy block on load (docs perf strategy, docs/42/§perf).
 * Once activated, the child preview mounts and its own visibility-pause logic
 * takes over. Under reduced motion the shell still activates on view — it just
 * won't animate — so keyboard/AT users reach the real content.
 */
export function LazyPreview({
  children,
  label = "Interactive preview",
  minHeightClass = "min-h-[300px] sm:min-h-[360px]",
  decorative = false,
}: {
  children: React.ReactNode;
  label?: string;
  minHeightClass?: string;
  /**
   * Decorative thumbnail (e.g. homepage category card). The observed wrapper is
   * never `inert` (IntersectionObserver does not fire inside an inert subtree),
   * so we instead render the activated preview inside an `inert` wrapper and make
   * the skeleton non-focusable — keeping the preview's controls out of the tab
   * order and out of any stretched card link.
   */
  decorative?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    if (active) return;
    const el = ref.current;
    if (!el) return;
    // Activate immediately if the card is already on/near screen at mount so
    // above-the-fold previews never flash a placeholder (and render in captures).
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight + 300 && r.bottom > -300) {
      setActive(true);
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      setActive(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active]);

  return (
    <div ref={ref}>
      {active ? (
        decorative ? (
          <div {...({ inert: true } as Record<string, unknown>)}>{children}</div>
        ) : (
          children
        )
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          aria-label={`${label} — load preview`}
          aria-hidden={decorative || undefined}
          tabIndex={decorative ? -1 : undefined}
          className={`flex w-full flex-col items-center justify-center gap-3 overflow-hidden bg-[var(--color-surface)] ${minHeightClass}`}
        >
          {/* Skeleton reads intentionally in both themes; self-activates on view. */}
          <div className="flex w-[62%] max-w-[420px] flex-col gap-2.5" aria-hidden>
            <div className="h-2.5 w-1/3 rounded-full bg-[color-mix(in_oklab,var(--color-fg)_9%,transparent)] motion-safe:animate-pulse" />
            <div className="h-2.5 w-full rounded-full bg-[color-mix(in_oklab,var(--color-fg)_7%,transparent)] motion-safe:animate-pulse" />
            <div className="h-2.5 w-4/5 rounded-full bg-[color-mix(in_oklab,var(--color-fg)_7%,transparent)] motion-safe:animate-pulse" />
          </div>
          <span className="text-[12px] text-[var(--color-muted)]">{label}</span>
        </button>
      )}
    </div>
  );
}
