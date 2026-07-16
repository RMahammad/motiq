"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useControllableState,
  statusVars,
  type StatusTone,
} from "@/lib/motionstack";

/* --------------------------------------------------------------------------
 * PasskeySetupFlow — presentation + orchestration for an app-owned passkey
 * (WebAuthn) registration. This component DOES NOT implement WebAuthn or any
 * cryptography: it never calls `navigator.credentials`, never generates,
 * collects, or displays private-key / attestation material, and never decides
 * that setup succeeded. The APPLICATION performs every WebAuthn operation and
 * feeds the resulting phase back in through the controlled `state` prop; the
 * component only renders that state and emits intent via callbacks.
 *
 * It always keeps an alternative sign-in path in reach, surfaces the honest
 * failure detail the app provides, and applies no countdown / time pressure to
 * the person confirming on their device. Copy is deliberately accurate:
 * passkeys are phishing-resistant and device-bound — not "impossible to
 * compromise". Clean-room original.
 * ----------------------------------------------------------------------- */

/**
 * App-driven phases of the setup. Every transition is owned by the host app
 * (it moves the flow forward only after the real WebAuthn call resolves).
 */
export type PasskeyState =
  | "intro"
  | "device-capability"
  | "naming"
  | "registration-starting"
  | "system-prompt-waiting"
  | "success"
  | "failure"
  | "existing-credential"
  | "unsupported"
  | "cancelled"
  | "retry"
  | "recovery-guidance";

/** Honest, app-supplied failure detail. No error is invented by the component. */
export interface PasskeyError {
  /** Machine code from the app, e.g. a DOMException name like "NotAllowedError". */
  code?: string;
  /** Short human title; falls back to a neutral default. */
  title?: string;
  /** The specific detail the user needs to understand and act on. */
  message: string;
  /** Whether the app considers another attempt worthwhile. Defaults to true. */
  recoverable?: boolean;
}

/**
 * Device capability as determined by the APP (e.g. from
 * `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()`).
 * The component never probes the platform itself.
 */
export interface PasskeyCapability {
  /** WebAuthn is available in this browser at all. */
  supported: boolean;
  /** A built-in authenticator (Face ID / Touch ID / Windows Hello) is present. */
  platformAuthenticator?: boolean;
  /** Roaming keys (security key / phone) can be used. */
  roamingAuthenticator?: boolean;
  /** A short, human-readable note about the detected device. */
  detail?: string;
}

/** Context for an already-registered passkey (app-supplied). */
export interface ExistingCredentialInfo {
  /** Nickname the user gave the existing passkey. */
  label?: string;
  /** Where it lives, e.g. "iPhone 15" or "1Password". */
  deviceName?: string;
  createdAt?: Date | number | string;
}

export interface PasskeySetupFlowProps {
  /** Controlled, app-owned phase. The app advances this after each real step. */
  state: PasskeyState;
  /** Controlled passkey nickname (the ONLY thing this component collects). */
  name?: string;
  defaultName?: string;
  /** App-determined device capability; drives the capability + unsupported UI. */
  capability?: PasskeyCapability;
  /** App-supplied failure detail, shown verbatim on the `failure` state. */
  error?: PasskeyError | null;
  /** Details of an existing credential, shown on `existing-credential`. */
  existingCredential?: ExistingCredentialInfo;
  /** The site/app the user is registering with, e.g. "Acme". */
  relyingPartyName?: string;
  /** Account context (e.g. an email) shown for reassurance. Never a secret. */
  userIdentifier?: string;
  /** Label for the always-available fallback, e.g. "Use a password instead". */
  alternativeLabel?: string;
  /** Optional recovery guidance shown on the `recovery-guidance` state. */
  recoveryHint?: React.ReactNode;
  /** App-driven: an operation is in flight (disables the primary control). */
  busy?: boolean;
  /** Begin / retry the registration operation (the app then calls WebAuthn). */
  onBegin?: () => void;
  /** Abandon the in-flight step. */
  onCancel?: () => void;
  /** Try again after a failure or cancellation. */
  onRetry?: () => void;
  /** The nickname changed. */
  onNameChange?: (name: string) => void;
  /** Acknowledge a completed, app-confirmed success. */
  onComplete?: () => void;
  /** Take the alternative sign-in path instead of a passkey. Always offered. */
  onUseAlternative?: () => void;
  /** Accessible label for the region. */
  label?: string;
  className?: string;
}

/* -- step model ---------------------------------------------------------- */

const STEPS = ["Check your device", "Name your passkey", "Confirm on your device"] as const;

/** Which ordered step a state sits on (-1 = outside the linear flow). */
function stepIndex(state: PasskeyState): number {
  switch (state) {
    case "intro":
    case "device-capability":
      return 0;
    case "naming":
    case "retry":
    case "existing-credential":
      return 1;
    case "registration-starting":
    case "system-prompt-waiting":
    case "cancelled":
    case "failure":
      return 2;
    case "success":
      return 3; // past the last step
    default:
      return -1; // unsupported, recovery-guidance
  }
}

const EASE: Transition["ease"] = [0.2, 0, 0, 1];

const P = (d: string) => (
  <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
);

function ToneIcon({ tone, size = 14 }: { tone: StatusTone; size?: number }) {
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

/** Passkey / fingerprint glyph — decorative. */
function PasskeyGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {P("M12 11a2.5 2.5 0 0 0-2.5 2.5c0 2-.4 3.4-1 4.5")}
      {P("M12 6.5a5 5 0 0 1 5 5c0 1.2-.1 2.3-.3 3.3")}
      {P("M7 9a5 5 0 0 1 8-1.3")}
      {P("M14.5 13.5c0 2.2-.3 3.9-.9 5.4")}
    </svg>
  );
}

interface StateCopy {
  /** Heading for the current phase. */
  title: string;
  /** Plain-language description of what is happening / needed. */
  body: string;
  /** Live-region sentence (kept short, factual, no pressure). */
  announce: string;
  tone: StatusTone;
}

/* -- component ----------------------------------------------------------- */

export function PasskeySetupFlow({
  state,
  name,
  defaultName = "",
  capability,
  error,
  existingCredential,
  relyingPartyName,
  userIdentifier,
  alternativeLabel = "Use another sign-in method",
  recoveryHint,
  busy = false,
  onBegin,
  onCancel,
  onRetry,
  onNameChange,
  onComplete,
  onUseAlternative,
  label,
  className,
}: PasskeySetupFlowProps) {
  const reduce = useReducedMotion();
  const [nickname, setNickname] = useControllableState<string>({
    value: name,
    defaultValue: defaultName,
    onChange: onNameChange,
  });

  const errorId = React.useId();
  const nameFieldId = React.useId();

  const site = relyingPartyName ?? "this app";
  const active = stepIndex(state);

  const copy: StateCopy = React.useMemo(() => stateCopy(state, site, capability), [state, site, capability]);

  // Phase changes are announced through the polite live region below; we do NOT
  // move DOM focus to the (non-interactive) heading, which some environments
  // render with a forced focus box around a full-width heading.

  const showStepper = active >= 0;
  const regionLabel = label ?? `Set up a passkey for ${site}`;

  const beginRegistration = () => {
    if (busy) return;
    onBegin?.();
  };

  /* Primary + secondary controls differ per phase. The alternative path is
   * offered on every non-success screen so the user is never trapped. */
  const canBegin = capability ? capability.supported : true;

  return (
    <section
      aria-label={regionLabel}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]",
        className,
      )}
    >
      {/* header */}
      <header className="flex items-start gap-3 border-b border-[var(--color-border)] px-5 py-4">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[var(--color-accent)]"
          style={{ background: statusVars("active").bg, border: `1px solid ${statusVars("active").border}` }}
        >
          <PasskeyGlyph />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Passkey setup
          </p>
          <h3 className="truncate text-[15px] font-semibold leading-snug text-[var(--color-fg)]">
            {relyingPartyName ? `Sign in to ${relyingPartyName} without a password` : "Set up a passkey"}
          </h3>
          {userIdentifier ? (
            <p className="mt-0.5 truncate text-[12.5px] text-[var(--color-muted)]">For {userIdentifier}</p>
          ) : null}
        </div>
      </header>

      {/* ordered step semantics */}
      {showStepper ? (
        <ol
          role="list"
          aria-label="Setup steps"
          className="flex items-stretch gap-1 px-5 pt-4"
        >
          {STEPS.map((stepLabel, i) => {
            const status = i < active ? "complete" : i === active ? "current" : "upcoming";
            const tone: StatusTone = status === "complete" ? "success" : status === "current" ? "active" : "neutral";
            return (
              <li
                key={stepLabel}
                aria-current={status === "current" ? "step" : undefined}
                data-status={status}
                className="flex min-w-0 flex-1 flex-col gap-1.5"
              >
                <span
                  className="h-1 rounded-full"
                  style={{
                    background:
                      status === "upcoming" ? "var(--color-bg-secondary)" : statusVars(tone).color,
                  }}
                  aria-hidden
                />
                <span className="flex items-center gap-1 text-[11px] font-medium leading-tight">
                  <span
                    className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold"
                    style={{
                      color: status === "upcoming" ? "var(--color-muted)" : statusVars(tone).color,
                      background: status === "upcoming" ? "transparent" : statusVars(tone).bg,
                      border: `1px solid ${status === "upcoming" ? "var(--color-border)" : statusVars(tone).border}`,
                    }}
                    aria-hidden
                  >
                    {status === "complete" ? <ToneIcon tone="success" size={10} /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "truncate",
                      status === "upcoming" ? "text-[var(--color-muted)]" : "text-[var(--color-fg)]",
                    )}
                  >
                    {stepLabel}
                  </span>
                  <span className="sr-only">
                    {status === "complete" ? "(completed)" : status === "current" ? "(current step)" : "(upcoming)"}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      ) : null}

      {/* phase body */}
      <div className="px-5 py-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={state}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0" style={{ color: statusVars(copy.tone).color }}>
                {state === "system-prompt-waiting" || state === "registration-starting" ? (
                  <Spinner reduce={reduce} />
                ) : (
                  <ToneIcon tone={copy.tone} size={18} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-[15px] font-semibold leading-snug text-[var(--color-fg)]">
                  {copy.title}
                </h4>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-muted)]">{copy.body}</p>

                {/* capability detail */}
                {(state === "device-capability" || state === "unsupported") && capability?.detail ? (
                  <p className="mt-2 rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 text-[12.5px] text-[var(--color-fg)] [border:1px_solid_var(--color-border)]">
                    {capability.detail}
                  </p>
                ) : null}

                {/* naming field — the only user input, never key material */}
                {state === "naming" || state === "retry" ? (
                  <div className="mt-3">
                    <label htmlFor={nameFieldId} className="mb-1 block text-[12px] font-medium text-[var(--color-fg)]">
                      Passkey name <span className="font-normal text-[var(--color-muted)]">(so you can recognise it later)</span>
                    </label>
                    <input
                      id={nameFieldId}
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && canBegin && !busy) {
                          e.preventDefault();
                          beginRegistration();
                        }
                      }}
                      placeholder="e.g. My MacBook"
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[13.5px] text-[var(--color-fg)] outline-none placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    />
                  </div>
                ) : null}

                {/* existing credential context */}
                {state === "existing-credential" && existingCredential ? (
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 text-[12.5px] [border:1px_solid_var(--color-border)]">
                    {existingCredential.label ? (
                      <>
                        <dt className="text-[var(--color-muted)]">Name</dt>
                        <dd className="font-medium text-[var(--color-fg)]">{existingCredential.label}</dd>
                      </>
                    ) : null}
                    {existingCredential.deviceName ? (
                      <>
                        <dt className="text-[var(--color-muted)]">Device</dt>
                        <dd className="font-medium text-[var(--color-fg)]">{existingCredential.deviceName}</dd>
                      </>
                    ) : null}
                  </dl>
                ) : null}

                {/* honest failure detail, associated with the retry control */}
                {state === "failure" && error ? (
                  <div
                    role="alert"
                    className="mt-3 rounded-lg px-3 py-2.5 text-[12.5px]"
                    style={{ background: statusVars("error").bg, border: `1px solid ${statusVars("error").border}` }}
                  >
                    <p className="flex items-center gap-1.5 font-semibold" style={{ color: statusVars("error").color }}>
                      <ToneIcon tone="error" size={13} />
                      {error.title ?? "Passkey setup didn't finish"}
                    </p>
                    <p id={errorId} className="mt-1 leading-relaxed text-[var(--color-fg)]">
                      {error.message}
                    </p>
                    {error.code ? (
                      <p className="mt-1 font-mono text-[11px] text-[var(--color-muted)]">Reason: {error.code}</p>
                    ) : null}
                  </div>
                ) : null}

                {/* recovery guidance */}
                {state === "recovery-guidance" ? (
                  <div className="mt-3 rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2.5 text-[12.5px] leading-relaxed text-[var(--color-fg)] [border:1px_solid_var(--color-border)]">
                    {recoveryHint ?? (
                      <p>
                        Keep a second way to sign in. If you lose the device holding this passkey, you can still get in
                        with your other method and remove the old passkey from your security settings.
                      </p>
                    )}
                  </div>
                ) : null}

                {/* honest reassurance — accurate, not absolute */}
                {state === "intro" ? (
                  <ul className="mt-3 flex flex-col gap-1.5 text-[12.5px] text-[var(--color-muted)]">
                    <li className="flex items-start gap-1.5">
                      <span className="mt-0.5 shrink-0 text-[var(--color-success)]"><ToneIcon tone="success" size={12} /></span>
                      Uses your device unlock (fingerprint, face, or PIN) — nothing to type.
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="mt-0.5 shrink-0 text-[var(--color-success)]"><ToneIcon tone="success" size={12} /></span>
                      Phishing-resistant and stays on your device; the site never sees a secret.
                    </li>
                  </ul>
                ) : null}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* actions — a calm footer: an in-flight status line on its own row, then a
          button row with the low-emphasis escape hatch on the left and the primary
          action cluster (secondary → primary) right-aligned. */}
      <div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-5 py-4">
        {(state === "registration-starting" || state === "system-prompt-waiting") ? (
          <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--color-muted)]">
            <Spinner reduce={reduce} />
            Waiting for your device… take as long as you need
          </span>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {/* escape hatch — low emphasis, left; offered so the user is never trapped */}
          {onUseAlternative ? (
            <GhostButton onClick={() => onUseAlternative()}>{alternativeLabel}</GhostButton>
          ) : null}

          {/* right-aligned action cluster: secondary first, primary rightmost */}
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            {(state === "registration-starting" || state === "system-prompt-waiting") && onCancel ? (
              <SecondaryButton onClick={() => onCancel()}>Cancel</SecondaryButton>
            ) : null}

            {(state === "intro" || state === "device-capability") && canBegin ? (
              <PrimaryButton onClick={beginRegistration} busy={busy}>
                Set up a passkey
              </PrimaryButton>
            ) : null}

            {(state === "naming" || state === "retry") && canBegin ? (
              <PrimaryButton onClick={beginRegistration} busy={busy}>
                Create passkey
              </PrimaryButton>
            ) : null}

            {state === "success" ? (
              <PrimaryButton onClick={() => onComplete?.()}>Done</PrimaryButton>
            ) : null}

            {(state === "failure" || state === "cancelled") ? (
              <PrimaryButton
                onClick={() => onRetry?.()}
                aria-describedby={state === "failure" && error ? errorId : undefined}
              >
                Try again
              </PrimaryButton>
            ) : null}

            {state === "existing-credential" ? (
              <PrimaryButton onClick={() => onBegin?.()} busy={busy}>
                Add another passkey
              </PrimaryButton>
            ) : null}
          </div>
        </div>

        {/* unsupported browsers must never be a dead end */}
        {state === "unsupported" ? (
          <p className="text-[12px] leading-relaxed text-[var(--color-muted)]">
            Passkeys aren&apos;t available here, but your account is not blocked — continue with another sign-in method
            above and try passkeys later on a supported device.
          </p>
        ) : null}
      </div>

      {/* polite live region — status conveyed in text, never colour alone,
          and with no countdown / urgency. */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}
      >
        {copy.announce}
      </div>
    </section>
  );
}

/* -- phase copy ---------------------------------------------------------- */

function stateCopy(state: PasskeyState, site: string, capability?: PasskeyCapability): StateCopy {
  switch (state) {
    case "intro":
      return {
        title: "Create a passkey to skip the password",
        body: `A passkey lets you sign in to ${site} with the same fingerprint, face, or PIN you use to unlock this device.`,
        announce: "Passkey setup started. Review what a passkey is, then continue.",
        tone: "active",
      };
    case "device-capability":
      return {
        title: capability?.platformAuthenticator ? "Your device can create a passkey" : "Checking what this device supports",
        body: capability?.platformAuthenticator
          ? "This device has a built-in authenticator, so you can finish setup right here."
          : "We'll use whatever secure method your device offers — a built-in sensor, a phone, or a security key.",
        announce: "Device capability checked. Continue to create your passkey.",
        tone: "info",
      };
    case "naming":
      return {
        title: "Give this passkey a name",
        body: "A recognisable name helps you tell your passkeys apart later. You can change it anytime in your security settings.",
        announce: "Name your passkey, then create it.",
        tone: "active",
      };
    case "registration-starting":
      return {
        title: "Starting passkey creation",
        body: "Your device is being asked to create the passkey. Your browser will show its own prompt in a moment.",
        announce: "Starting passkey creation on your device.",
        tone: "active",
      };
    case "system-prompt-waiting":
      return {
        title: "Confirm on your device",
        body: "Use your fingerprint, face, or device PIN in the prompt your browser opened. There's no time limit — do it whenever you're ready.",
        announce: "Waiting for you to confirm the passkey on your device. No time limit.",
        tone: "active",
      };
    case "success":
      return {
        title: "Passkey ready",
        body: `You can now sign in to ${site} with this passkey. Passkeys are phishing-resistant, but keep another sign-in method as a backup in case you lose this device.`,
        announce: "Your passkey was created successfully.",
        tone: "success",
      };
    case "failure":
      return {
        title: "Setup didn't finish",
        body: "The passkey wasn't created. The details below explain what happened — you can try again or use another method.",
        announce: "Passkey setup failed. See the details and try again.",
        tone: "error",
      };
    case "existing-credential":
      return {
        title: "You already have a passkey here",
        body: "This device already has a passkey for your account. You can keep using it, or add another for a different device.",
        announce: "A passkey already exists for this account on this device.",
        tone: "info",
      };
    case "unsupported":
      return {
        title: "Passkeys aren't available on this device",
        body: "This browser or device can't create a passkey right now. You can still sign in with another method.",
        announce: "Passkeys are not supported here. An alternative sign-in method is available.",
        tone: "warning",
      };
    case "cancelled":
      return {
        title: "Setup cancelled",
        body: "No passkey was created. You can try again whenever you like, or continue with another sign-in method.",
        announce: "Passkey setup was cancelled. Nothing was saved.",
        tone: "neutral",
      };
    case "retry":
      return {
        title: "Try creating your passkey again",
        body: "Check the name and create the passkey once more. If it keeps failing, use another sign-in method below.",
        announce: "Ready to try creating your passkey again.",
        tone: "active",
      };
    case "recovery-guidance":
      return {
        title: "Keep a backup way in",
        body: "Passkeys live on your devices. Set up a recovery method so you can still sign in if a device is lost.",
        announce: "Review recovery guidance for your passkeys.",
        tone: "info",
      };
    default:
      return { title: "Passkey setup", body: "", announce: "", tone: "neutral" };
  }
}

/* -- controls ------------------------------------------------------------ */

interface PrimaryButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  busy?: boolean;
  tone?: StatusTone;
  "aria-describedby"?: string;
}

function PrimaryButton({ onClick, children, busy, tone = "active", ...rest }: PrimaryButtonProps) {
  const v = statusVars(tone);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-busy={busy || undefined}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13.5px] font-semibold text-white outline-none transition-[filter] hover:brightness-[1.05] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
      style={{ background: v.color }}
      {...rest}
    >
      {busy ? <Spinner light /> : null}
      {children}
    </button>
  );
}

function SecondaryButton({
  onClick,
  children,
  className,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-surface)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
        className,
      )}
    >
      {children}
    </button>
  );
}

// Low-emphasis "escape hatch" action (e.g. "Use a password instead") — a quiet
// text button that never competes with the primary/secondary actions.
function GhostButton({ onClick, children, className }: { onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[var(--color-muted)] outline-none transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-fg)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Spinner({ reduce, light }: { reduce?: boolean; light?: boolean }) {
  const stroke = light ? "white" : "currentColor";
  if (reduce) {
    // Reduced motion: a static, labelled progress mark instead of a spinner.
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="2" opacity="0.35" />
        <path d="M12 3a9 9 0 0 1 9 9" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <motion.svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, ease: "linear", repeat: Infinity }}
    >
      <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="2" opacity="0.3" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </motion.svg>
  );
}

export default PasskeySetupFlow;
