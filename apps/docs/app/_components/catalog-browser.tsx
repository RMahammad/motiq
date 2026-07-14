"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  catalog,
  categories,
  categoryCount,
  searchCatalog,
  kindOf,
  type CategoryId,
  type Access,
} from "../../lib/catalog";
import { CatalogCard } from "./catalog-card";

type Sort = "default" | "recent";

export function CatalogBrowser() {
  const router = useRouter();
  const params = useSearchParams();

  const category = (params.get("category") as CategoryId | null) ?? null;
  const access = (params.get("access") as Access | "all" | null) ?? "all";
  const kind = (params.get("kind") as "component" | "block" | "pack" | "all" | null) ?? "all";
  const sort = (params.get("sort") as Sort | null) ?? "default";
  const [query, setQuery] = React.useState(params.get("q") ?? "");

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

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
      active
        ? "border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] text-[var(--color-accent)]"
        : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-fg)]"
    }`;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight text-[var(--color-fg)]">Components</h1>
        <p className="mt-2 text-[15px] text-[var(--color-muted)]">
          {catalog.length} animated components · preview live, install as editable source.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Sidebar / filters */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setParam("q", e.target.value);
            }}
            placeholder="Search…"
            className="mb-4 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[14px] text-[var(--color-fg)] outline-none placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)]"
          />

          <div className="-mx-1 flex gap-2 overflow-x-auto pb-2 lg:mx-0 lg:flex-col lg:overflow-visible">
            <button onClick={() => setParam("category", null)} className={chip(!category)}>
              All ({catalog.length})
            </button>
            {categories.map((c) => (
              <button key={c.id} onClick={() => setParam("category", c.id)} className={chip(category === c.id)}>
                {c.label} ({categoryCount(c.id)})
              </button>
            ))}
          </div>

          <div className="mt-4 hidden gap-2 lg:flex lg:flex-col">
            <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-muted)]">Access</p>
            <div className="flex gap-2">
              {(["all", "free", "pro"] as const).map((a) => (
                <button key={a} onClick={() => setParam("access", a)} className={chip(access === a)}>
                  {a === "all" ? "All" : a === "free" ? "Free" : "Pro"}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-[var(--color-muted)]">Type</p>
            <div className="flex gap-2">
              {(["all", "component", "block", "pack"] as const).map((k) => (
                <button key={k} onClick={() => setParam("kind", k)} className={chip(kind === k)}>
                  {k === "all" ? "All" : k[0].toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[12px] font-medium uppercase tracking-wide text-[var(--color-muted)]">Sort</p>
            <div className="flex gap-2">
              <button onClick={() => setParam("sort", "default")} className={chip(sort === "default")}>
                Default
              </button>
              <button onClick={() => setParam("sort", "recent")} className={chip(sort === "recent")}>
                Recently added
              </button>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div>
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
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((item) => (
                <CatalogCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
