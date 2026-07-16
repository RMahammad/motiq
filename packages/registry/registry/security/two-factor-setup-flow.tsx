"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useControllableState,
  useCopy,
  statusVars,
  type StatusTone,
} from "@/lib/motionkit";

/* --------------------------------------------------------------------------
 * TwoFactorSetupFlow — presentation + orchestration for adding a SECOND
 * authentication factor to an already-signed-in account. This component DOES
 * NOT implement cryptography, TOTP/HOTP, WebAuthn, SMS delivery, or any
 * verification: it never generates a shared secret, never derives or checks a
 * one-time code, never sends anything, and never decides that setup succeeded.
 * The APPLICATION performs every real operation (secret generation, code
 * delivery, verification, recovery-code issuance) and feeds the resulting phase
 * back in through the controlled `state` prop; the component only renders that
 * state and emits intent via callbacks.
 *
 * It keeps an alternative factor in reach, surfaces the honest failure detail
 * the app provides, applies no countdown / time pressure, and — critically —
 * never claims the account is "secure" merely because setup completed. Copy is
 * deliberately accurate: a second factor reduces risk, it does not make an
 * account unbreakable, and SMS/email are described as options with tradeoffs
 * (the app supplies the tradeoff text), never recommended as universally safe.
 * Clean-room original; a sibling of PasskeySetupFlow with no overlapping code.
 * ----------------------------------------------------------------------- */

/**
 * The kind of second factor being set up. The component renders each honestly;
 * it does not rank them or imply one is universally best. Use `custom` for a
 * factor the component doesn't model, and pass its copy via `methods`.
 */
export type TwoFactorMethodKind =
  | "authenticator"
  | "security-key"
  | "sms"
  | "email"
  | "recovery-codes"
  | "custom";

/** App-supplied descriptor for one selectable factor. */
export interface TwoFactorMethod {
  kind: TwoFactorMethodKind;
  /** Short label, e.g. "Authenticator app". */
  label: string;
  /** One-line description of how it works. */
  description?: string;
  /** Honest tradeoff note the APP supplies (e.g. "SMS can be intercepted"). */
  tradeoff?: string;
  /** The app marks a factor unusable here (unsupported device, not configured). */
  unavailable?: boolean;
  /** Why it's unavailable — shown so the choice isn't a dead end. */
  unavailableReason?: string;
  /** Marks the app's suggested default; never implies "most secure". */
  recommended?: boolean;
}

/**
 * App-driven phases. Every transition is owned by the host app (it advances the
 * flow only after the real operation resolves).
 */
export type TwoFactorState =
  | "introduction"
  | "method-selection"
  | "preparing"
  | "secret-or-QR-ready"
  | "waiting-for-code"
  | "verifying"
  | "success"
  | "invalid-code"
  | "expired-code"
  | "method-unavailable"
  | "cancelled"
  | "recovery-codes"
  | "complete";

/** Honest, app-supplied error detail. No error is invented by the component. */
export interface TwoFactorError {
  /** Machine code from the app (e.g. "code_mismatch", "code_expired"). */
  code?: string;
  /** Short human title; falls back to a neutral default per state. */
  title?: string;
  /** The specific detail the user needs to understand and act on. */
  message: string;
}

/**
 * Enrollment material the APP prepared for the chosen factor. The component only
 * displays what it is given; it never generates any of this. In production the
 * secret is real setup data — treat it as sensitive. In demos it MUST be a
 * clearly-fake placeholder.
 */
export interface TwoFactorSetupData {
  /** A pre-rendered QR image (data URL / URL) the app produced. Optional. */
  qrImageUrl?: string;
  /** Custom QR node (e.g. an <svg>) if the app renders its own. Optional. */
  qrNode?: React.ReactNode;
  /** The manual-entry setup key, shown as a fallback to scanning. */
  setupKey?: string;
  /** The account/issuer label shown alongside the key, e.g. "Acme (ada@…)". */
  accountLabel?: string;
  /** Where a delivered code was sent (masked), e.g. "•••• 4417" or "a…@x.com". */
  deliveryTarget?: string;
  /** Digits the verification input expects (default 6). */
  codeLength?: number;
}

export interface TwoFactorSetupFlowProps {
  /** Controlled, app-owned phase. The app advances this after each real step. */
  state: TwoFactorState;
  /** Factors the user may choose from. */
  methods?: TwoFactorMethod[];
  /** Controlled selected factor kind. */
  selectedMethod?: TwoFactorMethodKind;
  defaultSelectedMethod?: TwoFactorMethodKind;
  /** Controlled verification-code value (the only sensitive input collected). */
  code?: string;
  defaultCode?: string;
  /** App-supplied error, shown verbatim on invalid/expired/unavailable states. */
  error?: TwoFactorError | null;
  /** Enrollment material the app prepared; never generated here. */
  setupData?: TwoFactorSetupData;
  /**
   * One-time recovery codes the app issued. SENSITIVE: shown only on the
   * `recovery-codes` state, rendered selectable, never copied automatically,
   * and never sent to analytics by this component.
   */
  recoveryCodes?: string[];
  /** The app/site the factor protects, e.g. "Acme". */
  relyingPartyName?: string;
  /** Account context (e.g. an email) for reassurance. Never a secret. */
  userIdentifier?: string;
  /** Label for the always-available alternative factor path. */
  alternativeLabel?: string;
  /** App-driven: an operation is in flight (disables the primary control). */
  busy?: boolean;
  /** The chosen factor changed. */
  onMethodChange?: (method: TwoFactorMethodKind) => void;
  /** Begin setup for the chosen factor (the app then prepares the secret). */
  onBegin?: () => void;
  /** Submit the entered code for the app to verify. Never verified here. */
  onVerify?: (code: string) => void;
  /** Ask the app to re-send / re-issue a delivered or expired code. */
  onResend?: () => void;
  /** Abandon the in-flight setup. */
  onCancel?: () => void;
  /** Try the current step again after a failure. */
  onRetry?: () => void;
  /** Switch to a different factor instead. Always offered. */
  onUseAlternative?: () => void;
  /** The user copied the manual setup key (app may log the intent, never the key). */
  onCopySetupKey?: (key: string) => void;
  /** The user confirmed they saved their recovery codes (the gate to finishing). */
  onConfirmRecoveryCodes?: () => void;
  /** Acknowledge the completed, app-confirmed setup. */
  onComplete?: () => void;
  /** Accessible label for the region. */
  label?: string;
  className?: string;
}

/* -- step model ---------------------------------------------------------- */

const STEPS = ["Choose a method", "Scan or enter the key", "Verify a code", "Save recovery codes"] as const;

/** Which ordered step a state sits on (-1 = outside the linear flow). */
function stepIndex(state: TwoFactorState): number {
  switch (state) {
    case "introduction":
    case "method-selection":
    case "method-unavailable":
      return 0;
    case "preparing":
    case "secret-or-QR-ready":
      return 1;
    case "waiting-for-code":
    case "verifying":
    case "invalid-code":
    case "expired-code":
    case "cancelled":
      return 2;
    case "recovery-codes":
      return 3;
    case "success":
    case "complete":
      return 4; // past the last step
    default:
      return -1;
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

/** Layered-shield glyph — decorative; distinct from the passkey fingerprint. */
function ShieldKeyGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {P("M12 3 5 6v6c0 4.2 2.8 7.1 7 8.6 4.2-1.5 7-4.4 7-8.6V6l-7-3Z")}
      {P("M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z")}
      {P("M12 13.5V16")}
    </svg>
  );
}

interface MethodGlyphProps {
  kind: TwoFactorMethodKind;
  size?: number;
}
function MethodGlyph({ kind, size = 16 }: MethodGlyphProps) {
  const inner: Record<TwoFactorMethodKind, React.ReactNode> = {
    authenticator: <>{P("M7 3h10v18H7z")}{P("M11 18h2")}</>,
    "security-key": <>{P("M14 7a4 4 0 1 0-3 6.9V17l1.5 1.5L15 17l-1.5-1.5L15 14l-1-1")}</>,
    sms: <>{P("M4 5h16v11H8l-4 3z")}{P("M8 10h8M8 13h5")}</>,
    email: <>{P("M4 6h16v12H4z")}{P("M4 7l8 6 8-6")}</>,
    "recovery-codes": <>{P("M6 4h9l3 3v13H6z")}{P("M9 12h6M9 15h6M9 9h3")}</>,
    custom: <>{P("M12 3v18M3 12h18")}</>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {inner[kind]}
    </svg>
  );
}

interface StateCopy {
  title: string;
  body: string;
  announce: string;
  tone: StatusTone;
}

/* -- component ----------------------------------------------------------- */

const DEFAULT_METHODS: TwoFactorMethod[] = [
  { kind: "authenticator", label: "Authenticator app", description: "Codes from an app like a TOTP generator." },
];

export function TwoFactorSetupFlow({
  state,
  methods = DEFAULT_METHODS,
  selectedMethod,
  defaultSelectedMethod,
  code,
  defaultCode = "",
  error,
  setupData,
  recoveryCodes,
  relyingPartyName,
  userIdentifier,
  alternativeLabel = "Use a different method",
  busy = false,
  onMethodChange,
  onBegin,
  onVerify,
  onResend,
  onCancel,
  onRetry,
  onUseAlternative,
  onCopySetupKey,
  onConfirmRecoveryCodes,
  onComplete,
  label,
  className,
}: TwoFactorSetupFlowProps) {
  const reduce = useReducedMotion();

  const firstAvailable = methods.find((m) => !m.unavailable)?.kind ?? methods[0]?.kind ?? "authenticator";
  const [chosen, setChosen] = useControllableState<TwoFactorMethodKind>({
    value: selectedMethod,
    defaultValue: defaultSelectedMethod ?? firstAvailable,
    onChange: onMethodChange,
  });
  const [codeValue, setCodeValue] = useControllableState<string>({
    value: code,
    defaultValue: defaultCode,
    onChange: undefined,
  });
  const { copied, copy } = useCopy({ onCopy: onCopySetupKey });

  const [savedAck, setSavedAck] = React.useState(false);
  // Reset the recovery-code confirmation gate whenever we leave that state so a
  // stale acknowledgement can't finish a later setup.
  React.useEffect(() => {
    if (state !== "recovery-codes") setSavedAck(false);
  }, [state]);

  const codeInputRef = React.useRef<HTMLInputElement | null>(null);
  const errorId = React.useId();
  const codeFieldId = React.useId();
  const ackId = React.useId();

  const site = relyingPartyName ?? "this app";
  const active = stepIndex(state);
  const codeLength = setupData?.codeLength ?? 6;

  const selectedMeta = methods.find((m) => m.kind === chosen);
  const copyText: StateCopy = React.useMemo(
    () => stateCopy(state, site, selectedMeta, setupData),
    [state, site, selectedMeta, setupData],
  );

  // When a code input is present, focus it so the user can type immediately.
  // Otherwise we DON'T move focus to the (non-interactive) heading — some
  // environments draw a forced focus box around it — the phase change is
  // announced via the polite live region instead.
  React.useEffect(() => {
    if (!(state === "waiting-for-code" || state === "invalid-code" || state === "expired-code")) return;
    const id = requestAnimationFrame(() => codeInputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [state]);

  const showStepper = active >= 0;
  const regionLabel = label ?? `Set up two-factor authentication for ${site}`;
  const codeReady = codeValue.trim().length >= codeLength;

  const submitCode = () => {
    if (busy || !codeReady) return;
    onVerify?.(codeValue.trim());
  };

  const isErrorState = state === "invalid-code" || state === "expired-code" || state === "method-unavailable";

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
          <ShieldKeyGlyph />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Two-factor setup
          </p>
          <h3 className="truncate text-[15px] font-semibold leading-snug text-[var(--color-fg)]">
            {relyingPartyName ? `Add a second step to sign in to ${relyingPartyName}` : "Add a second sign-in step"}
          </h3>
          {userIdentifier ? (
            <p className="mt-0.5 truncate text-[12.5px] text-[var(--color-muted)]">For {userIdentifier}</p>
          ) : null}
        </div>
      </header>

      {/* ordered step semantics */}
      {showStepper ? (
        <ol role="list" aria-label="Setup steps" className="flex items-stretch gap-1 px-5 pt-4">
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
                  style={{ background: status === "upcoming" ? "var(--color-bg-secondary)" : statusVars(tone).color }}
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
                  <span className={cn("truncate", status === "upcoming" ? "text-[var(--color-muted)]" : "text-[var(--color-fg)]")}>
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
              <span className="mt-0.5 shrink-0" style={{ color: statusVars(copyText.tone).color }}>
                {state === "preparing" || state === "verifying" ? (
                  <Spinner reduce={reduce} />
                ) : (
                  <ToneIcon tone={copyText.tone} size={18} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-[15px] font-semibold leading-snug text-[var(--color-fg)]">
                  {copyText.title}
                </h4>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-muted)]">{copyText.body}</p>

                {/* method selection — a real radio group, keyboard-navigable */}
                {state === "method-selection" ? (
                  <div role="radiogroup" aria-label="Choose a second factor" className="mt-3 flex flex-col gap-2">
                    {methods.map((m) => {
                      const isSel = m.kind === chosen;
                      const disabled = !!m.unavailable;
                      return (
                        <button
                          key={m.kind}
                          type="button"
                          role="radio"
                          aria-checked={isSel}
                          aria-disabled={disabled || undefined}
                          disabled={disabled}
                          onClick={() => !disabled && setChosen(m.kind)}
                          className={cn(
                            "flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
                            disabled
                              ? "cursor-not-allowed opacity-55 [border:1px_solid_var(--color-border)]"
                              : isSel
                                ? "[border:1px_solid_var(--color-accent)]"
                                : "[border:1px_solid_var(--color-border)] hover:border-[var(--color-accent)]",
                          )}
                          style={isSel && !disabled ? { background: statusVars("active").bg } : undefined}
                        >
                          <span
                            className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md text-[var(--color-fg)]"
                            style={{ background: "var(--color-bg-secondary)" }}
                          >
                            <MethodGlyph kind={m.kind} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[13.5px] font-medium text-[var(--color-fg)]">{m.label}</span>
                              {m.recommended ? (
                                <span className="rounded-full px-1.5 py-px text-[10px] font-semibold text-[var(--color-accent)]" style={{ background: statusVars("active").bg }}>
                                  Suggested
                                </span>
                              ) : null}
                            </span>
                            {m.description ? (
                              <span className="mt-0.5 block text-[12px] leading-relaxed text-[var(--color-muted)]">{m.description}</span>
                            ) : null}
                            {m.tradeoff ? (
                              <span className="mt-1 flex items-start gap-1 text-[11.5px] leading-relaxed text-[var(--color-muted)]">
                                <span aria-hidden className="mt-px shrink-0" style={{ color: statusVars("warning").color }}>
                                  <ToneIcon tone="warning" size={11} />
                                </span>
                                {m.tradeoff}
                              </span>
                            ) : null}
                            {disabled && m.unavailableReason ? (
                              <span className="mt-1 block text-[11.5px] leading-relaxed" style={{ color: statusVars("warning").color }}>
                                {m.unavailableReason}
                              </span>
                            ) : null}
                          </span>
                          <span
                            aria-hidden
                            className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full"
                            style={{
                              border: `2px solid ${isSel && !disabled ? "var(--color-accent)" : "var(--color-border)"}`,
                            }}
                          >
                            {isSel && !disabled ? (
                              <span className="h-2 w-2 rounded-full" style={{ background: "var(--color-accent)" }} />
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {/* secret / QR ready — app-supplied material, never generated here */}
                {state === "secret-or-QR-ready" ? (
                  <div className="mt-3 flex flex-col gap-3">
                    {setupData?.qrNode || setupData?.qrImageUrl ? (
                      <div className="flex items-center gap-3 rounded-lg bg-[var(--color-bg-secondary)] p-3 [border:1px_solid_var(--color-border)]">
                        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-md bg-[var(--color-surface)] [border:1px_solid_var(--color-border)]">
                          {setupData.qrNode ?? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={setupData.qrImageUrl} alt="QR code to scan with your authenticator app" className="h-full w-full object-contain" />
                          )}
                        </div>
                        <p className="text-[12.5px] leading-relaxed text-[var(--color-muted)]">
                          Scan this with your authenticator app{setupData.accountLabel ? ` to add ${setupData.accountLabel}` : ""}.
                          Can&apos;t scan? Use the setup key below.
                        </p>
                      </div>
                    ) : null}

                    {setupData?.setupKey ? (
                      <div>
                        <p className="mb-1 text-[12px] font-medium text-[var(--color-fg)]">
                          Setup key <span className="font-normal text-[var(--color-muted)]">— sensitive, enter it only in your authenticator app</span>
                        </p>
                        <div className="flex items-center gap-2 rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 [border:1px_solid_var(--color-border)]">
                          <code className="min-w-0 flex-1 select-all break-all font-mono text-[12.5px] text-[var(--color-fg)]">
                            {setupData.setupKey}
                          </code>
                          <button
                            type="button"
                            onClick={() => copy(setupData.setupKey!)}
                            className="shrink-0 rounded-md px-2 py-1 text-[12px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                          >
                            {copied ? "Copied" : "Copy"}
                          </button>
                        </div>
                        <span role="status" aria-live="polite" className="sr-only">
                          {copied ? "Setup key copied to clipboard." : ""}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* delivery target for sms/email codes */}
                {(state === "waiting-for-code" || state === "invalid-code" || state === "expired-code") && setupData?.deliveryTarget ? (
                  <p className="mt-3 rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 text-[12.5px] text-[var(--color-fg)] [border:1px_solid_var(--color-border)]">
                    We sent a code to <span className="font-medium">{setupData.deliveryTarget}</span>.
                  </p>
                ) : null}

                {/* code entry — normal input; paste + autofill handled by the platform */}
                {(state === "waiting-for-code" || state === "invalid-code" || state === "expired-code") ? (
                  <div className="mt-3">
                    <label htmlFor={codeFieldId} className="mb-1 block text-[12px] font-medium text-[var(--color-fg)]">
                      Enter the {codeLength}-digit code
                    </label>
                    <input
                      id={codeFieldId}
                      ref={codeInputRef}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]*"
                      maxLength={codeLength + 2}
                      value={codeValue}
                      disabled={busy || state === "expired-code"}
                      aria-invalid={isErrorState || undefined}
                      aria-describedby={isErrorState && error ? errorId : undefined}
                      onChange={(e) => setCodeValue(e.target.value.replace(/[^\d]/g, ""))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && codeReady && !busy) {
                          e.preventDefault();
                          submitCode();
                        }
                      }}
                      placeholder={"0".repeat(codeLength)}
                      spellCheck={false}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-[15px] tracking-[0.3em] text-[var(--color-fg)] outline-none placeholder:text-[var(--color-muted)] placeholder:tracking-[0.3em] focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                ) : null}

                {/* honest error detail, associated with the input / retry control */}
                {isErrorState && error ? (
                  <div
                    role="alert"
                    className="mt-3 rounded-lg px-3 py-2.5 text-[12.5px]"
                    style={{ background: statusVars("error").bg, border: `1px solid ${statusVars("error").border}` }}
                  >
                    <p className="flex items-center gap-1.5 font-semibold" style={{ color: statusVars("error").color }}>
                      <ToneIcon tone="error" size={13} />
                      {error.title ?? defaultErrorTitle(state)}
                    </p>
                    <p id={errorId} className="mt-1 leading-relaxed text-[var(--color-fg)]">
                      {error.message}
                    </p>
                    {error.code ? (
                      <p className="mt-1 font-mono text-[11px] text-[var(--color-muted)]">Reason: {error.code}</p>
                    ) : null}
                  </div>
                ) : null}

                {/* recovery codes — SENSITIVE; selectable; confirmation-gated */}
                {state === "recovery-codes" ? (
                  <div className="mt-3 flex flex-col gap-3">
                    <div
                      className="rounded-lg px-3 py-2.5 text-[12.5px] leading-relaxed"
                      style={{ background: statusVars("warning").bg, border: `1px solid ${statusVars("warning").border}` }}
                    >
                      <p className="flex items-center gap-1.5 font-semibold" style={{ color: statusVars("warning").color }}>
                        <ToneIcon tone="warning" size={13} />
                        Save these recovery codes now
                      </p>
                      <p className="mt-1 text-[var(--color-fg)]">
                        Each code works once if you lose access to your second factor. Store them somewhere safe and private
                        — they won&apos;t be shown in full again.
                      </p>
                    </div>
                    {recoveryCodes && recoveryCodes.length > 0 ? (
                      <ul
                        aria-label="Recovery codes"
                        className="grid grid-cols-2 gap-1.5 rounded-lg bg-[var(--color-bg-secondary)] p-3 font-mono text-[12.5px] [border:1px_solid_var(--color-border)]"
                      >
                        {recoveryCodes.map((rc, i) => (
                          <li key={i} className="select-all break-all text-[var(--color-fg)]">
                            {rc}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <label htmlFor={ackId} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-[var(--color-fg)]">
                      <input
                        id={ackId}
                        type="checkbox"
                        checked={savedAck}
                        onChange={(e) => setSavedAck(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
                      />
                      I&apos;ve saved my recovery codes somewhere safe.
                    </label>
                  </div>
                ) : null}

                {/* introduction — honest framing, no security absolutes */}
                {state === "introduction" ? (
                  <ul className="mt-3 flex flex-col gap-1.5 text-[12.5px] text-[var(--color-muted)]">
                    <li className="flex items-start gap-1.5">
                      <span className="mt-0.5 shrink-0 text-[var(--color-success)]"><ToneIcon tone="success" size={12} /></span>
                      A second step means a stolen password alone isn&apos;t enough to sign in.
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="mt-0.5 shrink-0 text-[var(--color-muted)]"><ToneIcon tone="info" size={12} /></span>
                      It lowers risk — no method removes it entirely. Keep a recovery option too.
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
        {state === "preparing" || state === "verifying" ? (
          <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--color-muted)]">
            <Spinner reduce={reduce} />
            {state === "preparing" ? "Preparing your setup…" : "Checking your code…"}
          </span>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {/* escape hatch — low emphasis, left; offered before completion */}
          {state !== "success" && state !== "complete" && state !== "recovery-codes" && onUseAlternative ? (
            <GhostButton onClick={() => onUseAlternative()}>{alternativeLabel}</GhostButton>
          ) : null}

          {/* right-aligned action cluster: secondary first, primary rightmost */}
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            {(state === "waiting-for-code" || state === "invalid-code") && onResend ? (
              <SecondaryButton onClick={() => onResend()}>Resend code</SecondaryButton>
            ) : null}

            {(state === "preparing" || state === "secret-or-QR-ready" || state === "waiting-for-code" || state === "verifying" || state === "invalid-code" || state === "expired-code") && onCancel ? (
              <SecondaryButton onClick={() => onCancel()}>Cancel</SecondaryButton>
            ) : null}

            {state === "introduction" ? (
              <PrimaryButton onClick={() => onBegin?.()} busy={busy}>
                Get started
              </PrimaryButton>
            ) : null}

            {state === "method-selection" ? (
              <PrimaryButton onClick={() => onBegin?.()} busy={busy} disabled={!!selectedMeta?.unavailable}>
                Continue
              </PrimaryButton>
            ) : null}

            {state === "secret-or-QR-ready" ? (
              <PrimaryButton onClick={() => onBegin?.()} busy={busy}>
                I&apos;ve added it — enter a code
              </PrimaryButton>
            ) : null}

            {(state === "waiting-for-code" || state === "invalid-code") ? (
              <PrimaryButton
                onClick={submitCode}
                busy={busy}
                disabled={!codeReady}
                aria-describedby={state === "invalid-code" && error ? errorId : undefined}
              >
                Verify
              </PrimaryButton>
            ) : null}

            {state === "expired-code" ? (
              <PrimaryButton onClick={() => onResend?.()} busy={busy}>
                Send a new code
              </PrimaryButton>
            ) : null}

            {state === "method-unavailable" ? (
              <PrimaryButton onClick={() => onRetry?.()} busy={busy}>
                Choose another method
              </PrimaryButton>
            ) : null}

            {state === "success" ? (
              <PrimaryButton onClick={() => onComplete?.()}>
                {recoveryCodes && recoveryCodes.length > 0 ? "Continue" : "Done"}
              </PrimaryButton>
            ) : null}

            {state === "recovery-codes" ? (
              <PrimaryButton onClick={() => onConfirmRecoveryCodes?.()} disabled={!savedAck} aria-describedby={ackId}>
                Finish setup
              </PrimaryButton>
            ) : null}

            {state === "complete" ? <PrimaryButton onClick={() => onComplete?.()}>Done</PrimaryButton> : null}

            {state === "cancelled" ? <PrimaryButton onClick={() => onRetry?.()}>Try again</PrimaryButton> : null}
          </div>
        </div>

        {/* honest, non-absolute completion note — never "your account is secure" */}
        {state === "success" || state === "complete" ? (
          <p className="text-[12px] leading-relaxed text-[var(--color-muted)]">
            Two-factor is on for this account. It reduces risk but doesn&apos;t make the account impossible to breach —
            keep your recovery codes and password safe.
          </p>
        ) : null}

        {state === "method-unavailable" ? (
          <p className="text-[12px] leading-relaxed text-[var(--color-muted)]">
            This method isn&apos;t available right now, but your account isn&apos;t blocked — pick another method above.
          </p>
        ) : null}
      </div>

      {/* polite live region — status in text, never colour alone, no countdown */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}
      >
        {copyText.announce}
      </div>
    </section>
  );
}

/* -- phase copy ---------------------------------------------------------- */

function defaultErrorTitle(state: TwoFactorState): string {
  switch (state) {
    case "invalid-code":
      return "That code didn't match";
    case "expired-code":
      return "That code has expired";
    case "method-unavailable":
      return "This method isn't available";
    default:
      return "Something went wrong";
  }
}

function stateCopy(
  state: TwoFactorState,
  site: string,
  method?: TwoFactorMethod,
  setupData?: TwoFactorSetupData,
): StateCopy {
  const methodLabel = method?.label?.toLowerCase() ?? "second factor";
  switch (state) {
    case "introduction":
      return {
        title: "Add a second step to sign in",
        body: `After your password, ${site} will ask for a second confirmation. It only takes a minute to set up.`,
        announce: "Two-factor setup started. Review what it does, then continue.",
        tone: "active",
      };
    case "method-selection":
      return {
        title: "Choose how you'll confirm",
        body: "Pick the method that fits you. Each has different tradeoffs — you can change or add more later.",
        announce: "Choose a second factor to set up.",
        tone: "active",
      };
    case "preparing":
      return {
        title: "Preparing your setup",
        body: `Setting up your ${methodLabel}. This takes a moment.`,
        announce: "Preparing your two-factor setup.",
        tone: "active",
      };
    case "secret-or-QR-ready":
      return {
        title: setupData?.deliveryTarget ? "We sent you a code" : "Add this to your app",
        body: setupData?.deliveryTarget
          ? "Enter the code we sent to finish connecting this method."
          : "Scan the QR code with your authenticator app, or enter the setup key manually. Then continue to verify.",
        announce: "Setup material is ready. Add it to your authenticator, then verify a code.",
        tone: "info",
      };
    case "waiting-for-code":
      return {
        title: "Enter a code to confirm",
        body: "Type the current code from your method. There's no rush — enter it whenever you're ready.",
        announce: "Enter a verification code to confirm your second factor.",
        tone: "active",
      };
    case "verifying":
      return {
        title: "Checking your code",
        body: "Confirming the code with your account.",
        announce: "Checking your verification code.",
        tone: "active",
      };
    case "success":
      return {
        title: "Second factor added",
        body: `${site} will now ask for this step when you sign in. It lowers risk — it doesn't make the account impossible to breach.`,
        announce: "Your second factor was added successfully.",
        tone: "success",
      };
    case "invalid-code":
      return {
        title: "That code didn't match",
        body: "Double-check the current code and try again. Codes change often, so make sure you're using the latest one.",
        announce: "The code didn't match. Enter the current code and try again.",
        tone: "error",
      };
    case "expired-code":
      return {
        title: "That code has expired",
        body: "Codes are only valid briefly. Request a new one, then enter it here.",
        announce: "The code expired. Request a new code and try again.",
        tone: "warning",
      };
    case "method-unavailable":
      return {
        title: "This method isn't available",
        body: "We couldn't set up this method right now. You can choose another — your account isn't blocked.",
        announce: "This method is unavailable. Choose another method.",
        tone: "warning",
      };
    case "cancelled":
      return {
        title: "Setup cancelled",
        body: "Nothing was changed. You can set up a second step whenever you like.",
        announce: "Two-factor setup was cancelled. Nothing was saved.",
        tone: "neutral",
      };
    case "recovery-codes":
      return {
        title: "Save your recovery codes",
        body: "These are your way back in if you lose your second factor. Save them before you finish.",
        announce: "Save your recovery codes to finish setup.",
        tone: "warning",
      };
    case "complete":
      return {
        title: "You're all set",
        body: `Two-factor is on for ${site}. Keep your recovery codes and password safe.`,
        announce: "Two-factor setup is complete.",
        tone: "success",
      };
    default:
      return { title: "Two-factor setup", body: "", announce: "", tone: "neutral" };
  }
}

/* -- controls ------------------------------------------------------------ */

interface PrimaryButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  busy?: boolean;
  disabled?: boolean;
  tone?: StatusTone;
  "aria-describedby"?: string;
}

function PrimaryButton({ onClick, children, busy, disabled, tone = "active", ...rest }: PrimaryButtonProps) {
  const v = statusVars(tone);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
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

// Low-emphasis "escape hatch" action (e.g. "Use a different method") — a quiet
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

export default TwoFactorSetupFlow;
