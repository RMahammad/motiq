import * as React from "react";
import { render, cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApprovalWorkflow,
  type ApprovalWorkflowData,
  type ApprovalAction,
} from "./approval-workflow";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const T = 1_800_000_000_000;

function baseWorkflow(overrides: Partial<ApprovalWorkflowData> = {}): ApprovalWorkflowData {
  return {
    id: "wf-1",
    title: "Launch approval — demo release",
    requester: { id: "req", name: "Requester Rae" },
    status: "in_review",
    currentStageId: "s-security",
    stages: [
      {
        id: "s-product",
        name: "Product review",
        status: "approved",
        mode: "all",
        completedAt: T - 3600_000,
        reviewers: [{ id: "pm", name: "Pat Morgan", decision: "approved", decidedAt: T - 3600_000 }],
      },
      {
        id: "s-security",
        name: "Security review",
        status: "in_review",
        mode: "any",
        reviewers: [{ id: "you", name: "You Reviewer", decision: "pending" }],
      },
      {
        id: "s-marketing",
        name: "Marketing approval",
        status: "pending",
        mode: "all",
        reviewers: [{ id: "mk", name: "Marketing Max", decision: "pending" }],
      },
    ],
    history: [{ id: "h1", action: "approve", actorId: "pm", actorName: "Pat Morgan", stageName: "Product review", timestamp: T - 3600_000 }],
    ...overrides,
  };
}

/** Stateful host that advances the current stage when the user approves — mirrors
 *  the real usage where the app owns and updates the workflow data. */
function Host({ onApprove }: { onApprove?: (a: ApprovalAction) => void }) {
  const [wf, setWf] = React.useState<ApprovalWorkflowData>(() => baseWorkflow());
  return (
    <ApprovalWorkflow
      workflow={wf}
      currentUserId="you"
      onApprove={(ctx) => {
        onApprove?.(ctx.action);
        setWf((w) => ({
          ...w,
          currentStageId: "s-marketing",
          stages: w.stages.map((s) =>
            s.id === "s-security" ? { ...s, status: "approved" as const } : s.id === "s-marketing" ? { ...s, status: "in_review" as const } : s,
          ),
        }));
      }}
    />
  );
}

describe("ApprovalWorkflow", () => {
  it("fires onApprove for the current stage and the workflow progresses", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    render(<Host onApprove={onApprove} />);

    // The current stage is emphasized and its action bar is present.
    expect(screen.getByText(/Awaiting your decision on/i)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /^Approve$/i }));

    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onApprove).toHaveBeenCalledWith("approve");
    // Progression: Marketing approval becomes the current stage.
    const currentBadge = screen.getByText("Current");
    expect(within(currentBadge.closest("li")!).getByText("Marketing approval")).toBeTruthy();
  });

  it("fires onReject after the destructive confirmation step", async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();
    render(<ApprovalWorkflow workflow={baseWorkflow()} currentUserId="you" confirmReject onReject={onReject} />);

    await user.click(screen.getByRole("button", { name: /^Reject$/i }));
    // First click reveals a confirmation, does not fire yet.
    expect(onReject).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog", { name: /confirm rejection/i })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /confirm reject/i }));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("fires onRequestChanges", async () => {
    const user = userEvent.setup();
    const onRequestChanges = vi.fn();
    render(<ApprovalWorkflow workflow={baseWorkflow()} currentUserId="you" onRequestChanges={onRequestChanges} />);

    await user.click(screen.getByRole("button", { name: /request changes/i }));
    expect(onRequestChanges).toHaveBeenCalledTimes(1);
  });

  it("does not fire a disabled action and surfaces the app-provided reason", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    render(
      <ApprovalWorkflow
        workflow={baseWorkflow()}
        currentUserId="you"
        onApprove={onApprove}
        canAct={(action) =>
          action === "approve" ? { allowed: false, reason: "You already reviewed this stage." } : true
        }
      />,
    );

    const approve = screen.getByRole("button", { name: /^Approve$/i }) as HTMLButtonElement;
    expect(approve.disabled).toBe(true);
    // Reason is surfaced in the UI, not only via title.
    expect(screen.getByText("You already reviewed this stage.")).toBeTruthy();
    await user.click(approve);
    expect(onApprove).not.toHaveBeenCalled();
  });

  it("conveys status with a text label, not color alone, and has no axe violations", async () => {
    const { container } = render(<ApprovalWorkflow workflow={baseWorkflow()} currentUserId="you" />);
    // Workflow + stage status label (text, not color-only).
    expect(screen.getAllByText("In review").length).toBeGreaterThan(0);
    // Stage/reviewer decision labels (text, plus an icon).
    expect(screen.getAllByText("Approved").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Security review").length).toBeGreaterThan(0);
    await noViolations(container);
  });

  it("renders final state under reduced motion with no violations", async () => {
    const orig = window.matchMedia;
    window.matchMedia = ((q: string) => ({
      matches: /prefers-reduced-motion/.test(q),
      media: q,
      onchange: null,
      addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
    })) as typeof window.matchMedia;
    try {
      const { container } = render(<ApprovalWorkflow workflow={baseWorkflow()} currentUserId="you" />);
      expect(screen.getAllByText("Security review").length).toBeGreaterThan(0);
      expect(screen.getByRole("button", { name: /^Approve$/i })).toBeTruthy();
      await noViolations(container);
    } finally {
      window.matchMedia = orig;
    }
  });
});
