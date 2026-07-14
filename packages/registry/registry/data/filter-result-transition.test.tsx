import * as React from "react";
import { render, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FilterResultTransition, type ActiveFilter } from "./filter-result-transition";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

interface Asset {
  id: string;
  name: string;
}

const ALL: Asset[] = [
  { id: "a", name: "Aurora" },
  { id: "b", name: "Basalt" },
  { id: "c", name: "Cobalt" },
  { id: "d", name: "Dune" },
];

function Harness(props: Partial<React.ComponentProps<typeof FilterResultTransition<Asset>>> & { items: Asset[] }) {
  return (
    <FilterResultTransition<Asset>
      getItemId={(a) => a.id}
      renderItem={(a) => <article data-testid={`card-${a.id}`}><h4>{a.name}</h4></article>}
      regionLabel="Assets"
      {...props}
    />
  );
}

describe("FilterResultTransition", () => {
  it("morphs the result count when the filtered set changes", async () => {
    const { rerender, container } = render(<Harness items={ALL} />);
    await waitFor(() => expect(screen.getByRole("heading", { level: 3 }).textContent).toContain("4 results"));
    rerender(<Harness items={ALL.slice(0, 2)} />);
    await waitFor(() => expect(screen.getByRole("heading", { level: 3 }).textContent).toContain("2 results"));
    await noViolations(container);
  });

  it("calls onRemoveFilter when a filter chip's remove button is activated", async () => {
    const user = userEvent.setup();
    const onRemoveFilter = vi.fn();
    const filters: ActiveFilter[] = [{ id: "cat:design", group: "Category", label: "Design" }];
    render(<Harness items={ALL} activeFilters={filters} onRemoveFilter={onRemoveFilter} />);
    await user.click(screen.getByRole("button", { name: /remove filter category: design/i }));
    expect(onRemoveFilter).toHaveBeenCalledWith(filters[0]);
  });

  it("fires onFocusFallback when the focused item disappears after a filter", async () => {
    const onFocusFallback = vi.fn();
    const { rerender } = render(<Harness items={ALL} focusedItemId="b" onFocusFallback={onFocusFallback} />);
    expect(onFocusFallback).not.toHaveBeenCalled();
    // Filter "b" out — its focused card is gone; focus must not drop to the root.
    rerender(<Harness items={ALL.filter((a) => a.id !== "b")} focusedItemId="b" onFocusFallback={onFocusFallback} />);
    await waitFor(() => expect(onFocusFallback).toHaveBeenCalledTimes(1));
    expect(onFocusFallback.mock.calls[0][0]).toMatchObject({ previousId: "b" });
  });

  it("renders the empty state with actionable guidance", () => {
    render(
      <Harness
        items={[]}
        query="zephyr"
        activeFilters={[{ id: "cat:design", label: "Design" }]}
        emptyGuidance="Try removing the Design filter."
      />,
    );
    expect(screen.getByText(/no results for “zephyr”/i)).toBeTruthy();
    expect(screen.getByText(/try removing the design filter/i)).toBeTruthy();
  });

  it("renders a labelled loading state", () => {
    const { container } = render(<Harness items={[]} loading />);
    expect(screen.getByRole("heading", { level: 3 }).textContent).toContain("Loading");
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Loading results");
  });

  it("keeps the same DOM element for a surviving item across a filter (stable getItemId)", () => {
    const { container, rerender } = render(<Harness items={ALL} />);
    const before = container.querySelector('[data-item-id="a"]') as HTMLElement;
    before.dataset.marker = "kept";
    // Remove "b"; "a" survives and must keep its node (and its marker).
    rerender(<Harness items={ALL.filter((x) => x.id !== "b")} />);
    const after = container.querySelector('[data-item-id="a"]') as HTMLElement;
    expect(after.dataset.marker).toBe("kept");
  });
});
