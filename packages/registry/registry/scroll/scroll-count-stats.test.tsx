import { renderToString } from "react-dom/server";
import { render, cleanup } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";

import { ScrollCountStats, type CountStat } from "./scroll-count-stats";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const STATS: CountStat[] = [
  { value: 48210, label: "registry installs, trailing 90 days", sparkline: [30, 26, 28, 22, 24, 17, 19, 12, 14, 7, 5] },
  { value: "99.98", label: "of scroll frames inside the 16.6 ms budget", suffix: "%" },
  { value: 312, label: "easing-curve commits behind this batch", sparkline: [28, 29, 24, 26, 20, 22, 15, 17, 11, 12, 6] },
];

describe("ScrollCountStats", () => {
  it("exposes the real values to assistive tech and hides the rolling glyphs", () => {
    const { container, getByText } = render(<ScrollCountStats stats={STATS} />);
    const srValues = Array.from(container.querySelectorAll(".sr-only")).map((el) => el.textContent);
    // Numbers are grouped deterministically; strings pass through verbatim.
    expect(srValues).toEqual(["48,210", "99.98%", "312"]);
    for (const s of STATS) expect(getByText(s.label)).toBeTruthy();
    container.querySelectorAll<HTMLElement>("[aria-hidden]").forEach((el) => {
      expect(el.querySelector(".sr-only")).toBeNull();
    });
  });

  it("crops every digit column so a rolling strip can never spill over its neighbours", () => {
    // Regression guard: the odometer only reads as one digit because each column
    // is a fixed-height overflow crop around a 30-row strip.
    const { container } = render(<ScrollCountStats stats={STATS} rowHeight={46} />);
    const columns = Array.from(container.querySelectorAll<HTMLElement>("span.overflow-hidden"));
    // 5 digits + 4 digits + 3 digits (separators are not columns).
    expect(columns.length).toBe(12);
    columns.forEach((col) => {
      expect(col.style.height).toBe("46px");
      expect(col.firstElementChild?.childElementCount).toBe(30);
    });
  });

  it("server markup rests on the final digit and a fully drawn underline/sparkline", () => {
    const html = renderToString(<ScrollCountStats stats={STATS} title="Numbers that rewind" />);
    // The resting transform is expressed in row units, so no-JS shows the real value.
    expect(html).toContain("translate3d(0, calc(46px * -14), 0)"); // leading "4" of 48,210
    expect(html).toContain('stroke-dashoffset="0"');
    expect(html).toContain("48,210");
    expect(html).toContain("Numbers that rewind");
  });

  it("renders the coral signature underline only when asked", () => {
    const { container } = render(<ScrollCountStats stats={STATS} title="Numbers that rewind" />);
    expect(container.querySelector("path[stroke-linecap='round']")).not.toBeNull();
    cleanup();
    const { container: bare } = render(
      <ScrollCountStats stats={[STATS[1]]} title="Numbers that rewind" underline="none" />,
    );
    // No title underline and no sparkline on this stat → no SVG at all.
    expect(bare.querySelector("svg")).toBeNull();
  });

  it("flips data-motion to static under the reducedMotion prop with the values still final", () => {
    const { container } = render(<ScrollCountStats stats={STATS} reducedMotion />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-motion")).toBe("static");
    expect(container.querySelector('[role="region"]')).toBeNull();
    const strips = Array.from(container.querySelectorAll<HTMLElement>("span.overflow-hidden > span"));
    // Still parked on the final digit — nothing animated it away.
    expect(strips[0].style.transform).toBe("translate3d(0, calc(46px * -14), 0)");
  });

  it("container mode exposes a keyboard-scrollable, overscroll-contained region", () => {
    const { container } = render(<ScrollCountStats stats={STATS} scrollMode="container" height={400} />);
    const region = container.querySelector<HTMLElement>('[role="region"]');
    expect(region).not.toBeNull();
    expect(region?.tabIndex).toBe(0);
    expect(region?.getAttribute("aria-label")).toBeTruthy();
    expect(region?.className).toContain("overscroll-contain");
  });

  it("mounts and unmounts cleanly across option combinations", () => {
    expect(() => {
      const { unmount } = render(
        <ScrollCountStats stats={STATS} scrollMode="container" showProgress stagger={0.02} overshoot={0} rowHeight={38} />,
      );
      unmount();
    }).not.toThrow();
    cleanup();
    expect(() => {
      const { unmount } = render(<ScrollCountStats stats={[{ value: 0, label: "zero" }]} />);
      unmount();
    }).not.toThrow();
  });

  it("has no axe violations in either motion mode", async () => {
    const { container: animated } = render(
      <ScrollCountStats stats={STATS} title="Numbers that rewind" scrollMode="container" />,
    );
    await noViolations(animated);
    cleanup();
    const { container: still } = render(<ScrollCountStats stats={STATS} title="Numbers that rewind" reducedMotion />);
    await noViolations(still);
  });
});
