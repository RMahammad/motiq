"use client";

import * as React from "react";
import Link from "next/link";

import { bySlug, accessLabel } from "../../lib/catalog";
import { installCommand } from "../../lib/product";
import { InstallCommand } from "./code-block";
import { Preview } from "../_previews";

/**
 * Homepage hero showcase (docs/60 rebuild). One large browser-style frame that
 * showcases the REAL catalog components — LIVE. It renders each component's
 * interactive detail preview (the same one on its docs page): animations play
 * and the component's own controls work, so a visitor drives a real component
 * from the very first interaction — this is a live product demo, not a static
 * thumbnail. A category tab row + a component picker browse the catalog
 * best-first, while exactly ONE component is shown prominently at a time.
 *
 * Replaces the old floating multi-card auto-advancing rail. No carousel, no
 * four-equal-cards, no frozen mock screens.
 *
 * Accessibility:
 *  - Category row is a WAI-ARIA `tablist` (roving tabindex, Left/Right/Home/End).
 *  - The component picker is a labelled group of toggle buttons that swap the
 *    single canvas panel.
 *  - Animations respect prefers-reduced-motion inside each component; the canvas
 *    swap collapses to its final state (globals.css).
 */

type CategoryTab = {
  id: string;
  label: string;
  tint: string;
  /** Component slugs, ordered best / most sellable first. */
  slugs: string[];
};

// Curated best-of, grouped by the strongest product families. Order = sellability.
// Individual components only (their detail previews are live + interactive).
const TABS: CategoryTab[] = [
  { id: "ai", label: "AI Interfaces", tint: "#8b7bff", slugs: ["ai-response-stream", "agent-run-timeline", "tool-call-activity", "prompt-composer"] },
  { id: "dev", label: "Developer Tools", tint: "#5b9dff", slugs: ["deployment-pipeline", "live-log-stream", "api-request-inspector", "webhook-event-stream"] },
  { id: "data", label: "Data & Dashboards", tint: "#31c5f0", slugs: ["streaming-data-rows", "kpi-number-morph", "data-refresh-state", "data-quality-status"] },
  { id: "collab", label: "Collaboration", tint: "#f0b000", slugs: ["live-presence-stack", "comment-thread", "approval-workflow", "activity-stream"] },
  { id: "prod", label: "Productivity", tint: "#fb8c4b", slugs: ["kanban-card-movement", "task-dependency-map", "project-timeline"] },
];

// Wide, tabular, board, timeline and dashboard components read best FULL-WIDTH
// (fill the canvas, small padding). Everything else — chat, cards, forms, small
// stats — stays CENTERED at its natural reading width. The `[&_>_*]` override
// relaxes the preview's own max-width only for the full-width set.
const FULL_WIDTH = new Set<string>([
  "kanban-card-movement",
  "task-dependency-map",
  "project-timeline",
  "streaming-data-rows",
  "data-refresh-state",
  "data-quality-status",
  "api-request-inspector",
  "webhook-event-stream",
  "live-log-stream",
  "kpi-number-morph",
]);

export function HeroShowcase() {
  const [tabIndex, setTabIndex] = React.useState(0);
  const [itemIndex, setItemIndex] = React.useState(0);
  const [replay, setReplay] = React.useState(0);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const tab = TABS[tabIndex];
  const slug = tab.slugs[itemIndex] ?? tab.slugs[0];
  const item = bySlug.get(slug);

  const selectTab = React.useCallback((i: number) => {
    setTabIndex(i);
    setItemIndex(0); // jump to the category's strongest component
    setReplay((r) => r + 1);
  }, []);

  const selectItem = React.useCallback((i: number) => {
    setItemIndex(i);
    setReplay((r) => r + 1);
  }, []);

  const onTabKeyDown = (e: React.KeyboardEvent) => {
    let next = tabIndex;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (tabIndex + 1) % TABS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (tabIndex - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    else return;
    e.preventDefault();
    selectTab(next);
    tabRefs.current[next]?.focus();
  };

  if (!item) return null;
  const full = FULL_WIDTH.has(slug);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div
        data-hero-frame
        className="overflow-hidden rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-lg)]"
        style={{ ["--tint" as string]: tab.tint }}
      >
        {/* ---- Browser toolbar: dots · category tabs ---- */}
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:px-5">
          <div className="hidden shrink-0 items-center gap-1.5 sm:flex" aria-hidden>
            <span className="h-3 w-3 rounded-full bg-[color-mix(in_oklab,var(--color-fg)_14%,transparent)]" />
            <span className="h-3 w-3 rounded-full bg-[color-mix(in_oklab,var(--color-fg)_14%,transparent)]" />
            <span className="h-3 w-3 rounded-full bg-[color-mix(in_oklab,var(--color-fg)_14%,transparent)]" />
          </div>
          <span className="hidden h-5 w-px shrink-0 bg-[var(--color-border)] sm:block" aria-hidden />

          <div
            role="tablist"
            aria-label="Showcase categories"
            aria-orientation="horizontal"
            onKeyDown={onTabKeyDown}
            className="hero-tabs -mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1"
          >
            {TABS.map((t, i) => {
              const selected = i === tabIndex;
              return (
                <button
                  key={t.id}
                  ref={(el) => { tabRefs.current[i] = el; }}
                  type="button"
                  role="tab"
                  id={`hero-tab-${t.id}`}
                  aria-selected={selected}
                  aria-controls="hero-canvas"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectTab(i)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
                    selected
                      ? "bg-[color-mix(in_oklab,var(--tint)_16%,var(--color-surface))] text-[var(--color-fg)]"
                      : "text-[var(--color-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)]"
                  }`}
                  style={selected ? { boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--tint) 40%, transparent)" } : undefined}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- Component picker for the selected category (best-first) ---- */}
        <div
          role="group"
          aria-label={`Components in ${tab.label}`}
          className="hero-tabs flex items-center gap-1.5 overflow-x-auto border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_60%,var(--color-surface-raised))] px-4 py-2.5 sm:px-5"
        >
          {tab.slugs.map((s, i) => {
            const it = bySlug.get(s);
            if (!it) return null;
            const on = i === itemIndex;
            const pro = it.access === "pro";
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => selectItem(i)}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
                  on
                    ? "border border-[color-mix(in_oklab,var(--tint)_45%,var(--color-border))] bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-sm)]"
                    : "border border-transparent text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-fg)]"
                }`}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: on ? tab.tint : "var(--color-border)" }} aria-hidden />
                {it.name}
                {pro ? (
                  <span className="rounded px-1 py-px text-[9.5px] font-bold uppercase tracking-wide text-[var(--color-accent-text)]">Pro</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* ---- Canvas: exactly one REAL component, live + interactive ---- */}
        <div
          id="hero-canvas"
          role="tabpanel"
          aria-labelledby={`hero-tab-${tab.id}`}
          className={`relative flex flex-col justify-center ${
            full ? "px-3 py-6 sm:px-4 sm:py-8" : "px-4 py-8 sm:px-8 sm:py-10"
          }`}
          style={{
            minHeight: "clamp(420px, 42vw, 520px)",
            background:
              "radial-gradient(120% 85% at 50% -10%, color-mix(in oklab, var(--tint) 6%, var(--color-surface-raised)), var(--color-surface-raised))",
          }}
        >
          {/* Keyed remount replays entrance animations + resets the component's
              own controls when you switch component or category. Full-width items
              relax the preview's built-in max-width so they fill the canvas. */}
          <div
            key={`${slug}-${replay}`}
            className={`hero-swap-in flex w-full flex-col items-center ${full ? "[&>*]:!max-w-none [&>*]:!w-full" : ""}`}
          >
            <Preview id={item.id} />
          </div>
        </div>

        {/* ---- Canvas footer: what's shown + Replay control + install ---- */}
        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: tab.tint }} aria-hidden />
            <Link href={item.documentationPath} className="truncate text-[13.5px] font-semibold text-[var(--color-fg)] hover:text-[var(--color-accent-text)]">
              {item.name}
            </Link>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${
                item.access === "pro"
                  ? "bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] text-[var(--color-accent-text)]"
                  : "bg-[var(--color-bg-secondary)] text-[var(--color-muted)]"
              }`}
            >
              {accessLabel[item.access]}
            </span>
          </div>
          <div className="min-w-0 sm:ml-auto sm:max-w-[440px] sm:flex-1">
            <InstallCommand command={installCommand(item.registryItem)} trackEvent="free_install_copied" trackProps={{ item: item.slug }} />
          </div>
        </div>
      </div>
    </div>
  );
}
