import * as React from "react";
import { render, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DataRefreshState } from "./data-refresh-state";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

// Fixed timestamp — no Date.now()/new Date() so there is no hydration drift.
const TS = 1_700_000_000_000;

describe("DataRefreshState", () => {
  it("fires onRefresh from the manual refresh control", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    render(<DataRefreshState state="idle" label="Metrics" lastUpdated={TS} onRefresh={onRefresh} />);
    await user.click(screen.getByRole("button", { name: /refresh now/i }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("fires onCancel while a refresh is in flight", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<DataRefreshState state="refreshing" label="Metrics" progress={0.3} onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("fires onRetry after a failure", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<DataRefreshState state="error" label="Metrics" errorSummary="Gateway timeout" onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("exposes determinate progress as role=progressbar with aria-valuenow", async () => {
    const { container } = render(<DataRefreshState state="refreshing" label="Metrics" progress={0.42} />);
    const bar = container.querySelector('[role="progressbar"]')!;
    expect(bar).toBeTruthy();
    expect(bar.getAttribute("aria-valuenow")).toBe("42");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
  });

  it("renders offline and stale as text labels, not color alone", async () => {
    const { container: offlineC } = render(
      <DataRefreshState state="offline" label="Metrics" connection="No connection" />,
    );
    // The visible status pill carries a text label (not color alone).
    expect(screen.getAllByText(/offline/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no connection/i).length).toBeGreaterThan(0);
    await noViolations(offlineC);
    cleanup();
    render(<DataRefreshState state="stale" label="Metrics" staleness="18m behind" lastUpdated={TS} onRefresh={() => {}} />);
    expect(screen.getAllByText(/stale/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/18m behind/i).length).toBeGreaterThan(0);
  });

  it("renders an accessible, determinate output under reduced motion", async () => {
    const { container } = render(
      <DataRefreshState state="refreshing" label="Metrics" progress={0.6} reducedMotion onCancel={() => {}} />,
    );
    const bar = container.querySelector('[role="progressbar"]')!;
    expect(bar.getAttribute("aria-valuenow")).toBe("60");
    expect(screen.getAllByText(/refreshing/i).length).toBeGreaterThan(0);
    await noViolations(container);
  });
});
