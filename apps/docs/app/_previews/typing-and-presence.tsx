"use client";

import * as React from "react";

import {
  TypingAndPresence,
  type Participant,
  type TypingAndPresenceMode,
  type TypingState,
} from "@/registry/communication/typing-and-presence";

/* Clearly fictional demo — a design-team messaging workspace. No real people.
 * Fixed ids so there is no SSR/CSR hydration drift and every control is
 * deterministic.
 *
 * The PREVIEW (the "app") owns all presence + typing data. It adds/removes
 * participants, flips typing on/off, drops people to idle, and drives a
 * reconnection. The component only PRESENTS what it is handed — it never opens a
 * socket or invents a status. */

const ROSTER: Participant[] = [
  { id: "jamie", displayName: "Jamie Okafor", presenceState: "online", color: "#7c5cff", role: "Owner", activeContext: "#redesign" },
  { id: "morgan", displayName: "Morgan Diaz", presenceState: "active", color: "#0ea5a0", activeContext: "#redesign" },
  { id: "ada", displayName: "Ada Lindqvist", presenceState: "online", color: "#f59e0b", activeContext: "spec.fig" },
  { id: "rin", displayName: "Rin Nakamura", presenceState: "idle", color: "#ef4468", activeContext: "#redesign" },
  { id: "sasha", displayName: "Sasha Bauer", presenceState: "away", color: "#3b82f6" },
  { id: "kofi", displayName: "Kofi Mensah", presenceState: "online", color: "#22c55e", activeContext: "#redesign" },
];

function seed(): Participant[] {
  // Start with three present, one already typing.
  return ROSTER.slice(0, 3).map((p, i) =>
    i === 0 ? { ...p, typingState: "typing" as TypingState } : { ...p },
  );
}

const control =
  "rounded-lg px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

export function TypingAndPresencePreview() {
  const [people, setPeople] = React.useState<Participant[]>(seed);
  const [mode, setMode] = React.useState<TypingAndPresenceMode>("inline");
  const [compact, setCompact] = React.useState(false);
  const timers = React.useRef<number[]>([]);

  React.useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const after = (ms: number, fn: () => void) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
  };

  const patch = (id: string, next: Partial<Participant>) =>
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...next } : p)));

  const addParticipant = () =>
    setPeople((prev) => {
      const next = ROSTER.find((r) => !prev.some((p) => p.id === r.id));
      return next ? [...prev, { ...next, typingState: undefined }] : prev;
    });

  const removeParticipant = () =>
    setPeople((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  const firstIdle = () => people.find((p) => !p.typingState || p.typingState === "stopped");

  const startTyping = () => {
    const p = firstIdle();
    if (p) patch(p.id, { typingState: "typing", presenceState: "active" });
  };

  const stopTyping = () => {
    const p = [...people].reverse().find((x) => x.typingState && x.typingState !== "stopped");
    if (p) patch(p.id, { typingState: "stopped" });
  };

  const addMultipleTypers = () =>
    setPeople((prev) =>
      prev.map((p, i) =>
        i < 3
          ? { ...p, typingState: (["typing", "recording", "typing"] as TypingState[])[i], presenceState: "active" }
          : p,
      ),
    );

  const markIdle = () => {
    const p = people.find((x) => x.presenceState === "online" || x.presenceState === "active");
    if (p) patch(p.id, { presenceState: "idle", typingState: "stopped" });
  };

  const reconnect = () => {
    const p = people[0];
    if (!p) return;
    patch(p.id, { presenceState: "reconnecting", connectionState: "reconnecting", typingState: "stopped" });
    after(1800, () => patch(p.id, { presenceState: "online", connectionState: "connected" }));
  };

  const reset = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setPeople(seed());
    setMode("inline");
    setCompact(false);
  };

  return (
    <div className="flex w-full max-w-[560px] flex-col gap-4">
      {/* messaging workspace shell */}
      <div className="overflow-hidden rounded-2xl [border:1px_solid_var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5">
          <span className="text-[13px] font-semibold text-[var(--color-fg)]">#redesign · Design guild</span>
          <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
            Fictional demo data
          </span>
        </div>

        <div className="min-h-[120px] p-4">
          <TypingAndPresence
            participants={people}
            context="#redesign"
            mode={mode}
            compact={compact}
            maxVisible={4}
            onParticipantSelect={() => {}}
          />
        </div>
      </div>

      {/* working controls — the app owns every presence + typing transition */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={control} onClick={addParticipant}>Add participant</button>
        <button type="button" className={control} onClick={removeParticipant}>Remove participant</button>
        <button type="button" className={control} onClick={startTyping}>Start typing</button>
        <button type="button" className={control} onClick={stopTyping}>Stop typing</button>
        <button type="button" className={control} onClick={addMultipleTypers}>Add multiple typers</button>
        <button type="button" className={control} onClick={markIdle}>Mark idle</button>
        <button type="button" className={control} onClick={reconnect}>Reconnect</button>
        <button
          type="button"
          className={control}
          aria-pressed={compact}
          onClick={() => setCompact((v) => !v)}
        >
          {compact ? "Comfortable density" : "Compact density"}
        </button>
        <button
          type="button"
          className={control}
          onClick={() =>
            setMode((m) =>
              m === "inline" ? "compact" : m === "compact" ? "floating-panel" : "inline",
            )
          }
        >
          Mode: {mode}
        </button>
        <button type="button" className={control} onClick={reset}>Reset</button>
        <span className="ml-auto text-[12px] text-[var(--color-muted)]">The app owns presence - the component presents it</span>
      </div>
    </div>
  );
}

export default TypingAndPresencePreview;
