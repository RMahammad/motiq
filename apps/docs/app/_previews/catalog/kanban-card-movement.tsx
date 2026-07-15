"use client";

import * as React from "react";

import {
  KanbanCardMovement,
  type KanbanCard,
  type KanbanColumn,
  type KanbanMove,
} from "@/registry/productivity/kanban-card-movement";

/**
 * Compact catalog adapter (docs/55). Renders the REAL KanbanCardMovement as a
 * populated board — three columns, ≤3 cards each — so the movement interaction
 * layer is recognizable at a glance. Drag / keyboard / Move-menu all work
 * (moves commit into local state); there is NO external demo control bar.
 * Deterministic, clearly fictional backlog data.
 */

const COLUMNS: KanbanColumn[] = [
  { id: "backlog", title: "Backlog" },
  { id: "doing", title: "In progress", limit: 4 },
  { id: "review", title: "In review", limit: 2 },
];

function seed(): KanbanCard[] {
  return [
    { id: "b1", columnId: "backlog", title: "Onboarding empty states", order: 0, meta: "Design · 3 pts" },
    { id: "b2", columnId: "backlog", title: "Billing webhook retries", order: 1, meta: "Backend · 5 pts" },
    { id: "b3", columnId: "backlog", title: "Keyboard shortcut overlay", order: 2, meta: "Frontend · 2 pts" },
    { id: "p1", columnId: "doing", title: "Realtime cursor presence", order: 0, meta: "Frontend · 8 pts" },
    { id: "p2", columnId: "doing", title: "Audit log export", order: 1, meta: "Backend · 3 pts" },
    { id: "r1", columnId: "review", title: "SSO error copy", order: 0, meta: "Design · 1 pt" },
  ];
}

/** App-owned persistence: recompute columnId + per-column order for the move. */
function applyMove(cards: KanbanCard[], move: KanbanMove): KanbanCard[] {
  const byCol = new Map<string, KanbanCard[]>();
  const sorted = [...cards].sort((a, b) => a.order - b.order);
  for (const c of sorted) {
    if (c.id === move.cardId) continue;
    const arr = byCol.get(c.columnId) ?? [];
    arr.push(c);
    byCol.set(c.columnId, arr);
  }
  const moved = cards.find((c) => c.id === move.cardId);
  if (!moved) return cards;
  const target = byCol.get(move.toColumn) ?? [];
  const idx = Math.max(0, Math.min(move.toIndex, target.length));
  target.splice(idx, 0, { ...moved, columnId: move.toColumn });
  byCol.set(move.toColumn, target);

  const next: KanbanCard[] = [];
  for (const [col, arr] of byCol) arr.forEach((c, i) => next.push({ ...c, columnId: col, order: i }));
  return next;
}

export function KanbanCardMovementCatalogPreview() {
  const [cards, setCards] = React.useState<KanbanCard[]>(seed);

  return (
    <div className="mx-auto w-full max-w-[760px]">
      <KanbanCardMovement
        columns={COLUMNS}
        cards={cards}
        onMove={(move) => setCards((prev) => applyMove(prev, move))}
        label="Sprint 14 board"
      />
    </div>
  );
}

export default KanbanCardMovementCatalogPreview;
