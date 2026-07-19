"use client";

import * as React from "react";

import type { TocItem } from "./docs-sidebar";

/**
 * Sticky scrollspy table of contents for the docs shell's right rail. Observes
 * the article's section elements and marks the one currently in the reading
 * band. Pure IntersectionObserver — no per-scroll JS work, no layout thrash.
 */
export function DocsToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = React.useState<string | null>(items[0]?.id ?? null);
  // Sections currently intersecting the reading band, in document order.
  const visibleRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    const els = items
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!els.length || typeof IntersectionObserver === "undefined") return;

    const order = items.map((t) => t.id);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visibleRef.current.add(e.target.id);
          else visibleRef.current.delete(e.target.id);
        }
        // First visible section in document order wins; when none intersect
        // (inside a very tall section), keep the current highlight.
        const first = order.find((id) => visibleRef.current.has(id));
        if (first) setActiveId(first);
      },
      // Reading band: below the sticky header, top 40% of the viewport.
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <nav aria-label="On this page" className="text-[13px]">
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        On this page
      </p>
      <ul className="space-y-0.5 border-l border-[var(--color-border)]">
        {items.map((t) => {
          const active = t.id === activeId;
          return (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                aria-current={active ? "true" : undefined}
                className={`-ml-px block border-l-2 py-1 pl-3 leading-snug transition-colors ${
                  active
                    ? "border-[var(--color-accent)] font-medium text-[var(--color-accent-text)]"
                    : "border-transparent text-[var(--color-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]"
                }`}
              >
                {t.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
