"use client";

import { useId, useState } from "react";

import { SelectControl } from "../../_components/select-control";
import type {
  FeedbackCategory,
  WillingnessToUse,
  InterestInAccess,
  FeedbackTeamSize,
} from "../../../lib/feedback";

type FormState = "idle" | "loading" | "success" | "error";

const CATEGORY_OPTIONS: { value: FeedbackCategory; label: string }[] = [
  { value: "visual", label: "Visual / motion quality" },
  { value: "api", label: "Component API" },
  { value: "documentation", label: "Documentation" },
  { value: "installation", label: "Installation" },
  { value: "accessibility", label: "Accessibility" },
  { value: "performance", label: "Performance" },
  { value: "missing-state", label: "Missing state / variant" },
  { value: "feature-request", label: "Feature request" },
  { value: "bug", label: "Bug" },
];

const WILLINGNESS_OPTIONS: { value: WillingnessToUse; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
];

const INTEREST_OPTIONS: { value: InterestInAccess; label: string }[] = [
  { value: "free", label: "Free components only" },
  { value: "pack", label: "A workflow pack" },
  { value: "complete", label: "The complete catalog" },
  { value: "undecided", label: "Undecided" },
];

const TEAM_SIZE_OPTIONS: { value: FeedbackTeamSize; label: string }[] = [
  { value: "solo", label: "Just me" },
  { value: "2-10", label: "2–10" },
  { value: "11-50", label: "11–50" },
  { value: "50+", label: "50+" },
];

const RATING_DIMENSIONS = [
  { key: "usefulness", label: "Usefulness for your work" },
  { key: "visualQuality", label: "Visual & motion quality" },
  { key: "apiClarity", label: "API clarity & adaptability" },
  { key: "installation", label: "Installation experience" },
  { key: "documentation", label: "Documentation quality" },
  { key: "accessibility", label: "Accessibility" },
  { key: "performance", label: "Performance" },
] as const;

type RatingKey = (typeof RATING_DIMENSIONS)[number]["key"];

const fieldClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5 text-[14px] text-[var(--color-fg)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40";
const labelClass = "mb-1.5 block text-[13px] font-medium text-[var(--color-fg)]";
const hintClass = "mt-1 text-[12px] text-[var(--color-muted)]";
const legendClass = "text-[13px] font-medium text-[var(--color-fg)]";

/** Accessible 1–5 rating as a radiogroup of buttons; 0 = not answered. */
function RatingField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const groupId = useId();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span id={groupId} className="text-[13px] text-[var(--color-fg)]">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={groupId} className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${n} out of 5`}
              onClick={() => onChange(selected ? 0 : n)}
              className={`h-8 w-8 rounded-md border text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${
                selected
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-contrast,#fff)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-fg)] hover:border-[var(--color-accent)]"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PreviewFeedbackForm({ presetComponent }: { presetComponent?: string }) {
  const [componentOrPack, setComponentOrPack] = useState(presetComponent ?? "");
  const [category, setCategory] = useState<FeedbackCategory | "">("");
  const [message, setMessage] = useState("");

  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    usefulness: 0,
    visualQuality: 0,
    apiClarity: 0,
    installation: 0,
    documentation: 0,
    accessibility: 0,
    performance: 0,
  });

  const [missingState, setMissingState] = useState("");
  const [missingComponent, setMissingComponent] = useState("");
  const [productionBlocker, setProductionBlocker] = useState("");
  const [willingnessToUse, setWillingnessToUse] = useState<WillingnessToUse | "">("");
  const [interestInAccess, setInterestInAccess] = useState<InterestInAccess | "">("");

  const [productCategory, setProductCategory] = useState("");
  const [framework, setFramework] = useState("");
  const [applicationType, setApplicationType] = useState("");
  const [teamSizeRange, setTeamSizeRange] = useState<FeedbackTeamSize | "">("");
  const [wasInstalled, setWasInstalled] = useState(false);
  const [usedInRealProject, setUsedInRealProject] = useState(false);
  const [contactPermission, setContactPermission] = useState(false);

  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [categoryInvalid, setCategoryInvalid] = useState(false);
  const [messageInvalid, setMessageInvalid] = useState(false);

  const ids = {
    component: useId(),
    category: useId(),
    categoryErr: useId(),
    message: useId(),
    messageErr: useId(),
    missingState: useId(),
    missingComponent: useId(),
    productionBlocker: useId(),
    willingness: useId(),
    interest: useId(),
    productCategory: useId(),
    framework: useId(),
    applicationType: useId(),
    teamSize: useId(),
    formErr: useId(),
  };

  const loading = state === "loading";
  const setRating = (key: RatingKey, v: number) => setRatings((r) => ({ ...r, [key]: v }));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const categoryOk = category !== "";
    const messageOk = message.trim().length > 0;
    setCategoryInvalid(!categoryOk);
    setMessageInvalid(!messageOk);
    if (!categoryOk || !messageOk) {
      setState("error");
      setErrorMessage(!categoryOk ? "Please choose a topic." : "Please add a short message.");
      return;
    }

    setState("loading");
    setErrorMessage("");

    // Only non-zero ratings are sent.
    const ratingFields: Record<string, number> = {};
    for (const { key } of RATING_DIMENSIONS) {
      if (ratings[key] > 0) ratingFields[key] = ratings[key];
    }

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentOrPack: componentOrPack.trim() || undefined,
          category,
          message: message.trim(),
          ...ratingFields,
          missingState: missingState.trim() || undefined,
          missingComponent: missingComponent.trim() || undefined,
          productionBlocker: productionBlocker.trim() || undefined,
          willingnessToUse: willingnessToUse || undefined,
          interestInAccess: interestInAccess || undefined,
          productCategory: productCategory.trim() || undefined,
          framework: framework.trim() || undefined,
          applicationType: applicationType.trim() || undefined,
          teamSizeRange: teamSizeRange || undefined,
          wasInstalled,
          usedInRealProject,
          contactPermission,
        }),
      });

      const data: { status?: string; message?: string } = await res
        .json()
        .catch(() => ({}) as { status?: string; message?: string });

      if (res.ok && data.status === "success") {
        // Note: no `feedback_submitted` event exists in the analytics whitelist
        // (lib/analytics.ts), so we deliberately do not call track() here.
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
        <h2 className="text-[18px] font-semibold text-[var(--color-fg)]">Thanks for the feedback</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">
          Your feedback was recorded locally in development. This preview does not send data to any external
          system - nothing was emailed or stored in a third-party service.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {state === "error" && errorMessage && !categoryInvalid && !messageInvalid ? (
        <p
          id={ids.formErr}
          role="alert"
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5 text-[13px] text-[var(--color-fg)]"
        >
          {errorMessage}
        </p>
      ) : null}

      {/* Target + topic */}
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
          <label htmlFor={ids.category} className={labelClass}>
            Topic <span className="text-[var(--color-accent)]">*</span>
          </label>
          <SelectControl
            id={ids.category}
            value={category}
            onChange={(next) => {
              setCategory(next as FeedbackCategory | "");
              if (categoryInvalid) setCategoryInvalid(false);
            }}
            options={CATEGORY_OPTIONS}
            placeholder="Choose a topic…"
            invalid={categoryInvalid}
            aria-describedby={categoryInvalid ? ids.categoryErr : undefined}
            className={fieldClass}
          />
          {categoryInvalid ? (
            <p id={ids.categoryErr} role="alert" className="mt-1 text-[12px] text-[var(--color-accent)]">
              Please choose a topic.
            </p>
          ) : null}
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor={ids.message} className={labelClass}>
          Your feedback <span className="text-[var(--color-accent)]">*</span>
        </label>
        <textarea
          id={ids.message}
          required
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (messageInvalid) setMessageInvalid(false);
          }}
          maxLength={2000}
          rows={4}
          aria-invalid={messageInvalid || undefined}
          aria-describedby={messageInvalid ? ids.messageErr : undefined}
          className={`${fieldClass} resize-y`}
          placeholder="In your own words - what worked, what didn't."
        />
        {messageInvalid ? (
          <p id={ids.messageErr} role="alert" className="mt-1 text-[12px] text-[var(--color-accent)]">
            Please add a short message.
          </p>
        ) : (
          <p className={hintClass}>Your words only - never paste code, tokens, or API payloads.</p>
        )}
      </div>

      {/* Ratings */}
      <fieldset className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] p-4">
        <legend className={`${legendClass} px-1`}>Rate each dimension (optional, 1–5)</legend>
        {RATING_DIMENSIONS.map((d) => (
          <RatingField
            key={d.key}
            label={d.label}
            value={ratings[d.key]}
            onChange={(v) => setRating(d.key, v)}
          />
        ))}
      </fieldset>

      {/* Gaps */}
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor={ids.missingState} className={labelClass}>
            A state or variant you needed but was missing{" "}
            <span className="font-normal text-[var(--color-muted)]">(optional)</span>
          </label>
          <input
            id={ids.missingState}
            type="text"
            value={missingState}
            onChange={(e) => setMissingState(e.target.value)}
            maxLength={500}
            className={fieldClass}
            placeholder="e.g. a loading / empty state"
          />
        </div>
        <div>
          <label htmlFor={ids.missingComponent} className={labelClass}>
            A component you wish existed{" "}
            <span className="font-normal text-[var(--color-muted)]">(optional)</span>
          </label>
          <input
            id={ids.missingComponent}
            type="text"
            value={missingComponent}
            onChange={(e) => setMissingComponent(e.target.value)}
            maxLength={300}
            className={fieldClass}
            placeholder="e.g. a command palette"
          />
        </div>
        <div>
          <label htmlFor={ids.productionBlocker} className={labelClass}>
            What would block using this in production?{" "}
            <span className="font-normal text-[var(--color-muted)]">(optional)</span>
          </label>
          <input
            id={ids.productionBlocker}
            type="text"
            value={productionBlocker}
            onChange={(e) => setProductionBlocker(e.target.value)}
            maxLength={500}
            className={fieldClass}
            placeholder="e.g. bundle size, missing docs"
          />
        </div>
      </div>

      {/* Intent */}
      <fieldset className="flex flex-col gap-3">
        <legend className={legendClass} id={ids.willingness}>
          Would you use this in a real project?
        </legend>
        <div role="radiogroup" aria-labelledby={ids.willingness} className="flex flex-wrap gap-2">
          {WILLINGNESS_OPTIONS.map((o) => {
            const selected = willingnessToUse === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setWillingnessToUse(selected ? "" : o.value)}
                className={`rounded-lg border px-4 py-2 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${
                  selected
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-contrast,#fff)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-fg)] hover:border-[var(--color-accent)]"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor={ids.interest} className={labelClass}>
          Which access shape interests you?{" "}
          <span className="font-normal text-[var(--color-muted)]">(optional)</span>
        </label>
        <SelectControl
          id={ids.interest}
          value={interestInAccess}
          onChange={(next) => setInterestInAccess(next as InterestInAccess | "")}
          options={[{ value: "", label: "No preference" }, ...INTEREST_OPTIONS]}
          className={fieldClass}
        />
      </div>

      {/* Context */}
      <fieldset className="flex flex-col gap-5 rounded-xl border border-[var(--color-border)] p-4">
        <legend className={`${legendClass} px-1`}>About your work (optional)</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={ids.productCategory} className={labelClass}>
              Product category
            </label>
            <input
              id={ids.productCategory}
              type="text"
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
              maxLength={80}
              className={fieldClass}
              placeholder="e.g. developer tools"
            />
          </div>
          <div>
            <label htmlFor={ids.framework} className={labelClass}>
              Framework
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
          <div>
            <label htmlFor={ids.applicationType} className={labelClass}>
              Application type
            </label>
            <input
              id={ids.applicationType}
              type="text"
              value={applicationType}
              onChange={(e) => setApplicationType(e.target.value)}
              maxLength={80}
              className={fieldClass}
              placeholder="e.g. SaaS dashboard"
            />
          </div>
          <div>
            <label htmlFor={ids.teamSize} className={labelClass}>
              Team size
            </label>
            <SelectControl
              id={ids.teamSize}
              value={teamSizeRange}
              onChange={(next) => setTeamSizeRange(next as FeedbackTeamSize | "")}
              options={[{ value: "", label: "Prefer not to say" }, ...TEAM_SIZE_OPTIONS]}
              className={fieldClass}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <label className="flex items-start gap-2.5 text-[13px] text-[var(--color-muted)]">
            <input
              type="checkbox"
              checked={wasInstalled}
              onChange={(e) => setWasInstalled(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
            />
            <span>I actually installed this component from the registry.</span>
          </label>
          <label className="flex items-start gap-2.5 text-[13px] text-[var(--color-muted)]">
            <input
              type="checkbox"
              checked={usedInRealProject}
              onChange={(e) => setUsedInRealProject(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
            />
            <span>I used it in a real (non-throwaway) project.</span>
          </label>
        </div>
      </fieldset>

      <label className="flex items-start gap-2.5 text-[13px] text-[var(--color-muted)]">
        <input
          type="checkbox"
          checked={contactPermission}
          onChange={(e) => setContactPermission(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
        />
        <span>You may contact me to follow up on this feedback.</span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-[14px] font-medium text-[var(--color-accent-contrast,#fff)] transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending…" : state === "error" ? "Try again" : "Send feedback"}
        </button>
        {loading ? (
          <span aria-live="polite" className="text-[13px] text-[var(--color-muted)]">
            Recording your feedback…
          </span>
        ) : null}
      </div>

      <p className={hintClass}>
        Recorded locally in development - this preview does not store data in an external system.
      </p>
    </form>
  );
}
