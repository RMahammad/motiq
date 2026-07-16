"use client";

/* --------------------------------------------------------------------------
 * TaskDependencyMap — a presentation-only *dependency visualization* for an
 * app-owned set of tasks. It is NOT a project-management app and NOT a generic
 * pan/zoom node-graph editor: the host application owns the tasks, their
 * statuses, scheduling, cycle validation, and persistence. This component
 * renders that data as a readable dependency map and owns only the *reading and
 * light-editing UX* — selecting a task, inspecting what blocks it and what it
 * unblocks, highlighting a dependency path, surfacing bottlenecks, adding and
 * removing prerequisites, moving a task between groups, collapsing groups, and
 * presenting an app-supplied cycle error.
 *
 * Layout is computed CLEAN-ROOM in plain JS (no layout measurement, no external
 * graph/drag library): tasks are laid out in dependency-depth columns (longest
 * path from a root) within horizontal group lanes, and dependency lines are
 * drawn as static SVG paths from those computed coordinates. Because positions
 * are derived, not measured, the map renders identically on the server and in
 * tests. Dependency lines are NOT continuously animated.
 *
 * Accessibility (never pointer-only):
 *  - Every task node is a keyboard target with a roving tabindex; arrow keys
 *    move between dependency levels and within a lane, Enter/Space selects a
 *    task and opens its details.
 *  - Relationships are navigable from the detail panel: each prerequisite and
 *    dependent is a button that selects and focuses that task, and every
 *    selection is announced in a polite live region ("Blocked by …, blocks …").
 *  - A COMPACT LIST view (also the mobile dependency-detail mode) presents the
 *    same information and every action without any spatial interaction.
 *  - Status is conveyed with an icon + text label, never colour alone; the SVG
 *    lines are decorative (aria-hidden) — the authoritative relationship
 *    information is the textual detail panel and list.
 *  - Focus is preserved across moves/edits and restored after an optimistic
 *    rollback.
 *
 * Clean-room original.
 * ----------------------------------------------------------------------- */

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useControllableState,
  useOptimisticAction,
  useAnchoredPortal,
  statusVars,
  type StatusTone,
} from "@/lib/motionstack";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type TaskStatus =
  | "planned"
  | "ready"
  | "active"
  | "blocked"
  | "completed"
  | "cancelled";

export type TaskPriority = "low" | "normal" | "high" | "urgent";

export interface Task {
  /** Stable id — referenced by `dependencyIds`, selection, and every callback. */
  id: string;
  /** Task title (the accessible name of the node). */
  title: string;
  /** Lifecycle status (app-owned). Rendered with an icon + text, never colour alone. */
  status: TaskStatus;
  /** Optional priority — `urgent`/`high` surface a small badge. */
  priority?: TaskPriority;
  assignee?: string;
  startDate?: Date | number | string;
  dueDate?: Date | number | string;
  /** Completion ratio 0..1. */
  progress?: number;
  /** Ids of the tasks that must be done first (this task's prerequisites). */
  dependencyIds: string[];
  /** App-supplied reason a `blocked` task is blocked (shown verbatim). */
  blockedReason?: string;
  /** Group / workstream id — drives the horizontal lanes (see `groups`). */
  group?: string;
  /** Marks a milestone task (diamond marker). */
  milestone?: boolean;
  /** Arbitrary passthrough for `renderTask` / `renderDetails`. */
  metadata?: Record<string, unknown>;
}

export interface TaskGroup {
  /** Stable id — matched against `task.group`. */
  id: string;
  /** Human lane label. */
  name: string;
}

/** App-supplied cycle error presented as an alert (the app owns detection). */
export interface TaskCycleError {
  message: string;
  /** Optional ids involved in the cycle, echoed for context. */
  taskIds?: string[];
}

export type TaskLayoutMode = "map" | "list";

/** Context handed to `renderTask` / `renderDetails`. */
export interface TaskRenderContext {
  selected: boolean;
  /** Direct prerequisites of the task (tasks it depends on). */
  prerequisites: Task[];
  /** Direct dependents (tasks that depend on this one). */
  dependents: Task[];
  /** Incomplete prerequisites currently blocking the task. */
  blockedBy: Task[];
  onPath: boolean;
  isBottleneck: boolean;
}

export interface TaskDependencyMapProps {
  /** All tasks (app-owned). */
  tasks: Task[];
  /** Controlled selection. */
  selectedTaskId?: string | null;
  /** Uncontrolled initial selection. */
  defaultSelectedTaskId?: string | null;
  /** Notified when the selected task changes (null when cleared). */
  onSelectedTaskChange?: (taskId: string | null) => void;
  /** `taskId` gains `dependencyId` as a prerequisite. The app validates + persists. */
  onAddDependency?: (taskId: string, dependencyId: string) => void;
  /** `taskId` loses `dependencyId` as a prerequisite. */
  onRemoveDependency?: (taskId: string, dependencyId: string) => void;
  /**
   * Move a task into another group. May return a Promise for optimistic
   * movement: the node re-lanes immediately and rolls back if it rejects.
   */
  onMoveTask?: (taskId: string, toGroup: string) => void | Promise<unknown>;
  /** `map` (default) or `list`. `list` is the compact / mobile fallback. */
  layout?: TaskLayoutMode;
  /** Ordered lanes. Absent → derived from the tasks' `group` values. */
  groups?: TaskGroup[];
  /** Highlight a path (ordered ids); its nodes + connecting edges are emphasised. */
  activePath?: string[];
  /** App-supplied cycle error to present (e.g. after a rejected add-dependency). */
  cycleError?: TaskCycleError | null;
  /** Force the compact list view regardless of `layout` (mobile / tests). */
  compact?: boolean;
  /** Transitive-dependents count at/above which an incomplete task is a bottleneck. */
  bottleneckThreshold?: number;
  /** Override a task node's body. */
  renderTask?: (task: Task, ctx: TaskRenderContext) => React.ReactNode;
  /** Override the detail-panel body. */
  renderDetails?: (task: Task, ctx: TaskRenderContext) => React.ReactNode;
  /** Accessible label for the region. */
  label?: string;
  /** Force reduced motion (demos/tests). */
  reducedMotion?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Status metadata (icon + text — never colour alone)                         */
/* -------------------------------------------------------------------------- */

const P = (d: string) => (
  <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
);

const STATUS_META: Record<
  TaskStatus,
  { label: string; tone: StatusTone; icon: React.ReactNode }
> = {
  planned: { label: "Planned", tone: "neutral", icon: P("M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z") },
  ready: { label: "Ready", tone: "info", icon: P("M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM10 9l5 3-5 3V9Z") },
  active: { label: "Active", tone: "active", icon: P("M12 3a9 9 0 1 0 9 9M12 7v5l3 2") },
  blocked: {
    label: "Blocked",
    tone: "warning",
    icon: P("M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"),
  },
  completed: { label: "Completed", tone: "success", icon: P("M4 12.5 9 17.5 20 6.5") },
  cancelled: { label: "Cancelled", tone: "neutral", icon: P("M6 6l12 12M18 6 6 18") },
};

function StatusIcon({ status, size = 13 }: { status: TaskStatus; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {STATUS_META[status].icon}
    </svg>
  );
}

function StatusPill({ status, size = "md" }: { status: TaskStatus; size?: "sm" | "md" }) {
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
/* Pure graph + layout helpers (deterministic, no measurement)                */
/* -------------------------------------------------------------------------- */

const UNGROUPED = "__ungrouped__";

/** Longest-path depth from a dependency root; cycle-guarded so bad data can't hang. */
function computeLevels(tasks: Task[], byId: Map<string, Task>): Map<string, number> {
  const memo = new Map<string, number>();
  const visiting = new Set<string>();
  const depth = (id: string): number => {
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return 0; // cycle guard — app validates, we just stay finite
    visiting.add(id);
    const t = byId.get(id);
    let d = 0;
    if (t) {
      for (const dep of t.dependencyIds) {
        if (byId.has(dep)) d = Math.max(d, depth(dep) + 1);
      }
    }
    visiting.delete(id);
    memo.set(id, d);
    return d;
  };
  for (const t of tasks) depth(t.id);
  return memo;
}

/** Direct dependents (reverse edges). */
function computeDependents(tasks: Task[], byId: Map<string, Task>): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const t of tasks) out.set(t.id, []);
  for (const t of tasks) {
    for (const dep of t.dependencyIds) {
      if (byId.has(dep)) out.get(dep)!.push(t.id);
    }
  }
  return out;
}

/** Count of tasks that (transitively) depend on `id`. Cycle-guarded. */
function transitiveDependents(id: string, dependents: Map<string, string[]>): number {
  const seen = new Set<string>();
  const stack = [...(dependents.get(id) ?? [])];
  while (stack.length) {
    const cur = stack.pop()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const next of dependents.get(cur) ?? []) if (!seen.has(next)) stack.push(next);
  }
  return seen.size;
}

const COL_W = 196;
const COL_GAP = 66;
const NODE_H = 64;
const ROW_GAP = 18;
const LANE_HEADER_H = 30;
const LANE_GAP = 14;
const PAD_X = 8;
const PAD_Y = 6;

interface LaidOutNode {
  id: string;
  x: number;
  y: number;
  level: number;
  group: string;
}
interface LaidOutLane {
  group: string;
  name: string;
  headerY: number;
  rows: number;
  hidden: number;
}
interface Layout {
  nodes: LaidOutNode[];
  nodeById: Map<string, LaidOutNode>;
  lanes: LaidOutLane[];
  width: number;
  height: number;
}

function buildLayout(
  tasks: Task[],
  laneOrder: { id: string; name: string }[],
  groupOf: (id: string) => string,
  levels: Map<string, number>,
  collapsed: Set<string>,
): Layout {
  const nodes: LaidOutNode[] = [];
  const nodeById = new Map<string, LaidOutNode>();
  const lanes: LaidOutLane[] = [];

  // Original index for stable within-lane ordering.
  const orderIndex = new Map<string, number>();
  tasks.forEach((t, i) => orderIndex.set(t.id, i));

  const byLane = new Map<string, Task[]>();
  for (const t of tasks) {
    const g = groupOf(t.id);
    const arr = byLane.get(g) ?? [];
    arr.push(t);
    byLane.set(g, arr);
  }

  let cursorY = PAD_Y;
  let maxLevel = 0;

  for (const lane of laneOrder) {
    const laneTasks = (byLane.get(lane.id) ?? []).slice().sort((a, b) => {
      const la = levels.get(a.id) ?? 0;
      const lb = levels.get(b.id) ?? 0;
      if (la !== lb) return la - lb;
      return (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0);
    });
    if (laneTasks.length === 0) continue;

    const headerY = cursorY;
    cursorY += LANE_HEADER_H;
    const isCollapsed = collapsed.has(lane.id);

    let rows = 0;
    if (!isCollapsed) {
      const perLevel = new Map<number, number>();
      for (const t of laneTasks) {
        const level = levels.get(t.id) ?? 0;
        maxLevel = Math.max(maxLevel, level);
        const sub = perLevel.get(level) ?? 0;
        perLevel.set(level, sub + 1);
        const node: LaidOutNode = {
          id: t.id,
          x: PAD_X + level * (COL_W + COL_GAP),
          y: cursorY + sub * (NODE_H + ROW_GAP),
          level,
          group: lane.id,
        };
        nodes.push(node);
        nodeById.set(t.id, node);
        rows = Math.max(rows, sub + 1);
      }
      cursorY += rows * (NODE_H + ROW_GAP);
    }

    lanes.push({
      group: lane.id,
      name: lane.name,
      headerY,
      rows,
      hidden: isCollapsed ? laneTasks.length : 0,
    });
    cursorY += LANE_GAP;
  }

  const width = Math.max(COL_W + PAD_X * 2, PAD_X * 2 + (maxLevel + 1) * COL_W + maxLevel * COL_GAP);
  const height = Math.max(NODE_H + PAD_Y * 2, cursorY);
  return { nodes, nodeById, lanes, width, height };
}

function edgePath(from: LaidOutNode, to: LaidOutNode): string {
  const x1 = from.x + COL_W;
  const y1 = from.y + NODE_H / 2;
  const x2 = to.x;
  const y2 = to.y + NODE_H / 2;
  const mx = x1 + Math.max(24, (x2 - x1) / 2);
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

function toMs(value: Date | number | string): number {
  const d = value instanceof Date ? value : new Date(value);
  return d.getTime();
}
function formatDate(value: Date | number | string): string {
  const d = new Date(toMs(value));
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(d);
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function TaskDependencyMap({
  tasks,
  selectedTaskId,
  defaultSelectedTaskId = null,
  onSelectedTaskChange,
  onAddDependency,
  onRemoveDependency,
  onMoveTask,
  layout = "map",
  groups,
  activePath,
  cycleError,
  compact = false,
  bottleneckThreshold = 3,
  renderTask,
  renderDetails,
  label = "Task dependency map",
  reducedMotion,
  className,
}: TaskDependencyMapProps) {
  const mediaReduced = useReducedMotion();
  const reduced = reducedMotion ?? mediaReduced;

  const [selected, setSelected] = useControllableState<string | null>({
    value: selectedTaskId,
    defaultValue: defaultSelectedTaskId,
    onChange: onSelectedTaskChange,
  });

  const [collapsed, setCollapsed] = React.useState<Set<string>>(() => new Set());
  const [statusFilter, setStatusFilter] = React.useState<Set<TaskStatus>>(() => new Set());
  const [announcement, setAnnouncement] = React.useState("");
  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  const [focusToken, setFocusToken] = React.useState(0);

  const announce = React.useCallback((msg: string) => setAnnouncement(msg), []);

  /* -- derived graph -------------------------------------------------- */
  const byId = React.useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const levels = React.useMemo(() => computeLevels(tasks, byId), [tasks, byId]);
  const dependents = React.useMemo(() => computeDependents(tasks, byId), [tasks, byId]);

  /* -- optimistic move (group reassignment with rollback) ------------- */
  const committedGroups = React.useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of tasks) m[t.id] = t.group ?? UNGROUPED;
    return m;
  }, [tasks]);
  const move = useOptimisticAction<Record<string, string>>(committedGroups);
  const groupOf = React.useCallback(
    (id: string) => move.value[id] ?? byId.get(id)?.group ?? UNGROUPED,
    [move.value, byId],
  );

  /* -- lane order ----------------------------------------------------- */
  const laneOrder = React.useMemo(() => {
    const seen = new Set<string>();
    const order: { id: string; name: string }[] = [];
    if (groups) {
      for (const g of groups) {
        order.push({ id: g.id, name: g.name });
        seen.add(g.id);
      }
    }
    for (const t of tasks) {
      const g = groupOf(t.id);
      if (!seen.has(g)) {
        seen.add(g);
        order.push({ id: g, name: g === UNGROUPED ? "Ungrouped" : g });
      }
    }
    return order;
  }, [groups, tasks, groupOf]);

  const groupName = React.useCallback(
    (id: string) => laneOrder.find((l) => l.id === id)?.name ?? (id === UNGROUPED ? "Ungrouped" : id),
    [laneOrder],
  );

  const layoutData = React.useMemo(
    () => buildLayout(tasks, laneOrder, groupOf, levels, collapsed),
    [tasks, laneOrder, groupOf, levels, collapsed],
  );

  const pathSet = React.useMemo(() => new Set(activePath ?? []), [activePath]);

  /* -- relationship lookups ------------------------------------------ */
  const prerequisitesOf = React.useCallback(
    (id: string): Task[] => (byId.get(id)?.dependencyIds ?? []).map((d) => byId.get(d)).filter(Boolean) as Task[],
    [byId],
  );
  const dependentsOf = React.useCallback(
    (id: string): Task[] => (dependents.get(id) ?? []).map((d) => byId.get(d)).filter(Boolean) as Task[],
    [dependents, byId],
  );
  const blockedByOf = React.useCallback(
    (id: string): Task[] => prerequisitesOf(id).filter((p) => p.status !== "completed" && p.status !== "cancelled"),
    [prerequisitesOf],
  );
  const isBottleneck = React.useCallback(
    (id: string): boolean => {
      const t = byId.get(id);
      if (!t || t.status === "completed" || t.status === "cancelled") return false;
      return transitiveDependents(id, dependents) >= bottleneckThreshold;
    },
    [byId, dependents, bottleneckThreshold],
  );

  const renderCtx = React.useCallback(
    (id: string): TaskRenderContext => ({
      selected: selected === id,
      prerequisites: prerequisitesOf(id),
      dependents: dependentsOf(id),
      blockedBy: blockedByOf(id),
      onPath: pathSet.has(id),
      isBottleneck: isBottleneck(id),
    }),
    [selected, prerequisitesOf, dependentsOf, blockedByOf, pathSet, isBottleneck],
  );

  /* -- focus management ------------------------------------------------ */
  const nodeRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const rowRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const pendingFocus = React.useRef<string | null>(null);
  const focusTask = React.useCallback((id: string) => {
    pendingFocus.current = id;
    setFocusToken((t) => t + 1);
  }, []);
  React.useEffect(() => {
    const id = pendingFocus.current;
    if (id == null) return;
    pendingFocus.current = null;
    (nodeRefs.current.get(id) ?? rowRefs.current.get(id))?.focus();
  }, [focusToken, layoutData]);

  const selectTask = React.useCallback(
    (id: string | null, opts: { focus?: boolean; announce?: boolean } = {}) => {
      setSelected(id);
      setFocusedId(id);
      if (id) {
        if (opts.announce !== false) {
          const t = byId.get(id);
          const blocked = blockedByOf(id);
          const unblocks = dependentsOf(id);
          announce(
            `${t?.title ?? "Task"} selected. ${STATUS_META[t?.status ?? "planned"].label}. ` +
              (blocked.length
                ? `Blocked by ${blocked.length} task${blocked.length === 1 ? "" : "s"}: ${blocked.map((b) => b.title).join(", ")}. `
                : "No blocking prerequisites. ") +
              (unblocks.length
                ? `Unblocks ${unblocks.length} task${unblocks.length === 1 ? "" : "s"}.`
                : "No dependents."),
          );
        }
        if (opts.focus) focusTask(id);
      }
    },
    [setSelected, byId, blockedByOf, dependentsOf, announce, focusTask],
  );

  /* Rollback restores focus + announces (move handler holds the DOM refs). */
  const prevMovePhase = React.useRef(move.phase);
  React.useEffect(() => {
    if (prevMovePhase.current === "pending" && move.phase === "error") {
      if (selected) focusTask(selected);
      announce(`Move failed. ${move.error ?? "The task returned to its group."}`);
    }
    prevMovePhase.current = move.phase;
  }, [move.phase, move.error, selected, focusTask, announce]);

  const moveTaskToGroup = React.useCallback(
    (taskId: string, toGroup: string) => {
      const from = groupOf(taskId);
      if (from === toGroup) return;
      const next = { ...committedGroups, [taskId]: toGroup };
      announce(`${byId.get(taskId)?.title ?? "Task"} moved to ${groupName(toGroup)}.`);
      focusTask(taskId);
      void move.commit(next, async () => {
        await onMoveTask?.(taskId, toGroup);
      });
    },
    [groupOf, committedGroups, announce, byId, groupName, focusTask, move, onMoveTask],
  );

  /* -- roving keyboard nav in the map --------------------------------- */
  const visibleNodes = layoutData.nodes;
  const onNodeKeyDown = React.useCallback(
    (e: React.KeyboardEvent, id: string) => {
      const key = e.key;
      if (key === "Enter" || key === " " || key === "Spacebar") {
        e.preventDefault();
        selectTask(id, { focus: false });
        return;
      }
      if (!key.startsWith("Arrow")) return;
      const cur = layoutData.nodeById.get(id);
      if (!cur) return;
      e.preventDefault();

      let target: LaidOutNode | null = null;
      if (key === "ArrowUp" || key === "ArrowDown") {
        // Move within the same dependency level by vertical position.
        const sameLevel = visibleNodes
          .filter((n) => n.level === cur.level && n.id !== id)
          .sort((a, b) => a.y - b.y);
        const dir = key === "ArrowDown" ? 1 : -1;
        target =
          sameLevel
            .filter((n) => (dir > 0 ? n.y > cur.y : n.y < cur.y))
            .sort((a, b) => (dir > 0 ? a.y - b.y : b.y - a.y))[0] ?? null;
      } else {
        // Move between dependency levels (Left = prerequisites side, Right = dependents).
        const dir = key === "ArrowRight" ? 1 : -1;
        const candidates = visibleNodes.filter((n) => (dir > 0 ? n.level > cur.level : n.level < cur.level));
        if (candidates.length) {
          const nextLevel = candidates.reduce(
            (best, n) => (dir > 0 ? Math.min(best, n.level) : Math.max(best, n.level)),
            dir > 0 ? Infinity : -Infinity,
          );
          target = candidates
            .filter((n) => n.level === nextLevel)
            .sort((a, b) => Math.abs(a.y - cur.y) - Math.abs(b.y - cur.y))[0] ?? null;
        }
      }
      if (target) {
        setFocusedId(target.id);
        focusTask(target.id);
      }
    },
    [layoutData, visibleNodes, selectTask, focusTask],
  );

  const toggleGroup = React.useCallback(
    (id: string) => {
      setCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        announce(`${groupName(id)} group ${next.has(id) ? "collapsed" : "expanded"}.`);
        return next;
      });
    },
    [groupName, announce],
  );

  const toggleStatusFilter = React.useCallback((status: TaskStatus) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);
  const matchesFilter = React.useCallback(
    (status: TaskStatus) => statusFilter.size === 0 || statusFilter.has(status),
    [statusFilter],
  );

  // Roving focus target: focused → selected → first visible.
  const rovingId = focusedId ?? selected ?? layoutData.nodes[0]?.id ?? null;

  const selectedTask = selected ? byId.get(selected) ?? null : null;
  const showList = compact || layout === "list";

  const presentStatuses = React.useMemo(() => {
    const set = new Set<TaskStatus>();
    for (const t of tasks) set.add(t.status);
    return (Object.keys(STATUS_META) as TaskStatus[]).filter((s) => set.has(s));
  }, [tasks]);

  /* -------------------------------------------------------------------- */
  return (
    <section
      aria-label={label}
      className={cn(
        "flex w-full flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3",
        className,
      )}
    >
      {/* header: filter chips */}
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

      {/* app-supplied cycle error */}
      <AnimatePresence initial={false}>
        {cycleError ? (
          <motion.div
            key="cycle-error"
            role="alert"
            initial={reduced ? false : { opacity: 0, height: 0 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, height: "auto" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: reduced ? 0 : 0.22, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <div
              className="flex items-start gap-2 rounded-lg px-3 py-2 text-[12.5px]"
              style={{ background: statusVars("error").bg, border: `1px solid ${statusVars("error").border}`, color: statusVars("error").color }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 shrink-0">
                {P("M12 8v5M12 17h.01M10.3 4.3 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z")}
              </svg>
              <span>
                <span className="font-semibold">Dependency cycle. </span>
                <span className="text-[var(--color-fg)]">{cycleError.message}</span>
                {cycleError.taskIds && cycleError.taskIds.length > 0 ? (
                  <span className="text-[var(--color-muted)]">
                    {" "}
                    ({cycleError.taskIds.map((id) => byId.get(id)?.title ?? id).join(" → ")})
                  </span>
                ) : null}
              </span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex flex-col gap-3 lg:flex-row">
        {/* primary view */}
        <div className="min-w-0 flex-1">
          {showList ? (
            <ListView
              tasks={tasks}
              laneOrder={laneOrder}
              groupOf={groupOf}
              selected={selected}
              matchesFilter={matchesFilter}
              renderCtx={renderCtx}
              onSelect={(id) => selectTask(id)}
              registerRow={(id, el) => {
                if (el) rowRefs.current.set(id, el);
                else rowRefs.current.delete(id);
              }}
            />
          ) : (
            <MapView
              layoutData={layoutData}
              byId={byId}
              selected={selected}
              rovingId={rovingId}
              pathSet={pathSet}
              matchesFilter={matchesFilter}
              reduced={reduced}
              renderTask={renderTask}
              renderCtx={renderCtx}
              onNodeKeyDown={onNodeKeyDown}
              onNodeClick={(id) => selectTask(id, { focus: false })}
              onNodeFocus={(id) => setFocusedId(id)}
              onToggleGroup={toggleGroup}
              collapsed={collapsed}
              groupName={groupName}
              registerNode={(id, el) => {
                if (el) nodeRefs.current.set(id, el);
                else nodeRefs.current.delete(id);
              }}
            />
          )}
        </div>

        {/* detail panel — the mobile mode reuses the same content inline in the list */}
        {!showList ? (
          <div className="w-full shrink-0 lg:w-[320px]">
            {selectedTask ? (
              <TaskDetail
                task={selectedTask}
                ctx={renderCtx(selectedTask.id)}
                allTasks={tasks}
                laneOrder={laneOrder}
                groupOf={groupOf}
                groupName={groupName}
                reduced={reduced}
                renderDetails={renderDetails}
                onNavigate={(id) => selectTask(id, { focus: true })}
                onAddDependency={onAddDependency}
                onRemoveDependency={onRemoveDependency}
                onMove={onMoveTask ? moveTaskToGroup : undefined}
                moving={move.optimistic}
              />
            ) : (
              <div className="grid h-full min-h-[160px] place-items-center rounded-xl bg-[var(--color-surface)] p-4 text-center text-[12.5px] text-[var(--color-muted)] [border:1px_dashed_var(--color-border)]">
                Select a task to inspect what blocks it and what it unblocks.
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
/* Map view                                                                   */
/* -------------------------------------------------------------------------- */

interface MapViewProps {
  layoutData: Layout;
  byId: Map<string, Task>;
  selected: string | null;
  rovingId: string | null;
  pathSet: Set<string>;
  matchesFilter: (status: TaskStatus) => boolean;
  reduced: boolean;
  renderTask?: (task: Task, ctx: TaskRenderContext) => React.ReactNode;
  renderCtx: (id: string) => TaskRenderContext;
  onNodeKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onNodeClick: (id: string) => void;
  onNodeFocus: (id: string) => void;
  onToggleGroup: (id: string) => void;
  collapsed: Set<string>;
  groupName: (id: string) => string;
  registerNode: (id: string, el: HTMLButtonElement | null) => void;
}

function MapView({
  layoutData,
  byId,
  selected,
  rovingId,
  pathSet,
  matchesFilter,
  reduced,
  renderTask,
  renderCtx,
  onNodeKeyDown,
  onNodeClick,
  onNodeFocus,
  onToggleGroup,
  collapsed,
  groupName,
  registerNode,
}: MapViewProps) {
  const { nodes, nodeById, lanes, width, height } = layoutData;

  // Edges: from prerequisite → dependent. Skip any touching a collapsed node.
  const edges = React.useMemo(() => {
    const list: {
      key: string;
      d: string;
      incoming: boolean;
      outgoing: boolean;
      onPath: boolean;
      unresolved: boolean;
    }[] = [];
    const selPrereq = selected ? new Set(byId.get(selected)?.dependencyIds ?? []) : null;
    for (const t of byId.values()) {
      const toNode = nodeById.get(t.id);
      if (!toNode) continue;
      for (const depId of t.dependencyIds) {
        const fromNode = nodeById.get(depId);
        if (!fromNode) continue;
        const incoming = selected === t.id && selPrereq?.has(depId) === true;
        const outgoing = selected === depId;
        const onPath = pathSet.has(depId) && pathSet.has(t.id);
        const src = byId.get(depId);
        const unresolved = !!src && src.status !== "completed" && src.status !== "cancelled";
        list.push({ key: `${depId}->${t.id}`, d: edgePath(fromNode, toNode), incoming, outgoing, onPath, unresolved });
      }
    }
    // Emphasised edges last (drawn on top).
    return list.sort((a, b) => Number(a.incoming || a.outgoing || a.onPath) - Number(b.incoming || b.outgoing || b.onPath));
  }, [byId, nodeById, selected, pathSet]);

  return (
    <div className="overflow-x-auto rounded-xl bg-[var(--color-surface)] p-2 [border:1px_solid_var(--color-border)]">
      <div className="relative" style={{ width, height, minWidth: "100%" }}>
        {/* lane bands + headers */}
        {lanes.map((lane) => (
          <div key={lane.group} className="absolute left-0 right-0" style={{ top: lane.headerY }}>
            <button
              type="button"
              aria-expanded={!collapsed.has(lane.group)}
              onClick={() => onToggleGroup(lane.group)}
              className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[12px] font-semibold text-[var(--color-fg)] outline-none transition-colors hover:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                style={{ transform: collapsed.has(lane.group) ? "rotate(-90deg)" : "none", transition: reduced ? undefined : "transform 160ms" }}
              >
                {P("m6 9 6 6 6-6")}
              </svg>
              {lane.name}
              {lane.hidden > 0 ? (
                <span className="rounded-full bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
                  {lane.hidden} hidden
                </span>
              ) : null}
            </button>
          </div>
        ))}

        {/* dependency lines — static SVG, decorative (relationships are textual) */}
        <svg aria-hidden className="pointer-events-none absolute inset-0" width={width} height={height} style={{ overflow: "visible" }}>
          <defs>
            <marker id="mk-dep-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--color-accent)" />
            </marker>
            <marker id="mk-dep-arrow-muted" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--color-muted)" />
            </marker>
          </defs>
          {edges.map((e) => {
            const emphasised = e.incoming || e.outgoing || e.onPath;
            const stroke = emphasised ? "var(--color-accent)" : "var(--color-border)";
            return (
              <path
                key={e.key}
                d={e.d}
                fill="none"
                stroke={stroke}
                strokeWidth={emphasised ? 2.25 : 1.5}
                strokeDasharray={e.unresolved && !emphasised ? "5 5" : e.unresolved && emphasised ? "6 4" : undefined}
                opacity={selected && !emphasised ? 0.4 : 0.85}
                markerEnd={emphasised ? "url(#mk-dep-arrow)" : "url(#mk-dep-arrow-muted)"}
                style={reduced ? undefined : { transition: "stroke 160ms, opacity 160ms, stroke-width 160ms" }}
              />
            );
          })}
        </svg>

        {/* task nodes — real focusable buttons over the SVG */}
        {nodes.map((n) => {
          const task = byId.get(n.id);
          if (!task) return null;
          const ctx = renderCtx(n.id);
          const dimmed = !matchesFilter(task.status);
          return (
            <TaskNode
              key={n.id}
              task={task}
              node={n}
              ctx={ctx}
              selected={selected === n.id}
              roving={rovingId === n.id}
              onPath={pathSet.has(n.id)}
              dimmed={dimmed}
              reduced={reduced}
              renderTask={renderTask}
              onKeyDown={onNodeKeyDown}
              onClick={onNodeClick}
              onFocus={onNodeFocus}
              registerNode={registerNode}
            />
          );
        })}

        {nodes.length === 0 ? (
          <p className="absolute left-2 top-8 text-[12.5px] text-[var(--color-muted)]">All groups collapsed.</p>
        ) : null}
      </div>
    </div>
  );
}

interface TaskNodeProps {
  task: Task;
  node: LaidOutNode;
  ctx: TaskRenderContext;
  selected: boolean;
  roving: boolean;
  onPath: boolean;
  dimmed: boolean;
  reduced: boolean;
  renderTask?: (task: Task, ctx: TaskRenderContext) => React.ReactNode;
  onKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onClick: (id: string) => void;
  onFocus: (id: string) => void;
  registerNode: (id: string, el: HTMLButtonElement | null) => void;
}

const TaskNode = React.memo(function TaskNode({
  task,
  node,
  ctx,
  selected,
  roving,
  onPath,
  dimmed,
  reduced,
  renderTask,
  onKeyDown,
  onClick,
  onFocus,
  registerNode,
}: TaskNodeProps) {
  const meta = STATUS_META[task.status];
  const v = statusVars(meta.tone);
  const relationSummary = `${ctx.blockedBy.length ? `blocked by ${ctx.blockedBy.length}` : "not blocked"}, unblocks ${ctx.dependents.length}`;

  return (
    <motion.button
      type="button"
      ref={(el: HTMLButtonElement | null) => registerNode(task.id, el)}
      data-task-node={task.id}
      tabIndex={roving ? 0 : -1}
      aria-pressed={selected}
      aria-label={`${task.title}. ${meta.label}. ${relationSummary}.${task.blockedReason ? ` ${task.blockedReason}.` : ""}${ctx.isBottleneck ? " Bottleneck." : ""}`}
      onKeyDown={(e) => onKeyDown(e, task.id)}
      onClick={() => onClick(task.id)}
      onFocus={() => onFocus(task.id)}
      initial={false}
      animate={reduced ? undefined : { scale: selected ? 1.015 : 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 40 }}
      className={cn(
        "absolute flex flex-col justify-center gap-1 rounded-xl bg-[var(--color-surface)] px-3 py-2 text-left outline-none [border:1px_solid_var(--color-border)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
        selected && "ring-2 ring-[var(--color-accent)]",
        onPath && !selected && "[box-shadow:0_0_0_2px_color-mix(in_oklab,var(--color-accent)_45%,transparent)]",
      )}
      style={{
        left: node.x,
        top: node.y,
        width: COL_W,
        height: NODE_H,
        opacity: dimmed ? 0.42 : 1,
        borderColor: selected ? "var(--color-accent)" : undefined,
      }}
    >
      {renderTask ? (
        renderTask(task, ctx)
      ) : (
        <>
          <span className="flex items-center gap-1.5">
            <span className="grid h-4 w-4 place-items-center rounded-full" style={{ color: v.color, background: v.bg }}>
              <StatusIcon status={task.status} size={11} />
            </span>
            <span className="truncate text-[13px] font-medium leading-tight text-[var(--color-fg)]">{task.title}</span>
            {task.milestone ? (
              <span aria-hidden title="Milestone" className="ml-auto text-[var(--color-accent)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">{P("M12 3 21 12 12 21 3 12 12 3Z")}</svg>
              </span>
            ) : null}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
            {ctx.blockedBy.length > 0 ? (
              <span className="font-medium" style={{ color: statusVars("warning").color }}>
                Blocked · {ctx.blockedBy.length}
              </span>
            ) : ctx.dependents.length > 0 ? (
              <span>Unblocks {ctx.dependents.length}</span>
            ) : (
              <span>No dependents</span>
            )}
            {ctx.isBottleneck ? (
              <span className="rounded px-1 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide" style={{ color: statusVars("warning").color, background: statusVars("warning").bg }}>
                Bottleneck
              </span>
            ) : null}
            {task.priority === "urgent" || task.priority === "high" ? (
              <span className="ml-auto rounded px-1 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
                {task.priority}
              </span>
            ) : null}
          </span>
        </>
      )}
    </motion.button>
  );
});

/* -------------------------------------------------------------------------- */
/* List view (compact fallback + mobile dependency-detail mode)               */
/* -------------------------------------------------------------------------- */

interface ListViewProps {
  tasks: Task[];
  laneOrder: { id: string; name: string }[];
  groupOf: (id: string) => string;
  selected: string | null;
  matchesFilter: (status: TaskStatus) => boolean;
  renderCtx: (id: string) => TaskRenderContext;
  onSelect: (id: string) => void;
  registerRow: (id: string, el: HTMLButtonElement | null) => void;
}

function ListView({ tasks, laneOrder, groupOf, selected, matchesFilter, renderCtx, onSelect, registerRow }: ListViewProps) {
  const byLane = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!matchesFilter(t.status)) continue;
    const g = groupOf(t.id);
    const arr = byLane.get(g) ?? [];
    arr.push(t);
    byLane.set(g, arr);
  }
  const anyVisible = [...byLane.values()].some((arr) => arr.length > 0);

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-[var(--color-surface)] p-2 [border:1px_solid_var(--color-border)]">
      {!anyVisible ? (
        <p className="px-2 py-4 text-center text-[12.5px] text-[var(--color-muted)]">No tasks match the current filter.</p>
      ) : null}
      {laneOrder.map((lane) => {
        const laneTasks = byLane.get(lane.id);
        if (!laneTasks || laneTasks.length === 0) return null;
        return (
          <div key={lane.id}>
            <h3 className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">{lane.name}</h3>
            <ul className="flex flex-col gap-1.5" role="list">
              {laneTasks.map((t) => (
                <ListRow
                  key={t.id}
                  task={t}
                  ctx={renderCtx(t.id)}
                  selected={selected === t.id}
                  onSelect={onSelect}
                  registerRow={registerRow}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function ListRow({
  task,
  ctx,
  selected,
  onSelect,
  registerRow,
}: {
  task: Task;
  ctx: TaskRenderContext;
  selected: boolean;
  onSelect: (id: string) => void;
  registerRow: (id: string, el: HTMLButtonElement | null) => void;
}) {
  const meta = STATUS_META[task.status];
  return (
    <li className="rounded-lg [border:1px_solid_var(--color-border)]">
      <button
        type="button"
        ref={(el) => registerRow(task.id, el)}
        data-task-row={task.id}
        aria-pressed={selected}
        aria-expanded={selected}
        onClick={() => onSelect(task.id)}
        className={cn(
          "flex w-full flex-col gap-1 rounded-lg px-3 py-2 text-left outline-none transition-colors hover:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
          selected && "bg-[color-mix(in_oklab,var(--color-accent)_8%,transparent)]",
        )}
      >
        <span className="flex items-center gap-2">
          <StatusPill status={task.status} size="sm" />
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--color-fg)]">{task.title}</span>
          {ctx.isBottleneck ? (
            <span className="rounded px-1 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide" style={{ color: statusVars("warning").color, background: statusVars("warning").bg }}>
              Bottleneck
            </span>
          ) : null}
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-[var(--color-muted)]">
          <span>
            {ctx.blockedBy.length ? (
              <span className="font-medium" style={{ color: statusVars("warning").color }}>
                Blocked by {ctx.blockedBy.length}
              </span>
            ) : (
              "Not blocked"
            )}
          </span>
          <span>Unblocks {ctx.dependents.length}</span>
          {task.blockedReason && ctx.blockedBy.length ? <span className="italic">{task.blockedReason}</span> : null}
        </span>
      </button>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail panel — what blocks this / what it unblocks / edit                  */
/* -------------------------------------------------------------------------- */

interface TaskDetailProps {
  task: Task;
  ctx: TaskRenderContext;
  allTasks: Task[];
  laneOrder: { id: string; name: string }[];
  groupOf: (id: string) => string;
  groupName: (id: string) => string;
  reduced: boolean;
  renderDetails?: (task: Task, ctx: TaskRenderContext) => React.ReactNode;
  onNavigate: (id: string) => void;
  onAddDependency?: (taskId: string, dependencyId: string) => void;
  onRemoveDependency?: (taskId: string, dependencyId: string) => void;
  onMove?: (taskId: string, toGroup: string) => void;
  moving: boolean;
}

function TaskDetail({
  task,
  ctx,
  allTasks,
  laneOrder,
  groupOf,
  groupName,
  reduced,
  renderDetails,
  onNavigate,
  onAddDependency,
  onRemoveDependency,
  onMove,
  moving,
}: TaskDetailProps) {
  const [addOpen, setAddOpen] = React.useState(false);
  const [moveOpen, setMoveOpen] = React.useState(false);

  // Eligible new prerequisites: not itself, not already a prerequisite. Cycle
  // safety is the app's job (it may reject and surface a cycle error).
  const existing = new Set(task.dependencyIds);
  const eligible = allTasks.filter((t) => t.id !== task.id && !existing.has(t.id));
  const otherGroups = laneOrder.filter((l) => l.id !== groupOf(task.id));
  const meta = STATUS_META[task.status];

  return (
    <motion.div
      layout={!reduced}
      className="flex h-full flex-col gap-3 rounded-xl bg-[var(--color-surface)] p-3 [border:1px_solid_var(--color-border)]"
    >
      {/* header */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-[14px] font-semibold leading-snug text-[var(--color-fg)]">{task.title}</h3>
          {task.milestone ? (
            <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold text-[var(--color-accent)]" style={{ background: statusVars("active").bg }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>{P("M12 3 21 12 12 21 3 12 12 3Z")}</svg>
              Milestone
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill status={task.status} size="sm" />
          <span className="text-[11.5px] text-[var(--color-muted)]">{groupName(groupOf(task.id))}</span>
          {ctx.isBottleneck ? (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: statusVars("warning").color, background: statusVars("warning").bg }}>
              Bottleneck
            </span>
          ) : null}
        </div>
        {task.blockedReason && ctx.blockedBy.length ? (
          <p
            className="rounded-md px-2 py-1 text-[12px]"
            style={{ background: statusVars("warning").bg, color: statusVars("warning").color, border: `1px solid ${statusVars("warning").border}` }}
          >
            {task.blockedReason}
          </p>
        ) : null}
        {task.dueDate != null || task.assignee || task.progress != null ? (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-[var(--color-muted)]">
            {task.assignee ? <span>{task.assignee}</span> : null}
            {task.dueDate != null ? <span>Due {formatDate(task.dueDate)}</span> : null}
            {task.progress != null ? <span>{Math.round(task.progress * 100)}% done</span> : null}
          </p>
        ) : null}
      </div>

      {renderDetails ? (
        renderDetails(task, ctx)
      ) : (
        <>
          {/* what blocks this */}
          <RelationList
            title="What blocks this"
            emptyLabel="Nothing — all prerequisites are done."
            tasks={ctx.prerequisites}
            highlight={(t) => t.status !== "completed" && t.status !== "cancelled"}
            onNavigate={onNavigate}
            onRemove={onRemoveDependency ? (depId) => onRemoveDependency(task.id, depId) : undefined}
          />

          {/* what this unblocks */}
          <RelationList
            title="What this unblocks"
            emptyLabel="Nothing depends on this task."
            tasks={ctx.dependents}
            onNavigate={onNavigate}
          />
        </>
      )}

      {/* edit controls */}
      <div className="mt-auto flex flex-col gap-1.5 border-t border-[var(--color-border)] pt-2.5">
        {onAddDependency && eligible.length > 0 ? (
          <MenuControl
            open={addOpen}
            setOpen={setAddOpen}
            triggerLabel="Add prerequisite"
            menuLabel={`Add a prerequisite to ${task.title}`}
            items={eligible.map((t) => ({ id: t.id, label: t.title, sublabel: STATUS_META[t.status].label }))}
            onPick={(depId) => onAddDependency(task.id, depId)}
          />
        ) : null}
        {onMove && otherGroups.length > 0 ? (
          <MenuControl
            open={moveOpen}
            setOpen={setMoveOpen}
            triggerLabel={moving ? "Moving…" : "Move to group"}
            menuLabel={`Move ${task.title} to another group`}
            items={otherGroups.map((g) => ({ id: g.id, label: g.name }))}
            onPick={(groupId) => onMove(task.id, groupId)}
          />
        ) : null}
      </div>
    </motion.div>
  );
}

function RelationList({
  title,
  emptyLabel,
  tasks,
  highlight,
  onNavigate,
  onRemove,
}: {
  title: string;
  emptyLabel: string;
  tasks: Task[];
  highlight?: (t: Task) => boolean;
  onNavigate: (id: string) => void;
  onRemove?: (id: string) => void;
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
          {tasks.map((t) => {
            const flagged = highlight?.(t) ?? false;
            return (
              <li key={t.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onNavigate(t.id)}
                  className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[12.5px] outline-none transition-colors hover:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                >
                  <span
                    className="grid h-4 w-4 shrink-0 place-items-center rounded-full"
                    style={{ color: statusVars(STATUS_META[t.status].tone).color, background: statusVars(STATUS_META[t.status].tone).bg }}
                  >
                    <StatusIcon status={t.status} size={10} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[var(--color-fg)]">{t.title}</span>
                  {flagged ? (
                    <span className="shrink-0 text-[10.5px] font-medium" style={{ color: statusVars("warning").color }}>
                      pending
                    </span>
                  ) : null}
                </button>
                {onRemove ? (
                  <button
                    type="button"
                    aria-label={`Remove ${t.title} as a prerequisite`}
                    onClick={() => onRemove(t.id)}
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[var(--color-muted)] outline-none transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>{P("M6 6l12 12M18 6 6 18")}</svg>
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function MenuControl({
  open,
  setOpen,
  triggerLabel,
  menuLabel,
  items,
  onPick,
}: {
  open: boolean;
  setOpen: (o: boolean) => void;
  triggerLabel: string;
  menuLabel: string;
  items: { id: string; label: string; sublabel?: string }[];
  onPick: (id: string) => void;
}) {
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  // The menu opens upward, left-aligned; portal it to <body> with position:fixed
  // so an ancestor's overflow-hidden (preview cards, scroll containers) can't clip it.
  const anchor = useAnchoredPortal(open, { side: "top", align: "start", gap: 4 });
  // Merge the local focus-restore ref with the anchor's trigger ref.
  const setTriggerRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      btnRef.current = node;
      (anchor.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
    },
    [anchor.triggerRef],
  );
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <div className="relative">
      <button
        ref={setTriggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="inline-flex w-full items-center justify-between gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      >
        {triggerLabel}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden style={{ transform: open ? "rotate(180deg)" : "none" }}>
          {P("m6 9 6 6 6-6")}
        </svg>
      </button>
      {anchor.renderInPortal(
        open && anchor.anchored ? (
        <ul
          role="menu"
          aria-label={menuLabel}
          ref={anchor.panelRef as React.RefObject<HTMLUListElement>}
          style={anchor.panelStyle}
          className="z-[60] max-h-56 min-w-[200px] overflow-auto rounded-xl bg-[var(--color-surface)] py-1 shadow-[var(--shadow-md,0_8px_24px_rgba(0,0,0,0.14))] [border:1px_solid_var(--color-border)]"
        >
          {items.map((it) => (
            <li key={it.id} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onPick(it.id);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[12.5px] text-[var(--color-fg)] outline-none transition-colors hover:bg-[var(--color-bg-secondary)] focus-visible:bg-[var(--color-bg-secondary)]"
              >
                <span className="min-w-0 truncate">{it.label}</span>
                {it.sublabel ? <span className="shrink-0 text-[11px] text-[var(--color-muted)]">{it.sublabel}</span> : null}
              </button>
            </li>
          ))}
        </ul>
        ) : null,
      )}
    </div>
  );
}

export default TaskDependencyMap;
