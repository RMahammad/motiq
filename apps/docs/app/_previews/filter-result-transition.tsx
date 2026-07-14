"use client";

import * as React from "react";

import {
  FilterResultTransition,
  type ActiveFilter,
  type FilterLayout,
} from "@/registry/data/filter-result-transition";

/* Clearly-fictional asset browser. Data is illustrative demo data. */

interface Asset {
  id: string;
  name: string;
  kind: string;
  category: (typeof CATEGORIES)[number];
  status: (typeof STATUSES)[number];
  owner: string;
  updated: string;
}

const CATEGORIES = ["Design", "Engineering", "Marketing", "Research"] as const;
const STATUSES = ["active", "draft", "archived"] as const;

const STATUS_META: Record<(typeof STATUSES)[number], { label: string; tone: string }> = {
  active: { label: "Active", tone: "var(--color-success)" },
  draft: { label: "Draft", tone: "var(--color-warning)" },
  archived: { label: "Archived", tone: "var(--color-muted)" },
};

// Deterministic module-scope dataset — identical on server + first client render.
const ASSETS: Asset[] = [
  { id: "as_01", name: "Onboarding flow", kind: "Prototype", category: "Design", status: "active", owner: "Mara", updated: "2h ago" },
  { id: "as_02", name: "Pricing page hero", kind: "Figma", category: "Design", status: "draft", owner: "Ivo", updated: "1d ago" },
  { id: "as_03", name: "Auth service", kind: "Repository", category: "Engineering", status: "active", owner: "Nadia", updated: "20m ago" },
  { id: "as_04", name: "Edge cache rollout", kind: "RFC", category: "Engineering", status: "draft", owner: "Ken", updated: "3h ago" },
  { id: "as_05", name: "Q3 launch brief", kind: "Doc", category: "Marketing", status: "active", owner: "Priya", updated: "5h ago" },
  { id: "as_06", name: "Lifecycle emails", kind: "Campaign", category: "Marketing", status: "archived", owner: "Tom", updated: "6d ago" },
  { id: "as_07", name: "Churn analysis", kind: "Notebook", category: "Research", status: "active", owner: "Sol", updated: "45m ago" },
  { id: "as_08", name: "Pricing survey", kind: "Study", category: "Research", status: "draft", owner: "Wren", updated: "2d ago" },
  { id: "as_09", name: "Design tokens v3", kind: "Package", category: "Design", status: "active", owner: "Mara", updated: "8h ago" },
  { id: "as_10", name: "Search ranking model", kind: "Model", category: "Engineering", status: "archived", owner: "Nadia", updated: "3w ago" },
  { id: "as_11", name: "Brand refresh deck", kind: "Slides", category: "Marketing", status: "draft", owner: "Ivo", updated: "1d ago" },
  { id: "as_12", name: "Retention cohorts", kind: "Dashboard", category: "Research", status: "active", owner: "Sol", updated: "12h ago" },
];

type DemoState = "idle" | "loading" | "error";

export function FilterResultTransitionPreview() {
  const [query, setQuery] = React.useState("");
  const [cats, setCats] = React.useState<Set<string>>(() => new Set());
  const [stats, setStats] = React.useState<Set<string>>(() => new Set());
  const [layout, setLayout] = React.useState<FilterLayout>("grid");
  const [state, setState] = React.useState<DemoState>("idle");
  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  const [starred, setStarred] = React.useState<Set<string>>(() => new Set());

  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const errorTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
      if (loadTimer.current) clearTimeout(loadTimer.current);
    },
    [],
  );

  const items = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return ASSETS.filter((a) => {
      if (cats.size && !cats.has(a.category)) return false;
      if (stats.size && !stats.has(a.status)) return false;
      if (q && !(`${a.name} ${a.kind} ${a.owner}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [query, cats, stats]);

  const activeFilters = React.useMemo<ActiveFilter[]>(() => {
    const list: ActiveFilter[] = [];
    if (query.trim()) list.push({ id: "q", group: "Search", label: query.trim() });
    for (const c of CATEGORIES) if (cats.has(c)) list.push({ id: `cat:${c}`, group: "Category", label: c });
    for (const s of STATUSES) if (stats.has(s)) list.push({ id: `status:${s}`, group: "Status", label: STATUS_META[s].label });
    return list;
  }, [query, cats, stats]);

  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) =>
    set((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });

  const removeFilter = (f: ActiveFilter) => {
    if (f.id === "q") setQuery("");
    else if (f.id.startsWith("cat:")) toggle(setCats, f.id.slice(4));
    else if (f.id.startsWith("status:")) toggle(setStats, f.id.slice(7));
  };

  const clearAll = () => {
    setQuery("");
    setCats(new Set());
    setStats(new Set());
  };

  const reset = () => {
    clearAll();
    setState("idle");
    setStarred(new Set());
  };

  const simulateLoading = () => {
    setState("loading");
    if (loadTimer.current) clearTimeout(loadTimer.current);
    loadTimer.current = setTimeout(() => setState("idle"), 1400);
  };

  const simulateError = () => {
    setState("error");
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setState("idle"), 2600);
  };

  return (
    <div className="flex w-full max-w-[860px] flex-col gap-4">
      {/* Search + layout toolbar --------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex min-w-[220px] flex-1 items-center">
          <span className="pointer-events-none absolute left-3 text-[var(--color-muted)]" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
              <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets, owners, types…"
            aria-label="Search assets"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-2 pl-9 pr-3 text-[14px] text-[var(--color-fg)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)]"
          />
        </div>
        <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)]" role="group" aria-label="Layout">
          {(["grid", "cards", "list"] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={layout === l}
              onClick={() => setLayout(l)}
              className={`px-2.5 py-1.5 text-[12px] font-medium capitalize transition-colors ${
                layout === l ? "bg-[var(--color-surface)] text-[var(--color-fg)]" : "text-[var(--color-muted)] hover:text-[var(--color-fg)]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Filter chips -------------------------------------------------------- */}
      <div className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
        <FilterRow label="Category">
          {CATEGORIES.map((c) => (
            <Chip key={c} on={cats.has(c)} onClick={() => toggle(setCats, c)}>
              {c}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Status">
          {STATUSES.map((s) => (
            <Chip key={s} on={stats.has(s)} onClick={() => toggle(setStats, s)} dot={STATUS_META[s].tone}>
              {STATUS_META[s].label}
            </Chip>
          ))}
        </FilterRow>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Action onClick={clearAll} disabled={activeFilters.length === 0}>Clear</Action>
          <Action onClick={simulateLoading}>Simulate loading</Action>
          <Action onClick={simulateError}>Simulate error</Action>
          <Action onClick={reset}>Reset</Action>
        </div>
      </div>

      {/* The component ------------------------------------------------------- */}
      <FilterResultTransition<Asset>
        items={items}
        getItemId={(a) => a.id}
        layout={layout}
        state={state}
        query={query.trim() || undefined}
        activeFilters={activeFilters}
        onRemoveFilter={removeFilter}
        onClearFilters={clearAll}
        focusedItemId={focusedId}
        onRetry={() => setState("idle")}
        error="Couldn’t reach the asset service. Check your connection and try again."
        emptyGuidance="Try a different search term or remove a filter to widen the results."
        // When the focused card is filtered out, send focus somewhere stable
        // (the search box) instead of letting it fall to the page root.
        onFocusFallback={() => searchRef.current?.focus()}
        renderItem={(a, { focused }) => (
          <button
            type="button"
            aria-pressed={starred.has(a.id)}
            onFocus={() => setFocusedId(a.id)}
            onBlur={() => setFocusedId((cur) => (cur === a.id ? null : cur))}
            onClick={() => toggle(setStarred, a.id)}
            className={`group flex w-full flex-col gap-2 rounded-xl border bg-[var(--color-surface)] p-3.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${
              focused ? "border-[var(--color-accent)]" : "border-[var(--color-border)] hover:border-[var(--color-accent)]"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-semibold text-[var(--color-fg)]">{a.name}</span>
                <span className="block text-[12px] text-[var(--color-muted)]">
                  {a.kind} · {a.owner}
                </span>
              </span>
              <span
                className={`shrink-0 text-[13px] leading-none transition-opacity ${starred.has(a.id) ? "opacity-100" : "opacity-30 group-hover:opacity-70"}`}
                style={{ color: starred.has(a.id) ? "var(--color-warning)" : "var(--color-muted)" }}
                aria-hidden
              >
                {starred.has(a.id) ? "★" : "☆"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-muted)]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_META[a.status].tone }} aria-hidden />
                {STATUS_META[a.status].label}
                <span className="sr-only">status</span>
              </span>
              <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-muted)]">
                {a.category}
              </span>
            </div>
            <span className="text-[11px] text-[var(--color-muted)]">Updated {a.updated}</span>
          </button>
        )}
      />

      <p className="text-[12px] text-[var(--color-muted)]">
        Demo data — fictional assets, illustrative values. Focus a card, then filter it out: focus returns to the search box.
      </p>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-[68px] shrink-0 text-[12px] font-medium text-[var(--color-muted)]">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  children,
  on,
  onClick,
  dot,
}: {
  children: React.ReactNode;
  on: boolean;
  onClick: () => void;
  dot?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${
        on
          ? "border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] text-[var(--color-accent)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:border-[var(--color-accent)]"
      }`}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} aria-hidden /> : null}
      {children}
    </button>
  );
}

function Action({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
