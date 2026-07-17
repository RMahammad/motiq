"use client";

import * as React from "react";

import { ToolCallActivity, type ToolCall, type ToolCallStatus } from "@/registry/ai/tool-call-activity";
import { useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------
 * DEMO ONLY. This preview drives clearly-fictional agent activity from local
 * state — there is no model and nothing is executed. The real component only
 * renders whatever `calls` + statuses the application passes it. The controls
 * below mutate that local array so you can see every state and animation.
 * ---------------------------------------------------------------------- */

interface Seed {
  name: string;
  category: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  details?: string;
}

const SEEDS: Seed[] = [
  {
    name: "Searching project documentation",
    category: "search",
    input: { query: "stale-while-revalidate cache", scope: "docs/**" },
    output: { matches: 12, top: "docs/caching.md#swr" },
  },
  {
    name: "Reading a configuration file",
    category: "read",
    input: { path: "apps/web/next.config.mjs" },
    output: { lines: 84, exports: ["default"] },
  },
  {
    name: "Generating a migration plan",
    category: "code",
    input: { from: "v3", to: "v4", tables: ["users", "sessions"] },
    output: { steps: 6, reversible: true },
    details: "Drafts an ordered, reversible plan. The app decides whether to apply it.",
  },
  {
    name: "Deploying to the staging environment",
    category: "approval",
    input: { target: "staging", commit: "a1f9c2e" },
    details: "This step changes a live environment, so it waits for a human to approve.",
  },
  {
    name: "Fetching the latest exchange rates",
    category: "web",
    input: { endpoint: "GET /rates?base=USD" },
    output: { base: "USD", count: 168 },
  },
];

let uidCounter = 0;
const nextId = () => `call-${++uidCounter}`;

function makeCall(seed: Seed, status: ToolCallStatus): ToolCall {
  return {
    id: nextId(),
    name: seed.name,
    category: seed.category,
    status,
    startedAt: Date.now(),
    input: seed.input,
    details: seed.details,
    ...(status === "running" ? { progress: 0.15 } : {}),
  };
}

const INITIAL: ToolCall[] = [
  { ...makeCall(SEEDS[0], "completed"), durationMs: 1840, output: SEEDS[0].output },
  { ...makeCall(SEEDS[1], "completed"), durationMs: 640, output: SEEDS[1].output },
  { ...makeCall(SEEDS[2], "running"), progress: 0.45 },
];

const ctrl =
  "inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-fg)] transition-colors outline-none hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] disabled:opacity-50";

export function ToolCallActivityPreview() {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const visible = useVisibilityPause(wrapRef);
  const visibleRef = React.useRef(visible);
  visibleRef.current = visible;

  const [calls, setCalls] = React.useState<ToolCall[]>(INITIAL);
  const [seedIdx, setSeedIdx] = React.useState(3);
  const timer = React.useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Gently advance any running call's progress so the live state feels real.
  React.useEffect(() => {
    timer.current = setInterval(() => {
      if (!visibleRef.current) return;
      setCalls((prev) =>
        prev.map((c) =>
          c.status === "running" && typeof c.progress === "number"
            ? { ...c, progress: Math.min(0.94, c.progress + 0.04) }
            : c,
        ),
      );
    }, 700);
    return () => clearInterval(timer.current);
  }, []);

  const currentRunning = calls.find((c) => c.status === "running");

  const addCall = () => {
    const seed = SEEDS[seedIdx % SEEDS.length];
    setSeedIdx((i) => i + 1);
    setCalls((prev) => [...prev, makeCall(seed, "queued")]);
    // Promote the freshly-queued call to running shortly after it appears.
    setTimeout(() => {
      setCalls((prev) => {
        const last = [...prev].reverse().find((c) => c.status === "queued");
        return last ? prev.map((c) => (c.id === last.id ? { ...c, status: "running", progress: 0.1 } : c)) : prev;
      });
    }, 650);
  };

  const completeCurrent = () =>
    setCalls((prev) => {
      const target = prev.find((c) => c.status === "running");
      if (!target) return prev;
      return prev.map((c) =>
        c.id === target.id
          ? { ...c, status: "completed", progress: 1, durationMs: 1200, output: { ok: true } }
          : c,
      );
    });

  const failCurrent = () =>
    setCalls((prev) => {
      const target = prev.find((c) => c.status === "running");
      if (!target) return prev;
      return prev.map((c) =>
        c.id === target.id
          ? { ...c, status: "failed", error: "The tool exited with code 1 before returning a result." }
          : c,
      );
    });

  const requestApproval = () => {
    const seed = SEEDS[3]; // the deployment (approval) seed
    setCalls((prev) => [...prev, makeCall(seed, "waiting_approval")]);
  };

  const reset = () => {
    uidCounter = 0;
    setSeedIdx(3);
    setCalls([
      { ...makeCall(SEEDS[0], "completed"), durationMs: 1840, output: SEEDS[0].output },
      { ...makeCall(SEEDS[1], "completed"), durationMs: 640, output: SEEDS[1].output },
      { ...makeCall(SEEDS[2], "running"), progress: 0.45 },
    ]);
  };

  return (
    <div ref={wrapRef} className="mx-auto flex w-full max-w-[720px] flex-col gap-3">
      {/* Controls rendered at the BOTTOM (order-last) for a consistent showcase layout. */}
      <div className="order-last flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={ctrl} onClick={addCall}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add tool call
        </button>
        <button type="button" className={ctrl} onClick={completeCurrent} disabled={!currentRunning}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Complete current
        </button>
        <button type="button" className={ctrl} onClick={failCurrent} disabled={!currentRunning}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Fail current
        </button>
        <button type="button" className={ctrl} onClick={requestApproval}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3 5 6v5c0 4.2 2.9 7.7 7 9 4.1-1.3 7-4.8 7-9V6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          Request approval
        </button>
        <button type="button" className={ctrl} onClick={reset}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 11a8 8 0 1 1 .7 4.2M4 17v-4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Reset
        </button>
      </div>

      <ToolCallActivity
        calls={calls}
        title="Agent activity"
        compactCompleted
        showDurations
        onApprove={(id) => setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, status: "approved", durationMs: 900 } : c)))}
        onReject={(id) => setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, status: "rejected" } : c)))}
        onRetry={(id) =>
          setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, status: "running", error: undefined, progress: 0.2 } : c)))
        }
      />

      <p className="text-center text-[11.5px] text-[var(--color-muted)]">
        Demo data — clearly-fictional agent activity from local state. No live model is involved.
      </p>
    </div>
  );
}

export default ToolCallActivityPreview;
