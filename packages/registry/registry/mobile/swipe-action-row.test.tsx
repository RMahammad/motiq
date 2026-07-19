import * as React from "react";
import { render, cleanup, screen, within, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SwipeActionRow,
  SwipeActionGroup,
  type SwipeAction,
} from "./swipe-action-row";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const rightActions: SwipeAction[] = [
  { id: "complete", label: "Complete", tone: "success" },
  { id: "snooze", label: "Snooze", tone: "info" },
  { id: "delete", label: "Delete", tone: "error", destructive: true },
];
const leftActions: SwipeAction[] = [{ id: "archive", label: "Archive", tone: "warning" }];

function Row(props: Partial<React.ComponentProps<typeof SwipeActionRow>>) {
  return (
    <SwipeActionRow label="Weekly report" leftActions={leftActions} rightActions={rightActions} {...props}>
      <p>Weekly report</p>
    </SwipeActionRow>
  );
}

/** Force the reduced-motion media query on/off deterministically. */
function mockReducedMotion(reduce: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: reduce && /prefers-reduced-motion/.test(q),
    media: q,
    onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {},
    dispatchEvent() { return false; },
  })) as typeof window.matchMedia;
}

describe("SwipeActionRow", () => {
  it("reflects the controlled `open` prop and fires onAction + onOpenChange from a revealed button", async () => {
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Row open="right" onOpenChange={onOpenChange} onAction={onAction} />);

    expect(container.querySelector('[data-state="open-right"]')).toBeTruthy();

    // The revealed (non-destructive) action fires immediately, closes the row.
    await user.click(screen.getByRole("button", { name: "Complete" }));
    expect(onAction).toHaveBeenCalledWith("complete", "right");
    expect(onOpenChange).toHaveBeenCalledWith(null);
  });

  it("exposes every action as a real button without swiping, plus an overflow menu", async () => {
    const { container } = render(<Row />);
    for (const name of ["Archive", "Complete", "Snooze", "Delete"]) {
      expect(screen.getByRole("button", { name }).tagName).toBe("BUTTON");
    }
    expect(screen.getByRole("button", { name: "More actions" })).toBeTruthy();
    await noViolations(container);
  });

  it("guards destructive actions behind a confirm step (delete does not fire directly)", async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(<Row onAction={onAction} />);

    // Trigger delete via the overflow menu.
    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(await screen.findByRole("menuitem", { name: /delete/i }));

    // No action yet — a confirm dialog appears instead.
    expect(onAction).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(onAction).toHaveBeenCalledWith("delete", "right");
  });

  it("keeps only one row open within a group", async () => {
    const { container } = render(
      <SwipeActionGroup>
        <Row label="First" />
        <Row label="Second" />
      </SwipeActionGroup>,
    );
    const rows = container.querySelectorAll("[data-state]");
    expect(rows).toHaveLength(2);

    // Reveal the first row by focusing one of its action buttons.
    const firstArchive = within(rows[0] as HTMLElement).getByRole("button", { name: "Archive" });
    act(() => firstArchive.focus());
    await waitFor(() => expect(rows[0].getAttribute("data-state")).toBe("open-left"));

    // Revealing the second row must snap the first shut.
    const secondArchive = within(rows[1] as HTMLElement).getByRole("button", { name: "Archive" });
    act(() => secondArchive.focus());
    await waitFor(() => expect(rows[1].getAttribute("data-state")).toBe("open-left"));
    await waitFor(() => expect(rows[0].getAttribute("data-state")).toBe("closed"));
  });

  it("stays fully operable under reduced motion (actions fire without drag)", async () => {
    mockReducedMotion(true);
    try {
      const onAction = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<Row onAction={onAction} />);
      await user.click(screen.getByRole("button", { name: "Complete" }));
      expect(onAction).toHaveBeenCalledWith("complete", "right");
      await noViolations(container);
    } finally {
      mockReducedMotion(false);
    }
  });
});
