"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";

import { cn } from "@/lib/utils";
import {
  getStatusMeta,
  statusVars,
  formatTimestamp,
  useReducedMotion,
  streamItemVariants,
  type StatusTone,
} from "@/lib/motiq";

/**
 * ToolCallActivity — a live inspector for the tool/step activity of an AI agent
 * (search, read a file, run code, wait for a human approval). It is a
 * *presentation* component: the application owns the calls and their state and
 * passes them in. It never talks to a model, never invents a step, never
 * fabricates a result, and makes no claim about what an agent is "doing" — it
 * renders exactly the `calls` you give it and reports state changes back through
 * callbacks.
 *
 * Anatomy (original): concurrent calls stacked in a workspace panel; resolved
 * calls compress to a slim line so the eye stays on what is live; approval calls
 * carry inline Approve / Reject; failed calls carry Retry and an associated error.
 *
 * Accessibility: every status is conveyed with an icon AND a text label AND a
 * border (never colour alone), so it survives forced-colors. Each call header is
 * a real disclosure <button> with `aria-expanded`; Approve / Reject / Retry /
 * Copy are real <button>s with accessible names. A single polite `role="status"`
 * region announces lifecycle transitions (started / completed / failed / awaiting
 * approval / approved / rejected) — never on every render. A failed call's error
 * is associated with its header via `aria-describedby`. After Approve / Retry,
 * focus moves to that call's header so keyboard flow stays logical. Under
 * `prefers-reduced-motion` everything renders in its final state with no motion
 * and no perpetual running indicator. Clean-room original.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type ToolCallStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "waiting_approval"
  | "approved"
  | "rejected";

export interface ToolCall {
  /** Stable identifier. */
  id: string;
  /** Human-readable action name, e.g. "Searching project documentation". */
  name: string;
  /** Optional kind used to pick an icon and a chip, e.g. "search" | "read" | "code". */
  category?: string;
  /** Lifecycle state, owned by the application. */
  status: ToolCallStatus;
  /** When the call started — accepts a Date, epoch ms, or ISO string. */
  startedAt?: Date | number | string;
  /** Elapsed / total duration in milliseconds. */
  durationMs?: number;
  /** Arguments the agent was invoked with (rendered read-only). */
  input?: unknown;
  /** Result the tool returned (rendered read-only). */
  output?: unknown;
  /** Error message shown on a failed call. */
  error?: string;
  /** Determinate progress `0..1` for a running call. Omit for indeterminate. */
  progress?: number;
  /** Extra detail node rendered inside the expanded panel. */
  details?: React.ReactNode;
}

export interface ToolCallActivityProps {
  /** The tool calls to render, in display order. */
  calls: ToolCall[];
  /** The call to visually emphasise as "current"; defaults to the first running call. */
  activeCallId?: string;
  /** Header label for the activity panel. */
  title?: string;
  /** Notified when a call is expanded or collapsed. */
  onToggle?: (id: string, expanded: boolean) => void;
  /** Notified when Approve is pressed on a `waiting_approval` call. */
  onApprove?: (id: string) => void;
  /** Notified when Reject is pressed on a `waiting_approval` call. */
  onReject?: (id: string) => void;
  /** Notified when Retry is pressed on a `failed` call. */
  onRetry?: (id: string) => void;
  /** Notified after a successful "Copy details", with the serialised text. */
  onCopyDetails?: (id: string, text: string) => void;
  /** Ids expanded on first render, or `true` to expand every call. */
  defaultExpanded?: string[] | boolean;
  /** Compress resolved calls (completed / approved / cancelled) to a slim line. */
  compactCompleted?: boolean;
  /** Show a duration for calls that provide one. */
  showDurations?: boolean;
  /** Custom renderer for a call's input in the expanded panel. */
  renderInput?: (call: ToolCall) => React.ReactNode;
  /** Custom renderer for a call's output in the expanded panel. */
  renderOutput?: (call: ToolCall) => React.ReactNode;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Motion + status metadata                                                    */
/* -------------------------------------------------------------------------- */

const EASE: Transition["ease"] = [0.2, 0, 0, 1];

/** Terminal states whose row compresses under `compactCompleted`. */
const RESOLVED_QUIET: ReadonlySet<ToolCallStatus> = new Set(["completed", "approved", "cancelled"]);

/** Which transitions are worth an out-loud announcement. */
const ANNOUNCE: ReadonlySet<ToolCallStatus> = new Set([
  "running",
  "completed",
  "failed",
  "waiting_approval",
  "approved",
  "rejected",
  "cancelled",
]);

function stringify(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function callToText(call: ToolCall): string {
  const lines: string[] = [`${call.name} — ${getStatusMeta(call.status).label}`];
  if (call.category) lines.push(`Category: ${call.category}`);
  if (call.input !== undefined) lines.push(`Input:\n${stringify(call.input)}`);
  if (call.output !== undefined) lines.push(`Output:\n${stringify(call.output)}`);
  if (call.error) lines.push(`Error: ${call.error}`);
  return lines.join("\n");
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s % 1 === 0 ? s : s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s - m * 60)}s`;
}

/* -------------------------------------------------------------------------- */
/* Icons — all decorative, currentColor, forced-colors safe                    */
/* -------------------------------------------------------------------------- */

function CategoryGlyph({ category }: { category?: string }) {
  const key = (category ?? "").toLowerCase();
  const common = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
  const s = { stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (/search|retriev|lookup|query/.test(key))
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="6" {...s} />
        <path d="m20 20-3.5-3.5" {...s} />
      </svg>
    );
  if (/read|file|doc|open/.test(key))
    return (
      <svg {...common}>
        <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" {...s} />
        <path d="M13 3v6h6M9 13h6M9 17h4" {...s} />
      </svg>
    );
  if (/code|run|exec|shell|build|compile/.test(key))
    return (
      <svg {...common}>
        <path d="m9 8-4 4 4 4M15 8l4 4-4 4" {...s} />
      </svg>
    );
  if (/web|http|fetch|api|net/.test(key))
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" {...s} />
        <path d="M3 12h18M12 4c2.5 2.2 2.5 13.6 0 16M12 4c-2.5 2.2-2.5 13.6 0 16" {...s} />
      </svg>
    );
  if (/data|db|sql|store|table/.test(key))
    return (
      <svg {...common}>
        <ellipse cx="12" cy="6" rx="7" ry="3" {...s} />
        <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" {...s} />
      </svg>
    );
  if (/approv|review|human|gate|confirm/.test(key))
    return (
      <svg {...common}>
        <path d="M12 3 5 6v5c0 4.2 2.9 7.7 7 9 4.1-1.3 7-4.8 7-9V6z" {...s} />
        <path d="m9 11 2.2 2.2L15 9.4" {...s} />
      </svg>
    );
  // Generic tool / function call
  return (
    <svg {...common}>
      <path d="M14.5 5.5a3.5 3.5 0 0 1-4.6 4.6L5 15l4 4 4.9-4.9a3.5 3.5 0 0 1 4.6-4.6l-2.3 2.3-2-2z" {...s} />
    </svg>
  );
}

function StatusGlyph({ status, reduce }: { status: ToolCallStatus; reduce: boolean }) {
  const common = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
  const s = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (status) {
    case "running":
      return (
        <span className="relative flex h-3.5 w-3.5 items-center justify-center" aria-hidden>
          {!reduce ? (
            <motion.span
              className="absolute h-3.5 w-3.5 rounded-full border-2 border-current opacity-40"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
            />
          ) : null}
          <span className="h-2 w-2 rounded-full bg-current" />
        </span>
      );
    case "queued":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" {...s} strokeWidth={1.8} strokeDasharray="3 3.4" />
          <path d="M12 8v4l2.5 1.5" {...s} strokeWidth={1.8} />
        </svg>
      );
    case "completed":
      return (
        <svg {...common}>
          <path d="m5 13 4 4L19 7" {...s} strokeWidth={2.4} />
        </svg>
      );
    case "approved":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" {...s} strokeWidth={1.8} />
          <path d="m8.5 12 2.2 2.2L15.5 9.5" {...s} strokeWidth={2} />
        </svg>
      );
    case "failed":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" {...s} strokeWidth={1.8} />
          <path d="M12 7.5v5M12 16h.01" {...s} strokeWidth={2.1} />
        </svg>
      );
    case "rejected":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" {...s} strokeWidth={1.8} />
          <path d="m9 9 6 6M15 9l-6 6" {...s} strokeWidth={2} />
        </svg>
      );
    case "cancelled":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" {...s} strokeWidth={1.8} />
          <path d="M8 12h8" {...s} strokeWidth={2} />
        </svg>
      );
    case "waiting_approval":
      return (
        <svg {...common}>
          <path d="M6 15a6 6 0 0 1 12 0M18 15v2H6v-2M8 15a4 4 0 0 1 8 0M12 3v2" {...s} strokeWidth={1.7} />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" {...s} strokeWidth={1.8} />
        </svg>
      );
  }
}

/* -------------------------------------------------------------------------- */
/* Controls                                                                     */
/* -------------------------------------------------------------------------- */

const actionBtn =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:opacity-50";

function CopyDetailsButton({
  getText,
  onCopied,
}: {
  getText: () => string;
  onCopied?: (text: string) => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    const text = getText();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      onCopied?.(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked (e.g. insecure context) — no-op, control stays usable */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        actionBtn,
        "border-transparent bg-transparent px-2 py-1 text-[var(--color-muted)] hover:text-[var(--color-fg)]",
      )}
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="9" y="9" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
          <path d="M5 15V6a2 2 0 0 1 2-2h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )}
      {copied ? "Copied" : "Copy details"}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Progress                                                                     */
/* -------------------------------------------------------------------------- */

function ProgressBar({ progress, reduce, name }: { progress?: number; reduce: boolean; name: string }) {
  const determinate = typeof progress === "number";
  const pct = determinate ? Math.max(0, Math.min(100, Math.round(progress! * 100))) : undefined;

  return (
    <div className="mt-2 flex items-center gap-2">
      <div
        className="relative h-1.5 w-full overflow-hidden rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-accent)_10%,transparent)]"
        role="progressbar"
        aria-label={`${name} progress`}
        aria-valuemin={determinate ? 0 : undefined}
        aria-valuemax={determinate ? 100 : undefined}
        aria-valuenow={pct}
      >
        {determinate ? (
          <motion.span
            className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-accent)]"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE }}
          />
        ) : reduce ? (
          <span className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-[color-mix(in_oklab,var(--color-accent)_60%,transparent)]" />
        ) : (
          <motion.span
            className="absolute inset-y-0 w-1/3 rounded-full bg-[var(--color-accent)]"
            animate={{ left: ["-33%", "100%"] }}
            transition={{ duration: 1.15, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
      {determinate ? (
        <span className="w-9 shrink-0 text-right font-mono text-[11px] tabular-nums text-[var(--color-muted)]">{pct}%</span>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Row                                                                          */
/* -------------------------------------------------------------------------- */

interface RowProps {
  call: ToolCall;
  expanded: boolean;
  current: boolean;
  compact: boolean;
  showDurations: boolean;
  reduce: boolean;
  detailsId: string;
  errorId: string;
  registerToggle: (id: string, el: HTMLButtonElement | null) => void;
  onToggle: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onRetry?: (id: string) => void;
  onCopyDetails?: (id: string, text: string) => void;
  renderInput?: (call: ToolCall) => React.ReactNode;
  renderOutput?: (call: ToolCall) => React.ReactNode;
}

function ToolCallRow({
  call,
  expanded,
  current,
  compact,
  showDurations,
  reduce,
  detailsId,
  errorId,
  registerToggle,
  onToggle,
  onApprove,
  onReject,
  onRetry,
  onCopyDetails,
  renderInput,
  renderOutput,
}: RowProps) {
  const meta = getStatusMeta(call.status);
  const tone = meta.tone as StatusTone;
  const vars = statusVars(tone);
  const isRunning = call.status === "running";
  const isFailed = call.status === "failed";
  const isWaiting = call.status === "waiting_approval";
  const attention = isWaiting || isFailed;

  const hasDetails =
    call.input !== undefined || call.output !== undefined || call.details != null || Boolean(call.error);

  return (
    <motion.li
      layout={reduce ? false : "position"}
      variants={reduce ? undefined : streamItemVariants}
      initial={reduce ? false : "initial"}
      animate="animate"
      exit={reduce ? undefined : "exit"}
      transition={{ duration: 0.28, ease: EASE }}
      data-status={call.status}
      data-current={current || undefined}
      className={cn(
        "relative rounded-xl border bg-[var(--color-surface)] transition-colors",
        compact && !current ? "border-[var(--color-border)] opacity-90" : "border-[var(--color-border)]",
      )}
      style={
        current || attention
          ? { borderColor: vars.border, boxShadow: `0 0 0 1px ${vars.border}` }
          : undefined
      }
    >
      {/* Left accent bar communicates the current call without relying on colour alone (icon + label do too). */}
      {current ? (
        <span
          aria-hidden
          className="absolute inset-y-2 left-0 w-[3px] rounded-full"
          style={{ background: vars.color }}
        />
      ) : null}

      <div className={cn("flex items-start gap-2 pl-3 pr-2.5", compact ? "py-2" : "py-2.5")}>
        <button
          type="button"
          ref={(el) => registerToggle(call.id, el)}
          onClick={() => onToggle(call.id)}
          aria-expanded={expanded}
          aria-controls={expanded && hasDetails ? detailsId : undefined}
          aria-describedby={isFailed && call.error ? errorId : undefined}
          disabled={!hasDetails}
          className="group flex min-w-0 flex-1 items-start gap-2.5 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] disabled:cursor-default"
        >
          {/* Disclosure chevron */}
          <span
            className={cn(
              "mt-0.5 grid h-4 w-4 shrink-0 place-items-center text-[var(--color-muted)] transition-transform",
              expanded ? "rotate-90" : "rotate-0",
              !hasDetails && "opacity-0",
            )}
            aria-hidden
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>

          {/* Category avatar */}
          <span
            className={cn(
              "grid shrink-0 place-items-center rounded-lg border border-[var(--color-border)] text-[var(--color-fg)]",
              compact ? "h-6 w-6" : "h-8 w-8",
            )}
            style={{ background: vars.bg, color: vars.color }}
            aria-hidden
          >
            <CategoryGlyph category={call.category} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={cn("truncate font-medium text-[var(--color-fg)]", compact ? "text-[13px]" : "text-[13.5px]")}>
                {call.name}
              </span>
              {call.category && !compact ? (
                <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-1.5 py-px font-mono text-[10.5px] text-[var(--color-muted)]">
                  {call.category}
                </span>
              ) : null}
            </span>

            {/* Failed calls surface a short error inline (always visible), associated via aria-describedby. */}
            {isFailed && call.error ? (
              <span id={errorId} className="mt-1 block truncate text-[12px] text-[var(--color-error)]">
                {call.error}
              </span>
            ) : null}

            {/* Running progress lives under the name so concurrent calls stay compact. */}
            {isRunning && !compact ? <ProgressBar progress={call.progress} reduce={reduce} name={call.name} /> : null}
          </span>
        </button>

        {/* Right rail: status chip, duration, and per-state actions (siblings of the toggle, never nested). */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium"
            style={{ color: vars.color, borderColor: vars.border, background: vars.bg }}
          >
            <StatusGlyph status={call.status} reduce={reduce} />
            {meta.label}
          </span>

          {showDurations && typeof call.durationMs === "number" ? (
            <span className="font-mono text-[11px] tabular-nums text-[var(--color-muted)]">
              {formatDuration(call.durationMs)}
            </span>
          ) : null}

          {isWaiting ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label={`Approve ${call.name}`}
                onClick={() => onApprove?.(call.id)}
                className={cn(actionBtn, "border-transparent bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Approve
              </button>
              <button
                type="button"
                aria-label={`Reject ${call.name}`}
                onClick={() => onReject?.(call.id)}
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
              aria-label={`Retry ${call.name}`}
              onClick={() => onRetry?.(call.id)}
              className={cn(
                actionBtn,
                "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
              )}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M20 11a8 8 0 1 0-.7 4.2M20 5v4h-4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Retry
            </button>
          ) : null}
        </div>
      </div>

      {/* Expanded details — height-animated, mounted only when open so aria-controls is never dangling. */}
      <AnimatePresence initial={false}>
        {expanded && hasDetails ? (
          <motion.div
            key="details"
            id={detailsId}
            role="region"
            aria-label={`${call.name} details`}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.24, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mx-3 mb-3 mt-0.5 space-y-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-3 text-[12.5px]">
              {call.startedAt != null ? (
                <p className="text-[11.5px] text-[var(--color-muted)]">
                  Started {formatTimestamp(call.startedAt)}
                  {typeof call.durationMs === "number" ? ` · took ${formatDuration(call.durationMs)}` : ""}
                </p>
              ) : null}

              {call.input !== undefined ? (
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Input</p>
                  {renderInput ? (
                    renderInput(call)
                  ) : (
                    <pre className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-code-bg)] px-2.5 py-2 font-mono text-[12px] text-[var(--color-code-fg)]">
                      {stringify(call.input)}
                    </pre>
                  )}
                </div>
              ) : null}

              {call.output !== undefined ? (
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Output</p>
                  {renderOutput ? (
                    renderOutput(call)
                  ) : (
                    <pre className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-code-bg)] px-2.5 py-2 font-mono text-[12px] text-[var(--color-code-fg)]">
                      {stringify(call.output)}
                    </pre>
                  )}
                </div>
              ) : null}

              {call.error ? (
                <div className="flex items-start gap-2 rounded-md border border-[var(--color-error)] bg-[color-mix(in_oklab,var(--color-error)_10%,transparent)] px-2.5 py-2 text-[var(--color-fg)]">
                  <span className="mt-px shrink-0 text-[var(--color-error)]" aria-hidden>
                    <StatusGlyph status="failed" reduce />
                  </span>
                  <span>{call.error}</span>
                </div>
              ) : null}

              {call.details != null ? <div className="text-[var(--color-fg)]">{call.details}</div> : null}

              <div className="flex justify-end pt-0.5">
                <CopyDetailsButton getText={() => callToText(call)} onCopied={(t) => onCopyDetails?.(call.id, t)} />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                    */
/* -------------------------------------------------------------------------- */

const SUMMARY_TONES: Array<{ status: ToolCallStatus; label: (n: number) => string }> = [
  { status: "running", label: (n) => `${n} running` },
  { status: "waiting_approval", label: (n) => `${n} awaiting approval` },
  { status: "failed", label: (n) => `${n} failed` },
];

export function ToolCallActivity({
  calls,
  activeCallId,
  title = "Agent activity",
  onToggle,
  onApprove,
  onReject,
  onRetry,
  onCopyDetails,
  defaultExpanded,
  compactCompleted = true,
  showDurations = true,
  renderInput,
  renderOutput,
  className,
}: ToolCallActivityProps) {
  const reduce = useReducedMotion();
  const uid = React.useId();

  // Expansion state is internal (uncontrolled) but seeded from `defaultExpanded`
  // and reported outward through `onToggle`.
  const [expanded, setExpanded] = React.useState<Set<string>>(() => {
    if (defaultExpanded === true) return new Set(calls.map((c) => c.id));
    if (Array.isArray(defaultExpanded)) return new Set(defaultExpanded);
    return new Set();
  });

  const toggleRefs = React.useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const registerToggle = React.useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) toggleRefs.current.set(id, el);
    else toggleRefs.current.delete(id);
  }, []);
  const focusRow = React.useCallback((id: string) => {
    if (typeof requestAnimationFrame === "undefined") {
      toggleRefs.current.get(id)?.focus();
      return;
    }
    requestAnimationFrame(() => toggleRefs.current.get(id)?.focus());
  }, []);

  const handleToggle = React.useCallback(
    (id: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        const isOpen = next.has(id);
        if (isOpen) next.delete(id);
        else next.add(id);
        onToggle?.(id, !isOpen);
        return next;
      });
    },
    [onToggle],
  );

  const handleApprove = React.useCallback(
    (id: string) => {
      onApprove?.(id);
      focusRow(id);
    },
    [onApprove, focusRow],
  );
  const handleReject = React.useCallback(
    (id: string) => {
      onReject?.(id);
      focusRow(id);
    },
    [onReject, focusRow],
  );
  const handleRetry = React.useCallback(
    (id: string) => {
      onRetry?.(id);
      focusRow(id);
    },
    [onRetry, focusRow],
  );

  // Current-call emphasis: explicit prop, else the first running call.
  const currentId = React.useMemo(
    () => activeCallId ?? calls.find((c) => c.status === "running")?.id,
    [activeCallId, calls],
  );

  // Header summary chips (only non-zero attention states + a muted done count).
  const counts = React.useMemo(() => {
    const map = new Map<ToolCallStatus, number>();
    for (const c of calls) map.set(c.status, (map.get(c.status) ?? 0) + 1);
    return map;
  }, [calls]);
  const doneCount = (counts.get("completed") ?? 0) + (counts.get("approved") ?? 0);

  /* Lifecycle live region — announces status transitions only, never every render. */
  const prevStatuses = React.useRef<Map<string, ToolCallStatus>>(new Map());
  const [liveMessage, setLiveMessage] = React.useState("");
  React.useEffect(() => {
    const prev = prevStatuses.current;
    const announcements: string[] = [];
    const seen = new Set<string>();
    for (const c of calls) {
      seen.add(c.id);
      const was = prev.get(c.id);
      if (was !== c.status && ANNOUNCE.has(c.status) && (was !== undefined || c.status !== "queued")) {
        announcements.push(`${c.name} ${getStatusMeta(c.status).label.toLowerCase()}.`);
      }
      prev.set(c.id, c.status);
    }
    for (const id of prev.keys()) if (!seen.has(id)) prev.delete(id);
    if (announcements.length) setLiveMessage(announcements.join(" "));
  }, [calls]);

  return (
    <section
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]",
        className,
      )}
      aria-label={title}
    >
      {/* Header ---------------------------------------------------------- */}
      <header className="flex items-center gap-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5">
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[linear-gradient(135deg,var(--color-accent),color-mix(in_oklab,var(--color-accent)_55%,#000))] text-[var(--color-accent-fg)]"
          aria-hidden
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h10M4 12h6M4 17h9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
            <path d="m16 10 3 3 3-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="text-[13px] font-semibold text-[var(--color-fg)]">{title}</span>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          {SUMMARY_TONES.map(({ status, label }) => {
            const n = counts.get(status) ?? 0;
            if (n === 0) return null;
            const vars = statusVars(getStatusMeta(status).tone as StatusTone);
            return (
              <span
                key={status}
                className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                style={{ color: vars.color, borderColor: vars.border, background: vars.bg }}
              >
                <StatusGlyph status={status} reduce={reduce} />
                {label(n)}
              </span>
            );
          })}
          {doneCount > 0 ? (
            <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)]">
              {doneCount} done
            </span>
          ) : null}
        </div>
      </header>

      {/* Polite live region: lifecycle transitions only ------------------ */}
      <div role="status" aria-live="polite" className="sr-only">
        {liveMessage}
      </div>

      {/* Activity list --------------------------------------------------- */}
      {calls.length === 0 ? (
        <p className="px-4 py-8 text-center text-[13px] text-[var(--color-muted)]">No tool activity yet.</p>
      ) : (
        <ol className="flex flex-col gap-2 p-3">
          <AnimatePresence initial={false} mode="popLayout">
            {calls.map((call) => {
              const isExpanded = expanded.has(call.id);
              const isCurrent = call.id === currentId;
              const compact =
                compactCompleted && RESOLVED_QUIET.has(call.status) && !isExpanded && !isCurrent;
              return (
                <ToolCallRow
                  key={call.id}
                  call={call}
                  expanded={isExpanded}
                  current={isCurrent}
                  compact={compact}
                  showDurations={showDurations}
                  reduce={reduce}
                  detailsId={`${uid}-${call.id}-details`}
                  errorId={`${uid}-${call.id}-error`}
                  registerToggle={registerToggle}
                  onToggle={handleToggle}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onRetry={handleRetry}
                  onCopyDetails={onCopyDetails}
                  renderInput={renderInput}
                  renderOutput={renderOutput}
                />
              );
            })}
          </AnimatePresence>
        </ol>
      )}
    </section>
  );
}

export default ToolCallActivity;
