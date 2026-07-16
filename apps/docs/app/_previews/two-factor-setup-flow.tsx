"use client";

import * as React from "react";

import {
  TwoFactorSetupFlow,
  type TwoFactorState,
  type TwoFactorMethod,
  type TwoFactorMethodKind,
  type TwoFactorError,
  type TwoFactorSetupData,
} from "@/registry/security/two-factor-setup-flow";

/* Demo state only — NO real cryptography, TOTP, WebAuthn, SMS, or verification.
 * This preview stands in for the host app: it owns the `state` prop and moves
 * the flow between phases locally so you can see every screen. A real
 * integration would generate a secret server-side, deliver/verify codes, and
 * set the state from those results. Nothing here is a real secret — the setup
 * key and recovery codes below are obvious placeholders. Fixed, deterministic. */

const METHODS: TwoFactorMethod[] = [
  {
    kind: "authenticator",
    label: "Authenticator app",
    description: "One-time codes from an app on your phone.",
    recommended: true,
  },
  {
    kind: "security-key",
    label: "Security key",
    description: "A hardware key you tap or plug in.",
  },
  {
    kind: "sms",
    label: "Text message (SMS)",
    description: "A code texted to your phone.",
    tradeoff: "Convenient, but SMS can be intercepted or SIM-swapped. Prefer an app or key if you can.",
  },
  {
    kind: "email",
    label: "Email code",
    description: "A code sent to your email.",
    tradeoff: "Only as strong as your email account's own protection.",
  },
];

// Obvious, non-secret placeholder enrollment material — never a real secret.
const SETUP_DATA: TwoFactorSetupData = {
  setupKey: "DEMO-ONLY-XXXX-XXXX-NOT-A-REAL-SECRET",
  accountLabel: "Northwind Studio (ada@northwind.example)",
  codeLength: 6,
  qrNode: (
    <div className="grid h-full w-full place-items-center bg-[var(--color-bg-secondary)] text-center text-[9px] font-medium leading-tight text-[var(--color-muted)]">
      QR PLACEHOLDER
      <br />
      demo only
    </div>
  ),
};

// Obvious placeholder recovery codes — not usable, clearly synthetic.
const RECOVERY_CODES = [
  "DEMO-0000-0001",
  "DEMO-0000-0002",
  "DEMO-0000-0003",
  "DEMO-0000-0004",
  "DEMO-0000-0005",
  "DEMO-0000-0006",
];

const INVALID_ERROR: TwoFactorError = {
  title: "That code didn't match",
  message: "The code you entered doesn't match the current one. Check your app for the latest code and try again.",
  code: "code_mismatch",
};

const EXPIRED_ERROR: TwoFactorError = {
  title: "That code has expired",
  message: "Codes are only valid for a short time. Request a new code and enter it here.",
  code: "code_expired",
};

const control =
  "rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

export function TwoFactorSetupFlowPreview() {
  const [state, setState] = React.useState<TwoFactorState>("introduction");
  const [method, setMethod] = React.useState<TwoFactorMethodKind>("authenticator");
  const [code, setCode] = React.useState("");

  const errorFor = (s: TwoFactorState): TwoFactorError | null =>
    s === "invalid-code" ? INVALID_ERROR : s === "expired-code" ? EXPIRED_ERROR : null;

  const reset = () => {
    setState("introduction");
    setMethod("authenticator");
    setCode("");
  };

  // Demo-only orchestration mirroring how an app would advance the phase after
  // each real operation resolves. Deterministic — no timers, no randomness.
  const handleBegin = () => {
    if (state === "introduction") setState("method-selection");
    else if (state === "method-selection") setState("secret-or-QR-ready");
    else if (state === "secret-or-QR-ready") setState("waiting-for-code");
  };

  return (
    <div className="flex w-full max-w-[1000px] flex-col gap-4">
      {/* account security settings shell — a distinct workspace from passkeys */}
      <div className="overflow-hidden rounded-2xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--color-border)] px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-fg)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[var(--color-accent)]">
              <path d="M12 3 5 6v6c0 4.2 2.8 7.1 7 8.6 4.2-1.5 7-4.4 7-8.6V6l-7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            Account · Security · Two-factor
          </span>
          <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
            Demo state · synthetic data · no real crypto
          </span>
          <span className="ml-auto text-[12px] text-[var(--color-muted)]">Extra verification</span>
        </div>

        <div className="flex flex-col gap-6 p-4 md:flex-row md:items-start">
          {/* settings context column — fixed, narrow */}
          <div className="flex w-full shrink-0 flex-col gap-3 md:w-72">
            <div>
              <p className="text-[13px] font-semibold text-[var(--color-fg)]">Two-factor authentication</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-muted)]">
                Require a second confirmation after your password. It lowers risk — it doesn&apos;t make the account
                impossible to breach.
              </p>
            </div>
            <div className="rounded-lg bg-[var(--color-surface)] px-3 py-2.5 text-[12.5px] [border:1px_solid_var(--color-border)]">
              <p className="font-medium text-[var(--color-fg)]">Current status</p>
              <ul className="mt-1.5 flex flex-col gap-1 text-[var(--color-muted)]">
                <li className="flex items-center gap-1.5">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                  Password · enabled
                </li>
                <li className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 rounded-full ${state === "complete" || state === "success" ? "bg-[var(--color-success)]" : "bg-[var(--color-muted)]"}`}
                  />
                  Second factor · {state === "complete" || state === "success" ? "enabled" : "not set up"}
                </li>
              </ul>
            </div>
          </div>

          {/* the component under test — takes the remaining width */}
          <div className="min-w-0 flex-1">
            <TwoFactorSetupFlow
              state={state}
              methods={METHODS}
              selectedMethod={method}
              onMethodChange={setMethod}
              code={code}
              relyingPartyName="Northwind Studio"
              userIdentifier="ada@northwind.example"
              setupData={SETUP_DATA}
              recoveryCodes={RECOVERY_CODES}
              error={errorFor(state)}
              alternativeLabel="Use a different method"
              onBegin={handleBegin}
              onVerify={() => setState("recovery-codes")}
              onResend={() => setState("waiting-for-code")}
              onCancel={() => setState("cancelled")}
              onRetry={() => setState("method-selection")}
              onUseAlternative={() => setState("method-selection")}
              onConfirmRecoveryCodes={() => setState("complete")}
              onComplete={() =>
                setState((s) => (s === "success" ? "recovery-codes" : "complete"))
              }
            />
          </div>
        </div>
      </div>

      {/* working controls — each drives an app-supplied state transition */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={control} onClick={() => setState("method-selection")}>
          Select method
        </button>
        <button type="button" className={control} onClick={() => setState("secret-or-QR-ready")}>
          Show QR-ready
        </button>
        <button type="button" className={control} onClick={() => setState("waiting-for-code")}>
          Enter code
        </button>
        <button type="button" className={control} onClick={() => setState("verifying")}>
          Verify
        </button>
        <button type="button" className={control} onClick={() => setState("invalid-code")}>
          Show invalid code
        </button>
        <button type="button" className={control} onClick={() => setState("expired-code")}>
          Show expired code
        </button>
        <button type="button" className={control} onClick={() => setState("recovery-codes")}>
          Reveal recovery codes
        </button>
        <button type="button" className={control} onClick={() => setState("complete")}>
          Complete
        </button>
        <button type="button" className={control} onClick={() => setState("cancelled")}>
          Cancel
        </button>
        <button type="button" className={control} onClick={reset}>
          Reset
        </button>
        <span className="ml-auto text-[12px] text-[var(--color-muted)]">App owns state · component presents it</span>
      </div>
    </div>
  );
}

export default TwoFactorSetupFlowPreview;
