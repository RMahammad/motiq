"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useDisclosure,
  useAnimatedNumber,
  statusVars,
  formatTimestamp as sharedFormatTimestamp,
  type StatusTone,
} from "@/lib/motionkit";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type TimeValue = Date | number | string;

/**
 * The outcome of a single validation check, owned by the host application. The
 * component never runs the check and never decides pass/fail — it presents the
 * verdict the app supplies. `unknown` is a first-class, honest state: it means
 * the check has not produced evidence, and it is *never* silently upgraded to a
 * pass.
 */
export type CheckState = "pass" | "warning" | "failure" | "unknown";

/** Filter selector for the check list (state, or "all"). */
export type CheckFilter = CheckState | "all";

/** One line of detail for a check, revealed when its row is expanded. */
export interface QualityIssue {
  id: string;
  /** Human-readable description of the problem. */
  message: string;
  /** Records touched by this specific issue (app-supplied). */
  records?: number;
  /** Where the issue lives, e.g. "column: email". */
  location?: string;
}

/** A single validation check result (app-supplied — never computed here). */
export interface QualityCheck {
  id: string;
  /** Short human label, e.g. "No null emails". */
  label: string;
  /** Verdict supplied by the application. */
  state: CheckState;
  /** One-line summary shown on the collapsed row. */
  summary?: string;
  /** How many records this check flagged (drives the affected-records count). */
  affectedRecords?: number;
  /** Per-check issue detail, shown when the row is expanded. */
  issues?: QualityIssue[];
}

/**
 * A headline quality metric. Every field is optional so the app can honestly
 * report "Unknown" for anything it has not measured. The component NEVER invents
 * a value: with no `score` and no `label`, the tile shows "Unknown".
 */
export interface QualityMetric {
  /** Normalised 0–1 score, if the app measured one. */
  score?: number | null;
  /** Explicit display value (e.g. "98.6%", "2h behind"). Overrides `score`. */
  label?: string;
  /** Optional supporting caption, e.g. "12 columns checked". */
  caption?: string;
}

/** Headline metrics — each independently optional and app-supplied. */
export interface DataQualityMetrics {
  /** How current the data is. */
  freshness?: QualityMetric | null;
  /** Share of expected records/fields present. */
  completeness?: QualityMetric | null;
  /** Share of records passing accuracy rules. */
  accuracy?: QualityMetric | null;
}

export interface DataQualityStatusProps {
  /** Dataset name, e.g. "Customer accounts". */
  label?: string;
  /** Origin label, e.g. "Warehouse · public.customers". */
  source?: string;

  /** Headline metrics (freshness / completeness / accuracy), app-supplied. */
  metrics?: DataQualityMetrics;
  /** Validation checks with their app-supplied verdicts. */
  checks: QualityCheck[];

  /** When the dataset was last validated (app-supplied timestamp). */
  lastChecked?: TimeValue | null;
  /** Total records in the validated scope (app-supplied). */
  totalRecords?: number;

  /** Filtered check state (controlled). */
  filter?: CheckFilter;
  /** Initial filter for the uncontrolled case. */
  defaultFilter?: CheckFilter;
  /** Fires when the user changes the filter. */
  onFilterChange?: (filter: CheckFilter) => void;

  /** Re-run validation (host owns the actual work). */
  onRetry?: () => void;
  /** Whether a validation run is in flight (app-owned; drives the spinner). */
  validating?: boolean;

  /** Override timestamp rendering. */
  formatTimestamp?: (value: TimeValue) => string;
  /** Stable "now" (ms) enabling relative "last checked" — pass for SSR safety. */
  now?: number;

  /** Force the static, reduced-motion presentation. */
  reducedMotion?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* State vocabulary — label + tone per check state (never colour alone)        */
/* -------------------------------------------------------------------------- */

interface StateMeta {
  label: string;
  tone: StatusTone;
}

const CHECK_META: Record<CheckState, StateMeta> = {
  pass: { label: "Passing", tone: "success" },
  warning: { label: "Warning", tone: "warning" },
  failure: { label: "Failing", tone: "error" },
  unknown: { label: "Unknown", tone: "neutral" },
};

// Overall verdict headline per derived state.
const OVERALL_META: Record<CheckState, StateMeta> = {
  pass: { label: "All checks passing", tone: "success" },
  warning: { label: "Warnings present", tone: "warning" },
  failure: { label: "Failing checks", tone: "error" },
  unknown: { label: "Not fully verified", tone: "neutral" },
};

// Worst-first severity: a single failure dominates; an unmeasured check keeps
// the whole dataset "not fully verified" rather than falsely "passing".
const SEVERITY: CheckState[] = ["failure", "warning", "unknown", "pass"];

/** Derive the dataset verdict from the supplied checks (worst state wins). */
export function deriveOverallState(checks: QualityCheck[]): CheckState {
  if (checks.length === 0) return "unknown";
  for (const state of SEVERITY) {
    if (checks.some((c) => c.state === state)) return state;
  }
  return "unknown";
}

const EASE = [0.2, 0, 0, 1] as const;

function defaultFormat(value: TimeValue, now?: number): string {
  return sharedFormatTimestamp(value, now != null ? { relative: true, now } : {});
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

function StateGlyph({ state }: { state: CheckState }) {
  switch (state) {
    case "pass":
      return (
        <svg {...glyphProps}>
          <circle cx="8" cy="8" r="5.8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5.4 8.2 7.1 9.9l3.4-3.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "warning":
      return (
        <svg {...glyphProps}>
          <path d="M8 1.8 14.6 13.5H1.4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M8 6v3M8 11.2h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "failure":
      return (
        <svg {...glyphProps}>
          <circle cx="8" cy="8" r="5.8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5.7 5.7l4.6 4.6M10.3 5.7l-4.6 4.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "unknown":
    default:
      return (
        <svg {...glyphProps}>
          <circle cx="8" cy="8" r="5.8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.2 2.2" />
          <path d="M6.4 6.3a1.7 1.7 0 1 1 2.2 1.9c-.5.2-.7.5-.7 1M8 11.2h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

/** Small caret used by the expandable check rows. */
function Caret({ open, reduce }: { open: boolean; reduce: boolean }) {
  return (
    <motion.svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="shrink-0 text-[var(--color-muted)]"
      initial={false}
      animate={{ rotate: open ? 90 : 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.2, ease: EASE }}
    >
      <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}

/* -------------------------------------------------------------------------- */
/* State pill — icon + text                                                    */
/* -------------------------------------------------------------------------- */

function StatePill({
  state,
  meta,
  size = "md",
}: {
  state: CheckState;
  meta: StateMeta;
  size?: "sm" | "md";
}) {
  const vars = statusVars(meta.tone);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11.5px]" : "px-2.5 py-1 text-[12.5px]",
      )}
      style={{ color: vars.color, background: vars.bg, borderColor: vars.border }}
    >
      <StateGlyph state={state} />
      {meta.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Metric tile — honest "Unknown" when the app supplies no evidence            */
/* -------------------------------------------------------------------------- */

function metricDisplay(metric: QualityMetric | null | undefined): { value: string; known: boolean } {
  if (metric == null) return { value: "Unknown", known: false };
  if (metric.label != null && metric.label !== "") return { value: metric.label, known: true };
  if (typeof metric.score === "number" && Number.isFinite(metric.score)) {
    const pct = Math.round(Math.min(1, Math.max(0, metric.score)) * 100);
    return { value: `${pct}%`, known: true };
  }
  return { value: "Unknown", known: false };
}

function MetricTile({
  name,
  metric,
}: {
  name: string;
  metric: QualityMetric | null | undefined;
}) {
  const { value, known } = metricDisplay(metric);
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
      <span className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">{name}</span>
      <span
        className={cn(
          "text-[18px] font-semibold tabular-nums",
          known ? "text-[var(--color-fg)]" : "text-[var(--color-muted)] italic",
        )}
      >
        {value}
      </span>
      {metric?.caption ? (
        <span className="text-[11.5px] text-[var(--color-muted)]">{metric.caption}</span>
      ) : !known ? (
        <span className="text-[11.5px] text-[var(--color-muted)]">Not measured</span>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Check row — accessible, keyboard-expandable disclosure                      */
/* -------------------------------------------------------------------------- */

function CheckRow({ check, reduce }: { check: QualityCheck; reduce: boolean }) {
  const meta = CHECK_META[check.state];
  const hasIssues = !!(check.issues && check.issues.length);
  const disclosure = useDisclosure({ idPrefix: `mk-dq-${check.id}` });
  const open = hasIssues && disclosure.open;

  const RowTag: React.ElementType = hasIssues ? "button" : "div";
  const triggerProps = hasIssues
    ? { ...disclosure.triggerProps, type: "button" as const }
    : {};

  return (
    <li className="border-t border-[var(--color-border)] first:border-t-0">
      <RowTag
        {...triggerProps}
        className={cn(
          "flex w-full items-center gap-2.5 px-3 py-2.5 text-left",
          hasIssues
            ? "cursor-pointer transition-colors hover:bg-[var(--color-bg-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-focus)]"
            : "",
        )}
      >
        <span style={{ color: statusVars(meta.tone).color }}>
          <StateGlyph state={check.state} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-[var(--color-fg)]">
            {check.label}
          </span>
          {check.summary ? (
            <span className="block truncate text-[12px] text-[var(--color-muted)]">{check.summary}</span>
          ) : null}
        </span>
        {check.affectedRecords != null && check.affectedRecords > 0 ? (
          <span className="shrink-0 text-[11.5px] tabular-nums text-[var(--color-muted)]">
            {check.affectedRecords.toLocaleString()} affected
          </span>
        ) : null}
        <StatePill state={check.state} meta={meta} size="sm" />
        {hasIssues ? <Caret open={open} reduce={reduce} /> : <span className="w-[13px] shrink-0" aria-hidden />}
      </RowTag>

      {hasIssues ? (
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              {...disclosure.panelProps}
              initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.24, ease: EASE }}
              className="overflow-hidden"
            >
              <ul className="flex flex-col gap-1.5 bg-[var(--color-bg-secondary)] px-3 py-2.5 pl-9">
                {check.issues!.map((issue) => (
                  <li key={issue.id} className="flex flex-col text-[12.5px] text-[var(--color-fg)]">
                    <span>{issue.message}</span>
                    <span className="text-[11.5px] text-[var(--color-muted)]">
                      {issue.location ? issue.location : null}
                      {issue.location && issue.records != null ? " · " : null}
                      {issue.records != null ? `${issue.records.toLocaleString()} records` : null}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : null}
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Retry icon                                                                  */
/* -------------------------------------------------------------------------- */

function RetryIcon({ spinning, reduce }: { spinning: boolean; reduce: boolean }) {
  return (
    <motion.svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      animate={spinning && !reduce ? { rotate: 360 } : { rotate: 0 }}
      transition={spinning && !reduce ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0 }}
    >
      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13.4 2.2v3h-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                              */
/* -------------------------------------------------------------------------- */

/**
 * DataQualityStatus — an accessible, presentation-only data-quality panel for
 * dashboards and data products. The host application owns every fact: the
 * freshness / completeness / accuracy metrics, each validation check's verdict,
 * the affected-record counts, and the "last checked" time. This component only
 * *presents* that evidence — it never fetches, never runs a check, and never
 * fabricates a metric. Anything the app has not measured renders as "Unknown",
 * never as a made-up number. State is conveyed by icon + text (never colour
 * alone), the issue lists are keyboard-expandable, and every animation has a
 * reduced-motion path. Clean-room original.
 */
export function DataQualityStatus({
  label = "Dataset",
  source,
  metrics,
  checks,
  lastChecked,
  totalRecords,
  filter,
  defaultFilter = "all",
  onFilterChange,
  onRetry,
  validating = false,
  formatTimestamp,
  now,
  reducedMotion,
  className,
}: DataQualityStatusProps) {
  const systemReduce = useReducedMotion();
  const reduce = reducedMotion ?? systemReduce;

  const overall = React.useMemo(() => deriveOverallState(checks), [checks]);
  const overallMeta = OVERALL_META[overall];
  const overallVars = statusVars(overallMeta.tone);

  const fmt = React.useCallback(
    (value: TimeValue) => (formatTimestamp ? formatTimestamp(value) : defaultFormat(value, now)),
    [formatTimestamp, now],
  );

  /* --- filter (controlled/uncontrolled) --------------------------------- */
  const isControlled = filter !== undefined;
  const [internalFilter, setInternalFilter] = React.useState<CheckFilter>(defaultFilter);
  const activeFilter = isControlled ? (filter as CheckFilter) : internalFilter;
  const setFilter = React.useCallback(
    (next: CheckFilter) => {
      if (!isControlled) setInternalFilter(next);
      onFilterChange?.(next);
    },
    [isControlled, onFilterChange],
  );

  /* --- counts ----------------------------------------------------------- */
  const counts = React.useMemo(() => {
    const c: Record<CheckFilter, number> = { all: checks.length, pass: 0, warning: 0, failure: 0, unknown: 0 };
    for (const check of checks) c[check.state] += 1;
    return c;
  }, [checks]);

  const totalAffected = React.useMemo(
    () => checks.reduce((sum, c) => sum + (c.affectedRecords ?? 0), 0),
    [checks],
  );
  const animatedAffected = useAnimatedNumber(totalAffected, { disabled: reduce });

  const visible = React.useMemo(
    () => (activeFilter === "all" ? checks : checks.filter((c) => c.state === activeFilter)),
    [checks, activeFilter],
  );

  /* --- live region: announce verdict on change -------------------------- */
  const [announcement, setAnnouncement] = React.useState("");
  React.useEffect(() => {
    const parts = [`${label}: ${overallMeta.label}`];
    if (counts.failure) parts.push(`${counts.failure} failing`);
    if (counts.warning) parts.push(`${counts.warning} warning`);
    if (counts.unknown) parts.push(`${counts.unknown} unknown`);
    setAnnouncement(parts.join(", ") + ".");
    // Announce on verdict change only — not on every prop tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overall, counts.failure, counts.warning, counts.unknown]);

  const FILTER_ORDER: CheckFilter[] = ["all", "failure", "warning", "pass", "unknown"];
  const FILTER_LABEL: Record<CheckFilter, string> = {
    all: "All",
    pass: "Passing",
    warning: "Warning",
    failure: "Failing",
    unknown: "Unknown",
  };

  return (
    <section
      aria-label={`${label} data quality`}
      className={cn(
        "flex w-full max-w-[520px] flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-md)]",
        className,
      )}
    >
      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>

      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-[var(--color-fg)]">{label}</h3>
          {source ? <p className="mt-0.5 truncate text-[12px] text-[var(--color-muted)]">{source}</p> : null}
        </div>
        <StatePill state={overall} meta={overallMeta} />
      </div>

      {/* headline metrics — honest Unknown when not supplied */}
      <div className="grid grid-cols-3 gap-2">
        <MetricTile name="Freshness" metric={metrics?.freshness} />
        <MetricTile name="Completeness" metric={metrics?.completeness} />
        <MetricTile name="Accuracy" metric={metrics?.accuracy} />
      </div>

      {/* summary strip */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12px] text-[var(--color-muted)]">
        <span>
          {lastChecked != null ? (
            <>Last checked <span className="text-[var(--color-fg)]">{fmt(lastChecked)}</span></>
          ) : (
            <>Last checked <span className="italic">Unknown</span></>
          )}
        </span>
        <span className="tabular-nums">
          <span className="text-[var(--color-fg)]">{Math.round(animatedAffected).toLocaleString()}</span> affected
          {totalRecords != null ? <> · {totalRecords.toLocaleString()} records</> : null}
        </span>
      </div>

      {/* filter */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter checks by status">
        {FILTER_ORDER.map((f) => {
          const active = activeFilter === f;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
                active
                  ? "border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] text-[var(--color-accent)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-fg)]",
              )}
            >
              {FILTER_LABEL[f]}
              <span className="tabular-nums opacity-70">{counts[f]}</span>
            </button>
          );
        })}
      </div>

      {/* checks list */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
        {visible.length ? (
          <ul>
            {visible.map((check) => (
              <CheckRow key={check.id} check={check} reduce={reduce} />
            ))}
          </ul>
        ) : (
          <p className="px-3 py-6 text-center text-[12.5px] text-[var(--color-muted)]">
            No {activeFilter === "all" ? "" : `${FILTER_LABEL[activeFilter].toLowerCase()} `}checks to show.
          </p>
        )}
      </div>

      {/* footer actions */}
      {onRetry ? (
        <div className="flex items-center gap-2 border-t border-[var(--color-border)] pt-3">
          <button
            type="button"
            onClick={onRetry}
            disabled={validating}
            aria-label="Re-run validation"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--color-fg)] transition-colors",
              "hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <RetryIcon spinning={validating} reduce={reduce} />
            {validating ? "Validating…" : "Re-run validation"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default DataQualityStatus;
