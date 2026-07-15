"use client";

import * as React from "react";

import {
  DeploymentPipeline,
  type Stage,
  type StageStatus,
} from "@/registry/developer-tools/deployment-pipeline";

/**
 * Live demo for DeploymentPipeline. The pipeline data is entirely fictional and
 * generated in the browser — nothing here connects to a real CI/CD provider.
 * A tiny run "engine" advances a fake deploy so the running-stage emphasis,
 * durations, logs, and Retry all behave like the real thing.
 */

const FAIL_INDEX = 2; // "Test" is the stage that fails in failure mode.

interface Base {
  id: string;
  name: string;
  durationMs: number;
  logs: string[];
}

const BASE: Base[] = [
  {
    id: "install",
    name: "Install dependencies",
    durationMs: 8400,
    logs: [
      "$ pnpm install --frozen-lockfile",
      "Lockfile is up to date, resolution step is skipped",
      "Packages: +412",
      "Progress: resolved 412, reused 401, downloaded 11, added 412",
      "Done in 8.4s",
    ],
  },
  {
    id: "build",
    name: "Build",
    durationMs: 22600,
    logs: [
      "$ next build",
      "  ▲ Next.js 15.1.0",
      "   Creating an optimized production build ...",
      " ✓ Compiled successfully",
      " ✓ Collecting page data",
      " ✓ Generating static pages (24/24)",
      "Route (app)                     Size     First Load JS",
      "┌ ○ /                           4.7 kB          112 kB",
      "└ ○ /components/[slug]          9.1 kB          128 kB",
    ],
  },
  {
    id: "test",
    name: "Test",
    durationMs: 14200,
    logs: [
      "$ vitest run",
      " ✓ src/lib/format.test.ts (6 tests) 41ms",
      " ✓ src/ui/button.test.tsx (9 tests) 88ms",
      " ❯ src/checkout/session.test.ts (5 tests | 1 failed) 210ms",
      "   × creates a session with a valid cart",
      "     → expected 200 but received 500",
      "     at Object.<anonymous> (src/checkout/session.test.ts:42:8)",
      "Test Files  1 failed | 12 passed (13)",
      "     Tests  1 failed | 78 passed (79)",
    ],
  },
  {
    id: "deploy",
    name: "Deploy to production",
    durationMs: 11800,
    logs: [
      "$ deploy --env production",
      "Uploading build output ...",
      "Assigning domains: app.example.com",
      "Warming edge cache in 3 regions",
      "Deployment ready → https://app.example.com",
    ],
  },
];

const STEP_MS = 1100;

function computeStages(step: number, failMode: boolean): Stage[] {
  const halted = failMode && step > FAIL_INDEX;
  return BASE.map((b, i) => {
    let status: StageStatus;
    let durationMs: number | undefined;

    if (halted) {
      if (i < FAIL_INDEX) {
        status = "passed";
        durationMs = b.durationMs;
      } else if (i === FAIL_INDEX) {
        status = "failed";
        durationMs = b.durationMs;
      } else {
        status = "cancelled";
        durationMs = undefined;
      }
    } else if (i < step) {
      status = "passed";
      durationMs = b.durationMs;
    } else if (i === step) {
      status = "running";
      durationMs = undefined;
    } else {
      status = "queued";
      durationMs = undefined;
    }

    return {
      id: b.id,
      name: b.name,
      status,
      durationMs,
      // Only surface logs where they're meaningful: completed, running, failed.
      logs: status === "queued" || status === "cancelled" ? undefined : b.logs,
    };
  });
}

function isTerminal(step: number, failMode: boolean): boolean {
  if (failMode && step > FAIL_INDEX) return true;
  return step >= BASE.length;
}

export function DeploymentPipelinePreview() {
  const [failMode, setFailMode] = React.useState(true);
  const [step, setStep] = React.useState(BASE.length + 1); // start on the settled failure state

  const running = !isTerminal(step, failMode);

  // Advance the fake run while a stage is "running".
  React.useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => window.clearTimeout(t);
  }, [running, step]);

  const stages = computeStages(step, failMode);

  const replay = React.useCallback(() => setStep(0), []);

  const toggleFailure = React.useCallback(() => {
    setFailMode((f) => !f);
    setStep(0); // re-run from the top with the new outcome
  }, []);

  // Retrying the failed stage clears the failure and resumes from that stage.
  const onRetry = React.useCallback((stageId: string) => {
    const idx = BASE.findIndex((b) => b.id === stageId);
    if (idx === -1) return;
    setFailMode(false);
    setStep(idx);
  }, []);

  const btn =
    "inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))]";

  return (
    <div className="w-full max-w-[560px]">
      {/* Console-style window chrome (decorative). */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-[var(--shadow-md)]">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-error,var(--color-muted))] opacity-70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-warning,var(--color-muted))] opacity-70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-success,var(--color-muted))] opacity-70" />
          </span>
          <span className="ml-1 font-mono text-[12px] text-[var(--color-muted)]">
            deploy · commit a1f3c9d
          </span>
          <span className="ml-auto font-mono text-[11.5px] text-[var(--color-muted)]">
            {failMode ? "main → production" : "main → production"}
          </span>
        </div>

        <div className="p-3 sm:p-4">
          <DeploymentPipeline
            stages={stages}
            onRetry={onRetry}
            defaultExpandedId="test"
            label="Production deploy pipeline"
          />
        </div>
      </div>

      {/* Working controls. */}
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={btn} onClick={replay}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 3v5h5" />
          </svg>
          Replay run
        </button>
        <button type="button" className={btn} onClick={toggleFailure} aria-pressed={failMode}>
          {failMode ? "Run without failure" : "Inject test failure"}
        </button>
        <span className="ml-auto text-[12px] text-[var(--color-muted)]">
          {running ? "Running…" : failMode ? "Halted at Test" : "All stages passed"}
        </span>
      </div>
    </div>
  );
}

export default DeploymentPipelinePreview;
