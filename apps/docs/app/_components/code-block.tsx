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

export function InstallCommand({
  command,
  label,
  trackEvent,
  trackProps,
}: {
  command: string;
  /** Optional caption above the command (e.g. which component installs). */
  label?: string;
  trackEvent?: AnalyticsEvent;
  trackProps?: Record<string, string>;
}) {
  return (
    <div className="w-full min-w-0">
      {label ? (
        <p className="mb-1.5 text-[12px] font-medium text-[var(--color-muted)]">{label}</p>
      ) : null}
      <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-code-bg)] py-2 pl-3 pr-2">
        {/* The full command is always present in the DOM and copied verbatim; on
            narrow viewports it scrolls horizontally inside this box (hidden bar)
            so the command is never clipped and the page never overflows. */}
        <span aria-hidden className="shrink-0 select-none font-mono text-[13px] text-[var(--color-muted)]">$</span>
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[13px] text-[var(--color-code-fg)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {command}
        </code>
        <CopyButton text={command} label="Copy" className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)]" trackEvent={trackEvent} trackProps={trackProps} />
      </div>
    </div>
  );
}
