"use client";

import * as React from "react";

import {
  LivePresenceStack,
  type PresenceStatus,
  type PresenceUser,
} from "@/registry/collaboration/live-presence-stack";

/* Clearly fictional demo participants — no real people or companies. */
const ROSTER: PresenceUser[] = [
  { id: "u-ada", name: "Ada L.", status: "editing" },
  { id: "u-kit", name: "Kit M.", status: "active" },
  { id: "u-ravi", name: "Ravi P.", status: "viewing" },
  { id: "u-noor", name: "Noor S.", status: "idle" },
  { id: "u-tom", name: "Tomás V.", status: "active" },
  { id: "u-mei", name: "Mei W.", status: "viewing" },
  { id: "u-juno", name: "Juno B.", status: "editing" },
];

const STATUSES: PresenceStatus[] = ["active", "editing", "viewing", "idle"];

const control =
  "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)] outline-none transition-colors hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

export function LivePresenceStackPreview() {
  const [users, setUsers] = React.useState<PresenceUser[]>(() => ROSTER.slice(0, 4));
  const nextRef = React.useRef(0);
  const [selected, setSelected] = React.useState<string | null>(null);

  const addUser = () => {
    setUsers((prev) => {
      if (prev.length >= ROSTER.length) return prev;
      const taken = new Set(prev.map((u) => u.id));
      const candidate = ROSTER.find((u) => !taken.has(u.id));
      return candidate ? [...prev, candidate] : prev;
    });
  };

  const removeUser = () => {
    setUsers((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const cycleStatus = () => {
    setUsers((prev) => {
      if (prev.length === 0) return prev;
      const idx = nextRef.current % prev.length;
      nextRef.current += 1;
      return prev.map((u, i) => {
        if (i !== idx) return u;
        const nextStatus = STATUSES[(STATUSES.indexOf(u.status) + 1) % STATUSES.length];
        return { ...u, status: nextStatus };
      });
    });
  };

  const selectedName = users.find((u) => u.id === selected)?.name;

  return (
    <div className="flex w-full max-w-[520px] flex-col gap-5">
      {/* realistic document toolbar */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 4h11l5 5v11a0 0 0 0 1 0 0H4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M14 4v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-semibold text-[var(--color-fg)]">
              Q3 launch plan
            </span>
            <span className="block text-[12px] text-[var(--color-muted)]">Shared workspace · autosaved</span>
          </span>
          <span className="ml-auto">
            <LivePresenceStack users={users} max={5} onSelect={setSelected} />
          </span>
        </div>
        <div className="space-y-2.5 px-4 py-5">
          <div className="h-2.5 w-2/3 rounded-full bg-[var(--color-bg-secondary)]" />
          <div className="h-2.5 w-full rounded-full bg-[var(--color-bg-secondary)]" />
          <div className="h-2.5 w-5/6 rounded-full bg-[var(--color-bg-secondary)]" />
          <div className="h-2.5 w-1/2 rounded-full bg-[var(--color-bg-secondary)]" />
        </div>
      </div>

      {/* working controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={control} onClick={addUser} disabled={users.length >= ROSTER.length}>
          Join
        </button>
        <button type="button" className={control} onClick={removeUser} disabled={users.length <= 1}>
          Leave
        </button>
        <button type="button" className={control} onClick={cycleStatus}>
          Change status
        </button>
        <span className="ml-auto text-[12px] text-[var(--color-muted)]" role="status" aria-live="polite">
          {selectedName ? `Opened ${selectedName}` : `${users.length} present`}
        </span>
      </div>
    </div>
  );
}

export default LivePresenceStackPreview;
