"use client";

/* --------------------------------------------------------------------------
 * ProjectTimeline — a presentation-only *time-scaled project timeline* for an
 * app-owned set of milestones, phases, and work items. It is NOT a project-
 * management app, NOT a charting/Gantt library, and NOT a board or a dependency
 * graph: the host application owns the items, their dates, statuses, scheduling,
 * dependency validation, and persistence. This component renders that data along
 * a real time axis and owns only the *reading + light-editing UX* — choosing the
 * time scale (day / week / month), navigating horizontally, jumping to today,
 * collapsing phases, selecting an item and inspecting its date range and
 * relationships, surfacing delayed / blocked work, and (optionally) nudging an
 * item's dates via non-drag keyboard controls.
 *
 * Time → space is computed CLEAN-ROOM in plain JS: every date is projected onto
 * a linear pixel axis (`x = PAD + (ms - domainStart) * pxPerMs`), items are
 * greedily packed into non-overlapping rows within phase lanes, and tick marks
 * are generated deterministically in UTC. Because positions are derived from the
 * app-supplied date constants (no `Date.now()` / `new Date()` for "now" — the
 * current-date marker comes from the `today` prop), the timeline renders
 * identically on the server and in tests. There is NO continuous ambient motion.
 *
 * Distinct from its productivity siblings: KanbanCardMovement is a board-drag
 * layer and TaskDependencyMap is a dependency-depth graph; this component is
 * organised by *time*, not by column or by dependency depth.
 *
 * Accessibility (never pointer-only, never a bare bar chart):
 *  - Every item is a keyboard target with a roving tabindex; arrow keys move
 *    between items along the axis and across lanes, Enter/Space selects.
 *  - A structured, grouped LIST view (also the compact / mobile mode) presents
 *    every item, its status, and its full date range as TEXT with no spatial
 *    interaction, and every action is reachable there.
 *  - The selected item's detail panel states its date range and duration in
 *    words, lists what it depends on / what depends on it as navigable buttons,
 *    and (when the app supplies handlers) offers "move earlier/later" and
 *    "extend/shorten" as an accessible, non-drag alternative to dragging a bar.
 *  - Status is conveyed with an icon + text label, never colour alone; the SVG
 *    dependency connectors are decorative (aria-hidden) — the authoritative
 *    relationship + schedule information is textual.
 *  - Focus is preserved across scale changes, moves, and optimistic rollback.
 *
 * Clean-room original.
 * ----------------------------------------------------------------------- */

import * as React from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useControllableState,
  useOptimisticAction,
  statusVars,
  type StatusTone,
} from "@/lib/motiq";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type TimelineItemType = "phase" | "task" | "milestone" | "release" | "event";

export type TimelineItemStatus =
  | "planned"
  | "active"
  | "blocked"
  | "completed"
  | "delayed"
  | "cancelled";

export type TimelinePriority = "low" | "normal" | "high" | "urgent";

export type TimelineScale = "day" | "week" | "month";

export type TimelineMode = "timeline" | "list";

/** A date as an app-owned constant. Strings are parsed as UTC (deterministic). */
export type TimelineDate = string | number | Date;

export interface TimelineItem {
  /** Stable id — referenced by `dependencyIds`, selection, and every callback. */
  id: string;
  /** Item title (the accessible name of the bar / row). */
  title: string;
  /** Item kind. `milestone`/`release` render as a point marker, others as bars. */
  type: TimelineItemType;
  /** Start of the item on the time axis (app-owned). */
  startDate: TimelineDate;
  /** End of the item (equal to `startDate` for a point/milestone). */
  endDate: TimelineDate;
  /** Lifecycle status (app-owned). Rendered with an icon + text, never colour alone. */
  status: TimelineItemStatus;
  /** Completion ratio 0..1 — drawn as a fill and stated as a percentage. */
  progress?: number;
  /** Phase / workstream id — drives the horizontal lanes (see `groups`). */
  group?: string;
  /** Marks a key item (diamond marker) even if it has a duration. */
  milestone?: boolean;
  /** Ids of the items this one depends on (indicated, not validated, here). */
  dependencyIds?: string[];
  assignee?: string;
  priority?: TimelinePriority;
  /** Arbitrary passthrough (e.g. `{ note: "…" }` shown for delayed/blocked work). */
  metadata?: Record<string, unknown>;
}

export interface TimelineGroup {
  /** Stable id — matched against `item.group`. */
  id: string;
  /** Human lane label. */
  name: string;
}

/** Context handed to `renderItem` / `renderDetails`. */
export interface TimelineRenderContext {
  selected: boolean;
  /** Direct prerequisites (items this one depends on). */
  dependencies: TimelineItem[];
  /** Direct dependents (items that depend on this one). */
  dependents: TimelineItem[];
  /** Start/end in ms after any optimistic move/resize. */
  startMs: number;
  endMs: number;
}

export interface ProjectTimelineProps {
  /** All items (app-owned). */
  items: TimelineItem[];
  /** Ordered lanes. Absent → derived from the items' `group` values. */
  groups?: TimelineGroup[];
  /**
   * The current date, used only to draw the "Today" marker and to power
   * jump-to-today. Passed in (never read from the clock) so the timeline is
   * deterministic. Absent → no marker is drawn.
   */
  today?: TimelineDate;

  /** Controlled time scale. */
  scale?: TimelineScale;
  /** Uncontrolled initial scale. */
  defaultScale?: TimelineScale;
  /** Notified when the scale (zoom level) changes. */
  onScaleChange?: (scale: TimelineScale) => void;

  /** Controlled selection. */
  selectedItemId?: string | null;
  /** Uncontrolled initial selection. */
  defaultSelectedItemId?: string | null;
  /** Notified when the selected item changes (null when cleared). */
  onSelectedItemChange?: (itemId: string | null) => void;

  /** Controlled view mode. `list` is the compact / mobile fallback. */
  mode?: TimelineMode;
  /** Uncontrolled initial mode. */
  defaultMode?: TimelineMode;
  /** Notified when the view mode changes. */
  onModeChange?: (mode: TimelineMode) => void;
  /** Force the compact list view regardless of `mode` (mobile / tests). */
  compact?: boolean;

  /**
   * Move an item to a new [start, end] (ms). May return a Promise for optimistic
   * movement: the bar shifts immediately and rolls back if it rejects. The app
   * owns validation + persistence.
   */
  onMove?: (itemId: string, startMs: number, endMs: number) => void | Promise<unknown>;
  /** Resize an item to a new [start, end] (ms). Same optimistic contract. */
  onResize?: (itemId: string, startMs: number, endMs: number) => void | Promise<unknown>;
  /** Units an item moves/resizes per keyboard nudge (in scale units). Default 1. */
  nudgeUnits?: number;

  /** App-owned loading state — renders skeleton lanes. */
  loading?: boolean;
  /** Body for the empty state (no items). */
  empty?: React.ReactNode;

  /** Override an item bar's body. */
  renderItem?: (item: TimelineItem, ctx: TimelineRenderContext) => React.ReactNode;
  /** Override the detail-panel body. */
  renderDetails?: (item: TimelineItem, ctx: TimelineRenderContext) => React.ReactNode;

  /** Accessible label for the region. */
  label?: string;
  /** Force reduced motion (demos/tests). */
  reducedMotion?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Status + type metadata (icon + text — never colour alone)                  */
/* -------------------------------------------------------------------------- */

const P = (d: string) => (
  <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
);

const STATUS_META: Record<
  TimelineItemStatus,
  { label: string; tone: StatusTone; icon: React.ReactNode }
> = {
  planned: { label: "Planned", tone: "neutral", icon: P("M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z") },
  active: { label: "In progress", tone: "active", icon: P("M12 3a9 9 0 1 0 9 9M12 7v5l3 2") },
  blocked: {
    label: "Blocked",
    tone: "error",
    icon: P("M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"),
  },
  completed: { label: "Completed", tone: "success", icon: P("M4 12.5 9 17.5 20 6.5") },
  delayed: {
    label: "Delayed",
    tone: "warning",
    icon: P("M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM19 4l2 2"),
  },
  cancelled: { label: "Cancelled", tone: "neutral", icon: P("M6 6l12 12M18 6 6 18") },
};

const TYPE_LABEL: Record<TimelineItemType, string> = {
  phase: "Phase",
  task: "Task",
  milestone: "Milestone",
  release: "Release",
  event: "Event",
};

function StatusIcon({ status, size = 13 }: { status: TimelineItemStatus; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {STATUS_META[status].icon}
    </svg>
  );
}

function StatusPill({ status, size = "md" }: { status: TimelineItemStatus; size?: "sm" | "md" }) {
  const meta = STATUS_META[status];
  const v = statusVars(meta.tone);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold [border:1px_solid]",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-[12px]",
      )}
      style={{ color: v.color, background: v.bg, borderColor: v.border }}
    >
      <StatusIcon status={status} size={size === "sm" ? 11 : 12} />
      {meta.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Deterministic time helpers (UTC — no clock reads, no TZ drift in tests)    */
/* -------------------------------------------------------------------------- */

const DAY = 86_400_000;

function toMs(value: TimelineDate): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  const d = new Date(value);
  return d.getTime();
}

function fmtDate(ms: number, opts: Intl.DateTimeFormatOptions): string {
  if (Number.isNaN(ms)) return "";
  return new Intl.DateTimeFormat(undefined, { timeZone: "UTC", ...opts }).format(new Date(ms));
}

/** "Jul 14" */
const shortDate = (ms: number) => fmtDate(ms, { month: "short", day: "numeric" });
/** "Jul 14, 2026" */
const longDate = (ms: number) => fmtDate(ms, { month: "short", day: "numeric", year: "numeric" });

/** Whole-day duration (inclusive-ish), always ≥ 1 for a real span. */
function durationDays(startMs: number, endMs: number): number {
  return Math.max(0, Math.round((endMs - startMs) / DAY));
}

function rangeText(item: TimelineItem, startMs: number, endMs: number): string {
  if (isPoint(item)) return longDate(startMs);
  const days = durationDays(startMs, endMs);
  return `${shortDate(startMs)} – ${longDate(endMs)} · ${days} day${days === 1 ? "" : "s"}`;
}

function isPoint(item: TimelineItem): boolean {
  return item.type === "milestone" || item.type === "release" || item.milestone === true;
}

interface ScaleConfig {
  label: string;
  /** One keyboard-nudge / grid unit in ms. */
  unitMs: number;
  /** Pixels per millisecond for the axis projection. */
  pxPerMs: number;
  /** Tick generation strategy. */
  tick: "day" | "week" | "month";
}

const SCALES: Record<TimelineScale, ScaleConfig> = {
  day: { label: "Day", unitMs: DAY, pxPerMs: 52 / DAY, tick: "day" },
  week: { label: "Week", unitMs: 7 * DAY, pxPerMs: 116 / (7 * DAY), tick: "week" },
  month: { label: "Month", unitMs: 30 * DAY, pxPerMs: 150 / (30.4375 * DAY), tick: "month" },
};

const SCALE_ORDER: TimelineScale[] = ["day", "week", "month"];

const floorDay = (ms: number) => Math.floor(ms / DAY) * DAY;

interface Tick {
  ms: number;
  label: string;
}

function buildTicks(domainStart: number, domainEnd: number, cfg: ScaleConfig): Tick[] {
  const ticks: Tick[] = [];
  if (cfg.tick === "month") {
    const d = new Date(domainStart);
    let y = d.getUTCFullYear();
    let m = d.getUTCMonth();
    let cur = Date.UTC(y, m, 1);
    let guard = 0;
    while (cur <= domainEnd && guard++ < 240) {
      ticks.push({ ms: cur, label: fmtDate(cur, { month: "short", year: "2-digit" }) });
      m += 1;
      if (m > 11) { m = 0; y += 1; }
      cur = Date.UTC(y, m, 1);
    }
    return ticks;
  }
  const step = cfg.tick === "week" ? 7 * DAY : DAY;
  let cur = floorDay(domainStart);
  let guard = 0;
  while (cur <= domainEnd && guard++ < 400) {
    ticks.push({ ms: cur, label: shortDate(cur) });
    cur += step;
  }
  return ticks;
}

/* -------------------------------------------------------------------------- */
/* Layout constants                                                           */
/* -------------------------------------------------------------------------- */

const PAD_X = 20;
const AXIS_H = 34;
const LANE_HEADER_H = 28;
const ROW_H = 42;
const BAR_H = 28;
const LANE_GAP = 10;
const MIN_BAR_W = 60;
const POINT_W = 128; // reserved slot width for a milestone marker + its label

interface Positioned {
  id: string;
  x: number;
  w: number;
  y: number;
  point: boolean;
}
interface Lane {
  id: string;
  name: string;
  headerY: number;
  rows: number;
  count: number;
  collapsed: boolean;
}
interface LayoutResult {
  nodes: Positioned[];
  nodeById: Map<string, Positioned>;
  lanes: Lane[];
  width: number;
  height: number;
  domainStart: number;
  domainEnd: number;
  ticks: Tick[];
}

function buildLayout(
  items: TimelineItem[],
  laneOrder: { id: string; name: string }[],
  groupOf: (id: string) => string,
  posOf: (id: string) => { start: number; end: number },
  cfg: ScaleConfig,
  collapsed: Set<string>,
): LayoutResult {
  const nodes: Positioned[] = [];
  const nodeById = new Map<string, Positioned>();
  const lanes: Lane[] = [];

  // Domain from the (optimistic) positions, padded by ~a unit on each side.
  let min = Infinity;
  let max = -Infinity;
  for (const it of items) {
    const p = posOf(it.id);
    min = Math.min(min, p.start);
    max = Math.max(max, p.end);
  }
  if (!Number.isFinite(min)) { min = 0; max = DAY; }
  const pad = cfg.unitMs;
  const domainStart = floorDay(min - pad);
  const domainEnd = max + pad;
  const x = (ms: number) => PAD_X + (ms - domainStart) * cfg.pxPerMs;
  const minSlotMs = MIN_BAR_W / cfg.pxPerMs;

  const byLane = new Map<string, TimelineItem[]>();
  for (const it of items) {
    const g = groupOf(it.id);
    const arr = byLane.get(g) ?? [];
    arr.push(it);
    byLane.set(g, arr);
  }

  let cursorY = AXIS_H + 4;
  for (const lane of laneOrder) {
    const laneItems = (byLane.get(lane.id) ?? []).slice().sort((a, b) => posOf(a.id).start - posOf(b.id).start);
    if (laneItems.length === 0) continue;

    const isCollapsed = collapsed.has(lane.id);
    const headerY = cursorY;
    cursorY += LANE_HEADER_H;

    let rows = 0;
    if (!isCollapsed) {
      const rowEnds: number[] = []; // last occupied ms per row
      for (const it of laneItems) {
        const p = posOf(it.id);
        const point = isPoint(it);
        const slotStart = point ? p.start - minSlotMs / 2 : p.start;
        const slotEnd = point ? p.start + minSlotMs / 2 : Math.max(p.end, p.start + minSlotMs);
        let row = rowEnds.findIndex((end) => end <= slotStart);
        if (row === -1) { row = rowEnds.length; rowEnds.push(slotEnd); }
        else rowEnds[row] = slotEnd;

        const node: Positioned = {
          id: it.id,
          x: point ? x(p.start) - POINT_W / 2 : x(p.start),
          w: point ? POINT_W : Math.max(MIN_BAR_W, (p.end - p.start) * cfg.pxPerMs),
          y: cursorY + row * ROW_H,
          point,
        };
        nodes.push(node);
        nodeById.set(it.id, node);
        rows = Math.max(rows, row + 1);
      }
      cursorY += rows * ROW_H;
    }

    lanes.push({ id: lane.id, name: lane.name, headerY, rows, count: laneItems.length, collapsed: isCollapsed });
    cursorY += LANE_GAP;
  }

  const ticks = buildTicks(domainStart, domainEnd, cfg);
  const width = Math.max(PAD_X * 2 + 200, x(domainEnd) + PAD_X);
  const height = Math.max(AXIS_H + ROW_H, cursorY);
  return { nodes, nodeById, lanes, width, height, domainStart, domainEnd, ticks };
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

const UNGROUPED = "__ungrouped__";

export function ProjectTimeline({
  items,
  groups,
  today,
  scale,
  defaultScale = "week",
  onScaleChange,
  selectedItemId,
  defaultSelectedItemId = null,
  onSelectedItemChange,
  mode,
  defaultMode = "timeline",
  onModeChange,
  compact = false,
  onMove,
  onResize,
  nudgeUnits = 1,
  loading = false,
  empty,
  renderItem,
  renderDetails,
  label = "Project timeline",
  reducedMotion,
  className,
}: ProjectTimelineProps) {
  const mediaReduced = useReducedMotion();
  const reduced = reducedMotion ?? mediaReduced;

  const [currentScale, setScale] = useControllableState<TimelineScale>({
    value: scale,
    defaultValue: defaultScale,
    onChange: onScaleChange,
  });
  const [selected, setSelected] = useControllableState<string | null>({
    value: selectedItemId,
    defaultValue: defaultSelectedItemId,
    onChange: onSelectedItemChange,
  });
  const [viewMode, setMode] = useControllableState<TimelineMode>({
    value: mode,
    defaultValue: defaultMode,
    onChange: onModeChange,
  });

  const [collapsed, setCollapsed] = React.useState<Set<string>>(() => new Set());
  const [statusFilter, setStatusFilter] = React.useState<Set<TimelineItemStatus>>(() => new Set());
  const [announcement, setAnnouncement] = React.useState("");
  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  const [focusToken, setFocusToken] = React.useState(0);

  const announce = React.useCallback((msg: string) => setAnnouncement(msg), []);
  const cfg = SCALES[currentScale];

  /* -- derived indexes ------------------------------------------------ */
  const byId = React.useMemo(() => new Map(items.map((t) => [t.id, t])), [items]);

  const dependentsMap = React.useMemo(() => {
    const out = new Map<string, string[]>();
    for (const it of items) out.set(it.id, []);
    for (const it of items) {
      for (const dep of it.dependencyIds ?? []) {
        if (byId.has(dep)) out.get(dep)!.push(it.id);
      }
    }
    return out;
  }, [items, byId]);

  /* -- optimistic positions (move / resize with rollback) ------------- */
  const committedPos = React.useMemo(() => {
    const m: Record<string, { start: number; end: number }> = {};
    for (const it of items) m[it.id] = { start: toMs(it.startDate), end: toMs(it.endDate) };
    return m;
  }, [items]);
  const posAction = useOptimisticAction<Record<string, { start: number; end: number }>>(committedPos);
  const posOf = React.useCallback(
    (id: string) => posAction.value[id] ?? committedPos[id] ?? { start: 0, end: 0 },
    [posAction.value, committedPos],
  );

  /* -- lane order ----------------------------------------------------- */
  const laneOrder = React.useMemo(() => {
    const seen = new Set<string>();
    const order: { id: string; name: string }[] = [];
    if (groups) for (const g of groups) { order.push({ id: g.id, name: g.name }); seen.add(g.id); }
    for (const it of items) {
      const g = it.group ?? UNGROUPED;
      if (!seen.has(g)) { seen.add(g); order.push({ id: g, name: g === UNGROUPED ? "Ungrouped" : g }); }
    }
    return order;
  }, [groups, items]);
  const groupOf = React.useCallback((id: string) => byId.get(id)?.group ?? UNGROUPED, [byId]);
  const groupName = React.useCallback(
    (id: string) => laneOrder.find((l) => l.id === id)?.name ?? (id === UNGROUPED ? "Ungrouped" : id),
    [laneOrder],
  );

  const layout = React.useMemo(
    () => buildLayout(items, laneOrder, groupOf, posOf, cfg, collapsed),
    [items, laneOrder, groupOf, posOf, cfg, collapsed],
  );

  /* -- relationship lookups ------------------------------------------- */
  const dependenciesOf = React.useCallback(
    (id: string): TimelineItem[] =>
      (byId.get(id)?.dependencyIds ?? []).map((d) => byId.get(d)).filter(Boolean) as TimelineItem[],
    [byId],
  );
  const dependentsOf = React.useCallback(
    (id: string): TimelineItem[] =>
      (dependentsMap.get(id) ?? []).map((d) => byId.get(d)).filter(Boolean) as TimelineItem[],
    [dependentsMap, byId],
  );
  const renderCtx = React.useCallback(
    (id: string): TimelineRenderContext => {
      const p = posOf(id);
      return {
        selected: selected === id,
        dependencies: dependenciesOf(id),
        dependents: dependentsOf(id),
        startMs: p.start,
        endMs: p.end,
      };
    },
    [selected, dependenciesOf, dependentsOf, posOf],
  );

  /* -- focus management ----------------------------------------------- */
  const nodeRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const rowRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const pendingFocus = React.useRef<string | null>(null);

  const focusItem = React.useCallback((id: string) => {
    pendingFocus.current = id;
    setFocusToken((t) => t + 1);
  }, []);
  React.useEffect(() => {
    const id = pendingFocus.current;
    if (id == null) return;
    pendingFocus.current = null;
    (nodeRefs.current.get(id) ?? rowRefs.current.get(id))?.focus();
  }, [focusToken, layout]);

  const selectItem = React.useCallback(
    (id: string | null, opts: { focus?: boolean; announce?: boolean } = {}) => {
      setSelected(id);
      setFocusedId(id);
      if (id) {
        const it = byId.get(id);
        const p = posOf(id);
        if (opts.announce !== false && it) {
          const deps = dependenciesOf(id);
          announce(
            `${it.title} selected. ${STATUS_META[it.status].label}. ${rangeText(it, p.start, p.end)}.` +
              (deps.length ? ` Depends on ${deps.length} item${deps.length === 1 ? "" : "s"}.` : ""),
          );
        }
        if (opts.focus) focusItem(id);
      }
    },
    [setSelected, byId, posOf, dependenciesOf, announce, focusItem],
  );

  /* -- scale change keeps the selected item in view + focus ----------- */
  const changeScale = React.useCallback(
    (next: TimelineScale) => {
      if (next === currentScale) return;
      setScale(next);
      announce(`Scale: ${SCALES[next].label}.`);
      if (focusedId) focusItem(focusedId);
    },
    [currentScale, setScale, announce, focusedId, focusItem],
  );

  /* -- horizontal navigation ------------------------------------------ */
  const scrollByViewport = React.useCallback((dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "auto" });
  }, []);

  const jumpToToday = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el || today == null) return;
    const markerX = PAD_X + (toMs(today) - layout.domainStart) * cfg.pxPerMs;
    el.scrollTo({ left: Math.max(0, markerX - el.clientWidth / 2), behavior: "auto" });
    announce("Jumped to today.");
  }, [today, layout.domainStart, cfg.pxPerMs, announce]);

  /* -- optimistic move / resize (non-drag, app-owned) ----------------- */
  const prevPhase = React.useRef(posAction.phase);
  React.useEffect(() => {
    if (prevPhase.current === "pending" && posAction.phase === "error") {
      if (selected) focusItem(selected);
      announce(`Change failed. ${posAction.error ?? "The item returned to its dates."}`);
    }
    prevPhase.current = posAction.phase;
  }, [posAction.phase, posAction.error, selected, focusItem, announce]);

  const applyDates = React.useCallback(
    (id: string, start: number, end: number, verb: string, handler?: (id: string, s: number, e: number) => void | Promise<unknown>) => {
      if (!handler) return;
      const next = { ...committedPos, [id]: { start, end } };
      announce(`${byId.get(id)?.title ?? "Item"} ${verb}: ${shortDate(start)} – ${shortDate(end)}.`);
      focusItem(id);
      void posAction.commit(next, async () => { await handler(id, start, end); });
    },
    [committedPos, byId, announce, focusItem, posAction],
  );

  const moveBy = React.useCallback(
    (id: string, units: number) => {
      const p = posOf(id);
      const delta = units * cfg.unitMs;
      applyDates(id, p.start + delta, p.end + delta, "moved", onMove);
    },
    [posOf, cfg.unitMs, applyDates, onMove],
  );
  const resizeBy = React.useCallback(
    (id: string, units: number) => {
      const p = posOf(id);
      const nextEnd = Math.max(p.start + cfg.unitMs, p.end + units * cfg.unitMs);
      applyDates(id, p.start, nextEnd, "resized", onResize);
    },
    [posOf, cfg.unitMs, applyDates, onResize],
  );

  /* -- roving keyboard nav in the timeline ---------------------------- */
  const onNodeKeyDown = React.useCallback(
    (e: React.KeyboardEvent, id: string) => {
      const key = e.key;
      if (key === "Enter" || key === " " || key === "Spacebar") {
        e.preventDefault();
        selectItem(id, { focus: false });
        return;
      }
      if (!key.startsWith("Arrow")) return;
      const cur = layout.nodeById.get(id);
      if (!cur) return;
      e.preventDefault();
      const nodes = layout.nodes;
      let target: Positioned | null = null;
      if (key === "ArrowLeft" || key === "ArrowRight") {
        const dir = key === "ArrowRight" ? 1 : -1;
        // Nearest node in reading order along the axis (prefer same lane row).
        const cand = nodes
          .filter((n) => n.id !== id && (dir > 0 ? n.x >= cur.x : n.x <= cur.x))
          .sort((a, b) => {
            const da = Math.abs(a.y - cur.y) * 4 + Math.abs(a.x - cur.x);
            const db = Math.abs(b.y - cur.y) * 4 + Math.abs(b.x - cur.x);
            return da - db;
          });
        target = cand.find((n) => (dir > 0 ? n.x > cur.x : n.x < cur.x)) ?? cand[0] ?? null;
      } else {
        const dir = key === "ArrowDown" ? 1 : -1;
        const cand = nodes
          .filter((n) => n.id !== id && (dir > 0 ? n.y > cur.y : n.y < cur.y))
          .sort((a, b) => {
            const da = Math.abs(a.y - cur.y) + Math.abs(a.x - cur.x) * 0.2;
            const db = Math.abs(b.y - cur.y) + Math.abs(b.x - cur.x) * 0.2;
            return da - db;
          });
        target = cand[0] ?? null;
      }
      if (target) { setFocusedId(target.id); focusItem(target.id); }
    },
    [layout, selectItem, focusItem],
  );

  const toggleGroup = React.useCallback(
    (id: string) => {
      setCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        announce(`${groupName(id)} ${next.has(id) ? "collapsed" : "expanded"}.`);
        return next;
      });
    },
    [groupName, announce],
  );

  const toggleStatusFilter = React.useCallback((status: TimelineItemStatus) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status); else next.add(status);
      return next;
    });
  }, []);
  const matchesFilter = React.useCallback(
    (status: TimelineItemStatus) => statusFilter.size === 0 || statusFilter.has(status),
    [statusFilter],
  );

  const presentStatuses = React.useMemo(() => {
    const set = new Set<TimelineItemStatus>();
    for (const it of items) set.add(it.status);
    return (Object.keys(STATUS_META) as TimelineItemStatus[]).filter((s) => set.has(s));
  }, [items]);

  const rovingId = focusedId ?? selected ?? layout.nodes[0]?.id ?? null;
  const selectedItem = selected ? byId.get(selected) ?? null : null;
  const showList = compact || viewMode === "list";
  const isEmpty = !loading && items.length === 0;

  const markerX =
    today != null ? PAD_X + (toMs(today) - layout.domainStart) * cfg.pxPerMs : null;
  const markerVisible = markerX != null && markerX >= PAD_X && markerX <= layout.width - PAD_X + 1;

  /* -------------------------------------------------------------------- */
  return (
    <section
      aria-label={label}
      className={cn(
        "flex w-full flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3",
        className,
      )}
    >
      {/* toolbar: scale, today, view toggle, status filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Time scale" className="inline-flex rounded-lg p-0.5 [border:1px_solid_var(--color-border)] bg-[var(--color-surface)]">
          {SCALE_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={currentScale === s}
              onClick={() => changeScale(s)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[12.5px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
                currentScale === s ? "bg-[var(--color-bg-secondary)] text-[var(--color-fg)] [box-shadow:0_1px_2px_rgba(0,0,0,0.08)]" : "text-[var(--color-muted)] hover:text-[var(--color-fg)]",
              )}
            >
              {SCALES[s].label}
            </button>
          ))}
        </div>

        {today != null ? (
          <button
            type="button"
            onClick={jumpToToday}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>{P("M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z")}</svg>
            Today
          </button>
        ) : null}

        {!showList ? (
          <div role="group" aria-label="Navigate timeline" className="inline-flex gap-1">
            <button type="button" aria-label="Scroll to earlier dates" onClick={() => scrollByViewport(-1)} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>{P("m15 18-6-6 6-6")}</svg>
            </button>
            <button type="button" aria-label="Scroll to later dates" onClick={() => scrollByViewport(1)} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>{P("m9 18 6-6-6-6")}</svg>
            </button>
          </div>
        ) : null}

        <button
          type="button"
          aria-pressed={showList}
          aria-label={showList ? "Switch to timeline view" : "Switch to list view"}
          onClick={() => setMode(viewMode === "list" ? "timeline" : "list")}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          {showList ? "Timeline view" : "List view"}
        </button>
      </div>

      {presentStatuses.length > 1 ? (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by status">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Filter</span>
          {presentStatuses.map((s) => {
            const on = statusFilter.has(s);
            const v = statusVars(STATUS_META[s].tone);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => toggleStatusFilter(s)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] [border:1px_solid_var(--color-border)]",
                  on ? "text-[var(--color-fg)]" : "text-[var(--color-muted)]",
                )}
                style={on ? { background: v.bg, borderColor: v.border, color: v.color } : undefined}
              >
                <StatusIcon status={s} size={11} />
                {STATUS_META[s].label}
              </button>
            );
          })}
          {statusFilter.size > 0 ? (
            <button
              type="button"
              onClick={() => setStatusFilter(new Set())}
              className="rounded-full px-2 py-0.5 text-[11.5px] font-medium text-[var(--color-accent)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row">
        {/* primary view */}
        <div className="min-w-0 flex-1">
          {loading ? (
            <TimelineSkeleton />
          ) : isEmpty ? (
            <div className="grid min-h-[160px] place-items-center rounded-xl bg-[var(--color-surface)] p-6 text-center text-[13px] text-[var(--color-muted)] [border:1px_dashed_var(--color-border)]">
              {empty ?? "No items scheduled yet."}
            </div>
          ) : showList ? (
            <ListView
              items={items}
              laneOrder={laneOrder}
              groupOf={groupOf}
              posOf={posOf}
              selected={selected}
              matchesFilter={matchesFilter}
              onSelect={(id) => selectItem(id)}
              registerRow={(id, el) => { if (el) rowRefs.current.set(id, el); else rowRefs.current.delete(id); }}
            />
          ) : (
            <TimelineView
              layout={layout}
              byId={byId}
              posOf={posOf}
              cfg={cfg}
              selected={selected}
              rovingId={rovingId}
              matchesFilter={matchesFilter}
              reduced={reduced}
              renderItem={renderItem}
              renderCtx={renderCtx}
              onNodeKeyDown={onNodeKeyDown}
              onNodeClick={(id) => selectItem(id, { focus: false })}
              onNodeFocus={(id) => setFocusedId(id)}
              onToggleGroup={toggleGroup}
              groupName={groupName}
              markerX={markerVisible ? markerX : null}
              scrollRef={scrollRef}
              registerNode={(id, el) => { if (el) nodeRefs.current.set(id, el); else nodeRefs.current.delete(id); }}
            />
          )}
        </div>

        {/* detail panel — available in both timeline and list modes */}
        {!isEmpty && !loading ? (
          <div className="w-full shrink-0 lg:w-[320px]">
            {selectedItem ? (
              <ItemDetail
                item={selectedItem}
                ctx={renderCtx(selectedItem.id)}
                groupName={groupName}
                groupOf={groupOf}
                reduced={reduced}
                renderDetails={renderDetails}
                onNavigate={(id) => selectItem(id, { focus: true })}
                onMove={onMove ? (dir) => moveBy(selectedItem.id, dir * nudgeUnits) : undefined}
                onResize={onResize && !isPoint(selectedItem) ? (dir) => resizeBy(selectedItem.id, dir * nudgeUnits) : undefined}
                unitLabel={cfg.label.toLowerCase()}
                busy={posAction.optimistic}
              />
            ) : (
              <div className="grid h-full min-h-[160px] place-items-center rounded-xl bg-[var(--color-surface)] p-4 text-center text-[12.5px] text-[var(--color-muted)] [border:1px_dashed_var(--color-border)]">
                Select an item to see its dates, status, and dependencies.
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* polite live region */}
      <span
        role="status"
        aria-live="polite"
        className="sr-only"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}
      >
        {announcement}
      </span>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Timeline view                                                              */
/* -------------------------------------------------------------------------- */

interface TimelineViewProps {
  layout: LayoutResult;
  byId: Map<string, TimelineItem>;
  posOf: (id: string) => { start: number; end: number };
  cfg: ScaleConfig;
  selected: string | null;
  rovingId: string | null;
  matchesFilter: (s: TimelineItemStatus) => boolean;
  reduced: boolean;
  renderItem?: (item: TimelineItem, ctx: TimelineRenderContext) => React.ReactNode;
  renderCtx: (id: string) => TimelineRenderContext;
  onNodeKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onNodeClick: (id: string) => void;
  onNodeFocus: (id: string) => void;
  onToggleGroup: (id: string) => void;
  groupName: (id: string) => string;
  markerX: number | null;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  registerNode: (id: string, el: HTMLButtonElement | null) => void;
}

function TimelineView({
  layout, byId, cfg, selected, rovingId, matchesFilter, reduced,
  renderItem, renderCtx, onNodeKeyDown, onNodeClick, onNodeFocus, onToggleGroup,
  markerX, scrollRef, registerNode,
}: TimelineViewProps) {
  const { nodes, nodeById, lanes, width, height, ticks, domainStart } = layout;
  const x = (ms: number) => PAD_X + (ms - domainStart) * cfg.pxPerMs;

  // Dependency connectors for the selected item only (decorative, aria-hidden).
  const connectors = React.useMemo(() => {
    if (!selected) return [];
    const to = nodeById.get(selected);
    if (!to) return [];
    const out: { key: string; d: string }[] = [];
    for (const depId of byId.get(selected)?.dependencyIds ?? []) {
      const from = nodeById.get(depId);
      if (!from) continue;
      const x1 = from.x + from.w;
      const y1 = from.y + BAR_H / 2;
      const x2 = to.x;
      const y2 = to.y + BAR_H / 2;
      const mx = x1 + Math.max(16, (x2 - x1) / 2);
      out.push({ key: `${depId}->${selected}`, d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}` });
    }
    return out;
  }, [selected, nodeById, byId]);

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto rounded-xl bg-[var(--color-surface)] [border:1px_solid_var(--color-border)]"
    >
      <div className="relative" style={{ width, height, minWidth: "100%" }}>
        {/* axis grid + labels */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {ticks.map((t) => (
            <div key={t.ms} className="absolute top-0 bottom-0" style={{ left: x(t.ms) }}>
              <div className="absolute top-0 bottom-0 w-px bg-[var(--color-border)] opacity-50" />
              <span className="absolute top-1.5 left-1 whitespace-nowrap text-[10.5px] font-medium text-[var(--color-muted)]">
                {t.label}
              </span>
            </div>
          ))}
        </div>

        {/* today marker */}
        {markerX != null ? (
          <div className="pointer-events-none absolute top-0 bottom-0" style={{ left: markerX }} aria-hidden>
            <div className="absolute top-0 bottom-0 w-[2px] bg-[var(--color-accent)] opacity-70" />
            <span className="absolute top-1 left-1 rounded px-1 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]" style={{ background: statusVars("active").bg }}>
              Today
            </span>
          </div>
        ) : null}

        {/* dependency connectors (selected only) */}
        {connectors.length > 0 ? (
          <svg aria-hidden className="pointer-events-none absolute inset-0" width={width} height={height} style={{ overflow: "visible" }}>
            <defs>
              <marker id="mk-tl-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" fill="var(--color-accent)" />
              </marker>
            </defs>
            {connectors.map((c) => (
              <path key={c.key} d={c.d} fill="none" stroke="var(--color-accent)" strokeWidth={1.75} opacity={0.75} markerEnd="url(#mk-tl-arrow)" />
            ))}
          </svg>
        ) : null}

        {/* lane headers */}
        {lanes.map((lane) => (
          <div key={lane.id} className="absolute left-0 right-0" style={{ top: lane.headerY }}>
            <button
              type="button"
              aria-expanded={!lane.collapsed}
              onClick={() => onToggleGroup(lane.id)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-surface)] px-1.5 py-0.5 text-[12px] font-semibold text-[var(--color-fg)] outline-none transition-colors hover:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              style={{ position: "sticky", left: 8 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden style={{ transform: lane.collapsed ? "rotate(-90deg)" : "none", transition: reduced ? undefined : "transform 160ms" }}>
                {P("m6 9 6 6 6-6")}
              </svg>
              {lane.name}
              {lane.collapsed ? (
                <span className="rounded-full bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
                  {lane.count} hidden
                </span>
              ) : null}
            </button>
          </div>
        ))}

        {/* item bars / markers */}
        {nodes.map((n) => {
          const item = byId.get(n.id);
          if (!item) return null;
          return (
            <TimelineBar
              key={n.id}
              item={item}
              node={n}
              ctx={renderCtx(n.id)}
              selected={selected === n.id}
              roving={rovingId === n.id}
              dimmed={!matchesFilter(item.status)}
              reduced={reduced}
              renderItem={renderItem}
              onKeyDown={onNodeKeyDown}
              onClick={onNodeClick}
              onFocus={onNodeFocus}
              registerNode={registerNode}
            />
          );
        })}

        {nodes.length === 0 ? (
          <p className="absolute left-3 text-[12.5px] text-[var(--color-muted)]" style={{ top: AXIS_H + 12 }}>
            All phases collapsed.
          </p>
        ) : null}
      </div>
    </div>
  );
}

interface TimelineBarProps {
  item: TimelineItem;
  node: Positioned;
  ctx: TimelineRenderContext;
  selected: boolean;
  roving: boolean;
  dimmed: boolean;
  reduced: boolean;
  renderItem?: (item: TimelineItem, ctx: TimelineRenderContext) => React.ReactNode;
  onKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onClick: (id: string) => void;
  onFocus: (id: string) => void;
  registerNode: (id: string, el: HTMLButtonElement | null) => void;
}

const TimelineBar = React.memo(function TimelineBar({
  item, node, ctx, selected, roving, dimmed, reduced, renderItem, onKeyDown, onClick, onFocus, registerNode,
}: TimelineBarProps) {
  const meta = STATUS_META[item.status];
  const v = statusVars(meta.tone);
  const ariaLabel =
    `${item.title}. ${TYPE_LABEL[item.type]}. ${meta.label}. ${rangeText(item, ctx.startMs, ctx.endMs)}.` +
    (item.progress != null ? ` ${Math.round(item.progress * 100)}% complete.` : "") +
    (ctx.dependencies.length ? ` Depends on ${ctx.dependencies.map((d) => d.title).join(", ")}.` : "");

  const commonProps = {
    type: "button" as const,
    ref: (el: HTMLButtonElement | null) => registerNode(item.id, el),
    "data-timeline-item": item.id,
    tabIndex: roving ? 0 : -1,
    "aria-pressed": selected,
    "aria-label": ariaLabel,
    onKeyDown: (e: React.KeyboardEvent) => onKeyDown(e, item.id),
    onClick: () => onClick(item.id),
    onFocus: () => onFocus(item.id),
    style: { left: node.x, top: node.y, transition: reduced ? undefined : "left 200ms ease, width 200ms ease" as const },
  };

  if (node.point) {
    // Milestone / release: diamond marker + label.
    return (
      <button
        {...commonProps}
        className={cn(
          "absolute flex items-center gap-1.5 rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
          dimmed && "opacity-40",
        )}
        style={{ ...commonProps.style, width: node.w, height: BAR_H }}
      >
        <span
          className={cn("grid h-4 w-4 shrink-0 rotate-45 place-items-center rounded-[3px]", selected && "ring-2 ring-[var(--color-accent)] ring-offset-1 ring-offset-[var(--color-surface)]")}
          style={{ background: v.color }}
        />
        <span className="truncate text-[12px] font-medium text-[var(--color-fg)]">{item.title}</span>
      </button>
    );
  }

  const pct = item.progress != null ? Math.max(0, Math.min(1, item.progress)) : null;
  return (
    <button
      {...commonProps}
      className={cn(
        "absolute flex items-center gap-1.5 overflow-hidden rounded-lg px-2 text-left outline-none [border:1px_solid] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
        selected && "ring-2 ring-[var(--color-accent)]",
        dimmed && "opacity-40",
      )}
      style={{
        ...commonProps.style,
        width: node.w,
        height: BAR_H,
        background: v.bg,
        borderColor: selected ? "var(--color-accent)" : v.border,
      }}
    >
      {pct != null ? (
        <span aria-hidden className="absolute inset-y-0 left-0 rounded-l-lg" style={{ width: `${pct * 100}%`, background: v.color, opacity: 0.22 }} />
      ) : null}
      {renderItem ? (
        renderItem(item, ctx)
      ) : (
        <span className="relative flex min-w-0 items-center gap-1.5">
          <span className="shrink-0" style={{ color: v.color }}>
            <StatusIcon status={item.status} size={12} />
          </span>
          <span className="truncate text-[12px] font-medium text-[var(--color-fg)]">{item.title}</span>
          {item.status === "delayed" || item.status === "blocked" ? (
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide" style={{ color: v.color }}>
              {meta.label}
            </span>
          ) : null}
        </span>
      )}
    </button>
  );
});

/* -------------------------------------------------------------------------- */
/* List view (compact fallback + mobile mode)                                 */
/* -------------------------------------------------------------------------- */

interface ListViewProps {
  items: TimelineItem[];
  laneOrder: { id: string; name: string }[];
  groupOf: (id: string) => string;
  posOf: (id: string) => { start: number; end: number };
  selected: string | null;
  matchesFilter: (s: TimelineItemStatus) => boolean;
  onSelect: (id: string) => void;
  registerRow: (id: string, el: HTMLButtonElement | null) => void;
}

function ListView({ items, laneOrder, groupOf, posOf, selected, matchesFilter, onSelect, registerRow }: ListViewProps) {
  const byLane = new Map<string, TimelineItem[]>();
  for (const it of items) {
    if (!matchesFilter(it.status)) continue;
    const g = groupOf(it.id);
    const arr = byLane.get(g) ?? [];
    arr.push(it);
    byLane.set(g, arr);
  }
  for (const arr of byLane.values()) arr.sort((a, b) => posOf(a.id).start - posOf(b.id).start);
  const anyVisible = [...byLane.values()].some((arr) => arr.length > 0);

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-[var(--color-surface)] p-2 [border:1px_solid_var(--color-border)]">
      {!anyVisible ? (
        <p className="px-2 py-4 text-center text-[12.5px] text-[var(--color-muted)]">No items match the current filter.</p>
      ) : null}
      {laneOrder.map((lane) => {
        const laneItems = byLane.get(lane.id);
        if (!laneItems || laneItems.length === 0) return null;
        return (
          <div key={lane.id}>
            <h3 className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">{lane.name}</h3>
            <ul className="flex flex-col gap-1.5" role="list">
              {laneItems.map((it) => {
                const p = posOf(it.id);
                return (
                  <li key={it.id} className="rounded-lg [border:1px_solid_var(--color-border)]">
                    <button
                      type="button"
                      ref={(el) => registerRow(it.id, el)}
                      data-timeline-row={it.id}
                      aria-pressed={selected === it.id}
                      onClick={() => onSelect(it.id)}
                      className={cn(
                        "flex w-full flex-col gap-1 rounded-lg px-3 py-2 text-left outline-none transition-colors hover:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
                        selected === it.id && "bg-[color-mix(in_oklab,var(--color-accent)_8%,transparent)]",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <StatusPill status={it.status} size="sm" />
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--color-fg)]">{it.title}</span>
                        <span className="shrink-0 rounded px-1 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
                          {TYPE_LABEL[it.type]}
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-[var(--color-muted)]">
                        <span className="tabular-nums">{rangeText(it, p.start, p.end)}</span>
                        {it.progress != null ? <span>{Math.round(it.progress * 100)}% done</span> : null}
                        {it.assignee ? <span>{it.assignee}</span> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail panel                                                               */
/* -------------------------------------------------------------------------- */

interface ItemDetailProps {
  item: TimelineItem;
  ctx: TimelineRenderContext;
  groupName: (id: string) => string;
  groupOf: (id: string) => string;
  reduced: boolean;
  renderDetails?: (item: TimelineItem, ctx: TimelineRenderContext) => React.ReactNode;
  onNavigate: (id: string) => void;
  onMove?: (dir: 1 | -1) => void;
  onResize?: (dir: 1 | -1) => void;
  unitLabel: string;
  busy: boolean;
}

function ItemDetail({
  item, ctx, groupName, groupOf, reduced, renderDetails, onNavigate, onMove, onResize, unitLabel, busy,
}: ItemDetailProps) {
  const note = typeof item.metadata?.note === "string" ? (item.metadata.note as string) : null;
  return (
    <motion.div
      layout={!reduced}
      className="flex h-full flex-col gap-3 rounded-xl bg-[var(--color-surface)] p-3 [border:1px_solid_var(--color-border)]"
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-[14px] font-semibold leading-snug text-[var(--color-fg)]">{item.title}</h3>
          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
            {TYPE_LABEL[item.type]}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill status={item.status} size="sm" />
          <span className="text-[11.5px] text-[var(--color-muted)]">{groupName(groupOf(item.id))}</span>
          {item.priority === "urgent" || item.priority === "high" ? (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
              {item.priority}
            </span>
          ) : null}
        </div>
        {/* dates as text — the authoritative schedule */}
        <p className="text-[12.5px] font-medium text-[var(--color-fg)] tabular-nums">{rangeText(item, ctx.startMs, ctx.endMs)}</p>
        {note && (item.status === "delayed" || item.status === "blocked") ? (
          <p
            className="rounded-md px-2 py-1 text-[12px]"
            style={{ background: statusVars(STATUS_META[item.status].tone).bg, color: statusVars(STATUS_META[item.status].tone).color, border: `1px solid ${statusVars(STATUS_META[item.status].tone).border}` }}
          >
            {note}
          </p>
        ) : null}
        {item.assignee || item.progress != null ? (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-[var(--color-muted)]">
            {item.assignee ? <span>{item.assignee}</span> : null}
            {item.progress != null ? <span>{Math.round(item.progress * 100)}% done</span> : null}
          </p>
        ) : null}
      </div>

      {renderDetails ? (
        renderDetails(item, ctx)
      ) : (
        <>
          <RelationList title="Depends on" emptyLabel="No prerequisites." tasks={ctx.dependencies} onNavigate={onNavigate} />
          <RelationList title="Blocks" emptyLabel="Nothing depends on this." tasks={ctx.dependents} onNavigate={onNavigate} />
        </>
      )}

      {onMove || onResize ? (
        <div className="mt-auto flex flex-col gap-1.5 border-t border-[var(--color-border)] pt-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Reschedule {busy ? <span className="text-[var(--color-accent)]">· saving…</span> : null}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {onMove ? (
              <>
                <DetailButton label={`Move earlier`} sub={`1 ${unitLabel}`} onClick={() => onMove(-1)} icon="m15 18-6-6 6-6" />
                <DetailButton label={`Move later`} sub={`1 ${unitLabel}`} onClick={() => onMove(1)} icon="m9 18 6-6-6-6" />
              </>
            ) : null}
            {onResize ? (
              <>
                <DetailButton label="Shorten" sub={`1 ${unitLabel}`} onClick={() => onResize(-1)} icon="M20 12H4" />
                <DetailButton label="Extend" sub={`1 ${unitLabel}`} onClick={() => onResize(1)} icon="M12 4v16M4 12h16" />
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

function DetailButton({ label, sub, onClick, icon }: { label: string; sub: string; onClick: () => void; icon: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>{P(icon)}</svg>
      {label}
      <span className="text-[10.5px] text-[var(--color-muted)]">{sub}</span>
    </button>
  );
}

function RelationList({
  title, emptyLabel, tasks, onNavigate,
}: {
  title: string;
  emptyLabel: string;
  tasks: TimelineItem[];
  onNavigate: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {title} <span className="tabular-nums">({tasks.length})</span>
      </p>
      {tasks.length === 0 ? (
        <p className="text-[12px] text-[var(--color-muted)]">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-1" role="list">
          {tasks.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onNavigate(t.id)}
                className="flex w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[12.5px] outline-none transition-colors hover:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full" style={{ color: statusVars(STATUS_META[t.status].tone).color, background: statusVars(STATUS_META[t.status].tone).bg }}>
                  <StatusIcon status={t.status} size={10} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[var(--color-fg)]">{t.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading skeleton                                                           */
/* -------------------------------------------------------------------------- */

function TimelineSkeleton() {
  const rows = [0.55, 0.32, 0.7, 0.45];
  return (
    <div className="rounded-xl bg-[var(--color-surface)] p-3 [border:1px_solid_var(--color-border)]" aria-hidden>
      <div className="mb-3 h-3 w-40 rounded bg-[var(--color-border)] opacity-50" />
      <div className="flex flex-col gap-2.5">
        {rows.map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-2.5 w-16 rounded bg-[var(--color-border)] opacity-40" />
            <div className="h-6 rounded-lg bg-[var(--color-border)] opacity-30" style={{ width: `${w * 100}%`, marginLeft: `${i * 8}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectTimeline;
