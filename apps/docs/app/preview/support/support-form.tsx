"use client";

import { useId, useState } from "react";

import type { SupportCategory } from "../../../lib/server/support";

type FormState = "idle" | "loading" | "success" | "error";

const CATEGORY_OPTIONS: { value: SupportCategory; label: string }[] = [
  { value: "installation-failure", label: "Installation failure" },
  { value: "registry-auth", label: "Registry authentication" },
  { value: "component-bug", label: "Component bug" },
  { value: "accessibility", label: "Accessibility issue" },
  { value: "documentation", label: "Documentation problem" },
  { value: "missing-state", label: "Missing state / variant" },
  { value: "feature-request", label: "Feature request" },
  { value: "performance", label: "Performance issue" },
  { value: "account-token", label: "Account / access token" },
];

const fieldClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5 text-[14px] text-[var(--color-fg)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40";
const labelClass = "mb-1.5 block text-[13px] font-medium text-[var(--color-fg)]";
const hintClass = "mt-1 text-[12px] text-[var(--color-muted)]";

/** A prominent, always-visible warning shown beside sensitive free-text fields. */
function SensitiveWarning() {
  return (
    <p
      role="note"
      className="mt-1.5 flex items-start gap-2 rounded-lg border border-[var(--color-warning)] bg-[var(--color-warning-foreground)]/10 px-3 py-2 text-[12.5px] leading-relaxed text-[var(--color-fg)]"
    >
      <span aria-hidden="true">⚠️</span>
      <span>
        Do not paste tokens, secrets, API headers, private source, or sensitive data. Anything token-like is redacted
        before storage, but please scrub it yourself first.
      </span>
    </p>
  );
}

export function SupportForm() {
  const [category, setCategory] = useState<SupportCategory | "">("");
  const [componentOrPack, setComponentOrPack] = useState("");
  const [version, setVersion] = useState("");
  const [browser, setBrowser] = useState("");
  const [framework, setFramework] = useState("");
  const [errorSummary, setErrorSummary] = useState("");
  const [sanitizedLogs, setSanitizedLogs] = useState("");
  const [contactPermission, setContactPermission] = useState(false);

  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [categoryInvalid, setCategoryInvalid] = useState(false);
  const [summaryInvalid, setSummaryInvalid] = useState(false);

  const ids = {
    category: useId(),
    categoryErr: useId(),
    component: useId(),
    version: useId(),
    browser: useId(),
    framework: useId(),
    summary: useId(),
    summaryErr: useId(),
    logs: useId(),
    formErr: useId(),
  };

  const loading = state === "loading";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const categoryOk = category !== "";
    const summaryOk = errorSummary.trim().length > 0;
    setCategoryInvalid(!categoryOk);
    setSummaryInvalid(!summaryOk);
    if (!categoryOk || !summaryOk) {
      setState("error");
      setErrorMessage(!categoryOk ? "Please choose a category." : "Please describe the problem.");
      return;
    }

    setState("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          componentOrPack: componentOrPack.trim() || undefined,
          version: version.trim() || undefined,
          browser: browser.trim() || undefined,
          framework: framework.trim() || undefined,
          errorSummary: errorSummary.trim(),
          sanitizedLogs: sanitizedLogs.trim() || undefined,
          contactPermission,
        }),
      });

      const data: { status?: string; message?: string } = await res
        .json()
        .catch(() => ({}) as { status?: string; message?: string });

      if (res.ok && data.status === "success") {
        setState("success");
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
        <h2 className="text-[18px] font-semibold text-[var(--color-fg)]">Ticket recorded</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">
          Your support ticket was recorded locally in development. This preview does not send data to any external
          system — no email or third-party helpdesk was contacted.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {state === "error" && errorMessage && !categoryInvalid && !summaryInvalid ? (
        <p
          id={ids.formErr}
          role="alert"
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5 text-[13px] text-[var(--color-fg)]"
        >
          {errorMessage}
        </p>
      ) : null}

      <div>
        <label htmlFor={ids.category} className={labelClass}>
          What kind of problem? <span className="text-[var(--color-accent)]">*</span>
        </label>
        <select
          id={ids.category}
          required
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as SupportCategory | "");
            if (categoryInvalid) setCategoryInvalid(false);
          }}
          aria-invalid={categoryInvalid || undefined}
          aria-describedby={categoryInvalid ? ids.categoryErr : undefined}
          className={fieldClass}
        >
          <option value="">Choose a category…</option>
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {categoryInvalid ? (
          <p id={ids.categoryErr} role="alert" className="mt-1 text-[12px] text-[var(--color-accent)]">
            Please choose a category.
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.component} className={labelClass}>
            Component or pack <span className="font-normal text-[var(--color-muted)]">(optional)</span>
          </label>
          <input
            id={ids.component}
            type="text"
            value={componentOrPack}
            onChange={(e) => setComponentOrPack(e.target.value)}
            maxLength={120}
            className={fieldClass}
            placeholder="e.g. reveal-text"
          />
        </div>
        <div>
          <label htmlFor={ids.version} className={labelClass}>
            Version <span className="font-normal text-[var(--color-muted)]">(optional)</span>
          </label>
          <input
            id={ids.version}
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            maxLength={40}
            className={fieldClass}
            placeholder="e.g. 0.1.0"
          />
        </div>
        <div>
          <label htmlFor={ids.browser} className={labelClass}>
            Browser <span className="font-normal text-[var(--color-muted)]">(optional)</span>
          </label>
          <input
            id={ids.browser}
            type="text"
            value={browser}
            onChange={(e) => setBrowser(e.target.value)}
            maxLength={200}
            className={fieldClass}
            placeholder="e.g. Chrome 128"
          />
        </div>
        <div>
          <label htmlFor={ids.framework} className={labelClass}>
            Framework <span className="font-normal text-[var(--color-muted)]">(optional)</span>
          </label>
          <input
            id={ids.framework}
            type="text"
            value={framework}
            onChange={(e) => setFramework(e.target.value)}
            maxLength={40}
            className={fieldClass}
            placeholder="e.g. Next.js"
          />
        </div>
      </div>

      <div>
        <label htmlFor={ids.summary} className={labelClass}>
          Describe the problem <span className="text-[var(--color-accent)]">*</span>
        </label>
        <textarea
          id={ids.summary}
          required
          value={errorSummary}
          onChange={(e) => {
            setErrorSummary(e.target.value);
            if (summaryInvalid) setSummaryInvalid(false);
          }}
          maxLength={1000}
          rows={4}
          aria-invalid={summaryInvalid || undefined}
          aria-describedby={summaryInvalid ? ids.summaryErr : undefined}
          className={`${fieldClass} resize-y`}
          placeholder="What happened, and what did you expect?"
        />
        {summaryInvalid ? (
          <p id={ids.summaryErr} role="alert" className="mt-1 text-[12px] text-[var(--color-accent)]">
            Please describe the problem.
          </p>
        ) : null}
        <SensitiveWarning />
      </div>

      <div>
        <label htmlFor={ids.logs} className={labelClass}>
          Logs or error output <span className="font-normal text-[var(--color-muted)]">(optional)</span>
        </label>
        <textarea
          id={ids.logs}
          value={sanitizedLogs}
          onChange={(e) => setSanitizedLogs(e.target.value)}
          maxLength={4000}
          rows={6}
          className={`${fieldClass} resize-y font-mono text-[12.5px]`}
          placeholder="Paste relevant, non-sensitive log lines here."
        />
        <SensitiveWarning />
      </div>

      <label className="flex items-start gap-2.5 text-[13px] text-[var(--color-muted)]">
        <input
          type="checkbox"
          checked={contactPermission}
          onChange={(e) => setContactPermission(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
        />
        <span>You may contact me to follow up on this ticket.</span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-[14px] font-medium text-[var(--color-accent-contrast,#fff)] transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending…" : state === "error" ? "Try again" : "Submit ticket"}
        </button>
        {loading ? (
          <span aria-live="polite" className="text-[13px] text-[var(--color-muted)]">
            Recording your ticket…
          </span>
        ) : null}
      </div>

      <p className={hintClass}>
        Recorded locally in development — this preview does not store data in an external system. Token-like values
        are redacted server-side as a safety net.
      </p>
    </form>
  );
}
