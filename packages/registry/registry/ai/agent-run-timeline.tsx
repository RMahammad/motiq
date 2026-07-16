"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";

import { cn } from "@/lib/utils";
import {
  getStatusMeta,
  statusVars,
  formatTimestamp as defaultFormatTimestamp,
  useReducedMotion,
  useDisclosure,
  useCopy,
  useControllableState,
  scrollIntoViewWithin,
  streamItemVariants,
  type StatusTone,
} from "@/lib/motionkit";

/**
 * AgentRunTimeline — a run-level view of a multi-step agent / automation run.
 * Where a flat "tool call" list shows *what was invoked*, this shows *how a run
 * unfolds*: an ordered rail of steps, each with an optional tool call, output,
 * error, retry attempts, nested sub-stages, and a summary — plus human approval
 * checkpoints and run-level lifecycle controls (cancel / resume).
 *
 * It is strictly a *presentation* component. The application owns the run and
 * every status; the component never executes an agent, never generates
 * reasoning, never reveals chain-of-thought, never invents confidence or a
 * verification result, and never claims a step succeeded unless the supplied
 * `status` says so. It renders exactly the `run` you give it and reports user
 * intent back through callbacks.
 *
 * Accessibility: run + step status are conveyed with an icon AND a text label
 * AND a border — never colour alone — so they survive forced-colors. Steps are a
 * semantic ordered list; each step header is a real disclosure <button> with
 * `aria-expanded`; Approve / Reject / Retry / Cancel / Resume / Copy are real
 * <button>s with accessible names. A single polite `role="status"` region
 * announces lifecycle transitions (run + step) — never on every render. Under
 * `prefers-reduced-motion` everything renders in its final state with no motion
 * and no perpetual pulse after a step resolves. Focus is preserved on the
 * relevant step after Retry / Approve / Reject. Clean-room original.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type RunStatus =
  | "queued"
  | "running"
  | "waiting"
  | "completed"
  | "failed"
  | "cancelled"
  | "paused";

export type StepStatus =
  | "pending"
  | "active"
  | "completed"
  | "failed"
  | "skipped"
  | "waiting_approval"
  | "cancelled";

export interface ToolCall {
  /** Tool / function name, e.g. "repo.read_file". */
  name: string;
  /** Arguments the tool was invoked with (rendered read-only). */
  arguments?: unknown;
  /** Result the tool returned (rendered read-only). */
  result?: unknown;
}

/** An optional nested sub-stage of a step (rendered as a nested ordered list). */
export interface RunStage {
  id: string;
  label: string;
  status: StepStatus;
}

export interface RunStep {
  /** Stable identifier. */
  id: string;
  /** Human-readable step name, e.g. "Generate migration proposal". */
  title: string;
  /** One-line description of what the step does. */
  description?: string;
  /** Lifecycle state, owned by the application. */
  status: StepStatus;
  /** When the step started — accepts a Date, epoch ms, or ISO string. */
  startedAt?: Date | number | string;
  /** When the step ended. */
  endedAt?: Date | number | string;
  /** Elapsed / total duration in milliseconds. */
  durationMs?: number;
  /** The tool this step invoked, if any. */
  toolCall?: ToolCall;
  /** Result the step produced (rendered read-only). */
  output?: unknown;
  /** Error message shown on a failed step. */
  error?: string;
  /** Attempts made so far (1 = first try). Shown when > 1 or maxAttempts set. */
  attempts?: number;
  /** Maximum attempts the app permits. */
  maxAttempts?: number;
  /** Optional nested sub-stages. */
  stages?: RunStage[];
  /** Optional short summary of the step's result. */
  summary?: string;
  /** Extra detail node rendered inside the expanded panel. */
  details?: React.ReactNode;
}

export interface AgentRun {
  /** Run title, e.g. "Apply database migration". */
  title: string;
  /** Run lifecycle state, owned by the application. */
  status: RunStatus;
  /** When the run started. */
  startedAt?: Date | number | string;
  /** When the run ended. */
  endedAt?: Date | number | string;
  /** The step the run is currently on (drives follow + emphasis). */
  currentStepId?: string;
  /** Steps in execution order. */
  steps: RunStep[];
  /** Optional run-level summary, shown once the run resolves. */
  summary?: string;
}

export interface AgentRunTimelineProps {
  /** The run to render. The app owns it end to end. */
  run: AgentRun;
  /** The selected/emphasised step (controlled). */
  activeStepId?: string;
  /** Initial selected step when uncontrolled. Defaults to `run.currentStepId`. */
  defaultActiveStepId?: string;
  /** Notified when the selected step changes (user click or follow). */
  onActiveStepChange?: (id: string) => void;
  /** Follow `run.currentStepId`: select it and scroll it into view. Default true. */
  followActive?: boolean;
  /** Notified when Retry is pressed on a failed step. */
  onRetryStep?: (id: string) => void;
  /** Notified when Cancel run is pressed. */
  onCancelRun?: () => void;
  /** Notified when Resume is pressed on a paused run. */
  onResumeRun?: () => void;
  /** Notified when Approve is pressed on a `waiting_approval` step. */
  onApprove?: (id: string) => void;
  /** Notified when Reject is pressed on a `waiting_approval` step. */
  onReject?: (id: string) => void;
  /** Notified after a successful "Copy run details", with the serialised text. */
  onCopyRun?: (text: string) => void;
  /** Compress resolved steps (completed / skipped / cancelled) to a slim line. */
  compactCompleted?: boolean;
  /** Ids expanded on first render, or `true` to expand every step. */
  defaultExpanded?: string[] | boolean;
  /** Custom renderer for a step's extra details in the expanded panel. */
  renderStepDetails?: (step: RunStep) => React.ReactNode;
  /** Custom renderer for a step's output in the expanded panel. */
  renderOutput?: (step: RunStep) => React.ReactNode;
  /** Override timestamp formatting. */
  formatTimestamp?: (value: Date | number | string) => string;
  /** Accessible label / heading for the run panel. Defaults to `run.title`. */
  title?: string;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Motion + status metadata                                                    */
/* -------------------------------------------------------------------------- */

const EASE: Transition["ease"] = [0.2, 0, 0, 1];

/** Terminal step states whose row compresses under `compactCompleted`. */
const RESOLVED_QUIET: ReadonlySet<StepStatus> = new Set(["completed", "skipped", "cancelled"]);

/** Step transitions worth an out-loud announcement. */
const ANNOUNCE_STEP: ReadonlySet<StepStatus> = new Set([
  "active",
  "completed",
  "failed",
  "waiting_approval",
  "skipped",
  "cancelled",
]);

/** Run states that mean the run is still in flight (Cancel is offered). */
const RUN_IN_FLIGHT: ReadonlySet<RunStatus> = new Set(["queued", "running", "waiting", "paused"]);

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
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s % 1 === 0 ? s : s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s - m * 60)}s`;
}

function stepHasDetails(step: RunStep): boolean {
  return (
    Boolean(step.description) ||
    step.toolCall != null ||
    step.output !== undefined ||
    Boolean(step.error) ||
    (step.stages?.length ?? 0) > 0 ||
    Boolean(step.summary) ||
    step.details != null ||
    step.startedAt != null
  );
}

function runToText(run: AgentRun): string {
  const lines: string[] = [
    `Run: ${run.title} — ${getStatusMeta(run.status).label}`,
  ];
  run.steps.forEach((step, i) => {
    lines.push("");
    lines.push(`${i + 1}. ${step.title} — ${getStatusMeta(step.status).label}`);
    if (step.description) lines.push(`   ${step.description}`);
    if (step.toolCall) {
      lines.push(`   Tool: ${step.toolCall.name}`);
      if (step.toolCall.arguments !== undefined) lines.push(`   Arguments: ${stringify(step.toolCall.arguments)}`);
      if (step.toolCall.result !== undefined) lines.push(`   Result: ${stringify(step.toolCall.result)}`);
    }
    if (step.output !== undefined) lines.push(`   Output: ${stringify(step.output)}`);
    if (typeof step.attempts === "number" && step.attempts > 1) lines.push(`   Attempts: ${step.attempts}`);
    if (step.error) lines.push(`   Error: ${step.error}`);
    if (step.summary) lines.push(`   Summary: ${step.summary}`);
  });
  if (run.summary) {
    lines.push("");
    lines.push(`Summary: ${run.summary}`);
  }
  return lines.join("\n");
}

/* -------------------------------------------------------------------------- */
/* Icons — all decorative, currentColor, forced-colors safe                    */
/* -------------------------------------------------------------------------- */

const ICON = { viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
const STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Node marker on the timeline rail — the shape encodes status without colour. */
function StepMarker({ status, reduce }: { status: StepStatus; reduce: boolean }) {
  const common = { width: 12, height: 12, ...ICON } as const;
  switch (status) {
    case "active":
      return (
        <span className="relative grid h-3 w-3 place-items-center" aria-hidden>
          {!reduce ? (
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-current"
              animate={{ scale: [1, 1.9], opacity: [0.55, 0] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: "easeOut" }}
            />
          ) : null}
          <span className="h-2.5 w-2.5 rounded-full bg-current" />
        </span>
      );
    case "completed":
      return (
        <svg {...common}>
          <path d="m5 13 4 4L19 7" {...STROKE} strokeWidth={2.6} />
        </svg>
      );
    case "failed":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" {...STROKE} strokeWidth={2.4} />
        </svg>
      );
    case "waiting_approval":
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5c0 4.2 2.9 7.7 7 9 4.1-1.3 7-4.8 7-9V6z" {...STROKE} strokeWidth={1.8} />
        </svg>
      );
    case "skipped":
      return (
        <svg {...common}>
          <path d="m6 6 6 6-6 6M13 6l6 6-6 6" {...STROKE} strokeWidth={2} />
        </svg>
      );
    case "cancelled":
      return (
        <svg {...common}>
          <path d="M7 12h10" {...STROKE} strokeWidth={2.4} />
        </svg>
      );
    default: // pending
      return <span className="h-2 w-2 rounded-full border-2 border-current" aria-hidden />;
  }
}

/** Small status glyph used in chips (kept simple + legible at 14px). */
function StatusGlyph({ status, reduce }: { status: StepStatus | RunStatus; reduce: boolean }) {
  const common = { width: 13, height: 13, ...ICON } as const;
  switch (status) {
    case "active":
    case "running":
      return (
        <span className="relative flex h-3 w-3 items-center justify-center" aria-hidden>
          {!reduce ? (
            <motion.span
              className="absolute h-3 w-3 rounded-full border-2 border-current opacity-40"
              animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
            />
          ) : null}
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      );
    case "completed":
      return (
        <svg {...common}>
          <path d="m5 13 4 4L19 7" {...STROKE} strokeWidth={2.4} />
        </svg>
      );
    case "failed":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" {...STROKE} strokeWidth={1.7} />
          <path d="M12 7.5v5M12 16h.01" {...STROKE} strokeWidth={2} />
        </svg>
      );
    case "waiting":
    case "waiting_approval":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" {...STROKE} strokeWidth={1.7} />
          <path d="M12 8v4l2.5 1.5" {...STROKE} strokeWidth={1.8} />
        </svg>
      );
    case "paused":
      return (
        <svg {...common}>
          <path d="M9 6v12M15 6v12" {...STROKE} strokeWidth={2.1} />
        </svg>
      );
    case "cancelled":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" {...STROKE} strokeWidth={1.7} />
          <path d="M8 12h8" {...STROKE} strokeWidth={2} />
        </svg>
      );
    case "skipped":
      return (
        <svg {...common}>
          <path d="m7 7 5 5-5 5M13 7l5 5-5 5" {...STROKE} strokeWidth={1.9} />
        </svg>
      );
    default: // pending / queued
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" {...STROKE} strokeWidth={1.7} strokeDasharray="3 3.2" />
        </svg>
      );
  }
}

/* -------------------------------------------------------------------------- */
/* Controls                                                                     */
/* -------------------------------------------------------------------------- */

const actionBtn =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:opacity-50";

const neutralBtn =
  "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]";

function StatusChip({
  status,
  reduce,
  className,
}: {
  status: StepStatus | RunStatus;
  reduce: boolean;
  className?: string;
}) {
  const meta = getStatusMeta(status);
  const vars = statusVars(meta.tone as StatusTone);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium",
        className,
      )}
      style={{ color: vars.color, borderColor: vars.border, background: vars.bg }}
    >
      <StatusGlyph status={status} reduce={reduce} />
      {meta.label}
    </span>
  );
}

function ArgumentsBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">{label}</p>
      <pre className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-code-bg)] px-2.5 py-2 font-mono text-[12px] leading-relaxed text-[var(--color-code-fg)]">
        {stringify(value)}
      </pre>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step row                                                                     */
/* -------------------------------------------------------------------------- */

interface StepRowProps {
  step: RunStep;
  index: number;
  total: number;
  expanded: boolean;
  selected: boolean;
  isCurrent: boolean;
  compact: boolean;
  reduce: boolean;
  formatTs: (value: Date | number | string) => string;
  registerHeader: (id: string, el: HTMLButtonElement | null) => void;
  registerRow: (id: string, el: HTMLLIElement | null) => void;
  onSelect: (id: string) => void;
  onToggle: (id: string, next: boolean) => void;
  onRetryStep?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  renderStepDetails?: (step: RunStep) => React.ReactNode;
  renderOutput?: (step: RunStep) => React.ReactNode;
}

function StepRow({
  step,
  index,
  total,
  expanded,
  selected,
  isCurrent,
  compact,
  reduce,
  formatTs,
  registerHeader,
  registerRow,
  onSelect,
  onToggle,
  onRetryStep,
  onApprove,
  onReject,
  renderStepDetails,
  renderOutput,
}: StepRowProps) {
  const meta = getStatusMeta(step.status);
  const tone = meta.tone as StatusTone;
  const vars = statusVars(tone);
  const hasDetails = stepHasDetails(step);
  const isFailed = step.status === "failed";
  const isWaiting = step.status === "waiting_approval";
  const attention = isFailed || isWaiting;

  // Disclosure owns the trigger/panel wiring + ids; parent owns the open state.
  const disc = useDisclosure({
    open: expanded,
    onOpenChange: (next) => onToggle(step.id, next),
    idPrefix: "mk-step",
  });

  const errorId = `${disc.panelProps.id}-err`;
  const showAttempts = typeof step.attempts === "number" && (step.attempts > 1 || step.maxAttempts != null);
  const isLast = index === total - 1;
  // The rail segment below a resolved node is "travelled" (accent); pending is quiet.
  const travelled = step.status === "completed" || step.status === "skipped" || step.status === "active";

  const onHeaderClick = () => {
    onSelect(step.id);
    if (hasDetails) disc.toggle();
  };

  return (
    <motion.li
      ref={(el) => registerRow(step.id, el)}
      layout={reduce ? false : "position"}
      variants={reduce ? undefined : streamItemVariants}
      initial={reduce ? false : "initial"}
      animate="animate"
      exit={reduce ? undefined : "exit"}
      transition={{ duration: 0.3, ease: EASE }}
      data-status={step.status}
      data-current={isCurrent || undefined}
      className="relative flex gap-3"
    >
      {/* Rail: connector line + node marker -------------------------------- */}
      <div className="relative flex w-6 shrink-0 flex-col items-center">
        <span
          aria-hidden
          className={cn(
            "grid h-6 w-6 place-items-center rounded-full border-2 transition-colors",
            isCurrent && !reduce ? "shadow-[0_0_0_4px_var(--rail-halo)]" : "",
          )}
          style={{
            color: vars.color,
            borderColor: vars.border,
            background: step.status === "pending" ? "var(--color-surface)" : vars.bg,
            // @ts-expect-error custom prop consumed above
            "--rail-halo": `color-mix(in oklab, ${vars.color} 18%, transparent)`,
          }}
        >
          <StepMarker status={step.status} reduce={reduce} />
        </span>
        {!isLast ? (
          <span
            aria-hidden
            className="mt-1 w-[2px] flex-1 rounded-full"
            style={{
              background: travelled
                ? `color-mix(in oklab, ${vars.color} 55%, var(--color-border))`
                : "var(--color-border)",
            }}
          />
        ) : null}
      </div>

      {/* Card -------------------------------------------------------------- */}
      <div
        className={cn(
          "mb-2.5 min-w-0 flex-1 rounded-xl border bg-[var(--color-surface)] transition-colors",
          compact ? "opacity-95" : "",
        )}
        style={
          selected || attention
            ? { borderColor: vars.border, boxShadow: `0 0 0 1px ${vars.border}` }
            : { borderColor: "var(--color-border)" }
        }
      >
        <div className={cn("flex items-start gap-2 pl-2.5 pr-2", compact ? "py-1.5" : "py-2.5")}>
          <button
            type="button"
            ref={(el) => registerHeader(step.id, el)}
            id={disc.triggerProps.id}
            aria-expanded={hasDetails ? expanded : undefined}
            aria-controls={hasDetails && expanded ? disc.panelProps.id : undefined}
            aria-describedby={isFailed && step.error ? errorId : undefined}
            aria-current={isCurrent ? "step" : undefined}
            onClick={onHeaderClick}
            className="group flex min-w-0 flex-1 items-start gap-2 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
          >
            <span
              className={cn(
                "mt-0.5 grid h-4 w-4 shrink-0 place-items-center text-[var(--color-muted)] transition-transform",
                expanded ? "rotate-90" : "rotate-0",
                !hasDetails && "opacity-0",
              )}
              aria-hidden
            >
              <svg width="11" height="11" {...ICON}>
                <path d="m9 6 6 6-6 6" {...STROKE} strokeWidth={2.4} />
              </svg>
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
                    step.status === "skipped" || step.status === "cancelled" ? "line-through decoration-[var(--color-muted)]" : "",
                  )}
                >
                  {step.title}
                </span>
              </span>

              {!compact && step.description ? (
                <span className="mt-0.5 block truncate text-[12px] text-[var(--color-muted)]">{step.description}</span>
              ) : null}

              {isFailed && step.error ? (
                <span id={errorId} className="mt-1 block truncate text-[12px] text-[var(--color-error)]">
                  {step.error}
                </span>
              ) : null}

              {step.toolCall && !compact ? (
                <span className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--color-muted)]">
                  <svg width="11" height="11" {...ICON} className="shrink-0">
                    <path d="M14.5 5.5a3.5 3.5 0 0 1-4.6 4.6L5 15l4 4 4.9-4.9a3.5 3.5 0 0 1 4.6-4.6l-2.3 2.3-2-2z" {...STROKE} strokeWidth={1.6} />
                  </svg>
                  <span className="truncate">{step.toolCall.name}</span>
                </span>
              ) : null}
            </span>
          </button>

          {/* Right rail: status chip + per-state actions (siblings of the toggle). */}
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <StatusChip status={step.status} reduce={reduce} />
            {showAttempts ? (
              <span className="font-mono text-[10.5px] tabular-nums text-[var(--color-muted)]">
                {step.maxAttempts ? `attempt ${step.attempts}/${step.maxAttempts}` : `attempt ${step.attempts}`}
              </span>
            ) : null}

            {isWaiting ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`Approve ${step.title}`}
                  onClick={() => onApprove?.(step.id)}
                  className={cn(
                    actionBtn,
                    "border-transparent bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]",
                  )}
                >
                  <svg width="13" height="13" {...ICON}>
                    <path d="m5 13 4 4L19 7" {...STROKE} strokeWidth={2.4} />
                  </svg>
                  Approve
                </button>
                <button
                  type="button"
                  aria-label={`Reject ${step.title}`}
                  onClick={() => onReject?.(step.id)}
                  className={cn(
                    actionBtn,
                    "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:border-[var(--color-error)] hover:text-[var(--color-error)]",
                  )}
                >
                  Reject
                </button>
              </div>
            ) : null}

            {isFailed ? (
              <button
                type="button"
                aria-label={`Retry ${step.title}`}
                onClick={() => onRetryStep?.(step.id)}
                className={cn(actionBtn, neutralBtn)}
              >
                <svg width="13" height="13" {...ICON}>
                  <path d="M20 11a8 8 0 1 0-.7 4.2M20 5v4h-4" {...STROKE} strokeWidth={1.9} />
                </svg>
                Retry
              </button>
            ) : null}
          </div>
        </div>

        {/* Expanded details — height-animated, mounted only when open. */}
        <AnimatePresence initial={false}>
          {expanded && hasDetails ? (
            <motion.div
              key="details"
              id={disc.panelProps.id}
              role={disc.panelProps.role}
              aria-labelledby={disc.panelProps["aria-labelledby"]}
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.24, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="mx-2.5 mb-2.5 mt-0.5 space-y-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-3 text-[12.5px]">
                {step.startedAt != null ? (
                  <p className="text-[11.5px] text-[var(--color-muted)]">
                    Started {formatTs(step.startedAt)}
                    {typeof step.durationMs === "number" ? ` · took ${formatDuration(step.durationMs)}` : ""}
                    {typeof step.attempts === "number" && step.attempts > 1 ? ` · ${step.attempts} attempts` : ""}
                  </p>
                ) : null}

                {step.description && compact ? (
                  <p className="text-[var(--color-fg)]">{step.description}</p>
                ) : null}

                {step.toolCall ? (
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                      Tool call
                      <code className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1 py-px font-mono text-[11px] normal-case text-[var(--color-fg)]">
                        {step.toolCall.name}
                      </code>
                    </p>
                    {step.toolCall.arguments !== undefined ? (
                      <ArgumentsBlock label="Arguments" value={step.toolCall.arguments} />
                    ) : null}
                    {step.toolCall.result !== undefined ? (
                      <ArgumentsBlock label="Result" value={step.toolCall.result} />
                    ) : null}
                  </div>
                ) : null}

                {step.output !== undefined ? (
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Output</p>
                    {renderOutput ? (
                      renderOutput(step)
                    ) : (
                      <pre className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-code-bg)] px-2.5 py-2 font-mono text-[12px] leading-relaxed text-[var(--color-code-fg)]">
                        {stringify(step.output)}
                      </pre>
                    )}
                  </div>
                ) : null}

                {step.stages && step.stages.length > 0 ? (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Sub-stages</p>
                    <ol className="space-y-1.5">
                      {step.stages.map((sub) => {
                        const subMeta = getStatusMeta(sub.status);
                        const subVars = statusVars(subMeta.tone as StatusTone);
                        return (
                          <li key={sub.id} className="flex items-center gap-2 text-[12.5px] text-[var(--color-fg)]">
                            <span
                              className="grid h-4 w-4 shrink-0 place-items-center rounded-full"
                              style={{ color: subVars.color, background: subVars.bg }}
                              aria-hidden
                            >
                              <StepMarker status={sub.status} reduce />
                            </span>
                            <span className="min-w-0 flex-1 truncate">{sub.label}</span>
                            <span className="shrink-0 text-[11px] text-[var(--color-muted)]">{subMeta.label}</span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ) : null}

                {step.error ? (
                  <div className="flex items-start gap-2 rounded-md border border-[var(--color-error)] bg-[color-mix(in_oklab,var(--color-error)_10%,transparent)] px-2.5 py-2 text-[var(--color-fg)]">
                    <span className="mt-px shrink-0 text-[var(--color-error)]" aria-hidden>
                      <StatusGlyph status="failed" reduce />
                    </span>
                    <span>{step.error}</span>
                  </div>
                ) : null}

                {step.summary ? (
                  <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-[var(--color-fg)]">
                    <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Summary</p>
                    {step.summary}
                  </div>
                ) : null}

                {step.details != null ? <div className="text-[var(--color-fg)]">{step.details}</div> : null}

                {renderStepDetails ? <div className="text-[var(--color-fg)]">{renderStepDetails(step)}</div> : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.li>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                    */
/* -------------------------------------------------------------------------- */

export function AgentRunTimeline({
  run,
  activeStepId,
  defaultActiveStepId,
  onActiveStepChange,
  followActive = true,
  onRetryStep,
  onCancelRun,
  onResumeRun,
  onApprove,
  onReject,
  onCopyRun,
  compactCompleted = true,
  defaultExpanded,
  renderStepDetails,
  renderOutput,
  formatTimestamp,
  title,
  className,
}: AgentRunTimelineProps) {
  const reduce = useReducedMotion();
  const formatTs = React.useMemo(
    () => formatTimestamp ?? ((v: Date | number | string) => defaultFormatTimestamp(v)),
    [formatTimestamp],
  );

  const { copied, copy } = useCopy({ onCopy: onCopyRun });

  const [selectedId, setSelectedId] = useControllableState<string>({
    value: activeStepId,
    defaultValue: defaultActiveStepId ?? run.currentStepId ?? "",
    onChange: onActiveStepChange,
  });

  // Expansion state (uncontrolled), seeded from `defaultExpanded`.
  const [expanded, setExpanded] = React.useState<Set<string>>(() => {
    if (defaultExpanded === true) return new Set(run.steps.map((s) => s.id));
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
  const focusHeader = React.useCallback((id: string) => {
    const run2 = () => headerRefs.current.get(id)?.focus();
    if (typeof requestAnimationFrame === "undefined") run2();
    else requestAnimationFrame(run2);
  }, []);

  const handleSelect = React.useCallback((id: string) => setSelectedId(id), [setSelectedId]);
  const handleToggle = React.useCallback((id: string, next: boolean) => {
    setExpanded((prev) => {
      const set = new Set(prev);
      if (next) set.add(id);
      else set.delete(id);
      return set;
    });
  }, []);

  const handleApprove = React.useCallback(
    (id: string) => {
      onApprove?.(id);
      focusHeader(id);
    },
    [onApprove, focusHeader],
  );
  const handleReject = React.useCallback(
    (id: string) => {
      onReject?.(id);
      focusHeader(id);
    },
    [onReject, focusHeader],
  );
  const handleRetry = React.useCallback(
    (id: string) => {
      onRetryStep?.(id);
      focusHeader(id);
    },
    [onRetryStep, focusHeader],
  );

  // Follow the run's current step: select it + scroll into view when it moves.
  const prevCurrent = React.useRef<string | undefined>(run.currentStepId);
  React.useEffect(() => {
    const cur = run.currentStepId;
    if (!followActive || !cur || cur === prevCurrent.current) {
      prevCurrent.current = cur;
      return;
    }
    prevCurrent.current = cur;
    setSelectedId(cur);
    // Follow the active step within the timeline's own scroll region only —
    // never `scrollIntoView`, which would scroll the whole page to this card.
    scrollIntoViewWithin(rowRefs.current.get(cur), { smooth: !reduce });
  }, [run.currentStepId, followActive, reduce, setSelectedId]);

  // Lifecycle live region — announce run + step status transitions only.
  const prevRunStatus = React.useRef<RunStatus | undefined>(undefined);
  const prevStepStatuses = React.useRef<Map<string, StepStatus>>(new Map());
  const [liveMessage, setLiveMessage] = React.useState("");
  React.useEffect(() => {
    const messages: string[] = [];
    if (prevRunStatus.current !== undefined && prevRunStatus.current !== run.status) {
      messages.push(`Run ${getStatusMeta(run.status).label.toLowerCase()}.`);
    }
    prevRunStatus.current = run.status;

    const prev = prevStepStatuses.current;
    const seen = new Set<string>();
    for (const step of run.steps) {
      seen.add(step.id);
      const was = prev.get(step.id);
      if (was !== step.status && ANNOUNCE_STEP.has(step.status) && (was !== undefined || step.status !== "pending")) {
        messages.push(`${step.title} ${getStatusMeta(step.status).label.toLowerCase()}.`);
      }
      prev.set(step.id, step.status);
    }
    for (const id of prev.keys()) if (!seen.has(id)) prev.delete(id);
    if (messages.length) setLiveMessage(messages.join(" "));
  }, [run]);

  // Header counts + run progress.
  const total = run.steps.length;
  const resolved = React.useMemo(
    () => run.steps.filter((s) => s.status === "completed" || s.status === "skipped" || s.status === "cancelled").length,
    [run.steps],
  );
  const failedCount = run.steps.filter((s) => s.status === "failed").length;
  const waitingCount = run.steps.filter((s) => s.status === "waiting_approval").length;
  const pct = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const runMeta = getStatusMeta(run.status);
  const runVars = statusVars(runMeta.tone as StatusTone);
  const inFlight = RUN_IN_FLIGHT.has(run.status);
  const isPaused = run.status === "paused";
  const heading = title ?? run.title;

  return (
    <section
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]",
        className,
      )}
      aria-label={`Run: ${heading}`}
    >
      {/* Header ----------------------------------------------------------- */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
          <span
            className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--color-accent-fg)]"
            style={{ background: `linear-gradient(135deg, ${runVars.color}, color-mix(in oklab, ${runVars.color} 55%, #000))` }}
            aria-hidden
          >
            <svg width="16" height="16" {...ICON}>
              <circle cx="12" cy="12" r="8.5" {...STROKE} strokeWidth={1.7} />
              <path d="M12 7v5l3.5 2" {...STROKE} strokeWidth={1.9} />
            </svg>
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[14px] font-semibold text-[var(--color-fg)]">{heading}</h2>
              <StatusChip status={run.status} reduce={reduce} />
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-[var(--color-muted)]">
              <span>
                {resolved} of {total} steps
              </span>
              {run.startedAt != null ? <span aria-hidden>·</span> : null}
              {run.startedAt != null ? <span>started {formatTs(run.startedAt)}</span> : null}
              {failedCount > 0 ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="text-[var(--color-error)]">{failedCount} failed</span>
                </>
              ) : null}
              {waitingCount > 0 ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="text-[var(--color-warning)]">{waitingCount} awaiting approval</span>
                </>
              ) : null}
            </p>
          </div>

          {/* Run-level actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            {isPaused ? (
              <button type="button" onClick={() => onResumeRun?.()} className={cn(actionBtn, neutralBtn)}>
                <svg width="13" height="13" {...ICON}>
                  <path d="M8 5v14l11-7z" {...STROKE} strokeWidth={1.8} />
                </svg>
                Resume
              </button>
            ) : null}
            {inFlight ? (
              <button
                type="button"
                onClick={() => onCancelRun?.()}
                className={cn(
                  actionBtn,
                  "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:border-[var(--color-error)] hover:text-[var(--color-error)]",
                )}
              >
                <svg width="13" height="13" {...ICON}>
                  <rect x="6" y="6" width="12" height="12" rx="2" {...STROKE} strokeWidth={1.8} />
                </svg>
                Cancel run
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => copy(runToText(run))}
              aria-label={copied ? "Run details copied" : "Copy run details"}
              className={cn(actionBtn, "border-transparent bg-transparent px-2 text-[var(--color-muted)] hover:text-[var(--color-fg)]")}
            >
              {copied ? (
                <svg width="14" height="14" {...ICON}>
                  <path d="m5 13 4 4L19 7" {...STROKE} strokeWidth={2.4} />
                </svg>
              ) : (
                <svg width="14" height="14" {...ICON}>
                  <rect x="9" y="9" width="11" height="11" rx="2.5" {...STROKE} strokeWidth={1.7} />
                  <path d="M5 15V6a2 2 0 0 1 2-2h9" {...STROKE} strokeWidth={1.7} />
                </svg>
              )}
              <span className="sr-only sm:not-sr-only">{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Run progress bar (resolved / total). */}
        <div
          className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-accent)_8%,transparent)]"
          role="progressbar"
          aria-label={`${heading} progress`}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={resolved}
          aria-valuetext={`${resolved} of ${total} steps complete`}
        >
          <motion.span
            className="block h-full rounded-full"
            style={{ background: runVars.color }}
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE }}
          />
        </div>
      </header>

      {/* Polite live region: lifecycle transitions only ------------------- */}
      <div role="status" aria-live="polite" className="sr-only">
        {liveMessage}
      </div>

      {/* Steps ------------------------------------------------------------ */}
      {total === 0 ? (
        <p className="px-4 py-8 text-center text-[13px] text-[var(--color-muted)]">This run has no steps yet.</p>
      ) : (
        <ol className="flex flex-col px-3.5 pb-2 pt-3">
          <AnimatePresence initial={false} mode="popLayout">
            {run.steps.map((step, index) => {
              const isExpanded = expanded.has(step.id);
              const isCurrent = step.id === run.currentStepId;
              const isSelected = step.id === selectedId;
              const compact =
                compactCompleted && RESOLVED_QUIET.has(step.status) && !isExpanded && !isCurrent && !isSelected;
              return (
                <StepRow
                  key={step.id}
                  step={step}
                  index={index}
                  total={total}
                  expanded={isExpanded}
                  selected={isSelected}
                  isCurrent={isCurrent}
                  compact={compact}
                  reduce={reduce}
                  formatTs={formatTs}
                  registerHeader={registerHeader}
                  registerRow={registerRow}
                  onSelect={handleSelect}
                  onToggle={handleToggle}
                  onRetryStep={handleRetry}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  renderStepDetails={renderStepDetails}
                  renderOutput={renderOutput}
                />
              );
            })}
          </AnimatePresence>
        </ol>
      )}

      {/* Run summary (only when supplied — never fabricated). */}
      {run.summary ? (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            <svg width="13" height="13" {...ICON}>
              <path d="M5 5h14M5 10h14M5 15h9" {...STROKE} strokeWidth={1.8} />
            </svg>
            Run summary
          </p>
          <p className="text-[13px] leading-relaxed text-[var(--color-fg)]">{run.summary}</p>
        </div>
      ) : null}
    </section>
  );
}

export default AgentRunTimeline;
