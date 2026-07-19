"use client";

import * as React from "react";

import { KpiNumberMorph } from "@/registry/data/kpi-number-morph";

type State = "idle" | "loading" | "error";

// Clearly-fictional demo values. Each "update" nudges them (one always down).
const SNAPSHOTS = [
  { revenue: 48250, users: 12840, conv: 3.4, dRev: 12.4, dUsers: 8.1, dConv: -0.6 },
  { revenue: 51890, users: 13120, conv: 3.1, dRev: 7.5, dUsers: 2.2, dConv: -0.3 },
  { revenue: 47010, users: 13980, conv: 3.9, dRev: -9.4, dUsers: 6.5, dConv: 0.8 },
  { revenue: 55240, users: 14710, conv: 4.2, dRev: 17.5, dUsers: 5.2, dConv: 0.3 },
];

/**
 * Compact hero variant — a single prominent stat that fits the narrow homepage
 * montage column without clipping. Uses the same component + real controls.
 */
export function KpiNumberMorphHeroPreview() {
  const [i, setI] = React.useState(0);
  const s = SNAPSHOTS[i % SNAPSHOTS.length];
  return (
    <div className="flex w-full max-w-[300px] flex-col items-stretch gap-3">
      <KpiNumberMorph
        label="Revenue"
        value={s.revenue}
        currency="USD"
        notation="compact"
        change={s.dRev}
        changeAsPercent
        changeLabel="7d"
        className="min-w-0"
      />
      <div className="grid grid-cols-2 gap-3">
        <KpiNumberMorph label="Users" value={s.users} notation="compact" change={s.dUsers} changeAsPercent className="min-w-0 p-4" />
        <KpiNumberMorph label="Conv." value={s.conv} suffix="%" decimals={1} change={s.dConv} changeAsPercent className="min-w-0 p-4" />
      </div>
      <button
        type="button"
        onClick={() => setI((n) => n + 1)}
        className="self-start rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-fg)] hover:border-[var(--color-accent)]"
      >
        Simulate update
      </button>
    </div>
  );
}

export function KpiNumberMorphPreview() {
  const [i, setI] = React.useState(0);
  const [state, setState] = React.useState<State>("idle");
  const s = SNAPSHOTS[i % SNAPSHOTS.length];

  return (
    <div className="flex w-full max-w-[720px] flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiNumberMorph
          label="Revenue"
          value={s.revenue}
          currency="USD"
          notation="compact"
          change={s.dRev}
          changeAsPercent
          changeLabel="7d"
          state={state}
        />
        <KpiNumberMorph
          label="Active users"
          value={s.users}
          notation="compact"
          change={s.dUsers}
          changeAsPercent
          changeLabel="7d"
          state={state}
        />
        <KpiNumberMorph
          label="Conversion"
          value={s.conv}
          suffix="%"
          decimals={1}
          change={s.dConv}
          changeAsPercent
          changeLabel="7d"
          state={state}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setI((n) => n + 1);
          }}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-fg)] hover:border-[var(--color-accent)]"
        >
          Simulate update
        </button>
        <div className="ml-auto flex overflow-hidden rounded-md border border-[var(--color-border)] text-[12px]">
          {(["idle", "loading", "error"] as const).map((st) => (
            <button
              key={st}
              type="button"
              aria-pressed={state === st}
              onClick={() => setState(st)}
              className={`px-2.5 py-1 capitalize ${
                state === st ? "bg-[var(--color-surface)] text-[var(--color-fg)]" : "text-[var(--color-muted)] hover:text-[var(--color-fg)]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[12px] text-[var(--color-muted)]">Demo data - values are illustrative.</p>
    </div>
  );
}
