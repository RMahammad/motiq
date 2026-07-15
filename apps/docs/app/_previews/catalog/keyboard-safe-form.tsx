"use client";

import * as React from "react";

import { KeyboardSafeForm } from "@/registry/mobile/keyboard-safe-form";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL KeyboardSafeForm in one
 * representative filled state — labelled fields plus its own sticky action bar.
 * No external "fill valid / force failure" demo controls. The submit is a no-op
 * (nothing is sent). Deterministic; fields are lightly pre-filled.
 */

const labelClass = "block text-[13px] font-medium text-[var(--color-fg)]";
const inputClass =
  "mt-1 min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-[15px] text-[var(--color-fg)] outline-none placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]";

export function KeyboardSafeFormCatalogPreview() {
  const [state, setState] = React.useState({ recipient: "Riverside Studio", amount: "180", note: "" });
  const set = (key: keyof typeof state) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setState((s) => ({ ...s, [key]: e.target.value }));

  return (
    <div className="w-full">
      <KeyboardSafeForm
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
          <input id="ksf-amount" value={state.amount} onChange={set("amount")} inputMode="decimal" className={inputClass} />
        </label>
        <label htmlFor="ksf-note" className={labelClass}>
          Note (optional)
          <textarea id="ksf-note" value={state.note} onChange={set("note")} rows={2} placeholder="What is this for?" className={inputClass} />
        </label>
      </KeyboardSafeForm>
    </div>
  );
}

export default KeyboardSafeFormCatalogPreview;
