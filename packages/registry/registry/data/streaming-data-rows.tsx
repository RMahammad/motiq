"use client";

import * as React from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useAnimatedNumber,
  formatNumber,
  getStatusMeta,
  statusVars,
  type StatusTone,
} from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type SortDir = "asc" | "desc";

export interface SortState {
  /** `Column.key` currently sorted by. */
  key: string;
  dir: SortDir;
}

export type CellAlign = "start" | "center" | "end";

export interface Column<T> {
  /** Stable identifier, also used for sort state and change tracking. */
  key: string;
  /** Header content (string or node). Used verbatim in the sort button label. */
  header: React.ReactNode;
  /** Text alignment for header + cells. */
  align?: CellAlign;
  /** Enables the sortable header button + `aria-sort`. */
  sortable?: boolean;
  /** Extra class on each `<td>`. */
  className?: string;
  /** Extra class on the `<th>`. */
  headerClassName?: string;
  /** Fixed column width (e.g. `120` or `"12ch"`). */
  width?: number | string;
  /** Full cell renderer. When omitted, the raw `value` is shown. */
  render?: (row: T) => React.ReactNode;
  /**
   * Raw primitive used for change detection, the numeric morph, and default
   * display. Return a number for numeric columns, a string otherwise.
   */
  value?: (row: T) => string | number | null | undefined;
  /** Sort key override; defaults to `value`. */
  sortAccessor?: (row: T) => string | number;
  /** Morph the number between updates and show a ▲/▼ change direction. */
  numeric?: boolean;
  /** Format a numeric value (used when `numeric` and no `render`). */
  format?: (n: number) => string;
}

export interface RowAction<T> {
  /** Reported to `onRowAction`. */
  id: string;
  /** Accessible label (also the visible text when no `icon`). */
  label: string;
  icon?: React.ReactNode;
  /** Direct handler; `onRowAction(id, row)` also fires. */
  onSelect?: (row: T) => void;
  disabled?: (row: T) => boolean;
  tone?: StatusTone;
}

export type StreamingTableState = "idle" | "loading" | "error";

export interface StreamingDataRowsProps<T> {
  /** Rows to display (controlled by the host application). */
  rows: T[];
  columns: Column<T>[];
  /** Stable identity per row — the key to smooth insert / update / resort. */
  getRowId: (row: T) => string;

  /** Controlled sort. Omit for uncontrolled (see `defaultSort`). */
  sort?: SortState | null;
  defaultSort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;

  /** Freezes change emphasis + numeric morphs (data may still change). */
  paused?: boolean;
  /** How long the changed-cell emphasis lasts, in ms. */
  highlightDuration?: number;

  /** Per-row action buttons (keyboard-accessible). */
  rowActions?: (row: T) => RowAction<T>[];
  onRowAction?: (actionId: string, row: T) => void;

  /** Emit rate-limited screen-reader summaries of inserts/updates/removals. */
  announceUpdates?: boolean;

  /** Lifecycle owned by the host. `idle` + empty `rows` shows the empty state. */
  state?: StreamingTableState;
  /** Retry affordance shown in the error state. */
  onRetry?: () => void;

  /** Stacked card renderer used on narrow viewports. */
  renderMobileRow?: (row: T, ctx: { actions: React.ReactNode }) => React.ReactNode;
  /** Max viewport width (px) at which the stacked layout is used. */
  mobileBreakpoint?: number;

  /** Visually-hidden `<caption>` describing the table. */
  caption?: string;
  emptyContent?: React.ReactNode;
  errorContent?: React.ReactNode;
  /** Skeleton row count in the loading state. */
  loadingRows?: number;

  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Small utilities                                                             */
/* -------------------------------------------------------------------------- */

const ALIGN: Record<CellAlign, string> = {
  start: "text-left",
  center: "text-center",
  end: "text-right",
};

/** SSR-safe media query — defaults to `false` so server + first client render match. */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
}

function nextSort(current: SortState | null | undefined, key: string): SortState | null {
  // Cycle: none → asc → desc → none (per column).
  if (!current || current.key !== key) return { key, dir: "asc" };
  if (current.dir === "asc") return { key, dir: "desc" };
  return null;
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

/** Morphs a number between values; snaps under reduced/paused. */
function MorphNumber({
  value,
  format,
  disabled,
}: {
  value: number;
  format?: (n: number) => string;
  disabled: boolean;
}) {
  const display = useAnimatedNumber(value, { disabled });
  const rounded = Number.isInteger(value) && !format ? Math.round(display) : display;
  return <>{format ? format(rounded) : formatNumber(rounded, { maximumFractionDigits: 2 })}</>;
}

/** Transient, non-flashing emphasis: a single tone-tinted fade + a ▲/▼ glyph. */
function ChangePulse({
  pulseKey,
  dir,
  duration,
  tone,
}: {
  pulseKey: number;
  dir: number;
  duration: number;
  tone: StatusTone;
}) {
  const vars = statusVars(tone);
  return (
    <>
      {/* Background wash — monotonic fade-out, so it never blinks. */}
      <motion.span
        key={`bg-${pulseKey}`}
        aria-hidden
        className="pointer-events-none absolute inset-y-1 inset-x-0 -z-0 rounded-md"
        initial={{ opacity: 0.85 }}
        animate={{ opacity: 0 }}
        transition={{ duration: duration / 1000, ease: "easeOut" }}
        style={{ background: vars.bg }}
      />
      {/* Direction glyph — carries "changed" without relying on color. */}
      {dir !== 0 ? (
        <motion.span
          key={`dir-${pulseKey}`}
          aria-hidden
          className="relative z-10 inline-flex translate-y-[-1px] items-center text-[0.85em] leading-none"
          style={{ color: vars.color }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: duration / 1000, ease: "easeOut", delay: duration / 4000 }}
        >
          {dir > 0 ? "▲" : "▼"}
        </motion.span>
      ) : null}
    </>
  );
}

/** Status pill — tone conveyed by a shape glyph + label, never color alone. */
export function StatusPill({ status }: { status: string }) {
  const meta = getStatusMeta(status);
  const vars = statusVars(meta.tone);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[12px] font-medium whitespace-nowrap"
      style={{ color: vars.color, background: vars.bg, borderColor: vars.border }}
    >
      <ToneGlyph tone={meta.tone} />
      {meta.label}
    </span>
  );
}

/** A distinct shape per tone so status is legible in forced-colors / greyscale. */
function ToneGlyph({ tone }: { tone: StatusTone }) {
  const common = { width: 11, height: 11, viewBox: "0 0 12 12", "aria-hidden": true, className: "shrink-0" } as const;
  switch (tone) {
    case "success":
      return (
        <svg {...common} fill="none">
          <path d="M2.5 6.5 5 9l4.5-5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "error":
      return (
        <svg {...common} fill="none">
          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "warning":
      return (
        <svg {...common} fill="currentColor">
          <path d="M6 1.5 11 10.5H1z" />
        </svg>
      );
    case "active":
      return (
        <svg {...common} fill="none">
          <circle cx="6" cy="6" r="3" fill="currentColor" />
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
        </svg>
      );
    case "info":
      return (
        <svg {...common} fill="currentColor">
          <circle cx="6" cy="3" r="1.1" />
          <rect x="5" y="5" width="2" height="5" rx="1" />
        </svg>
      );
    default:
      return <svg {...common} fill="currentColor"><circle cx="6" cy="6" r="3" /></svg>;
  }
}

function ActionButtons<T>({
  row,
  actions,
  onRowAction,
}: {
  row: T;
  actions: RowAction<T>[];
  onRowAction?: (id: string, row: T) => void;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {actions.map((action) => {
        const disabled = action.disabled?.(row) ?? false;
        const vars = action.tone ? statusVars(action.tone) : null;
        return (
          <button
            key={action.id}
            type="button"
            disabled={disabled}
            aria-label={action.label}
            title={action.label}
            onClick={() => {
              action.onSelect?.(row);
              onRowAction?.(action.id, row);
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[12px] font-medium text-[var(--color-fg)] transition-colors",
              "hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
            style={vars ? { color: vars.color, borderColor: vars.border } : undefined}
          >
            {action.icon ?? action.label}
          </button>
        );
      })}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                              */
/* -------------------------------------------------------------------------- */

/**
 * StreamingDataRows — an accessible live table for operational dashboards.
 *
 * The host application owns the data; this component only presents it, animating
 * the *changes*: row insertion, removal, reposition after sort, per-cell change
 * emphasis, numeric morphs, and status transitions. It is deliberately not a
 * data-grid — no virtualization, filtering, or paging — so it stays small and is
 * meant for live *subsets* (see the docs for large-dataset guidance).
 *
 * Accessibility: a real semantic `<table>` with `<th scope="col">`; sortable
 * headers are `<button>`s that set `aria-sort`; change is signalled by a ▲/▼
 * glyph (and a status label), never by color alone; a rate-limited polite live
 * region summarizes activity; stable row keys mean focus is never lost on
 * update or resort. Under reduced motion every emphasis is an instant swap.
 * Clean-room original.
 */
export function StreamingDataRows<T>({
  rows,
  columns,
  getRowId,
  sort,
  defaultSort = null,
  onSortChange,
  paused = false,
  highlightDuration = 1400,
  rowActions,
  onRowAction,
  announceUpdates = true,
  state = "idle",
  onRetry,
  renderMobileRow,
  mobileBreakpoint = 640,
  caption,
  emptyContent,
  errorContent,
  loadingRows = 4,
  className,
}: StreamingDataRowsProps<T>) {
  const reduce = useReducedMotion();
  const suppress = reduce || paused;
  const isMobile = useMediaQuery(`(max-width: ${mobileBreakpoint - 0.02}px)`) && !!renderMobileRow;

  /* ---- sort (controlled / uncontrolled) --------------------------------- */
  const [internalSort, setInternalSort] = React.useState<SortState | null>(defaultSort);
  const activeSort = sort !== undefined ? sort : internalSort;

  const handleSort = React.useCallback(
    (key: string) => {
      const value = nextSort(activeSort, key);
      if (sort === undefined) setInternalSort(value);
      onSortChange?.(value);
    },
    [activeSort, sort, onSortChange],
  );

  const sortedRows = React.useMemo(() => {
    if (!activeSort) return rows;
    const col = columns.find((c) => c.key === activeSort.key);
    if (!col) return rows;
    const accessor = col.sortAccessor ?? ((r: T) => col.value?.(r) ?? "");
    const factor = activeSort.dir === "asc" ? 1 : -1;
    // Stable sort on a copy — never mutate the host's array.
    return rows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        const av = accessor(a.row);
        const bv = accessor(b.row);
        if (av < bv) return -1 * factor;
        if (av > bv) return 1 * factor;
        return a.index - b.index;
      })
      .map((entry) => entry.row);
  }, [rows, columns, activeSort]);

  /* ---- change detection → pulses + announcements ------------------------ */
  const prevRef = React.useRef<Map<string, Record<string, string | number | null | undefined>>>(new Map());
  const pulseCounter = React.useRef(0);
  const [pulses, setPulses] = React.useState<Record<string, { id: number; dir: number }>>({});

  // Rate-limited announcer state.
  const [announcement, setAnnouncement] = React.useState("");
  const pendingRef = React.useRef({ added: 0, updated: 0, removed: 0 });
  const flushTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const announceThrottleMs = 1600;

  React.useEffect(() => {
    const prev = prevRef.current;
    const next = new Map<string, Record<string, string | number | null | undefined>>();
    const newPulses: Record<string, { id: number; dir: number }> = {};
    let updatedRows = 0;
    let added = 0;

    for (const row of rows) {
      const id = getRowId(row);
      const prevCells = prev.get(id);
      const cells: Record<string, string | number | null | undefined> = {};
      let rowChanged = false;

      for (const col of columns) {
        const v = col.value ? col.value(row) : undefined;
        cells[col.key] = v;
        if (prevCells && col.key in prevCells && prevCells[col.key] !== v) {
          rowChanged = true;
          const pv = prevCells[col.key];
          const dir =
            typeof v === "number" && typeof pv === "number" ? Math.sign(v - pv) : 0;
          if (!suppress) newPulses[`${id}:${col.key}`] = { id: ++pulseCounter.current, dir };
        }
      }
      if (!prevCells) added += 1;
      else if (rowChanged) updatedRows += 1;
      next.set(id, cells);
    }

    let removed = 0;
    for (const id of prev.keys()) if (!next.has(id)) removed += 1;
    prevRef.current = next;

    // Drop stale pulse keys for rows that no longer exist.
    setPulses((current) => {
      const merged = { ...current, ...newPulses };
      for (const cellKey of Object.keys(merged)) {
        const id = cellKey.slice(0, cellKey.lastIndexOf(":"));
        if (!next.has(id)) delete merged[cellKey];
      }
      return Object.keys(newPulses).length || Object.keys(merged).length !== Object.keys(current).length
        ? merged
        : current;
    });

    if (!announceUpdates || suppress) return;
    if (added === 0 && updatedRows === 0 && removed === 0) return;

    const p = pendingRef.current;
    p.added += added;
    p.updated += updatedRows;
    p.removed += removed;

    if (flushTimer.current) return; // already scheduled — coalesce.
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null;
      const { added: a, updated: u, removed: r } = pendingRef.current;
      pendingRef.current = { added: 0, updated: 0, removed: 0 };
      const parts: string[] = [];
      if (a) parts.push(`${a} added`);
      if (u) parts.push(`${u} updated`);
      if (r) parts.push(`${r} removed`);
      if (parts.length) setAnnouncement(`Rows ${parts.join(", ")}.`);
    }, announceThrottleMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, columns, getRowId, suppress, announceUpdates]);

  React.useEffect(() => () => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
  }, []);

  const hasActions = !!rowActions;
  const columnCount = columns.length + (hasActions ? 1 : 0);

  /* ---- non-data states -------------------------------------------------- */
  if (state === "error") {
    return (
      <div className={cn(shellClass, className)}>
        <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[var(--color-error)]">
            <path d="M12 8v5m0 3h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-[14px] text-[var(--color-fg)]">{errorContent ?? "Live feed unavailable."}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)] hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  /* ---- shared header cells ---------------------------------------------- */
  const headerCells = columns.map((col) => {
    const sortedHere = activeSort?.key === col.key ? activeSort.dir : null;
    const ariaSort = sortedHere === "asc" ? "ascending" : sortedHere === "desc" ? "descending" : "none";
    return (
      <th
        key={col.key}
        scope="col"
        aria-sort={col.sortable ? ariaSort : undefined}
        style={col.width != null ? { width: col.width } : undefined}
        className={cn(
          "px-3 py-2.5 text-[11.5px] font-semibold tracking-wide text-[var(--color-muted)] uppercase",
          ALIGN[col.align ?? "start"],
          col.headerClassName,
        )}
      >
        {col.sortable ? (
          <button
            type="button"
            onClick={() => handleSort(col.key)}
            className={cn(
              "group inline-flex items-center gap-1 rounded text-inherit transition-colors hover:text-[var(--color-fg)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
              (col.align ?? "start") === "end" && "flex-row-reverse",
            )}
          >
            <span>{col.header}</span>
            <SortGlyph dir={sortedHere} />
          </button>
        ) : (
          col.header
        )}
      </th>
    );
  });

  /* ---- desktop table ---------------------------------------------------- */
  const table = (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13.5px] text-[var(--color-fg)]" aria-busy={state === "loading" || undefined}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {headerCells}
            {hasActions ? (
              <th scope="col" className="px-3 py-2.5 text-right">
                <span className="sr-only">Actions</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <LayoutGroup>
          <tbody>
            {state === "loading" ? (
              Array.from({ length: loadingRows }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-b border-[var(--color-border)] last:border-b-0" aria-hidden>
                  {Array.from({ length: columnCount }).map((__, j) => (
                    <td key={j} className="px-3 py-3">
                      <span className="block h-4 w-[70%] animate-pulse rounded bg-[var(--color-bg-secondary)] motion-reduce:animate-none" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-3 py-12 text-center text-[13.5px] text-[var(--color-muted)]">
                  {emptyContent ?? "No rows yet. Waiting for live data…"}
                </td>
              </tr>
            ) : (
              // popLayout: a row dropped by the cap is pulled out of layout flow as
              // it fades, so the table never briefly grows then shrinks (no flash).
              <AnimatePresence initial={false} mode="popLayout">
                {sortedRows.map((row) => {
                  const id = getRowId(row);
                  return (
                    <motion.tr
                      key={id}
                      layout={suppress ? false : "position"}
                      initial={suppress ? false : { opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={suppress ? { opacity: 0 } : { opacity: 0, y: 6 }}
                      transition={{ layout: { duration: 0.32, ease: [0.2, 0, 0, 1] }, duration: 0.24, ease: [0.2, 0, 0, 1] }}
                      className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bg-secondary)]"
                    >
                      {columns.map((col) => {
                        const pulse = pulses[`${id}:${col.key}`];
                        const content = col.render
                          ? col.render(row)
                          : col.numeric && typeof col.value?.(row) === "number"
                            ? <MorphNumber value={col.value(row) as number} format={col.format} disabled={suppress} />
                            : (col.value?.(row) ?? null);
                        return (
                          <td
                            key={col.key}
                            className={cn(
                              "relative px-3 py-2.5 align-middle",
                              col.numeric && "tabular-nums [font-variant-numeric:tabular-nums]",
                              ALIGN[col.align ?? "start"],
                              col.className,
                            )}
                          >
                            <span className={cn("relative z-10 inline-flex items-center gap-1", (col.align ?? "start") === "end" && "flex-row-reverse")}>
                              {content}
                              {pulse && !suppress ? (
                                <ChangePulse pulseKey={pulse.id} dir={pulse.dir} duration={highlightDuration} tone={pulse.dir > 0 ? "success" : pulse.dir < 0 ? "warning" : "info"} />
                              ) : null}
                            </span>
                          </td>
                        );
                      })}
                      {hasActions ? (
                        <td className="px-3 py-2.5 text-right">
                          <ActionButtons row={row} actions={rowActions(row)} onRowAction={onRowAction} />
                        </td>
                      ) : null}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </LayoutGroup>
      </table>
    </div>
  );

  /* ---- mobile stacked layout ------------------------------------------- */
  const mobile = renderMobileRow ? (
    <ul className="flex flex-col gap-2 p-2">
      <LayoutGroup>
        <AnimatePresence initial={false} mode="popLayout">
          {sortedRows.map((row) => {
            const id = getRowId(row);
            return (
              <motion.li
                key={id}
                layout={suppress ? false : "position"}
                initial={suppress ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={suppress ? { opacity: 0 } : { opacity: 0, y: 6 }}
                transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
              >
                {renderMobileRow(row, {
                  actions: hasActions ? <ActionButtons row={row} actions={rowActions(row)} onRowAction={onRowAction} /> : null,
                })}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </LayoutGroup>
      {sortedRows.length === 0 ? (
        <li className="px-3 py-10 text-center text-[13.5px] text-[var(--color-muted)]">{emptyContent ?? "No rows yet."}</li>
      ) : null}
    </ul>
  ) : null;

  return (
    <div className={cn(shellClass, className)}>
      {/* Rate-limited, polite update summary for screen readers. */}
      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>
      {isMobile ? mobile : table}
    </div>
  );
}

const shellClass =
  "overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]";

function SortGlyph({ dir }: { dir: SortDir | null }) {
  // The active direction is a filled caret; inactive is a dim double-caret. The
  // authoritative state is `aria-sort` on the <th>; this is a visual aid.
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0">
      <path d="M3.5 5 6 2.5 8.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity={dir === "asc" ? 1 : 0.3} />
      <path d="M3.5 7 6 9.5 8.5 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity={dir === "desc" ? 1 : 0.3} />
    </svg>
  );
}

export default StreamingDataRows;
