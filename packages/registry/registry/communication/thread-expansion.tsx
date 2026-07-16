"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  formatTimestamp as defaultFormatTimestamp,
} from "@/lib/motionkit";

/* --------------------------------------------------------------------------
 * ThreadExpansion — a NAVIGATION + EXPANSION surface for a deeply nested
 * discussion (forum branch, code-review thread, design critique, support
 * escalation). Its job is orientation and traversal of STRUCTURE, not authoring:
 * "where am I in the thread", "which branch has unread", "how do I get back to
 * the parent", "which path is selected", "which branches are resolved".
 *
 * It renders an accessible TREE (role="tree" / "treeitem" with aria-level +
 * aria-expanded + aria-selected + roving tabindex) over a flat (`parentId`) or
 * nested (`children`) node set. Branches collapse/expand, resolved branches can
 * start collapsed, a "Next unread" control walks unread branches expanding the
 * path to each, "Go to parent" climbs the hierarchy, and a text breadcrumb names
 * the selected path. Deep branches are indentation-capped and never auto-expanded
 * past a safe depth, so a pathological thread can't render thousands of rows.
 *
 * PRESENTATION ONLY. The app owns the node data, unread accounting, resolution,
 * and lazy reply loading (`replyCount` may exceed loaded `children`; the app
 * drives `loadingId` / `errorId`). The component never mutates the tree or
 * invents an outcome. This is deliberately DISTINCT from CommentThread, which
 * owns comment creation / reactions / optimistic send. Clean-room original.
 * ----------------------------------------------------------------------- */

export interface ThreadAuthor {
  /** Stable identity — drives keys and avatar hue. */
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

export interface ThreadNode {
  /** Stable id — drives keys, selection, and parent/child relationships. */
  id: string;
  /** Parent id for flat data. Nested `children` are also supported. */
  parentId?: string | null;
  author: ThreadAuthor;
  /** Reply content, or a render slot. Ignored (placeholder shown) when `deleted`. */
  body?: React.ReactNode;
  timestamp: Date | number | string;
  /** Total replies the app knows exist in this branch (may exceed loaded children). */
  replyCount?: number;
  /** Unread items within this branch (self + descendants), app-owned. Drives the badge. */
  unreadCount?: number;
  /** Whether THIS node itself is unread (drives the "Unread" text marker, not colour only). */
  unread?: boolean;
  /** App-owned resolved flag — resolved branches can start collapsed. */
  resolved?: boolean;
  /** Tombstone — renders a "removed" placeholder but the branch stays navigable. */
  deleted?: boolean;
  /** Initial collapsed hint for an uncontrolled tree. */
  collapsed?: boolean;
  /** Free-form metadata rendered as small text chips. */
  metadata?: Record<string, string | number>;
  /** Nested replies (alternative to flat `parentId`). */
  children?: ThreadNode[];
}

export interface ThreadExpansionProps {
  /** Node data — flat with `parentId`, or nested with `children`. */
  nodes: ThreadNode[];
  /** Render only this subtree (a focused branch). Omit to render all roots. */
  rootId?: string;
  /** Controlled selected node (e.g. a deep-linked reply). Highlights its path. */
  selectedId?: string;
  /** Initial selection when uncontrolled. */
  defaultSelectedId?: string;
  /** Fired when a node is activated/selected. */
  onSelect?: (node: ThreadNode) => void;
  /** Controlled expanded branch ids. */
  expandedIds?: string[];
  /** Initial expanded branch ids when uncontrolled. Overrides depth-based defaults. */
  defaultExpandedIds?: string[];
  /** Fired whenever the expanded set changes. */
  onExpandedChange?: (ids: string[]) => void;
  /** Depth to auto-expand initially and via "Expand all" (safe limit). */
  defaultExpandDepth?: number;
  /** Load more replies for a branch whose loaded children are fewer than `replyCount`. */
  onLoadMore?: (node: ThreadNode) => void;
  /** Id of the branch currently loading replies (app-owned) — shows a loading row. */
  loadingId?: string;
  /** Id of the branch whose reply load failed (app-owned) — shows an error + Retry row. */
  errorId?: string;
  /** Message for the errored branch. */
  errorMessage?: string;
  /** Retry a failed reply load. */
  onRetryLoad?: (node: ThreadNode) => void;
  /** Fired when the user climbs to a parent (via the toolbar or ArrowLeft). */
  onNavigateParent?: (parent: ThreadNode, from: ThreadNode) => void;
  /** Fired when "Next unread" jumps to an unread branch. */
  onNavigateUnread?: (node: ThreadNode) => void;
  /** Start resolved branches collapsed. */
  collapseResolved?: boolean;
  /** Hard cap on expansion depth ("Expand all" and auto-expand never exceed it). */
  maxAutoDepth?: number;
  /** Override timestamp formatting (defaults to a relative "3m ago"). */
  formatTimestamp?: (value: ThreadNode["timestamp"]) => string;
  /** Accessible label for the tree. */
  label?: string;
  /** Max height of the scroll region (px). */
  maxHeight?: number;
  className?: string;
}

const EASE: Transition["ease"] = [0.2, 0, 0, 1];
const INDENT_STEP = 16;
const MAX_INDENT_DEPTH = 6;

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

/** Flatten nested `children` into a flat, ordered list with `parentId` set. */
function flatten(nodes: ThreadNode[], parentId: string | null, out: ThreadNode[]): ThreadNode[] {
  for (const n of nodes) {
    const { children, ...rest } = n;
    out.push({ ...rest, parentId: n.parentId ?? parentId ?? undefined });
    if (children && children.length) flatten(children, n.id, out);
  }
  return out;
}

function Avatar({ author, size = 26 }: { author: ThreadAuthor; size?: number }) {
  const h = hueFromString(author.color ?? author.id + author.name);
  const bg = author.color ?? `linear-gradient(140deg, hsl(${h} 62% 52%), hsl(${(h + 42) % 360} 66% 42%))`;
  if (author.avatarUrl) {
    return (
      <img
        src={author.avatarUrl}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="grid shrink-0 select-none place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), background: bg }}
    >
      {initials(author.name)}
    </span>
  );
}

/* -- visible-row model --------------------------------------------------- */

type RowKind = "node" | "loadmore" | "loading" | "error" | "empty";

interface Row {
  /** Unique focus/roving key (a node has several possible rows beneath it). */
  key: string;
  kind: RowKind;
  node: ThreadNode;
  depth: number;
  /** For node rows: whether it can expand (has loaded children or more to load). */
  expandable: boolean;
  expanded: boolean;
  loadedCount: number;
}

/* -- component ----------------------------------------------------------- */

export function ThreadExpansion({
  nodes,
  rootId,
  selectedId,
  defaultSelectedId,
  onSelect,
  expandedIds,
  defaultExpandedIds,
  onExpandedChange,
  defaultExpandDepth = 1,
  onLoadMore,
  loadingId,
  errorId,
  errorMessage = "Couldn't load replies.",
  onRetryLoad,
  onNavigateParent,
  onNavigateUnread,
  collapseResolved = false,
  maxAutoDepth = 5,
  formatTimestamp,
  label = "Thread",
  maxHeight = 460,
  className,
}: ThreadExpansionProps) {
  const reduce = useReducedMotion();

  // `now` is set after mount only — never during render/SSR — so relative
  // timestamps can't cause a hydration mismatch.
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const fmt = React.useCallback(
    (v: ThreadNode["timestamp"]) => {
      if (formatTimestamp) return formatTimestamp(v);
      if (now == null) return defaultFormatTimestamp(v, {});
      return defaultFormatTimestamp(v, { relative: true, now });
    },
    [formatTimestamp, now],
  );

  /* -- index the tree --------------------------------------------------- */

  const flat = React.useMemo(() => flatten(nodes, null, []), [nodes]);
  const byId = React.useMemo(() => new Map(flat.map((n) => [n.id, n])), [flat]);
  const childrenOf = React.useCallback((id: string | null) => flat.filter((n) => (n.parentId ?? null) === id), [flat]);

  const roots = React.useMemo(() => {
    if (rootId) {
      const r = byId.get(rootId);
      return r ? [r] : [];
    }
    return childrenOf(null);
  }, [rootId, byId, childrenOf]);

  const parentOf = React.useCallback((id: string) => byId.get(id)?.parentId ?? null, [byId]);
  const ancestorsOf = React.useCallback(
    (id: string): string[] => {
      const out: string[] = [];
      let p = parentOf(id);
      const stopAt = rootId ?? null;
      while (p != null && p !== stopAt) {
        out.unshift(p);
        p = parentOf(p);
      }
      if (rootId && id !== rootId) out.unshift(rootId);
      return out;
    },
    [parentOf, rootId],
  );

  /** Full pre-order id list (regardless of expansion) — powers unread jumps. */
  const preOrder = React.useMemo(() => {
    const out: string[] = [];
    const walk = (list: ThreadNode[]) => {
      for (const n of list) {
        out.push(n.id);
        walk(childrenOf(n.id));
      }
    };
    walk(roots);
    return out;
  }, [roots, childrenOf]);

  const depthOf = React.useCallback((id: string) => ancestorsOf(id).length, [ancestorsOf]);

  /* -- expansion state (controlled or internal) ------------------------- */

  const computeDefaultExpanded = React.useCallback(() => {
    if (defaultExpandedIds) return new Set(defaultExpandedIds);
    const set = new Set<string>();
    for (const id of preOrder) {
      const node = byId.get(id)!;
      const d = depthOf(id);
      const hasKids = childrenOf(id).length > 0 || (node.replyCount ?? 0) > 0;
      if (!hasKids) continue;
      if (node.collapsed) continue;
      if (collapseResolved && node.resolved) continue;
      if (d < defaultExpandDepth) set.add(id);
    }
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byId, preOrder, childrenOf, depthOf, defaultExpandDepth, collapseResolved, defaultExpandedIds]);

  const [internalExpanded, setInternalExpanded] = React.useState<Set<string>>(computeDefaultExpanded);
  const isExpandedControlled = expandedIds !== undefined;
  const expanded = React.useMemo(
    () => (isExpandedControlled ? new Set(expandedIds) : internalExpanded),
    [isExpandedControlled, expandedIds, internalExpanded],
  );

  const commitExpanded = React.useCallback(
    (next: Set<string>) => {
      if (!isExpandedControlled) setInternalExpanded(next);
      onExpandedChange?.([...next]);
    },
    [isExpandedControlled, onExpandedChange],
  );

  /* -- selection state (controlled or internal) ------------------------- */

  const [internalSelected, setInternalSelected] = React.useState<string | undefined>(defaultSelectedId);
  const isSelectedControlled = selectedId !== undefined;
  const selected = isSelectedControlled ? selectedId : internalSelected;

  const selectNode = React.useCallback(
    (node: ThreadNode) => {
      if (!isSelectedControlled) setInternalSelected(node.id);
      onSelect?.(node);
    },
    [isSelectedControlled, onSelect],
  );

  /* -- roving focus ----------------------------------------------------- */

  const [activeKey, setActiveKey] = React.useState<string | null>(null);
  const rowRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());
  const pendingFocus = React.useRef<string | null>(null);
  const liveRef = React.useRef("");
  const [live, setLive] = React.useState("");
  const announce = React.useCallback((msg: string) => {
    liveRef.current = msg;
    setLive(msg);
  }, []);

  /* -- build visible rows ---------------------------------------------- */

  const rows = React.useMemo<Row[]>(() => {
    const out: Row[] = [];
    const walk = (list: ThreadNode[], depth: number) => {
      for (const node of list) {
        const kids = childrenOf(node.id);
        const total = node.replyCount ?? kids.length;
        const hasMore = total > kids.length;
        const expandable = kids.length > 0 || hasMore || (node.replyCount ?? 0) > 0;
        const isOpen = expanded.has(node.id);
        out.push({ key: node.id, kind: "node", node, depth, expandable, expanded: isOpen, loadedCount: kids.length });

        if (expandable && isOpen) {
          walk(kids, depth + 1);
          const childDepth = depth + 1;
          if (loadingId === node.id) {
            out.push({ key: `${node.id}::loading`, kind: "loading", node, depth: childDepth, expandable: false, expanded: false, loadedCount: kids.length });
          } else if (errorId === node.id) {
            out.push({ key: `${node.id}::error`, kind: "error", node, depth: childDepth, expandable: false, expanded: false, loadedCount: kids.length });
          } else if (hasMore) {
            out.push({ key: `${node.id}::more`, kind: "loadmore", node, depth: childDepth, expandable: false, expanded: false, loadedCount: kids.length });
          } else if (kids.length === 0) {
            out.push({ key: `${node.id}::empty`, kind: "empty", node, depth: childDepth, expandable: false, expanded: false, loadedCount: 0 });
          }
        }
      }
    };
    walk(roots, 0);
    return out;
  }, [roots, childrenOf, expanded, loadingId, errorId]);

  const rowIndex = React.useMemo(() => new Map(rows.map((r, i) => [r.key, i])), [rows]);

  // Keep the active row valid when the tree changes.
  React.useEffect(() => {
    if (rows.length === 0) {
      if (activeKey !== null) setActiveKey(null);
      return;
    }
    if (activeKey == null || !rowIndex.has(activeKey)) {
      setActiveKey(rows[0].key);
    }
  }, [rows, rowIndex, activeKey]);

  // Focus a row only after a keyboard/programmatic navigation asked for it.
  React.useLayoutEffect(() => {
    const key = pendingFocus.current;
    if (key == null) return;
    pendingFocus.current = null;
    rowRefs.current.get(key)?.focus();
  });

  const focusRow = React.useCallback((key: string) => {
    setActiveKey(key);
    pendingFocus.current = key;
  }, []);

  /* -- expansion operations -------------------------------------------- */

  const setBranchOpen = React.useCallback(
    (node: ThreadNode, open: boolean) => {
      const next = new Set(expanded);
      if (open) next.add(node.id);
      else {
        next.delete(node.id);
        // Focus preservation: if the active row is inside the collapsing branch,
        // move focus up to the branch we just collapsed.
        const activeNodeId = activeKey?.split("::")[0];
        if (activeNodeId && activeNodeId !== node.id) {
          const chain = new Set(ancestorsOf(activeNodeId));
          if (chain.has(node.id)) focusRow(node.id);
        }
      }
      commitExpanded(next);
    },
    [expanded, commitExpanded, activeKey, ancestorsOf, focusRow],
  );

  const expandAll = React.useCallback(() => {
    const next = new Set(expanded);
    for (const id of preOrder) {
      const node = byId.get(id)!;
      const hasKids = childrenOf(id).length > 0 || (node.replyCount ?? 0) > 0;
      if (hasKids && depthOf(id) < maxAutoDepth) next.add(id);
    }
    commitExpanded(next);
    announce("Expanded all branches");
  }, [expanded, preOrder, byId, childrenOf, depthOf, maxAutoDepth, commitExpanded, announce]);

  const collapseAll = React.useCallback(() => {
    commitExpanded(new Set());
    announce("Collapsed all branches");
  }, [commitExpanded, announce]);

  const expandPathTo = React.useCallback(
    (id: string) => {
      const next = new Set(expanded);
      for (const a of ancestorsOf(id)) next.add(a);
      commitExpanded(next);
    },
    [expanded, ancestorsOf, commitExpanded],
  );

  /* -- toolbar navigation ---------------------------------------------- */

  const activeNodeId = activeKey?.split("::")[0] ?? selected ?? null;

  const goToParent = React.useCallback(() => {
    const from = activeNodeId ? byId.get(activeNodeId) : undefined;
    if (!from) return;
    const pid = from.parentId ?? null;
    if (pid == null) {
      announce("Already at a top-level reply");
      return;
    }
    const parent = byId.get(pid);
    if (!parent) return;
    selectNode(parent);
    focusRow(parent.id);
    onNavigateParent?.(parent, from);
    announce(`Moved to parent by ${parent.author.name}`);
  }, [activeNodeId, byId, selectNode, focusRow, onNavigateParent, announce]);

  const nextUnread = React.useCallback(() => {
    const startId = activeNodeId ?? selected ?? null;
    const startIdx = startId ? preOrder.indexOf(startId) : -1;
    const ordered = [...preOrder.slice(startIdx + 1), ...preOrder.slice(0, startIdx + 1)];
    const target = ordered.map((id) => byId.get(id)!).find((n) => n && n.unread && n.id !== startId);
    if (!target) {
      announce("No unread replies");
      return;
    }
    expandPathTo(target.id);
    selectNode(target);
    focusRow(target.id);
    onNavigateUnread?.(target);
    announce(`Jumped to unread reply by ${target.author.name}`);
  }, [activeNodeId, selected, preOrder, byId, expandPathTo, selectNode, focusRow, onNavigateUnread, announce]);

  const unreadTotal = React.useMemo(() => flat.reduce((n, x) => (x.unread ? n + 1 : n), 0), [flat]);

  /* -- selected-path breadcrumb ---------------------------------------- */

  const pathIds = React.useMemo(() => {
    if (!selected || !byId.has(selected)) return [];
    return [...ancestorsOf(selected), selected];
  }, [selected, byId, ancestorsOf]);

  /* -- row activation + keyboard --------------------------------------- */

  const activateRow = React.useCallback(
    (row: Row) => {
      switch (row.kind) {
        case "node":
          selectNode(row.node);
          break;
        case "loadmore":
          onLoadMore?.(row.node);
          announce(`Loading replies for ${row.node.author.name}'s branch`);
          break;
        case "error":
          onRetryLoad?.(row.node);
          announce("Retrying reply load");
          break;
        default:
          break;
      }
    },
    [selectNode, onLoadMore, onRetryLoad, announce],
  );

  const onRowKeyDown = React.useCallback(
    (e: React.KeyboardEvent, row: Row, index: number) => {
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = rows[Math.min(rows.length - 1, index + 1)];
          if (next) focusRow(next.key);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = rows[Math.max(0, index - 1)];
          if (prev) focusRow(prev.key);
          break;
        }
        case "ArrowRight": {
          if (row.kind !== "node") return;
          e.preventDefault();
          if (row.expandable && !row.expanded) {
            setBranchOpen(row.node, true);
          } else if (row.expanded) {
            const child = rows[index + 1];
            if (child) focusRow(child.key);
          }
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          if (row.kind === "node" && row.expanded) {
            setBranchOpen(row.node, false);
          } else {
            const pid = row.node.parentId ?? null;
            if (pid != null && rowIndex.has(pid)) focusRow(pid);
          }
          break;
        }
        case "Home": {
          e.preventDefault();
          if (rows[0]) focusRow(rows[0].key);
          break;
        }
        case "End": {
          e.preventDefault();
          const last = rows[rows.length - 1];
          if (last) focusRow(last.key);
          break;
        }
        case "Enter":
        case " ": {
          e.preventDefault();
          activateRow(row);
          break;
        }
        default:
          break;
      }
    },
    [rows, rowIndex, focusRow, setBranchOpen, activateRow],
  );

  /* -- render ----------------------------------------------------------- */

  const toolbarBtn =
    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

  const activeParentId = activeNodeId ? byId.get(activeNodeId)?.parentId ?? null : null;

  return (
    <section
      aria-label={label}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl bg-[var(--color-surface)] shadow-[var(--shadow-md)] [border:1px_solid_var(--color-border)]",
        className,
      )}
    >
      {/* header + toolbar */}
      <div className="flex flex-col gap-2 border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[14px] font-semibold text-[var(--color-fg)]">{label}</h3>
          <span className="rounded-full bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[12px] font-medium text-[var(--color-muted)] tabular-nums">
            {flat.length} {flat.length === 1 ? "reply" : "replies"}
          </span>
          {unreadTotal > 0 ? (
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--color-accent)]">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              {unreadTotal} unread
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Thread navigation">
          <button type="button" className={toolbarBtn} onClick={nextUnread} disabled={unreadTotal === 0}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Next unread
          </button>
          <button type="button" className={toolbarBtn} onClick={goToParent} disabled={activeParentId == null}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Go to parent
          </button>
          <button type="button" className={toolbarBtn} onClick={expandAll}>
            Expand all
          </button>
          <button type="button" className={toolbarBtn} onClick={collapseAll}>
            Collapse all
          </button>
        </div>

        {/* selected-path breadcrumb — "where am I / which path is selected", as text */}
        {pathIds.length > 0 ? (
          <nav aria-label="Selected reply path" className="flex flex-wrap items-center gap-1 text-[12px] text-[var(--color-muted)]">
            <span className="font-medium text-[var(--color-fg)]">Selected path:</span>
            {pathIds.map((id, i) => {
              const n = byId.get(id);
              if (!n) return null;
              const isLast = i === pathIds.length - 1;
              return (
                <React.Fragment key={id}>
                  {i > 0 ? <span aria-hidden className="text-[var(--color-muted)]">›</span> : null}
                  <button
                    type="button"
                    onClick={() => {
                      expandPathTo(id);
                      selectNode(n);
                      focusRow(id);
                    }}
                    aria-current={isLast ? "true" : undefined}
                    className={cn(
                      "rounded px-1 py-0.5 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
                      isLast ? "font-semibold text-[var(--color-fg)]" : "text-[var(--color-muted)]",
                    )}
                  >
                    {n.author.name}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        ) : null}
      </div>

      {/* tree */}
      <div className="overflow-y-auto px-1.5 py-2" style={{ maxHeight }}>
        {rows.length === 0 ? (
          <p className="px-2 py-8 text-center text-[13px] text-[var(--color-muted)]">No replies in this thread yet.</p>
        ) : (
          <div role="tree" aria-label={label} className="flex flex-col">
            <AnimatePresence initial={false}>
              {rows.map((row, index) => {
                const indent = Math.min(row.depth, MAX_INDENT_DEPTH) * INDENT_STEP;
                const isActive = activeKey === row.key;
                const common = {
                  ref: (el: HTMLDivElement | null) => {
                    if (el) rowRefs.current.set(row.key, el);
                    else rowRefs.current.delete(row.key);
                  },
                  role: "treeitem" as const,
                  "aria-level": row.depth + 1,
                  tabIndex: isActive ? 0 : -1,
                  onKeyDown: (e: React.KeyboardEvent) => onRowKeyDown(e, row, index),
                  onFocus: () => setActiveKey(row.key),
                };

                return (
                  <motion.div
                    key={row.key}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0 }}
                    transition={{ duration: 0.16, ease: EASE }}
                    style={{ paddingLeft: indent }}
                  >
                    {row.kind === "node" ? (
                      <NodeRow
                        {...common}
                        aria-expanded={row.expandable ? row.expanded : undefined}
                        aria-selected={selected === row.node.id}
                        node={row.node}
                        expandable={row.expandable}
                        expanded={row.expanded}
                        active={isActive}
                        reduce={reduce}
                        fmt={fmt}
                        onToggle={() => setBranchOpen(row.node, !row.expanded)}
                        onSelect={() => selectNode(row.node)}
                      />
                    ) : (
                      <BranchStatusRow {...common} row={row} errorMessage={errorMessage} active={isActive} onActivate={() => activateRow(row)} />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* SR-only live region for navigation announcements */}
      <div aria-live="polite" role="status" className="sr-only">
        {live}
      </div>
    </section>
  );
}

/* -- node row ------------------------------------------------------------ */

interface NodeRowProps extends React.HTMLAttributes<HTMLDivElement> {
  node: ThreadNode;
  expandable: boolean;
  expanded: boolean;
  active: boolean;
  reduce: boolean;
  fmt: (v: ThreadNode["timestamp"]) => string;
  onToggle: () => void;
  onSelect: () => void;
}

const NodeRow = React.forwardRef<HTMLDivElement, NodeRowProps>(function NodeRow(
  { node, expandable, expanded, active, reduce, fmt, onToggle, onSelect, ...rest },
  ref,
) {
  const isSelected = rest["aria-selected"] === true;
  const unreadBranch = (node.unreadCount ?? 0) > 0 && !expanded;
  const timeIso = new Date(toMs(node.timestamp)).toISOString();

  return (
    <div
      ref={ref}
      {...rest}
      onClick={onSelect}
      className={cn(
        "group flex cursor-pointer items-start gap-1.5 rounded-lg px-2 py-1.5 outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
        // ONE calm selection cue: a single accent left-bar over a light tint. The
        // ancestry of the selection is shown by the "Selected path" breadcrumb, so
        // path rows carry no extra tint (which read as competing filled cards).
        isSelected
          ? "bg-[color-mix(in_oklab,var(--color-accent)_9%,transparent)] [box-shadow:inset_3px_0_0_var(--color-accent)]"
          : "hover:bg-[var(--color-bg-secondary)]",
        node.unread && !isSelected && "bg-[color-mix(in_oklab,var(--color-accent)_5%,transparent)]",
      )}
    >
      {/* expand/collapse chevron — decorative; the treeitem carries the
          aria-expanded state and keyboard toggling happens via Arrow keys. */}
      {expandable ? (
        <span
          aria-hidden
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="mt-0.5 grid h-5 w-5 shrink-0 cursor-pointer place-items-center rounded text-[var(--color-muted)] transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)]"
        >
          <motion.svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            animate={reduce ? undefined : { rotate: expanded ? 90 : 0 }}
            style={reduce ? { transform: expanded ? "rotate(90deg)" : "none" } : undefined}
            transition={{ duration: 0.16, ease: EASE }}
          >
            <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </span>
      ) : (
        <span aria-hidden className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center text-[var(--color-border)]">
          <span className="h-1 w-1 rounded-full bg-[var(--color-border)]" />
        </span>
      )}

      <Avatar author={node.author} size={24} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[13px] font-semibold text-[var(--color-fg)]">{node.author.name}</span>
          {node.author.role ? <span className="text-[11px] text-[var(--color-muted)]">{node.author.role}</span> : null}
          <time className="text-[12px] text-[var(--color-muted)]" dateTime={timeIso}>
            {fmt(node.timestamp)}
          </time>
          {node.unread ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-accent)]">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              Unread
            </span>
          ) : null}
          {node.resolved ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--color-success)_14%,transparent)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-success)]">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 12.5 9 17.5 20 6.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Resolved
            </span>
          ) : null}
        </div>

        {node.deleted ? (
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] italic text-[var(--color-muted)]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            This reply was removed.
          </p>
        ) : node.body != null ? (
          <div className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-[var(--color-fg)]">
            {node.body}
          </div>
        ) : null}

        {/* branch summary — "which branch has unread / how deep", as text */}
        {node.metadata || (expandable && !expanded) ? (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {expandable && !expanded && (node.replyCount ?? 0) > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-[11px] text-[var(--color-muted)]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 5h16v10H9l-4 4V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {node.replyCount} {node.replyCount === 1 ? "reply" : "replies"}
              </span>
            ) : null}
            {unreadBranch ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-accent)]">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                {node.unreadCount} unread in branch
              </span>
            ) : null}
            {node.metadata
              ? Object.entries(node.metadata).map(([k, v]) => (
                  <span
                    key={k}
                    className="inline-flex items-center gap-1 rounded-md bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-[11px] text-[var(--color-muted)] [border:1px_solid_var(--color-border)]"
                  >
                    <span className="font-medium text-[var(--color-fg)]">{k}</span>
                    {String(v)}
                  </span>
                ))
              : null}
          </div>
        ) : null}
      </div>
    </div>
  );
});

/* -- load-more / loading / error / empty rows ---------------------------- */

interface BranchStatusRowProps extends React.HTMLAttributes<HTMLDivElement> {
  row: Row;
  errorMessage: string;
  active: boolean;
  onActivate: () => void;
}

const BranchStatusRow = React.forwardRef<HTMLDivElement, BranchStatusRowProps>(function BranchStatusRow(
  { row, errorMessage, active, onActivate, ...rest },
  ref,
) {
  const interactive = row.kind === "loadmore" || row.kind === "error";
  const remaining = (row.node.replyCount ?? 0) - row.loadedCount;

  return (
    <div
      ref={ref}
      {...rest}
      onClick={interactive ? onActivate : undefined}
      aria-busy={row.kind === "loading" ? true : undefined}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 pl-8 text-[12px] outline-none",
        interactive && "cursor-pointer hover:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
        row.kind === "error" ? "text-[var(--color-error)]" : "text-[var(--color-muted)]",
      )}
    >
      {row.kind === "loading" ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden className="animate-spin motion-reduce:animate-none">
            <path d="M12 3a9 9 0 1 0 9 9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <span>Loading replies…</span>
        </>
      ) : row.kind === "error" ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 8v5M12 16.5v.5M12 3 2 20h20L12 3Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-medium">{errorMessage}</span>
          <span className="ml-1 underline">Retry</span>
        </>
      ) : row.kind === "loadmore" ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-medium text-[var(--color-accent)]">
            Load {remaining > 0 ? remaining : "more"} {remaining === 1 ? "reply" : "replies"}
          </span>
        </>
      ) : (
        <span className="italic">No replies in this branch.</span>
      )}
    </div>
  );
});

export default ThreadExpansion;
