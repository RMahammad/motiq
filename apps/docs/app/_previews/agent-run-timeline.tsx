"use client";

import * as React from "react";

import {
  AgentRunTimeline,
  type AgentRun,
  type RunStep,
  type StepStatus,
} from "@/registry/ai/agent-run-timeline";
import { useVisibilityPause } from "@/lib/motiq";

/* -------------------------------------------------------------------------
 * DEMO ONLY. This preview drives a clearly-fictional agent run from local
 * state — there is no model and nothing is executed. The real component only
 * renders whatever `run` + statuses the application passes it; it never runs
 * an agent, invents reasoning, or claims a step succeeded on its own. The
 * controls below mutate the local run so you can see every state and animation.
 * ---------------------------------------------------------------------- */

// Fixed, deterministic timestamps for the initial render (no Date.now() here —
// that would risk an SSR/CSR hydration mismatch). Live changes stamp Date.now()
// inside handlers only.
const T0 = 1_720_000_000_000;

interface Seed {
  id: string;
  title: string;
  description: string;
  tool: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
  stages?: { id: string; label: string }[];
  approval?: boolean;
}

const SEEDS: Seed[] = [
  {
    id: "s1",
    title: "Inspect repository",
    description: "Scan the working tree and detect the project layout.",
    tool: "repo.scan",
    args: { ref: "main", include: ["**/*.ts", "**/*.sql"] },
    result: { files: 214, packages: 4, migrationsDir: "db/migrations" },
  },
  {
    id: "s2",
    title: "Read configuration",
    description: "Load the database and environment configuration.",
    tool: "config.read",
    args: { path: "config/database.yaml" },
    result: { driver: "postgres", schema: "public", pooling: true },
  },
  {
    id: "s3",
    title: "Generate migration proposal",
    description: "Draft an ordered, reversible migration plan.",
    tool: "migrate.plan",
    args: { from: "v14", to: "v15", tables: ["users", "sessions", "audit_log"] },
    result: { steps: 6, reversible: true, estimatedRows: 128_400 },
    stages: [
      { id: "s3a", label: "Diff schema versions" },
      { id: "s3b", label: "Order dependent tables" },
      { id: "s3c", label: "Write up + down scripts" },
    ],
  },
  {
    id: "s4",
    title: "Run validation",
    description: "Dry-run the plan against a shadow database.",
    tool: "validate.run",
    args: { target: "shadow", failFast: true },
    result: { checks: 42, warnings: 1, blocking: 0 },
  },
  {
    id: "s5",
    title: "Wait for deployment approval",
    description: "A human must approve before touching production.",
    tool: "gate.approval",
    args: { environment: "production", requiredRole: "maintainer" },
    approval: true,
  },
  {
    id: "s6",
    title: "Produce final summary",
    description: "Compile the applied changes into a report.",
    tool: "report.compile",
    args: { format: "markdown" },
    result: { sections: 4, artifacts: ["migration-report.md"] },
  },
];

function makeStep(seed: Seed, status: StepStatus, extra?: Partial<RunStep>): RunStep {
  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    status,
    toolCall: { name: seed.tool, arguments: seed.args, result: status === "completed" ? seed.result : undefined },
    stages: seed.stages?.map((s, i) => ({
      id: s.id,
      label: s.label,
      status: status === "completed" ? "completed" : status === "active" && i === 0 ? "active" : "pending",
    })),
    ...extra,
  };
}

// Mount state: a live, in-progress run so the component looks alive immediately.
function initialRun(): AgentRun {
  return {
    title: "Apply database migration · v15",
    status: "running",
    startedAt: T0,
    currentStepId: "s3",
    steps: [
      makeStep(SEEDS[0], "completed", {
        startedAt: T0,
        endedAt: T0 + 1_800,
        durationMs: 1_800,
        summary: "214 files scanned across 4 packages.",
      }),
      makeStep(SEEDS[1], "completed", {
        startedAt: T0 + 1_900,
        endedAt: T0 + 2_500,
        durationMs: 600,
      }),
      makeStep(SEEDS[2], "active", { startedAt: T0 + 2_600, attempts: 1 }),
      makeStep(SEEDS[3], "pending"),
      makeStep(SEEDS[4], "pending"),
      makeStep(SEEDS[5], "pending"),
    ],
  };
}

// Reset target: a fresh, queued run so "Start run" has something to start.
function queuedRun(): AgentRun {
  return {
    title: "Apply database migration · v15",
    status: "queued",
    currentStepId: "s1",
    steps: SEEDS.map((s) => makeStep(s, "pending")),
  };
}

const RESOLVED: ReadonlySet<StepStatus> = new Set(["completed", "skipped", "cancelled", "failed"]);

/** Activate the first pending step after `fromIndex`; else finish the run. */
function advance(run: AgentRun, fromIndex: number): AgentRun {
  const nextIdx = run.steps.findIndex((s, i) => i > fromIndex && s.status === "pending");
  if (nextIdx === -1) {
    return {
      ...run,
      status: "completed",
      endedAt: Date.now(),
      currentStepId: undefined,
      summary:
        "Migration v15 applied to production after approval. 6 steps completed, 1 non-blocking warning, fully reversible.",
    };
  }
  const nextId = run.steps[nextIdx].id;
  return {
    ...run,
    status: "running",
    currentStepId: nextId,
    steps: run.steps.map((s, i) =>
      i === nextIdx ? { ...s, status: "active", startedAt: Date.now(), attempts: s.attempts ?? 1 } : s,
    ),
  };
}

const ctrl =
  "inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-fg)] transition-colors outline-none hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] disabled:opacity-45 disabled:hover:border-[var(--color-border)]";

function Btn({
  onClick,
  disabled,
  children,
  path,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  path: string;
}) {
  return (
    <button type="button" className={ctrl} onClick={onClick} disabled={disabled}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d={path} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </button>
  );
}

export function AgentRunTimelinePreview() {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const autoVisible = useVisibilityPause(wrapRef); // gate autoplay while offscreen/backgrounded.

  const [run, setRun] = React.useState<AgentRun>(initialRun);
  const [activeStepId, setActiveStepId] = React.useState<string | undefined>("s3");
  const [auto, setAuto] = React.useState(true);

  const activeStep = run.steps.find((s) => s.status === "active");
  const waitingStep = run.steps.find((s) => s.status === "waiting_approval");
  const failedStep = run.steps.find((s) => s.status === "failed");
  const canStart = run.status === "queued" || run.status === "paused";
  const inFlight = ["queued", "running", "waiting", "paused"].includes(run.status);

  const startRun = () =>
    setRun((r) => {
      if (r.status === "paused") return { ...r, status: "running" };
      const firstPending = r.steps.findIndex((s) => s.status === "pending");
      if (firstPending === -1) return { ...r, status: "running" };
      return {
        ...r,
        status: "running",
        startedAt: r.startedAt ?? Date.now(),
        currentStepId: r.steps[firstPending].id,
        steps: r.steps.map((s, i) =>
          i === firstPending ? { ...s, status: "active", startedAt: Date.now(), attempts: 1 } : s,
        ),
      };
    });

  const completeStep = () =>
    setRun((r) => {
      const idx = r.steps.findIndex((s) => s.status === "active");
      if (idx === -1) return r;
      const seed = SEEDS.find((s) => s.id === r.steps[idx].id);
      const withCompleted: AgentRun = {
        ...r,
        steps: r.steps.map((s, i) =>
          i === idx
            ? {
                ...s,
                status: "completed",
                endedAt: Date.now(),
                durationMs: 1_400,
                toolCall: s.toolCall ? { ...s.toolCall, result: seed?.result } : undefined,
                stages: s.stages?.map((st) => ({ ...st, status: "completed" })),
              }
            : s,
        ),
      };
      return advance(withCompleted, idx);
    });

  const failStep = () =>
    setRun((r) => {
      const idx = r.steps.findIndex((s) => s.status === "active");
      if (idx === -1) return r;
      return {
        ...r,
        status: "failed",
        steps: r.steps.map((s, i) =>
          i === idx
            ? {
                ...s,
                status: "failed",
                endedAt: Date.now(),
                error: "Validation exited with code 1: constraint audit_log_pkey would be violated.",
                attempts: (s.attempts ?? 1),
              }
            : s,
        ),
      };
    });

  const requestApproval = () =>
    setRun((r) => {
      // Only the CURRENT active step can request approval — never jump ahead to a
      // later step while earlier ones are still pending (that skipped the sequence).
      const idx = r.steps.findIndex((s) => s.status === "active");
      if (idx === -1) return r;
      return {
        ...r,
        status: "waiting",
        currentStepId: r.steps[idx].id,
        steps: r.steps.map((s, i) =>
          i === idx ? { ...s, status: "waiting_approval", startedAt: s.startedAt ?? Date.now() } : s,
        ),
      };
    });

  const approve = (id: string) =>
    setRun((r) => {
      const idx = r.steps.findIndex((s) => s.id === id);
      if (idx === -1) return r;
      const withApproved: AgentRun = {
        ...r,
        steps: r.steps.map((s, i) =>
          i === idx ? { ...s, status: "completed", endedAt: Date.now(), summary: "Approved by a maintainer." } : s,
        ),
      };
      return advance(withApproved, idx);
    });

  const reject = (id: string) =>
    setRun((r) => ({
      ...r,
      status: "cancelled",
      currentStepId: undefined,
      steps: r.steps.map((s) => (s.id === id ? { ...s, status: "cancelled", endedAt: Date.now() } : s)),
    }));

  const retry = (id: string) =>
    setRun((r) => {
      const idx = r.steps.findIndex((s) => s.id === id);
      if (idx === -1) return r;
      return {
        ...r,
        status: "running",
        currentStepId: id,
        steps: r.steps.map((s, i) =>
          i === idx
            ? { ...s, status: "active", error: undefined, startedAt: Date.now(), attempts: (s.attempts ?? 1) + 1 }
            : s,
        ),
      };
    });

  const cancelRun = () =>
    setRun((r) => ({
      ...r,
      status: "cancelled",
      currentStepId: undefined,
      endedAt: Date.now(),
      steps: r.steps.map((s) =>
        s.status === "active" || s.status === "waiting_approval" || s.status === "pending"
          ? { ...s, status: "cancelled" }
          : s,
      ),
    }));

  const reset = () => {
    setRun(queuedRun());
    setActiveStepId("s1");
  };

  // A manual control temporarily hands the run to the user (pauses autoplay).
  const manual = React.useCallback((fn: () => void) => () => { setAuto(false); fn(); }, []);

  // Autoplay: advance the run one logical step at a time so the timeline animates
  // on its own for the showcase — start → complete each step → request + grant
  // approval on the approval step → finish → loop. Pauses offscreen, and any
  // manual control switches it off so the user can drive. Re-arms on Reset.
  React.useEffect(() => {
    if (!auto || !autoVisible) return;
    const waiting = run.steps.find((s) => s.status === "waiting_approval");
    const failed = run.steps.find((s) => s.status === "failed");
    const active = run.steps.find((s) => s.status === "active");
    const settled = run.steps.length > 0 && run.steps.every((s) => s.status === "completed" || s.status === "cancelled");

    let action: (() => void) | null = null;
    let delay = 1300;
    if (run.status === "queued" || run.status === "paused") { action = startRun; delay = 800; }
    else if (waiting) { action = () => approve(waiting.id); delay = 1500; }
    else if (failed) { action = () => retry(failed.id); delay = 1600; }
    else if (active) {
      if (active.id === "s5") { action = requestApproval; delay = 1200; }
      else { action = completeStep; delay = 1200; }
    } else if (settled) { action = reset; delay = 2400; }

    if (!action) return;
    const t = window.setTimeout(action, delay);
    return () => window.clearTimeout(t);
    // Handlers only call setRun (stable); the effect re-derives them each run change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, autoVisible, run]);

  return (
    <div ref={wrapRef} className="mx-auto flex w-full max-w-[760px] flex-col gap-3">
      {/* Working controls — each mutates the fictional run the component renders.
          order-last keeps this bar at the BOTTOM for a consistent showcase layout. */}
      <div className="order-last flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <span className="mr-1 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.9" />
              <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
            </svg>
          </span>
          Agent workspace
        </span>
        <Btn onClick={() => setAuto((a) => !a)} path={auto ? "M6 5h4v14H6zM14 5h4v14h-4z" : "M8 5v14l11-7z"}>
          {auto ? "Pause auto" : "Play"}
        </Btn>
        <Btn onClick={manual(startRun)} disabled={!canStart} path="M8 5v14l11-7z">
          Start run
        </Btn>
        <Btn onClick={manual(completeStep)} disabled={!activeStep} path="m5 13 4 4L19 7">
          Complete step
        </Btn>
        <Btn onClick={manual(failStep)} disabled={!activeStep} path="M6 6l12 12M18 6 6 18">
          Fail step
        </Btn>
        <Btn onClick={manual(requestApproval)} disabled={!activeStep} path="M12 3 5 6v5c0 4.2 2.9 7.7 7 9 4.1-1.3 7-4.8 7-9V6z">
          Request approval
        </Btn>
        <Btn onClick={manual(() => waitingStep && approve(waitingStep.id))} disabled={!waitingStep} path="M12 3 5 6v5c0 4.2 2.9 7.7 7 9 4.1-1.3 7-4.8 7-9V6zM9 11l2.2 2.2L15 9.4">
          Approve
        </Btn>
        <Btn onClick={manual(() => failedStep && retry(failedStep.id))} disabled={!failedStep} path="M20 11a8 8 0 1 0-.7 4.2M20 5v4h-4">
          Retry
        </Btn>
        <Btn onClick={manual(cancelRun)} disabled={!inFlight} path="M6 6h12v12H6z">
          Cancel
        </Btn>
        <Btn onClick={() => { setAuto(true); reset(); }} path="M4 11a8 8 0 1 1 .7 4.2M4 17v-4h4">
          Reset
        </Btn>
      </div>

      <AgentRunTimeline
        run={run}
        activeStepId={activeStepId}
        onActiveStepChange={setActiveStepId}
        followActive
        compactCompleted
        onApprove={approve}
        onReject={reject}
        onRetryStep={retry}
        onCancelRun={cancelRun}
        onResumeRun={startRun}
      />

      <p className="text-center text-[11.5px] text-[var(--color-muted)]">
        Demo data — a clearly-fictional migration run driven from local state. No live model is involved; the component
        only renders the run it is given.
      </p>
    </div>
  );
}

export default AgentRunTimelinePreview;
