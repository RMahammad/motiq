"use client";

import * as React from "react";

import { track, type AnalyticsEvent } from "../../lib/analytics";

export function CopyButton({
  text,
  label = "Copy",
  className,
  trackEvent,
  trackProps,
}: {
  text: string;
  label?: string;
  className?: string;
  /** Optional analytics event fired on a successful copy (serializable — safe from Server Components). */
  trackEvent?: AnalyticsEvent;
  trackProps?: Record<string, string>;
}) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          if (trackEvent) track(trackEvent, trackProps);
          setTimeout(() => setCopied(false), 1400);
        });
      }}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)]"
      }
      aria-label={copied ? "Copied" : label}
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}

export function CodeBlock({ code, lang = "tsx" }: { code: string; lang?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-code-bg)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-1.5">
        <span className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono text-[var(--color-code-fg)]">{code}</code>
      </pre>
    </div>
  );
}

export function InstallCommand({ command, trackEvent, trackProps }: { command: string; trackEvent?: AnalyticsEvent; trackProps?: Record<string, string> }) {
  return (
    <div className="flex items-center justify-between gap-3 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-code-bg)] px-3 py-2">
      <code className="overflow-x-auto whitespace-nowrap font-mono text-[13px] text-[var(--color-code-fg)]">
        {command}
      </code>
      <CopyButton text={command} trackEvent={trackEvent} trackProps={trackProps} />
    </div>
  );
}
