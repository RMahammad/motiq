"use client";

import * as React from "react";

import {
  FilterResultTransition,
  type ActiveFilter,
} from "@/registry/data/filter-result-transition";

/**
 * Compact catalog adapter (docs/55 §7). A settled result set with the morphing
 * count and one active-filter chip — no search box, layout switch, or
 * Simulate loading/error controls. Non-removable chips (no handlers → no close
 * buttons) and static, non-interactive result cards. Trimmed to 6 items.
 */

interface Asset {
  id: string;
  name: string;
  kind: string;
  owner: string;
  category: string;
  status: "active" | "draft" | "archived";
  updated: string;
}

const STATUS_META: Record<Asset["status"], { label: string; tone: string }> = {
  active: { label: "Active", tone: "var(--color-success)" },
  draft: { label: "Draft", tone: "var(--color-warning)" },
  archived: { label: "Archived", tone: "var(--color-muted)" },
};

const ASSETS: Asset[] = [
  { id: "as_01", name: "Onboarding flow", kind: "Prototype", owner: "Mara", category: "Design", status: "active", updated: "2h ago" },
  { id: "as_02", name: "Pricing page hero", kind: "Figma", owner: "Ivo", category: "Design", status: "draft", updated: "1d ago" },
  { id: "as_09", name: "Design tokens v3", kind: "Package", owner: "Mara", category: "Design", status: "active", updated: "8h ago" },
  { id: "as_05", name: "Q3 launch brief", kind: "Doc", owner: "Priya", category: "Marketing", status: "active", updated: "5h ago" },
  { id: "as_07", name: "Churn analysis", kind: "Notebook", owner: "Sol", category: "Research", status: "active", updated: "45m ago" },
  { id: "as_12", name: "Retention cohorts", kind: "Dashboard", owner: "Sol", category: "Research", status: "active", updated: "12h ago" },
];

const ACTIVE_FILTERS: ActiveFilter[] = [{ id: "status:active", group: "Status", label: "Active" }];

export function FilterResultTransitionCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <FilterResultTransition<Asset>
        items={ASSETS}
        getItemId={(a) => a.id}
        layout="grid"
        activeFilters={ACTIVE_FILTERS}
        renderItem={(a) => (
          <div className="flex w-full flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 text-left">
            <div className="min-w-0">
              <span className="block truncate text-[14px] font-semibold text-[var(--color-fg)]">{a.name}</span>
              <span className="block text-[12px] text-[var(--color-muted)]">
                {a.kind} · {a.owner}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-muted)]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_META[a.status].tone }} aria-hidden />
                {STATUS_META[a.status].label}
              </span>
              <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-muted)]">
                {a.category}
              </span>
            </div>
          </div>
        )}
      />
    </div>
  );
}

export default FilterResultTransitionCatalogPreview;
