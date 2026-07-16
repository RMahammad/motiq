"use client";

/* --------------------------------------------------------------------------
 * KanbanCardMovement — a presentation-only *card movement interaction layer*
 * for a board. It is NOT a project-management app: the host application owns
 * the columns, the cards, WIP limits, validation, and persistence. This
 * component renders that data and owns only the *movement UX* — pointer drag,
 * touch drag, keyboard pick-up-and-move, a non-drag "Move" menu, drop
 * validation, drop indicators, and optimistic movement with failure rollback.
 *
 * Movement is implemented CLEAN-ROOM on native Pointer events + CSS transforms
 * (Motion for React is used only for the layout/FLIP reflow when cards settle
 * into a new slot). There is deliberately **no** third-party drag-and-drop
 * dependency (no dnd-kit / react-dnd / sortable) so the component stays small
 * and isolated.
 *
 * Accessibility (never drag-only):
 *  - Every card is a keyboard "pick up → arrow → drop" target (Space/Enter to
 *    grab, arrows to move between columns + positions, Enter to drop, Escape to
 *    cancel and return to origin).
 *  - Every card also exposes an always-available **Move** menu — a full non-drag
 *    path to move between columns with a mouse, keyboard, or switch device.
 *  - Origin + destination are announced in a polite live region; focus returns
 *    to the moved card after any move (drag, keyboard, menu, or rollback).
 *  - Columns/drop targets are labelled; WIP-limit state is conveyed with text
 *    (e.g. "Full"), never colour alone; reduced motion drops all transforms.
 *
 * Performance:
 *  - During a pointer drag only the dragged card is repositioned, via a CSS
 *    transform written straight to its ref inside requestAnimationFrame — there
 *    is **no** React state update per `pointermove`. The only state that changes
 *    mid-drag is the drop-slot index, and cards are `React.memo`'d so the rest
 *    of the board does not re-render as the indicator moves.
 *  - For very large boards, virtualize each column's card list (e.g.
 *    `@tanstack/react-virtual`) and feed only the visible cards in as `cards`;
 *    the movement math here is O(cards) per commit, not per frame, so it stays
 *    cheap. Keep column card counts bounded or windowed for 60fps drag.
 *
 * Clean-room original.
 * ----------------------------------------------------------------------- */

import * as React from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useAnchoredPortal } from "@/lib/motionstack";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface KanbanColumn {
  /** Stable id — referenced by cards and by move targets. */
  id: string;
  /** Human column title (also the accessible drop-target label). */
  title: string;
  /** Optional WIP limit. A move into a full column is rejected on drop. */
  limit?: number;
}

export interface KanbanCard {
  /** Stable id — passed back in every move payload. */
  id: string;
  /** The column this card currently lives in (app-owned). */
  columnId: string;
  /** Card title (the accessible name of the card). */
  title: string;
  /** Sort key within a column. Lower comes first. */
  order: number;
  /** Non-movable card — cannot be picked up, dragged, or targeted by its menu. */
  disabled?: boolean;
  /** Optional short meta line (assignee, tag, points…). Rendered, not parsed. */
  meta?: string;
}

/** Payload handed to `onMove` when a move is committed. */
export interface KanbanMove {
  cardId: string;
  /** Column the card came from. */
  fromColumn: string;
  /** Column the card is moving into. */
  toColumn: string;
  /** Final zero-based index within `toColumn`. */
  toIndex: number;
}

/**
 * App-provided move validator. Return `true`/`false`, or a string reason that
 * is surfaced to the user when the move is blocked. Only consulted for moves
 * that change column (reordering within a column is always allowed).
 */
export type KanbanMoveValidator = (fromColumn: string, toColumn: string) => boolean | string;

export interface KanbanCardMovementProps {
  /** Ordered columns (app-owned). */
  columns: KanbanColumn[];
  /** All cards across all columns (app-owned). Positioned by `order`. */
  cards: KanbanCard[];
  /**
   * Commit handler. May be synchronous, or return a Promise for optimistic
   * movement: the card moves immediately and, if the Promise rejects, it rolls
   * back to its origin and the failure is announced.
   */
  onMove?: (move: KanbanMove) => void | Promise<unknown>;
  /** Extra app validation for cross-column moves. */
  moveValidation?: KanbanMoveValidator;
  /** Per-column WIP limits (overrides/augments `column.limit`). */
  columnLimits?: Record<string, number>;
  /** Highlight a card as selected (app-owned selection). */
  selectedCardId?: string;
  /** Notified when a card is focused/activated (for app-owned selection). */
  onSelectCard?: (cardId: string) => void;
  /** When provided, each column shows an "Add card" affordance. */
  onAddCard?: (columnId: string) => void;
  /** Accessible label for the whole board region. */
  label?: string;
  /** Force reduced motion regardless of the media query (demos/tests). */
  reducedMotion?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Pure arrangement helpers (app-data-agnostic)                               */
/* -------------------------------------------------------------------------- */

type Arrangement = Record<string, string[]>;

function deriveArrangement(columns: KanbanColumn[], cards: KanbanCard[]): Arrangement {
  const arr: Arrangement = {};
  for (const c of columns) arr[c.id] = [];
  const sorted = [...cards].sort((a, b) => a.order - b.order);
  for (const card of sorted) {
    if (arr[card.columnId]) arr[card.columnId].push(card.id);
  }
  return arr;
}

function arrangementsEqual(a: Arrangement, b: Arrangement): boolean {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    const av = a[k];
    const bv = b[k];
    if (!bv || av.length !== bv.length) return false;
    for (let i = 0; i < av.length; i++) if (av[i] !== bv[i]) return false;
  }
  return true;
}

function locate(arr: Arrangement, cardId: string): { col: string | null; index: number } {
  for (const col of Object.keys(arr)) {
    const i = arr[col].indexOf(cardId);
    if (i >= 0) return { col, index: i };
  }
  return { col: null, index: -1 };
}

/** Immutably move `cardId` to `toIndex` of `toColumn`; clamps out-of-range. */
function moveCardInArrangement(arr: Arrangement, cardId: string, toColumn: string, toIndex: number): Arrangement {
  const next: Arrangement = {};
  for (const col of Object.keys(arr)) next[col] = arr[col].filter((id) => id !== cardId);
  const list = next[toColumn] ?? (next[toColumn] = []);
  const clamped = Math.max(0, Math.min(toIndex, list.length));
  list.splice(clamped, 0, cardId);
  return next;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function KanbanCardMovement({
  columns,
  cards,
  onMove,
  moveValidation,
  columnLimits,
  selectedCardId,
  onSelectCard,
  onAddCard,
  label = "Board",
  reducedMotion,
  className,
}: KanbanCardMovementProps) {
  const mediaReduced = useReducedMotion();
  const reduced = reducedMotion ?? mediaReduced;

  const [arrangement, setArrangement] = React.useState<Arrangement>(() => deriveArrangement(columns, cards));
  const [grab, setGrab] = React.useState<{ cardId: string; snapshot: Arrangement } | null>(null);
  const [dropTarget, setDropTarget] = React.useState<{ col: string; index: number } | null>(null);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const [focusToken, setFocusToken] = React.useState(0);

  const byId = React.useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const columnById = React.useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns]);

  const pendingRef = React.useRef(false);
  const grabbing = grab !== null;

  // Refs mirror grab state so the keyboard handler reads a consistent value even
  // across rapidly-batched key events (before React re-renders).
  const grabRef = React.useRef(grab);
  grabRef.current = grab;
  const grabPosRef = React.useRef<{ col: string; index: number } | null>(null);

  /* Re-seed internal arrangement from app data when it changes — but never
   * while a move is optimistically pending or a keyboard grab is in flight, so
   * we don't clobber in-progress interaction. */
  React.useEffect(() => {
    if (pendingRef.current || grabbing) return;
    const next = deriveArrangement(columns, cards);
    setArrangement((prev) => (arrangementsEqual(prev, next) ? prev : next));
  }, [columns, cards, grabbing]);

  /* Focus restoration — after any commit/rollback, return focus to the card. */
  const handleRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());
  const pendingFocusRef = React.useRef<string | null>(null);
  const focusCard = React.useCallback((id: string) => {
    pendingFocusRef.current = id;
    setFocusToken((t) => t + 1);
  }, []);
  React.useEffect(() => {
    const id = pendingFocusRef.current;
    if (id == null) return;
    pendingFocusRef.current = null;
    handleRefs.current.get(id)?.focus();
  }, [focusToken, arrangement]);

  const announce = React.useCallback((msg: string) => setAnnouncement(msg), []);

  const columnTitle = React.useCallback(
    (id: string | null) => (id ? columnById.get(id)?.title ?? id : ""),
    [columnById],
  );

  /* Stable context for pointer/keyboard handlers so memoized cards don't
   * re-render when unrelated state (like the drop indicator) changes. */
  const ctx = React.useRef({
    columns,
    byId,
    columnById,
    columnLimits,
    onMove,
    moveValidation,
    arrangement,
  });
  ctx.current = { columns, byId, columnById, columnLimits, onMove, moveValidation, arrangement };

  const resolveLimit = React.useCallback((columnId: string): number | undefined => {
    const c = ctx.current;
    return c.columnLimits?.[columnId] ?? c.columnById.get(columnId)?.limit;
  }, []);

  const validateMove = React.useCallback(
    (fromColumn: string, toColumn: string, snapshot: Arrangement, cardId: string): { ok: boolean; reason?: string } => {
      const c = ctx.current;
      if (fromColumn === toColumn) return { ok: true }; // pure reorder is always allowed
      const custom = c.moveValidation?.(fromColumn, toColumn);
      if (custom === false) return { ok: false, reason: `Cannot move into ${columnTitle(toColumn)}.` };
      if (typeof custom === "string") return { ok: false, reason: custom };
      const limit = resolveLimit(toColumn);
      if (limit != null) {
        const count = (snapshot[toColumn] ?? []).filter((id) => id !== cardId).length;
        if (count >= limit) return { ok: false, reason: `${columnTitle(toColumn)} is at its limit of ${limit}.` };
      }
      return { ok: true };
    },
    [columnTitle, resolveLimit],
  );

  /**
   * The single commit path used by drag, keyboard, and the move menu. Applies
   * the move optimistically, calls `onMove`, and rolls back on async rejection.
   */
  const finalizeMove = React.useCallback(
    (args: { cardId: string; toColumn: string; toIndex: number; snapshot: Arrangement }) => {
      const { cardId, toColumn, toIndex, snapshot } = args;
      const c = ctx.current;
      const card = c.byId.get(cardId);
      if (!card) return;

      const origin = locate(snapshot, cardId);
      const fromColumn = card.columnId;
      const provisional = moveCardInArrangement(snapshot, cardId, toColumn, toIndex);
      const dest = locate(provisional, cardId);

      // No effective change → just settle back and keep focus.
      if (dest.col === origin.col && dest.index === origin.index) {
        setArrangement(snapshot);
        focusCard(cardId);
        return;
      }

      const verdict = validateMove(fromColumn, toColumn, snapshot, cardId);
      if (!verdict.ok) {
        setArrangement(snapshot);
        announce(`Move blocked. ${verdict.reason ?? ""}`.trim());
        focusCard(cardId);
        return;
      }

      setArrangement(provisional);
      const move: KanbanMove = { cardId, fromColumn, toColumn: dest.col!, toIndex: dest.index };
      announce(
        `${card.title} moved from ${columnTitle(fromColumn)} to ${columnTitle(dest.col)}, position ${dest.index + 1} of ${provisional[dest.col!].length}.`,
      );
      focusCard(cardId);

      const result = c.onMove?.(move);
      if (result && typeof (result as PromiseLike<unknown>).then === "function") {
        pendingRef.current = true;
        (result as Promise<unknown>).then(
          () => {
            pendingRef.current = false;
          },
          () => {
            pendingRef.current = false;
            setArrangement(snapshot);
            announce(`Move failed. ${card.title} returned to ${columnTitle(fromColumn)}.`);
            focusCard(cardId);
          },
        );
      }
    },
    [announce, columnTitle, focusCard, validateMove],
  );

  const moveToColumnEnd = React.useCallback(
    (cardId: string, toColumn: string) => {
      const snapshot = ctx.current.arrangement;
      const list = snapshot[toColumn] ?? [];
      finalizeMove({ cardId, toColumn, toIndex: list.length, snapshot });
    },
    [finalizeMove],
  );

  /* ---- keyboard pick-up-and-move ------------------------------------- */

  const onCardKeyDown = React.useCallback(
    (e: React.KeyboardEvent, cardId: string) => {
      const c = ctx.current;
      const card = c.byId.get(cardId);
      if (!card || card.disabled) return;
      const key = e.key;
      const isActivate = key === " " || key === "Enter" || key === "Spacebar";
      const grab = grabRef.current;

      // Not currently grabbing this card → Space/Enter picks it up.
      if (!grab || grab.cardId !== cardId) {
        if (isActivate) {
          e.preventDefault();
          const origin = locate(c.arrangement, cardId);
          grabRef.current = { cardId, snapshot: c.arrangement };
          grabPosRef.current = { col: origin.col!, index: origin.index };
          setGrab({ cardId, snapshot: c.arrangement });
          announce(
            `Picked up ${card.title}. Use arrow keys to move between columns and positions, Enter or Space to drop, Escape to cancel.`,
          );
        }
        return;
      }

      const snapshot = grab.snapshot;

      // Grabbing this card.
      if (key === "Escape") {
        e.preventDefault();
        grabRef.current = null;
        grabPosRef.current = null;
        setArrangement(snapshot);
        setGrab(null);
        announce(`Move cancelled. ${card.title} returned to ${columnTitle(card.columnId)}.`);
        focusCard(cardId);
        return;
      }
      if (isActivate) {
        e.preventDefault();
        const pos = grabPosRef.current ?? locate(c.arrangement, cardId);
        if (pos.col == null) return;
        grabRef.current = null;
        grabPosRef.current = null;
        setGrab(null);
        finalizeMove({ cardId, toColumn: pos.col, toIndex: pos.index, snapshot });
        return;
      }

      // Arrow movement — computed from the render-independent grab position and
      // the frozen snapshot, so batched key events never read stale state.
      const cur = grabPosRef.current ?? locate(c.arrangement, cardId);
      if (cur.col == null) return;
      const colIdx = c.columns.findIndex((col) => col.id === cur.col);
      const countIn = (colId: string) => (snapshot[colId] ?? []).filter((id) => id !== cardId).length;
      let nextCol = cur.col;
      let nextIndex = cur.index;

      if (key === "ArrowLeft") {
        if (colIdx > 0) {
          nextCol = c.columns[colIdx - 1].id;
          nextIndex = Math.min(cur.index, countIn(nextCol));
        }
      } else if (key === "ArrowRight") {
        if (colIdx < c.columns.length - 1) {
          nextCol = c.columns[colIdx + 1].id;
          nextIndex = Math.min(cur.index, countIn(nextCol));
        }
      } else if (key === "ArrowUp") {
        nextIndex = Math.max(0, cur.index - 1);
      } else if (key === "ArrowDown") {
        nextIndex = Math.min(cur.index + 1, countIn(cur.col));
      } else {
        return;
      }

      e.preventDefault();
      const next = moveCardInArrangement(snapshot, cardId, nextCol, nextIndex);
      const dest = locate(next, cardId);
      grabPosRef.current = { col: dest.col!, index: dest.index };
      setArrangement(next);
      // Moving across columns re-parents the card in the DOM (a new node), which
      // drops focus — restore it so the next keystroke still reaches the card.
      focusCard(cardId);
      announce(`${card.title} — ${columnTitle(dest.col)}, position ${dest.index + 1} of ${next[dest.col!].length}.`);
    },
    [announce, columnTitle, finalizeMove, focusCard],
  );

  /* ---- pointer / touch drag ------------------------------------------ */

  const dragState = React.useRef<{
    cardId: string;
    snapshot: Arrangement;
    pointerId: number;
    startX: number;
    startY: number;
    el: HTMLElement;
    moved: boolean;
    raf: number | null;
  } | null>(null);
  const dropTargetRef = React.useRef<{ col: string; index: number } | null>(null);

  const hitTest = React.useCallback((x: number, y: number, cardId: string): { col: string; index: number } | null => {
    if (typeof document === "undefined") return null;
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const colEl = el?.closest<HTMLElement>("[data-kanban-column]");
    if (!colEl) return null;
    const col = colEl.getAttribute("data-kanban-column");
    if (!col) return null;
    const cardEls = Array.from(colEl.querySelectorAll<HTMLElement>("[data-kanban-card]")).filter(
      (c) => c.getAttribute("data-kanban-card") !== cardId,
    );
    let index = cardEls.length;
    for (let i = 0; i < cardEls.length; i++) {
      const r = cardEls[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) {
        index = i;
        break;
      }
    }
    return { col, index };
  }, []);

  // Constant-identity listener wrappers so add/removeEventListener always match,
  // even though the underlying impls close over changing state via refs.
  const moveRef = React.useRef<(e: PointerEvent) => void>(() => {});
  const upRef = React.useRef<(e: PointerEvent) => void>(() => {});
  const cancelRef = React.useRef<(e: PointerEvent) => void>(() => {});
  const stableMove = React.useCallback((e: PointerEvent) => moveRef.current(e), []);
  const stableUp = React.useCallback((e: PointerEvent) => upRef.current(e), []);
  const stableCancel = React.useCallback((e: PointerEvent) => cancelRef.current(e), []);

  const endDrag = React.useCallback(
    (commit: boolean) => {
      const ds = dragState.current;
      if (!ds) return;
      if (ds.raf != null) cancelAnimationFrame(ds.raf);
      ds.el.style.transform = "";
      ds.el.style.zIndex = "";
      ds.el.style.pointerEvents = "";
      ds.el.removeEventListener("pointermove", stableMove);
      ds.el.removeEventListener("pointerup", stableUp);
      ds.el.removeEventListener("pointercancel", stableCancel);
      try {
        ds.el.releasePointerCapture(ds.pointerId);
      } catch {
        /* capture may already be gone */
      }
      const target = dropTargetRef.current;
      const { cardId, snapshot, moved } = ds;
      dragState.current = null;
      dropTargetRef.current = null;
      setDropTarget(null);
      setDraggingId(null);
      if (commit && moved && target) {
        finalizeMove({ cardId, toColumn: target.col, toIndex: target.index, snapshot });
      } else {
        focusCard(cardId);
      }
    },
    [stableMove, stableUp, stableCancel, finalizeMove, focusCard],
  );

  const onPointerMove = React.useCallback(
    (e: PointerEvent) => {
      const ds = dragState.current;
      if (!ds || e.pointerId !== ds.pointerId) return;
      const dx = e.clientX - ds.startX;
      const dy = e.clientY - ds.startY;
      if (!ds.moved && Math.hypot(dx, dy) < 4) return;
      if (!ds.moved) {
        ds.moved = true;
        setDraggingId(ds.cardId); // one state write for the whole drag
        // Make the dragged card transparent to hit-testing so elementFromPoint
        // sees the column/cards *underneath* it — without this the card (which
        // follows the pointer at z-50) is always the topmost element, so drops
        // resolve to the origin column and moves between columns never register.
        // Pointer capture keeps delivering pointermove to this element regardless.
        ds.el.style.pointerEvents = "none";
      }
      if (ds.raf != null) cancelAnimationFrame(ds.raf);
      ds.raf = requestAnimationFrame(() => {
        ds.el.style.transform = `translate(${dx}px, ${dy}px)`;
        ds.el.style.zIndex = "50";
      });
      const target = hitTest(e.clientX, e.clientY, ds.cardId);
      const prev = dropTargetRef.current;
      if (target && (!prev || prev.col !== target.col || prev.index !== target.index)) {
        dropTargetRef.current = target;
        setDropTarget(target); // only changes when the slot changes, not per pixel
      }
    },
    [hitTest],
  );

  const onPointerUp = React.useCallback(() => endDrag(true), [endDrag]);
  const onPointerCancel = React.useCallback(() => endDrag(false), [endDrag]);
  moveRef.current = onPointerMove;
  upRef.current = onPointerUp;
  cancelRef.current = onPointerCancel;

  const onCardPointerDown = React.useCallback(
    (e: React.PointerEvent, cardId: string) => {
      const c = ctx.current;
      const card = c.byId.get(cardId);
      if (!card || card.disabled) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (grab) return; // don't start a drag mid keyboard-grab
      const el = e.currentTarget as HTMLElement;
      dragState.current = {
        cardId,
        snapshot: c.arrangement,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        el,
        moved: false,
        raf: null,
      };
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* pointer capture unsupported (tests/jsdom) — listeners still work */
      }
      el.addEventListener("pointermove", stableMove);
      el.addEventListener("pointerup", stableUp);
      el.addEventListener("pointercancel", stableCancel);
      onSelectCard?.(cardId);
    },
    [grab, onSelectCard, stableMove, stableUp, stableCancel],
  );

  React.useEffect(
    () => () => {
      const ds = dragState.current;
      if (ds?.raf != null) cancelAnimationFrame(ds.raf);
    },
    [],
  );

  /* -------------------------------------------------------------------- */

  const disabledBoard = columns.length === 0;

  return (
    <section
      aria-label={label}
      className={cn(
        "w-full overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3",
        className,
      )}
    >
      <div className="flex min-w-max gap-3" role="list" aria-label={`${label} columns`}>
        {columns.map((column) => {
          const cardIds = arrangement[column.id] ?? [];
          const limit = columnLimits?.[column.id] ?? column.limit;
          const atLimit = limit != null && cardIds.length >= limit;
          const indicatorIndex = dropTarget && dropTarget.col === column.id ? dropTarget.index : null;
          return (
            <ColumnView
              key={column.id}
              column={column}
              cardIds={cardIds}
              byId={byId}
              count={cardIds.length}
              limit={limit}
              atLimit={atLimit}
              indicatorIndex={indicatorIndex}
              grabCardId={grab?.cardId ?? null}
              draggingId={draggingId}
              selectedCardId={selectedCardId}
              reduced={reduced}
              onCardKeyDown={onCardKeyDown}
              onCardPointerDown={onCardPointerDown}
              onMoveToColumn={moveToColumnEnd}
              onSelectCard={onSelectCard}
              onAddCard={onAddCard}
              columns={columns}
              registerHandle={(id, el) => {
                if (el) handleRefs.current.set(id, el);
                else handleRefs.current.delete(id);
              }}
            />
          );
        })}
        {disabledBoard ? (
          <p className="px-3 py-6 text-[13px] text-[var(--color-muted)]">No columns to display.</p>
        ) : null}
      </div>

      {/* polite announcements — origin + destination of every move */}
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
/* Column                                                                     */
/* -------------------------------------------------------------------------- */

interface ColumnViewProps {
  column: KanbanColumn;
  cardIds: string[];
  byId: Map<string, KanbanCard>;
  count: number;
  limit?: number;
  atLimit: boolean;
  indicatorIndex: number | null;
  grabCardId: string | null;
  draggingId: string | null;
  selectedCardId?: string;
  reduced: boolean;
  columns: KanbanColumn[];
  onCardKeyDown: (e: React.KeyboardEvent, cardId: string) => void;
  onCardPointerDown: (e: React.PointerEvent, cardId: string) => void;
  onMoveToColumn: (cardId: string, toColumn: string) => void;
  onSelectCard?: (cardId: string) => void;
  onAddCard?: (columnId: string) => void;
  registerHandle: (id: string, el: HTMLDivElement | null) => void;
}

function ColumnView({
  column,
  cardIds,
  byId,
  count,
  limit,
  atLimit,
  indicatorIndex,
  grabCardId,
  draggingId,
  selectedCardId,
  reduced,
  columns,
  onCardKeyDown,
  onCardPointerDown,
  onMoveToColumn,
  onSelectCard,
  onAddCard,
  registerHandle,
}: ColumnViewProps) {
  const listLabel = `${column.title} column, ${count} card${count === 1 ? "" : "s"}${limit != null ? ` of ${limit}` : ""}`;
  return (
    <div role="listitem" className="flex w-[240px] shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <h3 className="text-[13px] font-semibold text-[var(--color-fg)]">{column.title}</h3>
        <span className="rounded-full bg-[var(--color-surface)] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
          {count}
          {limit != null ? ` / ${limit}` : ""}
        </span>
        {atLimit ? (
          <span
            className="rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide"
            style={{
              color: "var(--color-warning)",
              background: "color-mix(in oklab, var(--color-warning) 14%, transparent)",
              border: "1px solid color-mix(in oklab, var(--color-warning) 38%, var(--color-border))",
            }}
          >
            Full
          </span>
        ) : null}
      </div>

      <ul
        data-kanban-column={column.id}
        aria-label={listLabel}
        className="flex min-h-[72px] flex-1 flex-col gap-2 rounded-xl bg-[var(--color-surface)] p-2 [border:1px_solid_var(--color-border)]"
      >
        {cardIds.length === 0 ? (
          <li
            className="grid flex-1 place-items-center rounded-lg px-2 py-4 text-center text-[12px] text-[var(--color-muted)] [border:1px_dashed_var(--color-border)]"
            aria-hidden
          >
            Drop cards here
          </li>
        ) : (
          (() => {
            // The dragged card is lifted OUT of the column flow (its slot
            // collapses), so the drop indicator must be placed in the space of
            // the *remaining* cards — the same index space `hitTest` uses (it
            // excludes the dragged card). Tracking `visibleIdx` (incremented only
            // for non-dragged cards) keeps the placeholder exactly where the card
            // will land, including for moves within the same column.
            const nodes: React.ReactNode[] = [];
            let visibleIdx = 0;
            const visibleTotal = cardIds.reduce((n, id) => (id === draggingId ? n : n + 1), 0);
            cardIds.forEach((cardId) => {
              const card = byId.get(cardId);
              if (!card) return;
              const isDragged = draggingId === cardId;
              if (!isDragged && indicatorIndex === visibleIdx) {
                nodes.push(<DropIndicator key={`ind-${visibleIdx}`} />);
              }
              nodes.push(
                <CardView
                  key={cardId}
                  card={card}
                  index={visibleIdx}
                  total={visibleTotal}
                  columnTitle={column.title}
                  columns={columns}
                  grabbed={grabCardId === cardId}
                  dragging={draggingId === cardId}
                  selected={selectedCardId === cardId}
                  reduced={reduced}
                  onKeyDown={onCardKeyDown}
                  onPointerDown={onCardPointerDown}
                  onMoveToColumn={onMoveToColumn}
                  onSelectCard={onSelectCard}
                  registerHandle={registerHandle}
                />,
              );
              if (!isDragged) visibleIdx += 1;
            });
            if (indicatorIndex != null && indicatorIndex >= visibleTotal && visibleTotal > 0) {
              nodes.push(<DropIndicator key="ind-end" />);
            }
            return nodes;
          })()
        )}
      </ul>

      {onAddCard ? (
        <button
          type="button"
          onClick={() => onAddCard(column.id)}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12.5px] font-medium text-[var(--color-muted)] outline-none transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-fg)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add card
        </button>
      ) : null}
    </div>
  );
}

function DropIndicator() {
  return (
    <li aria-hidden className="h-1 rounded-full bg-[var(--color-accent)]" style={{ boxShadow: "0 0 0 1px var(--color-accent)" }} />
  );
}

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

interface CardViewProps {
  card: KanbanCard;
  index: number;
  total: number;
  columnTitle: string;
  columns: KanbanColumn[];
  grabbed: boolean;
  dragging: boolean;
  selected: boolean;
  reduced: boolean;
  onKeyDown: (e: React.KeyboardEvent, cardId: string) => void;
  onPointerDown: (e: React.PointerEvent, cardId: string) => void;
  onMoveToColumn: (cardId: string, toColumn: string) => void;
  onSelectCard?: (cardId: string) => void;
  registerHandle: (id: string, el: HTMLDivElement | null) => void;
}

const CardView = React.memo(function CardView({
  card,
  index,
  total,
  columnTitle,
  columns,
  grabbed,
  dragging,
  selected,
  reduced,
  onKeyDown,
  onPointerDown,
  onMoveToColumn,
  onSelectCard,
  registerHandle,
}: CardViewProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuBtnRef = React.useRef<HTMLButtonElement | null>(null);
  // Render the Move menu through a portal anchored to its trigger, so no
  // ancestor `overflow-hidden` (preview cards, scroll containers) can clip it.
  const anchor = useAnchoredPortal(menuOpen, { side: "bottom", align: "end", gap: 4 });

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuBtnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const positionLabel = grabbed
    ? `${card.title}. Grabbed. Use arrow keys to move, Enter or Space to drop, Escape to cancel.`
    : `${card.title}. ${columnTitle}, card ${index + 1} of ${total}. Press Space or Enter to pick up and move.`;

  const otherColumns = columns.filter((c) => c.id !== card.columnId);

  return (
    <li className="relative">
      <motion.div
        layout={!reduced && !dragging}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 560, damping: 42, mass: 0.9 }}
        data-kanban-card={card.id}
        data-grabbed={grabbed || undefined}
        data-dragging={dragging || undefined}
        role="button"
        tabIndex={card.disabled ? -1 : 0}
        aria-roledescription="Draggable card"
        aria-label={positionLabel}
        aria-disabled={card.disabled || undefined}
        ref={(el: HTMLDivElement | null) => registerHandle(card.id, el)}
        onKeyDown={(e) => onKeyDown(e, card.id)}
        onPointerDown={(e) => {
          if (card.disabled) return;
          onPointerDown(e, card.id);
        }}
        onFocus={() => onSelectCard?.(card.id)}
        className={cn(
          "select-none rounded-lg bg-[var(--color-surface)] px-3 py-2.5 pr-9 text-left outline-none transition-shadow [border:1px_solid_var(--color-border)]",
          !card.disabled && "cursor-grab hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
          card.disabled && "cursor-not-allowed opacity-60",
          selected && "ring-2 ring-[var(--color-accent)]",
          // While dragging, lift the card out of the column flow (its <li> slot
          // collapses and the other cards reflow up) so there's no phantom gap and
          // the drop placeholder reads clearly. `inset-x-0` keeps full width; top is
          // auto, so it stays at its static position and the pointer transform holds.
          dragging && "absolute inset-x-0 z-50",
        )}
        style={{
          touchAction: card.disabled ? undefined : "none",
          boxShadow: grabbed || dragging ? "var(--shadow-md, 0 10px 24px rgba(0,0,0,0.18))" : undefined,
        }}
      >
        <p className="text-[13px] font-medium leading-snug text-[var(--color-fg)]">{card.title}</p>
        {card.meta ? <p className="mt-0.5 text-[11.5px] text-[var(--color-muted)]">{card.meta}</p> : null}
        {grabbed ? (
          <span className="mt-1 inline-block text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
            Moving…
          </span>
        ) : null}
      </motion.div>

      {/* Non-drag path: an always-available Move menu (sibling of the card
          button, so it is not an interactive descendant of a role=button).
          Hidden while dragging so it doesn't linger in the collapsed slot. */}
      {!dragging && !card.disabled && otherColumns.length > 0 ? (
        <div className="absolute right-1.5 top-1.5">
          <button
            ref={(el: HTMLButtonElement | null) => {
              menuBtnRef.current = el;
              (anchor.triggerRef as React.MutableRefObject<HTMLElement | null>).current = el;
            }}
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Move ${card.title} to another column`}
            onClick={() => setMenuOpen((o) => !o)}
            className="grid h-7 w-7 place-items-center rounded-md text-[var(--color-muted)] outline-none transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 9l4-4M5 9l4 4M5 9h11a3 3 0 0 1 3 3v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {anchor.renderInPortal(
            menuOpen && anchor.anchored ? (
              <ul
                ref={anchor.panelRef as React.RefObject<HTMLUListElement>}
                style={anchor.panelStyle}
                role="menu"
                aria-label={`Move ${card.title} to`}
                className="z-[60] min-w-[168px] overflow-hidden rounded-xl bg-[var(--color-surface)] py-1 shadow-[var(--shadow-md,0_8px_24px_rgba(0,0,0,0.14))] [border:1px_solid_var(--color-border)]"
              >
                {otherColumns.map((c) => (
                  <li key={c.id} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onMoveToColumn(card.id, c.id);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-[var(--color-fg)] outline-none transition-colors hover:bg-[var(--color-bg-secondary)] focus-visible:bg-[var(--color-bg-secondary)]"
                    >
                      Move to {c.title}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null,
          )}
        </div>
      ) : null}
    </li>
  );
});

export default KanbanCardMovement;
