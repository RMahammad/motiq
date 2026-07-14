import * as React from "react";
import { render, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CheckoutProgress,
  type CheckoutStep,
  type CheckoutStepContext,
} from "./checkout-progress";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

function seed(): CheckoutStep[] {
  return [
    { id: "contact", label: "Contact details", state: "current", editable: true },
    { id: "delivery", label: "Delivery window", state: "incomplete", editable: true },
    { id: "review", label: "Review & place", state: "incomplete", editable: true },
  ];
}

/** A minimal controlled host mirroring how an app would drive the component. */
function Harness({
  onNextSpy,
  onPrevSpy,
  onGoToSpy,
  saveGate,
  initial,
}: {
  onNextSpy?: (ctx: CheckoutStepContext, next?: CheckoutStep) => void;
  onPrevSpy?: (ctx: CheckoutStepContext, prev?: CheckoutStep) => void;
  onGoToSpy?: (ctx: CheckoutStepContext) => void;
  saveGate?: Promise<void>;
  initial?: CheckoutStep[];
}) {
  const [steps, setSteps] = React.useState<CheckoutStep[]>(initial ?? seed());
  const [currentStepId, setCurrentStepId] = React.useState(
    (initial ?? seed()).find((s) => s.state === "current")?.id ?? "contact",
  );

  const advance = (fromId: string, toId?: string) => {
    if (!toId) return;
    setSteps((prev) =>
      prev.map((s) =>
        s.id === fromId
          ? { ...s, state: "completed", errors: undefined }
          : s.id === toId
            ? { ...s, state: "current" }
            : s,
      ),
    );
    setCurrentStepId(toId);
  };

  const goBack = (fromId: string, toId?: string) => {
    if (!toId) return;
    setSteps((prev) =>
      prev.map((s) =>
        s.id === fromId ? { ...s, state: "incomplete" } : s.id === toId ? { ...s, state: "current" } : s,
      ),
    );
    setCurrentStepId(toId);
  };

  return (
    <CheckoutProgress
      steps={steps}
      currentStepId={currentStepId}
      showSaveStep
      onNext={(ctx, next) => {
        onNextSpy?.(ctx, next);
        advance(ctx.step.id, next?.id);
      }}
      onPrevious={(ctx, prev) => {
        onPrevSpy?.(ctx, prev);
        goBack(ctx.step.id, prev?.id);
      }}
      onGoToStep={(ctx) => {
        onGoToSpy?.(ctx);
        goBack(currentStepId, ctx.step.id);
      }}
      onSaveStep={async (ctx) => {
        if (saveGate) await saveGate;
        setSteps((prev) => prev.map((s) => (s.id === ctx.step.id ? { ...s, state: "completed" } : s)));
      }}
    />
  );
}

function activeLabel(): string {
  return document.querySelector('[aria-current="step"]')?.textContent ?? "";
}

describe("CheckoutProgress", () => {
  it("advances to the next step and returns to the previous one", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);

    expect(activeLabel()).toMatch(/Contact details/);
    await user.click(screen.getByRole("button", { name: /^Continue$/i }));
    await waitFor(() => expect(activeLabel()).toMatch(/Delivery window/));

    // Return to the previous step.
    await user.click(screen.getByRole("button", { name: /^Back$/i }));
    await waitFor(() => expect(activeLabel()).toMatch(/Contact details/));

    await noViolations(container);
  });

  it("fires controlled navigation callbacks with step context", async () => {
    const user = userEvent.setup();
    const onNextSpy = vi.fn();
    const onPrevSpy = vi.fn();
    render(<Harness onNextSpy={onNextSpy} onPrevSpy={onPrevSpy} />);

    await user.click(screen.getByRole("button", { name: /^Continue$/i }));
    expect(onNextSpy).toHaveBeenCalledTimes(1);
    expect(onNextSpy).toHaveBeenCalledWith(
      expect.objectContaining({ step: expect.objectContaining({ id: "contact" }), index: 0 }),
      expect.objectContaining({ id: "delivery" }),
    );

    await waitFor(() => expect(activeLabel()).toMatch(/Delivery window/));
    await user.click(screen.getByRole("button", { name: /^Back$/i }));
    expect(onPrevSpy).toHaveBeenCalledWith(
      expect.objectContaining({ step: expect.objectContaining({ id: "delivery" }) }),
      expect.objectContaining({ id: "contact" }),
    );
  });

  it("blocks advancing an invalid step and shows the error summary", async () => {
    const user = userEvent.setup();
    const onNextSpy = vi.fn();
    const steps = seed();
    steps[0] = {
      ...steps[0],
      state: "invalid",
      errors: [{ message: "Email address is required." }],
    };
    render(<Harness onNextSpy={onNextSpy} initial={steps} />);

    await user.click(screen.getByRole("button", { name: /^Continue$/i }));
    // Did not advance, callback not fired, error surfaced as text (not colour alone).
    expect(onNextSpy).not.toHaveBeenCalled();
    expect(activeLabel()).toMatch(/Contact details/);
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText(/Email address is required/i)).toBeTruthy();
  });

  it("surfaces a blocked-step reason and refuses to advance", async () => {
    const user = userEvent.setup();
    const onNextSpy = vi.fn();
    const steps = seed();
    steps[0] = {
      ...steps[0],
      state: "blocked",
      blockedReason: "No depot slots available for these dates.",
    };
    render(<Harness onNextSpy={onNextSpy} initial={steps} />);

    // Reason is shown in text (in the stepper and the active-step banner).
    expect(screen.getAllByText(/No depot slots available/i).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: /^Continue$/i }));
    expect(onNextSpy).not.toHaveBeenCalled();
    expect(activeLabel()).toMatch(/Contact details/);
  });

  it("runs an async step save: saving → completed", async () => {
    const user = userEvent.setup();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    render(<Harness saveGate={gate} />);

    await user.click(screen.getByRole("button", { name: /Save step/i }));
    // In-flight saving state is reflected.
    expect(await screen.findByText(/Saving…/i)).toBeTruthy();

    release();
    // App marks the step completed once the save settles.
    await waitFor(() => expect(screen.getAllByText(/Completed/i).length).toBeGreaterThan(0));
  });
});
