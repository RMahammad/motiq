"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motionstack";

/**
 * DeploymentPipeline — an accessible, reduced-motion-safe visualization of a
 * CI/CD deployment run: ordered stages, per-stage status, live emphasis on the
 * running stage, expandable logs, durations, and a Retry affordance on
 * failed/cancelled stages.
 *
 * This component is display-only: it never talks to a deployment provider. The
 * host application owns the pipeline data and passes it in via `stages`, and
 * decides what `onRetry` does. Clean-room original.
 */

export type StageStatus =
  | "queued"
  | "running"
  | "passed"
  | "failed"
  | "cancelled"
  | "skipped";

export interface Stage {
  /** Stable identifier, unique within the pipeline. */
  id: string;
  /** Human label, e.g. "Build". */
  name: string;
  status: StageStatus;
  /** Wall-clock duration in milliseconds, if known. */
  durationMs?: number;
  /** Console lines for this stage, revealed when the row is expanded. */
  logs?: string[];
}

export interface DeploymentPipelineProps {
  /** The ordered stages of the run (controlled by the host application). */
  stages: Stage[];
  /** Called with a stage id when its Retry control is activated. */
  onRetry?: (stageId: string) => void;
  /** Id of a stage whose logs start expanded. */
  defaultExpandedId?: string;
  /** Accessible name for the pipeline list. */
  label?: string;
  className?: string;
}

interface StatusMeta {
  /** Short text label, announced to assistive tech alongside the icon. */
  label: string;
  /** CSS custom property that tints this status. */
  color: string;
  /** Whether this status offers a Retry control. */
  retryable: boolean;
}

// Semantic status tokens (no obsolete fallbacks — the tokens exist). Status is
// always icon + label, never color alone.
const STATUS: Record<StageStatus, StatusMeta> = {
  queued: { label: "Queued", color: "var(--color-neutral, var(--color-muted))", retryable: false },
  running: { label: "Running", color: "var(--color-accent)", retryable: false },
  passed: { label: "Passed", color: "var(--color-success)", retryable: false },
  failed: { label: "Failed", color: "var(--color-error)", retryable: true },
  cancelled: { label: "Cancelled", color: "var(--color-neutral, var(--color-muted))", retryable: true },
  skipped: { label: "Skipped", color: "var(--color-neutral, var(--color-muted))", retryable: false },
};

/** Compact, deterministic duration text (no locale dependency for the demo). */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) {
    const s = Math.round(totalSeconds * 10) / 10;
    return `${Number.isInteger(s) ? s : s.toFixed(1)}s`;
  }
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return s ? `${m}m ${s}s` : `${m}m`;
}

/**
 * Status glyphs. Every glyph is decorative (`aria-hidden`) — the adjacent text
 * label carries meaning, so status is never conveyed by color/shape alone. A
 * `currentColor` stroke keeps them visible under forced-colors.
 */
function StatusIcon({ status }: { status: StageStatus }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
  };
  switch (status) {
    case "passed":
      return (
        <svg {...common}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "failed":
      return (
        <svg {...common}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      );
    case "cancelled":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M6.5 6.5l11 11" />
        </svg>
      );
    case "skipped":
      return (
        <svg {...common}>
          <path d="M5 5v14M12 6l7 6-7 6z" />
        </svg>
      );
    case "running":
      return (
        <svg {...common}>
          <path d="M12 3a9 9 0 1 0 9 9" />
        </svg>
      );
    case "queued":
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4l2.5 2" />
        </svg>
      );
  }
}

function Chevron() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

interface RowProps {
  stage: Stage;
  isLast: boolean;
  expanded: boolean;
  onToggle: () => void;
  onRetry?: (id: string) => void;
  reduce: boolean;
  active: boolean;
}

function StageRow({ stage, isLast, expanded, onToggle, onRetry, reduce, active }: RowProps) {
  const meta = STATUS[stage.status];
  const running = stage.status === "running";
  const done = stage.status === "passed";
  const logsId = `dp-logs-${stage.id}`;
  const hasLogs = Boolean(stage.logs && stage.logs.length > 0);
  // Emphasis animation only when running, on-screen/visible, and motion is allowed.
  const animate = running && active && !reduce;

  return (
    <li className="relative flex gap-3">
      {/* Node + connector rail --------------------------------------- */}
      <div className="relative flex w-7 shrink-0 flex-col items-center">
        <span
          className={cn(
            "relative z-10 grid h-7 w-7 place-items-center rounded-full border",
            "bg-[var(--color-surface)]",
          )}
          style={{
            color: meta.color,
            borderColor: meta.color,
            // Fill the node for terminal-good and running states for legibility.
            background:
              done || running
                ? `color-mix(in oklab, ${meta.color} 16%, var(--color-surface))`
                : "var(--color-surface)",
          }}
        >
          {/* Pulse halo on the running node (motion). */}
          {animate ? (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{ border: `2px solid ${meta.color}` }}
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 1.9 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
            />
          ) : null}
          {/* Spinner rotation on the running glyph. */}
          {running ? (
            <motion.span
              className="grid place-items-center"
              animate={animate ? { rotate: 360 } : { rotate: 0 }}
              transition={
                animate ? { duration: 0.9, repeat: Infinity, ease: "linear" } : { duration: 0 }
              }
            >
              <StatusIcon status={stage.status} />
            </motion.span>
          ) : (
            <StatusIcon status={stage.status} />
          )}
        </span>

        {/* Connector down to the next stage. */}
        {!isLast ? (
          <span
            className="relative mt-0.5 w-0.5 flex-1 overflow-hidden rounded-full"
            style={{ background: "var(--color-border)" }}
            aria-hidden
          >
            {/* Solid fill for completed segments. */}
            {done ? (
              <span className="absolute inset-0" style={{ background: meta.color, opacity: 0.5 }} />
            ) : null}
            {/* Indeterminate progress travelling down from the running stage. */}
            {animate ? (
              <motion.span
                className="absolute inset-x-0 h-1/2"
                style={{
                  background: `linear-gradient(to bottom, transparent, ${meta.color}, transparent)`,
                }}
                initial={{ y: "-100%" }}
                animate={{ y: "200%" }}
                transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
              />
            ) : running ? (
              // Reduced-motion / offscreen: static half-fill, no looping animation.
              <span
                className="absolute inset-x-0 top-0 h-1/2"
                style={{ background: meta.color, opacity: 0.45 }}
              />
            ) : null}
          </span>
        ) : null}
      </div>

      {/* Content ------------------------------------------------------ */}
      <div className="min-w-0 flex-1 pb-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[14px] font-semibold text-[var(--color-fg)]">{stage.name}</span>

          {/* Status pill: icon + TEXT, so it never relies on color alone. */}
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium"
            style={{
              color: meta.color,
              borderColor: `color-mix(in oklab, ${meta.color} 45%, var(--color-border))`,
              background: `color-mix(in oklab, ${meta.color} 10%, transparent)`,
            }}
          >
            <StatusIcon status={stage.status} />
            {meta.label}
          </span>

          {typeof stage.durationMs === "number" ? (
            <span className="font-mono text-[11.5px] text-[var(--color-muted)]">
              {formatDuration(stage.durationMs)}
            </span>
          ) : null}

          <span className="flex w-full items-center gap-1.5 sm:ml-auto sm:w-auto">
            {meta.retryable && onRetry ? (
              <button
                type="button"
                onClick={() => onRetry(stage.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)]",
                  "bg-[var(--color-surface)] px-2 py-1 text-[12px] font-medium text-[var(--color-fg)]",
                  "transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))]",
                )}
              >
                <RetryIcon />
                Retry
                <span className="sr-only"> {stage.name} stage</span>
              </button>
            ) : null}

            {hasLogs ? (
              <button
                type="button"
                onClick={onToggle}
                aria-expanded={expanded}
                aria-controls={logsId}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border border-transparent px-1.5 py-1",
                  "text-[12px] font-medium text-[var(--color-muted)]",
                  "transition-colors hover:text-[var(--color-fg)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))]",
                )}
              >
                <span>{expanded ? "Hide logs" : "Logs"}</span>
                <motion.span
                  className="grid place-items-center"
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.2, ease: [0.2, 0, 0, 1] }}
                >
                  <Chevron />
                </motion.span>
              </button>
            ) : null}
          </span>
        </div>

        {/* Expandable console logs. */}
        {hasLogs ? (
          <AnimatePresence initial={false}>
            {expanded ? (
              <motion.div
                key="logs"
                id={logsId}
                role="region"
                aria-label={`${stage.name} logs`}
                initial={reduce ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.24, ease: [0.2, 0, 0, 1] }}
                className="overflow-hidden"
              >
                <pre
                  className={cn(
                    "mt-2 max-h-56 overflow-auto rounded-lg border border-[var(--color-border)]",
                    "bg-[var(--color-bg-secondary)] p-3 font-mono text-[12px] leading-relaxed text-[var(--color-fg)]",
                  )}
                >
                  {stage.logs!.map((line, i) => (
                    <div key={i} className="flex gap-3 whitespace-pre-wrap break-words">
                      <span className="select-none text-[var(--color-muted)]" aria-hidden>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{line}</span>
                    </div>
                  ))}
                </pre>
              </motion.div>
            ) : null}
          </AnimatePresence>
        ) : null}
      </div>
    </li>
  );
}

/** Plain-text summary of the run for the polite live region. */
function summarize(stages: Stage[]): string {
  const total = stages.length;
  const done = stages.filter((s) => s.status === "passed").length;
  const running = stages.find((s) => s.status === "running");
  const failed = stages.find((s) => s.status === "failed" || s.status === "cancelled");
  if (failed) return `Pipeline halted at ${failed.name}: ${STATUS[failed.status].label.toLowerCase()}.`;
  if (running) return `Running ${running.name} — ${done} of ${total} stages complete.`;
  if (done === total) return `Pipeline complete — all ${total} stages passed.`;
  return `${done} of ${total} stages complete.`;
}

export function DeploymentPipeline({
  stages,
  onRetry,
  defaultExpandedId,
  label = "Deployment pipeline",
  className,
}: DeploymentPipelineProps) {
  const reduce = useReducedMotion();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const visible = useVisibilityPause(rootRef, { threshold: 0.15 });

  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set(defaultExpandedId ? [defaultExpandedId] : []),
  );

  const toggle = React.useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn(
        "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-md)] sm:p-5",
        className,
      )}
    >
      <ol className="m-0 list-none p-0">
        {stages.map((stage, i) => (
          <StageRow
            key={stage.id}
            stage={stage}
            isLast={i === stages.length - 1}
            expanded={expanded.has(stage.id)}
            onToggle={() => toggle(stage.id)}
            onRetry={onRetry}
            reduce={reduce}
            active={visible}
          />
        ))}
      </ol>

      {/* Polite run summary for assistive tech; visually redundant with rows. */}
      <p className="sr-only" role="status" aria-live="polite">
        {summarize(stages)}
      </p>
    </div>
  );
}

export default DeploymentPipeline;
