"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

// Re-runs the Server Component (force-dynamic) so a pending purchase can be
// re-checked after webhook processing completes. No polling — an explicit action.
export function RefreshButton({ label = "Check again" }: { label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        setBusy(true);
        router.refresh();
        // Clear the busy state shortly after; the refreshed tree replaces this UI.
        setTimeout(() => setBusy(false), 1200);
      }}
      disabled={busy}
      className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)] disabled:opacity-60"
    >
      {busy ? "Checking…" : label}
    </button>
  );
}
