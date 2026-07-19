import * as React from "react";
import { render, cleanup, screen, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";

import { StreamingDataRows, type Column } from "./streaming-data-rows";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

interface Job {
  id: string;
  name: string;
  amount: number;
  status: string;
}

const columns: Column<Job>[] = [
  { key: "name", header: "Name", sortable: true, value: (r) => r.name },
  { key: "amount", header: "Amount", sortable: true, numeric: true, align: "end", value: (r) => r.amount },
  { key: "status", header: "Status", value: (r) => r.status },
];

const base: Job[] = [
  { id: "a", name: "Alpha", amount: 100, status: "queued" },
  { id: "b", name: "Bravo", amount: 300, status: "active" },
  { id: "c", name: "Charlie", amount: 200, status: "completed" },
];

function Harness(props: Partial<React.ComponentProps<typeof StreamingDataRows<Job>>> & { rows: Job[] }) {
  return (
    <StreamingDataRows<Job>
      columns={columns}
      getRowId={(r) => r.id}
      caption="Jobs"
      rowActions={(r) => [{ id: "retry", label: `Retry ${r.name}`, icon: "Retry" }]}
      {...props}
    />
  );
}

describe("StreamingDataRows", () => {
  it("keeps the same DOM element for a row across a value update (stable getRowId)", () => {
    const { rerender } = render(<Harness rows={base} />);
    const cellBefore = screen.getByText("Alpha").closest("td")!;
    (cellBefore as HTMLElement).dataset.marker = "kept";
    // Update Alpha's amount; identity (id "a") is unchanged.
    const updated = base.map((r) => (r.id === "a" ? { ...r, amount: 999 } : r));
    rerender(<Harness rows={updated} />);
    const cellAfter = screen.getByText("Alpha").closest("td")!;
    expect((cellAfter as HTMLElement).dataset.marker).toBe("kept");
  });

  it("sorts rows and sets aria-sort on the active header", async () => {
    const user = userEvent.setup();
    render(<Harness rows={base} defaultSort={null} />);
    const amountHeader = screen.getByRole("columnheader", { name: /amount/i });
    expect(amountHeader.getAttribute("aria-sort")).toBe("none");
    await user.click(within(amountHeader).getByRole("button"));
    expect(amountHeader.getAttribute("aria-sort")).toBe("ascending");
    // Ascending by amount → 100, 200, 300 → Alpha, Charlie, Bravo.
    const order = screen.getAllByRole("row").slice(1).map((tr) => within(tr).getByText(/Alpha|Bravo|Charlie/).textContent);
    expect(order).toEqual(["Alpha", "Charlie", "Bravo"]);
  });

  it("indicates a numeric change with a ▲/▼ glyph, not color alone", () => {
    const { container, rerender } = render(<Harness rows={base} />);
    // Increase Bravo's amount → an upward change glyph should render.
    act(() => {
      rerender(<Harness rows={base.map((r) => (r.id === "b" ? { ...r, amount: 500 } : r))} />);
    });
    expect(container.textContent).toContain("▲");
  });

  it("preserves focus on a focused row action across an update", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Harness rows={base} />);
    const btn = screen.getByRole("button", { name: "Retry Alpha" });
    await user.click(btn);
    expect(document.activeElement).toBe(btn);
    // A background update to a different row must not steal focus.
    act(() => {
      rerender(<Harness rows={base.map((r) => (r.id === "c" ? { ...r, amount: 250 } : r))} />);
    });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Retry Alpha" }));
  });

  it("renders a semantic table (columnheaders + rowgroups) and is axe-clean", async () => {
    const { container } = render(<Harness rows={base} />);
    expect(container.querySelector("table")).toBeTruthy();
    expect(screen.getAllByRole("columnheader").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByRole("rowgroup").length).toBeGreaterThanOrEqual(2); // thead + tbody
    await noViolations(container);
  });
});
