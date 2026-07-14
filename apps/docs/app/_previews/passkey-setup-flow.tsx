"use client";

import * as React from "react";

import {
  PasskeySetupFlow,
  type PasskeyState,
  type PasskeyError,
} from "@/registry/security/passkey-setup-flow";

/* Demo state only — NO real WebAuthn. This preview stands in for the host app:
 * it owns the `state` prop and moves the flow between phases locally so you can
 * see every screen. A real integration would instead call
 * `navigator.credentials.create()` and set the state from that promise's
 * result. Nothing here creates, reads, or displays cryptographic material.
 * Fixed demo identity — clearly fictional, no real account. */

const CAPABILITY = {
  supported: true,
  platformAuthenticator: true,
  roamingAuthenticator: true,
  detail: "Built-in authenticator available (fingerprint / face unlock).",
};

const UNSUPPORTED_CAPABILITY = {
  supported: false,
  detail: "This browser doesn't support passkeys. Update it or try another device.",
};

const DEMO_ERROR: PasskeyError = {
  title: "Passkey setup didn't finish",
  message: "The prompt was dismissed before the passkey was confirmed on your device.",
  code: "NotAllowedError",
  recoverable: true,
};

const EXISTING = {
  label: "Studio MacBook",
  deviceName: "MacBook Pro · this browser",
  createdAt: 1_800_000_000_000,
};

const control =
  "rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

export function PasskeySetupFlowPreview() {
  const [state, setState] = React.useState<PasskeyState>("intro");
  const [name, setName] = React.useState("");
  const [supported, setSupported] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  const capability = supported ? CAPABILITY : UNSUPPORTED_CAPABILITY;

  // Demo-only: mimic the app briefly showing "starting" then "waiting for the
  // system prompt" after the user asks to create a passkey. A real app would
  // drive these transitions from the WebAuthn call, not a timer.
  const beginRegistration = () => {
    if (!supported) {
      setState("unsupported");
      return;
    }
    setBusy(true);
    setState("registration-starting");
    window.setTimeout(() => {
      setBusy(false);
      setState("system-prompt-waiting");
    }, 700);
  };

  const reset = () => {
    setBusy(false);
    setName("");
    setSupported(true);
    setState("intro");
  };

  return (
    <div className="flex w-full max-w-[760px] flex-col gap-4">
      {/* account security settings shell */}
      <div className="overflow-hidden rounded-2xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--color-border)] px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-fg)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[var(--color-accent)]">
              <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            Account · Security
          </span>
          <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
            Demo state · no real WebAuthn
          </span>
          <span className="ml-auto text-[12px] text-[var(--color-muted)]">Sign-in methods</span>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-[1fr_minmax(0,30rem)]">
          {/* settings context column */}
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-[13px] font-semibold text-[var(--color-fg)]">Passkeys</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-muted)]">
                Add a passkey to sign in with your fingerprint, face, or device PIN instead of a password. You can keep
                your password as a backup.
              </p>
            </div>
            <div className="rounded-lg bg-[var(--color-surface)] px-3 py-2.5 text-[12.5px] [border:1px_solid_var(--color-border)]">
              <p className="font-medium text-[var(--color-fg)]">Current methods</p>
              <ul className="mt-1.5 flex flex-col gap-1 text-[var(--color-muted)]">
                <li className="flex items-center gap-1.5">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                  Password · enabled
                </li>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]" />
                  Passkey · {state === "success" ? "1 registered" : "not set up"}
                </li>
              </ul>
            </div>
          </div>

          {/* the component under test */}
          <div className="flex justify-center md:justify-end">
            <PasskeySetupFlow
              state={state}
              name={name}
              onNameChange={setName}
              capability={capability}
              relyingPartyName="Northwind Studio"
              userIdentifier="ada@northwind.example"
              error={state === "failure" ? DEMO_ERROR : null}
              existingCredential={EXISTING}
              busy={busy}
              alternativeLabel="Use a password instead"
              onBegin={() => (state === "existing-credential" ? beginRegistration() : state === "intro" || state === "device-capability" ? setState("naming") : beginRegistration())}
              onCancel={() => setState("cancelled")}
              onRetry={() => setState("naming")}
              onComplete={() => setState("success")}
              onUseAlternative={() => setState("intro")}
            />
          </div>
        </div>
      </div>

      {/* working controls — each drives an app-supplied state transition */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={control} onClick={() => setState("naming")}>
          Start setup
        </button>
        <button type="button" className={control} onClick={() => setState("system-prompt-waiting")}>
          Show system-prompt state
        </button>
        <button type="button" className={control} onClick={() => setState("success")}>
          Complete
        </button>
        <button type="button" className={control} onClick={() => setState("failure")}>
          Fail
        </button>
        <button
          type="button"
          className={control}
          aria-pressed={!supported}
          onClick={() => {
            setSupported(false);
            setState("unsupported");
          }}
        >
          Unsupported
        </button>
        <button type="button" className={control} onClick={() => setState("existing-credential")}>
          Existing credential
        </button>
        <button type="button" className={control} onClick={() => setState("cancelled")}>
          Cancel
        </button>
        <button type="button" className={control} onClick={() => setState("retry")}>
          Retry
        </button>
        <button type="button" className={control} onClick={reset}>
          Reset
        </button>
        <span className="ml-auto text-[12px] text-[var(--color-muted)]">App owns state · component presents it</span>
      </div>
    </div>
  );
}

export default PasskeySetupFlowPreview;
