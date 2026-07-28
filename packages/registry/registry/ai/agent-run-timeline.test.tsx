import * as React from "react";
import { render, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AgentRunTimeline, type AgentRun } from "./agent-run-timeline";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const BASE: AgentRun = {
  title: "Apply database migration",
  status: "running",
  currentStepId: "s4",
  startedAt: 1_720_000_000_000,
  steps: [
    {
      id: "s1",
      title: "Inspect repository",
      status: "completed",
      toolCall: { name: "repo.scan", result: { files: 12 } },
      startedAt: 1_720_000_000_000,
    },
    { id: "s2", title: "Wait for deployment approval", status: "waiting_approval", description: "Needs a human." },
    { id: "s3", title: "Run validation", status: "failed", error: "Validation exited with code 1." },
    { id: "s4", title: "Generate migration proposal", status: "active" },
  ],
};

describe("AgentRunTimeline", () => {
  it("shows every status as a readable label (never colour-only)", async () => {
    const { container } = render(<AgentRunTimeline run={BASE} />);
    expect(screen.getByText("Completed")).toBeTruthy();
    expect(screen.getByText("Waiting for approval")).toBeTruthy();
    expect(screen.getByText("Failed")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    await noViolations(container);
  });

  it("follows the run's current step, reporting the active-step change", () => {
    const onActiveStepChange = vi.fn();
    const { rerender } = render(
      <AgentRunTimeline run={BASE} followActive onActiveStepChange={onActiveStepChange} />,
    );
    onActiveStepChange.mockClear();
    rerender(<AgentRunTimeline run={{ ...BASE, currentStepId: "s1" }} followActive onActiveStepChange={onActiveStepChange} />);
    expect(onActiveStepChange).toHaveBeenCalledWith("s1");
  });

  it("fires onApprove for a waiting_approval step", async () => {
    const onApprove = vi.fn();
    const user = userEvent.setup();
    render(<AgentRunTimeline run={BASE} onApprove={onApprove} />);
    await user.click(screen.getByRole("button", { name: /approve wait for deployment approval/i }));
    expect(onApprove).toHaveBeenCalledWith("s2");
  });

  it("fires onRetryStep for a failed step", async () => {
    const onRetryStep = vi.fn();
    const user = userEvent.setup();
    render(<AgentRunTimeline run={BASE} onRetryStep={onRetryStep} />);
    await user.click(screen.getByRole("button", { name: /retry run validation/i }));
    expect(onRetryStep).toHaveBeenCalledWith("s3");
  });

  it("fires onCancelRun from the run-level control", async () => {
    const onCancelRun = vi.fn();
    const user = userEvent.setup();
    render(<AgentRunTimeline run={BASE} onCancelRun={onCancelRun} />);
    await user.click(screen.getByRole("button", { name: /cancel run/i }));
    expect(onCancelRun).toHaveBeenCalled();
  });

  it("toggles a step's details region via aria-expanded", async () => {
    const user = userEvent.setup();
    render(<AgentRunTimeline run={BASE} />);
    const header = screen.getByRole("button", { name: /inspect repository/i });
    expect(header.getAttribute("aria-expanded")).toBe("false");
    await user.click(header);
    expect(header.getAttribute("aria-expanded")).toBe("true");
  });
});

/*
 * Responsive contract. jsdom cannot lay out, so these assert the *structure* that
 * makes a narrow render reflow: grouped meta spans (a "·" can never become its
 * own flex line), line-clamped titles instead of single-line truncation, and a
 * meta rail that takes its own full-width row until the component ITSELF is wide
 * enough. Reflow is driven by `@container/timeline`, never by the viewport — the
 * component is routinely tiled into a column far narrower than the window.
 */
describe("AgentRunTimeline — responsive contract", () => {
  it("renders the run meta as grouped nowrap spans with no standalone separator", () => {
    const { container } = render(<AgentRunTimeline run={BASE} />);
    const groups = Array.from(container.querySelectorAll("[data-meta-group]"));
    // "N of M steps", "started …", "1 failed", "1 awaiting approval".
    expect(groups.length).toBe(4);
    for (const g of groups) expect(g.className).toContain("whitespace-nowrap");

    // Every element in the meta row is a group — never a bare "·" flex item.
    const row = groups[0].parentElement;
    expect(row).toBeTruthy();
    for (const child of Array.from(row!.children)) {
      expect(child.hasAttribute("data-meta-group")).toBe(true);
      expect(child.textContent?.replace(/[·\s]/g, "")).not.toBe("");
    }
  });

  it("wraps the run title and every step title instead of truncating them", () => {
    const { container } = render(<AgentRunTimeline run={BASE} />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.className).toContain("line-clamp-2");
    expect(heading.className).not.toContain("truncate");

    const titles = Array.from(container.querySelectorAll("[data-step-title]"));
    expect(titles.length).toBe(BASE.steps.length);
    for (const t of titles) {
      expect(t.className).toContain("line-clamp-2");
      expect(t.className).not.toContain("truncate");
    }
  });

  it("declares its own named container context so it sizes on its own width", () => {
    const { container } = render(<AgentRunTimeline run={BASE} />);
    const root = container.querySelector("section");
    expect(root).toBeTruthy();
    expect(root!.className).toContain("@container/timeline");
  });

  it("gives each step's status + actions their own full-width row until @md/timeline", () => {
    const { container } = render(<AgentRunTimeline run={BASE} />);
    const rails = Array.from(container.querySelectorAll("[data-step-meta]"));
    expect(rails.length).toBe(BASE.steps.length);
    for (const rail of rails) {
      expect(rail.className).toContain("w-full");
      // Container-based, not viewport-based: a 320px tile on a wide screen must
      // still get the stacked form.
      expect(rail.className).toContain("@md/timeline:w-auto");
      expect(rail.className).not.toContain("sm:w-auto");
    }
  });

  it("gives run + step controls a 44px touch target while the timeline is narrow", () => {
    render(
      <AgentRunTimeline run={BASE} onApprove={vi.fn()} onRetryStep={vi.fn()} onCancelRun={vi.fn()} />,
    );
    for (const name of [
      /approve wait for deployment approval/i,
      /retry run validation/i,
      /cancel run/i,
    ]) {
      expect(screen.getByRole("button", { name }).className).toContain("min-h-[44px]");
    }
  });
});
