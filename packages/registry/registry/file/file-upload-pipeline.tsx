"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useDisclosure,
  useCopy,
  statusVars,
  type StatusTone,
} from "@/lib/motiq";

/* --------------------------------------------------------------------------
 * FileUploadPipeline — a presentation-only view of an upload queue with
 * per-item progress, pause/resume, retry, cancel, processing stages, and
 * partial-failure handling. It is the *panel*, not the *uploader*.
 *
 * The host APPLICATION owns uploading. This component never opens an XHR/fetch,
 * never reads a File body, and never advances `progress` on its own — it renders
 * the `items` it is given and calls back (`onPause`, `onRetry`, `onAddFiles`, …)
 * so the app can drive the real transfer (or drive nothing, in a static demo).
 * There is no built-in adapter; wiring the component to a transport is the app's
 * job. This keeps it transport-agnostic (fetch, XHR, tus, S3 multipart, RSC
 * actions) and SSR-safe.
 *
 * Accessibility is first-class: a real `<input type="file">` integration point
 * plus a keyboard-accessible Browse button as the drop-zone alternative; every
 * in-flight item exposes `role="progressbar"` with `aria-valuenow/min/max` and a
 * text `aria-valuetext`; status is always conveyed with an icon AND text (never
 * colour alone); errors are associated to their row via `aria-describedby`; and
 * the polite live region announces STATUS TRANSITIONS ONLY — never per-percent —
 * so a screen reader isn't flooded during a transfer. Under
 * `prefers-reduced-motion` rows appear without offset and progress bars snap.
 * Clean-room original.
 *
 * PERFORMANCE. The component performs no per-frame React state updates: bar
 * width is set from the app-supplied `progress` and eased purely in CSS, so a
 * fast upload does not re-render React 60×/s (the app should throttle its own
 * `progress` writes to a few per second). THUMBNAIL CLEANUP is the app's
 * responsibility — if you pass `thumbnail` as an `URL.createObjectURL(...)`
 * blob URL, revoke it when the item leaves `items` (this component does not,
 * because it did not create the URL). For very large queues (hundreds of
 * concurrent items) wrap the list in your own virtualizer — this component
 * renders every item it is given.
 * ----------------------------------------------------------------------- */

/** Lifecycle of a single file, owned entirely by the application. */
export type UploadStatus =
  | "queued"
  | "preparing"
  | "uploading"
  | "paused"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface UploadItem {
  /** Stable id, unique within the queue. Drives keys, focus, and callbacks. */
  id: string;
  /** Display name of the file. */
  fileName: string;
  /** MIME type or a coarse family ("image/png", "application/pdf", "video"). */
  fileType: string;
  /** Size in bytes. Rendered human-readable; also used for the aggregate. */
  fileSize: number;
  /** Transfer progress 0–100, supplied and advanced by the app. */
  progress: number;
  /** App-owned lifecycle state. */
  status: UploadStatus;
  /** Instantaneous transfer rate in bytes/second (shown while uploading). */
  speed?: number;
  /** Estimated seconds remaining (shown while uploading). */
  remainingTime?: number;
  /** Human-readable error, shown and announced when `status === "failed"`. */
  error?: string;
  /** How many times the app has retried this item. */
  retryCount?: number;
  /** Optional label for the post-upload processing phase, e.g. "Transcoding". */
  processingStage?: string;
  /** Optional preview image URL (the app owns creating AND revoking blob URLs). */
  thumbnail?: string;
  /** Free-form metadata rendered in the expandable details region. */
  metadata?: Record<string, string | number>;
}

export interface FileUploadPipelineProps {
  /** The upload queue, controlled by the host application. */
  items: UploadItem[];
  /**
   * Called with the selected/dropped files. The app validates + starts them and
   * appends the resulting `UploadItem`s. When absent, the drop-zone is hidden.
   */
  onAddFiles?: (files: File[]) => void;
  /** Pause an in-flight item. */
  onPause?: (item: UploadItem) => void;
  /** Resume a paused item. */
  onResume?: (item: UploadItem) => void;
  /** Retry a failed item. */
  onRetry?: (item: UploadItem) => void;
  /** Cancel an in-flight/queued item. */
  onCancel?: (item: UploadItem) => void;
  /** Remove a terminal item (completed/failed/cancelled) from the list. */
  onRemove?: (item: UploadItem) => void;
  /** Clear all completed items at once. When absent, the control is hidden. */
  onClearCompleted?: () => void;
  /** Reorder the queue (from → to index). Enables up/down controls on queued items. */
  onReorder?: (fromIndex: number, toIndex: number) => void;
  /** Notified when an item's error text is copied. */
  onCopyError?: (item: UploadItem) => void;
  /** `accept` attribute forwarded to the file input. */
  accept?: string;
  /** Allow selecting multiple files (default true). */
  multiple?: boolean;
  /** Show an offline banner and disable adding files. */
  offline?: boolean;
  /** Override byte formatting (e.g. localisation). */
  formatBytes?: (bytes: number) => string;
  /** Header title. */
  title?: string;
  /** Accessible name for the whole region. */
  label?: string;
  className?: string;
}

const EASE: Transition["ease"] = [0.2, 0, 0, 1];

/* -- status vocabulary — icon + label, tinted with semantic status tokens -- */

interface StatusMetaEntry {
  label: string;
  tone: StatusTone;
  /** Whether this state shows a determinate progress bar. */
  bar: boolean;
}

const STATUS_META: Record<UploadStatus, StatusMetaEntry> = {
  queued: { label: "Queued", tone: "neutral", bar: false },
  preparing: { label: "Preparing", tone: "info", bar: true },
  uploading: { label: "Uploading", tone: "active", bar: true },
  paused: { label: "Paused", tone: "warning", bar: true },
  processing: { label: "Processing", tone: "info", bar: true },
  completed: { label: "Completed", tone: "success", bar: false },
  failed: { label: "Failed", tone: "error", bar: false },
  cancelled: { label: "Cancelled", tone: "neutral", bar: false },
};

const ACTIVE: ReadonlySet<UploadStatus> = new Set<UploadStatus>([
  "queued",
  "preparing",
  "uploading",
  "paused",
  "processing",
]);
const TERMINAL: ReadonlySet<UploadStatus> = new Set<UploadStatus>(["completed", "failed", "cancelled"]);

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

function StatusIcon({ status }: { status: UploadStatus }) {
  const p = { width: 13, height: 13, viewBox: "0 0 24 24", ...svgBase, strokeWidth: 2.4 };
  switch (status) {
    case "completed":
      return <svg {...p}><path d="M20 6 9 17l-5-5" /></svg>;
    case "failed":
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></svg>;
    case "paused":
      return <svg {...p}><path d="M9 5v14M15 5v14" /></svg>;
    case "cancelled":
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></svg>;
    case "processing":
      return <svg {...p}><path d="M21 12a9 9 0 1 1-9-9" /><path d="M21 4v5h-5" /></svg>;
    case "uploading":
    case "preparing":
      return <svg {...p}><path d="M12 19V6M6 11l6-6 6 6" /></svg>;
    case "queued":
    default:
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
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
const CopyGlyph = () => glyph(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>, 13);
const CheckGlyph = () => glyph(<path d="M20 6 9 17l-5-5" />, 13);
const ChevronGlyph = () => glyph(<path d="m6 9 6 6 6-6" />, 13);
const UpGlyph = () => glyph(<path d="m6 15 6-6 6 6" />, 13);
const DownGlyph = () => glyph(<path d="m6 9 6 6 6-6" />, 13);
const CloudGlyph = () => glyph(<><path d="M12 13V4M8 8l4-4 4 4" /><path d="M20 16.5A3.5 3.5 0 0 0 18 10a5.5 5.5 0 0 0-10.6-1.3A4 4 0 0 0 6 16.5" /></>, 26);

/* -- shared button style ------------------------------------------------- */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-surface)]";

const iconBtn = cn(
  "grid h-7 w-7 place-items-center rounded-md text-[var(--color-muted)] transition-colors",
  "[border:1px_solid_transparent] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)]",
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
  focusRing,
);

/* -- single row (owns its disclosure + copy state) ----------------------- */

interface RowProps {
  item: UploadItem;
  index: number;
  count: number;
  reduce: boolean;
  fmt: (b: number) => string;
  onPause?: (item: UploadItem) => void;
  onResume?: (item: UploadItem) => void;
  onRetry?: (item: UploadItem) => void;
  onCancel?: (item: UploadItem) => void;
  onRemove?: (item: UploadItem) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onCopyError?: (item: UploadItem) => void;
  requestRemove: (item: UploadItem, index: number) => void;
  registerRemoveRef: (id: string, el: HTMLButtonElement | null) => void;
}

const UploadRow = React.memo(function UploadRow({
  item,
  index,
  count,
  reduce,
  fmt,
  onPause,
  onResume,
  onRetry,
  onCancel,
  onRemove,
  onReorder,
  onCopyError,
  requestRemove,
  registerRemoveRef,
}: RowProps) {
  const meta = STATUS_META[item.status];
  const vars = statusVars(meta.tone);
  const details = useDisclosure({ idPrefix: "upl-details" });
  const { copied, copy } = useCopy({ onCopy: () => onCopyError?.(item) });

  const errorId = `upl-err-${item.id}`;
  const progress = Math.max(0, Math.min(100, Math.round(item.progress)));
  const hasBar = meta.bar;
  const isFailed = item.status === "failed";
  const isUploading = item.status === "uploading";
  const isPaused = item.status === "paused";
  const isQueuedReorder = onReorder && item.status === "queued";
  const hasMeta = !!item.metadata && Object.keys(item.metadata).length > 0;

  const valueText = item.processingStage && item.status === "processing"
    ? `${meta.label}: ${item.processingStage} — ${progress}%`
    : `${meta.label} — ${progress}%`;

  return (
    <motion.li
      layout={reduce ? false : "position"}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, transition: { duration: 0.16 } }}
      transition={{ duration: 0.22, ease: EASE }}
      className="rounded-xl bg-[var(--color-surface)] px-3 py-2.5 [border:1px_solid_var(--color-border)]"
      style={isFailed ? { borderColor: vars.border } : undefined}
      data-status={item.status}
    >
      <div className="flex items-start gap-3">
        {/* thumbnail / type icon */}
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

        <div className="min-w-0 flex-1">
          {/* name + status + actions */}
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-[var(--color-fg)]" title={item.fileName}>
              {item.fileName}
            </span>

            {/* status pill: icon + text, never colour alone */}
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium [border:1px_solid]"
              style={{ color: vars.color, background: vars.bg, borderColor: vars.border }}
            >
              <StatusIcon status={item.status} />
              <span>{meta.label}</span>
            </span>
          </div>

          {/* meta line */}
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-[var(--color-muted)] tabular-nums">
            <span>{fmt(item.fileSize)}</span>
            {isUploading && item.speed != null ? <span>· {formatSpeed(item.speed, fmt)}</span> : null}
            {isUploading && item.remainingTime != null ? <span>· {formatEta(item.remainingTime)}</span> : null}
            {item.status === "processing" && item.processingStage ? <span>· {item.processingStage}</span> : null}
            {isFailed && (item.retryCount ?? 0) > 0 ? <span>· retry {item.retryCount}</span> : null}
            {hasMeta ? (
              <button
                type="button"
                {...details.triggerProps}
                className={cn("ml-auto inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[11px] font-medium text-[var(--color-muted)] hover:text-[var(--color-fg)]", focusRing)}
              >
                Details
                <motion.span aria-hidden animate={reduce ? undefined : { rotate: details.open ? 180 : 0 }} className="inline-flex">
                  <ChevronGlyph />
                </motion.span>
              </button>
            ) : null}
          </div>

          {/* progress bar (determinate) — updated via app-supplied progress only */}
          {hasBar ? (
            <div className="mt-2 flex items-center gap-2">
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={valueText}
                aria-label={`${item.fileName} upload progress`}
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

          {/* error — associated to the row via aria-describedby */}
          {isFailed && item.error ? (
            <div
              className="mt-2 flex items-start gap-2 rounded-lg px-2 py-1.5 text-[12px]"
              style={{ background: vars.bg, color: "var(--color-fg)" }}
            >
              <span id={errorId} className="min-w-0 flex-1">
                <span className="sr-only">Error: </span>
                {item.error}
              </span>
              <button
                type="button"
                onClick={() => void copy(item.error ?? "")}
                aria-describedby={errorId}
                className={cn("inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-muted)] hover:text-[var(--color-fg)]", focusRing)}
              >
                {copied ? <CheckGlyph /> : <CopyGlyph />}
                {copied ? "Copied" : "Copy"}
                {copied ? <span className="sr-only" role="status">Error copied to clipboard</span> : null}
              </button>
            </div>
          ) : null}

          {/* details region */}
          <AnimatePresence initial={false}>
            {hasMeta && details.open ? (
              <motion.dl
                {...details.panelProps}
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 overflow-hidden rounded-lg bg-[var(--color-bg-secondary)] px-2.5 py-2 text-[11.5px]"
              >
                {Object.entries(item.metadata ?? {}).map(([k, v]) => (
                  <React.Fragment key={k}>
                    <dt className="text-[var(--color-muted)]">{k}</dt>
                    <dd className="truncate font-medium text-[var(--color-fg)]">{String(v)}</dd>
                  </React.Fragment>
                ))}
              </motion.dl>
            ) : null}
          </AnimatePresence>
        </div>

        {/* action cluster */}
        <div className="flex shrink-0 items-center gap-0.5">
          {isQueuedReorder ? (
            <>
              <button
                type="button"
                className={iconBtn}
                disabled={index === 0}
                onClick={() => onReorder?.(index, index - 1)}
                aria-label={`Move ${item.fileName} up in the queue`}
              >
                <UpGlyph />
              </button>
              <button
                type="button"
                className={iconBtn}
                disabled={index === count - 1}
                onClick={() => onReorder?.(index, index + 1)}
                aria-label={`Move ${item.fileName} down in the queue`}
              >
                <DownGlyph />
              </button>
            </>
          ) : null}

          {isUploading && onPause ? (
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
          {ACTIVE.has(item.status) && onCancel ? (
            <button type="button" className={iconBtn} onClick={() => onCancel(item)} aria-label={`Cancel ${item.fileName}`}>
              <CancelGlyph />
            </button>
          ) : null}
          {TERMINAL.has(item.status) && onRemove ? (
            <button
              type="button"
              ref={(el) => registerRemoveRef(item.id, el)}
              className={iconBtn}
              onClick={() => requestRemove(item, index)}
              aria-label={`Remove ${item.fileName}`}
            >
              <RemoveGlyph />
            </button>
          ) : null}
        </div>
      </div>
    </motion.li>
  );
});

/* -- root component ------------------------------------------------------ */

export function FileUploadPipeline({
  items,
  onAddFiles,
  onPause,
  onResume,
  onRetry,
  onCancel,
  onRemove,
  onClearCompleted,
  onReorder,
  onCopyError,
  accept,
  multiple = true,
  offline = false,
  formatBytes = defaultFormatBytes,
  title = "Uploads",
  label = "File upload pipeline",
  className,
}: FileUploadPipelineProps) {
  const reduce = useReducedMotion();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const browseRef = React.useRef<HTMLButtonElement | null>(null);
  const removeRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const [dragOver, setDragOver] = React.useState(false);
  const [liveMessage, setLiveMessage] = React.useState("");

  const registerRemoveRef = React.useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) removeRefs.current.set(id, el);
    else removeRefs.current.delete(id);
  }, []);

  /* status-change announcements — NEVER per-percent -------------------- */
  const prevStatus = React.useRef<Map<string, UploadStatus>>(new Map());
  React.useEffect(() => {
    const prev = prevStatus.current;
    const messages: string[] = [];
    const seen = new Set<string>();
    for (const it of items) {
      seen.add(it.id);
      const before = prev.get(it.id);
      if (before !== undefined && before !== it.status) {
        const label = STATUS_META[it.status].label.toLowerCase();
        if (it.status === "failed") messages.push(`${it.fileName} failed${it.error ? `: ${it.error}` : ""}`);
        else messages.push(`${it.fileName} ${label}`);
      }
      prev.set(it.id, it.status);
    }
    for (const id of prev.keys()) if (!seen.has(id)) prev.delete(id);
    if (messages.length) setLiveMessage(messages.join(". "));
  }, [items]);

  /* focus preservation after removal ----------------------------------- */
  // A remove request records the id we want focus to land on once the app has
  // dropped the item from `items`; the effect below moves focus after re-render.
  const pendingFocus = React.useRef<{ id: string | null } | null>(null);
  const requestRemove = React.useCallback(
    (item: UploadItem, index: number) => {
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
    // Prefer the neighbouring row's remove control; else fall back to Browse.
    if (target && document.contains(target)) target.focus();
    else browseRef.current?.focus();
  }, [items]);

  /* file input / drop wiring ------------------------------------------- */
  const emitFiles = React.useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      onAddFiles?.(Array.from(fileList));
    },
    [onAddFiles],
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (offline) return;
      emitFiles(e.dataTransfer?.files ?? null);
    },
    [emitFiles, offline],
  );

  /* aggregate summary -------------------------------------------------- */
  const summary = React.useMemo(() => {
    let uploading = 0, completed = 0, failed = 0, queued = 0, active = 0, progressSum = 0, activeCount = 0;
    for (const it of items) {
      if (it.status === "uploading") uploading++;
      else if (it.status === "completed") completed++;
      else if (it.status === "failed") failed++;
      else if (it.status === "queued") queued++;
      if (ACTIVE.has(it.status)) {
        active++;
        progressSum += Math.max(0, Math.min(100, it.progress));
        activeCount++;
      }
    }
    const overall = activeCount ? Math.round(progressSum / activeCount) : 0;
    return { uploading, completed, failed, queued, active, overall, total: items.length };
  }, [items]);

  const isEmpty = items.length === 0;

  return (
    <section
      aria-label={label}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl bg-[var(--color-bg,var(--color-surface))] shadow-[var(--shadow-md)] [border:1px_solid_var(--color-border)]",
        className,
      )}
    >
      {/* header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3">
        <h3 className="text-[14px] font-semibold text-[var(--color-fg)]">{title}</h3>
        {summary.total > 0 ? (
          <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[12px] font-medium text-[var(--color-muted)] tabular-nums [border:1px_solid_var(--color-border)]">
            {summary.total} {summary.total === 1 ? "file" : "files"}
          </span>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-2.5 text-[11.5px] text-[var(--color-muted)] tabular-nums">
          {summary.active > 0 ? <span>{summary.overall}% overall</span> : null}
          {summary.completed > 0 ? (
            <span className="inline-flex items-center gap-1" style={{ color: "var(--color-success)" }}>
              <StatusIcon status="completed" />{summary.completed} done
            </span>
          ) : null}
          {summary.failed > 0 ? (
            <span className="inline-flex items-center gap-1" style={{ color: "var(--color-error)" }}>
              <StatusIcon status="failed" />{summary.failed} failed
            </span>
          ) : null}
        </div>
        {onClearCompleted && summary.completed > 0 ? (
          <button
            type="button"
            onClick={onClearCompleted}
            className={cn(
              "ml-auto inline-flex items-center gap-1.5 rounded-md bg-[var(--color-surface)] px-2 py-1 text-[12px] font-medium text-[var(--color-fg)] [border:1px_solid_var(--color-border)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
              focusRing,
            )}
          >
            Clear completed
          </button>
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
          You are offline. Uploads are paused and will resume when the connection returns.
        </div>
      ) : null}

      {/* drop zone (only when the app accepts new files) */}
      {onAddFiles ? (
        <div className="px-3 pt-3">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!offline) setDragOver(true);
            }}
            onDragLeave={(e) => {
              if (e.currentTarget === e.target) setDragOver(false);
            }}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 rounded-xl px-4 py-6 text-center transition-colors",
              "[border:1.5px_dashed_var(--color-border)]",
              dragOver && "[border-color:var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_8%,transparent)]",
              offline && "opacity-60",
            )}
            data-dragover={dragOver || undefined}
          >
            <span className="text-[var(--color-muted)]" aria-hidden><CloudGlyph /></span>
            <p className="text-[13px] text-[var(--color-fg)]">
              <span className="font-medium">{dragOver ? "Drop to upload" : "Drag files here"}</span>
              <span className="text-[var(--color-muted)]"> or</span>
            </p>
            {/* real input + keyboard-accessible Browse alternative */}
            <input
              ref={inputRef}
              type="file"
              multiple={multiple}
              accept={accept}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                emitFiles(e.target.files);
                e.target.value = ""; // allow re-selecting the same file
              }}
            />
            <button
              type="button"
              ref={browseRef}
              disabled={offline}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-semibold text-[var(--color-accent-foreground,white)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45",
                focusRing,
              )}
            >
              Browse files
            </button>
            <p className="text-[11.5px] text-[var(--color-muted)]">
              {accept ? `Accepted: ${accept}` : "Any file type"}{multiple ? " · multiple allowed" : ""}
            </p>
          </div>
        </div>
      ) : null}

      {/* list */}
      <div className="flex flex-col gap-2 p-3">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-1 rounded-xl px-6 py-10 text-center text-[var(--color-muted)]">
            <p className="text-[13px] font-medium text-[var(--color-fg)]">No files in the queue</p>
            <p className="text-[12px]">{onAddFiles ? "Add files above to start uploading." : "Uploads will appear here."}</p>
          </div>
        ) : (
          <ul role="list" className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {items.map((item, index) => (
                <UploadRow
                  key={item.id}
                  item={item}
                  index={index}
                  count={items.length}
                  reduce={reduce}
                  fmt={formatBytes}
                  onPause={onPause}
                  onResume={onResume}
                  onRetry={onRetry}
                  onCancel={onCancel}
                  onRemove={onRemove}
                  onReorder={onReorder}
                  onCopyError={onCopyError}
                  requestRemove={requestRemove}
                  registerRemoveRef={registerRemoveRef}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* polite live region — status transitions only, never per-percent */}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </p>
    </section>
  );
}

export default FileUploadPipeline;
