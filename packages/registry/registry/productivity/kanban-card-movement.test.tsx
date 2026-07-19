import * as React from "react";
import { render, cleanup, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  KanbanCardMovement,
  type KanbanCard,
  type KanbanColumn,
} from "./kanban-card-movement";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

/* Deterministic fixture — fixed ids/order, no dates or randomness. "In progress"
 * carries a WIP limit of 2 and starts full, so a move into it must be rejected. */
const COLUMNS: KanbanColumn[] = [
  { id: "todo", title: "To do" },
  { id: "doing", title: "In progress", limit: 2 },
  { id: "done", title: "Done" },
];

const CARDS: KanbanCard[] = [
  { id: "t1", columnId: "todo", title: "Draft the spec", order: 0 },
  { id: "t2", columnId: "todo", title: "Collect feedback", order: 1 },
  { id: "d1", columnId: "doing", title: "Wire the API", order: 0 },
  { id: "d2", columnId: "doing", title: "Build the shell", order: 1 },
];

/** The card's own focusable handle (its aria-label starts with the title + "."). */
const cardHandle = (title: string) => screen.getByRole("button", { name: new RegExp(`^${title}\\.`) });
const columnList = (title: string) => screen.getByRole("list", { name: new RegExp(`^${title} column`) });

async function openMoveMenu(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.click(screen.getByRole("button", { name: new RegExp(`^Move ${title} to another column`) }));
  return screen.getByRole("menu", { name: new RegExp(`^Move ${title} to`) });
}

describe("KanbanCardMovement", () => {
  it("fires onMove with {cardId, fromColumn, toColumn, toIndex} on a committed move", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<KanbanCardMovement columns={COLUMNS} cards={CARDS} onMove={onMove} reducedMotion />);

    const menu = await openMoveMenu(user, "Draft the spec");
    await user.click(within(menu).getByRole("menuitem", { name: /Move to Done/ }));

    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith({
      cardId: "t1",
      fromColumn: "todo",
      toColumn: "done",
      toIndex: 0,
    });
  });

  it("rejects an invalid move (WIP limit) without calling onMove and keeps the card in place", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<KanbanCardMovement columns={COLUMNS} cards={CARDS} onMove={onMove} reducedMotion />);

    // "In progress" is full (2/2) — moving a third card in must be blocked.
    const menu = await openMoveMenu(user, "Draft the spec");
    await user.click(within(menu).getByRole("menuitem", { name: /Move to In progress/ }));

    expect(onMove).not.toHaveBeenCalled();
    // Card stays in To do; the block is announced in text (not colour alone).
    expect(within(columnList("To do")).getByText("Draft the spec")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toMatch(/limit/i);
  });

  it("moves a card with the keyboard: pick up, arrow across columns, drop", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<KanbanCardMovement columns={COLUMNS} cards={CARDS} onMove={onMove} reducedMotion />);

    cardHandle("Draft the spec").focus();
    await user.keyboard("[Space]"); // pick up
    await user.keyboard("{ArrowRight}"); // To do → In progress
    await user.keyboard("{ArrowRight}"); // In progress → Done
    await user.keyboard("{Enter}"); // drop

    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ cardId: "t1", fromColumn: "todo", toColumn: "done" }));
  });

  it("rolls back to the origin column when an async onMove rejects", async () => {
    const user = userEvent.setup();
    // Deferred rejection so the optimistic state is observable before rollback.
    let reject: (reason?: unknown) => void = () => {};
    const onMove = vi.fn(() => new Promise<void>((_, rej) => (reject = rej)));
    render(<KanbanCardMovement columns={COLUMNS} cards={CARDS} onMove={onMove} reducedMotion />);

    const menu = await openMoveMenu(user, "Draft the spec");
    await user.click(within(menu).getByRole("menuitem", { name: /Move to Done/ }));

    // Optimistic: it lands in Done immediately while the save is in flight.
    expect(within(columnList("Done")).getByText("Draft the spec")).toBeTruthy();

    // The save fails → it reverts to To do and the failure is announced.
    reject(new Error("network"));
    await waitFor(() => expect(within(columnList("To do")).queryByText("Draft the spec")).toBeTruthy());
    expect(within(columnList("Done")).queryByText("Draft the spec")).toBeNull();
    expect(screen.getByRole("status").textContent).toMatch(/failed/i);
  });

  it("returns focus to the moved card after a move", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<KanbanCardMovement columns={COLUMNS} cards={CARDS} onMove={onMove} reducedMotion />);

    const menu = await openMoveMenu(user, "Draft the spec");
    await user.click(within(menu).getByRole("menuitem", { name: /Move to Done/ }));

    // Focus is restored to the moved card's handle (not lost to <body>).
    await waitFor(() => expect(document.activeElement).toBe(cardHandle("Draft the spec")));
  });

  it("offers a non-drag move menu and has no axe violations", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    const { container } = render(
      <KanbanCardMovement columns={COLUMNS} cards={CARDS} onMove={onMove} onAddCard={() => {}} reducedMotion />,
    );

    await noViolations(container);

    // The non-drag path: a labelled menu of destination columns, keyboard/mouse operable.
    const menu = await openMoveMenu(user, "Wire the API");
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual(["Move to To do", "Move to Done"]);
    await user.click(within(menu).getByRole("menuitem", { name: /Move to To do/ }));
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ cardId: "d1", fromColumn: "doing", toColumn: "todo" }));
  });
});
