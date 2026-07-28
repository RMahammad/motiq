import * as React from "react";
import { render, cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";

import { ActivityStream, type ActivityEvent } from "./activity-stream";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const MIN = 60_000;
const base = Date.now();

// A run of same actor+type+target edits (collapses at the default threshold of 3),
// each with a unique preview so we can assert the expanded items appear.
const GROUPED: ActivityEvent[] = [
  { id: "cm", type: "commented", actor: { id: "kit", name: "Kit M." }, target: "the onboarding guide", timestamp: base - 1 * MIN },
  { id: "ed1", type: "edited", actor: { id: "ada", name: "Ada L." }, target: "the onboarding guide", preview: "edit-alpha", timestamp: base - 3 * MIN },
  { id: "ed2", type: "edited", actor: { id: "ada", name: "Ada L." }, target: "the onboarding guide", preview: "edit-beta", timestamp: base - 4 * MIN },
  { id: "ed3", type: "edited", actor: { id: "ada", name: "Ada L." }, target: "the onboarding guide", preview: "edit-gamma", timestamp: base - 5 * MIN },
  { id: "ed4", type: "edited", actor: { id: "ada", name: "Ada L." }, target: "the onboarding guide", preview: "edit-delta", timestamp: base - 6 * MIN },
];

// Distinct types (no grouping) with a boundary that splits unread from read.
const UNREAD_SET: ActivityEvent[] = [
  { id: "u1", type: "mentioned", actor: { id: "ravi", name: "Ravi P." }, target: "a review", timestamp: base - 1 * MIN },
  { id: "u2", type: "approved", actor: { id: "noor", name: "Noor S." }, target: "the checklist", timestamp: base - 8 * MIN },
];

describe("ActivityStream", () => {
  it("collapses repeated actions into a group and expands it on click", async () => {
    const user = userEvent.setup();
    render(<ActivityStream events={GROUPED} collapseThreshold={3} />);

    // Four edits collapse into one summary group button; the comment stays a line.
    const group = screen.getByRole("button", { name: /4 edits by Ada L\./i });
    expect(group.getAttribute("aria-expanded")).toBe("false");
    // Individual edits are hidden while collapsed.
    expect(screen.queryByText("edit-beta")).toBeNull();

    await user.click(group);
    expect(group.getAttribute("aria-expanded")).toBe("true");
    // All four edits are revealed.
    expect(screen.getByText("edit-alpha")).toBeTruthy();
    expect(screen.getByText("edit-delta")).toBeTruthy();
  });

  it("expands a group with the keyboard", async () => {
    const user = userEvent.setup();
    render(<ActivityStream events={GROUPED} collapseThreshold={3} />);
    const group = screen.getByRole("button", { name: /4 edits by Ada L\./i });
    group.focus();
    expect(document.activeElement).toBe(group);
    await user.keyboard("{Enter}");
    expect(group.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("edit-gamma")).toBeTruthy();
  });

  it("renders an unread divider after unreadAfter, and none without it", () => {
    const { rerender } = render(<ActivityStream events={UNREAD_SET} unreadAfter={base - 4 * MIN} />);
    // The boundary splits u1 (unread) from u2 (read) → a "New" divider appears.
    expect(screen.getByText("New")).toBeTruthy();
    expect(screen.getByLabelText(/1 unread item above/i)).toBeTruthy();

    rerender(<ActivityStream events={UNREAD_SET} />);
    expect(screen.queryByText("New")).toBeNull();
  });

  it("uses a semantic list with one item per rendered row", () => {
    render(<ActivityStream events={UNREAD_SET} showFilters={false} />);
    const list = screen.getByRole("list");
    // A date separator + two event rows = three list items.
    expect(within(list).getAllByRole("listitem").length).toBe(3);
  });

  it("is axe-clean with groups, an unread divider, and filters", async () => {
    const { container } = render(
      <ActivityStream events={GROUPED} collapseThreshold={3} unreadAfter={base - 2 * MIN} label="Team activity" />,
    );
    await noViolations(container);
  });
});

/* -- responsive contract ------------------------------------------------- */

describe("ActivityStream — responsive contract", () => {
  it("reacts to its own width, not the viewport", () => {
    const { container } = render(<ActivityStream events={GROUPED} />);
    const root = container.firstElementChild as HTMLElement;
    // The card declares the size container every rule inside it queries.
    expect(String(root.className)).toMatch(/@container\/stream/);
    // …and it never queries itself (an element is not its own container).
    expect(String(root.className)).not.toMatch(/@\[400px\]\/stream:/);
    // No viewport breakpoint survives anywhere in the card.
    container.querySelectorAll("*").forEach((el) => {
      expect(String(el.className)).not.toMatch(/(^|\s)(sm|md|lg|xl|2xl):/);
    });
  });

  it("keeps the type filters on one scrollable line in a narrow card instead of wrapping into a block", () => {
    const { container } = render(<ActivityStream events={GROUPED} />);
    const bar = container.querySelector<HTMLElement>('[aria-label="Filter activity by type"]');
    expect(bar).not.toBeNull();
    const cls = String(bar?.className);
    expect(cls).toMatch(/flex-nowrap/);
    expect(cls).toMatch(/overflow-x-auto/);
    expect(cls).toMatch(/overscroll-x-contain/);
    // …and the original wrapping row returns once the CARD is wide enough.
    expect(cls).toMatch(/@\[400px\]\/stream:flex-wrap/);
    // Chips keep their intrinsic width inside the scroller.
    const chip = within(bar as HTMLElement).getByRole("button", { name: "All" });
    expect(String(chip.className)).toMatch(/shrink-0/);
  });

  it("renders the unread cue inside the wrapping meta row in a narrow card, not as a fixed side column", () => {
    const { container } = render(<ActivityStream events={GROUPED} unreadAfter={base - 2 * MIN} />);
    const cues = [...container.querySelectorAll<HTMLElement>("span")].filter(
      (s) => s.textContent?.trim() === "Unread",
    );
    expect(cues.length).toBeGreaterThan(0);
    // Every unread cue is scoped to exactly one container band, so exactly one
    // of the two variants is ever displayed.
    cues.forEach((c) =>
      expect(String(c.className)).toMatch(
        /@\[400px\]\/stream:hidden|@\[400px\]\/stream:inline-flex/,
      ),
    );
    expect(cues.some((c) => /@\[400px\]\/stream:hidden/.test(String(c.className)))).toBe(true);
    expect(
      cues.some((c) => /hidden .*@\[400px\]\/stream:inline-flex/.test(String(c.className))),
    ).toBe(true);
  });
});
