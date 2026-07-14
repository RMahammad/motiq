import * as React from "react";
import { render, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ProductVariantSelector,
  type OptionGroup,
  type VariantSelection,
} from "./product-variant-selector";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const GROUPS: OptionGroup[] = [
  {
    id: "color",
    type: "color",
    label: "Colour",
    values: [
      { value: "graphite", label: "Graphite", swatch: "#3a3a3a", inventoryState: "in_stock", recommended: true },
      { value: "sand", label: "Sand", swatch: "#d8c6a8", inventoryState: "low_stock" },
      { value: "moss", label: "Moss", swatch: "#5a6b4a", inventoryState: "out_of_stock", disabledReason: "Moss is out of stock." },
    ],
  },
  {
    id: "size",
    type: "size",
    label: "Size",
    values: [
      { value: "s", label: "Small", inventoryState: "in_stock" },
      { value: "m", label: "Medium", inventoryState: "in_stock" },
      { value: "l", label: "Large", priceAdjustment: 20, inventoryState: "in_stock" },
    ],
  },
];

// Dependent rule: Large is not made in Sand — an unavailable *combination*.
const dependentState: React.ComponentProps<typeof ProductVariantSelector>["getVariantState"] = ({ group, value, selection }) => {
  if (group.id === "size" && value.value === "l" && selection.color === "sand") {
    return { disabled: true, reason: "Large isn’t produced in Sand." };
  }
  return undefined;
};

describe("ProductVariantSelector", () => {
  it("commits a controlled selection through onValueChange (value stays app-owned)", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const value: VariantSelection = { color: "graphite", size: "s" };
    const { container } = render(
      <ProductVariantSelector groups={GROUPS} value={value} basePrice={120} onValueChange={onValueChange} />,
    );
    // Controlled: graphite + small are checked from the app's value.
    expect(screen.getByRole("radio", { name: /Graphite/i }).getAttribute("aria-checked")).toBe("true");
    await user.click(screen.getByRole("radio", { name: /Medium/i }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(
      { color: "graphite", size: "m" },
      expect.objectContaining({ groupId: "size", value: expect.objectContaining({ value: "m" }) }),
    );
    await noViolations(container);
  });

  it("blocks an unavailable combination and surfaces a recovery path", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ProductVariantSelector
        groups={GROUPS}
        defaultValue={{ color: "graphite", size: "l" }}
        basePrice={120}
        getVariantState={dependentState}
        onValueChange={onValueChange}
      />,
    );
    // Choosing Sand makes the already-selected Large an invalid combination.
    await user.click(screen.getByRole("radio", { name: /Sand/i }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/combination isn’t available|not produced|Size/i);
    // The Large tile is now disabled and cannot be re-selected.
    expect(screen.getByRole("radio", { name: /Large/i }).getAttribute("aria-disabled")).toBe("true");
    onValueChange.mockClear();
    await user.click(screen.getByRole("radio", { name: /Large/i }));
    expect(onValueChange).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ value: expect.objectContaining({ value: "l" }) }),
    );
  });

  it("surfaces the app-owned disabled reason for an out-of-stock value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ProductVariantSelector groups={GROUPS} defaultValue={{ color: "graphite", size: "s" }} basePrice={120} onValueChange={onValueChange} />,
    );
    const moss = screen.getByRole("radio", { name: /Moss/i });
    expect(moss.getAttribute("aria-disabled")).toBe("true");
    const reasonId = moss.getAttribute("aria-describedby");
    expect(reasonId).toBeTruthy();
    expect(document.getElementById(reasonId!)?.textContent).toMatch(/out of stock/i);
    await user.click(moss);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("fires onPriceChange with the recomputed total when an adjustment is chosen", async () => {
    const user = userEvent.setup();
    const onPriceChange = vi.fn();
    render(
      <ProductVariantSelector
        groups={GROUPS}
        defaultValue={{ color: "graphite", size: "s" }}
        basePrice={120}
        onPriceChange={onPriceChange}
      />,
    );
    onPriceChange.mockClear();
    await user.click(screen.getByRole("radio", { name: /Large/i })); // +20
    expect(onPriceChange).toHaveBeenCalledTimes(1);
    expect(onPriceChange).toHaveBeenCalledWith(140, 20);
  });

  it("supports keyboard selection with arrow keys inside a radiogroup", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ProductVariantSelector groups={GROUPS} defaultValue={{ color: "graphite", size: "s" }} basePrice={120} onValueChange={onValueChange} />,
    );
    const small = screen.getByRole("radio", { name: /Small/i });
    small.focus();
    await waitFor(() => expect(document.activeElement).toBe(small));
    await user.keyboard("{ArrowRight}"); // Small → Medium, selects on move
    expect(onValueChange).toHaveBeenCalledWith(
      { color: "graphite", size: "m" },
      expect.objectContaining({ groupId: "size", value: expect.objectContaining({ value: "m" }) }),
    );
  });

  it("renders an honest loading-availability state and is accessible", async () => {
    const { container } = render(
      <ProductVariantSelector
        groups={GROUPS}
        defaultValue={{ color: "graphite", size: "s" }}
        basePrice={120}
        loadingAvailability
      />,
    );
    const section = screen.getByRole("region", { name: /options/i });
    expect(section.getAttribute("aria-busy")).toBe("true");
    expect(within(section).getAllByText(/Checking availability/i).length).toBeGreaterThan(0);
    await noViolations(container);
  });
});
