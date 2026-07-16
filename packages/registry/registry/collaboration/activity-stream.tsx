"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useVisibilityPause,
  formatTimestamp as defaultFormatTimestamp,
  getStatusMeta,
  statusVars,
  formatNumber,
  scrollIntoViewWithin,
  streamItemVariants,
  type StatusTone,
} from "@/lib/motionkit";

/* --------------------------------------------------------------------------
 * ActivityStream — a collaboration activity feed that is more than a dotted
 * timeline. It groups repeated actions (collapse/expand), draws date
 * separators, marks an unread boundary, animates live-arriving items, and
 * filters by event type (and optional actor).
 *
 * Presentation only: the application owns the events array (from any realtime
 * or history source) and, optionally, the filter state. The component holds no
 * data of its own — it renders what it is given. Clean-room original.
 * ----------------------------------------------------------------------- */

export type ActivityEventType =
  | "created"
  | "edited"
  | "commented"
  | "mentioned"
  | "assigned"
  | "approved"
  | "rejected"
  | "uploaded"
  | "published"
  | "archived"
  | "restored"
  | "joined"
  | "left";

export interface ActivityActor {
  /** Stable identity — drives filtering and avatar hue. */
  id: string;
  /** Human name; also the avatar's accessible text. */
  name: string;
  /** Optional avatar image; when absent an initials + hue avatar is generated. */
  avatarUrl?: string;
  /** Optional explicit avatar color (any CSS color). */
  color?: string;
}

export interface ActivityEvent {
  /** Stable id — drives React keys and live-arrival animation. */
  id: string;
  type: ActivityEventType;
  actor: ActivityActor;
  /** What was acted on, e.g. "the onboarding guide". Optional for joined/left. */
  target?: string;
  /** Full verb-phrase override, e.g. "renamed". Falls back to the type's verb. */
  action?: string;
  timestamp: Date | number | string;
  /** Free-form metadata rendered as small chips (or via `renderMetadata`). */
  metadata?: Record<string, string | number>;
  /** Optional short preview/excerpt (e.g. a comment body). */
  preview?: string;
  /** Optional deep link to the target. */
  link?: string;
  /** Optional inline action button label (calls `onEventAction`). */
  actionLabel?: string;
  /** Override the grouping bucket; defaults to actor + type + target. */
  groupKey?: string;
}

export interface ActivityFilters {
  /** Restrict to these event types (empty/undefined = all). */
  types?: ActivityEventType[];
  /** Restrict to a single actor id. */
  actorId?: string;
}

export interface ActivityStreamProps {
  /** Controlled event data, newest-or-oldest order (the component sorts). */
  events: ActivityEvent[];
  /** Custom grouping bucket key. Consecutive equal keys collapse when >= threshold. */
  groupBy?: (event: ActivityEvent) => string;
  /** Number of consecutive same-key events that collapse into one group. 0/1 disables. */
  collapseThreshold?: number;
  /** Controlled filters. When provided the component is filter-controlled. */
  filters?: ActivityFilters;
  /** Initial filters when uncontrolled. */
  defaultFilters?: ActivityFilters;
  /** Called whenever the built-in filter chips change the filters. */
  onFiltersChange?: (filters: ActivityFilters) => void;
  /** Render the built-in event-type filter bar. */
  showFilters?: boolean;
  /** Everything strictly newer than this instant is "unread" (drives the divider). */
  unreadAfter?: Date | number | string;
  /** Called when an event's inline action button is activated. */
  onEventAction?: (event: ActivityEvent) => void;
  /** Custom metadata renderer. */
  renderMetadata?: (event: ActivityEvent) => React.ReactNode;
  /** Override timestamp formatting (defaults to a relative "3m ago"). */
  formatTimestamp?: (value: ActivityEvent["timestamp"]) => string;
  /** Accessible label for the feed list. */
  label?: string;
  /** Max height of the scroll region (px). */
  maxHeight?: number;
  className?: string;
}

/* -- event type metadata ------------------------------------------------- */

interface TypeMeta {
  /** Present-tense verb for a single line: "{actor} {verb} {target}". */
  verb: string;
  /** Plural noun for a group summary: "{count} {plural} by {actor}". */
  plural: string;
  tone: StatusTone;
  /** 24x24 stroke icon path(s). */
  icon: React.ReactNode;
}

const P = (d: string) => (
  <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
);

const TYPE_META: Record<ActivityEventType, TypeMeta> = {
  created: { verb: "created", plural: "new items", tone: "info", icon: P("M12 5v14M5 12h14") },
  edited: { verb: "edited", plural: "edits", tone: "info", icon: P("M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3ZM13.5 6.5l3 3") },
  commented: { verb: "commented on", plural: "comments", tone: "info", icon: P("M4 5h16v10H9l-4 4V5Z") },
  mentioned: { verb: "mentioned you in", plural: "mentions", tone: "active", icon: P("M16 12a4 4 0 1 0-1.2 2.9M16 8v5a2 2 0 0 0 4 0v-1a8 8 0 1 0-3 6.2") },
  assigned: { verb: "assigned", plural: "assignments", tone: "warning", icon: P("M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20a6 6 0 0 1 12 0M17 8v6M14 11h6") },
  approved: { verb: "approved", plural: "approvals", tone: "success", icon: P("M4 12.5 9 17.5 20 6.5") },
  rejected: { verb: "rejected", plural: "rejections", tone: "error", icon: P("M6 6l12 12M18 6 6 18") },
  uploaded: { verb: "uploaded", plural: "uploads", tone: "info", icon: P("M12 16V5M7 10l5-5 5 5M5 19h14") },
  published: { verb: "published", plural: "published items", tone: "success", icon: P("M5 12l14-7-4 15-3.5-5.5L5 12Z") },
  archived: { verb: "archived", plural: "archives", tone: "neutral", icon: P("M4 7h16v3H4V7ZM6 10v9h12v-9M10 13h4") },
  restored: { verb: "restored", plural: "restores", tone: "neutral", icon: P("M5 12a7 7 0 1 1 2 5M5 12V8m0 4h4") },
  joined: { verb: "joined", plural: "joins", tone: "success", icon: P("M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 21a6 6 0 0 1 12 0M17 8v8M21 12h-8") },
  left: { verb: "left", plural: "departures", tone: "neutral", icon: P("M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 21a6 6 0 0 1 12 0M21 8v8M13 12h8") },
};

export const ACTIVITY_TYPES = Object.keys(TYPE_META) as ActivityEventType[];

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

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dayLabel(ms: number, now: number): string {
  const today = startOfDay(now);
  const day = startOfDay(ms);
  const diffDays = Math.round((today - day) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(ms);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(ms);
}

/* -- avatar -------------------------------------------------------------- */

function Avatar({ actor, size = 32 }: { actor: ActivityActor; size?: number }) {
  const h = hueFromString(actor.color ?? actor.id + actor.name);
  const bg = actor.color ?? `linear-gradient(140deg, hsl(${h} 62% 52%), hsl(${(h + 42) % 360} 66% 42%))`;
  if (actor.avatarUrl) {
    return (
      <img
        src={actor.avatarUrl}
        alt={actor.name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover ring-2 ring-[var(--color-surface)] [border:1px_solid_rgba(0,0,0,0.08)]"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={actor.name}
      className="grid shrink-0 select-none place-items-center rounded-full font-semibold text-white ring-2 ring-[var(--color-surface)] [border:1px_solid_rgba(0,0,0,0.08)]"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), background: bg }}
    >
      {initials(actor.name)}
    </span>
  );
}

/** Type badge shown at an avatar's bottom-right. A small tone-tinted disc with a
 *  ring in the surface color so it reads as a clean overlay, not a mixed blob. */
function TypeBadge({ type }: { type: ActivityEventType }) {
  const meta = TYPE_META[type];
  const v = statusVars(meta.tone);
  return (
    <span
      aria-hidden
      className="grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full ring-2 ring-[var(--color-surface)]"
      style={{ color: v.color, background: v.bg }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
        {meta.icon}
      </svg>
    </span>
  );
}

/* -- event line text ----------------------------------------------------- */

function eventSentence(e: ActivityEvent): { verb: string; target?: string } {
  const meta = TYPE_META[e.type];
  return { verb: e.action ?? meta.verb, target: e.target };
}

/* -- row model ----------------------------------------------------------- */

type Row =
  | { kind: "date"; key: string; label: string }
  | { kind: "unread"; key: string; count: number }
  | { kind: "event"; key: string; event: ActivityEvent; unread: boolean }
  | { kind: "group"; key: string; events: ActivityEvent[]; unread: boolean };

/* -- component ----------------------------------------------------------- */

export function ActivityStream({
  events,
  groupBy,
  collapseThreshold = 3,
  filters: filtersProp,
  defaultFilters,
  onFiltersChange,
  showFilters = true,
  unreadAfter,
  onEventAction,
  renderMetadata,
  formatTimestamp,
  label = "Activity",
  maxHeight = 420,
  className,
}: ActivityStreamProps) {
  const reduce = useReducedMotion();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const dividerRef = React.useRef<HTMLLIElement | null>(null);
  const onScreen = useVisibilityPause(rootRef);

  // Stable "now" so relative timestamps and day buckets don't drift on re-render
  // or between SSR and hydration.
  const [now] = React.useState(() => Date.now());

  // Filters: controlled when `filters` is passed, else internal.
  const [internalFilters, setInternalFilters] = React.useState<ActivityFilters>(
    () => defaultFilters ?? {},
  );
  const filters = filtersProp ?? internalFilters;
  const setFilters = React.useCallback(
    (next: ActivityFilters) => {
      if (filtersProp === undefined) setInternalFilters(next);
      onFiltersChange?.(next);
    },
    [filtersProp, onFiltersChange],
  );

  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());
  const toggleGroup = React.useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const boundary = unreadAfter != null ? toMs(unreadAfter) : null;
  const isUnread = React.useCallback(
    (e: ActivityEvent) => boundary != null && toMs(e.timestamp) > boundary,
    [boundary],
  );

  const fmt = formatTimestamp ?? ((v: ActivityEvent["timestamp"]) => defaultFormatTimestamp(v, { relative: true, now }));
  const keyOf = groupBy ?? ((e: ActivityEvent) => e.groupKey ?? `${e.actor.id}::${e.type}::${e.target ?? ""}`);

  // Which event types are actually present — powers the filter bar so it never
  // shows a type the feed can't contain.
  const presentTypes = React.useMemo(() => {
    const set = new Set<ActivityEventType>();
    for (const e of events) set.add(e.type);
    return ACTIVITY_TYPES.filter((t) => set.has(t));
  }, [events]);

  // Filter, then sort newest-first.
  const filtered = React.useMemo(() => {
    const typeSet = filters.types && filters.types.length ? new Set(filters.types) : null;
    return events
      .filter((e) => (typeSet ? typeSet.has(e.type) : true))
      .filter((e) => (filters.actorId ? e.actor.id === filters.actorId : true))
      .slice()
      .sort((a, b) => toMs(b.timestamp) - toMs(a.timestamp));
  }, [events, filters]);

  const unreadCount = React.useMemo(
    () => (boundary == null ? 0 : filtered.reduce((n, e) => (isUnread(e) ? n + 1 : n), 0)),
    [filtered, boundary, isUnread],
  );

  // Build the ordered rows: date separators, unread divider, single events, groups.
  const rows = React.useMemo<Row[]>(() => {
    const out: Row[] = [];
    let lastDay: string | null = null;
    let prevUnread: boolean | null = null;
    let dividerEmitted = false;
    const threshold = collapseThreshold > 1 ? collapseThreshold : Infinity;

    let i = 0;
    while (i < filtered.length) {
      const e = filtered[i];
      const unread = isUnread(e);
      const key = keyOf(e);
      const day = dayLabel(toMs(e.timestamp), now);

      // Collapse a run of consecutive same-key events that share day + read state.
      let j = i + 1;
      while (
        j < filtered.length &&
        keyOf(filtered[j]) === key &&
        isUnread(filtered[j]) === unread &&
        dayLabel(toMs(filtered[j].timestamp), now) === day
      ) {
        j++;
      }
      const run = filtered.slice(i, j);

      // Unread → read transition: drop the divider between the two blocks.
      if (boundary != null && !dividerEmitted && prevUnread === true && unread === false) {
        out.push({ kind: "unread", key: "unread-divider", count: unreadCount });
        dividerEmitted = true;
        lastDay = null; // re-emit the date header under the divider if needed
      }

      if (day !== lastDay) {
        out.push({ kind: "date", key: `date:${day}:${out.length}`, label: day });
        lastDay = day;
      }

      if (run.length >= threshold) {
        out.push({ kind: "group", key: `group:${e.id}`, events: run, unread });
      } else {
        for (const ev of run) out.push({ kind: "event", key: ev.id, event: ev, unread: isUnread(ev) });
      }

      prevUnread = unread;
      i = j;
    }
    return out;
  }, [filtered, keyOf, isUnread, boundary, collapseThreshold, now, unreadCount]);

  const jumpToUnread = React.useCallback(() => {
    const el = dividerRef.current ?? scrollRef.current?.querySelector<HTMLElement>("[data-unread='true']");
    scrollIntoViewWithin(el, { smooth: !reduce });
  }, [reduce]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]",
        className,
      )}
    >
      {/* header */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="text-[14px] font-semibold text-[var(--color-fg)]">{label}</h3>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={jumpToUnread}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-fg)] outline-none hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            {formatNumber(unreadCount)} unread
          </button>
        ) : null}

        {showFilters && presentTypes.length > 1 ? (
          <div className="ml-auto flex flex-wrap items-center gap-1" role="group" aria-label="Filter activity by type">
            <FilterChip
              active={!filters.types || filters.types.length === 0}
              onClick={() => setFilters({ ...filters, types: [] })}
            >
              All
            </FilterChip>
            {presentTypes.map((t) => {
              const active = !!filters.types?.includes(t);
              return (
                <FilterChip
                  key={t}
                  active={active}
                  onClick={() => {
                    const current = filters.types ?? [];
                    const nextTypes = active ? current.filter((x) => x !== t) : [...current, t];
                    setFilters({ ...filters, types: nextTypes });
                  }}
                >
                  {TYPE_META[t].verb.split(" ")[0]}
                </FilterChip>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* scroll region */}
      <div ref={scrollRef} className="overflow-y-auto px-2 py-2" style={{ maxHeight }}>
        {rows.length === 0 ? (
          <p className="px-2 py-8 text-center text-[13px] text-[var(--color-muted)]">
            No activity{filters.types?.length || filters.actorId ? " matches these filters" : " yet"}.
          </p>
        ) : (
          <ul role="list" className="relative">
            <AnimatePresence initial={false}>
              {rows.map((row) => {
                if (row.kind === "date") {
                  return (
                    <li key={row.key} className="sticky top-0 z-10 px-2 py-1.5">
                      <span className="inline-block rounded-full bg-[var(--color-surface)] text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                        {row.label}
                      </span>
                    </li>
                  );
                }
                if (row.kind === "unread") {
                  return (
                    <li
                      key={row.key}
                      ref={dividerRef}
                      aria-label={`New — ${row.count} unread ${row.count === 1 ? "item" : "items"} above`}
                      className="flex items-center gap-2 px-2 py-2"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" aria-hidden />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-accent)]" aria-hidden>
                        New
                      </span>
                      <span className="h-px flex-1 bg-[color-mix(in_oklab,var(--color-accent)_40%,var(--color-border))]" aria-hidden />
                    </li>
                  );
                }
                if (row.kind === "group") {
                  return (
                    <GroupRow
                      key={row.key}
                      row={row}
                      groupKey={row.key}
                      open={expanded.has(row.key)}
                      onToggle={() => toggleGroup(row.key)}
                      reduce={reduce}
                      onScreen={onScreen}
                      fmt={fmt}
                      renderMetadata={renderMetadata}
                      onEventAction={onEventAction}
                    />
                  );
                }
                return (
                  <EventRow
                    key={row.key}
                    event={row.event}
                    unread={row.unread}
                    reduce={reduce}
                    fmt={fmt}
                    renderMetadata={renderMetadata}
                    onEventAction={onEventAction}
                  />
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}

/* -- filter chip --------------------------------------------------------- */

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-1 text-[12px] font-medium capitalize outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
        active
          ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground,white)] [border:1px_solid_var(--color-accent)]"
          : "text-[var(--color-muted)] [border:1px_solid_var(--color-border)] hover:text-[var(--color-fg)]",
      )}
    >
      {children}
    </button>
  );
}

/* -- single event row ---------------------------------------------------- */

function EventBody({
  event,
  fmt,
  renderMetadata,
  onEventAction,
}: {
  event: ActivityEvent;
  fmt: (v: ActivityEvent["timestamp"]) => string;
  renderMetadata?: (event: ActivityEvent) => React.ReactNode;
  onEventAction?: (event: ActivityEvent) => void;
}) {
  const { verb, target } = eventSentence(event);
  return (
    <div className="min-w-0 flex-1">
      <p className="text-[13.5px] leading-snug text-[var(--color-fg)]">
        <span className="font-semibold">{event.actor.name}</span>{" "}
        <span className="text-[var(--color-muted)]">{verb}</span>
        {target ? (
          <>
            {" "}
            {event.link ? (
              <a
                href={event.link}
                className="font-medium text-[var(--color-fg)] underline decoration-[var(--color-border)] underline-offset-2 outline-none hover:decoration-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                {target}
              </a>
            ) : (
              <span className="font-medium text-[var(--color-fg)]">{target}</span>
            )}
          </>
        ) : null}
      </p>

      {event.preview ? (
        <p className="mt-1 line-clamp-2 rounded-lg border-l-2 border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1.5 text-[12.5px] leading-snug text-[var(--color-muted)]">
          {event.preview}
        </p>
      ) : null}

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <time className="text-[12px] text-[var(--color-muted)]" dateTime={new Date(toMs(event.timestamp)).toISOString()}>
          {fmt(event.timestamp)}
        </time>
        {renderMetadata
          ? renderMetadata(event)
          : event.metadata
            ? Object.entries(event.metadata).map(([k, v]) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1 rounded-md bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-[11px] text-[var(--color-muted)] [border:1px_solid_var(--color-border)]"
                >
                  <span className="font-medium text-[var(--color-fg)]">{k}</span>
                  {String(v)}
                </span>
              ))
            : null}
        {event.actionLabel && onEventAction ? (
          <button
            type="button"
            onClick={() => onEventAction(event)}
            className="rounded-md px-1.5 py-0.5 text-[12px] font-medium text-[var(--color-accent)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            {event.actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EventRow({
  event,
  unread,
  reduce,
  fmt,
  renderMetadata,
  onEventAction,
}: {
  event: ActivityEvent;
  unread: boolean;
  reduce: boolean;
  fmt: (v: ActivityEvent["timestamp"]) => string;
  renderMetadata?: (event: ActivityEvent) => React.ReactNode;
  onEventAction?: (event: ActivityEvent) => void;
}) {
  return (
    <motion.li
      layout={!reduce}
      data-unread={unread || undefined}
      initial={reduce ? false : streamItemVariants.initial}
      animate={streamItemVariants.animate}
      exit={reduce ? { opacity: 0 } : streamItemVariants.exit}
      transition={{ duration: 0.26, ease: EASE }}
      className={cn(
        "relative flex gap-3 rounded-xl px-2 py-2",
        unread && "bg-[color-mix(in_oklab,var(--color-accent)_7%,transparent)]",
      )}
    >
      <div className="relative flex flex-col items-center">
        <span className="relative">
          <Avatar actor={event.actor} size={32} />
          <span className="absolute -bottom-1 -right-1">
            <TypeBadge type={event.type} />
          </span>
        </span>
      </div>
      <EventBody event={event} fmt={fmt} renderMetadata={renderMetadata} onEventAction={onEventAction} />
      {unread ? (
        <span className="ml-1 mt-1 inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-[var(--color-accent)]">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
          Unread
        </span>
      ) : null}
    </motion.li>
  );
}

/* -- collapsed group row ------------------------------------------------- */

function GroupRow({
  row,
  groupKey,
  open,
  onToggle,
  reduce,
  onScreen,
  fmt,
  renderMetadata,
  onEventAction,
}: {
  row: Extract<Row, { kind: "group" }>;
  groupKey: string;
  open: boolean;
  onToggle: () => void;
  reduce: boolean;
  onScreen: boolean;
  fmt: (v: ActivityEvent["timestamp"]) => string;
  renderMetadata?: (event: ActivityEvent) => React.ReactNode;
  onEventAction?: (event: ActivityEvent) => void;
}) {
  const { events, unread } = row;
  const first = events[0];
  const meta = TYPE_META[first.type];
  const count = events.length;
  const sharedTarget = events.every((e) => e.target === first.target) ? first.target : undefined;
  const panelId = `${groupKey}-panel`;

  const summary = `${formatNumber(count)} ${meta.plural} by ${first.actor.name}${sharedTarget ? ` on ${sharedTarget}` : ""}`;
  const animate = !reduce && onScreen;

  return (
    <motion.li
      layout={!reduce}
      data-unread={unread || undefined}
      initial={reduce ? false : streamItemVariants.initial}
      animate={streamItemVariants.animate}
      exit={reduce ? { opacity: 0 } : streamItemVariants.exit}
      transition={{ duration: 0.26, ease: EASE }}
      className={cn("rounded-xl", unread && "bg-[color-mix(in_oklab,var(--color-accent)_7%,transparent)]")}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left outline-none hover:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      >
        {/* clustered avatars for the group */}
        <span className="relative flex shrink-0 items-center">
          {events.slice(0, 3).map((e, i) => (
            <span key={e.id} className={cn("relative", i > 0 && "-ml-2.5")} style={{ zIndex: 3 - i }}>
              <Avatar actor={e.actor} size={28} />
            </span>
          ))}
          <span className="absolute -bottom-1 -right-1">
            <TypeBadge type={first.type} />
          </span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-medium leading-snug text-[var(--color-fg)]">{summary}</span>
          <span className="text-[12px] text-[var(--color-muted)]">
            {fmt(events[0].timestamp)} · {fmt(events[count - 1].timestamp)}
          </span>
        </span>

        {unread ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-[var(--color-accent)]">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            Unread
          </span>
        ) : null}

        <motion.svg
          aria-hidden
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0 text-[var(--color-muted)]"
          animate={animate ? { rotate: open ? 180 : 0 } : undefined}
          style={animate ? undefined : { transform: open ? "rotate(180deg)" : "none" }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            key="panel"
            initial={animate ? { height: 0, opacity: 0 } : false}
            animate={animate ? { height: "auto", opacity: 1 } : { opacity: 1 }}
            exit={animate ? { height: 0, opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.24, ease: EASE }}
            className="overflow-hidden"
          >
            <ul role="list" className="ml-4 border-l border-[var(--color-border)] pl-3">
              {events.map((e) => (
                <li key={e.id} className="flex gap-3 py-1.5">
                  <span className="relative mt-0.5">
                    <Avatar actor={e.actor} size={26} />
                    <span className="absolute -bottom-1 -right-1">
                      <TypeBadge type={e.type} />
                    </span>
                  </span>
                  <EventBody event={e} fmt={fmt} renderMetadata={renderMetadata} onEventAction={onEventAction} />
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  );
}

export default ActivityStream;
