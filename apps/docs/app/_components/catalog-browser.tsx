"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Link from "next/link";

import {
  catalog,
  categories,
  categoryCount,
  itemsByCategory,
  searchCatalog,
  kindOf,
  resolvePresentation,
  packSpans,
  SPAN_CLASS,
  type CategoryId,
  type Category,
  type CatalogItem,
} from "../../lib/catalog";
import { CatalogCard } from "./catalog-card";
import { NavSheet } from "./nav-sheet";
import { NavChevron, NavCount, NavGroupLabel, navChildClass, navChildListClass, navRowClass } from "./sidebar-nav";

type Sort = "default" | "recent";

/** Sidebar groups — the same grouping the component-docs rail uses, so the two
    navigations read as one system (docs/56 §8). */
const NAV_GROUPS: { label: string; ids: CategoryId[] }[] = [
  {
    label: "Product workflows",
    ids: [
      "ai",
      "developer-tools",
      "collaboration",
      "data-motion",
      "file",
      "commerce",
      "security",
      "communication",
      "productivity",
    ],
  },
  { label: "Environments", ids: ["product-backgrounds", "workflow-heroes"] },
  { label: "Creative", ids: ["text", "backgrounds", "creative", "mobile", "animated-shadcn", "icons"] },
  { label: "Showpieces", ids: ["cursor", "media", "scroll"] },
];

// Row packing + span classes are shared from lib/catalog (also used by the homepage).
const catById = new Map(categories.map((c) => [c.id, c]));

export function CatalogBrowser() {
  const router = useRouter();
  const params = useSearchParams();

  const category = (params.get("category") as CategoryId | null) ?? null;
  const featuredOnly = params.get("featured") === "1";
  const kind = (params.get("kind") as "component" | "block" | "pack" | "all" | null) ?? "all";
  const sort = (params.get("sort") as Sort | null) ?? "default";
  const [query, setQuery] = React.useState(params.get("q") ?? "");
  const [drawerOpen, setDrawerOpen] = React.useState(false);

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
  if (featuredOnly) results = results.filter((c) => c.featured);
  if (kind !== "all") results = results.filter((c) => kindOf(c) === kind);
  if (sort === "recent") results = [...results].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));

  // Group by category unless searching or sorting by recency (those want flat relevance/recency order).
  const grouped = !query && sort === "default";

  const chip = (active: boolean) =>
    `rounded-full border px-2.5 py-1 text-[12.5px] transition-colors ${
      active
        ? "border-[color-mix(in_oklab,var(--color-accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] text-[var(--color-accent-text)]"
        : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[color-mix(in_oklab,var(--color-fg)_22%,var(--color-border))] hover:text-[var(--color-fg)]"
    }`;

  const filters = (
    <div className="flex flex-col gap-4 text-[13.5px]">
      {/* Search — the calm, neutral chrome of the docs rail's search trigger.
          This one filters the grid inline rather than opening the palette. */}
      <div className="relative">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setParam("q", e.target.value);
          }}
          placeholder="Search"
          aria-label="Search components"
          data-noring
          style={{ boxShadow: "none" }}
          className="w-full rounded-md border border-[var(--color-border)] bg-transparent py-1.5 pl-8 pr-2.5 text-[13px] text-[var(--color-fg)] outline-none transition-colors placeholder:text-[var(--color-muted)] hover:border-[color-mix(in_oklab,var(--color-fg)_22%,var(--color-border))] focus-visible:border-[color-mix(in_oklab,var(--color-fg)_38%,var(--color-border))]"
        />
      </div>

      <nav aria-label="Component categories">
        <ul className="space-y-0.5">
          <li>
            <button type="button" onClick={() => setParam("category", null)} className={navRowClass(!category)}>
              <span>All components</span>
              <NavCount>{catalog.length}</NavCount>
            </button>
          </li>
        </ul>

        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mt-5">
            <NavGroupLabel>{group.label}</NavGroupLabel>
            <ul>
              {group.ids.map((id) => {
                const c = catById.get(id);
                if (!c) return null;
                const n = categoryCount(id);
                if (!n) return null;
                // The selected category is also the expanded one: one click
                // filters the grid and reveals what is inside it.
                const active = category === id;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      aria-expanded={active}
                      onClick={() => {
                        setParam("category", active ? null : id);
                        setDrawerOpen(false);
                      }}
                      className={navRowClass(active)}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <NavChevron open={active} />
                        <span className="truncate">{c.label}</span>
                      </span>
                      <NavCount>{n}</NavCount>
                    </button>
                    {active ? (
                      <ul className={navChildListClass}>
                        {itemsByCategory(id).map((item) => (
                          <li key={item.slug}>
                            <Link href={item.documentationPath} className={navChildClass(false)}>
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-1 flex flex-col gap-3 border-t border-[var(--color-border)] pt-4">
        <div>
          <NavGroupLabel>Highlight</NavGroupLabel>
          <div className="flex flex-wrap gap-2 px-2.5">
            <button onClick={() => setParam("featured", null)} className={chip(!featuredOnly)}>
              All
            </button>
            <button onClick={() => setParam("featured", "1")} className={chip(featuredOnly)}>
              Featured
            </button>
          </div>
        </div>
        <div>
          <NavGroupLabel>Type</NavGroupLabel>
          <div className="flex flex-wrap gap-2 px-2.5">
            {(["all", "component", "block", "pack"] as const).map((k) => (
              <button key={k} onClick={() => setParam("kind", k)} className={chip(kind === k)}>
                {k === "all" ? "All" : k[0].toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <NavGroupLabel>Sort</NavGroupLabel>
          <div className="flex flex-wrap gap-2 px-2.5">
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

      {/* Mobile controls — the component-docs sub-header pattern: a sticky,
          blurred bar whose button opens the SAME slide-in sheet, instead of the
          old panel that expanded inline and pushed the grid down. */}
      <div className="sticky top-14 z-30 -mx-4 mb-6 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg)_92%,transparent)] px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Browse
          {category ? (
            <span className="text-[var(--color-accent-text)]">· {catById.get(category)?.label}</span>
          ) : null}
        </button>
      </div>

      <NavSheet open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Browse components">
        {filters}
      </NavSheet>

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
        {/* Sidebar — sticky, own bounded scroll, never determines section height. */}
        <aside className="hidden lg:block">
          <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto py-2 pr-3">{filters}</div>
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
