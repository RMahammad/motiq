"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useVisibilityPause,
  useAutoFollow,
  formatTimestamp as defaultFormatTimestamp,
  streamItemVariants,
  statusVars,
  formatNumber,
  type StatusTone,
} from "@/lib/motionkit";

/**
 * LiveLogStream — a production log viewer for developer surfaces (deploy/build
 * output, background jobs, server events, local dev, queue workers).
 *
 * It is *presentation only*: the host application owns the `entries` array and
 * streams new lines in by appending to it. The component never opens a socket,
 * never fabricates output, and makes no claim about what a system is "doing".
 *
 * The defining UX is auto-follow that never fights the user (shared
 * `useAutoFollow`): while pinned to the bottom, new lines scroll into view;
 * scroll up (or pause) and following stops, new lines are counted, and a
 * "N new lines — jump to latest" control lets the reader resume on their terms.
 * User scrolling is never disabled. Levels are conveyed with an icon **and** a
 * text label/prefix — never colour alone — so they survive forced-colors and
 * assistive tech. Under `prefers-reduced-motion` new lines appear instantly.
 * Clean-room original.
 */

export type LogLevel = "debug" | "info" | "success" | "warning" | "error";

export interface LogEntry {
  /** Stable identifier, unique within the stream. */
  id: string | number;
  /** Severity — drives the icon, label, and prefix (never colour alone). */
  level: LogLevel;
  /** The log line. Long lines scroll horizontally rather than wrapping the row. */
  message: string;
  /** When the line was emitted. Absent lines simply omit the timestamp column. */
  timestamp?: Date | number | string;
  /** Optional origin tag, e.g. a service or worker name. */
  source?: string;
}

/** Lifecycle of the stream, owned by the application. */
export type LogStreamStatus = "streaming" | "idle" | "completed" | "error";

export interface LiveLogStreamProps {
  /** The log lines, controlled by the host application (append to stream). */
  entries: LogEntry[];
  /** Lifecycle state. `"streaming"` shows a live pulse; `"error"` shows a banner. */
  status?: LogStreamStatus;
  /** Message shown in the error banner when `status === "error"`. */
  errorMessage?: string;
  /** Whether the viewport auto-follows the tail. Controlled when provided. */
  follow?: boolean;
  /** Notified when the effective follow state changes. */
  onFollowChange?: (following: boolean) => void;
  /** Whether the reader paused the view. Controlled when provided. */
  paused?: boolean;
  /** Notified when the paused state changes (also fired by Pause/Resume). */
  onPausedChange?: (paused: boolean) => void;
  /** Cap on retained rows; older lines are dropped from the top. */
  maxEntries?: number;
  /** Which levels are selectable in the filter (and rendered). Defaults to all. */
  levels?: LogLevel[];
  /** Search text. Controlled when provided. */
  query?: string;
  /** Notified when the search text changes. */
  onQueryChange?: (query: string) => void;
  /** Override timestamp rendering. */
  formatTimestamp?: (value: Date | number | string) => string;
  /** Fully override how a single line renders. */
  renderEntry?: (entry: LogEntry) => React.ReactNode;
  /** Called when Clear is activated (the app owns clearing `entries`). */
  onClear?: () => void;
  /** Called when Retry is activated in the error state. */
  onRetry?: () => void;
  /** Header title. */
  title?: string;
  /** Accessible name for the log region. */
  label?: string;
  className?: string;
}

/* ------------------------------------------------------------------------- */
/* Level vocabulary — icon + label + short prefix, tinted with status tokens.  */
/* ------------------------------------------------------------------------- */

interface LevelMeta {
  label: string;
  /** Monospace prefix shown in the row and copied output. */
  short: string;
  tone: StatusTone;
}

const LEVEL_META: Record<LogLevel, LevelMeta> = {
  debug: { label: "Debug", short: "DBG", tone: "neutral" },
  info: { label: "Info", short: "INFO", tone: "info" },
  success: { label: "Success", short: "OK", tone: "success" },
  warning: { label: "Warning", short: "WARN", tone: "warning" },
  error: { label: "Error", short: "ERR", tone: "error" },
};

const ALL_LEVELS: LogLevel[] = ["debug", "info", "success", "warning", "error"];

const iconProps = {
  width: 13,
  height: 13,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

function LevelIcon({ level }: { level: LogLevel }) {
  switch (level) {
    case "success":
      return (
        <svg {...iconProps}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "warning":
      return (
        <svg {...iconProps}>
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "error":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      );
    case "info":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      );
    case "debug":
    default:
      return (
        <svg {...iconProps}>
          <path d="M8 6h8M8 6a4 4 0 0 1 8 0M6 13h12M4 10.5v3M20 10.5v3" />
          <path d="M12 10v9M6.5 18.5A4 4 0 0 0 12 20a4 4 0 0 0 5.5-1.5" />
        </svg>
      );
  }
}

/* small toolbar glyphs ---------------------------------------------------- */

function toolbarIcon(path: React.ReactNode) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}>
      {path}
    </svg>
  );
}
const SearchGlyph = () => toolbarIcon(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>);
const PauseGlyph = () => toolbarIcon(<><path d="M8 5v14M16 5v14" /></>);
const PlayGlyph = () => toolbarIcon(<path d="M6 4l14 8-14 8z" />);
const ClearGlyph = () => toolbarIcon(<><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /></>);
const CopyGlyph = () => toolbarIcon(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>);
const CheckGlyph = () => toolbarIcon(<path d="M20 6 9 17l-5-5" />);
const ArrowDownGlyph = () => toolbarIcon(<><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></>);

/* ------------------------------------------------------------------------- */

/** Serialise the visible lines to plain text for Copy. */
function entriesToText(list: LogEntry[], fmt: (v: Date | number | string) => string): string {
  return list
    .map((e) => {
      const ts = e.timestamp != null ? `[${fmt(e.timestamp)}] ` : "";
      const lvl = LEVEL_META[e.level].short.padEnd(4, " ");
      const src = e.source ? ` ${e.source}` : "";
      return `${ts}${lvl}${src}  ${e.message}`;
    })
    .join("\n");
}

interface RowProps {
  entry: LogEntry;
  fmt: (v: Date | number | string) => string;
  animate: boolean;
  renderEntry?: (entry: LogEntry) => React.ReactNode;
}

const LogRow = React.memo(function LogRow({ entry, fmt, animate, renderEntry }: RowProps) {
  const meta = LEVEL_META[entry.level];
  const vars = statusVars(meta.tone);

  const content = renderEntry ? (
    renderEntry(entry)
  ) : (
    <>
      {entry.timestamp != null ? (
        <time className="hidden shrink-0 select-none tabular-nums text-[var(--color-muted)] sm:inline" dateTime={new Date(entry.timestamp).toISOString?.() || undefined}>
          {fmt(entry.timestamp)}
        </time>
      ) : null}

      {/* Level chip: icon + text prefix, tinted via status tokens — never colour alone. */}
      <span
        className="inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-px text-[10.5px] font-semibold uppercase leading-none"
        style={{ color: vars.color, borderColor: vars.border, background: vars.bg }}
      >
        <LevelIcon level={entry.level} />
        <span className="sr-only">{meta.label}: </span>
        <span aria-hidden>{meta.short}</span>
      </span>

      {entry.source ? (
        <span className="shrink-0 select-none text-[var(--color-muted)]">{entry.source}</span>
      ) : null}

      {/* Message: selectable, no wrap so long lines scroll horizontally. */}
      <span className="whitespace-pre text-[var(--color-fg)]">{entry.message}</span>
    </>
  );

  const className = "flex w-max min-w-full items-baseline gap-2.5 px-3 py-[3px] font-mono text-[12.5px] leading-relaxed";

  if (!animate) {
    return <li className={className}>{content}</li>;
  }
  return (
    <motion.li
      layout="position"
      variants={streamItemVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
      className={cn(className, "[will-change:transform,opacity]")}
    >
      {content}
    </motion.li>
  );
});

/* ------------------------------------------------------------------------- */

export function LiveLogStream({
  entries,
  status = "streaming",
  errorMessage,
  follow,
  onFollowChange,
  paused,
  onPausedChange,
  maxEntries = 500,
  levels = ALL_LEVELS,
  query,
  onQueryChange,
  formatTimestamp = defaultFormatTimestamp,
  renderEntry,
  onClear,
  onRetry,
  title = "Logs",
  label = "Live log stream",
  className,
}: LiveLogStreamProps) {
  const reduce = useReducedMotion();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const visibleOnScreen = useVisibilityPause(rootRef, { threshold: 0.05 });

  /* controlled / uncontrolled: paused ---------------------------------- */
  const [pausedUnc, setPausedUnc] = React.useState(paused ?? false);
  const isPaused = paused ?? pausedUnc;
  const setPaused = React.useCallback(
    (v: boolean) => {
      if (paused === undefined) setPausedUnc(v);
      onPausedChange?.(v);
    },
    [paused, onPausedChange],
  );

  /* controlled / uncontrolled: query ----------------------------------- */
  const [queryUnc, setQueryUnc] = React.useState(query ?? "");
  const q = query ?? queryUnc;
  const setQuery = React.useCallback(
    (v: string) => {
      if (query === undefined) setQueryUnc(v);
      onQueryChange?.(v);
    },
    [query, onQueryChange],
  );

  /* level filter (uncontrolled) ---------------------------------------- */
  const [activeLevels, setActiveLevels] = React.useState<Set<LogLevel>>(() => new Set(levels));
  const toggleLevel = React.useCallback((lvl: LogLevel) => {
    setActiveLevels((prev) => {
      const next = new Set(prev);
      if (next.has(lvl)) next.delete(lvl);
      else next.add(lvl);
      return next;
    });
  }, []);

  /* auto-follow — the shared viewport hook ----------------------------- */
  const { following, newCount, onScroll, scrollToLatest, notifyNew, setFollowing } = useAutoFollow(scrollRef, {
    enabled: !isPaused,
  });

  // Controlled follow: mirror the prop into the hook when it changes.
  React.useEffect(() => {
    if (follow !== undefined) setFollowing(follow);
  }, [follow, setFollowing]);

  // Effective follow = pinned AND not paused. Report changes upward.
  const effectiveFollowing = following && !isPaused;
  const reportedFollow = React.useRef(effectiveFollowing);
  React.useEffect(() => {
    if (reportedFollow.current !== effectiveFollowing) {
      reportedFollow.current = effectiveFollowing;
      onFollowChange?.(effectiveFollowing);
    }
  }, [effectiveFollowing, onFollowChange]);

  /* bounded retained history ------------------------------------------- */
  const capped = React.useMemo(
    () => (entries.length > maxEntries ? entries.slice(entries.length - maxEntries) : entries),
    [entries, maxEntries],
  );

  /* detect real appends (tail changed) and notify the follow hook ------ */
  const lastId = capped.length ? capped[capped.length - 1].id : null;
  const appendRef = React.useRef<{ lastId: LogEntry["id"] | null; len: number }>({ lastId, len: capped.length });
  React.useEffect(() => {
    const prev = appendRef.current;
    if (prev.lastId !== lastId) {
      const grew = capped.length - prev.len;
      notifyNew(grew > 0 ? grew : 1);
    }
    appendRef.current = { lastId, len: capped.length };
  }, [lastId, capped.length, notifyNew]);

  // Pin to the bottom on first mount so the newest line is visible.
  React.useEffect(() => {
    scrollToLatest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* filtering (search + level) ----------------------------------------- */
  const needle = q.trim().toLowerCase();
  const visible = React.useMemo(
    () =>
      capped.filter((e) => {
        if (!activeLevels.has(e.level)) return false;
        if (!needle) return true;
        return e.message.toLowerCase().includes(needle) || (e.source?.toLowerCase().includes(needle) ?? false);
      }),
    [capped, activeLevels, needle],
  );

  /* resume: jump to latest + clear pause ------------------------------- */
  const jumpToLatest = React.useCallback(() => {
    scrollToLatest();
    setPaused(false);
  }, [scrollToLatest, setPaused]);

  /* copy --------------------------------------------------------------- */
  const [copied, setCopied] = React.useState(false);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCopy = React.useCallback(() => {
    const text = entriesToText(visible, formatTimestamp);
    const done = () => {
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1500);
    };
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      done();
    }
  }, [visible, formatTimestamp]);
  React.useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  /* derived display state ---------------------------------------------- */
  const isEmpty = capped.length === 0;
  const isError = status === "error";
  const isCompleted = status === "completed";
  const isStreaming = status === "streaming" && !isPaused;
  const live = isStreaming && visibleOnScreen && !reduce;

  const statusText = isError ? "Error" : isCompleted ? "Completed" : isPaused ? "Paused" : status === "streaming" ? "Streaming" : "Idle";
  const statusTone: StatusTone = isError ? "error" : isCompleted ? "success" : isPaused ? "neutral" : status === "streaming" ? "active" : "neutral";
  const statusVar = statusVars(statusTone);

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-surface)]";
  const btn = cn(
    "inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]",
    "px-2 py-1 text-[12px] font-medium text-[var(--color-fg)] transition-colors",
    "hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
    "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[var(--color-border)] disabled:hover:text-[var(--color-fg)]",
    focusRing,
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)]",
        "bg-[var(--color-surface)] shadow-[var(--shadow-md)]",
        className,
      )}
    >
      {/* Header ---------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-fg)]">
          <span
            className="relative grid h-2.5 w-2.5 place-items-center"
            aria-hidden
          >
            <span className="h-2 w-2 rounded-full" style={{ background: statusVar.color }} />
            {live ? (
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ background: statusVar.color }}
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 2.4 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              />
            ) : null}
          </span>
          {title}
        </span>

        <span
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
          style={{ color: statusVar.color, borderColor: statusVar.border, background: statusVar.bg }}
        >
          {statusText}
        </span>

        <span className="text-[11.5px] tabular-nums text-[var(--color-muted)]">
          {formatNumber(visible.length)}
          {visible.length !== capped.length ? ` / ${formatNumber(capped.length)}` : ""} lines
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            className={btn}
            onClick={() => setPaused(!isPaused)}
            aria-pressed={isPaused}
          >
            {isPaused ? <PlayGlyph /> : <PauseGlyph />}
            <span className="hidden sm:inline">{isPaused ? "Resume" : "Pause"}</span>
          </button>
          <button type="button" className={btn} onClick={handleCopy} disabled={visible.length === 0}>
            {copied ? <CheckGlyph /> : <CopyGlyph />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
            {copied ? <span className="sr-only" role="status">Copied {visible.length} lines to clipboard</span> : null}
          </button>
          {onClear ? (
            <button type="button" className={btn} onClick={onClear} disabled={isEmpty}>
              <ClearGlyph />
              <span className="hidden sm:inline">Clear</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Search + level filter ------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-3 py-2">
        <label className="relative flex min-w-[9rem] flex-1 items-center">
          <span className="pointer-events-none absolute left-2 text-[var(--color-muted)]">
            <SearchGlyph />
          </span>
          <span className="sr-only">Search log messages</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search logs…"
            className={cn(
              "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] py-1 pl-8 pr-2",
              "text-[12.5px] text-[var(--color-fg)] placeholder:text-[var(--color-muted)]",
              focusRing,
            )}
          />
        </label>

        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filter by level">
          {levels.map((lvl) => {
            const meta = LEVEL_META[lvl];
            const on = activeLevels.has(lvl);
            const vars = statusVars(meta.tone);
            return (
              <button
                key={lvl}
                type="button"
                aria-pressed={on}
                onClick={() => toggleLevel(lvl)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[11px] font-medium leading-none transition-colors",
                  focusRing,
                  on
                    ? "text-[var(--color-fg)]"
                    : "border-[var(--color-border)] bg-transparent text-[var(--color-muted)] hover:text-[var(--color-fg)]",
                )}
                style={on ? { color: vars.color, borderColor: vars.border, background: vars.bg } : undefined}
              >
                <LevelIcon level={lvl} />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Console --------------------------------------------------------- */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="relative max-h-[var(--log-height,20rem)] min-h-[8rem] overflow-auto overscroll-contain bg-[var(--color-bg)] py-1.5"
          tabIndex={0}
          role="log"
          aria-label={label}
          aria-busy={isStreaming}
        >
          {isEmpty ? (
            <div className="flex h-full min-h-[8rem] flex-col items-center justify-center gap-1 px-6 text-center">
              <p className="font-mono text-[12.5px] text-[var(--color-muted)]">
                {isError ? "Stream ended before any output." : "Waiting for log output…"}
              </p>
              <p className="text-[11.5px] text-[var(--color-muted)]">Lines will appear here as your app emits them.</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex h-full min-h-[8rem] flex-col items-center justify-center gap-1 px-6 text-center">
              <p className="font-mono text-[12.5px] text-[var(--color-muted)]">No lines match the current filter.</p>
              <button
                type="button"
                className={cn("text-[12px] font-medium text-[var(--color-accent)] underline-offset-2 hover:underline", focusRing)}
                onClick={() => {
                  setQuery("");
                  setActiveLevels(new Set(levels));
                }}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <ol className="m-0 list-none p-0">
              <AnimatePresence initial={false}>
                {visible.map((entry) => (
                  <LogRow key={entry.id} entry={entry} fmt={formatTimestamp} animate={live} renderEntry={renderEntry} />
                ))}
              </AnimatePresence>
            </ol>
          )}
        </div>

        {/* New-lines indicator — appears only when not following. */}
        <AnimatePresence>
          {newCount > 0 ? (
            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center"
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
              transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            >
              <button
                type="button"
                onClick={jumpToLatest}
                className={cn(
                  "pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-[var(--color-accent)]",
                  "bg-[var(--color-accent)] px-3 py-1 text-[12px] font-semibold text-[var(--color-accent-fg,white)] shadow-[var(--shadow-md)]",
                  focusRing,
                )}
              >
                <ArrowDownGlyph />
                {formatNumber(newCount)} new {newCount === 1 ? "line" : "lines"} — jump to latest
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Error banner ---------------------------------------------------- */}
      {isError ? (
        <div
          className="flex items-center gap-2 border-t px-3 py-2 text-[12.5px]"
          style={{ color: statusVar.color, borderColor: statusVar.border, background: statusVar.bg }}
        >
          <LevelIcon level="error" />
          <span className="text-[var(--color-fg)]">{errorMessage ?? "The stream ended with an error."}</span>
          {onRetry ? (
            <button type="button" onClick={onRetry} className={cn(btn, "ml-auto")}>
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Rate-limited lifecycle announcer — state changes only, never per line. */}
      <p className="sr-only" role="status" aria-live="polite">
        {isError
          ? `Log stream error. ${errorMessage ?? ""}`
          : isCompleted
            ? "Log stream completed."
            : isPaused
              ? "Log stream paused."
              : status === "streaming"
                ? "Log stream is live."
                : "Log stream idle."}
      </p>
    </div>
  );
}

export default LiveLogStream;
