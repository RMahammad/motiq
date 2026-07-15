"use client";

import * as React from "react";

import { LivePresenceStack, type PresenceUser } from "@/registry/collaboration/live-presence-stack";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL LivePresenceStack in one
 * representative populated state — a full avatar cluster with mixed live statuses,
 * inside a minimal document-header context so the card top is meaningful. No
 * Join/Leave/Change-status controls; the detail popover stays interactive on hover/click.
 */

/* Clearly fictional demo participants — no real people or companies. */
const ROSTER: PresenceUser[] = [
  { id: "u-ada", name: "Ada L.", status: "editing" },
  { id: "u-kit", name: "Kit M.", status: "active" },
  { id: "u-ravi", name: "Ravi P.", status: "viewing" },
  { id: "u-noor", name: "Noor S.", status: "idle" },
  { id: "u-tom", name: "Tomás V.", status: "active" },
];

export function LivePresenceStackCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[460px]">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-semibold text-[var(--color-fg)]">
              Q3 launch plan
            </span>
            <span className="block text-[12px] text-[var(--color-muted)]">Shared workspace · autosaved</span>
          </span>
          <span className="ml-auto">
            <LivePresenceStack users={ROSTER} max={5} />
          </span>
        </div>
        <div className="space-y-2.5 px-4 py-5">
          <div className="h-2.5 w-2/3 rounded-full bg-[var(--color-bg-secondary)]" />
          <div className="h-2.5 w-full rounded-full bg-[var(--color-bg-secondary)]" />
          <div className="h-2.5 w-5/6 rounded-full bg-[var(--color-bg-secondary)]" />
        </div>
      </div>
    </div>
  );
}

export default LivePresenceStackCatalogPreview;
