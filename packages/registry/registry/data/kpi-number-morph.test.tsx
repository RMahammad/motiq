import * as React from "react";
import { render, cleanup, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";

import { KpiNumberMorph } from "./kpi-number-morph";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

describe("KpiNumberMorph", () => {
  it("renders the formatted value with prefix/suffix and is axe-clean", async () => {
    const { container } = render(<KpiNumberMorph label="Revenue" value={1240} prefix="$" />);
    expect(screen.getByText(/\$1,240/)).toBeTruthy();
    await noViolations(container);
  });

  it("conveys a negative change with a sign, not color alone", () => {
    const { container } = render(
      <KpiNumberMorph label="Churn" value={3.2} suffix="%" change={-0.6} changeAsPercent />,
    );
    // an accessible label carries the direction in words, and the visible text has a minus sign
    const group = container.querySelector('[role="group"]');
    expect(group?.getAttribute("aria-label")).toMatch(/down/i);
    expect(container.textContent).toContain("−");
  });

  it("loading state is aria-busy and hides the number", () => {
    const { container } = render(<KpiNumberMorph label="Users" value={999} state="loading" />);
    const group = container.querySelector('[role="group"]');
    expect(group?.getAttribute("aria-busy")).toBe("true");
    expect(container.textContent).not.toContain("999");
  });

  it("formats large numbers in compact notation", () => {
    render(<KpiNumberMorph label="Views" value={3140000} notation="compact" />);
    expect(screen.getByText(/3\.1M/)).toBeTruthy();
  });

  /* --- responsive contracts (structure/class assertions jsdom can enforce) -- */

  it("keeps the trend glyph and its delta in one unwrappable group", () => {
    const { container } = render(
      <KpiNumberMorph label="Events / min" value={1000} change={-3087} changeLabel="vs last tick" />,
    );
    const row = container.querySelector("[data-kpi-change]");
    expect(row).toBeTruthy();
    // The row wraps as a whole…
    expect(row!.className).toContain("flex-wrap");
    // …but the arrow and the number are one nowrap item, so a narrow tile can
    // never strand the delta on a line away from its direction glyph.
    const value = row!.querySelector("[data-kpi-change-value]");
    expect(value).toBeTruthy();
    expect(value!.className).toContain("whitespace-nowrap");
    expect(value!.querySelector("svg")).toBeTruthy();
    expect(value!.textContent).toContain("3,087");
  });

  it("sizes itself from its own container, never from the viewport", () => {
    const { container } = render(<KpiNumberMorph label="Revenue" value={10} />);
    const tile = container.firstElementChild as HTMLElement;
    // The tile declares a *named* container context, so a KPI in a 180px column
    // inside a 1440px window is treated as narrow.
    expect(tile.className).toContain("@container/kpi");
    expect(tile.className).toContain("min-w-0");
    // Padding steps on the tile's own width, not a media query.
    expect(tile.className).toContain("p-4");
    expect(tile.className).toContain("@[16rem]/kpi:p-5");
    // No viewport breakpoint may decide any of this.
    expect(tile.className).not.toMatch(/(^|\s)(sm|md|lg|xl):/);
  });

  it("scales the number in container units (cqi), not viewport units (vw)", () => {
    const { container } = render(<KpiNumberMorph label="Revenue" value={1240} />);
    const number = container.querySelector("span.tabular-nums") as HTMLElement;
    expect(number).toBeTruthy();
    expect(number.className).toContain("text-[clamp(1.7rem,14cqi,2.3rem)]");
    expect(number.className).not.toContain("vw");
  });
});
