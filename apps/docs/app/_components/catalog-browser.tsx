"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  catalog,
  categories,
  categoryCount,
  searchCatalog,
  kindOf,
  resolvePresentation,
  packSpans,
  SPAN_CLASS,
  type CategoryId,
  type Category,
  type Access,
  type CatalogItem,
} from "../../lib/catalog";
import { CatalogCard } from "./catalog-card";

type Sort = "default" | "recent";

/** Sidebar groups — compact, scannable discovery (docs/56 §8). */
const NAV_GROUPS: { label: string; ids: CategoryId[] }[] = [
  { label: "Product environments", ids: ["product-backgrounds", "workflow-heroes"] },
  {
    label: "Product workflows",
    ids: [
      "ai",
      "developer-tools",
      "collaboration",
      "data-motion",
      "productivity",
      "file",
      "commerce",
      "security",
      "communication",
    ],
  },
  { label: "Creative", ids: ["text", "backgrounds", "creative"] },
  { label: "Mobile", ids: ["mobile"] },
  { label: "Foundations", ids: ["animated-shadcn", "icons"] },
];

// Row packing + span classes are shared from lib/catalog (also used by the homepage).
const catById = new Map(categories.map((c) => [c.id, c]));

export function CatalogBrowser() {
  const router = useRouter();
  const params = useSearchParams();

  const category = (params.get("category") as CategoryId | null) ?? null;
  const access = (params.get("access") as Access | "all" | null) ?? "all";
  const kind = (params.get("kind") as "component" | "block" | "pack" | "all" | null) ?? "all";
  const sort = (params.get("sort") as Sort | null) ?? "default";
  const [query, setQuery] = React.useState(params.get("q") ?? "");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});

  const setParam = React.useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "" || value === "all") next.delete(key);
      else next.set(key, value);
      router.replace(`/components${next.toString() ? `?${next.toString()}` : ""}`, { scroll: false });
    },
    [params, router],
  );

  let results = query ? searchCatalog(query) : catalog;
  if (category) results = results.filter((c) => c.category === category);
  if (access !== "all") results = results.filter((c) => c.access === access);
  if (kind !== "all") results = results.filter((c) => kindOf(c) === kind);
  if (sort === "recent") results = [...results].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));

  // Group by category unless searching or sorting by recency (those want flat relevance/recency order).
  const grouped = !query && sort === "default";

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
      active
        ? "border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] text-[var(--color-accent)]"
        : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-fg)]"
    }`;

  const filters = (
    <div className="flex flex-col gap-4">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setParam("q", e.target.value);
        }}
        placeholder="Search components…"
        aria-label="Search components"
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[14px] text-[var(--color-fg)] outline-none placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)]"
      />

      {/* Category groups with counts + active highlight + collapsible headers. */}
      <nav className="flex flex-col gap-3" aria-label="Component categories">
        <button
          onClick={() => setParam("category", null)}
          className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[13.5px] font-medium transition-colors ${
            !category
              ? "bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] text-[var(--color-accent)]"
              : "text-[var(--color-fg)] hover:bg-[var(--color-bg-secondary)]"
          }`}
        >
          <span>All components</span>
          <span className="text-[12px] tabular-nums text-[var(--color-muted)]">{catalog.length}</span>
        </button>

        {NAV_GROUPS.map((group) => {
          const isCollapsed = collapsed[group.label];
          return (
            <div key={group.label}>
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [group.label]: !c[group.label] }))}
                className="flex w-full items-center justify-between px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]"
                aria-expanded={!isCollapsed}
              >
                {group.label}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={isCollapsed ? "-rotate-90" : ""} aria-hidden>
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {!isCollapsed && (
                <ul className="mt-0.5">
                  {group.ids.map((id) => {
                    const c = catById.get(id);
                    if (!c) return null;
                    const n = categoryCount(id);
                    if (n === 0) return null;
                    const active = category === id;
                    return (
                      <li key={id}>
                        <button
                          onClick={() => {
                            setParam("category", id);
                            setDrawerOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[13.5px] transition-colors ${
                            active
                              ? "bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] font-medium text-[var(--color-accent)]"
                              : "text-[var(--color-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)]"
                          }`}
                        >
                          <span className="truncate">{c.label}</span>
                          <span className="ml-2 text-[12px] tabular-nums opacity-70">{n}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-4">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Tier</p>
          <div className="flex flex-wrap gap-2">
            {(["all", "free", "pro"] as const).map((a) => (
              <button key={a} onClick={() => setParam("access", a)} className={chip(access === a)}>
                {a === "all" ? "All" : a === "free" ? "Free" : "Pro"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Type</p>
          <div className="flex flex-wrap gap-2">
            {(["all", "component", "block", "pack"] as const).map((k) => (
              <button key={k} onClick={() => setParam("kind", k)} className={chip(kind === k)}>
                {k === "all" ? "All" : k[0].toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Sort</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setParam("sort", "default")} className={chip(sort === "default")}>
              Curated
            </button>
            <button onClick={() => setParam("sort", "recent")} className={chip(sort === "recent")}>
              Recently added
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1680px] px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight text-[var(--color-fg)]">Components</h1>
        <p className="mt-2 text-[15px] text-[var(--color-muted)]">
          {catalog.length} animated components · preview live, install as editable source.
        </p>
      </header>

      {/* Mobile filter trigger (drawer below lg). */}
      <div className="mb-4 lg:hidden">
        <button
          onClick={() => setDrawerOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-fg)]"
          aria-expanded={drawerOpen}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Filters
          {category ? <span className="text-[var(--color-accent)]">· {catById.get(category)?.label}</span> : null}
        </button>
        {drawerOpen && (
          <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">{filters}</div>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
        {/* Sidebar — sticky, own bounded scroll, never determines section height. */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">{filters}</div>
        </aside>

        {/* Results */}
        <div className="min-w-0">
          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-16 text-center">
              <p className="text-[15px] text-[var(--color-fg)]">No components match your filters.</p>
              <button
                onClick={() => router.replace("/components")}
                className="mt-3 text-[14px] font-medium text-[var(--color-accent)] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : grouped ? (
            <GroupedResults items={results} />
          ) : (
            <CardGrid items={results} />
          )}
        </div>
      </div>
    </div>
  );
}

function CardGrid({ items }: { items: CatalogItem[] }) {
  const spans = packSpans(items);
  return (
    <div className="grid grid-cols-12 items-start gap-5">
      {items.map((item) => (
        <div key={item.id} className={SPAN_CLASS[spans.get(item.id) ?? resolvePresentation(item).cardSpan]}>
          <CatalogCard item={item} />
        </div>
      ))}
    </div>
  );
}

function GroupedResults({ items }: { items: CatalogItem[] }) {
  // Preserve catalog order within each category; order sections by first appearance.
  const order: CategoryId[] = [];
  const byCat = new Map<CategoryId, CatalogItem[]>();
  for (const it of items) {
    if (!byCat.has(it.category)) {
      byCat.set(it.category, []);
      order.push(it.category);
    }
    byCat.get(it.category)!.push(it);
  }

  return (
    <div className="flex flex-col gap-12">
      {order.map((catId) => {
        const cat = catById.get(catId) as Category;
        const group = byCat.get(catId)!;
        return (
          <section key={catId} aria-labelledby={`sec-${catId}`}>
            <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-[var(--color-border)] pb-2.5">
              <div className="min-w-0">
                <h2 id={`sec-${catId}`} className="text-[17px] font-semibold tracking-tight text-[var(--color-fg)]">
                  {cat?.label ?? catId}
                </h2>
                <p className="mt-0.5 truncate text-[13px] text-[var(--color-muted)]">{cat?.blurb}</p>
              </div>
              <span className="shrink-0 text-[12px] tabular-nums text-[var(--color-muted)]">{group.length}</span>
            </div>
            <CardGrid items={group} />
          </section>
        );
      })}
    </div>
  );
}
