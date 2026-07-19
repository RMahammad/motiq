"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useDisclosure,
  useAnchoredPortal,
  useCopy,
  formatTimestamp as defaultFormatTimestamp,
  statusVars,
  streamItemVariants,
  type StatusTone,
} from "@/lib/motiq";

/* --------------------------------------------------------------------------
 * CommentThread — a review/collaboration discussion that is more than stacked
 * bubbles. It renders threaded replies, mentions, reactions, resolve/reopen,
 * an unread divider, and — its differentiator — an internal OPTIMISTIC send
 * layer: a new or edited comment appears immediately in a "pending" state, then
 * flips to sent, or to "failed" with a Retry action, replacing its temporary id
 * when the app confirms. Focus is preserved across those transitions.
 *
 * Presentation + optimistic UX only: the application owns persistence and
 * permissions. The component renders the `comments` it is given, overlays its
 * own in-flight sends, and calls back so the app can do the real work. When a
 * callback returns a Promise, its resolution/rejection drives pending → sent /
 * failed; the app updates `comments` in that same handler and the overlay is
 * reconciled away by id. Clean-room original.
 * ----------------------------------------------------------------------- */

export interface CommentAuthor {
  /** Stable identity — drives keys, mention matching, and avatar hue. */
  id: string;
  /** Human name; also the avatar's accessible text. */
  name: string;
  /** Optional avatar image; when absent an initials + hue avatar is generated. */
  avatarUrl?: string;
  /** Optional explicit avatar color (any CSS color). */
  color?: string;
  /** Optional role/handle shown next to the name. */
  role?: string;
}

export interface Reaction {
  /** The emoji glyph, e.g. "👍". */
  emoji: string;
  /** How many people reacted with it. */
  count: number;
  /** Whether the current user is among them (drives the toggle + label). */
  reactedByMe?: boolean;
  /** Accessible name for the emoji, e.g. "thumbs up". Falls back to the glyph. */
  label?: string;
}

export interface CommentAttachment {
  id: string;
  name: string;
  /** Small secondary text, e.g. a file size. */
  meta?: string;
  href?: string;
}

export type CommentStatus = "normal" | "pending" | "failed" | "edited" | "resolved" | "deleted";

export interface Comment {
  /** Stable id — drives keys, reply relationships, and optimistic reconciliation. */
  id: string;
  author: CommentAuthor;
  /** The comment text. Ignored when `status === "deleted"`. */
  body: string;
  createdAt: Date | number | string;
  editedAt?: Date | number | string;
  /** Parent comment id for flat data. Nested `replies` are also supported. */
  parentId?: string;
  /** Nested replies (alternative to flat `parentId`). */
  replies?: Comment[];
  /** Author ids mentioned in the body (for highlighting + notification intent). */
  mentions?: string[];
  reactions?: Reaction[];
  attachments?: CommentAttachment[];
  /** App-owned lifecycle state. Absent = "normal". */
  status?: CommentStatus;
  /** App-owned resolved flag (thread/comment resolution). */
  resolved?: boolean;
  /** Per-comment capability overrides (the app owns authorization). */
  permissions?: CommentPermissions;
}

export interface CommentPermissions {
  canReply?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canResolve?: boolean;
  canReact?: boolean;
}

/** A draft handed to `onAddComment` / `onReply` / `onEdit`. */
export interface CommentDraft {
  /** Temporary client id for the optimistic entry (replace on confirm). */
  tempId: string;
  body: string;
  parentId?: string;
  mentions: string[];
  /** Present for edits: the id of the comment being edited. */
  editId?: string;
}

type SendResult = Comment | void | undefined;
type SendHandler = (draft: CommentDraft) => SendResult | Promise<SendResult>;

export interface CommentThreadProps {
  /** App-owned comment data (flat with `parentId`, or nested with `replies`). */
  comments: Comment[];
  /** The person composing — drives optimistic authorship + reaction toggles. */
  currentUser: CommentAuthor;
  /** People who can be @-mentioned; powers the accessible mention menu. */
  mentionable?: CommentAuthor[];
  /** Add a top-level comment. Return a Promise to drive pending → sent/failed. */
  onAddComment?: SendHandler;
  /** Reply to a comment (draft carries `parentId`). Return a Promise as above. */
  onReply?: SendHandler;
  /** Edit a comment (draft carries `editId`). Return a Promise as above. */
  onEdit?: SendHandler;
  /** Delete a comment. The app decides how it renders (e.g. a tombstone). */
  onDelete?: (comment: Comment) => void;
  /** Resolve a comment/thread. */
  onResolve?: (comment: Comment) => void;
  /** Reopen a resolved comment/thread. */
  onReopen?: (comment: Comment) => void;
  /** Toggle a reaction. `active` is the state AFTER the toggle. */
  onReact?: (comment: Comment, emoji: string, active: boolean) => void;
  /** Retry a failed send. Fired before the send is re-attempted. */
  onRetry?: (draft: CommentDraft) => void;
  /** Called when a comment's permalink is copied. */
  onCopyLink?: (comment: Comment) => void;
  /** Global capability defaults (merged with per-comment `permissions`). */
  permissions?: CommentPermissions;
  /** Top-level ordering. Replies always stay chronological. */
  sort?: "newest" | "oldest";
  /** Everything strictly newer than this instant is "unread" (drives the divider). */
  unreadAfter?: Date | number | string;
  /** Comment id to visually highlight (e.g. deep-linked). */
  highlightedId?: string;
  /** Comment id shown as selected. */
  selectedId?: string;
  /** Emoji offered by the reaction picker. */
  reactionChoices?: string[];
  /** Build a comment permalink (defaults to `#comment-<id>`). */
  permalink?: (comment: Comment) => string;
  /** Custom attachment renderer. */
  renderAttachment?: (attachment: CommentAttachment, comment: Comment) => React.ReactNode;
  /** Override timestamp formatting. */
  formatTimestamp?: (value: Comment["createdAt"]) => string;
  /** Auto-collapse a comment's replies when it has more than this many. 0 disables. */
  collapseRepliesAfter?: number;
  /** Accessible label for the thread. */
  label?: string;
  /** Max height of the scroll region (px). Omit for no scroll cap. */
  maxHeight?: number;
  className?: string;
}

const DEFAULT_REACTIONS = ["👍", "🎉", "🚀", "👀", "❤️", "😄"];
const EASE: Transition["ease"] = [0.2, 0, 0, 1];

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

/** Flatten nested `replies` into a flat, ordered list with `parentId` set. */
function normalize(comments: Comment[], parentId?: string, out: Comment[] = []): Comment[] {
  for (const c of comments) {
    const { replies, ...rest } = c;
    out.push({ ...rest, parentId: c.parentId ?? parentId });
    if (replies && replies.length) normalize(replies, c.id, out);
  }
  return out;
}

/* -- optimistic model ---------------------------------------------------- */

type OptimisticKind = "add" | "reply" | "edit";
type OptimisticStatus = "pending" | "sent" | "failed";

interface OptimisticEntry {
  /** Stable across pending → sent/failed so React keys (and focus) don't churn. */
  key: string;
  kind: OptimisticKind;
  status: OptimisticStatus;
  /** Displayed id — a temp id for add/reply, the real id for edit. */
  id: string;
  parentId?: string;
  editId?: string;
  body: string;
  mentions: string[];
  createdAt: number;
}

/* -- avatar -------------------------------------------------------------- */

function Avatar({ author, size = 32 }: { author: CommentAuthor; size?: number }) {
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

/* -- status pill --------------------------------------------------------- */

const STATUS_TONE: Record<Exclude<CommentStatus, "normal">, StatusTone> = {
  pending: "info",
  failed: "error",
  edited: "neutral",
  resolved: "success",
  deleted: "neutral",
};

function StatusPill({ status, children }: { status: Exclude<CommentStatus, "normal">; children: React.ReactNode }) {
  const v = statusVars(STATUS_TONE[status]);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium [border:1px_solid]"
      style={{ color: v.color, background: v.bg, borderColor: v.border }}
    >
      <StatusIcon status={status} />
      {children}
    </span>
  );
}

function StatusIcon({ status }: { status: Exclude<CommentStatus, "normal"> }) {
  const common = { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
  const stroke = { stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (status === "pending")
    return (
      <motion.svg {...common} animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}>
        <path d="M12 3a9 9 0 1 0 9 9" {...stroke} />
      </motion.svg>
    );
  if (status === "failed")
    return (
      <svg {...common}>
        <path d="M12 8v5M12 16.5v.5M12 3 2 20h20L12 3Z" {...stroke} />
      </svg>
    );
  if (status === "resolved")
    return (
      <svg {...common}>
        <path d="M4 12.5 9 17.5 20 6.5" {...stroke} />
      </svg>
    );
  // edited
  return (
    <svg {...common}>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3ZM13.5 6.5l3 3" {...stroke} />
    </svg>
  );
}

/* -- body with mention highlighting -------------------------------------- */

function CommentBody({ body }: { body: string }) {
  // Split on @mentions so they can be emphasised. Purely visual — the app owns
  // the authoritative `mentions` id list.
  const parts = React.useMemo(() => body.split(/(@[\w][\w.-]*)/g), [body]);
  return (
    <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-[var(--color-fg)]">
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} className="rounded bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] px-1 font-medium text-[var(--color-accent)]">
            {part}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </p>
  );
}

/* -- reactions ----------------------------------------------------------- */

function ReactionBar({
  comment,
  reactions,
  choices,
  canReact,
  onReact,
}: {
  comment: Comment;
  reactions: Reaction[];
  choices: string[];
  canReact: boolean;
  onReact?: CommentThreadProps["onReact"];
}) {
  const picker = useDisclosure({ idPrefix: "react", dismissable: true });
  const anchor = useAnchoredPortal(picker.open, { side: "top", align: "start" });
  if (!canReact && reactions.length === 0) return null;

  return (
    <div ref={picker.rootRef as React.RefObject<HTMLDivElement>} className="relative flex flex-wrap items-center gap-1.5">
      {reactions.map((r) => {
        const name = r.label ?? r.emoji;
        return (
          <button
            key={r.emoji}
            type="button"
            aria-pressed={!!r.reactedByMe}
            disabled={!canReact}
            onClick={() => onReact?.(comment, r.emoji, !r.reactedByMe)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-60",
              r.reactedByMe
                ? "[border:1px_solid_var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] text-[var(--color-fg)]"
                : "[border:1px_solid_var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:border-[var(--color-accent)]",
            )}
          >
            <span aria-hidden>{r.emoji}</span>
            <span aria-hidden className="tabular-nums">{r.count}</span>
            <span className="sr-only">
              {r.count} {name} {r.count === 1 ? "reaction" : "reactions"}
              {r.reactedByMe ? ", including you - activate to remove yours" : " - activate to add yours"}
            </span>
          </button>
        );
      })}

      {canReact ? (
        <>
          <button
            type="button"
            {...picker.triggerProps}
            ref={anchor.triggerRef as React.RefObject<HTMLButtonElement>}
            className="grid h-6 w-6 place-items-center rounded-full text-[var(--color-muted)] outline-none [border:1px_solid_var(--color-border)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-fg)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M9 10h.01M15 10h.01M8.5 14.5a4 4 0 0 0 7 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="sr-only">Add reaction</span>
          </button>
          {anchor.renderInPortal(
            <AnimatePresence>
            {picker.open && anchor.anchored ? (
              <motion.div
                {...picker.panelProps}
                ref={anchor.panelRef as React.RefObject<HTMLDivElement>}
                aria-label="Choose a reaction"
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.15, ease: EASE }}
                style={anchor.panelStyle}
                className="z-[60] flex gap-0.5 rounded-full bg-[var(--color-surface)] p-1 shadow-[var(--shadow-md)] [border:1px_solid_var(--color-border)]"
              >
                {choices.map((emoji) => {
                  const existing = reactions.find((r) => r.emoji === emoji);
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onReact?.(comment, emoji, !existing?.reactedByMe);
                        picker.setOpen(false);
                      }}
                      className="grid h-8 w-8 place-items-center rounded-full text-[16px] outline-none transition-transform hover:scale-110 hover:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    >
                      <span aria-hidden>{emoji}</span>
                      <span className="sr-only">React with {emoji}</span>
                    </button>
                  );
                })}
              </motion.div>
            ) : null}
            </AnimatePresence>,
          )}
        </>
      ) : null}
    </div>
  );
}

/* -- composer with accessible mention menu ------------------------------- */

interface ComposerProps {
  currentUser: CommentAuthor;
  mentionable: CommentAuthor[];
  initialValue?: string;
  placeholder?: string;
  submitLabel: string;
  autoFocus?: boolean;
  onSubmit: (body: string, mentions: string[]) => void;
  onCancel?: () => void;
  compact?: boolean;
}

function Composer({
  currentUser,
  mentionable,
  initialValue = "",
  placeholder = "Add a comment…",
  submitLabel,
  autoFocus,
  onSubmit,
  onCancel,
  compact,
}: ComposerProps) {
  const [value, setValue] = React.useState(initialValue);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const listId = React.useId();
  // Anchor the mention listbox to the composer column and portal it to <body> so
  // no ancestor `overflow-hidden` (thread cards, scroll areas) can crop it.
  const mentionAnchor = useAnchoredPortal(menuOpen, { side: "bottom", align: "start" });

  React.useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const matches = React.useMemo(() => {
    if (!menuOpen) return [];
    const q = query.toLowerCase();
    return mentionable.filter((m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)).slice(0, 6);
  }, [menuOpen, query, mentionable]);

  const mentionIds = React.useMemo(() => {
    const found = new Set<string>();
    for (const m of mentionable) {
      if (new RegExp(`@${escapeRegExp(m.name.replace(/\s+/g, ""))}(?![\\w])`, "i").test(value)) found.add(m.id);
    }
    return [...found];
  }, [value, mentionable]);

  const syncMentionMenu = React.useCallback((text: string, caret: number) => {
    const upToCaret = text.slice(0, caret);
    const match = /(?:^|\s)@([\w.-]*)$/.exec(upToCaret);
    if (match) {
      setMenuOpen(true);
      setQuery(match[1]);
      setActiveIndex(0);
    } else {
      setMenuOpen(false);
    }
  }, []);

  const insertMention = React.useCallback(
    (author: CommentAuthor) => {
      const el = textareaRef.current;
      const caret = el?.selectionStart ?? value.length;
      const upToCaret = value.slice(0, caret);
      const rest = value.slice(caret);
      const replaced = upToCaret.replace(/@([\w.-]*)$/, `@${author.name.replace(/\s+/g, "")} `);
      const next = replaced + rest;
      setValue(next);
      setMenuOpen(false);
      requestAnimationFrame(() => {
        el?.focus();
        const pos = replaced.length;
        el?.setSelectionRange(pos, pos);
      });
    },
    [value],
  );

  const submit = React.useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed, mentionIds);
    setValue("");
    setMenuOpen(false);
    // Keep the composer focused so an optimistic send never steals focus.
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [value, mentionIds, onSubmit]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (menuOpen && matches.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % matches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(matches[activeIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMenuOpen(false);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey && (e.metaKey || e.ctrlKey || !menuOpen)) {
      e.preventDefault();
      submit();
      return;
    }
    if (e.key === "Escape" && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <form
      className="flex gap-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {!compact ? <Avatar author={currentUser} size={30} /> : null}
      <div ref={mentionAnchor.triggerRef as React.RefObject<HTMLDivElement>} className="relative min-w-0 flex-1">
        <textarea
          ref={textareaRef}
          value={value}
          placeholder={placeholder}
          aria-label={placeholder}
          rows={compact ? 2 : 3}
          aria-autocomplete="list"
          aria-controls={menuOpen && matches.length ? listId : undefined}
          aria-activedescendant={menuOpen && matches.length ? `${listId}-opt-${activeIndex}` : undefined}
          onChange={(e) => {
            setValue(e.target.value);
            syncMentionMenu(e.target.value, e.target.selectionStart);
          }}
          onKeyDown={onKeyDown}
          onClick={(e) => syncMentionMenu(value, (e.target as HTMLTextAreaElement).selectionStart)}
          className="w-full resize-y rounded-xl bg-[var(--color-surface)] px-3 py-2 text-[13.5px] leading-relaxed text-[var(--color-fg)] outline-none [border:1px_solid_var(--color-border)] placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--color-accent)_45%,transparent)]"
        />

        {mentionAnchor.renderInPortal(
          <AnimatePresence>
          {menuOpen && matches.length && mentionAnchor.anchored ? (
            <motion.ul
              id={listId}
              ref={mentionAnchor.panelRef as React.RefObject<HTMLUListElement>}
              role="listbox"
              aria-label="Mention someone"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.14, ease: EASE }}
              style={mentionAnchor.panelStyle}
              className="z-[60] w-[260px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl bg-[var(--color-surface)] py-1 shadow-[var(--shadow-md)] [border:1px_solid_var(--color-border)]"
            >
              {matches.map((m, i) => (
                <li
                  key={m.id}
                  id={`${listId}-opt-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(m);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-[13px]",
                    i === activeIndex ? "bg-[var(--color-bg-secondary)] text-[var(--color-fg)]" : "text-[var(--color-fg)]",
                  )}
                >
                  <Avatar author={m} size={22} />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{m.name}</span>
                    {m.role ? <span className="text-[var(--color-muted)]"> · {m.role}</span> : null}
                  </span>
                </li>
              ))}
            </motion.ul>
          ) : null}
          </AnimatePresence>,
        )}

        <div className="mt-2 flex items-center gap-2">
          <button
            type="submit"
            disabled={!value.trim()}
            className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-semibold text-[var(--color-accent-foreground,white)] outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitLabel}
          </button>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-[var(--color-muted)] outline-none transition-colors hover:text-[var(--color-fg)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              Cancel
            </button>
          ) : null}
          <span className="ml-auto hidden text-[11px] text-[var(--color-muted)] sm:inline">
            <kbd className="rounded bg-[var(--color-bg-secondary)] px-1">↵</kbd> to send · <kbd className="rounded bg-[var(--color-bg-secondary)] px-1">@</kbd> to mention
          </span>
        </div>
      </div>
    </form>
  );
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* -- action button ------------------------------------------------------- */

const Action = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "danger" }
>(function Action({ children, onClick, tone, className, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-45",
        tone === "danger"
          ? "text-[var(--color-error)] hover:bg-[color-mix(in_oklab,var(--color-error)_12%,transparent)]"
          : "text-[var(--color-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

/* -- single comment node ------------------------------------------------- */

interface NodeContext {
  currentUser: CommentAuthor;
  mentionable: CommentAuthor[];
  reactionChoices: string[];
  reduce: boolean;
  now: number | null;
  fmt: (v: Comment["createdAt"]) => string;
  permissions: CommentPermissions;
  permalink: (comment: Comment) => string;
  collapseRepliesAfter: number;
  unreadBoundary: number | null;
  highlightedId?: string;
  selectedId?: string;
  childrenOf: (id: string) => Comment[];
  handlers: Pick<
    CommentThreadProps,
    "onReply" | "onEdit" | "onDelete" | "onResolve" | "onReopen" | "onReact" | "onCopyLink" | "renderAttachment"
  >;
  startReply: (draft: CommentDraft, sender: SendHandler | undefined) => void;
  announce: (msg: string) => void;
  retry: (comment: Comment) => void;
  onCopyLinkNotify: (comment: Comment) => void;
}

function can(action: keyof CommentPermissions, comment: Comment, ctx: NodeContext): boolean {
  const local = comment.permissions?.[action];
  if (local !== undefined) return local;
  const global = ctx.permissions[action];
  return global !== undefined ? global : true;
}

function CommentNode({ comment, depth, ctx }: { comment: Comment; depth: number; ctx: NodeContext }) {
  const children = ctx.childrenOf(comment.id);
  const isDeleted = comment.status === "deleted";
  const isResolved = comment.resolved || comment.status === "resolved";
  const isPending = comment.status === "pending";
  const isFailed = comment.status === "failed";
  const isEdited = !!comment.editedAt || comment.status === "edited";
  const isUnread = ctx.unreadBoundary != null && toMs(comment.createdAt) > ctx.unreadBoundary;
  const isHighlighted = ctx.highlightedId === comment.id;
  const isSelected = ctx.selectedId === comment.id;

  const [replying, setReplying] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const replyBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const editBtnRef = React.useRef<HTMLButtonElement | null>(null);

  const autoCollapse = ctx.collapseRepliesAfter > 0 && children.length > ctx.collapseRepliesAfter;
  const replyDisclosure = useDisclosure({ defaultOpen: !autoCollapse, idPrefix: "replies" });
  const { copied, copy } = useCopy({ onCopy: () => ctx.onCopyLinkNotify(comment) });

  const submitReply = (body: string, mentions: string[]) => {
    const tempId = makeTempId();
    setReplying(false);
    ctx.startReply({ tempId, body, mentions, parentId: comment.id }, ctx.handlers.onReply);
    if (!replyDisclosure.open) replyDisclosure.setOpen(true);
    ctx.announce("Reply sending");
    requestAnimationFrame(() => replyBtnRef.current?.focus());
  };

  const submitEdit = (body: string, mentions: string[]) => {
    setEditing(false);
    ctx.startReply({ tempId: makeTempId(), body, mentions, parentId: comment.parentId, editId: comment.id }, ctx.handlers.onEdit);
    ctx.announce("Edit sending");
    requestAnimationFrame(() => editBtnRef.current?.focus());
  };

  const doCopy = () => {
    void copy(ctx.permalink(comment));
    ctx.announce("Link copied to clipboard");
  };

  const timeIso = new Date(toMs(comment.createdAt)).toISOString();

  return (
    <motion.li
      layout={!ctx.reduce}
      initial={ctx.reduce ? false : streamItemVariants.initial}
      animate={streamItemVariants.animate}
      exit={ctx.reduce ? { opacity: 0 } : streamItemVariants.exit}
      transition={{ duration: 0.26, ease: EASE }}
      data-unread={isUnread || undefined}
      data-selected={isSelected || undefined}
      className="relative"
    >
      <article
        id={`comment-${comment.id}`}
        aria-label={isDeleted ? "Deleted comment" : `Comment by ${comment.author.name}`}
        aria-current={isSelected ? "true" : undefined}
        className={cn(
          "relative rounded-lg px-3 py-2.5 transition-colors",
          // One calm hover: a light row tint, no border/shadow, no layout shift.
          !isSelected && !isDeleted && "hover:bg-[var(--color-bg-secondary)]",
          // Selection: a single accent left-bar (below) over a very light tint.
          isSelected && "bg-[color-mix(in_oklab,var(--color-accent)_6%,transparent)]",
          isHighlighted && !isSelected && "bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)]",
          isUnread && !isSelected && !isHighlighted && "bg-[color-mix(in_oklab,var(--color-accent)_5%,transparent)]",
          isPending && "opacity-80",
        )}
      >
        {/* Single, quiet status rail — selection (accent) or failed (error). */}
        {isSelected ? (
          <span aria-hidden className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[var(--color-accent)]" />
        ) : isFailed ? (
          <span aria-hidden className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[var(--color-error)]" />
        ) : null}
        {isDeleted ? (
          <p className="flex items-center gap-2 py-1 text-[13px] italic text-[var(--color-muted)]">
            <StatusIcon status="deleted" />
            This comment was deleted.
          </p>
        ) : (
          <div className="flex gap-2.5">
            <Avatar author={comment.author} size={32} />
            <div className="min-w-0 flex-1">
              {/* header */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-[13px] font-semibold text-[var(--color-fg)]">{comment.author.name}</span>
                {comment.author.role ? (
                  <span className="text-[11px] text-[var(--color-muted)]">{comment.author.role}</span>
                ) : null}
                <time className="text-[12px] text-[var(--color-muted)]" dateTime={timeIso}>
                  {ctx.fmt(comment.createdAt)}
                </time>
                {isEdited && !isPending && !isFailed ? (
                  <span className="text-[11px] italic text-[var(--color-muted)]">(edited)</span>
                ) : null}
                {isPending ? <StatusPill status="pending">Sending…</StatusPill> : null}
                {isFailed ? <StatusPill status="failed">Failed to send</StatusPill> : null}
                {isUnread && !isPending && !isFailed ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-accent)]">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                    Unread
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={doCopy}
                  className="ml-auto grid h-6 w-6 place-items-center rounded-md text-[var(--color-muted)] outline-none transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M9 9h9v11H9zM6 15H4V4h11v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="sr-only">Copy link to this comment</span>
                </button>
              </div>

              {/* edit mode or body */}
              {editing ? (
                <div className="mt-1.5">
                  <Composer
                    currentUser={ctx.currentUser}
                    mentionable={ctx.mentionable}
                    initialValue={comment.body}
                    submitLabel="Save"
                    autoFocus
                    compact
                    onSubmit={submitEdit}
                    onCancel={() => {
                      setEditing(false);
                      requestAnimationFrame(() => editBtnRef.current?.focus());
                    }}
                  />
                </div>
              ) : (
                <div className="mt-0.5">
                  <CommentBody body={comment.body} />
                </div>
              )}

              {/* attachments */}
              {!editing && comment.attachments?.length ? (
                <ul className="mt-2 flex flex-wrap gap-1.5" role="list">
                  {comment.attachments.map((att) => (
                    <li key={att.id}>
                      {ctx.handlers.renderAttachment ? (
                        ctx.handlers.renderAttachment(att, comment)
                      ) : (
                        <a
                          href={att.href ?? "#"}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-bg-secondary)] px-2 py-1 text-[12px] text-[var(--color-fg)] outline-none [border:1px_solid_var(--color-border)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M21 12.5 12.5 21a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.5 18.5a1.6 1.6 0 0 1-2.3-2.3l7.8-7.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="font-medium">{att.name}</span>
                          {att.meta ? <span className="text-[var(--color-muted)]">{att.meta}</span> : null}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}

              {/* reactions */}
              {!editing && !isPending ? (
                <div className="mt-2">
                  <ReactionBar
                    comment={comment}
                    reactions={comment.reactions ?? []}
                    choices={ctx.reactionChoices}
                    canReact={can("canReact", comment, ctx) && !isFailed}
                    onReact={ctx.handlers.onReact}
                  />
                </div>
              ) : null}

              {/* action row */}
              {!editing ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-0.5">
                  {isFailed ? (
                    <Action tone="danger" onClick={() => ctx.retry(comment)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M4 12a8 8 0 1 1 2.3 5.6M4 12V7m0 5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Retry
                    </Action>
                  ) : null}

                  {!isPending && !isFailed && can("canReply", comment, ctx) && ctx.handlers.onReply ? (
                    <Action ref={replyBtnRef} onClick={() => setReplying((r) => !r)} aria-expanded={replying}>
                      Reply
                    </Action>
                  ) : null}

                  {!isPending && !isFailed && comment.author.id === ctx.currentUser.id && can("canEdit", comment, ctx) && ctx.handlers.onEdit ? (
                    <Action ref={editBtnRef} onClick={() => setEditing(true)}>
                      Edit
                    </Action>
                  ) : null}

                  {!isPending && !isFailed && can("canDelete", comment, ctx) && ctx.handlers.onDelete ? (
                    <Action tone="danger" onClick={() => ctx.handlers.onDelete?.(comment)}>
                      Delete
                    </Action>
                  ) : null}

                  {!isPending && !isFailed && depth === 0 && can("canResolve", comment, ctx) ? (
                    isResolved ? (
                      ctx.handlers.onReopen ? (
                        <Action onClick={() => ctx.handlers.onReopen?.(comment)}>Reopen</Action>
                      ) : null
                    ) : ctx.handlers.onResolve ? (
                      <Action onClick={() => ctx.handlers.onResolve?.(comment)}>Resolve</Action>
                    ) : null
                  ) : null}

                  {copied ? (
                    <span className="ml-1 text-[11px] text-[var(--color-success)]">Link copied</span>
                  ) : null}
                </div>
              ) : null}

              {/* resolved banner */}
              {isResolved && depth === 0 ? (
                <div className="mt-2">
                  <StatusPill status="resolved">Resolved</StatusPill>
                </div>
              ) : null}

              {/* inline reply composer */}
              <AnimatePresence initial={false}>
                {replying ? (
                  <motion.div
                    key="reply"
                    initial={ctx.reduce ? false : { opacity: 0, height: 0 }}
                    animate={ctx.reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
                    exit={ctx.reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2">
                      <Composer
                        currentUser={ctx.currentUser}
                        mentionable={ctx.mentionable}
                        placeholder={`Reply to ${comment.author.name}…`}
                        submitLabel="Reply"
                        autoFocus
                        compact
                        onSubmit={submitReply}
                        onCancel={() => {
                          setReplying(false);
                          requestAnimationFrame(() => replyBtnRef.current?.focus());
                        }}
                      />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        )}
      </article>

      {/* replies — one quiet thread guide rail per depth (no nested cards) */}
      {children.length > 0 ? (
        <div className="ml-5 mt-0.5 border-l border-[var(--color-border)] pl-2.5 sm:ml-6 sm:pl-3.5">
          {autoCollapse ? (
            <button
              type="button"
              {...replyDisclosure.triggerProps}
              className="mb-1 inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[12px] font-medium text-[var(--color-accent)] outline-none transition-colors hover:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              <motion.span
                aria-hidden
                animate={ctx.reduce ? undefined : { rotate: replyDisclosure.open ? 90 : 0 }}
                style={ctx.reduce ? { transform: replyDisclosure.open ? "rotate(90deg)" : "none" } : undefined}
                className="inline-flex"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.span>
              {replyDisclosure.open ? "Hide" : "Show"} {children.length} {children.length === 1 ? "reply" : "replies"}
            </button>
          ) : null}

          <AnimatePresence initial={false}>
            {replyDisclosure.open ? (
              <motion.ul
                {...replyDisclosure.panelProps}
                aria-label={`Replies to ${comment.author.name}`}
                role="list"
                initial={autoCollapse && !ctx.reduce ? { opacity: 0, height: 0 } : false}
                animate={autoCollapse && !ctx.reduce ? { opacity: 1, height: "auto" } : { opacity: 1 }}
                exit={autoCollapse && !ctx.reduce ? { opacity: 0, height: 0 } : { opacity: 0 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="flex flex-col gap-1 overflow-hidden"
              >
                <AnimatePresence initial={false}>
                  {children.map((child) => (
                    <CommentNode key={child.id} comment={child} depth={depth + 1} ctx={ctx} />
                  ))}
                </AnimatePresence>
              </motion.ul>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}
    </motion.li>
  );
}

/* -- id minting (handlers only — never during render) -------------------- */

let TEMP_SEQ = 0;
function makeTempId(): string {
  TEMP_SEQ += 1;
  return `mk-temp-${TEMP_SEQ}-${Math.random().toString(36).slice(2, 8)}`;
}

/* -- root component ------------------------------------------------------ */

export function CommentThread({
  comments,
  currentUser,
  mentionable = [],
  onAddComment,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  onReopen,
  onReact,
  onRetry,
  onCopyLink,
  permissions = {},
  sort = "oldest",
  unreadAfter,
  highlightedId,
  selectedId,
  reactionChoices = DEFAULT_REACTIONS,
  permalink,
  renderAttachment,
  formatTimestamp,
  collapseRepliesAfter = 0,
  label = "Comments",
  maxHeight,
  className,
}: CommentThreadProps) {
  const reduce = useReducedMotion();

  // `now` is set after mount only — never during render, SSR, or a useState
  // initializer — so relative timestamps can't cause a hydration mismatch.
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const [optimistic, setOptimistic] = React.useState<OptimisticEntry[]>([]);
  const [liveMessage, setLiveMessage] = React.useState("");
  const announce = React.useCallback((msg: string) => setLiveMessage(msg), []);

  const fmt = React.useCallback(
    (v: Comment["createdAt"]) => {
      if (formatTimestamp) return formatTimestamp(v);
      if (now == null) return defaultFormatTimestamp(v, {});
      return defaultFormatTimestamp(v, { relative: true, now });
    },
    [formatTimestamp, now],
  );

  const permalinkFn = React.useCallback(
    (comment: Comment) => permalink?.(comment) ?? `#comment-${comment.id}`,
    [permalink],
  );

  const onCopyLinkNotify = React.useCallback((comment: Comment) => onCopyLink?.(comment), [onCopyLink]);

  /* -- optimistic send engine ------------------------------------------- */

  const setEntry = React.useCallback((key: string, patch: Partial<OptimisticEntry>) => {
    setOptimistic((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  }, []);

  const runSend = React.useCallback(
    async (entry: OptimisticEntry, sender: SendHandler | undefined) => {
      const draft: CommentDraft = {
        tempId: entry.id,
        body: entry.body,
        parentId: entry.parentId,
        mentions: entry.mentions,
        editId: entry.editId,
      };
      try {
        const result = await sender?.(draft);
        const confirmedId = result && typeof result === "object" && "id" in result ? result.id : entry.id;
        setEntry(entry.key, { status: "sent", id: confirmedId });
        announce("Comment sent");
      } catch {
        setEntry(entry.key, { status: "failed" });
        announce("Comment failed to send. Retry available.");
      }
    },
    [setEntry, announce],
  );

  const startSend = React.useCallback(
    (draft: CommentDraft, sender: SendHandler | undefined, kind: OptimisticKind) => {
      const entry: OptimisticEntry = {
        key: draft.tempId,
        kind,
        status: "pending",
        id: draft.tempId,
        parentId: draft.parentId,
        editId: draft.editId,
        body: draft.body,
        mentions: draft.mentions,
        createdAt: Date.now(),
      };
      setOptimistic((prev) => [...prev, entry]);
      void runSend(entry, sender);
    },
    [runSend],
  );

  const startReply = React.useCallback(
    (draft: CommentDraft, sender: SendHandler | undefined) => {
      const kind: OptimisticKind = draft.editId ? "edit" : draft.parentId ? "reply" : "add";
      startSend(draft, sender, kind);
    },
    [startSend],
  );

  const retry = React.useCallback(
    (comment: Comment) => {
      const entry = optimistic.find((e) => e.id === comment.id && e.status === "failed");
      if (!entry) return;
      const draft: CommentDraft = {
        tempId: entry.id,
        body: entry.body,
        parentId: entry.parentId,
        mentions: entry.mentions,
        editId: entry.editId,
      };
      onRetry?.(draft);
      const sender = entry.kind === "edit" ? onEdit : entry.kind === "reply" ? onReply : onAddComment;
      setEntry(entry.key, { status: "pending" });
      announce("Retrying…");
      void runSend({ ...entry, status: "pending" }, sender);
    },
    [optimistic, onRetry, onEdit, onReply, onAddComment, setEntry, announce, runSend],
  );

  const addTopLevel = React.useCallback(
    (body: string, mentions: string[]) => {
      startSend({ tempId: makeTempId(), body, mentions }, onAddComment, "add");
      announce("Comment sending");
    },
    [startSend, onAddComment, announce],
  );

  /* -- merge app data + optimistic overlay ------------------------------ */

  const flat = React.useMemo(() => normalize(comments), [comments]);
  const presentIds = React.useMemo(() => new Set(flat.map((c) => c.id)), [flat]);

  // Drop optimistic entries the app has reconciled into `comments`.
  React.useEffect(() => {
    setOptimistic((prev) => {
      const next = prev.filter((e) => {
        if (e.kind === "edit") {
          const target = flat.find((c) => c.id === e.editId);
          // Keep the override until the app's data reflects the edited body.
          return !(target && target.body === e.body);
        }
        // add/reply: keep until the confirmed id shows up in app data.
        return !presentIds.has(e.id);
      });
      return next.length === prev.length ? prev : next;
    });
  }, [flat, presentIds]);

  const merged = React.useMemo<Comment[]>(() => {
    const byId = new Map<string, Comment>();
    const order: string[] = [];
    for (const c of flat) {
      byId.set(c.id, { ...c });
      order.push(c.id);
    }

    for (const e of optimistic) {
      if (e.kind === "edit") {
        const target = e.editId ? byId.get(e.editId) : undefined;
        if (target) {
          target.body = e.body;
          target.mentions = e.mentions;
          target.status = e.status === "sent" ? "edited" : e.status;
          if (e.status === "sent") target.editedAt = e.createdAt;
        }
        continue;
      }
      if (presentIds.has(e.id)) continue; // reconciled
      const synthetic: Comment = {
        id: e.id,
        author: currentUser,
        body: e.body,
        createdAt: e.createdAt,
        parentId: e.parentId,
        mentions: e.mentions,
        status: e.status === "sent" ? "normal" : e.status,
      };
      byId.set(e.id, synthetic);
      order.push(e.id);
    }

    return order.map((id) => byId.get(id)!).filter(Boolean);
  }, [flat, optimistic, presentIds, currentUser]);

  const boundary = unreadAfter != null ? toMs(unreadAfter) : null;

  const roots = React.useMemo(() => {
    const list = merged.filter((c) => !c.parentId);
    return list.slice().sort((a, b) => (sort === "newest" ? toMs(b.createdAt) - toMs(a.createdAt) : toMs(a.createdAt) - toMs(b.createdAt)));
  }, [merged, sort]);

  const childrenOf = React.useCallback(
    (id: string) =>
      merged
        .filter((c) => c.parentId === id)
        .slice()
        .sort((a, b) => toMs(a.createdAt) - toMs(b.createdAt)),
    [merged],
  );

  const unreadCount = React.useMemo(
    () => (boundary == null ? 0 : merged.reduce((n, c) => (toMs(c.createdAt) > boundary ? n + 1 : n), 0)),
    [merged, boundary],
  );

  // Index of the first unread root — the divider is drawn before it.
  const firstUnreadRootIndex = React.useMemo(() => {
    if (boundary == null) return -1;
    return roots.findIndex((c) => toMs(c.createdAt) > boundary);
  }, [roots, boundary]);

  const ctx: NodeContext = {
    currentUser,
    mentionable,
    reactionChoices,
    reduce,
    now,
    fmt,
    permissions,
    permalink: permalinkFn,
    collapseRepliesAfter,
    unreadBoundary: boundary,
    highlightedId,
    selectedId,
    childrenOf,
    handlers: { onReply, onEdit, onDelete, onResolve, onReopen, onReact, onCopyLink, renderAttachment },
    startReply,
    announce,
    retry,
    onCopyLinkNotify,
  };

  const totalCount = merged.filter((c) => c.status !== "deleted").length;

  return (
    <section
      aria-label={label}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl bg-[var(--color-surface)] shadow-[var(--shadow-md)] [border:1px_solid_var(--color-border)]",
        className,
      )}
    >
      {/* header */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="text-[14px] font-semibold text-[var(--color-fg)]">{label}</h3>
        <span className="rounded-full bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[12px] font-medium text-[var(--color-muted)] tabular-nums">
          {totalCount}
        </span>
        {unreadCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--color-accent)]">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            {unreadCount} unread
          </span>
        ) : null}
      </div>

      {/* thread */}
      <div className="overflow-y-auto px-2 py-2" style={maxHeight ? { maxHeight } : undefined}>
        {roots.length === 0 ? (
          <p className="px-2 py-8 text-center text-[13px] text-[var(--color-muted)]">No comments yet. Start the discussion below.</p>
        ) : (
          <ul role="list" className="flex flex-col gap-1">
            <AnimatePresence initial={false}>
              {roots.map((root, i) => (
                <React.Fragment key={root.id}>
                  {i === firstUnreadRootIndex && unreadCount > 0 ? (
                    <li
                      key="unread-divider"
                      aria-label={`New - ${unreadCount} unread ${unreadCount === 1 ? "comment" : "comments"} below`}
                      className="flex items-center gap-2 px-2 py-1"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-accent)]" aria-hidden>
                        New
                      </span>
                      <span className="h-px flex-1 bg-[color-mix(in_oklab,var(--color-accent)_40%,var(--color-border))]" aria-hidden />
                    </li>
                  ) : null}
                  <CommentNode comment={root} depth={0} ctx={ctx} />
                </React.Fragment>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* composer */}
      {(permissions.canReply ?? true) && onAddComment ? (
        <div className="sticky bottom-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3">
          <Composer
            currentUser={currentUser}
            mentionable={mentionable}
            submitLabel="Comment"
            placeholder="Add a comment…"
            onSubmit={addTopLevel}
          />
        </div>
      ) : null}

      {/* SR-only live region for optimistic + copy announcements */}
      <div aria-live="polite" role="status" className="sr-only">
        {liveMessage}
      </div>
    </section>
  );
}

export default CommentThread;
