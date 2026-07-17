"use client";

import * as React from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/motiq";

import {
  EnvironmentSwitcher,
  type Environment,
} from "@/components/motiq/environment-switcher";
import {
  DeploymentPipeline,
  type Stage,
  type StageStatus,
} from "@/components/motiq/deployment-pipeline";
import {
  LiveLogStream,
  type LogEntry,
  type LogLevel,
  type LogStreamStatus,
} from "@/components/motiq/live-log-stream";
import {
  ApiRequestInspector,
  type ApiRequest,
  type ApiResponse,
  type InspectorState,
  type AuthSummary,
} from "@/components/motiq/api-request-inspector";

/**
 * DeploymentCommandCenter — a composed, app-controlled "deploy console" block
 * that wires four presentation-only developer-tools components together behind a
 * single small demo state machine: an EnvironmentSwitcher in the top bar, a
 * DeploymentPipeline as the main column, a LiveLogStream beneath it, and an
 * ApiRequestInspector in the side panel.
 *
 * IMPORTANT — DEMO ONLY. Nothing here talks to a real deployment provider. Every
 * repo, endpoint, id, header, and timing is fictional and provider-neutral
 * (repo `acme/ledger-web`, host `api.acme-deploy.dev`). Credential headers are
 * pre-masked placeholders (`Bearer ••••••`) and the inspector redacts them
 * anyway. The block only feeds the components a scripted request/response/log
 * timeline in response to its own controls — it is a copy-paste starting point
 * you rewire to your real backend.
 *
 * Determinism: no `Date.now()` / `Math.random()` / `new Date()` runs during
 * render, initializers, or module scope. Timestamps derive from a fixed
 * baseline; the run only advances inside timers/handlers. Clean-room original.
 */

/* -------------------------------------------------------------------------- */
/* Fixed, deterministic demo timeline                                          */
/* -------------------------------------------------------------------------- */

// A fixed baseline so the server-rendered first paint is deterministic. Handlers
// advance a step counter from here — never wall-clock now().
const BASE_TS = 1_700_000_000_000;

type StageId = "build" | "test" | "deploy" | "promote";

const STAGE_PLAN: { id: StageId; name: string; durationMs: number }[] = [
  { id: "build", name: "Build", durationMs: 42_100 },
  { id: "test", name: "Test", durationMs: 18_400 },
  { id: "deploy", name: "Deploy", durationMs: 9_200 },
  { id: "promote", name: "Promote", durationMs: 6_000 },
];

interface ScriptLine {
  stage: StageId;
  level: LogLevel;
  message: string;
}

// The happy path: every stage passes.
const SUCCESS_SCRIPT: ScriptLine[] = [
  { stage: "build", level: "info", message: "Cloning acme/ledger-web at ref main…" },
  { stage: "build", level: "info", message: "Resolving 214 packages with pnpm…" },
  { stage: "build", level: "success", message: "Compiled Next.js app in 42.1s" },
  { stage: "test", level: "info", message: "Running 128 unit + integration tests…" },
  { stage: "test", level: "success", message: "All 128 tests passed (18.4s)" },
  { stage: "deploy", level: "info", message: "Uploading build artifacts to region iad1…" },
  { stage: "deploy", level: "info", message: "POST /v1/deployments → dpl_7Kq2 (queued)" },
  { stage: "deploy", level: "success", message: "Deployment dpl_7Kq2 is live at ledger-web-7kq2.acme.app" },
  { stage: "promote", level: "info", message: "Shifting production traffic to dpl_7Kq2…" },
  { stage: "promote", level: "success", message: "Promotion complete — 100% of traffic on dpl_7Kq2" },
];

// The failure path: build + test pass, the deploy stage fails a health check.
const FAILURE_SCRIPT: ScriptLine[] = [
  { stage: "build", level: "info", message: "Cloning acme/ledger-web at ref main…" },
  { stage: "build", level: "info", message: "Resolving 214 packages with pnpm…" },
  { stage: "build", level: "success", message: "Compiled Next.js app in 42.1s" },
  { stage: "test", level: "info", message: "Running 128 unit + integration tests…" },
  { stage: "test", level: "success", message: "All 128 tests passed (18.4s)" },
  { stage: "deploy", level: "info", message: "Uploading build artifacts to region iad1…" },
  { stage: "deploy", level: "info", message: "POST /v1/deployments → dpl_7Kq2 (queued)" },
  { stage: "deploy", level: "error", message: "Deployment dpl_7Kq2 failed: origin health check timed out after 30s" },
];

function toEntries(script: ScriptLine[]): LogEntry[] {
  return script.map((line, i) => ({
    id: i,
    level: line.level,
    message: line.message,
    source: line.stage,
    timestamp: BASE_TS + i * 1_400,
  }));
}

const SUCCESS_ENTRIES = toEntries(SUCCESS_SCRIPT);
const FAILURE_ENTRIES = toEntries(FAILURE_SCRIPT);

type RunMode = "ok" | "fail";

function scriptFor(mode: RunMode): ScriptLine[] {
  return mode === "fail" ? FAILURE_SCRIPT : SUCCESS_SCRIPT;
}
function entriesFor(mode: RunMode): LogEntry[] {
  return mode === "fail" ? FAILURE_ENTRIES : SUCCESS_ENTRIES;
}

/**
 * Derive the pipeline stages purely from how many log lines are revealed, the
 * run mode, and whether the reader cancelled. No time, no randomness.
 */
function deriveStages(mode: RunMode, revealed: number, cancelled: boolean): Stage[] {
  const script = scriptFor(mode);
  let sawFailure = false;
  return STAGE_PLAN.map((plan) => {
    const idxs = script
      .map((l, i) => (l.stage === plan.id ? i : -1))
      .filter((i) => i >= 0);
    const shownMessages = idxs.filter((i) => i < revealed).map((i) => script[i].message);

    let status: StageStatus;
    if (idxs.length === 0) {
      // No scripted lines for this stage in this run (e.g. promote on failure).
      status = mode === "fail" && sawFailure ? "cancelled" : "queued";
    } else {
      const start = idxs[0];
      const end = idxs[idxs.length - 1];
      if (revealed <= start) {
        status = sawFailure ? "cancelled" : "queued";
      } else if (revealed > end) {
        status = script[end].level === "error" ? "failed" : "passed";
      } else {
        status = cancelled ? "cancelled" : "running";
      }
    }
    if (status === "failed") sawFailure = true;

    const stage: Stage = {
      id: plan.id,
      name: plan.name,
      status,
      logs: shownMessages.length ? shownMessages : undefined,
    };
    if (status === "passed" || status === "failed") stage.durationMs = plan.durationMs;
    return stage;
  });
}

/* -------------------------------------------------------------------------- */
/* Inspector request/response (fictional, provider-neutral)                    */
/* -------------------------------------------------------------------------- */

const AUTH: AuthSummary = {
  scheme: "Bearer",
  principal: "svc_deploy_bot",
  scopes: ["deployments:write", "projects:read"],
  note: "Service token · rotates every 24h",
};

function makeRequest(env: Environment, repo: string): ApiRequest {
  const isProd = env.type === "production";
  return {
    method: "POST",
    url: "https://api.acme-deploy.dev/v1/deployments",
    environment: env.type,
    requestId: "req_9fa2c1e7b0",
    timestamp: BASE_TS,
    query: {
      project: "ledger-web",
      target: env.type,
      wait: "true",
      region: env.region ?? "iad1",
    },
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer ••••••",
      "X-Api-Key": "••••••",
      "User-Agent": "deploy-console/2.1",
    },
    body: {
      project: "ledger-web",
      repo,
      ref: "main",
      target: env.type,
      env: {
        NODE_ENV: isProd ? "production" : "preview",
        FLAGS: "edge,streaming",
      },
    },
  };
}

const SUCCESS_RESPONSE: ApiResponse = {
  status: 201,
  statusText: "Created",
  durationMs: 812,
  retryCount: 0,
  headers: {
    "Content-Type": "application/json",
    "X-Request-Id": "req_9fa2c1e7b0",
    "X-Ratelimit-Remaining": "4998",
    "Set-Cookie": "session=••••••; HttpOnly",
  },
  body: {
    id: "dpl_7Kq2",
    state: "ready",
    url: "https://ledger-web-7kq2.acme.app",
    createdAt: "2024-11-14T22:13:20Z",
  },
  phases: [
    { label: "DNS", durationMs: 24 },
    { label: "TCP", durationMs: 41 },
    { label: "TLS", durationMs: 88 },
    { label: "TTFB", durationMs: 502 },
    { label: "Download", durationMs: 157 },
  ],
};

const FAIL_RESPONSE: ApiResponse = {
  status: 503,
  statusText: "Service Unavailable",
  durationMs: 30_142,
  retryCount: 0,
  error: "Deployment dpl_7Kq2 failed: origin health check timed out after 30s.",
  headers: {
    "Content-Type": "application/json",
    "X-Request-Id": "req_9fa2c1e7b0",
    "Retry-After": "5",
  },
  body: {
    error: {
      code: "health_check_timeout",
      deploymentId: "dpl_7Kq2",
      message: "Origin did not become healthy within 30s.",
    },
  },
};

function deriveInspector(
  deployStatus: StageStatus,
  cancelled: boolean,
  retried: boolean,
): { state: InspectorState; response?: ApiResponse } {
  if (cancelled) return { state: "cancelled", response: undefined };
  switch (deployStatus) {
    case "running":
      return { state: retried ? "retrying" : "loading", response: undefined };
    case "passed":
      return { state: "success", response: { ...SUCCESS_RESPONSE, retryCount: retried ? 1 : 0 } };
    case "failed":
      return { state: "server_error", response: FAIL_RESPONSE };
    default:
      return { state: "idle", response: undefined };
  }
}

/* -------------------------------------------------------------------------- */
/* Default environments                                                        */
/* -------------------------------------------------------------------------- */

const DEFAULT_ENVIRONMENTS: Environment[] = [
  {
    id: "preview",
    name: "Preview · PR-248",
    type: "preview",
    status: "available",
    region: "iad1",
    branch: "feat/ledger-export",
    version: "v0.9.3-rc",
    health: 96,
    lastDeploy: BASE_TS - 1000 * 60 * 12,
  },
  {
    id: "staging",
    name: "Staging",
    type: "staging",
    status: "active",
    region: "iad1",
    branch: "main",
    version: "v2.4.0",
    health: 99,
    lastDeploy: BASE_TS - 1000 * 60 * 47,
  },
  {
    id: "production",
    name: "Production",
    type: "production",
    status: "active",
    region: "iad1 · sfo1",
    branch: "main",
    version: "v2.3.9",
    health: 98,
    warning: "Live customer data — deploys shift real traffic.",
    lastDeploy: BASE_TS - 1000 * 60 * 60 * 5,
  },
];

/* -------------------------------------------------------------------------- */
/* Shared chrome                                                               */
/* -------------------------------------------------------------------------- */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-surface)]";

const controlBtn = cn(
  "inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]",
  "px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--color-fg)] transition-colors",
  "hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[var(--color-border)] disabled:hover:text-[var(--color-fg)]",
  focusRing,
);

const primaryBtn = cn(
  "inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[var(--color-accent)]",
  "bg-[var(--color-accent)] px-4 py-2 text-[13px] font-semibold text-[var(--color-accent-fg,white)] transition-colors",
  "hover:bg-[color-mix(in_oklab,var(--color-accent)_88%,black)]",
  "disabled:cursor-not-allowed disabled:opacity-55",
  focusRing,
);

function RocketGlyph() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.9.7-2.2-.1-3a2.1 2.1 0 0 0-2.9 0Z" />
      <path d="M12 15 9 12a15 15 0 0 1 8-9c2.5 0 4 1.5 4 4a15 15 0 0 1-9 8Z" />
      <path d="M9 12H4s.5-2.8 2-4c1.7-1.3 4 0 4 0M12 15v5s2.8-.5 4-2c1.3-1.7 0-4 0-4" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Props                                                                        */
/* -------------------------------------------------------------------------- */

export interface DeploymentCommandCenterProps {
  /** Environments offered in the top-bar switcher. The app owns this data. */
  environments?: Environment[];
  /** Which environment id is selected on first render. */
  defaultEnvironmentId?: string;
  /** Repository slug shown in the request body (fictional in the demo). */
  repo?: string;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Main block                                                                   */
/* -------------------------------------------------------------------------- */

export function DeploymentCommandCenter({
  environments = DEFAULT_ENVIRONMENTS,
  defaultEnvironmentId,
  repo = "acme/ledger-web",
  className,
}: DeploymentCommandCenterProps) {
  const reduce = useReducedMotion();

  /* selected environment ------------------------------------------------- */
  const initialEnvId =
    defaultEnvironmentId ?? environments.find((e) => e.type === "staging")?.id ?? environments[0]?.id ?? "";
  const [selectedEnvId, setSelectedEnvId] = React.useState(initialEnvId);
  const selectedEnv =
    environments.find((e) => e.id === selectedEnvId) ?? environments[0];

  /* run state machine ---------------------------------------------------- */
  // Default first paint: a finished successful run so the console reads richly.
  const [mode, setMode] = React.useState<RunMode>("ok");
  const [revealed, setRevealed] = React.useState<number>(SUCCESS_ENTRIES.length);
  const [running, setRunning] = React.useState(false);
  const [retried, setRetried] = React.useState(false);
  const [cancelled, setCancelled] = React.useState(false);
  // Bumped per run so the log stream re-pins to the tail on a fresh deploy.
  const [runToken, setRunToken] = React.useState(0);
  const [following, setFollowing] = React.useState(true);

  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const lenRef = React.useRef<number>(SUCCESS_ENTRIES.length);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  React.useEffect(() => () => clearTimer(), [clearTimer]);

  // Stop the run when the scripted timeline is exhausted.
  React.useEffect(() => {
    if (running && revealed >= lenRef.current) {
      setRunning(false);
      clearTimer();
    }
  }, [running, revealed, clearTimer]);

  const startRun = React.useCallback(
    (nextMode: RunMode, isRetry: boolean) => {
      clearTimer();
      lenRef.current = entriesFor(nextMode).length;
      setMode(nextMode);
      setRetried(isRetry);
      setCancelled(false);
      setRevealed(0);
      setRunning(true);
      setFollowing(true);
      setRunToken((t) => t + 1);
      timerRef.current = setInterval(() => {
        setRevealed((r) => Math.min(r + 1, lenRef.current));
      }, 750);
    },
    [clearTimer],
  );

  const deploy = React.useCallback(() => startRun("ok", false), [startRun]);
  const deployWithFailure = React.useCallback(() => startRun("fail", false), [startRun]);
  const retryRun = React.useCallback(() => startRun("ok", true), [startRun]);

  const cancelRun = React.useCallback(() => {
    clearTimer();
    setRunning(false);
    setCancelled(true);
  }, [clearTimer]);

  const reset = React.useCallback(() => {
    clearTimer();
    setMode("ok");
    setRetried(false);
    setCancelled(false);
    setRunning(false);
    setRevealed(SUCCESS_ENTRIES.length);
    setFollowing(true);
    setRunToken((t) => t + 1);
  }, [clearTimer]);

  /* derived views -------------------------------------------------------- */
  const entries = entriesFor(mode);
  const target = entries.length;
  const visibleEntries = React.useMemo(() => entries.slice(0, revealed), [entries, revealed]);
  const stages = React.useMemo(
    () => deriveStages(mode, revealed, cancelled),
    [mode, revealed, cancelled],
  );

  const done = !running && revealed >= target;
  const failed = mode === "fail" && done && !cancelled;
  const completed = mode === "ok" && done && !cancelled;

  const deployStage = stages.find((s) => s.id === "deploy")!;
  const { state: inspectorState, response: inspectorResponse } = deriveInspector(
    deployStage.status,
    cancelled,
    retried,
  );

  const request = React.useMemo(() => makeRequest(selectedEnv, repo), [selectedEnv, repo]);

  const streamStatus: LogStreamStatus = cancelled
    ? "idle"
    : running
      ? "streaming"
      : failed
        ? "error"
        : completed
          ? "completed"
          : "idle";

  const phaseLabel = cancelled
    ? "Cancelled"
    : running
      ? "Deploying"
      : failed
        ? "Failed"
        : completed
          ? "Deployed"
          : "Idle";

  const onEnvChange = React.useCallback((id: string) => setSelectedEnvId(id), []);

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-[var(--color-fg)] shadow-[var(--shadow-md)] sm:p-4",
        className,
      )}
    >
      {/* Top bar -------------------------------------------------------- */}
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-3.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="flex items-center gap-2 text-[13.5px] font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]" aria-hidden>
              <RocketGlyph />
            </span>
            <span className="flex flex-col leading-tight">
              <span>Deployment Command Center</span>
              <span className="font-mono text-[11px] font-normal text-[var(--color-muted)]">{repo}</span>
            </span>
          </span>

          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[11.5px] font-medium text-[var(--color-muted)]"
            role="status"
            aria-live="polite"
          >
            <span className="relative grid h-2 w-2 place-items-center" aria-hidden>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: running
                    ? "var(--color-accent)"
                    : failed
                      ? "var(--color-error)"
                      : completed
                        ? "var(--color-success)"
                        : "var(--color-muted)",
                }}
              />
              {running && !reduce ? (
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ background: "var(--color-accent)" }}
                  initial={{ opacity: 0.55, scale: 1 }}
                  animate={{ opacity: 0, scale: 2.6 }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                />
              ) : null}
            </span>
            {phaseLabel}
          </span>

          <span className="ml-auto flex flex-wrap items-center gap-2">
            <button type="button" className={primaryBtn} onClick={deploy} disabled={running}>
              <RocketGlyph />
              {running ? "Deploying…" : "Deploy"}
            </button>
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
          <div className="min-w-[15rem] flex-1">
            <EnvironmentSwitcher
              environments={environments}
              value={selectedEnvId}
              onValueChange={onEnvChange}
              requireProductionConfirmation
              recentIds={["staging"]}
              favoriteIds={["production"]}
              now={BASE_TS}
              label="Target environment"
            />
          </div>
        </div>
      </div>

      {/* Console grid --------------------------------------------------- */}
      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        {/* Main column: pipeline + logs ------------------------------- */}
        <div className="flex min-w-0 flex-col gap-3">
          <section aria-label="Deployment pipeline" className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-[12.5px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Pipeline</h3>
              <span className="font-mono text-[11.5px] text-[var(--color-muted)]">
                {stages.filter((s) => s.status === "passed").length}/{stages.length} stages
              </span>
            </div>
            <DeploymentPipeline stages={stages} onRetry={() => retryRun()} />
          </section>

          <section aria-label="Live logs" className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-[12.5px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Logs</h3>
              <span className="inline-flex items-center gap-1 font-mono text-[11.5px] text-[var(--color-muted)]">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: following ? "var(--color-success)" : "var(--color-muted)" }}
                  aria-hidden
                />
                {following ? "Following latest" : "Paused — scroll to resume"}
              </span>
            </div>
            <LiveLogStream
              key={runToken}
              entries={visibleEntries}
              status={streamStatus}
              errorMessage={FAIL_RESPONSE.error}
              onFollowChange={setFollowing}
              onRetry={retryRun}
              title="Deploy output"
              className="[--log-height:16rem]"
            />
          </section>
        </div>

        {/* Side panel: request inspector ------------------------------ */}
        <aside aria-label="Request inspector" className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-[12.5px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Deploy request</h3>
          </div>
          <div className="lg:sticky lg:top-3">
            <ApiRequestInspector
              request={request}
              response={inspectorResponse}
              state={inspectorState}
              auth={AUTH}
              onRetry={retryRun}
              onCancel={cancelRun}
              defaultSection="response-body"
              title="POST /v1/deployments"
            />
          </div>
        </aside>
      </div>

      {/* Demo controls + note ------------------------------------------ */}
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Console controls">
          <button type="button" className={controlBtn} onClick={deploy} disabled={running}>
            Run deploy
          </button>
          <button type="button" className={controlBtn} onClick={deployWithFailure} disabled={running}>
            Run with failure
          </button>
          <button type="button" className={controlBtn} onClick={retryRun}>
            Retry
          </button>
          {running ? (
            <button type="button" className={controlBtn} onClick={cancelRun}>
              Cancel
            </button>
          ) : null}
          <button type="button" className={controlBtn} onClick={reset}>
            Reset
          </button>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11.5px] text-[var(--color-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" aria-hidden />
          Demo data — fictional, no live provider
        </span>
      </div>
    </div>
  );
}

export default DeploymentCommandCenter;
