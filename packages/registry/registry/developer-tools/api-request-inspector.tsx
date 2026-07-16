"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useDisclosure,
  useCopy,
  getStatusMeta,
  statusVars,
  useAnimatedNumber,
  formatTimestamp as defaultFormatTimestamp,
  type StatusTone,
} from "@/lib/motionstack";

/**
 * ApiRequestInspector — a presentation-only inspection surface for a single
 * HTTP request/response that your application already has in hand. It is NOT an
 * API client: it never opens a socket, never re-sends anything, and never
 * fabricates timing. Retry/Cancel are callbacks the host wires to its own logic.
 *
 * What makes it worth shipping in a dev/observability UI: it treats secrets as a
 * first-class concern. Well-known credential headers/fields are redacted by
 * default and can never be un-hidden from inside the component — redaction is a
 * one-way display transform, and the redacted value is never present in the DOM,
 * in search, or in copied text. Around that it offers expandable sections,
 * in-payload search, formatted/raw and wrapped/scrolling views, a timing-phase
 * breakdown, an auth summary, and copy of the url / request / response.
 *
 * Accessibility: status is conveyed with an icon + text label (never colour
 * alone); each section is a real disclosure button (aria-expanded) controlling a
 * labelled region; payload text stays selectable; long lines scroll
 * horizontally; a polite live region announces copy success and state changes;
 * under prefers-reduced-motion everything renders in its final state. Clean-room
 * original.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type HttpMethod =
  | "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS"
  | (string & {});

/** Lifecycle of the inspected exchange, owned by the host application. */
export type InspectorState =
  | "idle"
  | "loading"
  | "success"
  | "client_error"
  | "server_error"
  | "timeout"
  | "cancelled"
  | "retrying";

/** A single timing phase of the request (e.g. DNS, TLS, TTFB, Download). */
export interface TimingPhase {
  label: string;
  durationMs: number;
}

/** Non-sensitive summary of how the request was authorized. */
export interface AuthSummary {
  /** e.g. "Bearer", "Basic", "API Key". */
  scheme?: string;
  /** A non-secret principal identifier, e.g. a service or key name. */
  principal?: string;
  /** Granted scopes / permissions. */
  scopes?: string[];
  /** Free-text note (e.g. "token expires in 42m"). Never a secret. */
  note?: string;
}

export interface ApiRequest {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | null>;
  /** Request body — a string or any JSON-serializable value. */
  body?: unknown;
  requestId?: string;
  /** Deployment environment, e.g. "production" | "staging". */
  environment?: string;
  /** When the request was issued. */
  timestamp?: Date | number | string;
}

export interface ApiResponse {
  /** HTTP status code, e.g. 200, 404, 503. */
  status?: number;
  statusText?: string;
  durationMs?: number;
  headers?: Record<string, string>;
  body?: unknown;
  /** Human-readable error message for failed / timed-out exchanges. */
  error?: string;
  /** How many times the host has retried this request. */
  retryCount?: number;
  /** Optional timing breakdown; bars are drawn proportionally. */
  phases?: TimingPhase[];
}

/** Where a value lives — passed to a redaction predicate. */
export type RedactSection =
  | "requestHeaders"
  | "responseHeaders"
  | "query"
  | "requestBody"
  | "responseBody";

export interface RedactContext {
  key: string;
  value: unknown;
  section: RedactSection;
  /** Dotted path within the body (e.g. "user.token"); the bare key elsewhere. */
  path: string;
}

/**
 * Redaction rule:
 * - `true` / omitted → redact the built-in credential key list.
 * - `false` → disable redaction (the app takes responsibility for its data).
 * - `string[]` → the built-in list PLUS these additional keys (case-insensitive).
 * - function → full control; returning `true` redacts that value.
 */
export type RedactRule = boolean | string[] | ((ctx: RedactContext) => boolean);

export type InspectorView = "formatted" | "raw";

export type SectionId =
  | "request-headers"
  | "query"
  | "request-body"
  | "response-headers"
  | "response-body"
  | "timing"
  | "auth";

export interface ApiRequestInspectorProps {
  /** The request under inspection. The host owns this data. */
  request: ApiRequest;
  /** The response, when one exists (success or error states). */
  response?: ApiResponse;
  /** Lifecycle state — drives the status chip and available actions. */
  state: InspectorState;
  /** Optional non-secret authorization summary. */
  auth?: AuthSummary;
  /** Wired to the host's retry logic; enables the Retry control. */
  onRetry?: () => void;
  /** Wired to the host's cancel logic; enables Cancel while in flight. */
  onCancel?: () => void;
  /** Notified whenever text is copied (url / request / response). */
  onCopy?: (text: string) => void;
  /** Controls value redaction. See {@link RedactRule}. Defaults to the built-in list. */
  redact?: RedactRule;
  /** Which section is open on first render. */
  defaultSection?: SectionId;
  /** Wrap long payload lines instead of scrolling. Controlled when provided. */
  wrap?: boolean;
  onWrapChange?: (wrap: boolean) => void;
  /** Formatted (pretty) vs raw payloads. Controlled when provided. */
  view?: InspectorView;
  onViewChange?: (view: InspectorView) => void;
  /** Override timestamp rendering. */
  formatTimestamp?: (value: Date | number | string) => string;
  /** Fully override how a body renders (receives the already-redacted value). */
  renderBody?: (body: unknown, ctx: { kind: "request" | "response" }) => React.ReactNode;
  /** Header title. */
  title?: string;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Status vocabulary — icon + label + tone, resolved via getStatusMeta.        */
/* -------------------------------------------------------------------------- */

const STATE_OVERRIDES: Record<string, { label: string; tone: StatusTone }> = {
  idle: { label: "Idle", tone: "neutral" },
  loading: { label: "Loading", tone: "active" },
  retrying: { label: "Retrying", tone: "active" },
  success: { label: "Success", tone: "success" },
  client_error: { label: "Client error", tone: "warning" },
  server_error: { label: "Server error", tone: "error" },
  timeout: { label: "Timed out", tone: "error" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

const IN_FLIGHT = new Set<InspectorState>(["loading", "retrying"]);

/* Built-in credential keys that are always redacted unless redaction is off. */
const DEFAULT_SENSITIVE = new Set(
  [
    "authorization",
    "proxy-authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "api-key",
    "apikey",
    "x-auth-token",
    "x-access-token",
    "x-csrf-token",
    "x-secret",
    "secret",
    "password",
    "passwd",
    "token",
    "access_token",
    "refresh_token",
    "id_token",
    "client_secret",
    "private_key",
    "session",
    "sessionid",
    "x-session-token",
  ].map((s) => s.toLowerCase()),
);

const REDACTED_TOKEN = "••••••"; // ••••••

function makeShouldRedact(rule: RedactRule | undefined): (ctx: RedactContext) => boolean {
  if (rule === false) return () => false;
  if (typeof rule === "function") {
    return (ctx) => DEFAULT_SENSITIVE.has(ctx.key.toLowerCase()) || rule(ctx);
  }
  const extra =
    Array.isArray(rule) ? new Set(rule.map((k) => k.toLowerCase())) : null;
  return (ctx) => {
    const k = ctx.key.toLowerCase();
    return DEFAULT_SENSITIVE.has(k) || (extra?.has(k) ?? false);
  };
}

/* -------------------------------------------------------------------------- */
/* Serialization helpers                                                       */
/* -------------------------------------------------------------------------- */

function redactDeep(
  value: unknown,
  section: RedactSection,
  shouldRedact: (ctx: RedactContext) => boolean,
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

/** Serialize a body to a display string, applying redaction and view. */
function bodyToText(
  body: unknown,
  section: RedactSection,
  view: InspectorView,
  shouldRedact: (ctx: RedactContext) => boolean,
): string {
  if (body == null) return "";

  // Resolve to a structured value where possible (so object keys can be redacted).
  let structured: unknown = body;
  let wasRawString = false;
  if (typeof body === "string") {
    const trimmed = body.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        structured = JSON.parse(body);
      } catch {
        wasRawString = true;
      }
    } else {
      wasRawString = true;
    }
  }

  if (wasRawString || typeof structured !== "object" || structured === null) {
    return typeof body === "string" ? body : String(body);
  }

  const redacted = redactDeep(structured, section, shouldRedact, "");
  return view === "raw"
    ? JSON.stringify(redacted)
    : JSON.stringify(redacted, null, 2);
}

/** Serialize the whole request to plain text for copy (secrets masked). */
function requestToText(
  request: ApiRequest,
  view: InspectorView,
  fmt: (v: Date | number | string) => string,
  shouldRedact: (ctx: RedactContext) => boolean,
): string {
  const lines: string[] = [`${request.method} ${request.url}`];
  if (request.environment) lines.push(`Environment: ${request.environment}`);
  if (request.requestId) lines.push(`Request-Id: ${request.requestId}`);
  if (request.timestamp != null) lines.push(`Time: ${fmt(request.timestamp)}`);

  const query = request.query;
  if (query && Object.keys(query).length) {
    lines.push("", "Query:");
    for (const [k, v] of Object.entries(query)) {
      const redacted = shouldRedact({ key: k, value: v, section: "query", path: k });
      lines.push(`  ${k}: ${redacted ? REDACTED_TOKEN : String(v)}`);
    }
  }

  const headers = request.headers;
  if (headers && Object.keys(headers).length) {
    lines.push("", "Headers:");
    for (const [k, v] of Object.entries(headers)) {
      const redacted = shouldRedact({ key: k, value: v, section: "requestHeaders", path: k });
      lines.push(`  ${k}: ${redacted ? REDACTED_TOKEN : v}`);
    }
  }

  if (request.body != null) {
    const text = bodyToText(request.body, "requestBody", view, shouldRedact);
    if (text) lines.push("", "Body:", text);
  }
  return lines.join("\n");
}

function responseToText(
  response: ApiResponse,
  view: InspectorView,
  shouldRedact: (ctx: RedactContext) => boolean,
): string {
  const lines: string[] = [];
  if (response.status != null) {
    lines.push(`Status: ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`);
  }
  if (response.durationMs != null) lines.push(`Duration: ${response.durationMs} ms`);
  if (response.error) lines.push(`Error: ${response.error}`);

  const headers = response.headers;
  if (headers && Object.keys(headers).length) {
    lines.push("", "Headers:");
    for (const [k, v] of Object.entries(headers)) {
      const redacted = shouldRedact({ key: k, value: v, section: "responseHeaders", path: k });
      lines.push(`  ${k}: ${redacted ? REDACTED_TOKEN : v}`);
    }
  }

  if (response.body != null) {
    const text = bodyToText(response.body, "responseBody", view, shouldRedact);
    if (text) lines.push("", "Body:", text);
  }
  return lines.join("\n");
}

function formatDuration(ms: number): string {
  if (ms < 1) return "0 ms";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
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

const Chevron = () => (
  <svg {...glyph} width={15} height={15}>
    <path d="m9 6 6 6-6 6" />
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
const LockGlyph = () => (
  <svg {...glyph} width={12} height={12} strokeWidth={2.2}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
const SearchGlyph = () => (
  <svg {...glyph}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const RetryGlyph = () => (
  <svg {...glyph}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
const CancelGlyph = () => (
  <svg {...glyph}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </svg>
);
const ClockGlyph = () => (
  <svg {...glyph} width={13} height={13}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const AlertGlyph = () => (
  <svg {...glyph} width={13} height={13}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

/* -------------------------------------------------------------------------- */
/* Highlight (search-in-payload)                                               */
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

const toolBtn = cn(
  "inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]",
  "px-2 py-1 text-[12px] font-medium text-[var(--color-fg)] transition-colors",
  "hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[var(--color-border)] disabled:hover:text-[var(--color-fg)]",
  focusRing,
);

const METHOD_TONE: Record<string, StatusTone> = {
  GET: "info",
  POST: "success",
  PUT: "warning",
  PATCH: "warning",
  DELETE: "error",
  HEAD: "neutral",
  OPTIONS: "neutral",
};

/* -------------------------------------------------------------------------- */
/* Key/value rows (headers, query)                                             */
/* -------------------------------------------------------------------------- */

function KeyValueRows({
  entries,
  section,
  shouldRedact,
  needle,
  wrap,
}: {
  entries: Array<[string, unknown]>;
  section: RedactSection;
  shouldRedact: (ctx: RedactContext) => boolean;
  needle: string;
  wrap: boolean;
}) {
  return (
    <dl className="m-0 grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-4 gap-y-1.5 font-mono text-[12.5px]">
      {entries.map(([k, v]) => {
        const redacted = shouldRedact({ key: k, value: v, section, path: k });
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
                <span
                  className={cn(
                    "select-text text-[var(--color-fg)]",
                    wrap ? "whitespace-pre-wrap break-all" : "block overflow-x-auto whitespace-pre",
                  )}
                >
                  <Highlight text={String(v)} needle={needle} />
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
/* Body block                                                                  */
/* -------------------------------------------------------------------------- */

function BodyBlock({
  text,
  needle,
  wrap,
}: {
  text: string;
  needle: string;
  wrap: boolean;
}) {
  return (
    <pre
      className={cn(
        "m-0 max-h-[22rem] overflow-auto rounded-lg bg-[var(--color-bg)] p-3 font-mono text-[12.5px] leading-relaxed text-[var(--color-fg)]",
        wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre",
      )}
    >
      <code className="select-text">
        <Highlight text={text} needle={needle} />
      </code>
    </pre>
  );
}

/* -------------------------------------------------------------------------- */
/* Section (controlled disclosure)                                             */
/* -------------------------------------------------------------------------- */

function InspectorSection({
  id,
  title,
  countLabel,
  open,
  forcedOpen,
  onToggle,
  reduce,
  children,
}: {
  id: SectionId;
  title: string;
  countLabel?: string;
  open: boolean;
  forcedOpen: boolean;
  onToggle: (id: SectionId) => void;
  reduce: boolean;
  children: React.ReactNode;
}) {
  const effectiveOpen = open || forcedOpen;
  const { triggerProps, panelProps } = useDisclosure({
    open: effectiveOpen,
    onOpenChange: () => onToggle(id),
    idPrefix: "api-sec",
  });

  return (
    <div className="border-t border-[var(--color-border)] first:border-t-0">
      <h3 className="m-0">
        <button
          type="button"
          {...triggerProps}
          className={cn(
            "flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] font-semibold text-[var(--color-fg)] transition-colors",
            "hover:bg-[var(--color-bg-secondary)]",
            focusRing,
          )}
        >
          <motion.span
            className="text-[var(--color-muted)]"
            animate={reduce ? undefined : { rotate: effectiveOpen ? 90 : 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            style={{ display: "inline-flex" }}
          >
            <Chevron />
          </motion.span>
          <span>{title}</span>
          {countLabel ? (
            <span className="rounded-full bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[var(--color-muted)]">
              {countLabel}
            </span>
          ) : null}
          {forcedOpen && !open ? (
            <span className="ml-auto text-[11px] font-medium text-[var(--color-muted)]">match</span>
          ) : null}
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {effectiveOpen ? (
          <motion.div
            key="panel"
            {...panelProps}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-3.5 pb-3.5 pt-0.5">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                              */
/* -------------------------------------------------------------------------- */

export function ApiRequestInspector({
  request,
  response,
  state,
  auth,
  onRetry,
  onCancel,
  onCopy,
  redact,
  defaultSection = "response-body",
  wrap,
  onWrapChange,
  view,
  onViewChange,
  formatTimestamp = defaultFormatTimestamp,
  renderBody,
  title = "Request inspector",
  className,
}: ApiRequestInspectorProps) {
  const reduce = useReducedMotion();
  const shouldRedact = React.useMemo(() => makeShouldRedact(redact), [redact]);

  /* controlled / uncontrolled: wrap ------------------------------------ */
  const [wrapUnc, setWrapUnc] = React.useState(wrap ?? false);
  const isWrapped = wrap ?? wrapUnc;
  const setWrap = React.useCallback(
    (v: boolean) => {
      if (wrap === undefined) setWrapUnc(v);
      onWrapChange?.(v);
    },
    [wrap, onWrapChange],
  );

  /* controlled / uncontrolled: view ------------------------------------ */
  const [viewUnc, setViewUnc] = React.useState<InspectorView>(view ?? "formatted");
  const activeView = view ?? viewUnc;
  const setView = React.useCallback(
    (v: InspectorView) => {
      if (view === undefined) setViewUnc(v);
      onViewChange?.(v);
    },
    [view, onViewChange],
  );

  /* search ------------------------------------------------------------- */
  const [rawQuery, setRawQuery] = React.useState("");
  const needle = rawQuery.trim();
  const needleLc = needle.toLowerCase();

  /* open sections ------------------------------------------------------ */
  const [openSet, setOpenSet] = React.useState<Set<SectionId>>(() => new Set([defaultSection]));
  const toggleSection = React.useCallback((id: SectionId) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* status meta -------------------------------------------------------- */
  const meta = getStatusMeta(state, STATE_OVERRIDES);
  const svars = statusVars(meta.tone);
  const inFlight = IN_FLIGHT.has(state);

  /* derived response body text ----------------------------------------- */
  const reqBodyText = React.useMemo(
    () => (request.body != null ? bodyToText(request.body, "requestBody", activeView, shouldRedact) : ""),
    [request.body, activeView, shouldRedact],
  );
  const resBodyText = React.useMemo(
    () => (response?.body != null ? bodyToText(response.body, "responseBody", activeView, shouldRedact) : ""),
    [response?.body, activeView, shouldRedact],
  );

  const reqHeaderEntries = request.headers ? Object.entries(request.headers) : [];
  const queryEntries = request.query ? Object.entries(request.query) : [];
  const resHeaderEntries = response?.headers ? Object.entries(response.headers) : [];
  const phases = response?.phases ?? [];

  /* which sections contain a search match (drives force-open + count) --- */
  const sectionMatches = React.useMemo(() => {
    const has = (s: string) => (needleLc ? s.toLowerCase().includes(needleLc) : false);
    const kvHas = (entries: Array<[string, unknown]>, section: RedactSection) =>
      entries.some(([k, v]) => {
        if (has(k)) return true;
        // Redacted values are never searchable — the secret must not leak via search.
        if (shouldRedact({ key: k, value: v, section, path: k })) return false;
        return has(String(v));
      });
    return {
      "request-headers": kvHas(reqHeaderEntries, "requestHeaders"),
      query: kvHas(queryEntries, "query"),
      "request-body": has(reqBodyText),
      "response-headers": kvHas(resHeaderEntries, "responseHeaders"),
      "response-body": has(resBodyText),
      timing: phases.some((p) => has(p.label)),
      auth: has(auth?.scheme ?? "") || has(auth?.principal ?? "") || (auth?.scopes ?? []).some(has) || has(auth?.note ?? ""),
    } as Record<SectionId, boolean>;
  }, [needleLc, reqHeaderEntries, queryEntries, reqBodyText, resHeaderEntries, resBodyText, phases, auth, shouldRedact]);

  const totalMatches = needleLc ? Object.values(sectionMatches).filter(Boolean).length : 0;

  /* copy --------------------------------------------------------------- */
  const [copyLabel, setCopyLabel] = React.useState<string>("");
  const { copied, copy } = useCopy({
    onCopy: (text) => onCopy?.(text),
  });
  const doCopy = React.useCallback(
    (text: string, label: string) => {
      setCopyLabel(label);
      void copy(text);
    },
    [copy],
  );

  /* animated duration -------------------------------------------------- */
  const shownDuration = useAnimatedNumber(response?.durationMs ?? 0, {
    disabled: reduce || inFlight || response?.durationMs == null,
  });

  const methodTone = METHOD_TONE[request.method as string] ?? "neutral";
  const methodVars = statusVars(methodTone);

  const totalPhaseMs = phases.reduce((a, p) => a + p.durationMs, 0) || 1;

  const hasResponseData =
    response != null &&
    (response.status != null ||
      response.error != null ||
      resHeaderEntries.length > 0 ||
      resBodyText.length > 0 ||
      phases.length > 0);

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)]",
        "bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-md)]",
        className,
      )}
    >
      {/* Header ---------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2.5">
        <span className="flex items-center gap-2 text-[13px] font-semibold">
          <span className="relative grid h-2.5 w-2.5 place-items-center" aria-hidden>
            <span className="h-2 w-2 rounded-full" style={{ background: svars.color }} />
            {inFlight && !reduce ? (
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ background: svars.color }}
                initial={{ opacity: 0.55, scale: 1 }}
                animate={{ opacity: 0, scale: 2.4 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
              />
            ) : null}
          </span>
          {title}
        </span>

        {/* status chip: icon + text label, tinted via tokens — never colour alone */}
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
          style={{ color: svars.color, borderColor: svars.border, background: svars.bg }}
        >
          {state === "timeout" ? <ClockGlyph /> : null}
          {(state === "server_error" || state === "client_error") ? <AlertGlyph /> : null}
          {meta.label}
        </span>

        {request.environment ? (
          <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)]">
            {request.environment}
          </span>
        ) : null}

        {request.timestamp != null ? (
          <time
            className="ml-auto text-[11.5px] tabular-nums text-[var(--color-muted)]"
            dateTime={request.timestamp instanceof Date ? request.timestamp.toISOString() : undefined}
          >
            {formatTimestamp(request.timestamp)}
          </time>
        ) : null}
      </div>

      {/* Request line ---------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-3.5 py-2.5">
        <span
          className="inline-flex shrink-0 items-center rounded-md border px-2 py-1 font-mono text-[12px] font-bold uppercase leading-none"
          style={{ color: methodVars.color, borderColor: methodVars.border, background: methodVars.bg }}
        >
          {request.method}
        </span>

        <span className="min-w-0 flex-1 overflow-x-auto">
          <code className="select-text whitespace-nowrap font-mono text-[13px] text-[var(--color-fg)]">
            {request.url}
          </code>
        </span>

        {response?.status != null ? (
          <span className="shrink-0 font-mono text-[12.5px] font-semibold tabular-nums" style={{ color: svars.color }}>
            {response.status}
            {response.statusText ? <span className="ml-1 font-normal text-[var(--color-muted)]">{response.statusText}</span> : null}
          </span>
        ) : null}

        {response?.durationMs != null ? (
          <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[12px] tabular-nums text-[var(--color-muted)]">
            <ClockGlyph />
            {formatDuration(reduce || inFlight ? response.durationMs : shownDuration)}
          </span>
        ) : null}

        <button
          type="button"
          className={cn(toolBtn, "shrink-0")}
          onClick={() => doCopy(request.url, "URL")}
        >
          {copied && copyLabel === "URL" ? <CheckGlyph /> : <CopyGlyph />}
          <span className="hidden sm:inline">{copied && copyLabel === "URL" ? "Copied" : "URL"}</span>
        </button>
      </div>

      {/* Meta row: request-id, retry count ------------------------------- */}
      {(request.requestId || (response?.retryCount ?? 0) > 0) ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[var(--color-border)] px-3.5 py-1.5 text-[11.5px] text-[var(--color-muted)]">
          {request.requestId ? (
            <span className="inline-flex items-center gap-1 font-mono">
              <span className="text-[var(--color-muted)]">request-id</span>
              <span className="select-text text-[var(--color-fg)]">{request.requestId}</span>
            </span>
          ) : null}
          {(response?.retryCount ?? 0) > 0 ? (
            <span className="inline-flex items-center gap-1">
              <RetryGlyph />
              {response!.retryCount} {response!.retryCount === 1 ? "retry" : "retries"}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Error banner ---------------------------------------------------- */}
      <AnimatePresence initial={false}>
        {response?.error ? (
          <motion.div
            key="error"
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="flex items-start gap-2 border-b px-3.5 py-2.5 text-[12.5px]"
              style={{ color: svars.color, borderColor: svars.border, background: svars.bg }}
              role="alert"
            >
              <span className="mt-px shrink-0">
                {state === "timeout" ? <ClockGlyph /> : <AlertGlyph />}
              </span>
              <span className="select-text text-[var(--color-fg)]">{response.error}</span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Toolbar --------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-3.5 py-2">
        <label className="relative flex min-w-[9rem] flex-1 items-center">
          <span className="pointer-events-none absolute left-2 text-[var(--color-muted)]">
            <SearchGlyph />
          </span>
          <span className="sr-only">Search within the request and response</span>
          <input
            type="search"
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder="Search payload…"
            className={cn(
              "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] py-1 pl-8 pr-2",
              "text-[12.5px] text-[var(--color-fg)] placeholder:text-[var(--color-muted)]",
              focusRing,
            )}
          />
        </label>

        {needle ? (
          <span className="text-[11.5px] tabular-nums text-[var(--color-muted)]" role="status" aria-live="polite">
            {totalMatches} {totalMatches === 1 ? "section" : "sections"} match
          </span>
        ) : null}

        {/* formatted / raw segmented control */}
        <div className="flex overflow-hidden rounded-md border border-[var(--color-border)]" role="group" aria-label="Payload view">
          {(["formatted", "raw"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={activeView === v}
              onClick={() => setView(v)}
              className={cn(
                "px-2.5 py-1 text-[12px] font-medium capitalize transition-colors",
                focusRing,
                activeView === v
                  ? "bg-[var(--color-surface)] text-[var(--color-fg)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-fg)]",
              )}
            >
              {v}
            </button>
          ))}
        </div>

        <button type="button" className={toolBtn} onClick={() => setWrap(!isWrapped)} aria-pressed={isWrapped}>
          <span className="hidden sm:inline">{isWrapped ? "Wrapped" : "Wrap"}</span>
          <span className="sm:hidden">↵</span>
        </button>

        <button
          type="button"
          className={toolBtn}
          onClick={() => doCopy(requestToText(request, activeView, formatTimestamp, shouldRedact), "request")}
        >
          {copied && copyLabel === "request" ? <CheckGlyph /> : <CopyGlyph />}
          <span className="hidden sm:inline">{copied && copyLabel === "request" ? "Copied" : "Request"}</span>
        </button>

        <button
          type="button"
          className={toolBtn}
          disabled={!hasResponseData}
          onClick={() => response && doCopy(responseToText(response, activeView, shouldRedact), "response")}
        >
          {copied && copyLabel === "response" ? <CheckGlyph /> : <CopyGlyph />}
          <span className="hidden sm:inline">{copied && copyLabel === "response" ? "Copied" : "Response"}</span>
        </button>

        {onRetry && (state === "client_error" || state === "server_error" || state === "timeout" || state === "cancelled") ? (
          <button type="button" className={cn(toolBtn, "font-semibold")} onClick={onRetry}>
            <RetryGlyph />
            <span className="hidden sm:inline">Retry</span>
          </button>
        ) : null}

        {onCancel && inFlight ? (
          <button type="button" className={toolBtn} onClick={onCancel}>
            <CancelGlyph />
            <span className="hidden sm:inline">Cancel</span>
          </button>
        ) : null}
      </div>

      {/* Sections -------------------------------------------------------- */}
      <div>
        {queryEntries.length ? (
          <InspectorSection
            id="query"
            title="Query parameters"
            countLabel={String(queryEntries.length)}
            open={openSet.has("query")}
            forcedOpen={sectionMatches.query}
            onToggle={toggleSection}
            reduce={reduce}
          >
            <KeyValueRows entries={queryEntries} section="query" shouldRedact={shouldRedact} needle={needle} wrap={isWrapped} />
          </InspectorSection>
        ) : null}

        {reqHeaderEntries.length ? (
          <InspectorSection
            id="request-headers"
            title="Request headers"
            countLabel={String(reqHeaderEntries.length)}
            open={openSet.has("request-headers")}
            forcedOpen={sectionMatches["request-headers"]}
            onToggle={toggleSection}
            reduce={reduce}
          >
            <KeyValueRows entries={reqHeaderEntries} section="requestHeaders" shouldRedact={shouldRedact} needle={needle} wrap={isWrapped} />
          </InspectorSection>
        ) : null}

        {reqBodyText ? (
          <InspectorSection
            id="request-body"
            title="Request body"
            open={openSet.has("request-body")}
            forcedOpen={sectionMatches["request-body"]}
            onToggle={toggleSection}
            reduce={reduce}
          >
            {renderBody ? renderBody(bodyToText(request.body, "requestBody", activeView, shouldRedact), { kind: "request" }) : (
              <BodyBlock text={reqBodyText} needle={needle} wrap={isWrapped} />
            )}
          </InspectorSection>
        ) : null}

        {auth ? (
          <InspectorSection
            id="auth"
            title="Authorization"
            countLabel={auth.scheme}
            open={openSet.has("auth")}
            forcedOpen={sectionMatches.auth}
            onToggle={toggleSection}
            reduce={reduce}
          >
            <dl className="m-0 grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-4 gap-y-1.5 text-[12.5px]">
              {auth.scheme ? (
                <>
                  <dt className="font-medium text-[var(--color-muted)]">Scheme</dt>
                  <dd className="m-0 select-text font-mono text-[var(--color-fg)]"><Highlight text={auth.scheme} needle={needle} /></dd>
                </>
              ) : null}
              {auth.principal ? (
                <>
                  <dt className="font-medium text-[var(--color-muted)]">Principal</dt>
                  <dd className="m-0 select-text font-mono text-[var(--color-fg)]"><Highlight text={auth.principal} needle={needle} /></dd>
                </>
              ) : null}
              {auth.scopes && auth.scopes.length ? (
                <>
                  <dt className="font-medium text-[var(--color-muted)]">Scopes</dt>
                  <dd className="m-0 flex flex-wrap gap-1">
                    {auth.scopes.map((s) => (
                      <span key={s} className="select-text rounded border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-1.5 py-px font-mono text-[11px] text-[var(--color-fg)]">
                        <Highlight text={s} needle={needle} />
                      </span>
                    ))}
                  </dd>
                </>
              ) : null}
              {auth.note ? (
                <>
                  <dt className="font-medium text-[var(--color-muted)]">Note</dt>
                  <dd className="m-0 select-text text-[var(--color-fg)]"><Highlight text={auth.note} needle={needle} /></dd>
                </>
              ) : null}
            </dl>
          </InspectorSection>
        ) : null}

        {phases.length ? (
          <InspectorSection
            id="timing"
            title="Timing"
            countLabel={formatDuration(totalPhaseMs)}
            open={openSet.has("timing")}
            forcedOpen={sectionMatches.timing}
            onToggle={toggleSection}
            reduce={reduce}
          >
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {phases.map((p, i) => {
                const pct = Math.max(2, (p.durationMs / totalPhaseMs) * 100);
                return (
                  <li key={p.label} className="grid grid-cols-[minmax(4.5rem,auto)_1fr_auto] items-center gap-3 text-[12px]">
                    <span className="font-medium text-[var(--color-muted)]">
                      <Highlight text={p.label} needle={needle} />
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-secondary)]" aria-hidden>
                      <motion.span
                        className="block h-full rounded-full"
                        style={{ background: "var(--color-accent)" }}
                        initial={reduce ? false : { width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, ease: [0.2, 0, 0, 1], delay: reduce ? 0 : i * 0.06 }}
                      />
                    </span>
                    <span className="font-mono tabular-nums text-[var(--color-muted)]">{formatDuration(p.durationMs)}</span>
                  </li>
                );
              })}
            </ul>
          </InspectorSection>
        ) : null}

        {resHeaderEntries.length ? (
          <InspectorSection
            id="response-headers"
            title="Response headers"
            countLabel={String(resHeaderEntries.length)}
            open={openSet.has("response-headers")}
            forcedOpen={sectionMatches["response-headers"]}
            onToggle={toggleSection}
            reduce={reduce}
          >
            <KeyValueRows entries={resHeaderEntries} section="responseHeaders" shouldRedact={shouldRedact} needle={needle} wrap={isWrapped} />
          </InspectorSection>
        ) : null}

        {resBodyText ? (
          <InspectorSection
            id="response-body"
            title="Response body"
            open={openSet.has("response-body")}
            forcedOpen={sectionMatches["response-body"]}
            onToggle={toggleSection}
            reduce={reduce}
          >
            {renderBody ? renderBody(bodyToText(response!.body, "responseBody", activeView, shouldRedact), { kind: "response" }) : (
              <BodyBlock text={resBodyText} needle={needle} wrap={isWrapped} />
            )}
          </InspectorSection>
        ) : null}

        {/* Empty / in-flight state */}
        {!hasResponseData && reqHeaderEntries.length === 0 && queryEntries.length === 0 && !reqBodyText && !auth ? (
          <div className="px-3.5 py-8 text-center text-[12.5px] text-[var(--color-muted)]">
            {inFlight ? "Waiting for the response…" : "No request details to display."}
          </div>
        ) : !hasResponseData ? (
          <div className="border-t border-[var(--color-border)] px-3.5 py-4 text-center text-[12px] text-[var(--color-muted)]">
            {inFlight ? "Waiting for the response…" : state === "cancelled" ? "The request was cancelled before a response arrived." : "No response yet."}
          </div>
        ) : null}
      </div>

      {/* Copy-success + state announcer (polite, rate-limited) ----------- */}
      <p className="sr-only" role="status" aria-live="polite">
        {copied ? `${copyLabel} copied to clipboard.` : ""}
      </p>
    </div>
  );
}

export default ApiRequestInspector;
