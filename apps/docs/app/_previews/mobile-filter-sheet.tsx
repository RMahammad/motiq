"use client";

import * as React from "react";

import {
  MobileFilterSheet,
  type FilterGroup,
  type FilterValue,
  type FilterSheetMode,
} from "@/registry/mobile/mobile-filter-sheet";

/* ---------------------------------------------------------------- demo data */
/* Deterministic, fixed data — no Date.now()/Math.random() at render time so the
 * server and client markup always match. "Simulate loading/error" only flips
 * state inside handlers/timeouts. */

interface Product {
  id: string;
  name: string;
  status: "active" | "draft" | "archived";
  category: "apparel" | "footwear" | "accessories" | "home";
  owner: "ada" | "grace" | "linus";
  price: number;
  updated: string; // ISO date, fixed
  tag: string;
}

const PRODUCTS: Product[] = [
  { id: "p1", name: "Aurora Runner", status: "active", category: "footwear", owner: "ada", price: 128, updated: "2026-06-30", tag: "Bestseller" },
  { id: "p2", name: "Meridian Tote", status: "active", category: "accessories", owner: "grace", price: 74, updated: "2026-06-22", tag: "New" },
  { id: "p3", name: "Loft Throw Blanket", status: "draft", category: "home", owner: "linus", price: 59, updated: "2026-05-18", tag: "Cozy" },
  { id: "p4", name: "Cirrus Windbreaker", status: "active", category: "apparel", owner: "ada", price: 152, updated: "2026-07-01", tag: "Limited" },
  { id: "p5", name: "Trailhead Cap", status: "archived", category: "accessories", owner: "grace", price: 32, updated: "2026-04-09", tag: "Classic" },
  { id: "p6", name: "Solstice Sandal", status: "active", category: "footwear", owner: "linus", price: 88, updated: "2026-06-11", tag: "Summer" },
  { id: "p7", name: "Harbor Knit", status: "draft", category: "apparel", owner: "ada", price: 96, updated: "2026-05-30", tag: "Staff pick" },
  { id: "p8", name: "Nimbus Duffel", status: "active", category: "accessories", owner: "grace", price: 140, updated: "2026-06-28", tag: "Travel" },
];

const groups: FilterGroup[] = [
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
    id: "category",
    label: "Category",
    type: "search",
    searchPlaceholder: "Search categories",
    options: [
      { value: "apparel", label: "Apparel", count: 2 },
      { value: "footwear", label: "Footwear", count: 2 },
      { value: "accessories", label: "Accessories", count: 3 },
      { value: "home", label: "Home", count: 1, disabled: true, disabledReason: "No items in stock this season" },
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
  {
    id: "price",
    label: "Price",
    type: "range",
    min: 0,
    max: 200,
    step: 4,
    unit: "",
    format: (n) => `$${n}`,
  },
  { id: "updated", label: "Updated", type: "date", defaultCollapsed: true },
];

const OWNER_NAME: Record<Product["owner"], string> = { ada: "Ada Lovelace", grace: "Grace Hopper", linus: "Linus Torvalds" };

function matches(p: Product, v: FilterValue): boolean {
  const status = (v.status as string[] | undefined) ?? [];
  if (status.length && !status.includes(p.status)) return false;
  const category = (v.category as string[] | undefined) ?? [];
  if (category.length && !category.includes(p.category)) return false;
  const owner = v.owner as string | null | undefined;
  if (owner && owner !== p.owner) return false;
  const price = v.price as { min: number; max: number } | undefined;
  if (price && (p.price < price.min || p.price > price.max)) return false;
  const updated = v.updated as { from: string | null; to: string | null } | undefined;
  if (updated?.from && p.updated < updated.from) return false;
  if (updated?.to && p.updated > updated.to) return false;
  return true;
}

/* --------------------------------------------------------------- the preview */

export function MobileFilterSheetPreview() {
  const [open, setOpen] = React.useState(false);
  const [applied, setApplied] = React.useState<FilterValue>({ status: ["active"] });
  const [draftPreview, setDraftPreview] = React.useState<FilterValue>({ status: ["active"] });
  const [mode, setMode] = React.useState<FilterSheetMode>("sheet");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Applied results power the phone list; the sheet's live count previews the
  // in-flight draft so "Apply" shows what you'll get before committing.
  const appliedResults = React.useMemo(() => PRODUCTS.filter((p) => matches(p, applied)), [applied]);
  const draftCount = React.useMemo(
    () => (loading ? 0 : PRODUCTS.filter((p) => matches(p, draftPreview)).length),
    [draftPreview, loading],
  );

  const simulateLoading = () => {
    setError(null);
    setLoading(true);
    setOpen(true);
    window.setTimeout(() => setLoading(false), 1400);
  };
  const simulateError = () => {
    setLoading(false);
    setError("Couldn’t load option counts. Check your connection and retry.");
    setOpen(true);
  };
  const resetDemo = () => {
    setApplied({ status: ["active"] });
    setDraftPreview({ status: ["active"] });
    setMode("sheet");
    setLoading(false);
    setError(null);
    setOpen(false);
  };

  const btn =
    "min-h-[36px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[12px] font-medium text-[var(--color-fg)] hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]";
  const seg =
    "min-h-[32px] px-2.5 text-[12px] font-medium transition-colors data-[on=true]:bg-[var(--color-surface)] data-[on=true]:text-[var(--color-fg)] text-[var(--color-muted)] hover:text-[var(--color-fg)]";

  return (
    <div className="flex w-full max-w-[860px] flex-col items-center gap-5 lg:flex-row lg:items-start lg:justify-center">
      {/* Phone frame — the component dominates this surface */}
      <div className="relative w-full max-w-[380px] shrink-0">
        <div
          className="relative overflow-hidden rounded-[2rem] border-[6px] border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-[var(--shadow-lg)]"
          style={{ height: 620 }}
        >
          {/* app chrome */}
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-2 pt-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">Catalog</p>
              <p className="text-[15px] font-semibold text-[var(--color-fg)]">Products</p>
            </div>
            <MobileFilterSheet
              groups={groups}
              mode={mode}
              open={open}
              onOpenChange={setOpen}
              value={applied}
              onValueChange={setApplied}
              onDraftChange={setDraftPreview}
              onApply={(v) => setApplied(v)}
              resultCount={draftCount}
              loading={loading}
              error={error}
              onRetry={() => setError(null)}
              confirmDiscard
              contained
              title="Filter products"
              trigger={
                <span className="inline-flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M3 5h18M6 12h12M10 19h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Filters
                </span>
              }
            />
          </div>

          {/* onDraftChange feeds the sheet's live count; applied drives this list. */}
          <ChipsBar applied={applied} onClear={() => setApplied({})} />

          {/* result count + list */}
          <div className="flex items-center justify-between px-4 pb-1 pt-2">
            <p className="text-[12px] text-[var(--color-muted)]">
              <span className="font-semibold text-[var(--color-fg)]">{appliedResults.length}</span> of {PRODUCTS.length} items
            </p>
            <span className="rounded-full bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted)]">
              Demo data
            </span>
          </div>

          <ul className="space-y-2 overflow-y-auto px-3 pb-4" style={{ maxHeight: 470 }}>
            {appliedResults.length === 0 ? (
              <li className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-[13px] text-[var(--color-muted)]">
                No products match these filters.
              </li>
            ) : (
              appliedResults.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 shadow-[var(--shadow-sm)]"
                >
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-[15px] font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, hsl(${(p.price * 3) % 360} 65% 55%), hsl(${(p.price * 3 + 40) % 360} 65% 45%))` }}
                    aria-hidden
                  >
                    {p.name.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-[var(--color-fg)]">{p.name}</span>
                    <span className="block truncate text-[12px] text-[var(--color-muted)]">
                      {OWNER_NAME[p.owner]} · {p.tag}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[13.5px] font-semibold tabular-nums text-[var(--color-fg)]">${p.price}</span>
                    <StatusPill status={p.status} />
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Working controls */}
      <div className="w-full max-w-[380px] space-y-3 text-left lg:pt-4">
        <p className="text-[13px] font-medium text-[var(--color-fg)]">Try the workflow</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn} onClick={() => setOpen(true)}>Open filters</button>
          <button type="button" className={btn} onClick={simulateLoading}>Simulate loading</button>
          <button type="button" className={btn} onClick={simulateError}>Simulate error</button>
          <button type="button" className={btn} onClick={() => setApplied({})}>Clear all</button>
          <button type="button" className={btn} onClick={resetDemo}>Reset demo</button>
        </div>
        <div>
          <p className="mb-1 text-[12px] text-[var(--color-muted)]">Surface</p>
          <div className="inline-flex overflow-hidden rounded-lg border border-[var(--color-border)]" role="group" aria-label="Sheet mode">
            {(["sheet", "fullscreen", "panel"] as const).map((m) => (
              <button key={m} type="button" data-on={mode === m} aria-pressed={mode === m} className={seg} onClick={() => setMode(m)}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <p className="max-w-[42ch] text-[12px] leading-relaxed text-[var(--color-muted)]">
          Editing changes a <strong className="font-medium text-[var(--color-fg)]">draft</strong>. Apply commits it (the
          list + count update); Cancel restores the last applied set. With unsaved edits, closing asks to confirm. The
          <strong className="font-medium text-[var(--color-fg)]"> panel</strong> surface is the desktop fallback.
        </p>
      </div>
    </div>
  );
}

function ChipsBar({ applied, onClear }: { applied: FilterValue; onClear: () => void }) {
  const chips: string[] = [];
  const status = (applied.status as string[] | undefined) ?? [];
  status.forEach((s) => chips.push(s[0].toUpperCase() + s.slice(1)));
  const category = (applied.category as string[] | undefined) ?? [];
  category.forEach((c) => chips.push(c[0].toUpperCase() + c.slice(1)));
  const owner = applied.owner as string | null | undefined;
  if (owner) chips.push(OWNER_NAME[owner as Product["owner"]] ?? owner);
  const price = applied.price as { min: number; max: number } | undefined;
  if (price && (price.min > 0 || price.max < 200)) chips.push(`$${price.min}–$${price.max}`);
  const updated = applied.updated as { from: string | null; to: string | null } | undefined;
  if (updated?.from || updated?.to) chips.push(`${updated?.from ?? "…"} → ${updated?.to ?? "…"}`);

  if (chips.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2">
      {chips.map((c, i) => (
        <span
          key={`${c}-${i}`}
          className="shrink-0 whitespace-nowrap rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-fg)]"
        >
          {c}
        </span>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="ml-auto shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-medium text-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
      >
        Clear all
      </button>
    </div>
  );
}

function StatusPill({ status }: { status: Product["status"] }) {
  const tone =
    status === "active" ? "var(--color-success)" : status === "draft" ? "var(--color-warning)" : "var(--color-neutral)";
  return (
    <span
      className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] font-medium capitalize"
      style={{ color: tone }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} aria-hidden />
      {status}
    </span>
  );
}
