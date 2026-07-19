"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useAnimatedNumber,
  useDisclosure,
  useAnchoredPortal,
  getStatusMeta,
  statusVars,
  formatTimestamp as sharedFormatTimestamp,
  type StatusMeta,
  type StatusTone,
} from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Custom interval dropdown — a real library listbox popover (not a native
   <select>): keyboard-navigable, dismiss-on-outside-click, animated, themed.   */
/* -------------------------------------------------------------------------- */

const formatInterval = (ms: number) => (ms >= 60000 ? `${Math.round(ms / 60000)}m` : `${Math.round(ms / 1000)}s`);

function IntervalSelect({
  value,
  options,
  onChange,
}: {
  value: number;
  options: number[];
  onChange: (ms: number) => void;
}) {
  const reduce = useReducedMotion();
  const menu = useDisclosure({ idPrefix: "mk-interval", dismissable: true });
  const anchor = useAnchoredPortal(menu.open, { align: "end" });
  const current = options.includes(value) ? value : options[0];
  const [activeIdx, setActiveIdx] = React.useState(() => Math.max(0, options.indexOf(current)));

  React.useEffect(() => {
    if (menu.open) setActiveIdx(Math.max(0, options.indexOf(current)));
  }, [menu.open, current, options]);

  const commit = (ms: number) => {
    onChange(ms);
    menu.setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!menu.open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        menu.setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((a) => Math.min(options.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((a) => Math.max(0, a - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setActiveIdx(0); }
    else if (e.key === "End") { e.preventDefault(); setActiveIdx(options.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); commit(options[activeIdx]); }
  };

  return (
    <div ref={menu.rootRef as React.RefObject<HTMLDivElement>} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        {...menu.triggerProps}
        ref={anchor.triggerRef as React.RefObject<HTMLButtonElement>}
        aria-haspopup="listbox"
        className="inline-flex min-h-[28px] items-center gap-1.5 rounded-md bg-[var(--color-surface)] px-2 py-1 text-[12.5px] font-medium text-[var(--color-fg)] outline-none [border:1px_solid_var(--color-border)] transition-colors hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))]"
      >
        {formatInterval(current)}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {anchor.renderInPortal(
        <AnimatePresence>
          {menu.open && anchor.anchored ? (
            <motion.div
              {...menu.panelProps}
              ref={anchor.panelRef as React.RefObject<HTMLDivElement>}
              role="listbox"
              aria-label="Auto-refresh interval"
              aria-activedescendant={`mk-interval-opt-${options[activeIdx]}`}
              initial={reduce ? false : { opacity: 0, y: -4, scale: 0.98 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.14, ease: EASE }}
              style={anchor.panelStyle}
              className="z-[60] min-w-[112px] overflow-auto rounded-lg bg-[var(--color-surface)] p-1 shadow-[var(--shadow-md)] [border:1px_solid_var(--color-border)]"
            >
            {options.map((ms, i) => {
              const selected = ms === current;
              return (
                <button
                  key={ms}
                  id={`mk-interval-opt-${ms}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => commit(ms)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left text-[12.5px] outline-none text-[var(--color-fg)]",
                    i === activeIdx ? "bg-[var(--color-bg-secondary)]" : "hover:bg-[var(--color-bg-secondary)]",
                  )}
                >
                  {formatInterval(ms)}
                  {selected ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[var(--color-accent-text)]"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : null}
                </button>
              );
            })}
            </motion.div>
          ) : null}
        </AnimatePresence>,
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The lifecycle of a data source, owned entirely by the host application. This
 * component never fetches, never fakes progress, and never spins forever: it
 * only *presents* the state the app hands it.
 */
export type RefreshState =
  | "idle"
  | "checking"
  | "refreshing"
  | "partially_updated"
  | "success"
  | "stale"
  | "offline"
  | "error"
  | "paused"
  | "cancelled";

export type RefreshMode = "compact" | "inline" | "panel";

export type TimeValue = Date | number | string;

export interface DataRefreshStateProps {
  /** The current lifecycle state (host-owned). */
  state: RefreshState;
  /** Human label for the dataset, e.g. "Revenue metrics". */
  label?: string;

  /** When the data was last successfully updated. */
  lastUpdated?: TimeValue | null;
  /** When the next automatic refresh is scheduled (auto mode). */
  nextRefresh?: TimeValue | null;

  /**
   * Determinate progress 0–1 while `checking`/`refreshing`. Omit (or pass
   * `null`) for an indeterminate, clearly-labelled bar — never a fake number.
   */
  progress?: number | null;
  /** Records updated so far (drives the animated count). */
  updatedCount?: number;
  /** Total records in scope. */
  totalCount?: number;

  /** Origin label, e.g. "Warehouse · replica-2". */
  source?: string;
  /** How far behind the data is, e.g. "12m behind" (shown when `stale`). */
  staleness?: string;
  /** Connection detail, e.g. "Reconnecting…" (shown when `offline`). */
  connection?: string;
  /** Short error message (shown when `error`). */
  errorSummary?: string;

  /** Whether automatic refresh is enabled (reveals pause/interval controls). */
  automatic?: boolean;
  /** Current auto-refresh interval, in ms (for the interval control). */
  interval?: number;
  /** Selectable auto-refresh intervals, in ms. */
  intervalOptions?: number[];

  /** Presentation density. */
  mode?: RefreshMode;

  /** Manual refresh (idle/stale/success/partial/paused/cancelled). */
  onRefresh?: () => void;
  /** Cancel an in-flight refresh (checking/refreshing). */
  onCancel?: () => void;
  /** Retry after a failure (error/offline). */
  onRetry?: () => void;
  /** Pause automatic refresh. */
  onPause?: () => void;
  /** Resume automatic refresh. */
  onResume?: () => void;
  /** Change the auto-refresh interval (ms). */
  onIntervalChange?: (ms: number) => void;
  /** Open a details view / drawer. */
  onViewDetails?: () => void;
  /** Dismiss the transient success confirmation. */
  onDismiss?: () => void;

  /** Override timestamp rendering. */
  formatTimestamp?: (value: TimeValue) => string;
  /**
   * Stable reference "now" (ms) enabling relative times ("3m ago", "in 2m").
   * Pass a value that only changes on the client to stay hydration-safe; omit
   * for absolute clock times.
   */
  now?: number;

  /** Force the static, reduced-motion presentation. */
  reducedMotion?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* State vocabulary                                                            */
/* -------------------------------------------------------------------------- */

// Labels + semantic tones for the refresh-specific vocabulary. Tone drives the
// token color; a distinct glyph + this label mean state is never color-only.
const STATUS_OVERRIDES: Record<string, Partial<StatusMeta>> = {
  idle: { label: "Up to date", tone: "neutral" },
  checking: { label: "Checking for updates", tone: "info" },
  refreshing: { label: "Refreshing", tone: "active" },
  partially_updated: { label: "Partially updated", tone: "warning" },
  success: { label: "Updated", tone: "success" },
  stale: { label: "Data is stale", tone: "warning" },
  offline: { label: "Offline", tone: "error" },
  error: { label: "Refresh failed", tone: "error" },
  paused: { label: "Auto-refresh paused", tone: "neutral" },
  cancelled: { label: "Refresh cancelled", tone: "neutral" },
};

const EASE = [0.2, 0, 0, 1] as const;

function isBusy(state: RefreshState) {
  return state === "checking" || state === "refreshing";
}

function defaultFormat(value: TimeValue, now?: number): string {
  return sharedFormatTimestamp(value, now != null ? { relative: true, now } : {});
}

/** Compact "in 2m" / "due now" for a future timestamp; SSR-safe when `now` set. */
function formatUntil(value: TimeValue, now?: number): string {
  const target = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (Number.isNaN(target)) return "";
  if (now == null) {
    return sharedFormatTimestamp(value, {});
  }
  const secs = Math.round((target - now) / 1000);
  if (secs <= 0) return "due now";
  if (secs < 60) return `in ${secs}s`;
  if (secs < 3600) return `in ${Math.floor(secs / 60)}m`;
  return `in ${Math.floor(secs / 3600)}h`;
}

/* -------------------------------------------------------------------------- */
/* Glyphs — one distinct shape per state (legible in greyscale/forced-colors)  */
/* -------------------------------------------------------------------------- */

const glyphProps = {
  width: 15,
  height: 15,
  viewBox: "0 0 16 16",
  fill: "none",
  "aria-hidden": true,
  className: "shrink-0",
} as const;

/** The rotating arrows used for checking/refreshing (animated separately). */
function RefreshArrows() {
  return (
    <svg {...glyphProps}>
      <path
        d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M13.4 2.2v3h-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StateGlyph({ state }: { state: RefreshState }) {
  switch (state) {
    case "checking":
    case "refreshing":
      return <RefreshArrows />;
    case "success":
      return (
        <svg {...glyphProps}>
          <path d="M3.5 8.5 6.5 11.5l6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "idle":
      return (
        <svg {...glyphProps}>
          <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5.5 8.2 7.2 9.9l3.3-3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "partially_updated":
      return (
        <svg {...glyphProps}>
          <circle cx="8" cy="8" r="5.8" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
          <path d="M8 2.2a5.8 5.8 0 0 1 0 11.6z" fill="currentColor" />
        </svg>
      );
    case "stale":
      return (
        <svg {...glyphProps}>
          <circle cx="8" cy="8" r="5.8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 4.8V8l2.4 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "offline":
      return (
        <svg {...glyphProps}>
          <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M8 12.5h.01M4.7 9.3a4.7 4.7 0 0 1 5.2-1M2.4 6.8a8 8 0 0 1 3-1.9M11 4.9a8 8 0 0 1 2.6 1.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "error":
      return (
        <svg {...glyphProps}>
          <path d="M8 1.8 14.6 13.5H1.4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M8 6.4v3M8 11.4h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "paused":
      return (
        <svg {...glyphProps}>
          <rect x="4.5" y="3.5" width="2.4" height="9" rx="1" fill="currentColor" />
          <rect x="9.1" y="3.5" width="2.4" height="9" rx="1" fill="currentColor" />
        </svg>
      );
    case "cancelled":
      return (
        <svg {...glyphProps}>
          <circle cx="8" cy="8" r="5.8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5.6 5.6l4.8 4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...glyphProps}>
          <circle cx="8" cy="8" r="3" fill="currentColor" />
        </svg>
      );
  }
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

/** State pill — animated icon + label. Icon spins only while busy. */
function StatePill({
  state,
  meta,
  vars,
  reduce,
  size = "md",
}: {
  state: RefreshState;
  meta: StatusMeta;
  vars: { color: string; bg: string; border: string };
  reduce: boolean;
  size?: "sm" | "md";
}) {
  const busy = isBusy(state);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[12px]" : "px-2.5 py-1 text-[12.5px]",
      )}
      style={{ color: vars.color, background: vars.bg, borderColor: vars.border }}
    >
      <span className="relative grid h-[15px] w-[15px] place-items-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={state}
            className="absolute inline-flex"
            initial={reduce ? false : { opacity: 0, scale: 0.6 }}
            animate={
              busy && !reduce
                ? { opacity: 1, scale: 1, rotate: 360 }
                : { opacity: 1, scale: 1, rotate: 0 }
            }
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
            transition={
              busy && !reduce
                ? { rotate: { duration: 1.1, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.18 }, scale: { duration: 0.18 } }
                : { duration: 0.22, ease: EASE }
            }
          >
            <StateGlyph state={state} />
          </motion.span>
        </AnimatePresence>
      </span>
      {meta.label}
    </span>
  );
}

/** Animated integer readout ("142 / 200 records"). */
function CountReadout({
  updated,
  total,
  disabled,
}: {
  updated: number;
  total?: number;
  disabled: boolean;
}) {
  const shown = useAnimatedNumber(updated, { disabled });
  const rounded = Math.round(shown);
  return (
    <span className="tabular-nums [font-variant-numeric:tabular-nums]">
      {rounded.toLocaleString()}
      {total != null ? (
        <span className="text-[var(--color-muted)]"> / {total.toLocaleString()} records</span>
      ) : (
        <span className="text-[var(--color-muted)]"> records</span>
      )}
    </span>
  );
}

/**
 * Progress region. Determinate → role=progressbar + aria-valuenow. Indeterminate
 * → a labelled, moving bar (only ever shown while actively busy — no idle spin).
 * Reduced motion turns the indeterminate sweep into a static striped bar.
 */
function ProgressRegion({
  state,
  progress,
  vars,
  reduce,
  label,
}: {
  state: RefreshState;
  progress?: number | null;
  vars: { color: string; bg: string; border: string };
  reduce: boolean;
  label: string;
}) {
  const determinate = typeof progress === "number" && Number.isFinite(progress);
  const pct = determinate ? Math.round(Math.min(1, Math.max(0, progress as number)) * 100) : 0;

  if (determinate) {
    return (
      <div className="flex flex-col gap-1">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={`${pct}% complete`}
          aria-label={label}
          className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-secondary)]"
        >
          {/* Deterministic fill: width comes straight from `pct` (a Motion
              width-% animation with initial={false} could leave a block span at
              its 100% default), animated smoothly with a plain CSS transition so
              the bar always matches the number. */}
          <span
            className="block h-full rounded-full"
            style={{
              background: vars.color,
              width: `${pct}%`,
              transition: reduce ? "none" : "width 0.5s cubic-bezier(0.2,0,0,1)",
            }}
          />
        </div>
        <span className="text-[11.5px] tabular-nums text-[var(--color-muted)]">{pct}%</span>
      </div>
    );
  }

  // Indeterminate — clearly labelled; motion signals "working" without a number.
  return (
    <div className="flex flex-col gap-1">
      <div
        role="progressbar"
        aria-label={`${label} (in progress)`}
        className="relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-secondary)]"
      >
        {reduce ? (
          <span
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, ${vars.color} 0 6px, transparent 6px 12px)`,
            }}
          />
        ) : (
          <motion.span
            className="absolute top-0 h-full w-1/3 rounded-full"
            style={{ background: vars.color }}
            initial={{ x: "-40%" }}
            animate={{ x: "340%" }}
            transition={{ duration: 1.1, repeat: Infinity, ease: EASE }}
          />
        )}
      </div>
      <span className="text-[11.5px] text-[var(--color-muted)]">
        {state === "checking" ? "Checking…" : "Working…"}
      </span>
    </div>
  );
}

/* -- action buttons -------------------------------------------------------- */

const btnBase =
  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] disabled:cursor-not-allowed disabled:opacity-40";

function ActionButton({
  onClick,
  children,
  variant = "default",
  tone,
  title,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "default";
  tone?: StatusTone;
  title?: string;
}) {
  const toneVars = tone ? statusVars(tone) : null;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        btnBase,
        variant === "primary"
          ? "border-transparent bg-[var(--color-accent)] text-[var(--color-accent-foreground,white)] hover:opacity-90"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
      )}
      style={toneVars && variant !== "primary" ? { color: toneVars.color, borderColor: toneVars.border } : undefined}
    >
      {children}
    </button>
  );
}

/** Icon-only control used by the compact mode. */
function IconButton({
  onClick,
  label,
  children,
}: {
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] transition-colors",
        "hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
      )}
    >
      {children}
    </button>
  );
}

/* small inline icons for controls */
const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M13.4 2.2v3h-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CancelIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
const PauseIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <rect x="4.5" y="3.5" width="2.3" height="9" rx="1" />
    <rect x="9.2" y="3.5" width="2.3" height="9" rx="1" />
  </svg>
);
const PlayIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <path d="M5 3.5v9l7-4.5z" />
  </svg>
);

/* -------------------------------------------------------------------------- */
/* Main component                                                              */
/* -------------------------------------------------------------------------- */

/**
 * DataRefreshState — a rich, accessible refresh indicator for dashboards and
 * data products. The host application owns the fetch, the progress, and every
 * state transition; this component presents them with meaningful motion and
 * full keyboard + screen-reader support.
 *
 * It deliberately covers the states a real data surface goes through — idle,
 * checking, refreshing (determinate *or* honestly-indeterminate), partially
 * updated, success, stale, offline, error, paused, cancelled — with manual
 * refresh, cancel, retry, pause/resume, and interval controls. It never spins
 * on idle and never invents a progress number. Clean-room original.
 */
export function DataRefreshState({
  state,
  label = "Data",
  lastUpdated,
  nextRefresh,
  progress,
  updatedCount,
  totalCount,
  source,
  staleness,
  connection,
  errorSummary,
  automatic = false,
  interval,
  intervalOptions,
  mode = "panel",
  onRefresh,
  onCancel,
  onRetry,
  onPause,
  onResume,
  onIntervalChange,
  onViewDetails,
  onDismiss,
  formatTimestamp,
  now,
  reducedMotion,
  className,
}: DataRefreshStateProps) {
  const systemReduce = useReducedMotion();
  const reduce = reducedMotion ?? systemReduce;

  const meta = React.useMemo(() => getStatusMeta(state, STATUS_OVERRIDES), [state]);
  const vars = React.useMemo(() => statusVars(meta.tone), [meta.tone]);
  const busy = isBusy(state);

  const fmt = React.useCallback(
    (value: TimeValue) => (formatTimestamp ? formatTimestamp(value) : defaultFormat(value, now)),
    [formatTimestamp, now],
  );

  const showRefresh = !busy && state !== "error" && state !== "offline" && !!onRefresh;
  const showCancel = busy && !!onCancel;
  const showRetry = (state === "error" || state === "offline") && !!onRetry;
  const showPause = automatic && state !== "paused" && !!onPause;
  const showResume = state === "paused" && !!onResume;
  const showDismiss = state === "success" && !!onDismiss;
  const showCount = updatedCount != null && (state === "refreshing" || state === "partially_updated" || state === "success");

  /* --- non-spamming live region: announce only on state change ----------- */
  const [announcement, setAnnouncement] = React.useState("");
  React.useEffect(() => {
    const parts: string[] = [`${label}: ${meta.label}`];
    if (state === "partially_updated" && updatedCount != null && totalCount != null) {
      parts.push(`${updatedCount} of ${totalCount} records updated`);
    }
    if (state === "stale" && staleness) parts.push(staleness);
    if (state === "offline" && connection) parts.push(connection);
    if (state === "error" && errorSummary) parts.push(errorSummary);
    setAnnouncement(parts.join(". ") + ".");
    // Announce on lifecycle change only — never on every prop tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const liveRegion = (
    <div aria-live="polite" role="status" className="sr-only">
      {announcement}
    </div>
  );

  /* ---------------------------------------------------------------- compact */
  if (mode === "compact") {
    const primary = showCancel ? (
      <IconButton onClick={onCancel} label="Cancel refresh"><CancelIcon /></IconButton>
    ) : showRetry ? (
      <IconButton onClick={onRetry} label="Retry"><RefreshIcon /></IconButton>
    ) : showResume ? (
      <IconButton onClick={onResume} label="Resume auto-refresh"><PlayIcon /></IconButton>
    ) : showRefresh ? (
      <IconButton onClick={onRefresh} label="Refresh now"><RefreshIcon /></IconButton>
    ) : null;

    return (
      <div
        role="group"
        aria-label={`${label} refresh status`}
        className={cn(
          "relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-1 pl-1.5 pr-1 shadow-[var(--shadow-sm)]",
          className,
        )}
      >
        {liveRegion}
        <StatePill state={state} meta={meta} vars={vars} reduce={reduce} size="sm" />
        {lastUpdated && !busy ? (
          <span className="text-[11.5px] text-[var(--color-muted)]">{fmt(lastUpdated)}</span>
        ) : null}
        {busy && typeof progress === "number" ? (
          <span className="text-[11.5px] tabular-nums text-[var(--color-muted)]">
            {Math.round(Math.min(1, Math.max(0, progress)) * 100)}%
          </span>
        ) : null}
        {primary}
      </div>
    );
  }

  /* ----------------------------------------------------------------- inline */
  if (mode === "inline") {
    const detail =
      state === "error" ? errorSummary :
      state === "offline" ? connection :
      state === "stale" ? staleness :
      lastUpdated ? `Updated ${fmt(lastUpdated)}` :
      undefined;

    return (
      <div
        role="group"
        aria-label={`${label} refresh status`}
        className={cn(
          "flex w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-[var(--shadow-sm)]",
          className,
        )}
      >
        {liveRegion}
        <StatePill state={state} meta={meta} vars={vars} reduce={reduce} />
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--color-muted)]">
          {detail}
        </span>
        {busy ? (
          <div className="w-24 sm:w-32">
            <ProgressRegion state={state} progress={progress} vars={vars} reduce={reduce} label={`${label} refresh`} />
          </div>
        ) : null}
        <div className="flex items-center gap-1.5">
          {showCancel ? <ActionButton onClick={onCancel} tone="neutral"><CancelIcon /> Cancel</ActionButton> : null}
          {showRetry ? <ActionButton onClick={onRetry} variant="primary"><RefreshIcon /> Retry</ActionButton> : null}
          {showResume ? <ActionButton onClick={onResume}><PlayIcon /> Resume</ActionButton> : null}
          {showPause ? <ActionButton onClick={onPause}><PauseIcon /> Pause</ActionButton> : null}
          {showRefresh ? <ActionButton onClick={onRefresh}><RefreshIcon /> Refresh</ActionButton> : null}
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ panel */
  const infoRows: Array<{ k: string; v: React.ReactNode }> = [];
  if (lastUpdated) infoRows.push({ k: "Last updated", v: fmt(lastUpdated) });
  if (automatic && nextRefresh && !busy && state !== "paused") {
    infoRows.push({ k: "Next refresh", v: formatUntil(nextRefresh, now) });
  }
  if (state === "paused") infoRows.push({ k: "Next refresh", v: "Paused" });
  if (source) infoRows.push({ k: "Source", v: source });
  if (state === "stale" && staleness) infoRows.push({ k: "Staleness", v: staleness });
  if (state === "offline" && connection) infoRows.push({ k: "Connection", v: connection });

  return (
    <section
      aria-label={`${label} refresh status`}
      className={cn(
        "flex w-full max-w-[440px] flex-col gap-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-md)]",
        className,
      )}
    >
      {liveRegion}

      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-semibold text-[var(--color-fg)]">{label}</h3>
          {source ? <p className="mt-0.5 truncate text-[12px] text-[var(--color-muted)]">{source}</p> : null}
        </div>
        <StatePill state={state} meta={meta} vars={vars} reduce={reduce} />
      </div>

      {/* progress / count region — only while actively working or just finished */}
      <AnimatePresence initial={false} mode="wait">
        {busy ? (
          <motion.div
            key="progress"
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <ProgressRegion state={state} progress={progress} vars={vars} reduce={reduce} label={`${label} refresh`} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {showCount ? (
        <p className="text-[13px] font-medium text-[var(--color-fg)]">
          <CountReadout updated={updatedCount as number} total={totalCount} disabled={reduce} />
          {state === "partially_updated" ? (
            <span className="ml-1.5 text-[12px] font-normal text-[var(--color-warning)]">- some records pending</span>
          ) : null}
        </p>
      ) : null}

      {/* error banner */}
      {state === "error" && errorSummary ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border px-2.5 py-2 text-[12.5px]"
          style={{ color: vars.color, background: vars.bg, borderColor: vars.border }}
        >
          <span className="mt-px"><StateGlyph state="error" /></span>
          <span className="text-[var(--color-fg)]">{errorSummary}</span>
        </div>
      ) : null}

      {/* info grid */}
      {infoRows.length ? (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {infoRows.map((row) => (
            <div key={row.k} className="flex flex-col">
              <dt className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">{row.k}</dt>
              <dd className="text-[12.5px] tabular-nums text-[var(--color-fg)]">{row.v}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {/* interval control (auto mode) */}
      {automatic && intervalOptions && intervalOptions.length && onIntervalChange ? (
        <div className="flex items-center justify-between gap-2 text-[12.5px] text-[var(--color-muted)]">
          <span id="mk-interval-label">Auto-refresh every</span>
          <IntervalSelect
            value={interval ?? intervalOptions[0]}
            options={intervalOptions}
            onChange={onIntervalChange}
          />
        </div>
      ) : null}

      {/* footer actions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3">
        {showRetry ? <ActionButton onClick={onRetry} variant="primary"><RefreshIcon /> Retry</ActionButton> : null}
        {showRefresh ? <ActionButton onClick={onRefresh} variant={state === "stale" ? "primary" : "default"}><RefreshIcon /> Refresh now</ActionButton> : null}
        {showCancel ? <ActionButton onClick={onCancel}><CancelIcon /> Cancel</ActionButton> : null}
        {showPause ? <ActionButton onClick={onPause}><PauseIcon /> Pause auto</ActionButton> : null}
        {showResume ? <ActionButton onClick={onResume}><PlayIcon /> Resume auto</ActionButton> : null}
        {showDismiss ? <ActionButton onClick={onDismiss}>Dismiss</ActionButton> : null}
        {onViewDetails ? (
          <button
            type="button"
            onClick={onViewDetails}
            className="ml-auto text-[12.5px] font-medium text-[var(--color-accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            View details
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default DataRefreshState;
