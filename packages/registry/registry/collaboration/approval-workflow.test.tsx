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

/* -- responsive contract ------------------------------------------------- */

/** A "·" (or "•") that is its own element inside a flex row becomes its own flex
 *  item and can wrap onto a line by itself. Separators must always travel with
 *  the text they separate (or live in plain inline flow). */
function standaloneSeparatorsInFlex(root: HTMLElement): string[] {
  const bad: string[] = [];
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    if (el.children.length > 0) return;
    const text = (el.textContent ?? "").trim();
    if (text !== "·" && text !== "•") return;
    const parentClass = el.parentElement?.className ?? "";
    if (/(^|[\s:])flex(\s|$)/.test(String(parentClass))) bad.push(String(parentClass));
  });
  return bad;
}

describe("ApprovalWorkflow — responsive contract", () => {
  it("never renders a bare separator as its own flex item", () => {
    const { container } = render(
      <ApprovalWorkflow workflow={baseWorkflow({ createdAt: T - 86_400_000 })} currentUserId="you" />,
    );
    expect(standaloneSeparatorsInFlex(container)).toEqual([]);
  });

  it("clamps a reviewer note to two lines instead of truncating it to a few characters", () => {
    const wf = baseWorkflow();
    wf.stages[1].reviewers[0] = {
      id: "you",
      name: "You Reviewer",
      decision: "changes_requested",
      decidedAt: T - 60_000,
      note: "The CTA copy overflows on the narrow breakpoint and the plan grid needs another pass.",
    };
    const { container } = render(<ApprovalWorkflow workflow={wf} currentUserId="you" />);
    const note = container.querySelector<HTMLElement>('[data-part="reviewer-note"]');
    expect(note).not.toBeNull();
    const cls = String(note?.className);
    // Two clamped lines on a full-width row — never a single-line ellipsis.
    expect(cls).toMatch(/line-clamp-2/);
    expect(cls).not.toMatch(/(^|\s)truncate(\s|$)/);
    expect(cls).toMatch(/w-full/);
  });

  it("reacts to its own width, not the viewport", () => {
    const { container } = render(<ApprovalWorkflow workflow={baseWorkflow()} currentUserId="you" />);
    const root = container.firstElementChild as HTMLElement;
    expect(String(root.className)).toMatch(/@container\/workflow/);
    // An element is never its own query container — the root must not query itself.
    expect(String(root.className)).not.toMatch(/@\[400px\]\/workflow:/);
    container.querySelectorAll("*").forEach((el) => {
      expect(String(el.className)).not.toMatch(/(^|\s)(sm|md|lg|xl|2xl):/);
    });
  });

  it("tiles the stage actions two-up with 44px targets in a narrow card, and inline once the card has room", () => {
    const { container } = render(<ApprovalWorkflow workflow={baseWorkflow()} currentUserId="you" />);
    const group = container.querySelector<HTMLElement>('[aria-label="Stage actions"]');
    expect(group).not.toBeNull();
    const cls = String(group?.className);
    expect(cls).toMatch(/grid-cols-2/);
    expect(cls).toMatch(/@\[400px\]\/workflow:flex/);
    const approve = screen.getByRole("button", { name: /^Approve$/i });
    expect(String(approve.className)).toMatch(/min-h-\[44px\]/);
  });

  it("gives the title its own full-width line in a narrow card so it is never squeezed by the status pill", () => {
    const { container } = render(<ApprovalWorkflow workflow={baseWorkflow()} currentUserId="you" />);
    const heading = screen.getByRole("heading", { name: /Launch approval/ });
    const row = heading.parentElement?.parentElement;
    expect(String(row?.className)).toMatch(/flex-col/);
    expect(String(row?.className)).toMatch(/@\[400px\]\/workflow:flex-row/);
    expect(container).toBeTruthy();
  });
});
