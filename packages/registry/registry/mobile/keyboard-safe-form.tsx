"use client";

/**
 * KeyboardSafeForm — a mobile form that stays usable while the on-screen
 * keyboard is open, and behaves like an ordinary form everywhere else.
 *
 * The hard part on mobile is that opening the virtual keyboard shrinks the
 * *visual* viewport without shrinking the *layout* viewport, so a normal
 * `position: fixed`/sticky footer ends up hidden behind the keyboard. This
 * component solves that with the **VisualViewport API when it exists** and
 * **degrades to a plain sticky footer when it doesn't** — it never depends on
 * an unsupported "virtual keyboard" API. When the keyboard overlaps the layout
 * viewport, the sticky action bar is lifted by exactly that overlap so Submit /
 * Cancel stay reachable, and the focused field is scrolled into view.
 *
 * It is presentation-only: the **app owns the fields and the submit work**
 * (passed as `children` + an `onSubmit` that returns a promise). The component
 * owns the *scaffolding* production forms always need:
 *
 *  - A validation summary (`errors`, or an inline `onValidate` on submit) that
 *    lists every error and links each one to its field by `fieldId`; activating
 *    an item moves focus to that field. Submit is blocked while errors remain.
 *  - Async submission via `useAsyncStatus`: idle → pending → success | error,
 *    with a cancellable in-flight state, a retry on failure, and a polite live
 *    region. Status is conveyed with icon + text, never colour alone.
 *  - An unsaved-changes guard: when `dirty`, cancelling (or leaving the page)
 *    asks before discarding.
 *
 * Accessibility & safety: labelled action buttons, `aria-live` status, focus
 * moved to the summary on invalid submit and restored after the discard dialog,
 * ≥44px targets, safe-area insets, 200%-zoom-safe layout, and a reduced-motion
 * path that drops every transition while keeping the exact same behaviour.
 * Clean-room original.
 */

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useAsyncStatus } from "@/lib/motionkit";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface FieldError {
  /** `id` of the field this error refers to — must match the input's `id`. */
  fieldId: string;
  /** Human label of the field, shown in the summary (e.g. "Email address"). */
  label: string;
  /** The error message shown in the summary. */
  message: string;
}

export interface KeyboardSafeFormProps {
  /** The app's own form fields (labelled inputs, selects, textareas…). */
  children: React.ReactNode;
  /**
   * Runs when the form is submitted and passes validation. Return a promise to
   * drive the loading → success / error states; throwing (or rejecting) shows
   * the error banner with a Retry control. The app owns the actual work.
   */
  onSubmit: () => Promise<void> | void;
  /**
   * App-controlled validation errors. When provided and non-empty, the summary
   * is shown and submit is blocked. Leave undefined to validate on submit with
   * `onValidate` instead.
   */
  errors?: FieldError[];
  /**
   * Inline validation run on submit — return the current errors (empty/undefined
   * means valid). Ignored when the controlled `errors` prop is provided.
   */
  onValidate?: () => FieldError[] | null | undefined;
  /** True when the form has unsaved edits — drives the discard guard. */
  dirty?: boolean;
  /** Cancel / discard handler (fired after the guard, if any). */
  onCancel?: () => void;
  /** Fired after a successful submit resolves. */
  onSubmitSuccess?: () => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  /** Heading of the validation summary. */
  summaryTitle?: string;
  /** Message shown when submit resolves. */
  successMessage?: string;
  /** Ask before discarding unsaved changes (default true). */
  confirmDiscard?: boolean;
  /**
   * Skip VisualViewport tracking and always use a plain sticky footer. Also the
   * automatic behaviour when the VisualViewport API is unavailable.
   */
  disableViewportTracking?: boolean;
  /** Force reduced-motion behaviour (defaults to the media query). */
  reducedMotion?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const EASE = [0.2, 0, 0, 1] as const;

const FIELD_SELECTOR = "input, select, textarea, [contenteditable=true]";

function isFormField(el: EventTarget | null): el is HTMLElement {
  return el instanceof HTMLElement && el.matches(FIELD_SELECTOR);
}

/** Read how many px the keyboard overlaps the layout viewport (0 when closed). */
function readKeyboardOverlap(): number {
  if (typeof window === "undefined") return 0;
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M12 8v5m0 3h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="m20 6-11 11-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className={cn("motion-safe:animate-spin", className)}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function KeyboardSafeForm({
  children,
  onSubmit,
  errors,
  onValidate,
  dirty = false,
  onCancel,
  onSubmitSuccess,
  title,
  description,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  summaryTitle = "Please fix the following",
  successMessage = "Saved",
  confirmDiscard = true,
  disableViewportTracking = false,
  reducedMotion,
  className,
}: KeyboardSafeFormProps) {
  const mqReduce = useReducedMotion();
  const reduce = reducedMotion ?? mqReduce;

  const async = useAsyncStatus("idle");
  const { status } = async;

  const controlled = errors !== undefined;
  const [validation, setValidation] = React.useState<FieldError[]>([]);
  const displayErrors = controlled ? (errors as FieldError[]) : validation;

  const [confirming, setConfirming] = React.useState(false);
  const [keyboardInset, setKeyboardInset] = React.useState(0);

  const formRef = React.useRef<HTMLFormElement | null>(null);
  const summaryRef = React.useRef<HTMLDivElement | null>(null);
  const cancelBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const keepEditingRef = React.useRef<HTMLButtonElement | null>(null);
  const titleId = React.useId();
  const summaryId = React.useId();

  const onSuccessRef = React.useRef(onSubmitSuccess);
  onSuccessRef.current = onSubmitSuccess;

  /* -- VisualViewport keyboard tracking (feature-detected, graceful fallback) */
  React.useEffect(() => {
    if (disableViewportTracking) return;
    const vv = typeof window !== "undefined" ? window.visualViewport : undefined;
    if (!vv) return; // No VisualViewport API → plain sticky footer (fallback).
    const update = () => setKeyboardInset(readKeyboardOverlap());
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [disableViewportTracking]);

  /* -- Keep the focused field visible above the keyboard. */
  const onFocusCapture = React.useCallback(
    (e: React.FocusEvent<HTMLFormElement>) => {
      if (!isFormField(e.target)) return;
      const field = e.target;
      // Defer so the visual viewport has settled after the keyboard animates in.
      window.setTimeout(() => {
        field.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      }, 60);
    },
    [reduce],
  );

  /* -- Reset a terminal (success/error) status once the user edits again. */
  const onInput = React.useCallback(() => {
    if (async.status === "success" || async.status === "error") async.reset();
  }, [async]);

  /* -- Warn on page unload while there are unsaved changes. */
  React.useEffect(() => {
    if (!dirty || typeof window === "undefined") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  /* -- Submit + validation ------------------------------------------------- */
  const submitCancelledRef = React.useRef(false);

  const runSubmit = React.useCallback(() => {
    submitCancelledRef.current = false;
    void async.run(async () => {
      await onSubmit();
      // A late-resolving submit that the user already cancelled must not
      // report success.
      if (!submitCancelledRef.current) onSuccessRef.current?.();
    });
  }, [async, onSubmit]);

  const cancelSubmit = React.useCallback(() => {
    submitCancelledRef.current = true;
    async.cancel();
  }, [async]);

  const handleSubmit = React.useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (async.status === "pending") return;
      let found: FieldError[];
      if (controlled) {
        found = (errors as FieldError[]) ?? [];
      } else {
        found = onValidate?.() ?? [];
        setValidation(found);
      }
      if (found.length > 0) return; // Focus moves to the summary via the effect below.
      runSubmit();
    },
    [async.status, controlled, errors, onValidate, runSubmit],
  );

  // Move focus to the summary the moment errors appear (0 → >0), so invalid
  // submits announce and land the user on the list. Re-focusing a field from a
  // summary link (errors unchanged) must not steal focus back.
  const prevErrorCount = React.useRef(0);
  React.useEffect(() => {
    if (displayErrors.length > 0 && prevErrorCount.current === 0) {
      summaryRef.current?.focus();
    }
    prevErrorCount.current = displayErrors.length;
  }, [displayErrors]);

  const focusField = React.useCallback((fieldId: string) => {
    const el = typeof document !== "undefined" ? (document.getElementById(fieldId) as HTMLElement | null) : null;
    el?.focus();
    el?.scrollIntoView({ block: "center" });
  }, []);

  /* -- Cancel / discard guard ---------------------------------------------- */
  const doCancel = React.useCallback(() => {
    setConfirming(false);
    onCancel?.();
  }, [onCancel]);

  const requestCancel = React.useCallback(() => {
    if (confirmDiscard && dirty) {
      setConfirming(true);
      return;
    }
    doCancel();
  }, [confirmDiscard, dirty, doCancel]);

  const dismissConfirm = React.useCallback(() => {
    setConfirming(false);
    requestAnimationFrame(() => cancelBtnRef.current?.focus());
  }, []);

  // Focus the safe default (Keep editing) when the discard dialog opens.
  React.useEffect(() => {
    if (confirming) requestAnimationFrame(() => keepEditingRef.current?.focus());
  }, [confirming]);

  const pending = status === "pending";
  const hasErrors = displayErrors.length > 0;

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      onFocusCapture={onFocusCapture}
      onInput={onInput}
      aria-labelledby={title ? titleId : undefined}
      className={cn(
        "relative flex min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      {/* Header */}
      {(title || description) && (
        <div className="shrink-0 border-b border-[var(--color-border)] px-4 pb-3 pt-4">
          {title ? (
            <h2 id={titleId} className="text-[16px] font-semibold text-[var(--color-fg)]">
              {title}
            </h2>
          ) : null}
          {description ? <p className="mt-0.5 text-[13px] text-[var(--color-muted)]">{description}</p> : null}
        </div>
      )}

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {/* Validation summary — links each error to its field. */}
        <AnimatePresence initial={false}>
          {hasErrors ? (
            <motion.div
              key="summary"
              ref={summaryRef}
              role="alert"
              tabIndex={-1}
              id={summaryId}
              initial={reduce ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: EASE }}
              className="mb-4 rounded-xl border px-3.5 py-3 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-error)]"
              style={{
                borderColor: "color-mix(in oklab, var(--color-error) 42%, var(--color-border))",
                background: "color-mix(in oklab, var(--color-error) 10%, transparent)",
              }}
            >
              <p className="flex items-center gap-2 text-[13.5px] font-semibold text-[var(--color-error)]">
                <AlertIcon className="shrink-0" />
                {summaryTitle}
              </p>
              <ul className="mt-2 space-y-1">
                {displayErrors.map((err) => (
                  <li key={err.fieldId} className="text-[13px] leading-snug">
                    <a
                      href={`#${err.fieldId}`}
                      onClick={(e) => {
                        e.preventDefault();
                        focusField(err.fieldId);
                      }}
                      className="font-medium text-[var(--color-error)] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-error)]"
                    >
                      <span className="text-[var(--color-fg)]">{err.label}:</span> {err.message}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* App-owned fields */}
        <div className="space-y-4">{children}</div>

        {/* Spacer so content can scroll clear of a lifted action bar. */}
        {keyboardInset > 0 ? <div aria-hidden style={{ height: keyboardInset }} /> : null}
      </div>

      {/* Sticky action bar — lifted above the keyboard when it overlaps. */}
      <div
        className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)]"
        style={{
          transform: keyboardInset > 0 ? `translateY(-${keyboardInset}px)` : undefined,
          transition: reduce ? undefined : "transform 0.18s cubic-bezier(0.2,0,0,1)",
        }}
      >
        {/* Status region: pending / error / success — icon + text, never colour alone. */}
        <div aria-live="polite" role="status" className="px-4">
          <AnimatePresence initial={false} mode="wait">
            {pending ? (
              <motion.div
                key="pending"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
                className="flex items-center gap-2 pt-3 text-[13px] text-[var(--color-muted)]"
              >
                <Spinner className="shrink-0 text-[var(--color-accent)]" />
                <span className="flex-1">Submitting…</span>
                <button
                  type="button"
                  onClick={cancelSubmit}
                  className="min-h-[36px] rounded-lg px-2 text-[13px] font-semibold text-[var(--color-accent)] underline underline-offset-2 hover:bg-[var(--color-bg-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                >
                  Cancel submission
                </button>
              </motion.div>
            ) : status === "error" ? (
              <motion.div
                key="error"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
                className="mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-[13px]"
                style={{
                  borderColor: "color-mix(in oklab, var(--color-error) 40%, var(--color-border))",
                  background: "color-mix(in oklab, var(--color-error) 10%, transparent)",
                  color: "var(--color-error)",
                }}
              >
                <AlertIcon className="mt-0.5 shrink-0" />
                <span className="flex-1">{async.error ?? "Something went wrong. Please try again."}</span>
                <button
                  type="button"
                  onClick={runSubmit}
                  className="min-h-[32px] shrink-0 rounded-md px-2 font-semibold underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-error)]"
                >
                  Retry
                </button>
              </motion.div>
            ) : status === "success" ? (
              <motion.div
                key="success"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
                className="mt-3 flex items-center gap-2 text-[13px] font-medium"
                style={{ color: "var(--color-success)" }}
              >
                <CheckIcon className="shrink-0" />
                <span>{successMessage}</span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Buttons */}
        <div
          className="flex items-center gap-2 px-4 pt-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={requestCancel}
            disabled={pending}
            className="min-h-[44px] rounded-lg border border-[var(--color-border)] px-4 text-[14px] font-medium text-[var(--color-fg)] hover:bg-[var(--color-bg-secondary)] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={pending}
            aria-describedby={hasErrors ? summaryId : undefined}
            className="ml-auto inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-accent)] px-5 text-[14px] font-semibold text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)] disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            {pending ? <Spinner className="shrink-0" /> : null}
            {pending ? "Submitting…" : submitLabel}
          </button>
        </div>
      </div>

      {/* Unsaved-changes discard guard */}
      <AnimatePresence>
        {confirming ? (
          <motion.div
            key="confirm"
            className="absolute inset-0 z-10 flex items-end justify-center bg-[color-mix(in_oklab,var(--color-fg)_35%,transparent)] p-4 sm:items-center"
            initial={reduce ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) dismissConfirm();
            }}
          >
            <div
              role="alertdialog"
              aria-labelledby={`${titleId}-discard`}
              aria-describedby={`${titleId}-discard-desc`}
              className="w-full max-w-[320px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-lg)]"
            >
              <h3 id={`${titleId}-discard`} className="text-[15px] font-semibold text-[var(--color-fg)]">
                Discard changes?
              </h3>
              <p id={`${titleId}-discard-desc`} className="mt-1 text-[13px] text-[var(--color-muted)]">
                You have unsaved changes. If you leave now they will be lost.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  ref={keepEditingRef}
                  type="button"
                  onClick={dismissConfirm}
                  className="min-h-[44px] rounded-lg border border-[var(--color-border)] px-3 text-[14px] font-medium text-[var(--color-fg)] hover:bg-[var(--color-bg-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                >
                  Keep editing
                </button>
                <button
                  type="button"
                  onClick={doCancel}
                  className="min-h-[44px] rounded-lg px-3 text-[14px] font-semibold text-[var(--color-error-foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-error)]"
                  style={{ background: "var(--color-error)" }}
                >
                  Discard changes
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}

export default KeyboardSafeForm;
