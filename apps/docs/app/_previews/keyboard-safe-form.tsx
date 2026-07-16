"use client";

import * as React from "react";

import { KeyboardSafeForm, type FieldError } from "@/registry/mobile/keyboard-safe-form";

/* ---------------------------------------------------------------- demo state */
/* A fictional "Add payee" form. The app owns every field and the submission —
 * "submitting" is a local setTimeout that resolves in place. Nothing is sent
 * anywhere; there is no network, no secrets, no real account. Deterministic:
 * no Date.now()/Math.random() during render. */

interface FormState {
  recipient: string;
  reference: string;
  amount: string;
  note: string;
}

const EMPTY: FormState = { recipient: "", reference: "", amount: "", note: "" };

function fieldId(key: keyof FormState): string {
  return `ksf-${key}`;
}

function validate(state: FormState): FieldError[] {
  const errors: FieldError[] = [];
  if (!state.recipient.trim()) {
    errors.push({ fieldId: fieldId("recipient"), label: "Recipient", message: "Enter who this goes to." });
  }
  if (!/^[0-9]{6,}$/.test(state.reference.trim())) {
    errors.push({ fieldId: fieldId("reference"), label: "Reference", message: "Use at least 6 digits." });
  }
  const amount = Number(state.amount);
  if (!state.amount.trim() || Number.isNaN(amount) || amount <= 0) {
    errors.push({ fieldId: fieldId("amount"), label: "Amount", message: "Enter an amount greater than 0." });
  }
  return errors;
}

const labelClass = "block text-[13px] font-medium text-[var(--color-fg)]";
const inputClass =
  "mt-1 min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-[15px] text-[var(--color-fg)] outline-none placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]";

/* --------------------------------------------------------------- the preview */

export function KeyboardSafeFormPreview() {
  const [state, setState] = React.useState<FormState>(EMPTY);
  const [errors, setErrors] = React.useState<FieldError[]>([]);
  const [failNext, setFailNext] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const dirty = React.useMemo(
    () => (Object.keys(EMPTY) as (keyof FormState)[]).some((k) => state[k] !== EMPTY[k]),
    [state],
  );

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = e.target.value;
    setState((s) => ({ ...s, [key]: next }));
    setSaved(false);
    // Clear just this field's error as the user corrects it.
    setErrors((prev) => prev.filter((err) => err.fieldId !== fieldId(key)));
  };

  const errorFor = (key: keyof FormState) => errors.find((err) => err.fieldId === fieldId(key));

  // The app owns submission — a local timer standing in for a request. It either
  // resolves or rejects based on the "Force failure" toggle. Nothing is sent.
  const handleSubmit = () =>
    new Promise<void>((resolve, reject) => {
      window.setTimeout(() => {
        if (failNext) reject(new Error("Couldn’t reach the demo service. Nothing was sent — try again."));
        else resolve();
      }, 1100);
    });

  const btn =
    "min-h-[36px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[12px] font-medium text-[var(--color-fg)] hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]";

  return (
    <div className="flex w-full max-w-[860px] flex-col items-center gap-5 lg:flex-row lg:items-start lg:justify-center">
      {/* Phone frame — the component dominates this surface */}
      <div className="relative w-full max-w-[380px] shrink-0">
        <div
          className="relative flex flex-col overflow-hidden rounded-[2rem] border-[6px] border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-[var(--shadow-lg)]"
          style={{ height: 620 }}
        >
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-2 pt-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">Payments</p>
              <p className="text-[15px] font-semibold text-[var(--color-fg)]">New payee</p>
            </div>
            <span className="rounded-full bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted)]">
              Demo form
            </span>
          </div>

          <div className="flex min-h-0 flex-1 p-3">
            <KeyboardSafeForm
              title="Add a payee"
              description="Details stay editable with the keyboard open."
              className="flex-1"
              dirty={dirty}
              submitLabel="Add payee"
              successMessage="Payee added"
              onValidate={() => {
                const found = validate(state);
                setErrors(found);
                return found;
              }}
              onCancel={() => {
                setState(EMPTY);
                setErrors([]);
                setSaved(false);
              }}
              onSubmit={handleSubmit}
              onSubmitSuccess={() => {
                setSaved(true);
                setState(EMPTY);
                setErrors([]);
              }}
            >
              <Field
                id={fieldId("recipient")}
                label="Recipient"
                value={state.recipient}
                onChange={set("recipient")}
                error={errorFor("recipient")}
                placeholder="e.g. Riverside Studio"
                autoComplete="off"
              />
              <Field
                id={fieldId("reference")}
                label="Reference"
                value={state.reference}
                onChange={set("reference")}
                error={errorFor("reference")}
                placeholder="6+ digit reference"
                inputMode="numeric"
              />
              <Field
                id={fieldId("amount")}
                label="Amount"
                value={state.amount}
                onChange={set("amount")}
                error={errorFor("amount")}
                placeholder="0.00"
                inputMode="decimal"
              />
              <label htmlFor={fieldId("note")} className={labelClass}>
                Note (optional)
                <textarea
                  id={fieldId("note")}
                  value={state.note}
                  onChange={set("note")}
                  rows={2}
                  placeholder="What is this for?"
                  className={`${inputClass} min-h-[72px] resize-none py-2.5 leading-relaxed`}
                />
              </label>
              {saved ? (
                <p className="text-[12px] text-[var(--color-success)]">Last payee added to your demo list.</p>
              ) : null}
            </KeyboardSafeForm>
          </div>
        </div>
      </div>

      {/* Working controls */}
      <div className="w-full max-w-[380px] space-y-3 text-left lg:pt-4">
        <p className="text-[13px] font-medium text-[var(--color-fg)]">Try the workflow</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btn}
            onClick={() =>
              setState({ recipient: "Riverside Studio", reference: "204815", amount: "180", note: "Deposit" })
            }
          >
            Fill valid
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => setState({ recipient: "", reference: "42", amount: "-5", note: "" })}
          >
            Fill invalid
          </button>
          <button type="button" className={btn} onClick={() => { setState(EMPTY); setErrors([]); }}>
            Clear
          </button>
        </div>
        <label className="flex items-center gap-2 text-[12px] text-[var(--color-muted)]">
          <input
            type="checkbox"
            checked={failNext}
            onChange={(e) => setFailNext(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
          Force the next submission to fail
        </label>
        <p className="max-w-[42ch] text-[12px] leading-relaxed text-[var(--color-muted)]">
          The action bar rides above the virtual keyboard using the VisualViewport API where it exists, and falls back to a
          plain sticky footer where it doesn’t. Submitting is a local timer —{" "}
          <strong className="font-medium text-[var(--color-fg)]">nothing is sent anywhere</strong>. Editing after an error
          clears just that field; cancelling with unsaved edits asks first.
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  inputMode,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: FieldError;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}) {
  const errId = `${id}-error`;
  return (
    <label htmlFor={id} className={labelClass}>
      {label}
      <input
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        className={inputClass}
        style={error ? { borderColor: "var(--color-error)" } : undefined}
      />
      {error ? (
        <span id={errId} className="mt-1 flex items-center gap-1 text-[12px] font-medium text-[var(--color-error)]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 8v5m0 3h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {error.message}
        </span>
      ) : null}
    </label>
  );
}
