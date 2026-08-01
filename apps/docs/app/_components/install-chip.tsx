"use client";

import * as React from "react";

/**
 * Compact one-click install command (homepage pack cards). Displays the short
 * extensionless form; copies the full canonical command from `installCommand()`.
 */
export function InstallChip({ command, display }: { command: string; display: string }) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(command);
          setCopied(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard unavailable — the visible command is still selectable */
        }
      }}
      aria-label={`Copy install command: ${command}`}
      className="group/install flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3.5 text-left font-mono text-[12px] text-[var(--color-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg-secondary)]"
    >
      <span className="truncate">
        npx shadcn add <span className="font-medium text-[var(--color-accent-text)]">{display}</span>
      </span>
      <span className="ml-auto shrink-0" aria-hidden>
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[var(--color-success)]">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[var(--color-subtle)]">
            <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
            <path d="M5 15V5a1 1 0 011-1h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <span className="sr-only" role="status">{copied ? "Copied" : ""}</span>
    </button>
  );
}
