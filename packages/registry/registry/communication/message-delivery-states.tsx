"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useCopy,
  formatTimestamp as defaultFormatTimestamp,
  statusVars,
  type StatusTone,
} from "@/lib/motiq";

/* --------------------------------------------------------------------------
 * MessageDeliveryStates — a chat/message list whose differentiator is an honest,
 * legible DELIVERY-RECEIPT layer. Each message shows its app-supplied lifecycle
 * (draft · sending · sent · delivered · read · failed · retrying · scheduled ·
 * cancelled · edited) as icon + TEXT (never colour or icon alone), with read
 * receipts, an associated error + Retry, and Cancel for scheduled sends.
 *
 * PRESENTATION ONLY. The component never talks to a network, never invents a
 * delivery outcome, and never advances a state on its own — the application owns
 * every transition and passes the next `deliveryState` in. Motion is used only
 * to COMMUNICATE a transition the app just made (sent→delivered tick draw, →read
 * recolor, a single failure nudge, retry, edit, cancellation); there is no
 * perpetual spinner, bouncing dot, or idle typing loop, and reduced-motion users
 * see every state change instantly. Clean-room original.
 * ----------------------------------------------------------------------- */

export type DeliveryState =
  | "draft"
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "retrying"
  | "scheduled"
  | "cancelled"
  | "edited";

/** State of a file/media upload riding along with a message. */
export type AttachmentState = "pending" | "uploading" | "uploaded" | "failed";

export interface MessageAuthor {
  /** Stable identity — drives keys, avatar hue, and own/other alignment. */
  id: string;
  /** Human name; also the avatar's accessible text. */
  name: string;
  /** Optional avatar image; when absent an initials + hue avatar is generated. */
  avatarUrl?: string;
  /** Optional explicit avatar color (any CSS color). */
  color?: string;
}

/** A person the app reports as having read the message (app-supplied). */
export interface ReadRecipient {
  id: string;
  name: string;
  avatarUrl?: string;
  color?: string;
  /** When they read it (used for the accessible label / tooltip). */
  readAt?: Date | number | string;
}

export interface DeliveryMessage {
  /** Stable id — drives keys and change detection for announcements. */
  id: string;
  /** The message text. Stays selectable. */
  body: string;
  author: MessageAuthor;
  /** When the message was composed/sent. */
  timestamp: Date | number | string;
  /** App-owned lifecycle state. The component never advances this itself. */
  deliveryState: DeliveryState;
  /** People the app reports as having read this message (drives read receipts). */
  readRecipients?: ReadRecipient[];
  /** Human-readable failure reason; associated with the message for a11y. */
  error?: string;
  /** When set, the message shows an "Edited" affordance regardless of state. */
  edited?: boolean;
  /** When the edit happened (shown in the accessible edited label). */
  editedAt?: Date | number | string;
  /** For `scheduled` messages: when it will send. */
  scheduledFor?: Date | number | string;
  /** Optional single attachment lifecycle badge. */
  attachmentState?: AttachmentState;
  /** Optional attachment display name (paired with `attachmentState`). */
  attachmentName?: string;
}

export interface MessageDeliveryStatesProps {
  /** App-owned messages, in order. */
  messages: DeliveryMessage[];
  /** Whose perspective this is — their messages align right and show receipts. */
  currentUserId: string;
  /** Retry a failed/undelivered message. Rendered as a keyboard-accessible button. */
  onRetry?: (message: DeliveryMessage) => void;
  /** Cancel a scheduled (or in-flight) message before it sends. */
  onCancel?: (message: DeliveryMessage) => void;
  /** Edit a message (the app opens its own composer). */
  onEdit?: (message: DeliveryMessage) => void;
  /** Copy a message body; receives the plain text. */
  onCopy?: (message: DeliveryMessage) => void;
  /** Override timestamp formatting (pass for deterministic output). */
  formatTimestamp?: (value: DeliveryMessage["timestamp"], message: DeliveryMessage) => string;
  /** Reference "now" (ms) for relative timestamps; omit for absolute time. */
  now?: number;
  /** Accessible label for the conversation region. */
  label?: string;
  /** Max height of the scroll region (px). Omit for no scroll cap. */
  maxHeight?: number;
  className?: string;
}

const EASE: Transition["ease"] = [0.2, 0, 0, 1];

/* -- state vocabulary ---------------------------------------------------- */

interface StateMeta {
  /** Short label shown next to the icon (always rendered as TEXT). */
  label: string;
  tone: StatusTone;
  /** Longer phrase for the live region / accessible receipt. */
  announce?: (m: DeliveryMessage) => string;
}

const STATE_META: Record<DeliveryState, StateMeta> = {
  draft: { label: "Draft", tone: "neutral" },
  sending: { label: "Sending", tone: "info" },
  sent: { label: "Sent", tone: "neutral", announce: () => "Message sent" },
  delivered: { label: "Delivered", tone: "info", announce: () => "Message delivered" },
  read: { label: "Read", tone: "success", announce: () => "Message read" },
  failed: { label: "Not delivered", tone: "error", announce: () => "Message failed to send" },
  retrying: { label: "Retrying", tone: "warning", announce: () => "Retrying message" },
  scheduled: { label: "Scheduled", tone: "info" },
  cancelled: { label: "Cancelled", tone: "neutral", announce: () => "Scheduled message cancelled" },
  edited: { label: "Edited", tone: "neutral" },
};

/** Transitions the app makes that are worth a single, restrained announcement. */
const ANNOUNCEABLE: ReadonlySet<DeliveryState> = new Set([
  "delivered",
  "read",
  "failed",
  "cancelled",
]);

/* -- helpers ------------------------------------------------------------- */

function toMs(value: Date | number | string): number {
  const d = value instanceof Date ? value : new Date(value);
  return d.getTime();
}

function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + second).toUpperCase();
}

function joinNames(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

/* -- avatar -------------------------------------------------------------- */

function Avatar({
  author,
  size = 28,
}: {
  author: { id: string; name: string; avatarUrl?: string; color?: string };
  size?: number;
}) {
  const h = hueFromString(author.color ?? author.id + author.name);
  const bg = author.color ?? `linear-gradient(140deg, hsl(${h} 62% 52%), hsl(${(h + 42) % 360} 66% 42%))`;
  if (author.avatarUrl) {
    return (
      <img
        src={author.avatarUrl}
        alt={author.name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover ring-2 ring-[var(--color-surface)]"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={author.name}
      className="grid shrink-0 select-none place-items-center rounded-full font-semibold text-white ring-2 ring-[var(--color-surface)]"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), background: bg }}
    >
      {initials(author.name)}
    </span>
  );
}

/* -- delivery ticks / state icon ----------------------------------------- */

const svgCommon = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
const stroke = {
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/**
 * The receipt icon. Delivered/read draw the second tick in (once) so the
 * transition is felt without any looping animation; every other state is a
 * static glyph. Reduced motion renders the final frame with no draw.
 */
function StateIcon({ state, reduce }: { state: DeliveryState; reduce: boolean }) {
  const draw = reduce
    ? {}
    : { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { duration: 0.34, ease: EASE } };

  switch (state) {
    case "sent":
      return (
        <svg {...svgCommon}>
          <path d="M4 12.5 9 17.5 20 6.5" {...stroke} />
        </svg>
      );
    case "delivered":
    case "read":
      // Double tick — the trailing tick draws in to signal the advance.
      return (
        <svg {...svgCommon} viewBox="0 0 30 24">
          <path d="M3 12.5 8 17.5 18 6.5" {...stroke} />
          <motion.path key={state} d="M11 12.5 16 17.5 26 6.5" {...stroke} {...draw} />
        </svg>
      );
    case "sending":
    case "retrying":
      // Static arrow — no perpetual spinner; the label carries the "in progress".
      return (
        <svg {...svgCommon}>
          <path d="M12 19V5M6 11l6-6 6 6" {...stroke} />
        </svg>
      );
    case "failed":
      return (
        <svg {...svgCommon}>
          <path d="M12 8v5M12 16.5v.5M12 3 2 20h20L12 3Z" {...stroke} />
        </svg>
      );
    case "scheduled":
      return (
        <svg {...svgCommon}>
          <circle cx="12" cy="13" r="8" {...stroke} />
          <path d="M12 9v4l2.5 2M9 3h6" {...stroke} />
        </svg>
      );
    case "cancelled":
      return (
        <svg {...svgCommon}>
          <circle cx="12" cy="12" r="9" {...stroke} />
          <path d="M8 8l8 8" {...stroke} />
        </svg>
      );
    case "edited":
      return (
        <svg {...svgCommon}>
          <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3ZM13.5 6.5l3 3" {...stroke} />
        </svg>
      );
    case "draft":
    default:
      return (
        <svg {...svgCommon}>
          <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" {...stroke} />
        </svg>
      );
  }
}

/**
 * The delivery receipt: icon + TEXT label, keyed on state so a state change
 * remounts it and plays a short entrance (fade/slide). A `failed` state gets a
 * single horizontal nudge — never a loop. Reduced motion: no entrance, no nudge.
 */
function DeliveryReceipt({ message, reduce }: { message: DeliveryMessage; reduce: boolean }) {
  const meta = STATE_META[message.deliveryState];
  const v = statusVars(meta.tone);
  const failed = message.deliveryState === "failed";

  const enter = reduce
    ? { initial: false as const, animate: { opacity: 1 } }
    : failed
      ? { initial: { opacity: 0 }, animate: { opacity: 1, x: [0, -3, 3, -2, 2, 0] } }
      : { initial: { opacity: 0, y: 3 }, animate: { opacity: 1, y: 0 } };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={message.deliveryState}
        {...enter}
        transition={{ duration: reduce ? 0 : 0.24, ease: EASE }}
        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium [border:1px_solid]"
        style={{ color: v.color, background: v.bg, borderColor: v.border }}
      >
        <StateIcon state={message.deliveryState} reduce={reduce} />
        <span>{meta.label}</span>
      </motion.span>
    </AnimatePresence>
  );
}

/* -- read receipts ------------------------------------------------------- */

function ReadReceipts({ recipients }: { recipients: ReadRecipient[] }) {
  if (recipients.length === 0) return null;
  const names = recipients.map((r) => r.name);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="sr-only">Read by {joinNames(names)}</span>
      <span className="flex -space-x-1.5" aria-hidden>
        {recipients.slice(0, 4).map((r) => (
          <Avatar key={r.id} author={r} size={16} />
        ))}
      </span>
      <span className="text-[11px] text-[var(--color-muted)]" aria-hidden>
        Read by {names.length > 2 ? `${names[0]} +${names.length - 1}` : joinNames(names)}
      </span>
    </span>
  );
}

/* -- attachment badge ---------------------------------------------------- */

const ATTACHMENT_LABEL: Record<AttachmentState, { label: string; tone: StatusTone }> = {
  pending: { label: "Attachment queued", tone: "neutral" },
  uploading: { label: "Uploading attachment", tone: "info" },
  uploaded: { label: "Attachment sent", tone: "success" },
  failed: { label: "Attachment failed", tone: "error" },
};

function AttachmentBadge({ state, name }: { state: AttachmentState; name?: string }) {
  const meta = ATTACHMENT_LABEL[state];
  const v = statusVars(meta.tone);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium [border:1px_solid]"
      style={{ color: v.color, background: v.bg, borderColor: v.border }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M21 12.5 12.5 21a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.5 18.5a1.6 1.6 0 0 1-2.3-2.3l7.8-7.8"
          {...stroke}
          strokeWidth={1.8}
        />
      </svg>
      <span>
        {meta.label}
        {name ? <span className="text-[var(--color-muted)]"> · {name}</span> : null}
      </span>
    </span>
  );
}

/* -- action button ------------------------------------------------------- */

function Action({
  children,
  onClick,
  tone,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "danger" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-45",
        tone === "danger"
          ? "text-[var(--color-error)] hover:bg-[color-mix(in_oklab,var(--color-error)_12%,transparent)]"
          : "text-[var(--color-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)]",
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* -- single message ------------------------------------------------------ */

function MessageRow({
  message,
  own,
  reduce,
  fmt,
  onRetry,
  onCancel,
  onEdit,
  onCopy,
}: {
  message: DeliveryMessage;
  own: boolean;
  reduce: boolean;
  fmt: (message: DeliveryMessage) => string;
  onRetry?: MessageDeliveryStatesProps["onRetry"];
  onCancel?: MessageDeliveryStatesProps["onCancel"];
  onEdit?: MessageDeliveryStatesProps["onEdit"];
  onCopy?: MessageDeliveryStatesProps["onCopy"];
}) {
  const { copied, copy } = useCopy({ onCopy: () => onCopy?.(message) });
  const errorId = `${message.id}-error`;
  const state = message.deliveryState;
  const isFailed = state === "failed";
  const isCancelled = state === "cancelled";
  const isScheduled = state === "scheduled";
  const isEdited = message.edited || state === "edited";
  const timeIso = new Date(toMs(message.timestamp)).toISOString();

  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={{ duration: 0.26, ease: EASE }}
      className={cn("flex flex-col", own ? "items-end" : "items-start")}
    >
      <article
        aria-label={`Message from ${message.author.name}`}
        aria-describedby={isFailed && message.error ? errorId : undefined}
        className={cn(
          "flex max-w-[86%] gap-2.5",
          own ? "flex-row-reverse" : "flex-row",
        )}
      >
        {!own ? <Avatar author={message.author} size={28} /> : null}
        <div className={cn("flex min-w-0 flex-col gap-1", own ? "items-end" : "items-start")}>
          {/* header */}
          <div className={cn("flex items-center gap-2", own && "flex-row-reverse")}>
            <span className="text-[12px] font-semibold text-[var(--color-fg)]">
              {own ? "You" : message.author.name}
            </span>
            <time className="text-[11px] text-[var(--color-muted)]" dateTime={timeIso}>
              {fmt(message)}
            </time>
          </div>

          {/* bubble — body stays selectable */}
          <div
            className={cn(
              "rounded-2xl px-3 py-2 text-[13.5px] leading-relaxed [border:1px_solid]",
              own
                ? "bg-[color-mix(in_oklab,var(--color-accent)_14%,var(--color-surface))] [border-color:color-mix(in_oklab,var(--color-accent)_30%,var(--color-border))] text-[var(--color-fg)]"
                : "bg-[var(--color-surface)] [border-color:var(--color-border)] text-[var(--color-fg)]",
              isFailed && "[border-color:color-mix(in_oklab,var(--color-error)_45%,var(--color-border))]",
              (isCancelled) && "opacity-60 line-through decoration-[var(--color-muted)]",
              state === "sending" || state === "retrying" || isScheduled ? "opacity-90" : null,
            )}
          >
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
          </div>

          {/* attachment lifecycle */}
          {message.attachmentState ? (
            <AttachmentBadge state={message.attachmentState} name={message.attachmentName} />
          ) : null}

          {/* receipt + edited + read receipts */}
          <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", own && "justify-end")}>
            <DeliveryReceipt message={message} reduce={reduce} />
            {isEdited && state !== "edited" ? (
              <span className="text-[11px] italic text-[var(--color-muted)]">
                Edited{message.editedAt ? ` ${fmt({ ...message, timestamp: message.editedAt })}` : ""}
              </span>
            ) : null}
            {isScheduled && message.scheduledFor ? (
              <span className="text-[11px] text-[var(--color-muted)]">
                Sends {fmt({ ...message, timestamp: message.scheduledFor })}
              </span>
            ) : null}
            {state === "read" && message.readRecipients?.length ? (
              <ReadReceipts recipients={message.readRecipients} />
            ) : null}
          </div>

          {/* error — associated with the message, conveyed as text */}
          {isFailed && message.error ? (
            <p id={errorId} className="text-[11.5px] text-[var(--color-error)]">
              {message.error}
            </p>
          ) : null}

          {/* actions */}
          <div className={cn("flex flex-wrap items-center gap-0.5", own && "justify-end")}>
            {isFailed && onRetry ? (
              <Action tone="danger" onClick={() => onRetry(message)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 12a8 8 0 1 1 2.3 5.6M4 12V7m0 5h5" {...stroke} strokeWidth={1.8} />
                </svg>
                Retry
              </Action>
            ) : null}
            {(isScheduled || state === "sending" || state === "retrying") && onCancel ? (
              <Action tone="danger" onClick={() => onCancel(message)}>
                Cancel
              </Action>
            ) : null}
            {onEdit && !isCancelled && state !== "sending" && state !== "retrying" ? (
              <Action onClick={() => onEdit(message)}>Edit</Action>
            ) : null}
            {onCopy ? (
              <Action onClick={() => void copy(message.body)}>{copied ? "Copied" : "Copy"}</Action>
            ) : null}
          </div>
        </div>
      </article>
    </motion.li>
  );
}

/* -- root ---------------------------------------------------------------- */

export function MessageDeliveryStates({
  messages,
  currentUserId,
  onRetry,
  onCancel,
  onEdit,
  onCopy,
  formatTimestamp,
  now,
  label = "Conversation",
  maxHeight,
  className,
}: MessageDeliveryStatesProps) {
  const reduce = useReducedMotion();

  const fmt = React.useCallback(
    (message: DeliveryMessage) => {
      if (formatTimestamp) return formatTimestamp(message.timestamp, message);
      if (now != null) return defaultFormatTimestamp(message.timestamp, { relative: true, now });
      return defaultFormatTimestamp(message.timestamp, {});
    },
    [formatTimestamp, now],
  );

  /* -- restrained live-region: announce only meaningful state advances --- */
  const prevStates = React.useRef<Map<string, DeliveryState>>(new Map());
  const [liveMessage, setLiveMessage] = React.useState("");

  React.useEffect(() => {
    let announcement = "";
    const seen = new Set<string>();
    for (const m of messages) {
      seen.add(m.id);
      const prev = prevStates.current.get(m.id);
      if (prev !== undefined && prev !== m.deliveryState && ANNOUNCEABLE.has(m.deliveryState)) {
        const meta = STATE_META[m.deliveryState];
        announcement = meta.announce ? meta.announce(m) : `Message ${meta.label.toLowerCase()}`;
      }
      prevStates.current.set(m.id, m.deliveryState);
    }
    // Forget messages that were removed so their ids don't leak.
    for (const id of [...prevStates.current.keys()]) {
      if (!seen.has(id)) prevStates.current.delete(id);
    }
    // Only the latest meaningful change is voiced — never every micro-update.
    if (announcement) setLiveMessage(announcement);
  }, [messages]);

  return (
    <section
      aria-label={label}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl bg-[var(--color-bg-secondary)] shadow-[var(--shadow-md)] [border:1px_solid_var(--color-border)]",
        className,
      )}
    >
      <div className="overflow-y-auto px-3 py-3" style={maxHeight ? { maxHeight } : undefined}>
        {messages.length === 0 ? (
          <p className="px-2 py-8 text-center text-[13px] text-[var(--color-muted)]">No messages yet.</p>
        ) : (
          <ul role="list" className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <MessageRow
                  key={m.id}
                  message={m}
                  own={m.author.id === currentUserId}
                  reduce={reduce}
                  fmt={fmt}
                  onRetry={onRetry}
                  onCancel={onCancel}
                  onEdit={onEdit}
                  onCopy={onCopy}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* Restrained polite live region — one meaningful transition at a time. */}
      <div aria-live="polite" role="status" className="sr-only">
        {liveMessage}
      </div>
    </section>
  );
}

export default MessageDeliveryStates;
