"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useAsyncStatus,
  statusVars,
  type StatusTone,
} from "@/lib/motiq";

/* --------------------------------------------------------------------------
 * CheckoutProgress — a presentation + orchestration surface for an app-owned,
 * multi-STEP checkout flow (Cart → Customer details → Delivery → Billing →
 * Payment → Review → Confirmation, or whatever steps the app defines). It shows
 * where the shopper is, which steps are done and editable, which step needs
 * attention, and drives navigation between steps.
 *
 * It is NOT a payment processor, a cart, or a full checkout page: it never
 * collects card data, prices an order, charges anything, or talks to a payment
 * provider. The host application owns every fact — the steps, their validity,
 * blocked reasons, the order summary, and the actual save/submit work — and
 * hands them in. The "Payment" step here is just another step whose completion
 * the app reports; a real card field / payment element is the app's own
 * `children` for that step, rendered through `renderStep`.
 *
 * What earns its keep over a row of numbered circles: editable completed steps
 * (jump back to change an earlier answer), per-step validation with an error
 * summary that links to the offending step, an app-owned blocked-step reason, an
 * honest async "saving" state for a step (no fabricated progress bar), a
 * checkout-level lifecycle (editing → validating → submitting → processing →
 * completed | failed | cancelled), a sticky order-summary integration slot, a
 * mobile compact summary, and fully controlled navigation callbacks.
 *
 * Accessibility: an ordered <ol> of steps with `aria-current="step"` on the
 * active one; status is always conveyed by icon + text, never colour alone;
 * blocked/invalid reasons are exposed to assistive tech; an error summary
 * receives focus on an invalid advance; focus moves to the active step's
 * heading after every step change; Previous/Next/Save are real keyboard-operable
 * <button>s; ≥44px touch targets; a polite live region announces transitions;
 * and under prefers-reduced-motion every transition renders in its final state.
 * Clean-room original.
 * ----------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

/** Per-step lifecycle. The app owns which state a step is in. */
export type StepState =
  | "incomplete"
  | "current"
  | "valid"
  | "invalid"
  | "saving"
  | "completed"
  | "blocked"
  | "skipped";

/** Checkout-level lifecycle, independent of any single step. */
export type CheckoutState =
  | "editing"
  | "validating"
  | "submitting"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

/** Shopper context — some flows differ for guests vs. signed-in accounts. */
export type CheckoutMode = "guest" | "account";

/** A single validation problem on a step. */
export interface StepError {
  /** Optional id of the field this refers to (for the app to focus). */
  fieldId?: string;
  message: string;
}

export interface CheckoutStep {
  /** Stable id — drives keys, the `currentStepId` pointer, and callbacks. */
  id: string;
  /** Human label, e.g. "Delivery". Also the step's accessible name. */
  label: string;
  /** Optional supporting line shown under the label on the active step. */
  description?: string;
  /** App-owned per-step state. Defaults to "incomplete". */
  state?: StepState;
  /**
   * Short summary shown once the step is completed, e.g. an address or the
   * chosen delivery option — so the shopper can review without reopening it.
   */
  summary?: string;
  /**
   * Whether a completed step can be revisited/edited by jumping back to it.
   * Defaults to true. Set false for steps that must not change after passing
   * (e.g. an accepted legal agreement).
   */
  editable?: boolean;
  /** Optional steps do not count toward required progress and can be skipped. */
  optional?: boolean;
  /** App-owned reason a step is blocked (shown verbatim, never colour alone). */
  blockedReason?: string;
  /** Validation errors for the step; presence drives the invalid treatment. */
  errors?: StepError[];
  /** The step's own fields/content, rendered in the active panel. */
  content?: React.ReactNode;
}

/** Passed to navigation + lifecycle callbacks. */
export interface CheckoutStepContext {
  step: CheckoutStep;
  index: number;
  steps: CheckoutStep[];
}

export interface CheckoutProgressProps {
  /** The app-owned, ordered steps. */
  steps: CheckoutStep[];
  /**
   * Which step is active. Controlled — the app updates it in the navigation
   * callbacks. Defaults to the first step whose state is "current", else the
   * first step that is not completed/skipped.
   */
  currentStepId?: string;
  /** Checkout-level lifecycle state. Defaults to "editing". */
  state?: CheckoutState;
  /** Guest vs. account flow (surfaced as a small badge). */
  mode?: CheckoutMode;
  /**
   * Sticky order-summary slot. The app renders line items / totals here; this
   * component never prices anything. Rendered beside the steps on wide screens
   * and below them on mobile.
   */
  orderSummary?: React.ReactNode;
  /** Custom renderer for a step's active-panel body (overrides `content`). */
  renderStep?: (context: CheckoutStepContext) => React.ReactNode;
  /** Advance to the next step. The app updates `currentStepId`. */
  onNext?: (context: CheckoutStepContext, next?: CheckoutStep) => void;
  /** Return to the previous step. */
  onPrevious?: (context: CheckoutStepContext, previous?: CheckoutStep) => void;
  /** Jump directly to an earlier editable step (or any allowed step). */
  onGoToStep?: (context: CheckoutStepContext) => void;
  /**
   * Save the current step's data. Return a promise to drive the "saving" →
   * done transition; while pending the Save control shows a saving state. The
   * app owns the actual persistence and marks the step completed on success.
   */
  onSaveStep?: (context: CheckoutStepContext) => Promise<void> | void;
  /**
   * Submit the order from the final step. This hands off to the app (which may
   * then move `state` to "submitting"/"processing"); it does NOT collect or
   * charge payment here.
   */
  onSubmit?: (context: CheckoutStepContext) => void;
  /** Retry after a failed submit. Falls back to `onSubmit` when omitted. */
  onRetry?: (context: CheckoutStepContext) => void;
  /** Label for the primary advance button on non-final steps. Default "Continue". */
  continueLabel?: string;
  /** Label for the final submit button. Default "Place order". */
  submitLabel?: string;
  /** Show a Save control on the active step (needs `onSaveStep`). Default false. */
  showSaveStep?: boolean;
  /** Accessible label for the whole region. */
  label?: string;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Status metadata                                                             */
/* -------------------------------------------------------------------------- */

const STEP_META: Record<StepState, { label: string; tone: StatusTone }> = {
  incomplete: { label: "Not started", tone: "neutral" },
  current: { label: "In progress", tone: "active" },
  valid: { label: "Ready", tone: "success" },
  invalid: { label: "Needs attention", tone: "error" },
  saving: { label: "Saving", tone: "active" },
  completed: { label: "Completed", tone: "success" },
  blocked: { label: "Blocked", tone: "warning" },
  skipped: { label: "Skipped", tone: "neutral" },
};

const CHECKOUT_META: Record<CheckoutState, { label: string; tone: StatusTone }> = {
  editing: { label: "In progress", tone: "active" },
  validating: { label: "Checking details", tone: "active" },
  submitting: { label: "Submitting order", tone: "active" },
  processing: { label: "Processing", tone: "active" },
  completed: { label: "Order confirmed", tone: "success" },
  failed: { label: "Order failed", tone: "error" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

const EASE: Transition["ease"] = [0.2, 0, 0, 1];

const P = (d: string) => (
  <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
);

/** Icon per tone — status is never conveyed by colour alone. */
function ToneIcon({ tone, size = 13 }: { tone: StatusTone; size?: number }) {
  const paths: Record<StatusTone, React.ReactNode> = {
    success: P("M4 12.5 9 17.5 20 6.5"),
    error: P("M6 6l12 12M18 6 6 18"),
    warning: P("M12 8v5M12 17h.01M10.3 4.3 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z"),
    info: P("M12 8h.01M11 12h1v5h1M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"),
    active: P("M12 3a9 9 0 1 0 9 9M12 7v5l3 2"),
    neutral: P("M5 12h14"),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {paths[tone]}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Derivations                                                                 */
/* -------------------------------------------------------------------------- */

const COMPLETED_STATES: ReadonlySet<StepState> = new Set(["completed", "skipped"]);
const TERMINAL_CHECKOUT: ReadonlySet<CheckoutState> = new Set([
  "completed",
  "cancelled",
]);

function stepState(step: CheckoutStep): StepState {
  return step.state ?? "incomplete";
}

/** The active step: explicit `current` state, else first not-yet-done step. */
function resolveCurrentStepId(steps: CheckoutStep[], currentStepId?: string): string | undefined {
  if (currentStepId && steps.some((s) => s.id === currentStepId)) return currentStepId;
  const explicit = steps.find((s) => stepState(s) === "current");
  if (explicit) return explicit.id;
  const next = steps.find((s) => !COMPLETED_STATES.has(stepState(s)));
  return next?.id ?? steps[steps.length - 1]?.id;
}

/** A completed, editable step can be revisited. */
function isRevisitable(step: CheckoutStep): boolean {
  return stepState(step) === "completed" && step.editable !== false;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export function CheckoutProgress({
  steps,
  currentStepId,
  state = "editing",
  mode,
  orderSummary,
  renderStep,
  onNext,
  onPrevious,
  onGoToStep,
  onSaveStep,
  onSubmit,
  onRetry,
  continueLabel = "Continue",
  submitLabel = "Place order",
  showSaveStep = false,
  label,
  className,
}: CheckoutProgressProps) {
  const reduce = useReducedMotion();
  const save = useAsyncStatus();

  const [announce, setAnnounce] = React.useState("");
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [showErrors, setShowErrors] = React.useState(false);

  const statusRef = React.useRef<HTMLDivElement | null>(null);
  const panelHeadingRef = React.useRef<HTMLHeadingElement | null>(null);
  const errorSummaryRef = React.useRef<HTMLDivElement | null>(null);
  const prevStepIdRef = React.useRef<string | undefined>(undefined);

  const activeId = resolveCurrentStepId(steps, currentStepId);
  const activeIndex = steps.findIndex((s) => s.id === activeId);
  const activeStep = activeIndex >= 0 ? steps[activeIndex] : undefined;

  const isTerminal = TERMINAL_CHECKOUT.has(state);
  const isBusy = state === "submitting" || state === "processing" || state === "validating";
  const isLast = activeIndex === steps.length - 1;

  const completedCount = steps.filter((s) => COMPLETED_STATES.has(stepState(s))).length;
  const requiredCount = steps.filter((s) => !s.optional).length;

  const activeState = activeStep ? stepState(activeStep) : "incomplete";
  const activeSaving =
    activeState === "saving" || (save.status === "pending" && savingId === activeId);
  const activeErrors = activeStep?.errors ?? [];
  const hasErrors = activeState === "invalid" || activeErrors.length > 0;
  const isBlocked = activeState === "blocked";

  const ctx: CheckoutStepContext | undefined = activeStep
    ? { step: activeStep, index: activeIndex, steps }
    : undefined;

  const checkoutMeta = CHECKOUT_META[state];

  /* -- announcements + focus movement ------------------------------------- */

  const toStatus = React.useCallback((message: string) => {
    setAnnounce(message);
  }, []);

  // Move focus to the active step's heading after a step change (not on mount).
  React.useEffect(() => {
    const prev = prevStepIdRef.current;
    if (prev !== undefined && prev !== activeId) {
      requestAnimationFrame(() => panelHeadingRef.current?.focus());
    }
    prevStepIdRef.current = activeId;
  }, [activeId]);

  // Clear the "show errors" flag whenever we land on a fresh valid step.
  React.useEffect(() => {
    if (!hasErrors) setShowErrors(false);
  }, [activeId, hasErrors]);

  /* -- handlers ----------------------------------------------------------- */

  const focusErrorSummary = React.useCallback(() => {
    setShowErrors(true);
    requestAnimationFrame(() => errorSummaryRef.current?.focus());
  }, []);

  const handleNext = () => {
    if (!ctx || isTerminal || isBusy) return;
    if (isBlocked) {
      toStatus(activeStep?.blockedReason ?? "This step is blocked.");
      return;
    }
    if (hasErrors) {
      focusErrorSummary();
      toStatus(`${activeStep?.label ?? "This step"} has ${activeErrors.length || 1} item(s) to fix.`);
      return;
    }
    const next = steps[activeIndex + 1];
    onNext?.(ctx, next);
    if (next) toStatus(`Moved to ${next.label}.`);
  };

  const handlePrevious = () => {
    if (!ctx || isTerminal || isBusy || activeIndex <= 0) return;
    const previous = steps[activeIndex - 1];
    onPrevious?.(ctx, previous);
    if (previous) toStatus(`Returned to ${previous.label}.`);
  };

  const handleGoToStep = (step: CheckoutStep, index: number) => {
    if (isTerminal || isBusy || step.id === activeId) return;
    if (stepState(step) === "blocked") {
      toStatus(step.blockedReason ?? `${step.label} is blocked.`);
      return;
    }
    if (!isRevisitable(step)) return;
    onGoToStep?.({ step, index, steps });
    toStatus(`Editing ${step.label}.`);
  };

  const handleSave = () => {
    if (!ctx || !onSaveStep || isBlocked || activeSaving) return;
    setSavingId(activeStep!.id);
    save.reset();
    void save.run(async () => {
      await onSaveStep(ctx);
    });
    // A polite note; the app reports the completed state, we reflect saving.
    toStatus(`Saving ${activeStep?.label ?? "step"}…`);
  };

  // Clear the saving pointer once the async save settles + announce the result.
  React.useEffect(() => {
    if (savingId == null) return;
    if (save.status === "success") {
      toStatus("Step saved.");
      setSavingId(null);
      save.reset();
    } else if (save.status === "error") {
      toStatus(save.error ? `Save failed: ${save.error}` : "Save failed.");
      setSavingId(null);
    }
  }, [save.status, save.error, savingId, save, toStatus]);

  const handleSubmit = () => {
    if (!ctx || isTerminal || isBusy) return;
    if (isBlocked) {
      toStatus(activeStep?.blockedReason ?? "This step is blocked.");
      return;
    }
    if (hasErrors) {
      focusErrorSummary();
      return;
    }
    onSubmit?.(ctx);
    toStatus("Order submitted.");
  };

  const handleRetry = () => {
    if (!ctx) return;
    (onRetry ?? onSubmit)?.(ctx);
    toStatus("Retrying order submission.");
  };

  const regionLabel = label ?? "Checkout progress";
  const progressPct = (completedCount / Math.max(1, requiredCount)) * 100;

  /* -- render ------------------------------------------------------------- */

  return (
    <section
      aria-label={regionLabel}
      className={cn(
        "flex w-full flex-col gap-4 lg:flex-row lg:items-start",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
        {/* header: checkout status + progress */}
        <header className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="mr-auto text-[15px] font-semibold leading-snug text-[var(--color-fg)]">
              Checkout
            </h3>
            {mode ? (
              <span className="inline-flex items-center rounded-full bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[11px] font-medium capitalize text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
                {mode === "guest" ? "Guest checkout" : "Signed in"}
              </span>
            ) : null}
            <StatusPill tone={checkoutMeta.tone} label={checkoutMeta.label} pulse={isBusy && !reduce} />
          </div>

          {/* progress summary — text + bar, never bar alone */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium tabular-nums text-[var(--color-muted)]">
              Step {Math.min(activeIndex + 1, steps.length)} of {steps.length}
            </span>
            <div
              className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-bg-secondary)]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={requiredCount}
              aria-valuenow={completedCount}
              aria-label="Required steps completed"
            >
              <motion.span
                className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-success)]"
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
              />
            </div>
            <span className="text-[11px] font-medium tabular-nums text-[var(--color-muted)]">
              {completedCount}/{requiredCount} done
            </span>
          </div>

          {/* mobile compact summary of the active step (stepper hidden on mobile) */}
          {activeStep ? (
            <p className="flex items-center gap-1.5 text-[12.5px] text-[var(--color-muted)] sm:hidden">
              <ToneIcon tone={STEP_META[activeState].tone} />
              <span className="font-medium text-[var(--color-fg)]">{activeStep.label}</span>
              <span aria-hidden>·</span>
              <span>{STEP_META[activeState].label}</span>
            </p>
          ) : null}
        </header>

        {/* stepper (sm+) */}
        <ol role="list" className="hidden flex-col px-3 py-3 sm:flex sm:px-4">
          {steps.map((step, i) => (
            <StepRow
              key={step.id}
              step={step}
              index={i}
              isLast={i === steps.length - 1}
              isActive={step.id === activeId}
              activeSaving={activeSaving && step.id === activeId}
              reduce={reduce}
              disabled={isTerminal || isBusy}
              onGoTo={() => handleGoToStep(step, i)}
            />
          ))}
        </ol>

        {/* active step panel */}
        {activeStep && !isTerminal ? (
          <div className="border-t border-[var(--color-border)] px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <h4
                ref={panelHeadingRef}
                tabIndex={-1}
                className="text-[14px] font-semibold text-[var(--color-fg)] outline-none"
              >
                {activeStep.label}
              </h4>
              <StatusPill tone={STEP_META[activeState].tone} label={STEP_META[activeState].label} size="sm" />
              {activeStep.optional ? (
                <span className="rounded bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
                  Optional
                </span>
              ) : null}
            </div>
            {activeStep.description ? (
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-muted)]">
                {activeStep.description}
              </p>
            ) : null}

            {/* blocked reason (app-owned, verbatim) */}
            {isBlocked && activeStep.blockedReason ? (
              <div
                role="status"
                className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-[13px]"
                style={{ background: statusVars("warning").bg, border: `1px solid ${statusVars("warning").border}` }}
              >
                <span style={{ color: statusVars("warning").color }} className="mt-px shrink-0">
                  <ToneIcon tone="warning" />
                </span>
                <span className="text-[var(--color-fg)]">
                  <span className="font-semibold">Blocked:</span> {activeStep.blockedReason}
                </span>
              </div>
            ) : null}

            {/* error summary — focus target on invalid advance */}
            <AnimatePresence initial={false}>
              {hasErrors && showErrors ? (
                <motion.div
                  key="errors"
                  ref={errorSummaryRef}
                  tabIndex={-1}
                  role="alert"
                  aria-label={`${activeStep.label} has errors`}
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
                  className="mt-3 overflow-hidden rounded-lg outline-none"
                  style={{ background: statusVars("error").bg, border: `1px solid ${statusVars("error").border}` }}
                >
                  <div className="px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: statusVars("error").color }}>
                      <ToneIcon tone="error" /> Fix the following to continue
                    </p>
                    {activeErrors.length > 0 ? (
                      <ul role="list" className="mt-1.5 space-y-1 pl-5">
                        {activeErrors.map((e, i) => (
                          <li key={e.fieldId ?? i} className="list-disc text-[12.5px] text-[var(--color-fg)]">
                            {e.message}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-[12.5px] text-[var(--color-fg)]">
                        This step needs attention before you can continue.
                      </p>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* the step's own fields, animated in on step change */}
            {renderStep || activeStep.content ? (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeStep.id}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
                  className="mt-3"
                >
                  {renderStep ? renderStep(ctx!) : activeStep.content}
                </motion.div>
              </AnimatePresence>
            ) : null}

            {/* action bar */}
            <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Checkout navigation">
              {activeIndex > 0 ? (
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={isBusy}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>{P("m15 6-6 6 6 6")}</svg>
                  Back
                </button>
              ) : null}

              {showSaveStep && onSaveStep ? (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isBusy || activeSaving || isBlocked}
                  aria-busy={activeSaving}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {activeSaving ? (
                    <>
                      <Spinner reduce={reduce} /> Saving…
                    </>
                  ) : (
                    "Save step"
                  )}
                </button>
              ) : null}

              <span className="ml-auto flex items-center gap-2">
                {isLast ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isBusy || isBlocked}
                    aria-busy={isBusy}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold text-[var(--color-accent-foreground,white)] outline-none transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45"
                    style={{ background: "var(--color-accent)" }}
                  >
                    {isBusy ? <Spinner reduce={reduce} /> : <ToneIcon tone="success" />}
                    {isBusy ? CHECKOUT_META[state].label : submitLabel}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isBusy}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold text-[var(--color-accent-foreground,white)] outline-none transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45"
                    style={{ background: "var(--color-accent)" }}
                    aria-describedby={isBlocked ? `${activeStep.id}-blocked` : undefined}
                  >
                    {continueLabel}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>{P("m9 6 6 6-6 6")}</svg>
                  </button>
                )}
              </span>
            </div>
            {isBlocked ? (
              <span id={`${activeStep.id}-blocked`} className="sr-only">
                {activeStep.blockedReason ?? "This step is blocked."}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* terminal states — confirmation / failure / cancelled */}
        {isTerminal || state === "failed" ? (
          <div className="border-t border-[var(--color-border)] px-4 py-4 sm:px-5">
            {state === "completed" ? (
              <div className="flex items-start gap-3">
                <span className="mt-px shrink-0" style={{ color: statusVars("success").color }}>
                  <ToneIcon tone="success" size={20} />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-[var(--color-fg)]">Order confirmed</p>
                  <p className="mt-0.5 text-[12.5px] text-[var(--color-muted)]">
                    Every step is complete. Your order has been placed.
                  </p>
                </div>
              </div>
            ) : state === "cancelled" ? (
              <div className="flex items-start gap-3">
                <span className="mt-px shrink-0 text-[var(--color-muted)]">
                  <ToneIcon tone="neutral" size={20} />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-[var(--color-fg)]">Checkout cancelled</p>
                  <p className="mt-0.5 text-[12.5px] text-[var(--color-muted)]">
                    This checkout was cancelled. No order was placed.
                  </p>
                </div>
              </div>
            ) : (
              <div
                role="alert"
                className="flex flex-wrap items-start gap-3 rounded-lg px-3 py-3"
                style={{ background: statusVars("error").bg, border: `1px solid ${statusVars("error").border}` }}
              >
                <span className="mt-px shrink-0" style={{ color: statusVars("error").color }}>
                  <ToneIcon tone="error" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-[var(--color-fg)]">We couldn’t complete your order</p>
                  <p className="mt-0.5 text-[12.5px] text-[var(--color-muted)]">
                    Nothing was charged. You can try submitting again.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex min-h-[40px] items-center rounded-lg px-3 py-2 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  style={{ color: statusVars("error").color, background: statusVars("error").bg, border: `1px solid ${statusVars("error").border}` }}
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* polite live region */}
        <div
          ref={statusRef}
          role="status"
          aria-live="polite"
          className="sr-only"
          style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}
        >
          {announce}
        </div>
      </div>

      {/* sticky order-summary integration slot (app-owned content) */}
      {orderSummary ? (
        <aside
          aria-label="Order summary"
          className="w-full shrink-0 self-stretch rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 lg:sticky lg:top-4 lg:w-[320px]"
        >
          {orderSummary}
        </aside>
      ) : null}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function StatusPill({
  tone,
  label,
  size = "md",
  pulse = false,
}: {
  tone: StatusTone;
  label: string;
  size?: "sm" | "md";
  pulse?: boolean;
}) {
  const v = statusVars(tone);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold [border:1px_solid]",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]",
      )}
      style={{ color: v.color, background: v.bg, borderColor: v.border }}
    >
      {pulse ? (
        <motion.span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: v.color }}
          animate={{ opacity: [1, 0.35, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
      ) : (
        <ToneIcon tone={tone} size={size === "sm" ? 11 : 13} />
      )}
      {label}
    </span>
  );
}

function Spinner({ reduce }: { reduce: boolean }) {
  return (
    <motion.svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      animate={reduce ? undefined : { rotate: 360 }}
      transition={reduce ? undefined : { duration: 0.9, repeat: Infinity, ease: "linear" }}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </motion.svg>
  );
}

function StepRow({
  step,
  index,
  isLast,
  isActive,
  activeSaving,
  reduce,
  disabled,
  onGoTo,
}: {
  step: CheckoutStep;
  index: number;
  isLast: boolean;
  isActive: boolean;
  activeSaving: boolean;
  reduce: boolean;
  disabled: boolean;
  onGoTo: () => void;
}) {
  const rawState = stepState(step);
  const displayState: StepState = activeSaving ? "saving" : rawState;
  const meta = STEP_META[displayState];
  const done = COMPLETED_STATES.has(rawState);
  const revisitable = isRevisitable(step) && !disabled;
  const nodeTone: StatusTone = isActive ? "active" : meta.tone;

  const node = (
    <span className="flex flex-col items-center">
      <span
        className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold tabular-nums [border:2px_solid]"
        style={{ color: statusVars(nodeTone).color, background: statusVars(nodeTone).bg, borderColor: statusVars(nodeTone).border }}
        aria-hidden
      >
        {displayState === "saving" ? (
          <Spinner reduce={reduce} />
        ) : done && rawState === "completed" ? (
          <ToneIcon tone="success" size={14} />
        ) : rawState === "invalid" ? (
          <ToneIcon tone="error" size={13} />
        ) : rawState === "blocked" ? (
          <ToneIcon tone="warning" size={13} />
        ) : rawState === "skipped" ? (
          <ToneIcon tone="neutral" size={13} />
        ) : (
          index + 1
        )}
      </span>
      {!isLast ? (
        <span
          className="w-0.5 flex-1"
          style={{ minHeight: 16, background: rawState === "completed" ? "var(--color-success)" : "var(--color-border)" }}
          aria-hidden
        />
      ) : null}
    </span>
  );

  const body = (
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className={cn("text-[13.5px] text-[var(--color-fg)]", isActive ? "font-semibold" : "font-medium")}>
          {step.label}
        </span>
        <StatusPill tone={meta.tone} label={meta.label} size="sm" />
        {step.optional ? (
          <span className="rounded bg-[var(--color-bg-secondary)] px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
            Optional
          </span>
        ) : null}
        {revisitable ? (
          <span className="text-[11.5px] font-medium text-[var(--color-accent)]">Edit</span>
        ) : null}
      </span>
      {done && step.summary ? (
        <span className="mt-0.5 block truncate text-[12px] text-[var(--color-muted)]">{step.summary}</span>
      ) : null}
      {rawState === "blocked" && step.blockedReason ? (
        <span className="mt-0.5 block text-[12px]" style={{ color: statusVars("warning").color }}>
          {step.blockedReason}
        </span>
      ) : null}
    </span>
  );

  return (
    <li className="relative flex gap-3" aria-current={isActive ? "step" : undefined}>
      {node}
      <span className={cn("flex min-w-0 flex-1 items-start", isLast ? "pb-1" : "pb-4")}>
        {revisitable ? (
          <button
            type="button"
            onClick={onGoTo}
            className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left outline-none transition-colors hover:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            {body}
          </button>
        ) : (
          <span className="flex w-full items-start gap-2 px-2 py-1.5">{body}</span>
        )}
      </span>
    </li>
  );
}

export default CheckoutProgress;
