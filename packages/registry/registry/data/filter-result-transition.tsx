"use client";

import * as React from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useAnimatedNumber, formatNumber } from "@/lib/motionkit";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type FilterLayout = "cards" | "list" | "grid";
export type FilterResultState = "idle" | "loading" | "error";

/**
 * One active filter/facet the host applied. `id` is the stable removal key; the
 * host removes it in `onRemoveFilter`. `group` labels the facet (e.g. "Status")
 * so the chip and its accessible name stay unambiguous.
 */
export interface ActiveFilter {
  /** Stable id passed back to `onRemoveFilter` (required). */
  id: string;
  /** Visible chip text (e.g. "Design"). */
  label: string;
  /** Optional facet name shown before the value (e.g. "Category"). */
  group?: string;
}

/** Context handed to `renderItem` for each row. */
export interface RenderItemContext {
  /** Position in the current (post-filter) result set. */
  index: number;
  /** Active layout, in case the card adapts. */
  layout: FilterLayout;
  /** Whether this item matches `focusedItemId`. */
  focused: boolean;
}

/** Context handed to `onFocusFallback` when the focused item disappears. */
export interface FocusFallbackContext<T> {
  /** The id that was focused and is now gone. */
  previousId: string;
  /** The stable results-region anchor (already `tabIndex=-1`). */
  anchor: HTMLElement | null;
  /** The surviving items after the change, for "focus the first result" logic. */
  items: T[];
}

export interface FilterResultTransitionProps<T> {
  /** The already-filtered/sorted items to show — the host owns filtering. */
  items: T[];
  /** Stable identity per item — the key to continuity + focus preservation. */
  getItemId: (item: T) => string;
  /** Render one result. Keep interactive controls inside the card, not nested. */
  renderItem: (item: T, ctx: RenderItemContext) => React.ReactNode;

  /** Card arrangement. `grid` reflows responsively; `list`/`cards` stack. */
  layout?: FilterLayout;

  /** Full override for the count line; receives the *morphing* integer. */
  resultLabel?: (count: number) => React.ReactNode;
  /** Plain-text count for the polite announcement (no nodes). */
  announceLabel?: (count: number, query?: string) => string;
  /** Accessible name for the results region. */
  regionLabel?: string;

  /** Lifecycle owned by the host. `idle` + empty `items` shows the empty state. */
  state?: FilterResultState;
  /** Convenience alias for `state="loading"`. */
  loading?: boolean;
  /** Error body (string or node). Rendered in an alert with an optional retry. */
  error?: React.ReactNode;
  onRetry?: () => void;
  /** Skeleton card count while loading. */
  loadingCount?: number;

  /** Empty-state body; falls back to a sensible default. */
  empty?: React.ReactNode;
  /** Actionable guidance under the empty state (e.g. "Try removing a filter"). */
  emptyGuidance?: React.ReactNode;

  /** Active filters shown as removable chips above the results. */
  activeFilters?: ActiveFilter[];
  onRemoveFilter?: (filter: ActiveFilter) => void;
  onClearFilters?: () => void;
  /** The current query text — surfaced in the empty state + announcement. */
  query?: string;

  /**
   * Id of the item that currently holds keyboard focus in the host. If it
   * disappears after a filter change, `onFocusFallback` fires (or the results
   * anchor is focused) so focus never drops to the page root.
   */
  focusedItemId?: string | null;
  onFocusFallback?: (ctx: FocusFallbackContext<T>) => void;

  /**
   * Max number of newly-entering cards that receive an incremental stagger
   * delay. Larger result deltas past this cap fade in together, so big filter
   * changes never trigger a long cascading animation.
   */
  staggerLimit?: number;
  /** Announce count changes to screen readers (rate-limited). */
  announce?: boolean;

  className?: string;
  /** Extra class on the results container (ul). */
  listClassName?: string;
}

/* -------------------------------------------------------------------------- */
/* Constants + small utilities                                                 */
/* -------------------------------------------------------------------------- */

const EASE = [0.2, 0, 0, 1] as const;
const STAGGER_STEP = 0.035; // seconds between staggered entrances

const LAYOUT_CLASS: Record<FilterLayout, string> = {
  list: "flex flex-col gap-1.5",
  cards: "flex flex-col gap-3",
  grid: "grid grid-cols-[repeat(auto-fill,minmax(min(210px,100%),1fr))] gap-3",
};

function defaultResultLabel(n: number): React.ReactNode {
  return (
    <>
      <span className="tabular-nums [font-variant-numeric:tabular-nums]">{formatNumber(n)}</span>{" "}
      {n === 1 ? "result" : "results"}
    </>
  );
}

function defaultAnnounceLabel(n: number, query?: string): string {
  const core = `${formatNumber(n)} ${n === 1 ? "result" : "results"}`;
  return query ? `${core} for “${query}”` : core;
}

/** Morphs the result integer between filter changes; snaps under reduced motion. */
function ResultCount({
  count,
  suppress,
  label,
}: {
  count: number;
  suppress: boolean;
  label: (n: number) => React.ReactNode;
}) {
  const display = useAnimatedNumber(count, { disabled: suppress, durationMs: 620 });
  return <>{label(Math.round(display))}</>;
}

/* -------------------------------------------------------------------------- */
/* Icons (decorative)                                                          */
/* -------------------------------------------------------------------------- */

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0">
      <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[var(--color-error)]">
      <path
        d="M12 8v5m0 3h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                              */
/* -------------------------------------------------------------------------- */

/**
 * FilterResultTransition — a transition layer for filtered / searched
 * collections. The host owns the data and the filtering; this component
 * presents the *result set* and animates the delta: cards enter, leave, and
 * reorder with continuity, the result count morphs, and empty / loading / error
 * states cross-fade. It is not a data table or a search library.
 *
 * The load-bearing contract is focus: if `focusedItemId` disappears after a
 * filter change, `onFocusFallback` fires (or a stable results anchor is focused)
 * so keyboard focus never silently drops to the page root. Entrance stagger is
 * capped (`staggerLimit`) so large filter changes never cascade, surviving cards
 * keep their DOM node (stable `getItemId`) instead of replaying, results appear
 * synchronously (animation never gates data), and reduced motion is an instant
 * swap. Clean-room original.
 */
export function FilterResultTransition<T>({
  items,
  getItemId,
  renderItem,
  layout = "cards",
  resultLabel,
  announceLabel = defaultAnnounceLabel,
  regionLabel = "Results",
  state = "idle",
  loading = false,
  error,
  onRetry,
  loadingCount = 6,
  empty,
  emptyGuidance,
  activeFilters,
  onRemoveFilter,
  onClearFilters,
  query,
  focusedItemId,
  onFocusFallback,
  staggerLimit = 8,
  announce = true,
  className,
  listClassName,
}: FilterResultTransitionProps<T>) {
  const reduce = useReducedMotion();
  const suppress = reduce;
  const resolvedState: FilterResultState = loading ? "loading" : state;

  const reactId = React.useId();
  const countId = `${reactId}-count`;
  const anchorRef = React.useRef<HTMLHeadingElement | null>(null);

  const ids = React.useMemo(() => items.map(getItemId), [items, getItemId]);
  const idKey = ids.join(" ");
  const count = items.length;

  /* ---- capped entrance stagger: only *new* items get an incremental delay -- */
  const prevIdsRef = React.useRef<Set<string>>(new Set());
  const enterDelays = React.useMemo(() => {
    const prev = prevIdsRef.current;
    const map = new Map<string, number>();
    let newIndex = 0;
    for (const id of ids) {
      if (!prev.has(id)) {
        map.set(id, Math.min(newIndex, staggerLimit) * STAGGER_STEP);
        newIndex += 1;
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idKey, staggerLimit]);

  // Commit the current id set *after* render so the next delta compares against it.
  React.useEffect(() => {
    prevIdsRef.current = new Set(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idKey]);

  /* ---- focus fallback: never let a filtered-out item drop focus to root ---- */
  const hadFocusedRef = React.useRef(false);
  React.useEffect(() => {
    const has = focusedItemId != null && ids.includes(focusedItemId);
    if (hadFocusedRef.current && !has && focusedItemId != null) {
      const ctx: FocusFallbackContext<T> = {
        previousId: focusedItemId,
        anchor: anchorRef.current,
        items,
      };
      if (onFocusFallback) onFocusFallback(ctx);
      else anchorRef.current?.focus();
    }
    hadFocusedRef.current = has;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idKey, focusedItemId]);

  /* ---- rate-limited polite announcement of the settled result count -------- */
  const [announcement, setAnnouncement] = React.useState("");
  React.useEffect(() => {
    if (!announce) return;
    if (resolvedState === "loading") {
      setAnnouncement("Loading results…");
      return;
    }
    if (resolvedState === "error") return; // the alert region already speaks
    const t = setTimeout(() => setAnnouncement(announceLabel(count, query)), 450);
    return () => clearTimeout(t);
  }, [announce, resolvedState, count, query, announceLabel]);

  const label = resultLabel ?? defaultResultLabel;
  const hasFilters = !!activeFilters && activeFilters.length > 0;

  /* ---- results body ------------------------------------------------------- */
  let body: React.ReactNode;
  if (resolvedState === "error") {
    body = (
      <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <AlertIcon />
        <p className="text-[14px] text-[var(--color-fg)]">{error ?? "Something went wrong while loading results."}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus,var(--color-accent))]"
          >
            Try again
          </button>
        ) : null}
      </div>
    );
  } else if (resolvedState === "loading") {
    body = (
      <ul aria-hidden className={cn(LAYOUT_CLASS[layout], listClassName)}>
        {Array.from({ length: loadingCount }).map((_, i) => (
          <li
            key={`skeleton-${i}`}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <span className="block h-4 w-1/2 rounded bg-[var(--color-bg-secondary)] motion-safe:animate-pulse" />
            <span className="mt-2.5 block h-3 w-4/5 rounded bg-[var(--color-bg-secondary)] motion-safe:animate-pulse" />
            <span className="mt-2 block h-3 w-1/3 rounded bg-[var(--color-bg-secondary)] motion-safe:animate-pulse" />
          </li>
        ))}
      </ul>
    );
  } else if (count === 0) {
    body = (
      <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
        <span
          className="mb-1 grid h-11 w-11 place-items-center rounded-full text-[var(--color-muted)]"
          style={{ background: "color-mix(in oklab, var(--color-muted) 14%, transparent)" }}
          aria-hidden
        >
          <SearchIcon />
        </span>
        <p className="text-[14.5px] font-medium text-[var(--color-fg)]">
          {empty ?? (query ? `No results for “${query}”.` : "No results match these filters.")}
        </p>
        <p className="max-w-[42ch] text-[13px] leading-relaxed text-[var(--color-muted)]">
          {emptyGuidance ??
            (hasFilters
              ? "Try removing a filter or broadening your search to see more."
              : "Adjust your search to see matching items.")}
        </p>
        {hasFilters && onClearFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus,var(--color-accent))]"
          >
            Clear all filters
          </button>
        ) : null}
      </div>
    );
  } else {
    body = (
      <LayoutGroup>
        <ul
          className={cn(LAYOUT_CLASS[layout], listClassName)}
          aria-labelledby={countId}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {items.map((item, index) => {
              const id = getItemId(item);
              const focused = id === focusedItemId;
              const delay = suppress ? 0 : (enterDelays.get(id) ?? 0);
              return (
                <motion.li
                  key={id}
                  data-item-id={id}
                  layout={suppress ? false : true}
                  initial={suppress ? false : { opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={suppress ? { opacity: 0 } : { opacity: 0, scale: 0.97, transition: { duration: 0.16, ease: EASE } }}
                  transition={{
                    layout: { duration: 0.32, ease: EASE },
                    duration: 0.28,
                    ease: EASE,
                    delay,
                  }}
                  className="[will-change:transform,opacity]"
                >
                  {renderItem(item, { index, layout, focused })}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </LayoutGroup>
    );
  }

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {/* Rate-limited, polite result-count announcement. */}
      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>

      {/* Header: morphing count + active-filter summary. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3
          id={countId}
          ref={anchorRef}
          tabIndex={-1}
          className="text-[13px] font-semibold text-[var(--color-fg)] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-focus,var(--color-accent))]"
          aria-busy={resolvedState === "loading" || undefined}
        >
          {resolvedState === "loading" ? (
            "Loading…"
          ) : (
            <ResultCount count={count} suppress={suppress} label={label} />
          )}
        </h3>

        {hasFilters ? (
          <div className="flex flex-1 flex-wrap items-center gap-1.5" role="group" aria-label="Active filters">
            <ul className="flex flex-wrap items-center gap-1.5">
              <AnimatePresence initial={false}>
                {activeFilters!.map((f) => (
                  <motion.li
                    key={f.id}
                    layout={suppress ? false : true}
                    initial={suppress ? false : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={suppress ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.16, ease: EASE }}
                  >
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] py-0.5 pl-2 pr-0.5 text-[12px] text-[var(--color-fg)]">
                      {f.group ? <span className="text-[var(--color-muted)]">{f.group}:</span> : null}
                      <span className="font-medium">{f.label}</span>
                      {onRemoveFilter ? (
                        <button
                          type="button"
                          onClick={() => onRemoveFilter(f)}
                          aria-label={`Remove filter ${f.group ? `${f.group}: ` : ""}${f.label}`}
                          className="ml-0.5 grid h-4 w-4 place-items-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-fg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-focus,var(--color-accent))]"
                        >
                          <CloseIcon />
                        </button>
                      ) : null}
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            {onClearFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="rounded-md px-1.5 py-0.5 text-[12px] font-medium text-[var(--color-accent)] underline-offset-2 transition-colors hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-focus,var(--color-accent))]"
              >
                Clear all
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {body}
    </div>
  );
}

export default FilterResultTransition;
