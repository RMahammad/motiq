"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useVisibilityPause,
  useAutoFollow,
  useDisclosure,
  useAnchoredPortal,
  useCopy,
  statusVars,
  formatNumber,
  formatTimestamp as defaultFormatTimestamp,
  type StatusTone,
} from "@/lib/motiq";

/**
 * WebhookEventStream — a presentation-only console for a stream of outbound
 * webhook deliveries that your application already has in hand (payment events,
 * deploy hooks, CRM sync, CI notifications, integration fan-out).
 *
 * It is *presentation only*: the host application owns the `events` array and
 * streams new deliveries in by appending to it. The component never opens a
 * socket, never re-sends anything, and never fabricates a status. Retry/Replay
 * are callbacks the host wires to its own delivery logic.
 *
 * Two things make it worth shipping in an integrations/observability UI:
 *  1. Auto-follow that never fights the reader (shared `useAutoFollow`): while
 *     pinned to the bottom, new deliveries scroll into view; scroll up (or pause)
 *     and following stops, arrivals are counted, and a "N new — jump to latest"
 *     control resumes on the reader's terms. User scrolling is never disabled.
 *  2. Secrets are a first-class concern: well-known credential headers and
 *     payload fields (signing secrets, tokens, cookies) are redacted by default
 *     and can never be un-hidden from inside the component. The redacted value is
 *     never present in the DOM, in copied text, or in search results.
 *
 * Accessibility: delivery status is conveyed with an icon **and** a text label
 * (never colour alone); the console is a `role="log"` region so arrivals are
 * announced politely; each event is a real disclosure (aria-expanded) revealing
 * its payload; long endpoints/payloads scroll rather than truncate silently; and
 * under `prefers-reduced-motion` events appear in their final state. Clean-room
 * original.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

/** Delivery outcome of a single webhook attempt, owned by the application. */
export type WebhookDeliveryStatus = "delivered" | "failed" | "pending" | "retrying";

/** Lifecycle of the stream itself, owned by the application. */
export type WebhookStreamStatus = "streaming" | "paused" | "idle" | "error";

export interface WebhookEvent {
  /** Stable identifier, unique within the stream. */
  id: string | number;
  /** Dotted event type, e.g. "payment.succeeded". Drives the type filter. */
  event: string;
  /** Delivery outcome — drives the icon, label, and tone (never colour alone). */
  status: WebhookDeliveryStatus;
  /** Destination endpoint URL (display only — never called by the component). */
  endpoint: string;
  /** HTTP response status code from the delivery attempt, when one exists. */
  statusCode?: number;
  /** When the event was emitted / last attempted. */
  timestamp?: Date | number | string;
  /** How many times delivery has been retried (0 = first attempt). */
  retryCount?: number;
  /** Response latency of the last attempt, in milliseconds. */
  durationMs?: number;
  /** Headers sent with the delivery — secret headers are redacted for display. */
  headers?: Record<string, string>;
  /** The event payload — a JSON-serialisable value; secret keys are redacted. */
  payload?: unknown;
  /** Human-readable failure reason for failed deliveries. */
  error?: string;
}

/** Where a value lives — passed to a redaction predicate. */
export type WebhookRedactSection = "headers" | "payload";

export interface WebhookRedactContext {
  key: string;
  value: unknown;
  section: WebhookRedactSection;
  /** Dotted path within the payload (e.g. "data.token"); the bare key for headers. */
  path: string;
}

/**
 * Redaction rule:
 * - `true` / omitted → redact the built-in credential key list.
 * - `false` → disable redaction (the app takes responsibility for its data).
 * - `string[]` → the built-in list PLUS these additional keys (case-insensitive).
 * - function → full control; returning `true` redacts that value.
 */
export type WebhookRedactRule =
  | boolean
  | string[]
  | ((ctx: WebhookRedactContext) => boolean);

export interface WebhookEventStreamProps {
  /** The delivery events, controlled by the host application (append to stream). */
  events: WebhookEvent[];
  /** Lifecycle state. `"streaming"` shows a live pulse; `"error"` shows a banner. */
  status?: WebhookStreamStatus;
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
  /** Cap on retained rows; older deliveries are dropped from the top. */
  maxEvents?: number;
  /** Which delivery statuses are selectable in the filter. Defaults to all. */
  statuses?: WebhookDeliveryStatus[];
  /** Search text. Controlled when provided. */
  query?: string;
  /** Notified when the search text changes. */
  onQueryChange?: (query: string) => void;
  /** Controls header/payload redaction. See {@link WebhookRedactRule}. */
  redact?: WebhookRedactRule;
  /** Wired to the host's retry logic; enables Retry on a failed delivery. */
  onRetry?: (event: WebhookEvent) => void;
  /** Wired to the host's replay logic; re-sends the delivery. */
  onReplay?: (event: WebhookEvent) => void;
  /** Notified when an event row is expanded or collapsed. */
  onInspect?: (event: WebhookEvent, expanded: boolean) => void;
  /** Wired to the host's reconnect logic; shown in the error banner. */
  onReconnect?: () => void;
  /** Override timestamp rendering. */
  formatTimestamp?: (value: Date | number | string) => string;
  /** Header title. */
  title?: string;
  /** Accessible name for the log region. */
  label?: string;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Status vocabulary — icon + label + tone (never colour alone).               */
/* -------------------------------------------------------------------------- */

interface StatusMeta {
  label: string;
  tone: StatusTone;
}

const STATUS_META: Record<WebhookDeliveryStatus, StatusMeta> = {
  delivered: { label: "Delivered", tone: "success" },
  failed: { label: "Failed", tone: "error" },
  pending: { label: "Pending", tone: "neutral" },
  retrying: { label: "Retrying", tone: "active" },
};

const ALL_STATUSES: WebhookDeliveryStatus[] = ["delivered", "failed", "pending", "retrying"];

/* -------------------------------------------------------------------------- */
/* Redaction — a one-way display transform; secrets never reach the DOM.       */
/* -------------------------------------------------------------------------- */

const DEFAULT_SENSITIVE = new Set(
  [
    "authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "api-key",
    "apikey",
    "x-webhook-secret",
    "webhook-secret",
    "x-hub-signature",
    "x-hub-signature-256",
    "x-signature",
    "signature",
    "x-webhook-signature",
    "secret",
    "signing_secret",
    "signing-secret",
    "password",
    "token",
    "access_token",
    "refresh_token",
    "client_secret",
    "private_key",
    "session",
    "sessionid",
  ].map((s) => s.toLowerCase()),
);

const REDACTED_TOKEN = "••••••";

function makeShouldRedact(
  rule: WebhookRedactRule | undefined,
): (ctx: WebhookRedactContext) => boolean {
  if (rule === false) return () => false;
  if (typeof rule === "function") {
    return (ctx) => DEFAULT_SENSITIVE.has(ctx.key.toLowerCase()) || rule(ctx);
  }
  const extra = Array.isArray(rule) ? new Set(rule.map((k) => k.toLowerCase())) : null;
  return (ctx) => {
    const k = ctx.key.toLowerCase();
    return DEFAULT_SENSITIVE.has(k) || (extra?.has(k) ?? false);
  };
}

function redactDeep(
  value: unknown,
  section: WebhookRedactSection,
  shouldRedact: (ctx: WebhookRedactContext) => boolean,
  path: string,
): unknown {
  if (Array.isArray(value)) {
    return value.map((v, i) => redactDeep(v, section, shouldRedact, `${path}[${i}]`));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const nextPath = path ? `${path}.${k}` : k;
      out[k] = shouldRedact({ key: k, value: v, section, path: nextPath })
        ? REDACTED_TOKEN
        : redactDeep(v, section, shouldRedact, nextPath);
    }
    return out;
  }
  return value;
}

/** Serialise a payload to a display string, applying redaction. */
function payloadToText(
  payload: unknown,
  shouldRedact: (ctx: WebhookRedactContext) => boolean,
): string {
  if (payload == null) return "";
  let structured: unknown = payload;
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        structured = JSON.parse(payload);
      } catch {
        return payload;
      }
    } else {
      return payload;
    }
  }
  if (typeof structured !== "object" || structured === null) {
    return typeof payload === "string" ? payload : String(payload);
  }
  return JSON.stringify(redactDeep(structured, "payload", shouldRedact, ""), null, 2);
}

/** Serialise one event to plain text for copy (secrets masked). */
function eventToText(
  e: WebhookEvent,
  fmt: (v: Date | number | string) => string,
  shouldRedact: (ctx: WebhookRedactContext) => boolean,
): string {
  const lines: string[] = [];
  const ts = e.timestamp != null ? `[${fmt(e.timestamp)}] ` : "";
  const code = e.statusCode != null ? ` ${e.statusCode}` : "";
  lines.push(`${ts}${STATUS_META[e.status].label.toUpperCase()}${code}  ${e.event}  →  ${e.endpoint}`);
  if ((e.retryCount ?? 0) > 0) lines.push(`  retries: ${e.retryCount}`);
  if (e.error) lines.push(`  error: ${e.error}`);
  if (e.headers && Object.keys(e.headers).length) {
    lines.push("  headers:");
    for (const [k, v] of Object.entries(e.headers)) {
      const redacted = shouldRedact({ key: k, value: v, section: "headers", path: k });
      lines.push(`    ${k}: ${redacted ? REDACTED_TOKEN : v}`);
    }
  }
  const body = payloadToText(e.payload, shouldRedact);
  if (body) lines.push("  payload:", body);
  return lines.join("\n");
}

function eventsToText(
  list: WebhookEvent[],
  fmt: (v: Date | number | string) => string,
  shouldRedact: (ctx: WebhookRedactContext) => boolean,
): string {
  return list.map((e) => eventToText(e, fmt, shouldRedact)).join("\n\n");
}

function formatDuration(ms: number): string {
  if (ms < 1) return "0 ms";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/** Semantic tone for an HTTP status code (drives tint only; the number is text). */
function statusCodeTone(code: number): StatusTone {
  if (code >= 200 && code < 300) return "success";
  if (code >= 300 && code < 400) return "info";
  if (code >= 400 && code < 500) return "warning";
  if (code >= 500) return "error";
  return "neutral";
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                       */
/* -------------------------------------------------------------------------- */

const glyph = {
  width: 14,
  height: 14,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

function StatusIcon({ status }: { status: WebhookDeliveryStatus }) {
  switch (status) {
    case "delivered":
      return (
        <svg {...glyph} width={13} height={13}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.5 11 15l4.5-5" />
        </svg>
      );
    case "failed":
      return (
        <svg {...glyph} width={13} height={13}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      );
    case "retrying":
      return (
        <svg {...glyph} width={13} height={13}>
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      );
    case "pending":
    default:
      return (
        <svg {...glyph} width={13} height={13}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
  }
}

const Chevron = () => (
  <svg {...glyph} width={15} height={15}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
const SearchGlyph = () => (
  <svg {...glyph}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const PauseGlyph = () => (
  <svg {...glyph}>
    <path d="M8 5v14M16 5v14" />
  </svg>
);
const PlayGlyph = () => (
  <svg {...glyph}>
    <path d="M6 4l14 8-14 8z" />
  </svg>
);
const CopyGlyph = () => (
  <svg {...glyph}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h8" />
  </svg>
);
const CheckGlyph = () => (
  <svg {...glyph}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const ArrowDownGlyph = () => (
  <svg {...glyph}>
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </svg>
);
const RetryGlyph = () => (
  <svg {...glyph} width={13} height={13}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
const ReplayGlyph = () => (
  <svg {...glyph} width={13} height={13}>
    <path d="M4 4v6h6" />
    <path d="M20 20v-6h-6" />
    <path d="M20 10a8 8 0 0 0-14.9-3M4 14a8 8 0 0 0 14.9 3" />
  </svg>
);
const LockGlyph = () => (
  <svg {...glyph} width={12} height={12} strokeWidth={2.2}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
const AlertGlyph = () => (
  <svg {...glyph} width={13} height={13}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

/* -------------------------------------------------------------------------- */
/* Search highlight                                                            */
/* -------------------------------------------------------------------------- */

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, needle }: { text: string; needle: string }): React.ReactElement {
  if (!needle) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(needle)})`, "gi"));
  const lower = needle.toLowerCase();
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === lower ? (
          <mark
            key={i}
            className="rounded-[2px] bg-[color-mix(in_oklab,var(--color-warning)_38%,transparent)] text-[var(--color-fg)]"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared class helpers                                                        */
/* -------------------------------------------------------------------------- */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-surface)]";

const btn = cn(
  "inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]",
  "px-2 py-1 text-[12px] font-medium text-[var(--color-fg)] transition-colors",
  "hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[var(--color-border)] disabled:hover:text-[var(--color-fg)]",
  focusRing,
);

/* -------------------------------------------------------------------------- */
/* Custom event-type filter — a real library listbox popover (not a native
   <select>): keyboard-navigable, dismiss-on-outside-click, animated, themed,
   and portaled so the log's scroll container can't crop it.                   */
/* -------------------------------------------------------------------------- */

const EVENT_FILTER_EASE = [0.2, 0, 0, 1] as const;

const EventTypeSelect = React.memo(function EventTypeSelect({
  value,
  eventTypes,
  onChange,
}: {
  value: string;
  eventTypes: string[];
  onChange: (v: string) => void;
}) {
  const reduce = useReducedMotion();
  const menu = useDisclosure({ idPrefix: "mk-evt", dismissable: true });
  const anchor = useAnchoredPortal(menu.open, { align: "start" });
  const options = React.useMemo(
    () => [{ value: "__all__", label: "All event types" }, ...eventTypes.map((t) => ({ value: t, label: t }))],
    [eventTypes],
  );
  const currentIdx = Math.max(0, options.findIndex((o) => o.value === value));
  const [activeIdx, setActiveIdx] = React.useState(currentIdx);

  React.useEffect(() => {
    if (menu.open) setActiveIdx(currentIdx);
  }, [menu.open, currentIdx]);

  const commit = (idx: number) => {
    onChange(options[idx].value);
    menu.setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!menu.open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        menu.setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((a) => Math.min(options.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((a) => Math.max(0, a - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setActiveIdx(0); }
    else if (e.key === "End") { e.preventDefault(); setActiveIdx(options.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); commit(activeIdx); }
  };

  return (
    <div ref={menu.rootRef as React.RefObject<HTMLDivElement>} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        {...menu.triggerProps}
        ref={anchor.triggerRef as React.RefObject<HTMLButtonElement>}
        aria-haspopup="listbox"
        aria-label="Filter by event type"
        aria-activedescendant={menu.open ? `mk-evt-opt-${activeIdx}` : undefined}
        className={cn(
          "inline-flex min-h-[28px] items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-[12px] text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)]",
          focusRing,
        )}
      >
        <span className="max-w-[160px] truncate">{options[currentIdx].label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {anchor.renderInPortal(
        <AnimatePresence>
          {menu.open && anchor.anchored ? (
            <motion.div
              {...menu.panelProps}
              ref={anchor.panelRef as React.RefObject<HTMLDivElement>}
              role="listbox"
              aria-label="Filter by event type"
              aria-activedescendant={`mk-evt-opt-${activeIdx}`}
              initial={reduce ? false : { opacity: 0, y: -4, scale: 0.98 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.14, ease: EVENT_FILTER_EASE }}
              style={{ ...anchor.panelStyle, maxHeight: 260 }}
              className="z-[70] min-w-[180px] overflow-auto rounded-lg bg-[var(--color-surface)] p-1 shadow-[var(--shadow-md)] [border:1px_solid_var(--color-border)]"
            >
              {options.map((opt, i) => {
                const selected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    id={`mk-evt-opt-${i}`}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => commit(i)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left text-[12px] text-[var(--color-fg)] outline-none",
                      i === activeIdx ? "bg-[var(--color-bg-secondary)]" : "hover:bg-[var(--color-bg-secondary)]",
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {selected ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-[var(--color-accent)]"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
});

/* -------------------------------------------------------------------------- */
/* Header / payload key-value rows                                             */
/* -------------------------------------------------------------------------- */

function KeyValueRows({
  entries,
  shouldRedact,
  needle,
}: {
  entries: Array<[string, string]>;
  shouldRedact: (ctx: WebhookRedactContext) => boolean;
  needle: string;
}) {
  return (
    <dl className="m-0 grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-4 gap-y-1.5 font-mono text-[12px]">
      {entries.map(([k, v]) => {
        const redacted = shouldRedact({ key: k, value: v, section: "headers", path: k });
        return (
          <React.Fragment key={k}>
            <dt className="min-w-0 select-text break-words font-medium text-[var(--color-muted)]">
              <Highlight text={k} needle={needle} />
            </dt>
            <dd className="m-0 min-w-0">
              {redacted ? (
                <span
                  className="inline-flex items-center gap-1 rounded border px-1.5 py-px text-[11px] font-semibold uppercase leading-none"
                  style={{
                    color: statusVars("warning").color,
                    borderColor: statusVars("warning").border,
                    background: statusVars("warning").bg,
                  }}
                  title="Value hidden by redaction"
                >
                  <LockGlyph />
                  <span className="sr-only">Value redacted: </span>
                  <span aria-hidden>Redacted</span>
                </span>
              ) : (
                <span className="block select-text overflow-x-auto whitespace-pre text-[var(--color-fg)]">
                  <Highlight text={v} needle={needle} />
                </span>
              )}
            </dd>
          </React.Fragment>
        );
      })}
    </dl>
  );
}

/* -------------------------------------------------------------------------- */
/* Event row                                                                   */
/* -------------------------------------------------------------------------- */

interface RowProps {
  event: WebhookEvent;
  fmt: (v: Date | number | string) => string;
  animate: boolean;
  needle: string;
  shouldRedact: (ctx: WebhookRedactContext) => boolean;
  onRetry?: (event: WebhookEvent) => void;
  onReplay?: (event: WebhookEvent) => void;
  onInspect?: (event: WebhookEvent, expanded: boolean) => void;
}

const WebhookRow = React.memo(function WebhookRow({
  event,
  fmt,
  animate,
  needle,
  shouldRedact,
  onRetry,
  onReplay,
  onInspect,
}: RowProps) {
  const reduce = useReducedMotion();
  const meta = STATUS_META[event.status];
  const vars = statusVars(meta.tone);
  const { open, triggerProps, panelProps } = useDisclosure({
    idPrefix: "webhook-evt",
    onOpenChange: (next) => onInspect?.(event, next),
  });

  const headerEntries = event.headers ? Object.entries(event.headers) : [];
  const payloadText = React.useMemo(
    () => payloadToText(event.payload, shouldRedact),
    [event.payload, shouldRedact],
  );

  const codeVars = event.statusCode != null ? statusVars(statusCodeTone(event.statusCode)) : null;
  const retries = event.retryCount ?? 0;
  const canRetry = onRetry && (event.status === "failed" || event.status === "retrying");

  const body = (
    <div className="flex flex-col">
      {/* Summary row: disclosure trigger + row actions (siblings, never nested) */}
      <div className="flex items-stretch gap-1 px-1">
        <button
          type="button"
          {...triggerProps}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors",
            "hover:bg-[var(--color-bg-secondary)]",
            focusRing,
          )}
        >
          <motion.span
            className="shrink-0 text-[var(--color-muted)]"
            animate={reduce ? undefined : { rotate: open ? 90 : 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            style={{ display: "inline-flex" }}
          >
            <Chevron />
          </motion.span>

          {/* Status chip: icon + text label, tinted via tokens — never colour alone. */}
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-px text-[11px] font-semibold uppercase leading-none"
            style={{ color: vars.color, borderColor: vars.border, background: vars.bg }}
          >
            <StatusIcon status={event.status} />
            <span aria-hidden>{meta.label}</span>
          </span>
          <span className="sr-only">{meta.label}: </span>

          {/* Event type — the primary label. */}
          <span className="min-w-0 shrink truncate font-mono text-[12.5px] font-medium text-[var(--color-fg)]">
            <Highlight text={event.event} needle={needle} />
          </span>

          {/* HTTP status code — the number itself conveys, tint is decorative. */}
          {event.statusCode != null ? (
            <span
              className="shrink-0 font-mono text-[12px] font-semibold tabular-nums"
              style={{ color: codeVars!.color }}
            >
              {event.statusCode}
            </span>
          ) : null}

          {/* Endpoint — scrolls rather than wraps. */}
          <span className="ml-1 hidden min-w-0 flex-1 overflow-hidden md:block">
            <span className="block truncate font-mono text-[11.5px] text-[var(--color-muted)]">
              <Highlight text={event.endpoint} needle={needle} />
            </span>
          </span>

          {retries > 0 ? (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--color-border)] px-1.5 py-px text-[10.5px] font-medium text-[var(--color-muted)]"
              title={`${retries} ${retries === 1 ? "retry" : "retries"}`}
            >
              <RetryGlyph />
              {retries}
            </span>
          ) : null}

          {event.timestamp != null ? (
            <time
              className="hidden shrink-0 select-none tabular-nums text-[11px] text-[var(--color-muted)] sm:inline"
              dateTime={event.timestamp instanceof Date ? event.timestamp.toISOString() : undefined}
            >
              {fmt(event.timestamp)}
            </time>
          ) : null}
        </button>

        {/* Row actions — outside the trigger so they stay independently operable. */}
        <div className="flex shrink-0 items-center gap-1 self-center pr-1">
          {canRetry ? (
            <button type="button" className={btn} onClick={() => onRetry!(event)}>
              <RetryGlyph />
              <span className="hidden sm:inline">Retry</span>
            </button>
          ) : null}
          {onReplay ? (
            <button
              type="button"
              className={btn}
              onClick={() => onReplay(event)}
              title={`Replay ${event.event}`}
            >
              <ReplayGlyph />
              <span className="hidden lg:inline">Replay</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Expandable payload inspection */}
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="panel"
            {...panelProps}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="flex flex-col gap-3 px-4 pb-3.5 pt-1">
              {/* Meta line: endpoint (mobile), duration, attempt count. */}
              <dl className="m-0 grid grid-cols-[minmax(5rem,auto)_1fr] gap-x-4 gap-y-1 text-[12px]">
                <dt className="font-medium text-[var(--color-muted)]">Endpoint</dt>
                <dd className="m-0 min-w-0 overflow-x-auto">
                  <code className="select-text whitespace-nowrap font-mono text-[12px] text-[var(--color-fg)]">
                    {event.endpoint}
                  </code>
                </dd>
                {event.durationMs != null ? (
                  <>
                    <dt className="font-medium text-[var(--color-muted)]">Latency</dt>
                    <dd className="m-0 select-text font-mono tabular-nums text-[var(--color-fg)]">
                      {formatDuration(event.durationMs)}
                    </dd>
                  </>
                ) : null}
                <dt className="font-medium text-[var(--color-muted)]">Attempts</dt>
                <dd className="m-0 select-text font-mono tabular-nums text-[var(--color-fg)]">
                  {retries + 1}
                </dd>
              </dl>

              {event.error ? (
                <div
                  className="flex items-start gap-2 rounded-lg border px-2.5 py-2 text-[12px]"
                  style={{
                    color: statusVars("error").color,
                    borderColor: statusVars("error").border,
                    background: statusVars("error").bg,
                  }}
                  role="alert"
                >
                  <span className="mt-px shrink-0">
                    <AlertGlyph />
                  </span>
                  <span className="select-text text-[var(--color-fg)]">
                    <Highlight text={event.error} needle={needle} />
                  </span>
                </div>
              ) : null}

              {headerEntries.length ? (
                <div className="flex flex-col gap-1.5">
                  <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    Headers
                  </p>
                  <KeyValueRows
                    entries={headerEntries as Array<[string, string]>}
                    shouldRedact={shouldRedact}
                    needle={needle}
                  />
                </div>
              ) : null}

              {payloadText ? (
                <div className="flex flex-col gap-1.5">
                  <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    Payload
                  </p>
                  <pre className="m-0 max-h-[18rem] overflow-auto rounded-lg bg-[var(--color-bg)] p-3 font-mono text-[12px] leading-relaxed text-[var(--color-fg)]">
                    <code className="select-text">
                      <Highlight text={payloadText} needle={needle} />
                    </code>
                  </pre>
                </div>
              ) : (
                <p className="m-0 text-[12px] text-[var(--color-muted)]">No payload for this event.</p>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );

  const rowClass = "border-b border-[var(--color-border)] last:border-b-0";

  if (!animate) {
    return <li className={rowClass}>{body}</li>;
  }
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
      className={cn(rowClass, "[will-change:transform,opacity]")}
    >
      {body}
    </motion.li>
  );
});

/* -------------------------------------------------------------------------- */
/* Main component                                                              */
/* -------------------------------------------------------------------------- */

export function WebhookEventStream({
  events,
  status = "streaming",
  errorMessage,
  follow,
  onFollowChange,
  paused,
  onPausedChange,
  maxEvents = 300,
  statuses = ALL_STATUSES,
  query,
  onQueryChange,
  redact,
  onRetry,
  onReplay,
  onInspect,
  onReconnect,
  formatTimestamp = defaultFormatTimestamp,
  title = "Webhook deliveries",
  label = "Webhook event stream",
  className,
}: WebhookEventStreamProps) {
  const reduce = useReducedMotion();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const visibleOnScreen = useVisibilityPause(rootRef, { threshold: 0.05 });
  const shouldRedact = React.useMemo(() => makeShouldRedact(redact), [redact]);

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

  /* status filter (uncontrolled) --------------------------------------- */
  const [activeStatuses, setActiveStatuses] = React.useState<Set<WebhookDeliveryStatus>>(
    () => new Set(statuses),
  );
  const toggleStatus = React.useCallback((s: WebhookDeliveryStatus) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }, []);

  /* event-type filter (uncontrolled) ----------------------------------- */
  const [eventType, setEventType] = React.useState<string>("__all__");

  /* auto-follow — the shared viewport hook ----------------------------- */
  const { following, newCount, onScroll, scrollToLatest, notifyNew, setFollowing } = useAutoFollow(
    scrollRef,
    { enabled: !isPaused },
  );

  React.useEffect(() => {
    if (follow !== undefined) setFollowing(follow);
  }, [follow, setFollowing]);

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
    () => (events.length > maxEvents ? events.slice(events.length - maxEvents) : events),
    [events, maxEvents],
  );

  /* detect real appends (tail changed) and notify the follow hook ------ */
  const lastId = capped.length ? capped[capped.length - 1].id : null;
  const appendRef = React.useRef<{ lastId: WebhookEvent["id"] | null; len: number }>({
    lastId,
    len: capped.length,
  });
  React.useEffect(() => {
    const prev = appendRef.current;
    if (prev.lastId !== lastId) {
      const grew = capped.length - prev.len;
      notifyNew(grew > 0 ? grew : 1);
    }
    appendRef.current = { lastId, len: capped.length };
  }, [lastId, capped.length, notifyNew]);

  React.useEffect(() => {
    scrollToLatest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* distinct event types for the filter -------------------------------- */
  // Stabilize the array *by content*: the stream re-renders on every tick, but
  // the set of distinct types rarely changes. Returning the previous reference
  // when unchanged lets the memoized filter dropdown skip re-renders (so an open
  // listbox's animation isn't interrupted mid-frame while events keep arriving).
  const eventTypesRef = React.useRef<string[]>([]);
  const eventTypes = React.useMemo(() => {
    const set = new Set<string>();
    for (const e of capped) set.add(e.event);
    const next = Array.from(set).sort();
    const prev = eventTypesRef.current;
    if (prev.length === next.length && prev.every((v, i) => v === next[i])) return prev;
    eventTypesRef.current = next;
    return next;
  }, [capped]);

  // If the currently-filtered event type disappears, fall back to "all".
  React.useEffect(() => {
    if (eventType !== "__all__" && !eventTypes.includes(eventType)) setEventType("__all__");
  }, [eventType, eventTypes]);

  /* filtering (status + type + search) --------------------------------- */
  const needle = q.trim();
  const needleLc = needle.toLowerCase();
  const visible = React.useMemo(
    () =>
      capped.filter((e) => {
        if (!activeStatuses.has(e.status)) return false;
        if (eventType !== "__all__" && e.event !== eventType) return false;
        if (!needleLc) return true;
        // Payload/headers are matched via their *redacted* text — a secret value
        // can never surface a row through search.
        const haystack = [
          e.event,
          e.endpoint,
          e.status,
          e.statusCode != null ? String(e.statusCode) : "",
          e.error ?? "",
          payloadToText(e.payload, shouldRedact),
          e.headers
            ? Object.entries(e.headers)
                .map(([k, v]) =>
                  shouldRedact({ key: k, value: v, section: "headers", path: k }) ? k : `${k} ${v}`,
                )
                .join(" ")
            : "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(needleLc);
      }),
    [capped, activeStatuses, eventType, needleLc, shouldRedact],
  );

  /* resume: jump to latest + clear pause ------------------------------- */
  const jumpToLatest = React.useCallback(() => {
    scrollToLatest();
    setPaused(false);
  }, [scrollToLatest, setPaused]);

  /* copy --------------------------------------------------------------- */
  const { copied, copy } = useCopy();
  const handleCopy = React.useCallback(() => {
    void copy(eventsToText(visible, formatTimestamp, shouldRedact));
  }, [copy, visible, formatTimestamp, shouldRedact]);

  /* derived display state ---------------------------------------------- */
  const isEmpty = capped.length === 0;
  const isError = status === "error";
  const isStreaming = status === "streaming" && !isPaused;
  const live = isStreaming && visibleOnScreen && !reduce;

  const statusText = isError
    ? "Error"
    : isPaused
      ? "Paused"
      : status === "streaming"
        ? "Streaming"
        : "Idle";
  const statusTone: StatusTone = isError
    ? "error"
    : isPaused
      ? "neutral"
      : status === "streaming"
        ? "active"
        : "neutral";
  const statusVar = statusVars(statusTone);

  /* per-status counts (delivered/failed/…) for the header summary ------ */
  const counts = React.useMemo(() => {
    const c: Record<WebhookDeliveryStatus, number> = {
      delivered: 0,
      failed: 0,
      pending: 0,
      retrying: 0,
    };
    for (const e of capped) c[e.status] += 1;
    return c;
  }, [capped]);

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
          <span className="relative grid h-2.5 w-2.5 place-items-center" aria-hidden>
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
          {visible.length !== capped.length ? ` / ${formatNumber(capped.length)}` : ""}
          {" events"}
          {counts.failed > 0 ? ` · ${formatNumber(counts.failed)} failed` : ""}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" className={btn} onClick={() => setPaused(!isPaused)} aria-pressed={isPaused}>
            {isPaused ? <PlayGlyph /> : <PauseGlyph />}
            <span className="hidden sm:inline">{isPaused ? "Resume" : "Pause"}</span>
          </button>
          <button type="button" className={btn} onClick={handleCopy} disabled={visible.length === 0}>
            {copied ? <CheckGlyph /> : <CopyGlyph />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
            {copied ? (
              <span className="sr-only" role="status">
                Copied {visible.length} events to clipboard
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Search + filters ------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-3 py-2">
        <label className="relative flex min-w-[9rem] flex-1 items-center">
          <span className="pointer-events-none absolute left-2 text-[var(--color-muted)]">
            <SearchGlyph />
          </span>
          <span className="sr-only">Search webhook events</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events…"
            className={cn(
              "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] py-1 pl-8 pr-2",
              "text-[12.5px] text-[var(--color-fg)] placeholder:text-[var(--color-muted)]",
              focusRing,
            )}
          />
        </label>

        <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--color-muted)]">
          <span className="sr-only">Filter by event type</span>
          <EventTypeSelect value={eventType} eventTypes={eventTypes} onChange={setEventType} />
        </div>

        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filter by delivery status">
          {statuses.map((s) => {
            const meta = STATUS_META[s];
            const on = activeStatuses.has(s);
            const vars = statusVars(meta.tone);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => toggleStatus(s)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[11px] font-medium leading-none transition-colors",
                  focusRing,
                  on
                    ? "text-[var(--color-fg)]"
                    : "border-[var(--color-border)] bg-transparent text-[var(--color-muted)] hover:text-[var(--color-fg)]",
                )}
                style={on ? { color: vars.color, borderColor: vars.border, background: vars.bg } : undefined}
              >
                <StatusIcon status={s} />
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
          className="relative max-h-[var(--webhook-height,24rem)] min-h-[9rem] overflow-auto overscroll-contain bg-[var(--color-bg)]"
          tabIndex={0}
          role="log"
          aria-label={label}
          aria-busy={isStreaming}
        >
          {isEmpty ? (
            <div className="flex h-full min-h-[9rem] flex-col items-center justify-center gap-1 px-6 text-center">
              <p className="text-[12.5px] font-medium text-[var(--color-fg)]">
                {isError ? "The delivery stream ended before any events arrived." : "No webhook deliveries yet."}
              </p>
              <p className="text-[11.5px] text-[var(--color-muted)]">
                Events will appear here as your application dispatches them.
              </p>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex h-full min-h-[9rem] flex-col items-center justify-center gap-1 px-6 text-center">
              <p className="text-[12.5px] text-[var(--color-muted)]">No events match the current filters.</p>
              <button
                type="button"
                className={cn(
                  "text-[12px] font-medium text-[var(--color-accent)] underline-offset-2 hover:underline",
                  focusRing,
                )}
                onClick={() => {
                  setQuery("");
                  setEventType("__all__");
                  setActiveStatuses(new Set(statuses));
                }}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <ol className="m-0 list-none p-0">
              <AnimatePresence initial={false}>
                {visible.map((event) => (
                  <WebhookRow
                    key={event.id}
                    event={event}
                    fmt={formatTimestamp}
                    animate={live}
                    needle={needle}
                    shouldRedact={shouldRedact}
                    onRetry={onRetry}
                    onReplay={onReplay}
                    onInspect={onInspect}
                  />
                ))}
              </AnimatePresence>
            </ol>
          )}
        </div>

        {/* New-events indicator — appears only when not following. */}
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
                {formatNumber(newCount)} new {newCount === 1 ? "event" : "events"} - jump to latest
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
          role="alert"
        >
          <AlertGlyph />
          <span className="text-[var(--color-fg)]">
            {errorMessage ?? "The webhook delivery stream disconnected."}
          </span>
          {onReconnect ? (
            <button type="button" onClick={onReconnect} className={cn(btn, "ml-auto")}>
              <RetryGlyph />
              Reconnect
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Rate-limited lifecycle announcer — state changes only, never per event. */}
      <p className="sr-only" role="status" aria-live="polite">
        {isError
          ? `Webhook stream error. ${errorMessage ?? ""}`
          : isPaused
            ? "Webhook stream paused."
            : status === "streaming"
              ? "Webhook stream is live."
              : "Webhook stream idle."}
      </p>
    </div>
  );
}

export default WebhookEventStream;
