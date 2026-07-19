import * as React from "react";
import { render, cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DataQualityStatus,
  deriveOverallState,
  type QualityCheck,
} from "./data-quality-status";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

// Deterministic timestamps — no Date.now / Math.random anywhere.
const NOW = 1_700_000_000_000;
const CHECKED = NOW - 5 * 60_000; // 5m ago

const CHECKS: QualityCheck[] = [
  { id: "nulls", label: "No null emails", state: "pass", summary: "0 nulls in 12,400 rows" },
  {
    id: "dupes",
    label: "Unique customer IDs",
    state: "warning",
    summary: "3 duplicate keys",
    affectedRecords: 3,
    issues: [
      { id: "d1", message: "Duplicate id CUS-1042", records: 2, location: "column: customer_id" },
      { id: "d2", message: "Duplicate id CUS-8890", records: 1, location: "column: customer_id" },
    ],
  },
  {
    id: "range",
    label: "Order totals within range",
    state: "failure",
    summary: "Negative totals detected",
    affectedRecords: 18,
    issues: [{ id: "r1", message: "18 orders below zero", records: 18, location: "column: total_cents" }],
  },
  { id: "geo", label: "Region codes verified", state: "unknown", summary: "Reference table unavailable" },
];

function renderComponent(props: Partial<React.ComponentProps<typeof DataQualityStatus>> = {}) {
  return render(
    <DataQualityStatus
      label="Customer accounts"
      source="Warehouse · public.customers"
      metrics={{
        freshness: { label: "2h behind", caption: "vs. source" },
        completeness: { score: 0.986 },
        // accuracy deliberately omitted → must render "Unknown"
      }}
      checks={CHECKS}
      lastChecked={CHECKED}
      totalRecords={12400}
      now={NOW}
      {...props}
    />,
  );
}

describe("DataQualityStatus", () => {
  it("derives the overall verdict as the worst supplied check state", () => {
    expect(deriveOverallState(CHECKS)).toBe("failure");
    expect(deriveOverallState([{ id: "a", label: "a", state: "pass" }, { id: "b", label: "b", state: "warning" }])).toBe("warning");
    expect(deriveOverallState([{ id: "a", label: "a", state: "pass" }, { id: "b", label: "b", state: "unknown" }])).toBe("unknown");
    expect(deriveOverallState([{ id: "a", label: "a", state: "pass" }])).toBe("pass");
    expect(deriveOverallState([])).toBe("unknown");
  });

  it("shows the failing verdict headline (icon + text, not colour alone)", () => {
    renderComponent();
    // The verdict is conveyed as text, not just a colour.
    expect(screen.getAllByText(/Failing checks/i).length).toBeGreaterThan(0);
  });

  it("renders 'Unknown' for a metric the app did not supply — never a fabricated value", () => {
    renderComponent();
    // Accuracy metric was omitted from props.
    const accuracyLabel = screen.getByText("Accuracy");
    const tile = accuracyLabel.closest("div") as HTMLElement;
    expect(within(tile).getByText("Unknown")).toBeTruthy();
    expect(within(tile).getByText(/Not measured/i)).toBeTruthy();
    // Supplied metrics still show their real values.
    expect(screen.getByText("2h behind")).toBeTruthy();
    expect(screen.getByText("99%")).toBeTruthy(); // 0.986 rounded
  });

  it("expands a check row to reveal its issue list, toggling aria-expanded", async () => {
    const user = userEvent.setup();
    renderComponent();
    const trigger = screen.getByRole("button", { name: /Unique customer IDs/i });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    // Issue detail is hidden until expanded.
    expect(screen.queryByText(/Duplicate id CUS-1042/i)).toBeNull();
    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(/Duplicate id CUS-1042/i)).toBeTruthy();
  });

  it("expands via keyboard (Enter on the focused row)", async () => {
    const user = userEvent.setup();
    renderComponent();
    const trigger = screen.getByRole("button", { name: /Order totals within range/i });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
    await user.keyboard("{Enter}");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(/18 orders below zero/i)).toBeTruthy();
  });

  it("filters the check list by status", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    renderComponent({ onFilterChange });
    // All four checks visible initially.
    expect(screen.getByText(/No null emails/i)).toBeTruthy();
    // Filter to failing only.
    await user.click(screen.getByRole("button", { name: /^Failing/i }));
    expect(onFilterChange).toHaveBeenCalledWith("failure");
    expect(screen.getByText(/Order totals within range/i)).toBeTruthy();
    expect(screen.queryByText(/No null emails/i)).toBeNull();
    expect(screen.queryByText(/Region codes verified/i)).toBeNull();
  });

  it("fires the retry-validation callback and reflects the app-owned validating state", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = renderComponent({ onRetry });
    await user.click(screen.getByRole("button", { name: /Re-run validation/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    // While validating, the button is disabled and shows progress text (app-owned).
    rerender(
      <DataQualityStatus label="Customer accounts" checks={CHECKS} lastChecked={CHECKED} now={NOW} onRetry={onRetry} validating />,
    );
    const btn = screen.getByRole("button", { name: /Re-run validation/i });
    expect(btn.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(/Validating…/i)).toBeTruthy();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderComponent();
    await noViolations(container);
  });
});
