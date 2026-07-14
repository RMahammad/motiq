import * as React from "react";
import { render, cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectTimeline, type TimelineItem, type TimelineGroup } from "./project-timeline";

afterEach(cleanup);

// jsdom doesn't implement programmatic scroll on elements — stub it so
// jump-to-today / horizontal-nav don't throw.
beforeEach(() => {
  Element.prototype.scrollTo = vi.fn();
  Element.prototype.scrollBy = vi.fn();
});

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const GROUPS: TimelineGroup[] = [
  { id: "a", name: "Phase A" },
  { id: "b", name: "Phase B" },
];

const ITEMS: TimelineItem[] = [
  { id: "a1", title: "Alpha", type: "task", group: "a", startDate: "2026-01-01", endDate: "2026-01-10", status: "planned" },
  { id: "a2", title: "Beta", type: "phase", group: "a", startDate: "2026-01-20", endDate: "2026-01-30", status: "active", progress: 0.5 },
  { id: "b1", title: "Gamma", type: "milestone", group: "b", startDate: "2026-02-05", endDate: "2026-02-05", status: "blocked", milestone: true, metadata: { note: "Awaiting sign-off." } },
  { id: "b2", title: "Delta", type: "task", group: "b", startDate: "2026-01-15", endDate: "2026-02-01", status: "delayed", dependencyIds: ["a1"], metadata: { note: "Slipped a week." } },
];

const TODAY = "2026-01-18";

const renderTimeline = (props: Partial<React.ComponentProps<typeof ProjectTimeline>> = {}) =>
  render(<ProjectTimeline items={ITEMS} groups={GROUPS} today={TODAY} {...props} />);

describe("ProjectTimeline", () => {
  it("changes the time scale (day / week / month) and reports it", async () => {
    const user = userEvent.setup();
    const onScaleChange = vi.fn();
    renderTimeline({ defaultScale: "week", onScaleChange });

    const week = screen.getByRole("button", { name: "Week" });
    expect(week.getAttribute("aria-pressed")).toBe("true");

    await user.click(screen.getByRole("button", { name: "Day" }));
    expect(onScaleChange).toHaveBeenLastCalledWith("day");
    expect(screen.getByRole("button", { name: "Day" }).getAttribute("aria-pressed")).toBe("true");

    await user.click(screen.getByRole("button", { name: "Month" }));
    expect(onScaleChange).toHaveBeenLastCalledWith("month");
    expect(screen.getByRole("button", { name: "Month" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("selects an item and shows its date range + dependencies as text", async () => {
    const user = userEvent.setup();
    const onSelectedItemChange = vi.fn();
    renderTimeline({ onSelectedItemChange });

    // "Delta" is a delayed task depending on "Alpha".
    await user.click(screen.getByRole("button", { name: /Delta\. Task\. Delayed/i }));
    expect(onSelectedItemChange).toHaveBeenCalledWith("b2");

    // The detail panel states the range/duration as words and lists the dependency.
    expect(screen.getAllByText(/17 days/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Depends on")).toBeTruthy();
    expect(screen.getByText("Slipped a week.")).toBeTruthy();
  });

  it("filters items by status (list mode removes non-matching rows)", async () => {
    const user = userEvent.setup();
    renderTimeline({ compact: true });

    // All four present initially.
    expect(screen.getByRole("button", { name: /Alpha/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Delta/i })).toBeTruthy();

    // Filter to just "Delayed".
    await user.click(screen.getByRole("button", { name: /^Delayed$/i, pressed: false }));
    expect(screen.queryByRole("button", { name: /Alpha/i })).toBeNull();
    expect(screen.getByRole("button", { name: /Delta/i })).toBeTruthy();
  });

  it("supports keyboard item navigation and selection", async () => {
    const user = userEvent.setup();
    const onSelectedItemChange = vi.fn();
    const { container } = renderTimeline({ onSelectedItemChange });

    const roving = container.querySelector<HTMLButtonElement>('[data-timeline-item][tabindex="0"]');
    expect(roving).toBeTruthy();
    const startId = roving!.getAttribute("data-timeline-item");
    roving!.focus();

    await user.keyboard("{ArrowRight}");
    const moved = document.activeElement as HTMLElement | null;
    expect(moved?.getAttribute("data-timeline-item")).toBeTruthy();
    expect(moved?.getAttribute("data-timeline-item")).not.toBe(startId);

    await user.keyboard("{Enter}");
    expect(onSelectedItemChange).toHaveBeenCalledWith(moved?.getAttribute("data-timeline-item"));
  });

  it("renders a structured grouped list fallback with dates as text", async () => {
    const { container } = renderTimeline({ compact: true });
    expect(screen.getByRole("heading", { name: "Phase A" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Phase B" })).toBeTruthy();

    const lists = screen.getAllByRole("list");
    expect(lists.length).toBeGreaterThan(0);
    // Alpha's row shows its date range in text (Jan 1 – Jan 10, 2026 · 9 days).
    const alpha = screen.getByRole("button", { name: /Alpha/i });
    expect(within(alpha).getByText(/9 days/i)).toBeTruthy();

    await noViolations(container);
  });

  it("draws a today marker from the `today` prop and jumps to it without a clock read", async () => {
    const user = userEvent.setup();
    renderTimeline({ defaultScale: "week" });

    // Marker text + toolbar button both read "Today" (marker is fixed data).
    expect(screen.getAllByText("Today").length).toBeGreaterThanOrEqual(2);

    const scrollTo = Element.prototype.scrollTo as unknown as ReturnType<typeof vi.fn>;
    scrollTo.mockClear();
    await user.click(screen.getByRole("button", { name: /^Today$/ }));
    expect(scrollTo).toHaveBeenCalled();
  });

  it("has no axe violations in the default timeline view", async () => {
    const { container } = renderTimeline({ defaultSelectedItemId: "a2" });
    await noViolations(container);
  });
});
