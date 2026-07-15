"use client";

import * as React from "react";

import {
  KanbanCardMovement,
  type KanbanCard,
  type KanbanColumn,
  type KanbanMove,
} from "@/registry/productivity/kanban-card-movement";
import {
  AnimatedDialog,
  AnimatedDialogContent,
  AnimatedDialogHeader,
  AnimatedDialogTitle,
  AnimatedDialogDescription,
  AnimatedDialogBody,
  AnimatedDialogFooter,
  AnimatedDialogClose,
} from "@/registry/animated-shadcn/animated-dialog";

/* Clearly fictional demo — a made-up product backlog for an imaginary tool.
 * The PREVIEW is the "app": it owns the columns, cards, WIP limits, and
 * persistence (a simulated async save that can be made to fail). The component
 * owns only the movement interaction + optimistic UI. Fixed ids/orders keep it
 * deterministic (no SSR/CSR drift); new ids are only minted inside handlers.
 *
 * The control buttons drive the *real* component paths — they open the actual
 * move menu and dispatch real keyboard events on the real cards, rather than
 * faking movement — so what you click is what a user would do. */

const COLUMNS: KanbanColumn[] = [
  { id: "backlog", title: "Backlog" },
  { id: "doing", title: "In progress", limit: 4 },
  { id: "review", title: "In review", limit: 2 },
  { id: "done", title: "Done" },
];

function seed(): KanbanCard[] {
  return [
    { id: "b1", columnId: "backlog", title: "Onboarding empty states", order: 0, meta: "Design · 3 pts" },
    { id: "b2", columnId: "backlog", title: "Billing webhook retries", order: 1, meta: "Backend · 5 pts" },
    { id: "b3", columnId: "backlog", title: "Keyboard shortcut overlay", order: 2, meta: "Frontend · 2 pts" },
    { id: "p1", columnId: "doing", title: "Realtime cursor presence", order: 0, meta: "Frontend · 8 pts" },
    { id: "p2", columnId: "doing", title: "Audit log export", order: 1, meta: "Backend · 3 pts" },
    // "In review" starts full (limit 2) so the invalid-move demo has a target.
    { id: "r1", columnId: "review", title: "SSO error copy", order: 0, meta: "Design · 1 pt" },
    { id: "r2", columnId: "review", title: "Rate-limit dashboard", order: 1, meta: "Data · 5 pts" },
    { id: "d1", columnId: "done", title: "Dark-mode tokens", order: 0, meta: "Design · 2 pts" },
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

const raf = () => new Promise<void>((r) => (typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame(() => r()) : setTimeout(r, 16)));

const control =
  "rounded-lg px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

export function KanbanCardMovementPreview() {
  const [cards, setCards] = React.useState<KanbanCard[]>(seed);
  const [failNext, setFailNext] = React.useState(false);
  const [selectedCardId, setSelectedCardId] = React.useState<string | undefined>(undefined);
  const [detailsId, setDetailsId] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("Open a card for details, drag it, or use the Move menu / keyboard. Every path is accessible.");
  // Distinguish a genuine click (open details) from the end of a drag: a pointer
  // that moved past the threshold suppresses the click-to-open.
  const pointerMovedRef = React.useRef(false);
  const pointerDownPos = React.useRef({ x: 0, y: 0 });
  const failRef = React.useRef(false);
  failRef.current = failNext;
  const idRef = React.useRef(0);
  const boardRef = React.useRef<HTMLDivElement | null>(null);

  // Simulated async save. Rejects once when "Fail next save" is armed so the
  // component's optimistic layer rolls the card back to its origin.
  const onMove = React.useCallback(
    (move: KanbanMove) =>
      new Promise<void>((resolve, reject) => {
        window.setTimeout(() => {
          if (failRef.current) {
            failRef.current = false;
            setFailNext(false);
            reject(new Error("Simulated save failure"));
            return;
          }
          setCards((prev) => applyMove(prev, move));
          resolve();
        }, 480);
      }),
    [],
  );

  const addCard = React.useCallback((columnId: string) => {
    setCards((prev) => {
      idRef.current += 1;
      const count = prev.filter((c) => c.columnId === columnId).length;
      return [...prev, { id: `new-${idRef.current}`, columnId, title: `New task ${idRef.current}`, order: count }];
    });
  }, []);

  /* --- controls that drive the real component UI ----------------------- */

  const clickMenuMove = React.useCallback(async (cardTitle: string, toColumnTitle: string) => {
    const root = boardRef.current;
    if (!root) return;
    const btn = root.querySelector<HTMLButtonElement>(`button[aria-label="Move ${cardTitle} to another column"]`);
    if (!btn) return;
    btn.click();
    await raf();
    const item = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')).find(
      (b) => b.textContent === `Move to ${toColumnTitle}`,
    );
    item?.click();
  }, []);

  const demoMove = React.useCallback(async () => {
    setNote("Moved “Onboarding empty states” to In progress via the Move menu.");
    await clickMenuMove("Onboarding empty states", "In progress");
  }, [clickMenuMove]);

  const demoInvalid = React.useCallback(async () => {
    setNote("Tried to move into In review (WIP limit 2, full) — the drop is rejected.");
    await clickMenuMove("Billing webhook retries", "In review");
  }, [clickMenuMove]);

  const demoFailure = React.useCallback(async () => {
    setFailNext(true);
    failRef.current = true;
    setNote("Armed a save failure, then moved a card — watch it snap back on rejection.");
    await raf();
    await clickMenuMove("Keyboard shortcut overlay", "In progress");
  }, [clickMenuMove]);

  const demoKeyboard = React.useCallback(async () => {
    const root = boardRef.current;
    if (!root) return;
    const card = root.querySelector<HTMLElement>('[data-kanban-card="b1"]');
    if (!card) return;
    setNote("Keyboard: Space picks up, → moves a column, Enter drops. (Try it yourself too.)");
    card.focus();
    const send = (key: string) => card.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    send(" ");
    await raf();
    send("ArrowRight");
    await raf();
    send("Enter");
  }, []);

  const reset = React.useCallback(() => {
    setCards(seed());
    setFailNext(false);
    failRef.current = false;
    setSelectedCardId(undefined);
    setDetailsId(null);
    idRef.current = 0;
    setNote("Reset. Open a card for details, drag it, or use the Move menu / keyboard. Every path is accessible.");
  }, []);

  // Open the card-details dialog on a real click on a card body (not on the Move
  // menu / buttons, and not at the end of a drag).
  const onBoardPointerDown = React.useCallback((e: React.PointerEvent) => {
    pointerMovedRef.current = false;
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onBoardPointerMove = React.useCallback((e: React.PointerEvent) => {
    if (Math.hypot(e.clientX - pointerDownPos.current.x, e.clientY - pointerDownPos.current.y) > 4) {
      pointerMovedRef.current = true;
    }
  }, []);
  const onBoardClick = React.useCallback((e: React.MouseEvent) => {
    if (pointerMovedRef.current) return; // was a drag, not a click
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, [role='menu'], [role='menuitem']")) return;
    const cardEl = target.closest<HTMLElement>("[data-kanban-card]");
    const id = cardEl?.getAttribute("data-kanban-card");
    if (id) setDetailsId(id);
  }, []);

  const detailsCard = detailsId ? cards.find((c) => c.id === detailsId) ?? null : null;
  const detailsColumn = detailsCard ? COLUMNS.find((c) => c.id === detailsCard.columnId) : undefined;

  return (
    <div className="flex w-full max-w-[900px] flex-col gap-4">
      {/* project-board shell */}
      <div className="overflow-hidden rounded-2xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--color-border)] px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-fg)]">
            <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            Northwind · Product board
          </span>
          <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
            Fictional demo data
          </span>
          <span className="ml-auto text-[12px] text-[var(--color-muted)]">Sprint 14 · in planning</span>
        </div>

        <div
          ref={boardRef}
          className="p-3"
          onPointerDownCapture={onBoardPointerDown}
          onPointerMoveCapture={onBoardPointerMove}
          onClick={onBoardClick}
        >
          <KanbanCardMovement
            columns={COLUMNS}
            cards={cards}
            onMove={onMove}
            onAddCard={addCard}
            selectedCardId={selectedCardId}
            onSelectCard={setSelectedCardId}
            moveValidation={(from, to) =>
              from === "done" && to === "backlog" ? "Shipped work can’t return straight to the backlog." : true
            }
            label="Sprint 14 board"
          />
        </div>
      </div>

      {/* working controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={control} onClick={demoMove}>
          Move card between columns
        </button>
        <button type="button" className={control} onClick={demoKeyboard}>
          Keyboard move
        </button>
        <button type="button" className={control} onClick={demoInvalid}>
          Invalid move
        </button>
        <button type="button" className={control} onClick={demoFailure}>
          Optimistic failure and rollback
        </button>
        <button type="button" className={control} onClick={() => addCard("backlog")}>
          Add card
        </button>
        <button type="button" className={control} onClick={reset}>
          Reset
        </button>
        <span aria-live="polite" className="ml-auto max-w-[320px] text-right text-[12px] text-[var(--color-muted)]">
          {note}
        </span>
      </div>

      {/* Card-details dialog — our library AnimatedDialog, opened on card click. */}
      <AnimatedDialog
        animation="scale"
        open={detailsCard != null}
        onOpenChange={(o) => { if (!o) setDetailsId(null); }}
      >
        <AnimatedDialogContent className="sm:max-w-md">
          {detailsCard ? (
            <>
              <AnimatedDialogHeader>
                <AnimatedDialogTitle>{detailsCard.title}</AnimatedDialogTitle>
                <AnimatedDialogDescription>
                  In <span className="font-medium text-[var(--color-fg)]">{detailsColumn?.title ?? detailsCard.columnId}</span> · {detailsCard.meta ?? "No details"}
                </AnimatedDialogDescription>
              </AnimatedDialogHeader>
              <AnimatedDialogBody className="space-y-3">
                <div className="grid grid-cols-[92px_1fr] gap-y-2 text-[13.5px]">
                  <span className="text-[var(--color-muted)]">Column</span>
                  <span className="text-[var(--color-fg)]">{detailsColumn?.title ?? detailsCard.columnId}</span>
                  <span className="text-[var(--color-muted)]">Details</span>
                  <span className="text-[var(--color-fg)]">{detailsCard.meta ?? "—"}</span>
                  <span className="text-[var(--color-muted)]">Card ID</span>
                  <span className="font-mono text-[12.5px] text-[var(--color-fg)]">{detailsCard.id}</span>
                </div>
                <p className="rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 text-[12.5px] leading-relaxed text-[var(--color-muted)]">
                  Demo card — your app owns the real fields. Drag the card, use the Move menu, or keyboard to move it between columns.
                </p>
              </AnimatedDialogBody>
              <AnimatedDialogFooter>
                <AnimatedDialogClose asChild>
                  <button type="button" className={control}>Close</button>
                </AnimatedDialogClose>
              </AnimatedDialogFooter>
            </>
          ) : null}
        </AnimatedDialogContent>
      </AnimatedDialog>
    </div>
  );
}

export default KanbanCardMovementPreview;
