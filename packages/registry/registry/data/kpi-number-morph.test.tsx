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
});
