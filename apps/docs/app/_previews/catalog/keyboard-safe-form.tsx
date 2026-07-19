"use client";

import * as React from "react";

import { KeyboardSafeForm } from "@/registry/mobile/keyboard-safe-form";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL KeyboardSafeForm in one
 * representative filled state — labelled fields plus its own sticky action bar.
 * No external "fill valid / force failure" demo controls. The submit is a no-op
 * (nothing is sent). Deterministic; fields are lightly pre-filled.
 */

const labelClass = "block text-[12.5px] font-semibold text-[var(--color-muted)]";
const inputClass =
  "mt-1.5 min-h-[46px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 text-[15px] font-medium text-[var(--color-fg)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.18)] outline-none transition-colors placeholder:font-normal placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:bg-[var(--color-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-accent)]";

export function KeyboardSafeFormCatalogPreview() {
  const [state, setState] = React.useState({ recipient: "Riverside Studio", amount: "180", note: "" });
  const set = (key: keyof typeof state) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setState((s) => ({ ...s, [key]: e.target.value }));

  return (
    <div className="flex h-full w-full flex-col bg-[var(--color-bg)]">
      <KeyboardSafeForm
        className="h-full rounded-none border-0 bg-transparent shadow-none"
        title="Add a payee"
        description="Details stay editable with the keyboard open."
        submitLabel="Add payee"
        successMessage="Payee added"
        onValidate={() => []}
        onSubmit={() => {}}
      >
        <label htmlFor="ksf-recipient" className={labelClass}>
          Recipient
          <input id="ksf-recipient" value={state.recipient} onChange={set("recipient")} className={inputClass} autoComplete="off" />
        </label>
        <label htmlFor="ksf-amount" className={labelClass}>
          Amount
          <span className="relative mt-1.5 block">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-[var(--color-muted)]">$</span>
            <input
              id="ksf-amount"
              value={state.amount}
              onChange={set("amount")}
              inputMode="decimal"
              className={`${inputClass} mt-0 pl-7 tabular-nums`}
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[var(--color-muted)]">USD</span>
          </span>
        </label>
        <label htmlFor="ksf-note" className={labelClass}>
          Note (optional)
          <textarea id="ksf-note" value={state.note} onChange={set("note")} rows={2} placeholder="What is this for?" className={`${inputClass} min-h-[72px] resize-none py-2.5 leading-relaxed`} />
        </label>
      </KeyboardSafeForm>
    </div>
  );
}

export default KeyboardSafeFormCatalogPreview;
