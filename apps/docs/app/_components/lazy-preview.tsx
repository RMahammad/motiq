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
}: {
  children: React.ReactNode;
  label?: string;
  minHeightClass?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    if (active) return;
    const el = ref.current;
    if (!el) return;
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
        children
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className={`flex w-full items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[13px] text-[var(--color-muted)] ${minHeightClass}`}
        >
          {label} — activating…
        </button>
      )}
    </div>
  );
}
