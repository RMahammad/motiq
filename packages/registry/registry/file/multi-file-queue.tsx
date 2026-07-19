"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";

import { cn } from "@/lib/utils";
import { useReducedMotion, statusVars, type StatusTone } from "@/lib/motiq";

/* --------------------------------------------------------------------------
 * MultiFileQueue — a presentation-only view for *managing a collection* of
 * files that the host application schedules through a bounded number of
 * concurrent slots. Where an upload panel shows one transfer's progress, this
 * component is the queue *manager*: priority lanes, active-slot occupancy,
 * blocked-item explanation, queue-level progress, and queue-wide operations
 * (pause-all / resume-all / retry-failed / clear-completed) plus per-item
 * reorder and priority changes.
 *
 * It NEVER uploads, reads a File body, opens a socket, or advances `progress`
 * on its own. The application owns the scheduler and the transport; this
 * component renders the `items` it is given and emits intent callbacks
 * (`onPauseAll`, `onReorder`, `onPriorityChange`, …) so the app can react.
 * `concurrency` (how many slots run at once) is app-supplied — the component
 * only *visualises* occupancy, it does not enforce it.
 *
 * Accessibility is first-class: the queue is a semantic list; every status is
 * conveyed with an icon AND text (never colour alone); priority is a labelled
 * badge, not a hue; in-flight items expose `role="progressbar"` with
 * `aria-valuetext`; blocked items explain *what* they wait on and associate it
 * via `aria-describedby`; reorder and priority changes are ordinary keyboard
 * buttons that announce the item's new lane position in a polite live region;
 * focus is preserved onto a neighbour after an item is removed; and the live
 * region announces STATUS TRANSITIONS and MOVES ONLY — never per-percent — so a
 * screen reader isn't flooded while the queue drains. Under
 * `prefers-reduced-motion` rows appear without offset and bars snap.
 *
 * PERFORMANCE. No per-frame React state: bar width comes from the app-supplied
 * `progress` and is eased purely in CSS, so a fast queue does not re-render
 * React 60×/s (throttle your `progress` writes to a few per second). Rows are
 * memoised and use Motion `layout="position"` so changing one item does not
 * replay every other item's entrance. For very large queues wrap the lanes in
 * your own virtualiser — this component renders every item it is given.
 * Clean-room original.
 * ----------------------------------------------------------------------- */

/** Lifecycle of a single queued file, owned entirely by the application. */
export type QueueStatus =
  | "queued"
  | "waiting"
  | "active"
  | "paused"
  | "blocked"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

/** Scheduling priority. Rendered as a labelled lane + badge, never colour alone. */
export type QueuePriority = "high" | "normal" | "low";

export interface QueueItem {
  /** Stable id, unique within the queue. Drives keys, focus, and callbacks. */
  id: string;
  /** Display name of the file. */
  fileName: string;
  /** MIME type or a coarse family ("image/png", "application/pdf", "video"). */
  fileType: string;
  /** Size in bytes. Rendered human-readable. */
  fileSize: number;
  /** Scheduling priority — determines which lane the item sits in. */
  priority: QueuePriority;
  /** App-maintained 1-based position within the whole queue (display only). */
  queuePosition?: number;
  /** App-owned lifecycle state. */
  status: QueueStatus;
  /** Per-item progress 0–100, supplied and advanced by the app. */
  progress: number;
  /** Instantaneous transfer rate in bytes/second (shown while active). */
  speed?: number;
  /** Estimated seconds remaining (shown while active). */
  remainingTime?: number;
  /** How many times the app has retried this item. */
  retryCount?: number;
  /** Human-readable error, shown and announced when `status === "failed"`. */
  error?: string;
  /** Optional preview image URL (the app owns creating AND revoking blob URLs). */
  thumbnail?: string;
  /** What a `blocked` item is waiting on, e.g. "cover.png to finish". */
  dependency?: string;
  /** Destination label, e.g. "Media library / 2026 campaign". */
  destination?: string;
  /** Free-form metadata rendered by `renderItemDetails` or the default list. */
  metadata?: Record<string, string | number>;
}

export interface MultiFileQueueProps {
  /** The queue, controlled by the host application. Array order IS queue order. */
  items: QueueItem[];
  /**
   * How many items the app runs concurrently. Drives the active-slot indicator.
   * The component only visualises occupancy — it does not start work itself.
   */
  concurrency?: number;
  /** Add files to the queue (the app validates + appends `QueueItem`s). */
  onAdd?: () => void;
  /** Remove a single item from the queue. */
  onRemove?: (item: QueueItem) => void;
  /** Pause a single active item. */
  onPause?: (item: QueueItem) => void;
  /** Resume a single paused item. */
  onResume?: (item: QueueItem) => void;
  /** Retry a single failed item. */
  onRetry?: (item: QueueItem) => void;
  /** Cancel a single in-flight/queued item. */
  onCancel?: (item: QueueItem) => void;
  /** Move an item within the queue (from → to index in `items`). */
  onReorder?: (fromIndex: number, toIndex: number) => void;
  /** Change an item's scheduling priority (moves it between lanes). */
  onPriorityChange?: (item: QueueItem, priority: QueuePriority) => void;
  /** Pause every running item at once. */
  onPauseAll?: () => void;
  /** Resume every paused item at once. */
  onResumeAll?: () => void;
  /** Retry every failed item at once. */
  onRetryFailed?: () => void;
  /** Clear all completed items at once. */
  onClearCompleted?: () => void;
  /** Show an offline banner; the app is expected to pause scheduling. */
  offline?: boolean;
  /** Denser rows (hide secondary meta, smaller thumbnails). */
  compact?: boolean;
  /** Render extra per-item detail below the meta line. */
  renderItemDetails?: (item: QueueItem) => React.ReactNode;
  /** Override byte formatting (e.g. localisation). */
  formatBytes?: (bytes: number) => string;
  /** Header title. */
  title?: string;
  /** Accessible name for the whole region. */
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

const STATUS_META: Record<QueueStatus, StatusMetaEntry> = {
  queued: { label: "Queued", tone: "neutral", bar: false },
  waiting: { label: "Waiting for slot", tone: "neutral", bar: false },
  active: { label: "Active", tone: "active", bar: true },
  paused: { label: "Paused", tone: "warning", bar: true },
  blocked: { label: "Blocked", tone: "warning", bar: false },
  processing: { label: "Processing", tone: "info", bar: true },
  completed: { label: "Completed", tone: "success", bar: false },
  failed: { label: "Failed", tone: "error", bar: false },
  cancelled: { label: "Cancelled", tone: "neutral", bar: false },
};

/** Items currently occupying a concurrency slot. */
const RUNNING: ReadonlySet<QueueStatus> = new Set<QueueStatus>(["active", "processing"]);
/** Items that can be reordered / re-prioritised (still pending). */
const PENDING: ReadonlySet<QueueStatus> = new Set<QueueStatus>(["queued", "waiting", "blocked", "paused"]);
/** Terminal states. */
const TERMINAL: ReadonlySet<QueueStatus> = new Set<QueueStatus>(["completed", "failed", "cancelled"]);

const PRIORITY_ORDER: QueuePriority[] = ["high", "normal", "low"];
const PRIORITY_LABEL: Record<QueuePriority, string> = { high: "High", normal: "Normal", low: "Low" };

/* -- formatting helpers (pure, deterministic) ---------------------------- */

function defaultFormatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exp = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, exp);
  const rounded = exp === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${units[exp]}`;
}

function formatSpeed(bytesPerSec: number, fmt: (b: number) => string): string {
  return `${fmt(bytesPerSec)}/s`;
}

function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  if (seconds < 60) return `${Math.round(seconds)}s left`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m < 60) return s ? `${m}m ${s}s left` : `${m}m left`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m left`;
}

function fileKind(fileType: string): "image" | "video" | "audio" | "pdf" | "archive" | "code" | "file" {
  const t = fileType.toLowerCase();
  if (t.startsWith("image")) return "image";
  if (t.startsWith("video")) return "video";
  if (t.startsWith("audio")) return "audio";
  if (t.includes("pdf")) return "pdf";
  if (/(zip|tar|gzip|rar|7z|compress)/.test(t)) return "archive";
  if (/(json|javascript|typescript|xml|html|css|code|text\/plain)/.test(t)) return "code";
  return "file";
}

/* -- icons --------------------------------------------------------------- */

const svgBase = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

function StatusIcon({ status }: { status: QueueStatus }) {
  const p = { width: 13, height: 13, viewBox: "0 0 24 24", ...svgBase, strokeWidth: 2.4 };
  switch (status) {
    case "completed":
      return <svg {...p}><path d="M20 6 9 17l-5-5" /></svg>;
    case "failed":
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></svg>;
    case "paused":
      return <svg {...p}><path d="M9 5v14M15 5v14" /></svg>;
    case "blocked":
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></svg>;
    case "cancelled":
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></svg>;
    case "processing":
      return <svg {...p}><path d="M21 12a9 9 0 1 1-9-9" /><path d="M21 4v5h-5" /></svg>;
    case "active":
      return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case "waiting":
    case "queued":
    default:
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  }
}

function PriorityIcon({ priority }: { priority: QueuePriority }) {
  const p = { width: 12, height: 12, viewBox: "0 0 24 24", ...svgBase, strokeWidth: 2.4 };
  switch (priority) {
    case "high":
      return <svg {...p}><path d="M6 15l6-6 6 6M6 20l6-6 6 6" /></svg>;
    case "low":
      return <svg {...p}><path d="M6 9l6 6 6-6M6 4l6 6 6-6" /></svg>;
    case "normal":
    default:
      return <svg {...p}><path d="M5 12h14" /></svg>;
  }
}

function FileIcon({ fileType }: { fileType: string }) {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", ...svgBase, strokeWidth: 1.7 };
  const paper = <path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />;
  switch (fileKind(fileType)) {
    case "image":
      return <svg {...p}>{paper}<circle cx="9" cy="11" r="1.4" /><path d="M6 18l3.5-3.5 2.5 2 3-3L18 18" /></svg>;
    case "video":
      return <svg {...p}>{paper}<path d="M10 11l4 2.5-4 2.5z" /></svg>;
    case "audio":
      return <svg {...p}>{paper}<path d="M9 16V9l5-1v6" /><circle cx="8" cy="16" r="1.4" /><circle cx="13" cy="14" r="1.4" /></svg>;
    case "pdf":
      return <svg {...p}>{paper}<path d="M8 13h1.5a1.3 1.3 0 0 0 0-2.6H8V16" /><path d="M13 16v-5h1.4a1.5 1.5 0 0 1 0 3H13" /></svg>;
    case "archive":
      return <svg {...p}>{paper}<path d="M11 6v2M11 10v2M11 14v2" /></svg>;
    case "code":
      return <svg {...p}>{paper}<path d="M10 11l-2 2 2 2M14 11l2 2-2 2" /></svg>;
    default:
      return <svg {...p}>{paper}<path d="M14 2v4h4" /></svg>;
  }
}

function glyph(path: React.ReactNode, size = 14) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...svgBase}>{path}</svg>;
}
const PauseGlyph = () => glyph(<><path d="M9 5v14M15 5v14" /></>);
const ResumeGlyph = () => glyph(<path d="M7 4l13 8-13 8z" />);
const RetryGlyph = () => glyph(<><path d="M4 12a8 8 0 1 1 2.3 5.6M4 12V7m0 5h5" /></>);
const CancelGlyph = () => glyph(<><path d="M18 6 6 18M6 6l12 12" /></>);
const RemoveGlyph = () => glyph(<><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h12l1-14" /></>);
const UpGlyph = () => glyph(<path d="m6 15 6-6 6 6" />, 13);
const DownGlyph = () => glyph(<path d="m6 9 6 6 6-6" />, 13);
const RaiseGlyph = () => glyph(<><path d="M12 19V5M6 11l6-6 6 6" /></>, 13);

/* -- shared styles ------------------------------------------------------- */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-surface)]";

const iconBtn = cn(
  "grid h-7 w-7 place-items-center rounded-md text-[var(--color-muted)] transition-colors",
  "[border:1px_solid_transparent] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)]",
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
  focusRing,
);

const toolbarBtn = cn(
  "inline-flex items-center gap-1.5 rounded-md bg-[var(--color-surface)] px-2 py-1 text-[12px] font-medium text-[var(--color-fg)] [border:1px_solid_var(--color-border)] transition-colors",
  "hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45",
  focusRing,
);

/* -- lane item, with its global index + within-lane siblings ------------- */

interface LaneEntry {
  item: QueueItem;
  globalIndex: number;
}

interface RowProps {
  entry: LaneEntry;
  laneEntries: LaneEntry[];
  laneRank: number; // 1-based position within the lane
  compact: boolean;
  reduce: boolean;
  fmt: (b: number) => string;
  renderItemDetails?: (item: QueueItem) => React.ReactNode;
  onPause?: (item: QueueItem) => void;
  onResume?: (item: QueueItem) => void;
  onRetry?: (item: QueueItem) => void;
  onCancel?: (item: QueueItem) => void;
  onPriorityChange?: (item: QueueItem, priority: QueuePriority) => void;
  move: (entry: LaneEntry, laneEntries: LaneEntry[], direction: -1 | 1) => void;
  raisePriority: (item: QueueItem) => void;
  requestRemove: (item: QueueItem) => void;
  registerRemoveRef: (id: string, el: HTMLButtonElement | null) => void;
}

const QueueRow = React.memo(function QueueRow({
  entry,
  laneEntries,
  laneRank,
  compact,
  reduce,
  fmt,
  renderItemDetails,
  onPause,
  onResume,
  onRetry,
  onCancel,
  onPriorityChange,
  move,
  raisePriority,
  requestRemove,
  registerRemoveRef,
}: RowProps) {
  const { item } = entry;
  const meta = STATUS_META[item.status];
  const vars = statusVars(meta.tone);

  const errorId = `mfq-err-${item.id}`;
  const blockedId = `mfq-blk-${item.id}`;
  const progress = Math.max(0, Math.min(100, Math.round(item.progress)));
  const hasBar = meta.bar;
  const isRunning = item.status === "active";
  const isPaused = item.status === "paused";
  const isBlocked = item.status === "blocked";
  const isFailed = item.status === "failed";
  const canReorder = onReorderEnabled(move) && PENDING.has(item.status) && laneEntries.length > 1;
  const canRaise = !!onPriorityChange && PENDING.has(item.status) && item.priority !== "high";

  const describedBy = [isBlocked && item.dependency ? blockedId : null, isFailed && item.error ? errorId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  const valueText = `${meta.label} - ${progress}%`;

  return (
    <motion.li
      layout={reduce ? false : "position"}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, transition: { duration: 0.16 } }}
      transition={{ duration: 0.22, ease: EASE }}
      className={cn(
        "rounded-xl bg-[var(--color-surface)] [border:1px_solid_var(--color-border)]",
        compact ? "px-2.5 py-2" : "px-3 py-2.5",
      )}
      style={isFailed || isBlocked ? { borderColor: vars.border } : undefined}
      data-status={item.status}
      data-priority={item.priority}
      aria-describedby={describedBy}
    >
      <div className="flex items-start gap-3">
        {/* thumbnail / type icon */}
        {!compact ? (
          <span
            className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-muted)] [border:1px_solid_var(--color-border)]"
            aria-hidden
          >
            {item.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
            ) : (
              <FileIcon fileType={item.fileType} />
            )}
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          {/* name + priority + status */}
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-[var(--color-fg)]" title={item.fileName}>
              {item.fileName}
            </span>

            {/* priority badge — icon + text, never colour alone */}
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
              <PriorityIcon priority={item.priority} />
              <span>{PRIORITY_LABEL[item.priority]}</span>
            </span>

            {/* status pill — icon + text, never colour alone */}
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium [border:1px_solid]"
              style={{ color: vars.color, background: vars.bg, borderColor: vars.border }}
            >
              <StatusIcon status={item.status} />
              <span>{meta.label}</span>
            </span>
          </div>

          {/* meta line */}
          {!compact ? (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-[var(--color-muted)] tabular-nums">
              <span>{fmt(item.fileSize)}</span>
              {isRunning && item.speed != null ? <span>· {formatSpeed(item.speed, fmt)}</span> : null}
              {isRunning && item.remainingTime != null ? <span>· {formatEta(item.remainingTime)}</span> : null}
              {item.destination ? <span className="truncate">· → {item.destination}</span> : null}
              {isFailed && (item.retryCount ?? 0) > 0 ? <span>· retry {item.retryCount}</span> : null}
            </div>
          ) : null}

          {/* progress bar (determinate) — driven by app-supplied progress only */}
          {hasBar ? (
            <div className="mt-2 flex items-center gap-2">
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={valueText}
                aria-label={`${item.fileName} progress`}
                className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-bg-secondary)]"
              >
                <div
                  className={cn("h-full rounded-full", reduce ? "" : "transition-[width] duration-300 ease-out")}
                  style={{ width: `${progress}%`, background: vars.color, opacity: isPaused ? 0.55 : 1 }}
                />
              </div>
              <span className="w-9 shrink-0 text-right text-[11.5px] font-medium text-[var(--color-muted)] tabular-nums">{progress}%</span>
            </div>
          ) : null}

          {/* blocked explanation — associated to the row */}
          {isBlocked && item.dependency ? (
            <p
              id={blockedId}
              className="mt-2 rounded-lg px-2 py-1.5 text-[12px]"
              style={{ background: vars.bg, color: "var(--color-fg)" }}
            >
              <span className="sr-only">Blocked: </span>
              Waiting for {item.dependency}
            </p>
          ) : null}

          {/* error — associated to the row */}
          {isFailed && item.error ? (
            <p
              id={errorId}
              className="mt-2 rounded-lg px-2 py-1.5 text-[12px]"
              style={{ background: vars.bg, color: "var(--color-fg)" }}
            >
              <span className="sr-only">Error: </span>
              {item.error}
            </p>
          ) : null}

          {/* app-provided details */}
          {renderItemDetails ? <div className="mt-2">{renderItemDetails(item)}</div> : null}
        </div>

        {/* action cluster */}
        <div className="flex shrink-0 items-center gap-0.5">
          {canReorder ? (
            <>
              <button
                type="button"
                className={iconBtn}
                disabled={laneRank === 1}
                onClick={() => move(entry, laneEntries, -1)}
                aria-label={`Move ${item.fileName} up in the ${PRIORITY_LABEL[item.priority]} lane`}
              >
                <UpGlyph />
              </button>
              <button
                type="button"
                className={iconBtn}
                disabled={laneRank === laneEntries.length}
                onClick={() => move(entry, laneEntries, 1)}
                aria-label={`Move ${item.fileName} down in the ${PRIORITY_LABEL[item.priority]} lane`}
              >
                <DownGlyph />
              </button>
            </>
          ) : null}

          {canRaise ? (
            <button
              type="button"
              className={iconBtn}
              onClick={() => raisePriority(item)}
              aria-label={`Increase priority of ${item.fileName}`}
            >
              <RaiseGlyph />
            </button>
          ) : null}

          {isRunning && onPause ? (
            <button type="button" className={iconBtn} onClick={() => onPause(item)} aria-label={`Pause ${item.fileName}`}>
              <PauseGlyph />
            </button>
          ) : null}
          {isPaused && onResume ? (
            <button type="button" className={iconBtn} onClick={() => onResume(item)} aria-label={`Resume ${item.fileName}`}>
              <ResumeGlyph />
            </button>
          ) : null}
          {isFailed && onRetry ? (
            <button type="button" className={iconBtn} onClick={() => onRetry(item)} aria-label={`Retry ${item.fileName}`}>
              <RetryGlyph />
            </button>
          ) : null}
          {!TERMINAL.has(item.status) && onCancel ? (
            <button type="button" className={iconBtn} onClick={() => onCancel(item)} aria-label={`Cancel ${item.fileName}`}>
              <CancelGlyph />
            </button>
          ) : null}
          <button
            type="button"
            ref={(el) => registerRemoveRef(item.id, el)}
            className={iconBtn}
            onClick={() => requestRemove(item)}
            aria-label={`Remove ${item.fileName} from the queue`}
          >
            <RemoveGlyph />
          </button>
        </div>
      </div>
    </motion.li>
  );
});

// Small guard so the row only shows reorder controls when the app wired onReorder
// (the `move` handler is a no-op sentinel otherwise). Kept as a function to avoid
// leaking the raw callback into the memoised row's identity checks.
function onReorderEnabled(move: RowProps["move"]): boolean {
  return move !== NOOP_MOVE;
}
const NOOP_MOVE: RowProps["move"] = () => {};

/* -- root component ------------------------------------------------------ */

export function MultiFileQueue({
  items,
  concurrency,
  onAdd,
  onRemove,
  onPause,
  onResume,
  onRetry,
  onCancel,
  onReorder,
  onPriorityChange,
  onPauseAll,
  onResumeAll,
  onRetryFailed,
  onClearCompleted,
  offline = false,
  compact = false,
  renderItemDetails,
  formatBytes = defaultFormatBytes,
  title = "Queue",
  label = "Multi-file queue",
  className,
}: MultiFileQueueProps) {
  const reduce = useReducedMotion();
  const removeRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const fallbackFocusRef = React.useRef<HTMLButtonElement | null>(null);
  const [liveMessage, setLiveMessage] = React.useState("");

  const registerRemoveRef = React.useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) removeRefs.current.set(id, el);
    else removeRefs.current.delete(id);
  }, []);

  /* status-change announcements — NEVER per-percent -------------------- */
  const prevStatus = React.useRef<Map<string, QueueStatus>>(new Map());
  React.useEffect(() => {
    const prev = prevStatus.current;
    const messages: string[] = [];
    const seen = new Set<string>();
    for (const it of items) {
      seen.add(it.id);
      const before = prev.get(it.id);
      if (before !== undefined && before !== it.status) {
        const lbl = STATUS_META[it.status].label.toLowerCase();
        if (it.status === "failed") messages.push(`${it.fileName} failed${it.error ? `: ${it.error}` : ""}`);
        else if (it.status === "blocked") messages.push(`${it.fileName} blocked${it.dependency ? `, waiting for ${it.dependency}` : ""}`);
        else messages.push(`${it.fileName} ${lbl}`);
      }
      prev.set(it.id, it.status);
    }
    for (const id of prev.keys()) if (!seen.has(id)) prev.delete(id);
    if (messages.length) setLiveMessage(messages.join(". "));
  }, [items]);

  /* focus preservation after removal ----------------------------------- */
  const pendingFocus = React.useRef<{ id: string | null } | null>(null);
  const requestRemove = React.useCallback(
    (item: QueueItem) => {
      const index = items.findIndex((it) => it.id === item.id);
      const next = items[index + 1] ?? items[index - 1];
      pendingFocus.current = { id: next ? next.id : null };
      onRemove?.(item);
    },
    [items, onRemove],
  );
  React.useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending) return;
    pendingFocus.current = null;
    const target = pending.id ? removeRefs.current.get(pending.id) : null;
    if (target && document.contains(target)) target.focus();
    else fallbackFocusRef.current?.focus();
  }, [items]);

  /* reorder + priority (with position announcement) -------------------- */
  const move = React.useCallback(
    (entry: LaneEntry, laneEntries: LaneEntry[], direction: -1 | 1) => {
      if (!onReorder) return;
      const rank = laneEntries.findIndex((e) => e.globalIndex === entry.globalIndex);
      const targetRank = rank + direction;
      const target = laneEntries[targetRank];
      if (!target) return;
      onReorder(entry.globalIndex, target.globalIndex);
      setLiveMessage(
        `Moved ${entry.item.fileName} to position ${targetRank + 1} of ${laneEntries.length} in the ${PRIORITY_LABEL[entry.item.priority]} lane`,
      );
    },
    [onReorder],
  );

  const raisePriority = React.useCallback(
    (item: QueueItem) => {
      if (!onPriorityChange) return;
      const idx = PRIORITY_ORDER.indexOf(item.priority);
      const next = PRIORITY_ORDER[Math.max(0, idx - 1)];
      if (next === item.priority) return;
      onPriorityChange(item, next);
      setLiveMessage(`${item.fileName} priority raised to ${PRIORITY_LABEL[next]}`);
    },
    [onPriorityChange],
  );

  /* derived queue state ------------------------------------------------ */
  const summary = React.useMemo(() => {
    let running = 0,
      paused = 0,
      failed = 0,
      completed = 0,
      pending = 0,
      blocked = 0,
      completionSum = 0;
    for (const it of items) {
      if (RUNNING.has(it.status)) running++;
      if (it.status === "paused") paused++;
      if (it.status === "failed") failed++;
      if (it.status === "completed") completed++;
      if (it.status === "blocked") blocked++;
      if (PENDING.has(it.status)) pending++;
      completionSum += it.status === "completed" ? 100 : Math.max(0, Math.min(100, it.progress));
    }
    const overall = items.length ? Math.round(completionSum / items.length) : 0;
    return { running, paused, failed, completed, pending, blocked, overall, total: items.length };
  }, [items]);

  // Lanes: fixed high→normal→low order; only lanes with items are shown.
  const lanes = React.useMemo(() => {
    const byPriority: Record<QueuePriority, LaneEntry[]> = { high: [], normal: [], low: [] };
    items.forEach((item, globalIndex) => byPriority[item.priority].push({ item, globalIndex }));
    return PRIORITY_ORDER.filter((p) => byPriority[p].length > 0).map((p) => ({ priority: p, entries: byPriority[p] }));
  }, [items]);

  const queueRunning = summary.running > 0;
  const canPauseAll = !!onPauseAll && queueRunning;
  const canResumeAll = !!onResumeAll && !queueRunning && summary.paused > 0;
  const moveHandler = onReorder ? move : NOOP_MOVE;
  const isEmpty = items.length === 0;

  const slotsText = concurrency != null ? `${summary.running} / ${concurrency} slots active` : `${summary.running} active`;

  return (
    <section
      aria-label={label}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl bg-[var(--color-bg,var(--color-surface))] shadow-[var(--shadow-md)] [border:1px_solid_var(--color-border)]",
        className,
      )}
    >
      {/* header */}
      <div className="flex flex-col gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[14px] font-semibold text-[var(--color-fg)]">{title}</h3>
          {summary.total > 0 ? (
            <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[12px] font-medium text-[var(--color-muted)] tabular-nums [border:1px_solid_var(--color-border)]">
              {summary.total} {summary.total === 1 ? "file" : "files"}
            </span>
          ) : null}

          {/* active-slot indicator */}
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--color-muted)] tabular-nums" aria-label={slotsText}>
            {concurrency != null ? (
              <span className="flex items-center gap-0.5" aria-hidden>
                {Array.from({ length: Math.max(concurrency, summary.running) }).map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 w-3 rounded-full"
                    style={{ background: i < summary.running ? "var(--color-accent)" : "var(--color-border)" }}
                  />
                ))}
              </span>
            ) : null}
            <span>{slotsText}</span>
          </span>

          {onAdd ? (
            <button type="button" onClick={onAdd} className={cn(toolbarBtn, "ml-auto")}>
              Add files
            </button>
          ) : null}
        </div>

        {/* queue-level progress */}
        {summary.total > 0 ? (
          <div className="flex items-center gap-2">
            <div
              role="progressbar"
              aria-valuenow={summary.overall}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`Queue ${summary.overall}% complete - ${summary.completed} of ${summary.total} done`}
              aria-label="Overall queue progress"
              className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface)]"
            >
              <div
                className={cn("h-full rounded-full bg-[var(--color-accent)]", reduce ? "" : "transition-[width] duration-300 ease-out")}
                style={{ width: `${summary.overall}%` }}
              />
            </div>
            <span className="shrink-0 text-[11.5px] font-medium text-[var(--color-muted)] tabular-nums">
              {summary.completed}/{summary.total} done
            </span>
          </div>
        ) : null}

        {/* queue-level operations */}
        {summary.total > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {canPauseAll ? (
              <button
                type="button"
                ref={fallbackFocusRef}
                onClick={onPauseAll}
                className={toolbarBtn}
              >
                <PauseGlyph /> Pause all
              </button>
            ) : null}
            {canResumeAll ? (
              <button
                type="button"
                ref={fallbackFocusRef}
                onClick={onResumeAll}
                className={toolbarBtn}
              >
                <ResumeGlyph /> Resume all
              </button>
            ) : null}
            {onRetryFailed && summary.failed > 0 ? (
              <button type="button" onClick={onRetryFailed} className={toolbarBtn}>
                <RetryGlyph /> Retry failed ({summary.failed})
              </button>
            ) : null}
            {onClearCompleted && summary.completed > 0 ? (
              <button type="button" onClick={onClearCompleted} className={toolbarBtn}>
                <RemoveGlyph /> Clear completed ({summary.completed})
              </button>
            ) : null}

            {/* compact status summary — icon + text */}
            <div className="ml-auto flex flex-wrap items-center gap-x-2.5 text-[11.5px] text-[var(--color-muted)] tabular-nums">
              {summary.blocked > 0 ? (
                <span className="inline-flex items-center gap-1" style={{ color: "var(--color-warning)" }}>
                  <StatusIcon status="blocked" />
                  {summary.blocked} blocked
                </span>
              ) : null}
              {summary.failed > 0 ? (
                <span className="inline-flex items-center gap-1" style={{ color: "var(--color-error)" }}>
                  <StatusIcon status="failed" />
                  {summary.failed} failed
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* offline banner */}
      {offline ? (
        <div
          className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-2 text-[12.5px]"
          style={{ background: statusVars("warning").bg, color: "var(--color-fg)" }}
          role="status"
        >
          <StatusIcon status="paused" />
          You are offline. The queue is paused and resumes automatically when the connection returns.
        </div>
      ) : null}

      {/* lanes */}
      <div className="flex flex-col gap-4 p-3">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-1 rounded-xl px-6 py-10 text-center text-[var(--color-muted)]">
            <p className="text-[13px] font-medium text-[var(--color-fg)]">The queue is empty</p>
            <p className="text-[12px]">{onAdd ? "Add files to start scheduling them." : "Queued files will appear here."}</p>
          </div>
        ) : (
          lanes.map((lane) => (
            <div key={lane.priority} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1">
                <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  <PriorityIcon priority={lane.priority} />
                  {PRIORITY_LABEL[lane.priority]} priority
                </span>
                <span className="text-[11px] text-[var(--color-muted)] tabular-nums">
                  {lane.entries.length} {lane.entries.length === 1 ? "file" : "files"}
                </span>
                <span className="h-px flex-1 bg-[var(--color-border)]" aria-hidden />
              </div>

              <ul role="list" aria-label={`${PRIORITY_LABEL[lane.priority]} priority lane`} className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {lane.entries.map((entry, laneRank) => (
                    <QueueRow
                      key={entry.item.id}
                      entry={entry}
                      laneEntries={lane.entries}
                      laneRank={laneRank + 1}
                      compact={compact}
                      reduce={reduce}
                      fmt={formatBytes}
                      renderItemDetails={renderItemDetails}
                      onPause={onPause}
                      onResume={onResume}
                      onRetry={onRetry}
                      onCancel={onCancel}
                      onPriorityChange={onPriorityChange}
                      move={moveHandler}
                      raisePriority={raisePriority}
                      requestRemove={requestRemove}
                      registerRemoveRef={registerRemoveRef}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          ))
        )}
      </div>

      {/* polite live region — status transitions + moves only, never per-percent */}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </p>
    </section>
  );
}

export default MultiFileQueue;
