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
