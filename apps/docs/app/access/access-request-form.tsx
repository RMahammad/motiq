"use client";

import { useId, useState } from "react";

import { track } from "../../lib/analytics";
import type { WaitlistPack, WaitlistTeamSize } from "../../lib/server/waitlist";

type FormState = "idle" | "loading" | "success" | "error" | "duplicate";

const PACK_OPTIONS: { value: WaitlistPack; label: string }[] = [
  { value: "ai-interface", label: "AI Interface Pack" },
  { value: "developer-tools", label: "Developer Tools Pack" },
  { value: "collaboration", label: "Collaboration Pack" },
  { value: "data-motion", label: "Data Motion Pack" },
  { value: "complete", label: "Complete catalog" },
];

const TEAM_SIZE_OPTIONS: { value: WaitlistTeamSize; label: string }[] = [
  { value: "solo", label: "Just me" },
  { value: "2-10", label: "2–10" },
  { value: "11-50", label: "11–50" },
  { value: "50+", label: "50+" },
];

const fieldClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5 text-[14px] text-[var(--color-fg)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40";
const labelClass = "mb-1.5 block text-[13px] font-medium text-[var(--color-fg)]";
const hintClass = "mt-1 text-[12px] text-[var(--color-muted)]";

export function AccessRequestForm({
  preselectedPack,
  component,
  consentRequired,
  privacyUrl,
  submitLabel = "Request access",
}: {
  preselectedPack?: WaitlistPack;
  component?: string;
  consentRequired: boolean;
  privacyUrl?: string;
  submitLabel?: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [intendedUse, setIntendedUse] = useState("");
  const [interestedPack, setInterestedPack] = useState<WaitlistPack | "">(preselectedPack ?? "");
  const [teamSize, setTeamSize] = useState<WaitlistTeamSize | "">("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);

  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const ids = {
    email: useId(),
    emailErr: useId(),
    name: useId(),
    intendedUse: useId(),
    pack: useId(),
    teamSize: useId(),
    message: useId(),
    consent: useId(),
    formErr: useId(),
  };

  const [emailInvalid, setEmailInvalid] = useState(false);
  const [consentInvalid, setConsentInvalid] = useState(false);

  const loading = state === "loading";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Client-side gate (server re-validates authoritatively).
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const consentOk = !consentRequired || consent;
    setEmailInvalid(!emailOk);
    setConsentInvalid(!consentOk);
    if (!emailOk || !consentOk) {
      setState("error");
      setErrorMessage(
        !emailOk ? "Enter a valid email address." : "Please agree to the privacy terms to continue.",
      );
      return;
    }

    setState("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          intendedUse: intendedUse.trim() || undefined,
          interestedPack: interestedPack || undefined,
          teamSize: teamSize || undefined,
          message: message.trim() || undefined,
          consent,
        }),
      });

      const data: { status?: string; message?: string } = await res
        .json()
        .catch(() => ({}) as { status?: string; message?: string });

      if (data.status === "success") {
        track("waitlist_submitted", { pack: interestedPack || "none" });
        setState("success");
        return;
      }
      if (data.status === "duplicate") {
        setState("duplicate");
        return;
      }
      setState("error");
      setErrorMessage(data.message || "Something went wrong. Please try again.");
    } catch {
      setState("error");
      setErrorMessage("Network error. Please check your connection and try again.");
    }
  }

  if (state === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6"
      >
        <h2 className="text-[18px] font-semibold text-[var(--color-fg)]">Request recorded</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">
          Thanks — your access request was recorded locally in development. This preview does not send data to any
          external system, so nothing was emailed or stored in a third-party service.
        </p>
      </div>
    );
  }

  if (state === "duplicate") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6"
      >
        <h2 className="text-[18px] font-semibold text-[var(--color-fg)]">You’re already on the list</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">
          This email has already requested access in this development session. No need to submit again.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {component ? (
        <input type="hidden" name="component" value={component} readOnly />
      ) : null}

      {/* Form-level error (non-field, e.g. network) */}
      {state === "error" && errorMessage && !emailInvalid && !consentInvalid ? (
        <p
          id={ids.formErr}
          role="alert"
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5 text-[13px] text-[var(--color-fg)]"
        >
          {errorMessage}
        </p>
      ) : null}

      <div>
        <label htmlFor={ids.email} className={labelClass}>
          Email <span className="text-[var(--color-accent)]">*</span>
        </label>
        <input
          id={ids.email}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailInvalid) setEmailInvalid(false);
          }}
          aria-invalid={emailInvalid || undefined}
          aria-describedby={emailInvalid ? ids.emailErr : undefined}
          className={fieldClass}
          placeholder="you@company.com"
        />
        {emailInvalid ? (
          <p id={ids.emailErr} role="alert" className="mt-1 text-[12px] text-[var(--color-accent)]">
            {errorMessage || "Enter a valid email address."}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={ids.name} className={labelClass}>
          Name <span className="font-normal text-[var(--color-muted)]">(optional)</span>
        </label>
        <input
          id={ids.name}
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor={ids.intendedUse} className={labelClass}>
          What are you building? <span className="font-normal text-[var(--color-muted)]">(optional)</span>
        </label>
        <input
          id={ids.intendedUse}
          type="text"
          value={intendedUse}
          onChange={(e) => setIntendedUse(e.target.value)}
          maxLength={300}
          className={fieldClass}
          placeholder="e.g. an AI agent dashboard"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.pack} className={labelClass}>
            Interested in <span className="font-normal text-[var(--color-muted)]">(optional)</span>
          </label>
          <select
            id={ids.pack}
            value={interestedPack}
            onChange={(e) => setInterestedPack(e.target.value as WaitlistPack | "")}
            className={fieldClass}
          >
            <option value="">No preference</option>
            {PACK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={ids.teamSize} className={labelClass}>
            Team size <span className="font-normal text-[var(--color-muted)]">(optional)</span>
          </label>
          <select
            id={ids.teamSize}
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value as WaitlistTeamSize | "")}
            className={fieldClass}
          >
            <option value="">Prefer not to say</option>
            {TEAM_SIZE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={ids.message} className={labelClass}>
          Anything else? <span className="font-normal text-[var(--color-muted)]">(optional)</span>
        </label>
        <textarea
          id={ids.message}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
          rows={4}
          className={`${fieldClass} resize-y`}
          placeholder="Context, questions, or how you heard about us."
        />
      </div>

      {consentRequired ? (
        <div>
          <label htmlFor={ids.consent} className="flex items-start gap-2.5 text-[13px] text-[var(--color-muted)]">
            <input
              id={ids.consent}
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (consentInvalid) setConsentInvalid(false);
              }}
              aria-invalid={consentInvalid || undefined}
              aria-describedby={consentInvalid ? ids.formErr : undefined}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
            />
            <span>
              I agree to be contacted about my access request
              {privacyUrl ? (
                <>
                  {" "}
                  and to the{" "}
                  <a
                    href={privacyUrl}
                    className="text-[var(--color-fg)] underline underline-offset-2 hover:text-[var(--color-accent)]"
                  >
                    privacy policy
                  </a>
                </>
              ) : null}
              . <span className="text-[var(--color-accent)]">*</span>
            </span>
          </label>
          {consentInvalid ? (
            <p id={ids.formErr} role="alert" className="mt-1 text-[12px] text-[var(--color-accent)]">
              {errorMessage || "Please agree to continue."}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-1 flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-[14px] font-medium text-[var(--color-accent-contrast,#fff)] transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending…" : state === "error" ? "Try again" : submitLabel}
        </button>
        {loading ? (
          <span aria-live="polite" className="text-[13px] text-[var(--color-muted)]">
            Submitting your request…
          </span>
        ) : null}
      </div>

      <p className={hintClass}>
        Recorded locally in development — this preview does not store data in an external system.
      </p>
    </form>
  );
}
