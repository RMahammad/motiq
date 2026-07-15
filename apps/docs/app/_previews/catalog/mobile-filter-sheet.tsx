"use client";

import * as React from "react";

import { MobileFilterSheet, type FilterGroup } from "@/registry/mobile/mobile-filter-sheet";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL MobileFilterSheet in one
 * representative OPEN state inside a contained phone-sized surface — the filter
 * workflow (header, active chips, groups, sticky Apply) is visible at a glance.
 * No external "open / simulate loading / surface" demo controls. Trimmed to 3
 * groups. Deterministic.
 */

const GROUPS: FilterGroup[] = [
  {
    id: "status",
    label: "Status",
    type: "checkbox",
    options: [
      { value: "active", label: "Active", count: 5 },
      { value: "draft", label: "Draft", count: 2 },
      { value: "archived", label: "Archived", count: 1 },
    ],
  },
  {
    id: "owner",
    label: "Owner",
    type: "radio",
    options: [
      { value: "ada", label: "Ada Lovelace", count: 3 },
      { value: "grace", label: "Grace Hopper", count: 3 },
      { value: "linus", label: "Linus Torvalds", count: 2 },
    ],
  },
  { id: "price", label: "Price", type: "range", min: 0, max: 200, step: 4, format: (n) => `$${n}` },
];

export function MobileFilterSheetCatalogPreview() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]" style={{ height: 520 }}>
      <MobileFilterSheet
        groups={GROUPS}
        mode="fullscreen"
        defaultOpen
        contained
        title="Filter products"
        defaultValue={{ status: ["active"], owner: "ada" }}
        resultCount={5}
      />
    </div>
  );
}

export default MobileFilterSheetCatalogPreview;
