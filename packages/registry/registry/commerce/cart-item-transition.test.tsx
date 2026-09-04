import * as React from "react";
import { render, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CartItemTransition, type CartLineItem } from "./cart-item-transition";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

/**
 * useAnimatedNumber tweens the line total over 520ms, so any assertion on a settled
 * total must outwait the animation — not just the state commit. Generous headroom on
 * top, because the failures only ever showed up under full-suite load.
 */
const ANIMATED_NUMBER_TIMEOUT_MS = 3000;

const ITEM: CartLineItem = {
  id: "sku-1",
  productName: "Range 24 backpack",
  variantSummary: "Graphite · 24 L",
  unitPrice: 148,
  quantity: 2,
  total: 296,
  availability: "available",
};

/** A controlled host: quantity commits update the item unless `fail` is set. */
function Host({ fail = false }: { fail?: boolean }) {
  const [item, setItem] = React.useState<CartLineItem>(ITEM);
  const onQuantityChange = React.useCallback(
    async (quantity: number, current: CartLineItem) => {
      if (fail) throw new Error("Update failed: network error.");
      setItem({ ...current, quantity, total: current.unitPrice * quantity });
    },
    [fail],
  );
  return <CartItemTransition item={item} onQuantityChange={onQuantityChange} onRemove={() => {}} onUndoRemove={() => {}} />;
}

describe("CartItemTransition", () => {
  it("shows the controlled line and passes axe", async () => {
    const { container } = render(<CartItemTransition item={ITEM} />);
    expect(screen.getByRole("heading", { name: /Range 24 backpack/i })).toBeTruthy();
    // Line total rendered as text (visible + echoed in the polite announcer).
    expect(screen.getAllByText(/\$296\.00/).length).toBeGreaterThan(0);
    await noViolations(container);
  });

  it("optimistically applies a quantity increase and commits when the app resolves", async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.click(screen.getByRole("button", { name: /increase quantity/i }));
    // App resolved → committed quantity 3, total 444. getAllByText because the polite
    // announcer echoes the settled line total alongside the visible one.
    // TIMEOUT: the visible total is tweened by useAnimatedNumber over 520ms, so it passes
    // through intermediate values that match neither figure. waitFor's 1s default is not
    // enough headroom for that under full-suite load — see the rollback case below.
    await waitFor(() => expect(screen.getAllByText(/\$444\.00/).length).toBeGreaterThan(0), {
      timeout: ANIMATED_NUMBER_TIMEOUT_MS,
    });
  });

  it("rolls back the optimistic quantity + total when the app's mutation rejects", async () => {
    const user = userEvent.setup();
    render(<Host fail />);
    await user.click(screen.getByRole("button", { name: /increase quantity/i }));
    // Optimistic total (3 × 148 = 444) appears, then rolls back to 296 with an error + Retry.
    // Two separate reasons this needs one waitFor with a raised timeout, both of which
    // produced intermittent CI failures:
    //   1. The alert and the rolled-back total land in SEPARATE commits, so waiting only
    //      on the alert and then asserting the total synchronously races the rollback.
    //   2. The visible total is tweened by useAnimatedNumber over 520ms (see the
    //      component), so on the way from 444 back to 296 it renders intermediate values
    //      matching NEITHER figure. waitFor's 1s default leaves too little headroom for a
    //      520ms animation once the full suite is competing for the event loop.
    // getAllByText, not getByText: the polite announcer echoes the line total once the
    // error clears, so a match count of exactly one is not guaranteed either.
    await waitFor(
      () => {
        expect(screen.getByRole("alert")).toBeTruthy();
        expect(screen.getAllByText(/\$296\.00/).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/\$444\.00/)).toHaveLength(0);
      },
      { timeout: ANIMATED_NUMBER_TIMEOUT_MS },
    );
    expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy();
  });

  it("preserves focus on the pressed quantity control after a change", async () => {
    const user = userEvent.setup();
    render(<Host />);
    const inc = screen.getByRole("button", { name: /increase quantity/i });
    await user.click(inc);
    await waitFor(() => expect(document.activeElement).toBe(inc));
  });

  it("moves focus to Undo after removal, then falls back to Remove after undo", async () => {
    const user = userEvent.setup();
    render(<CartItemTransition item={ITEM} onRemove={() => {}} onUndoRemove={() => {}} />);
    await user.click(screen.getByRole("button", { name: /remove/i }));
    const undo = await screen.findByRole("button", { name: /undo/i });
    await waitFor(() => expect(document.activeElement).toBe(undo));
    await user.click(undo);
    // Focus must not be dropped on document.body — it falls back to Remove.
    const remove = await screen.findByRole("button", { name: /remove/i });
    await waitFor(() => expect(document.activeElement).toBe(remove));
  });
});
