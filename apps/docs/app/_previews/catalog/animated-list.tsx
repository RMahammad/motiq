"use client";

import * as React from "react";

import { AnimatedList, AnimatedListItem } from "@/registry/creative/animated-list";

/**
 * Compact catalog adapter (docs/55 §7). The real AnimatedList with three static
 * items — no Add/Dismiss controls. The staggered entrance plays on mount.
 */

const ITEMS = [
  { id: 1, title: "Deployment succeeded", meta: "production · 2m ago", tone: "ok" as const },
  { id: 2, title: "Ada commented on “Auth flow”", meta: "design · 5m ago", tone: "info" as const },
  { id: 3, title: "Invoice #1042 paid", meta: "billing · 12m ago", tone: "ok" as const },
];

export function AnimatedListCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[460px]">
      <AnimatedList>
        {ITEMS.map((it, i) => (
          <AnimatedListItem
            key={it.id}
            index={i}
            className="flex items-center gap-3 shadow-[var(--shadow-sm)]"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: it.tone === "ok" ? "var(--color-success)" : "var(--color-accent)" }}
              aria-hidden
            />
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-medium text-[var(--color-fg)]">{it.title}</span>
              <span className="block text-[12px] text-[var(--color-muted)]">{it.meta}</span>
            </span>
          </AnimatedListItem>
        ))}
      </AnimatedList>
    </div>
  );
}

export default AnimatedListCatalogPreview;
