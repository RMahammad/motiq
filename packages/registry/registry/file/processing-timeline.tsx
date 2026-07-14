"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useControllableState,
  statusVars,
  formatTimestamp as defaultFormatTimestamp,
  type StatusTone,
} from "@/lib/motionkit";

/* --------------------------------------------------------------------------
 * ProcessingTimeline — a presentation-only view of ONE item (a file, upload,
 * document, media asset, dataset row …) travelling through an ordered pipeline
 * of *processing stages* AFTER it has been ingested. Where an upload panel
 * shows one transfer's bytes and a queue manages a collection, this shows a
 * single subject moving stage-by-stage: virus scan → transcode → thumbnail →
 * caption → publish. Each stage carries its own status, optional progress,
 * duration, output artifact, warning, error, and logs; the rail communicates
 * how far the subject has travelled and what it produced along the way.
 *
 * It is strictly presentation. The host APPLICATION owns the pipeline and every
 * status — this component never runs a stage, never advances `progress` on its
 * own, never invents an output, and never claims a stage completed unless the
 * supplied `status` says so. It renders the `stages` it is given and reports
 * user intent back through callbacks (`onRetryStage`, `onSkipStage`, `onCancel`,
 * `onRestart`). There is no built-in worker; wiring stages to real work is the
 * app's job, which keeps it transport-agnostic and SSR-safe.
 *
 * Accessibility is first-class: stages are a semantic ordered list; the current
 * stage carries `aria-current="step"` and a visible "Current stage" label;
 * each stage header is a real disclosure <button> with `aria-expanded`; an
 * active/paused stage with app-supplied progress exposes `role="progressbar"`
 * with `aria-valuetext`; a failed stage's error is associated to its header via
 * `aria-describedby`; Retry / Skip / Cancel / Restart are ordinary keyboard
 * buttons; status is ALWAYS icon + text (never colour alone) so it survives
 * forced-colors; and a single polite `role="status"` region announces stage
 * transitions only — never per-percent. Under `prefers-reduced-motion`
 * everything renders in its final state, bars snap, and no stage pulses after it
 * resolves. Clean-room original.
 * ----------------------------------------------------------------------- */

/** Lifecycle of a single processing stage, owned entirely by the application. */
export type ProcessingStatus =
  | "pending"
  | "queued"
  | "active"
  | "paused"
  | "completed"
  | "warning"
  | "failed"
  | "skipped"
  | "cancelled";

export interface ProcessingStage {
  /** Stable id, unique within the pipeline. Drives keys, focus, and callbacks. */
  id: string;
  /** Short stage name, e.g. "Transcoding". */
  label: string;
  /** One-line description of what the stage does. */
  description?: string;
  /** App-owned lifecycle state. */
  status: ProcessingStatus;
  /** Progress 0–100 for an active/paused stage. App-supplied; never faked here. */
  progress?: number;
  /** When the stage started — accepts a Date, epoch ms, or ISO string. */
  startTime?: Date | number | string;
  /** When the stage ended. */
  endTime?: Date | number | string;
  /** Elapsed / total duration in milliseconds (shown in the summary + detail). */
  duration?: number;
  /** Attempts made so far (1 = first try). Shown when > 1. */
  attempt?: number;
  /** Human-readable error, shown + announced when `status === "failed"`. */
  error?: string;
  /** Non-blocking warning, shown when `status === "warning"` (partial success). */
  warning?: string;
  /** The artifact this stage produced (rendered read-only in the detail panel). */
  output?: unknown;
  /** Log lines emitted by the stage (rendered read-only). */
  logs?: string[];
  /** Free-form metadata rendered in the detail panel. */
  metadata?: Record<string, string | number>;
  /** Whether the app permits skipping this stage (enables the Skip control). */
  skippable?: boolean;
}

export interface ProcessingTimelineProps {
  /** The pipeline stages in execution order. The app owns them end to end. */
  stages: ProcessingStage[];
  /** Name of the item being processed, e.g. "product-launch-v3.mp4". */
  title: string;
  /** Secondary line under the title, e.g. file type / size / owner. */
  subtitle?: string;
  /**
   * Overall job status for the header pill. When omitted it is derived from the
   * stages (active → Processing, all resolved with a warning → Completed with
   * warnings, any failure while resolved → Failed, etc.).
   */
  jobStatus?: ProcessingStatus;
  /** The stage the pipeline is currently on (drives follow + emphasis). */
  currentStageId?: string;
  /** Rail orientation. Falls back to a stacked layout on narrow screens. */
  layout?: "vertical" | "horizontal";
  /** Denser rows / smaller nodes. */
  compact?: boolean;
  /** The selected/emphasised stage (controlled). */
  activeStageId?: string;
  /** Initial selected stage when uncontrolled. Defaults to `currentStageId`. */
  defaultActiveStageId?: string;
  /** Notified when the selected stage changes (user click or follow). */
  onActiveStageChange?: (id: string) => void;
  /** Follow `currentStageId`: select it and scroll it into view. Default true. */
  followCurrent?: boolean;
  /** Ids expanded on first render (vertical only), or `true` to expand all. */
  defaultExpanded?: string[] | boolean;
  /** Retry a failed stage. */
  onRetryStage?: (id: string) => void;
  /** Skip a stage (only offered on `skippable` non-terminal stages). */
  onSkipStage?: (id: string) => void;
  /** Cancel the whole job while it is still in flight. */
  onCancel?: () => void;
  /** Restart the whole job once it has resolved. */
  onRestart?: () => void;
  /** Custom renderer for a stage's output artifact in the detail panel. */
  renderStageOutput?: (stage: ProcessingStage) => React.ReactNode;
  /** Override timestamp formatting. */
  formatTimestamp?: (value: Date | number | string) => string;
  /** Accessible name for the whole region. Defaults to `Processing: {title}`. */
  label?: string;
  className?: string;
}

const EASE: Transition["ease"] = [0.2, 0, 0, 1];

/* -- status vocabulary — icon + label + semantic tone -------------------- */

interface StatusMetaEntry {
  label: string;
  tone: StatusTone;
  /** Whether this state shows a determinate progress bar. */
  bar: boolean;
}

const STATUS_META: Record<ProcessingStatus, StatusMetaEntry> = {
  pending: { label: "Pending", tone: "neutral", bar: false },
  queued: { label: "Queued", tone: "neutral", bar: false },
  active: { label: "Processing", tone: "active", bar: true },
  paused: { label: "Paused", tone: "warning", bar: true },
  completed: { label: "Completed", tone: "success", bar: false },
  warning: { label: "Completed with warning", tone: "warning", bar: false },
  failed: { label: "Failed", tone: "error", bar: false },
  skipped: { label: "Skipped", tone: "neutral", bar: false },
  cancelled: { label: "Cancelled", tone: "neutral", bar: false },
};

/** Stages that still represent work in flight (Cancel is offered). */
const IN_FLIGHT: ReadonlySet<ProcessingStatus> = new Set(["pending", "queued", "active", "paused"]);
/** Terminal stages whose rail segment counts as travelled + who resolve the job. */
const RESOLVED: ReadonlySet<ProcessingStatus> = new Set([
  "completed",
  "warning",
  "skipped",
  "cancelled",
  "failed",
]);
/** Stages that colour their rail segment as "travelled" (progress made). */
const TRAVELLED: ReadonlySet<ProcessingStatus> = new Set(["completed", "warning", "skipped", "active"]);

/* -- formatting helpers (pure, deterministic) ---------------------------- */

function stringify(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s % 1 === 0 ? s : s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s - m * 60)}s`;
}

function stageHasDetail(stage: ProcessingStage): boolean {
  return (
    Boolean(stage.description) ||
    stage.output !== undefined ||
    Boolean(stage.error) ||
    Boolean(stage.warning) ||
    (stage.logs?.length ?? 0) > 0 ||
    (stage.metadata != null && Object.keys(stage.metadata).length > 0) ||
    stage.startTime != null ||
    typeof stage.duration === "number"
  );
}

/** Derive a display status for the job header from its stages. */
function deriveJobStatus(stages: ProcessingStage[]): ProcessingStatus {
  if (stages.length === 0) return "pending";
  if (stages.some((s) => s.status === "active")) return "active";
  if (stages.some((s) => s.status === "paused")) return "paused";
  if (stages.some((s) => s.status === "failed")) return "failed";
  const allResolved = stages.every((s) => RESOLVED.has(s.status));
  if (allResolved) {
    if (stages.some((s) => s.status === "cancelled")) return "cancelled";
    if (stages.some((s) => s.status === "warning")) return "warning";
    return "completed";
  }
  return "queued";
}

/* -- icons — decorative, currentColor, forced-colors safe ---------------- */

const svgBase = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

function StatusIcon({ status, size = 13 }: { status: ProcessingStatus; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", ...svgBase, strokeWidth: 2.3 };
  switch (status) {
    case "completed":
      return <svg {...p}><path d="M20 6 9 17l-5-5" /></svg>;
    case "warning":
      return <svg {...p}><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 10v4M12 17h.01" /></svg>;
    case "failed":
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></svg>;
    case "paused":
      return <svg {...p}><path d="M9 5v14M15 5v14" /></svg>;
    case "skipped":
      return <svg {...p}><path d="m7 7 5 5-5 5M13 7l5 5-5 5" /></svg>;
    case "cancelled":
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></svg>;
    case "active":
      return <svg {...p}><path d="M21 12a9 9 0 1 1-9-9" /><path d="M21 4v5h-5" /></svg>;
    case "queued":
    case "pending":
    default:
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  }
}

function glyph(path: React.ReactNode, size = 13) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...svgBase}>{path}</svg>;
}
const RetryGlyph = () => glyph(<><path d="M4 12a8 8 0 1 1 2.3 5.6M4 12V7m0 5h5" /></>);
const SkipGlyph = () => glyph(<><path d="M5 5v14l9-7zM17 5v14" /></>);
const CancelGlyph = () => glyph(<><path d="M6 6l12 12M18 6 6 18" /></>);
const RestartGlyph = () => glyph(<><path d="M4 12a8 8 0 1 0 2.3-5.6M4 3v4h4" /></>);
const ChevronGlyph = () => glyph(<path d="m9 6 6 6-6 6" />, 11);

/* -- shared styles ------------------------------------------------------- */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-surface)]";

const actionBtn = cn(
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
  "[border:1px_solid_var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)]",
  "hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45",
  focusRing,
);

const dangerBtn = cn(
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
  "[border:1px_solid_var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)]",
  "hover:border-[var(--color-error)] hover:text-[var(--color-error)] disabled:cursor-not-allowed disabled:opacity-45",
  focusRing,
);

function StatusPill({ status, className }: { status: ProcessingStatus; className?: string }) {
  const meta = STATUS_META[status];
  const vars = statusVars(meta.tone);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium [border:1px_solid]",
        className,
      )}
      style={{ color: vars.color, background: vars.bg, borderColor: vars.border }}
    >
      <StatusIcon status={status} />
      <span>{meta.label}</span>
    </span>
  );
}

/* -- rail marker (shape encodes status without colour) ------------------- */

function StageMarker({ status, reduce, size }: { status: ProcessingStatus; reduce: boolean; size: number }) {
  const vars = statusVars(STATUS_META[status].tone);
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-full [border:2px_solid]"
      style={{
        width: size,
        height: size,
        color: vars.color,
        borderColor: vars.border,
        background: status === "pending" || status === "queued" ? "var(--color-surface)" : vars.bg,
      }}
      aria-hidden
    >
      {status === "active" && !reduce ? (
        <motion.span
          className="absolute inset-0 rounded-full [border:2px_solid_currentColor]"
          animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
      ) : null}
      <StatusIcon status={status} size={Math.round(size * 0.52)} />
    </span>
  );
}

/* -- detail panel content (shared by both layouts) ----------------------- */

function StageDetail({
  stage,
  formatTs,
  renderStageOutput,
}: {
  stage: ProcessingStage;
  formatTs: (v: Date | number | string) => string;
  renderStageOutput?: (stage: ProcessingStage) => React.ReactNode;
}) {
  const hasMeta = stage.metadata != null && Object.keys(stage.metadata).length > 0;
  return (
    <div className="space-y-2.5 rounded-lg [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-3 text-[12.5px]">
      {stage.startTime != null || typeof stage.duration === "number" || (stage.attempt ?? 1) > 1 ? (
        <p className="text-[11.5px] text-[var(--color-muted)] tabular-nums">
          {stage.startTime != null ? `Started ${formatTs(stage.startTime)}` : null}
          {typeof stage.duration === "number" ? `${stage.startTime != null ? " · " : ""}took ${formatDuration(stage.duration)}` : null}
          {(stage.attempt ?? 1) > 1 ? ` · attempt ${stage.attempt}` : null}
        </p>
      ) : null}

      {stage.description ? <p className="text-[var(--color-fg)]">{stage.description}</p> : null}

      {stage.warning ? (
        <div
          className="flex items-start gap-2 rounded-md px-2.5 py-2 text-[var(--color-fg)]"
          style={{ background: statusVars("warning").bg }}
        >
          <span className="mt-px shrink-0" style={{ color: "var(--color-warning)" }} aria-hidden>
            <StatusIcon status="warning" />
          </span>
          <span><span className="sr-only">Warning: </span>{stage.warning}</span>
        </div>
      ) : null}

      {stage.error ? (
        <div
          className="flex items-start gap-2 rounded-md px-2.5 py-2 text-[var(--color-fg)]"
          style={{ background: statusVars("error").bg }}
        >
          <span className="mt-px shrink-0" style={{ color: "var(--color-error)" }} aria-hidden>
            <StatusIcon status="failed" />
          </span>
          <span><span className="sr-only">Error: </span>{stage.error}</span>
        </div>
      ) : null}

      {stage.output !== undefined ? (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Output</p>
          {renderStageOutput ? (
            renderStageOutput(stage)
          ) : (
            <pre className="overflow-x-auto rounded-md [border:1px_solid_var(--color-border)] bg-[var(--color-code-bg,var(--color-surface))] px-2.5 py-2 font-mono text-[12px] leading-relaxed text-[var(--color-code-fg,var(--color-fg))]">
              {stringify(stage.output)}
            </pre>
          )}
        </div>
      ) : null}

      {stage.logs && stage.logs.length > 0 ? (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Logs</p>
          <ul className="space-y-0.5 rounded-md [border:1px_solid_var(--color-border)] bg-[var(--color-code-bg,var(--color-surface))] px-2.5 py-2 font-mono text-[11.5px] leading-relaxed text-[var(--color-muted)]">
            {stage.logs.map((line, i) => (
              <li key={i} className="whitespace-pre-wrap break-words">{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasMeta ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11.5px]">
          {Object.entries(stage.metadata ?? {}).map(([k, v]) => (
            <React.Fragment key={k}>
              <dt className="text-[var(--color-muted)]">{k}</dt>
              <dd className="truncate font-medium text-[var(--color-fg)]">{String(v)}</dd>
            </React.Fragment>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

/* -- per-stage action cluster (retry / skip) ----------------------------- */

function StageActions({
  stage,
  onRetryStage,
  onSkipStage,
}: {
  stage: ProcessingStage;
  onRetryStage?: (id: string) => void;
  onSkipStage?: (id: string) => void;
}) {
  const canRetry = onRetryStage && stage.status === "failed";
  const canSkip = onSkipStage && stage.skippable && !RESOLVED.has(stage.status);
  if (!canRetry && !canSkip) return null;
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {canRetry ? (
        <button type="button" className={actionBtn} onClick={() => onRetryStage!(stage.id)} aria-label={`Retry ${stage.label}`}>
          <RetryGlyph /> Retry
        </button>
      ) : null}
      {canSkip ? (
        <button type="button" className={actionBtn} onClick={() => onSkipStage!(stage.id)} aria-label={`Skip ${stage.label}`}>
          <SkipGlyph /> Skip
        </button>
      ) : null}
    </div>
  );
}

/* -- progress bar (only for app-supplied active/paused progress) --------- */

function StageProgress({ stage, reduce }: { stage: ProcessingStage; reduce: boolean }) {
  const meta = STATUS_META[stage.status];
  if (!meta.bar || typeof stage.progress !== "number") return null;
  const vars = statusVars(meta.tone);
  const value = Math.max(0, Math.min(100, Math.round(stage.progress)));
  const isPaused = stage.status === "paused";
  return (
    <div className="mt-2 flex items-center gap-2">
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${meta.label} — ${value}%`}
        aria-label={`${stage.label} progress`}
        className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-bg-secondary)]"
      >
        <div
          className={cn("h-full rounded-full", reduce ? "" : "transition-[width] duration-300 ease-out")}
          style={{ width: `${value}%`, background: vars.color, opacity: isPaused ? 0.55 : 1 }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-[11.5px] font-medium text-[var(--color-muted)] tabular-nums">{value}%</span>
    </div>
  );
}

/* -- vertical row -------------------------------------------------------- */

interface VerticalRowProps {
  stage: ProcessingStage;
  index: number;
  total: number;
  expanded: boolean;
  isCurrent: boolean;
  compact: boolean;
  reduce: boolean;
  formatTs: (v: Date | number | string) => string;
  renderStageOutput?: (stage: ProcessingStage) => React.ReactNode;
  registerHeader: (id: string, el: HTMLButtonElement | null) => void;
  registerRow: (id: string, el: HTMLLIElement | null) => void;
  onToggle: (id: string) => void;
  onRetryStage?: (id: string) => void;
  onSkipStage?: (id: string) => void;
}

function VerticalRow({
  stage,
  index,
  total,
  expanded,
  isCurrent,
  compact,
  reduce,
  formatTs,
  renderStageOutput,
  registerHeader,
  registerRow,
  onToggle,
  onRetryStage,
  onSkipStage,
}: VerticalRowProps) {
  const meta = STATUS_META[stage.status];
  const vars = statusVars(meta.tone);
  const hasDetail = stageHasDetail(stage);
  const isLast = index === total - 1;
  const panelId = `mk-pt-panel-${stage.id}`;
  const errorId = `mk-pt-err-${stage.id}`;
  const isFailed = stage.status === "failed";

  return (
    <motion.li
      ref={(el) => registerRow(stage.id, el)}
      layout={reduce ? false : "position"}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={{ duration: 0.26, ease: EASE }}
      className="relative flex gap-3"
      data-status={stage.status}
      data-current={isCurrent || undefined}
    >
      {/* rail: marker + connector */}
      <div className="relative flex shrink-0 flex-col items-center">
        <StageMarker status={stage.status} reduce={reduce} size={compact ? 24 : 28} />
        {!isLast ? (
          <span
            aria-hidden
            className="mt-1 w-[2px] flex-1 rounded-full"
            style={{
              background: TRAVELLED.has(stage.status)
                ? `color-mix(in oklab, ${vars.color} 55%, var(--color-border))`
                : "var(--color-border)",
            }}
          />
        ) : null}
      </div>

      {/* card */}
      <div
        className={cn("mb-2.5 min-w-0 flex-1 rounded-xl bg-[var(--color-surface)] [border:1px_solid_var(--color-border)]")}
        style={isCurrent || isFailed ? { borderColor: vars.border, boxShadow: `0 0 0 1px ${vars.border}` } : undefined}
      >
        <div className={cn("flex items-start gap-2 pl-3 pr-2", compact ? "py-2" : "py-2.5")}>
          <button
            type="button"
            ref={(el) => registerHeader(stage.id, el)}
            aria-expanded={hasDetail ? expanded : undefined}
            aria-controls={hasDetail && expanded ? panelId : undefined}
            aria-describedby={isFailed && stage.error ? errorId : undefined}
            aria-current={isCurrent ? "step" : undefined}
            onClick={() => onToggle(stage.id)}
            className={cn("flex min-w-0 flex-1 items-start gap-2 rounded-lg text-left", focusRing)}
          >
            <span
              className={cn(
                "mt-0.5 grid h-4 w-4 shrink-0 place-items-center text-[var(--color-muted)] transition-transform",
                expanded ? "rotate-90" : "rotate-0",
                !hasDetail && "opacity-0",
              )}
              aria-hidden
            >
              <ChevronGlyph />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-mono text-[11px] text-[var(--color-muted)]" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "min-w-0 truncate font-medium text-[var(--color-fg)]",
                    compact ? "text-[13px]" : "text-[13.5px]",
                    stage.status === "skipped" || stage.status === "cancelled"
                      ? "line-through decoration-[var(--color-muted)]"
                      : "",
                  )}
                >
                  {stage.label}
                </span>
                {isCurrent ? (
                  <span className="rounded bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                    Current stage
                  </span>
                ) : null}
              </span>
              {!compact && stage.description ? (
                <span className="mt-0.5 block truncate text-[12px] text-[var(--color-muted)]">{stage.description}</span>
              ) : null}
              {isFailed && stage.error ? (
                <span id={errorId} className="mt-1 block truncate text-[12px] text-[var(--color-error)]">
                  {stage.error}
                </span>
              ) : null}
            </span>
          </button>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <StatusPill status={stage.status} />
            <StageActions stage={stage} onRetryStage={onRetryStage} onSkipStage={onSkipStage} />
          </div>
        </div>

        <div className="px-3 pb-1">
          <StageProgress stage={stage} reduce={reduce} />
        </div>

        {/* expandable detail */}
        <AnimatePresence initial={false}>
          {expanded && hasDetail ? (
            <motion.div
              key="detail"
              id={panelId}
              role="region"
              aria-label={`${stage.label} details`}
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.24, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="mx-3 mb-3 mt-0.5">
                <StageDetail stage={stage} formatTs={formatTs} renderStageOutput={renderStageOutput} />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.li>
  );
}

/* -- horizontal node ----------------------------------------------------- */

function HorizontalNode({
  stage,
  index,
  total,
  selected,
  isCurrent,
  compact,
  reduce,
  registerHeader,
  onSelect,
  panelId,
}: {
  stage: ProcessingStage;
  index: number;
  total: number;
  selected: boolean;
  isCurrent: boolean;
  compact: boolean;
  reduce: boolean;
  registerHeader: (id: string, el: HTMLButtonElement | null) => void;
  onSelect: (id: string) => void;
  panelId: string;
}) {
  const meta = STATUS_META[stage.status];
  const vars = statusVars(meta.tone);
  const isLast = index === total - 1;
  return (
    <li className="flex min-w-0 flex-1 items-center" data-status={stage.status} data-current={isCurrent || undefined}>
      <button
        type="button"
        ref={(el) => registerHeader(stage.id, el)}
        aria-controls={panelId}
        aria-current={isCurrent ? "step" : undefined}
        aria-pressed={selected}
        onClick={() => onSelect(stage.id)}
        className={cn(
          "group flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl px-2 py-2 text-center transition-colors",
          selected ? "bg-[var(--color-bg-secondary)]" : "hover:bg-[var(--color-bg-secondary)]",
          focusRing,
        )}
        style={selected ? { boxShadow: `inset 0 0 0 1px ${vars.border}` } : undefined}
      >
        <StageMarker status={stage.status} reduce={reduce} size={compact ? 26 : 30} />
        <span className="flex min-w-0 flex-col items-center">
          <span className={cn("min-w-0 max-w-full truncate font-medium text-[var(--color-fg)]", compact ? "text-[12px]" : "text-[12.5px]")}>
            {stage.label}
          </span>
          <span className="text-[10.5px] text-[var(--color-muted)]">{meta.label}</span>
        </span>
      </button>
      {!isLast ? (
        <span
          aria-hidden
          className="mx-0.5 h-[2px] w-6 shrink-0 rounded-full"
          style={{
            background: TRAVELLED.has(stage.status)
              ? `color-mix(in oklab, ${vars.color} 55%, var(--color-border))`
              : "var(--color-border)",
          }}
        />
      ) : null}
    </li>
  );
}

/* -- root component ------------------------------------------------------ */

export function ProcessingTimeline({
  stages,
  title,
  subtitle,
  jobStatus,
  currentStageId,
  layout = "vertical",
  compact = false,
  activeStageId,
  defaultActiveStageId,
  onActiveStageChange,
  followCurrent = true,
  defaultExpanded,
  onRetryStage,
  onSkipStage,
  onCancel,
  onRestart,
  renderStageOutput,
  formatTimestamp,
  label,
  className,
}: ProcessingTimelineProps) {
  const reduce = useReducedMotion();
  const formatTs = React.useMemo(
    () => formatTimestamp ?? ((v: Date | number | string) => defaultFormatTimestamp(v)),
    [formatTimestamp],
  );

  const [selectedId, setSelectedId] = useControllableState<string>({
    value: activeStageId,
    defaultValue: defaultActiveStageId ?? currentStageId ?? stages[0]?.id ?? "",
    onChange: onActiveStageChange,
  });

  const [expanded, setExpanded] = React.useState<Set<string>>(() => {
    if (defaultExpanded === true) return new Set(stages.map((s) => s.id));
    if (Array.isArray(defaultExpanded)) return new Set(defaultExpanded);
    return new Set();
  });

  const headerRefs = React.useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const rowRefs = React.useRef<Map<string, HTMLLIElement | null>>(new Map());
  const registerHeader = React.useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) headerRefs.current.set(id, el);
    else headerRefs.current.delete(id);
  }, []);
  const registerRow = React.useCallback((id: string, el: HTMLLIElement | null) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  }, []);

  const handleToggle = React.useCallback((id: string) => {
    setSelectedId(id);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [setSelectedId]);

  const handleSelect = React.useCallback((id: string) => setSelectedId(id), [setSelectedId]);

  // Retry/skip keep focus on the stage header the app is about to re-render.
  const focusHeader = React.useCallback((id: string) => {
    const run = () => headerRefs.current.get(id)?.focus();
    if (typeof requestAnimationFrame === "undefined") run();
    else requestAnimationFrame(run);
  }, []);
  const handleRetry = React.useCallback((id: string) => { onRetryStage?.(id); focusHeader(id); }, [onRetryStage, focusHeader]);
  const handleSkip = React.useCallback((id: string) => { onSkipStage?.(id); focusHeader(id); }, [onSkipStage, focusHeader]);

  // Follow the current stage: select + scroll into view when it moves.
  const prevCurrent = React.useRef<string | undefined>(currentStageId);
  React.useEffect(() => {
    if (!followCurrent || !currentStageId || currentStageId === prevCurrent.current) {
      prevCurrent.current = currentStageId;
      return;
    }
    prevCurrent.current = currentStageId;
    setSelectedId(currentStageId);
    const el = rowRefs.current.get(currentStageId);
    if (el && typeof el.scrollIntoView === "function") {
      try {
        el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
      } catch {
        /* jsdom / no layout — safe to ignore */
      }
    }
  }, [currentStageId, followCurrent, reduce, setSelectedId]);

  // Announce stage transitions only (never per-percent).
  const prevStatuses = React.useRef<Map<string, ProcessingStatus>>(new Map());
  const [liveMessage, setLiveMessage] = React.useState("");
  React.useEffect(() => {
    const prev = prevStatuses.current;
    const messages: string[] = [];
    const seen = new Set<string>();
    for (const s of stages) {
      seen.add(s.id);
      const before = prev.get(s.id);
      if (before !== undefined && before !== s.status) {
        if (s.status === "failed") messages.push(`${s.label} failed${s.error ? `: ${s.error}` : ""}`);
        else if (s.status === "warning") messages.push(`${s.label} completed with a warning`);
        else messages.push(`${s.label} ${STATUS_META[s.status].label.toLowerCase()}`);
      }
      prev.set(s.id, s.status);
    }
    for (const id of prev.keys()) if (!seen.has(id)) prev.delete(id);
    if (messages.length) setLiveMessage(messages.join(". "));
  }, [stages]);

  /* summary + derived state */
  const total = stages.length;
  const summary = React.useMemo(() => {
    let completed = 0, failed = 0, warnings = 0, skipped = 0, resolved = 0, totalDuration = 0;
    for (const s of stages) {
      if (s.status === "completed") completed++;
      else if (s.status === "warning") { completed++; warnings++; }
      else if (s.status === "failed") failed++;
      else if (s.status === "skipped") skipped++;
      if (RESOLVED.has(s.status)) resolved++;
      if (typeof s.duration === "number" && Number.isFinite(s.duration)) totalDuration += s.duration;
    }
    return { completed, failed, warnings, skipped, resolved, totalDuration };
  }, [stages]);

  const pct = total > 0 ? Math.round((summary.resolved / total) * 100) : 0;
  const displayStatus = jobStatus ?? deriveJobStatus(stages);
  const inFlight = stages.some((s) => IN_FLIGHT.has(s.status)) && displayStatus !== "cancelled";
  const jobResolved = total > 0 && stages.every((s) => RESOLVED.has(s.status));
  const jobLabel = label ?? `Processing: ${title}`;

  const selectedStage = stages.find((s) => s.id === selectedId) ?? stages.find((s) => s.id === currentStageId) ?? stages[0];
  const horizontalPanelId = "mk-pt-hpanel";

  return (
    <section
      aria-label={jobLabel}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl bg-[var(--color-bg,var(--color-surface))] shadow-[var(--shadow-md)] [border:1px_solid_var(--color-border)]",
        className,
      )}
    >
      {/* header — the subject being processed */}
      <header className="flex flex-wrap items-start gap-x-3 gap-y-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3">
        <span
          className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--color-accent)]"
          style={{ background: "color-mix(in oklab, var(--color-accent) 14%, transparent)" }}
          aria-hidden
        >
          <svg width="18" height="18" viewBox="0 0 24 24" {...svgBase} strokeWidth={1.8}>
            <path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
            <path d="M14 2v4h4M8.5 13l2.5 2.5L15.5 11" />
          </svg>
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 truncate text-[14px] font-semibold text-[var(--color-fg)]" title={title}>{title}</h3>
            <StatusPill status={displayStatus} />
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-[var(--color-muted)] tabular-nums">
            {subtitle ? <span className="truncate">{subtitle}</span> : null}
            {subtitle ? <span aria-hidden>·</span> : null}
            <span>{summary.resolved} of {total} stages</span>
            {summary.warnings > 0 ? (
              <>
                <span aria-hidden>·</span>
                <span style={{ color: "var(--color-warning)" }}>{summary.warnings} warning{summary.warnings === 1 ? "" : "s"}</span>
              </>
            ) : null}
            {summary.failed > 0 ? (
              <>
                <span aria-hidden>·</span>
                <span style={{ color: "var(--color-error)" }}>{summary.failed} failed</span>
              </>
            ) : null}
          </p>
        </div>

        {/* job-level actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          {jobResolved && onRestart ? (
            <button type="button" className={actionBtn} onClick={() => onRestart()}>
              <RestartGlyph /> Restart
            </button>
          ) : null}
          {inFlight && onCancel ? (
            <button type="button" className={dangerBtn} onClick={() => onCancel()}>
              <CancelGlyph /> Cancel
            </button>
          ) : null}
        </div>

        {/* overall progress (resolved stages / total) */}
        <div className="mt-1 w-full">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={summary.resolved}
            aria-valuetext={`${summary.resolved} of ${total} stages complete`}
            aria-label={`${title} pipeline progress`}
            className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface)] [border:1px_solid_var(--color-border)]"
          >
            <motion.span
              className="block h-full rounded-full"
              style={{ background: statusVars(STATUS_META[displayStatus].tone).color }}
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE }}
            />
          </div>
        </div>
      </header>

      {/* polite live region — stage transitions only */}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{liveMessage}</p>

      {/* body */}
      {total === 0 ? (
        <p className="px-4 py-8 text-center text-[13px] text-[var(--color-muted)]">This pipeline has no stages yet.</p>
      ) : layout === "horizontal" ? (
        <div className="flex flex-col gap-3 p-3">
          {/* horizontal on wide screens; stacked node column on narrow screens */}
          <ol className="hidden items-start gap-0 sm:flex" aria-label={`${title} stages`}>
            {stages.map((stage, index) => (
              <HorizontalNode
                key={stage.id}
                stage={stage}
                index={index}
                total={total}
                selected={stage.id === selectedId}
                isCurrent={stage.id === currentStageId}
                compact={compact}
                reduce={reduce}
                registerHeader={registerHeader}
                onSelect={handleSelect}
                panelId={horizontalPanelId}
              />
            ))}
          </ol>

          {/* narrow-screen fallback: vertical rail */}
          <ol className="flex flex-col sm:hidden" aria-label={`${title} stages`}>
            {stages.map((stage, index) => (
              <VerticalRow
                key={stage.id}
                stage={stage}
                index={index}
                total={total}
                expanded={expanded.has(stage.id)}
                isCurrent={stage.id === currentStageId}
                compact={compact}
                reduce={reduce}
                formatTs={formatTs}
                renderStageOutput={renderStageOutput}
                registerHeader={registerHeader}
                registerRow={registerRow}
                onToggle={handleToggle}
                onRetryStage={handleRetry}
                onSkipStage={handleSkip}
              />
            ))}
          </ol>

          {/* selected-stage detail panel (wide screens) */}
          {selectedStage ? (
            <div id={horizontalPanelId} className="hidden sm:block">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-[var(--color-fg)]">{selectedStage.label}</span>
                <StatusPill status={selectedStage.status} />
                <div className="ml-auto"><StageActions stage={selectedStage} onRetryStage={handleRetry} onSkipStage={handleSkip} /></div>
              </div>
              <StageProgress stage={selectedStage} reduce={reduce} />
              {stageHasDetail(selectedStage) ? (
                <div className="mt-2">
                  <StageDetail
                    stage={selectedStage}
                    formatTs={formatTs}
                    renderStageOutput={renderStageOutput}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <ol className="flex flex-col px-3.5 pb-2 pt-3" aria-label={`${title} stages`}>
          <AnimatePresence initial={false}>
            {stages.map((stage, index) => (
              <VerticalRow
                key={stage.id}
                stage={stage}
                index={index}
                total={total}
                expanded={expanded.has(stage.id)}
                isCurrent={stage.id === currentStageId}
                compact={compact}
                reduce={reduce}
                formatTs={formatTs}
                renderStageOutput={renderStageOutput}
                registerHeader={registerHeader}
                registerRow={registerRow}
                onToggle={handleToggle}
                onRetryStage={handleRetry}
                onSkipStage={handleSkip}
              />
            ))}
          </AnimatePresence>
        </ol>
      )}

      {/* duration summary footer — only shown once the job resolves (never faked) */}
      {jobResolved ? (
        <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-[12px] text-[var(--color-muted)]">
          <span className="inline-flex items-center gap-1.5 font-medium text-[var(--color-fg)]">
            <StatusIcon status={displayStatus} />
            {displayStatus === "failed"
              ? "Pipeline failed"
              : summary.warnings > 0
                ? "Completed with warnings"
                : summary.skipped > 0
                  ? "Completed (some stages skipped)"
                  : "All stages completed"}
          </span>
          {summary.totalDuration > 0 ? (
            <span className="tabular-nums">Total time {formatDuration(summary.totalDuration)}</span>
          ) : null}
          <span className="tabular-nums">
            {summary.completed} done{summary.skipped ? ` · ${summary.skipped} skipped` : ""}{summary.failed ? ` · ${summary.failed} failed` : ""}
          </span>
        </footer>
      ) : null}
    </section>
  );
}

export default ProcessingTimeline;
