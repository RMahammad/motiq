"use client";

import * as React from "react";

import {
  CheckoutProgress,
  type CheckoutStep,
  type CheckoutState,
  type CheckoutStepContext,
} from "@/registry/commerce/checkout-progress";

/* Clearly fictional demo — an equipment-hire checkout for an imaginary outdoor
 * gear rental shop. No real people, addresses, prices, or payment. The demo
 * owns all state; the component only presents it and reports navigation back.
 * Deterministic: no timestamps or ids are minted during render. */

const CURRENCY = "£";

interface DemoStep extends CheckoutStep {
  /** The panel copy for this step (static, fictional). */
  panel: React.ReactNode;
}

function line(label: string, value: string) {
  return (
    <p className="flex items-baseline justify-between gap-4 text-[13px]">
      <span className="text-[var(--color-muted)]">{label}</span>
      <span className="font-medium text-[var(--color-fg)]">{value}</span>
    </p>
  );
}

function panelText(children: React.ReactNode) {
  return <div className="space-y-2 text-[13px] leading-relaxed text-[var(--color-fg)]">{children}</div>;
}

function initialSteps(): DemoStep[] {
  return [
    {
      id: "cart",
      label: "Hire cart",
      description: "The gear you’re booking for the trip.",
      state: "completed",
      editable: true,
      summary: "2 items · 4-day hire",
      panel: panelText(
        <>
          {line("Alpine tent (4-season)", `${CURRENCY}96.00`)}
          {line("Trekking pole pair", `${CURRENCY}18.00`)}
        </>,
      ),
    },
    {
      id: "contact",
      label: "Contact details",
      description: "Where we send booking updates.",
      state: "current",
      editable: true,
      panel: panelText(
        <>
          {line("Name", "Sam Rivera (fictional)")}
          {line("Email", "sam@example.test")}
        </>,
      ),
    },
    {
      id: "delivery",
      label: "Delivery window",
      description: "Pick the depot handover slot.",
      state: "incomplete",
      editable: true,
      panel: panelText(
        <>
          {line("Method", "Depot pickup — Riverside")}
          {line("Window", "Fri, 09:00–11:00")}
        </>,
      ),
    },
    {
      id: "billing",
      label: "Billing address",
      state: "incomplete",
      editable: true,
      optional: true,
      panel: panelText(<>{line("Address", "Same as contact (fictional)")}</>),
    },
    {
      id: "payment",
      label: "Payment method",
      description: "Your card field lives here — this component never sees it.",
      state: "incomplete",
      editable: true,
      panel: panelText(
        <p className="rounded-lg border border-dashed border-[var(--color-border)] px-3 py-2 text-[12.5px] text-[var(--color-muted)]">
          [ app-owned payment element renders here ]
        </p>,
      ),
    },
    {
      id: "review",
      label: "Review & place",
      description: "Confirm everything before booking.",
      state: "incomplete",
      editable: true,
      panel: panelText(
        <>
          {line("Deposit (refundable)", `${CURRENCY}50.00`)}
          {line("Total due today", `${CURRENCY}164.00`)}
        </>,
      ),
    },
  ];
}

const control =
  "rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

export function CheckoutProgressPreview() {
  const [steps, setSteps] = React.useState<DemoStep[]>(initialSteps);
  const [currentStepId, setCurrentStepId] = React.useState("contact");
  const [state, setState] = React.useState<CheckoutState>("editing");

  const idx = steps.findIndex((s) => s.id === currentStepId);
  const current = steps[idx];

  const setStepState = (id: string, patch: Partial<DemoStep>) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  // Advance: mark the leaving step completed, make the next one current.
  const handleNext = (ctx: CheckoutStepContext, next?: CheckoutStep) => {
    if (!next) return;
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id === ctx.step.id) return { ...s, state: "completed", errors: undefined };
        if (s.id === next.id) return { ...s, state: "current" };
        return s;
      }),
    );
    setCurrentStepId(next.id);
  };

  const handlePrevious = (ctx: CheckoutStepContext, previous?: CheckoutStep) => {
    if (!previous) return;
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id === ctx.step.id) return { ...s, state: "incomplete" };
        if (s.id === previous.id) return { ...s, state: "current" };
        return s;
      }),
    );
    setCurrentStepId(previous.id);
  };

  const handleGoToStep = (ctx: CheckoutStepContext) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id === currentStepId) return { ...s, state: "incomplete" };
        if (s.id === ctx.step.id) return { ...s, state: "current" };
        return s;
      }),
    );
    setCurrentStepId(ctx.step.id);
  };

  // Async step save — the app "persists" then marks the step completed. A
  // deterministic microtask stand-in (no artificial delay / fake progress).
  const handleSaveStep = async (ctx: CheckoutStepContext) => {
    await Promise.resolve();
    setStepState(ctx.step.id, { state: "completed", errors: undefined });
  };

  /* -- demo controls ------------------------------------------------------ */

  const markInvalid = () => {
    if (!current) return;
    setStepState(current.id, {
      state: "invalid",
      errors: [
        { fieldId: `${current.id}-1`, message: "This field is required." },
        { fieldId: `${current.id}-2`, message: "Enter a valid value to continue." },
      ],
    });
  };

  const blockDelivery = () =>
    setStepState("delivery", {
      state: "blocked",
      blockedReason: "No depot slots are available for these dates — choose different hire dates.",
    });

  const reset = () => {
    setSteps(initialSteps());
    setCurrentStepId("contact");
    setState("editing");
  };

  const orderSummary = (
    <div className="space-y-3">
      <p className="text-[13px] font-semibold text-[var(--color-fg)]">Order summary</p>
      <div className="space-y-1.5">
        {line("Gear hire (4 days)", `${CURRENCY}114.00`)}
        {line("Refundable deposit", `${CURRENCY}50.00`)}
        {line("Delivery", `${CURRENCY}0.00`)}
      </div>
      <div className="border-t border-[var(--color-border)] pt-2">
        {line("Due today", `${CURRENCY}164.00`)}
      </div>
      <p className="text-[11.5px] leading-relaxed text-[var(--color-muted)]">
        Fictional figures. This slot is app-owned — CheckoutProgress never prices or charges anything.
      </p>
    </div>
  );

  return (
    <div className="flex w-full max-w-[820px] flex-col gap-4">
      <CheckoutProgress
        steps={steps}
        currentStepId={currentStepId}
        state={state}
        mode="guest"
        showSaveStep
        submitLabel="Place booking"
        orderSummary={orderSummary}
        renderStep={(ctx) => (steps.find((s) => s.id === ctx.step.id) as DemoStep | undefined)?.panel ?? null}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onGoToStep={handleGoToStep}
        onSaveStep={handleSaveStep}
        onSubmit={() => setState("submitting")}
        onRetry={() => setState("submitting")}
      />

      {/* working controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button
          type="button"
          className={control}
          onClick={() => current && handleNext({ step: current, index: idx, steps }, steps[idx + 1])}
          disabled={!current || idx >= steps.length - 1 || state !== "editing"}
        >
          Next
        </button>
        <button
          type="button"
          className={control}
          onClick={() => current && handlePrevious({ step: current, index: idx, steps }, steps[idx - 1])}
          disabled={!current || idx <= 0 || state !== "editing"}
        >
          Previous
        </button>
        <button type="button" className={control} onClick={markInvalid} disabled={!current || state !== "editing"}>
          Mark invalid
        </button>
        <button
          type="button"
          className={control}
          onClick={() => current && handleSaveStep({ step: current, index: idx, steps })}
          disabled={!current || state !== "editing"}
        >
          Save step
        </button>
        <button type="button" className={control} onClick={blockDelivery} disabled={state !== "editing"}>
          Block delivery
        </button>
        <button type="button" className={control} onClick={() => setState("processing")}>
          Process payment
        </button>
        <button type="button" className={control} onClick={() => setState("failed")}>
          Fail
        </button>
        <button type="button" className={control} onClick={() => setState("completed")}>
          Complete
        </button>
        <button type="button" className={control} onClick={reset}>
          Reset
        </button>
        <span className="ml-auto text-[12px] text-[var(--color-muted)]">Fictional demo data</span>
      </div>
    </div>
  );
}

export default CheckoutProgressPreview;
