"use client";

import * as React from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import { useControllableState, useReducedMotion } from "@/lib/motiq";

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
  type AuthSummary,
  type InspectorState,
} from "@/components/motiq/api-request-inspector";

/**
 * DeploymentControlHero — an editable two-column hero for developer-tool and
 * infrastructure products. The left column carries the marketing outcome
 * (eyebrow + headline + copy + two CTAs); the right column is a *reduced*
 * deployment control surface that composes four released developer-tools
 * components — an EnvironmentSwitcher (the selected target), a DeploymentPipeline
 * (four clear stages), one short LiveLogStream, and one ApiRequestInspector
 * (the release request/result). It is a hero framing of a real workflow, not a
 * crammed dashboard.
 *
 * IMPORTANT — DEMO ONLY. Nothing here talks to a real provider. The repo,
 * branch, commit, host, release id, headers, and timings are all fictional and
 * provider-neutral (repo `orbit/checkout-web`, host `api.orbit-deploy.dev`,
 * release `rel_4Xa9`). Credential headers are pre-masked placeholders
 * (`Bearer ••••••`) and the inspector redacts them anyway.
 *
 * Determinism: no `Date.now()` / `Math.random()` / `new Date()` at module scope,
 * during render, or in state initializers. Every timestamp derives from a fixed
 * baseline, so the server- and client-rendered first paint are identical. The
 * whole surface is a pure function of the current `phase`; the phase can be app
 * controlled or advanced by the primary CTA. Clean-room original.
 */

/* -------------------------------------------------------------------------- */
/* Phase machine                                                               */
/* -------------------------------------------------------------------------- */

export type DeployHeroPhase =
  | "ready"
  | "deploying"
  | "validating"
  | "failed"
  | "retrying"
  | "completed";

// Fixed baseline so the first paint is deterministic across server and client.
const BASE_TS = 1_700_000_000_000;
const STEP_MS = 1_400;

type StageId = "build" | "test" | "deploy" | "verify";

/** Ordered log script; each line is tagged with the stage it belongs to. */
interface ScriptLine {
  stage: StageId;
  level: LogLevel;
  message: string;
}

const BUILD_LINES: ScriptLine[] = [
  { stage: "build", level: "info", message: "Checkout commit 9f3c2ad on release/handoff" },
  { stage: "build", level: "info", message: "Installing 214 packages from the workspace lockfile" },
  { stage: "build", level: "success", message: "Bundle compiled in 38.2s" },
];
const TEST_LINES: ScriptLine[] = [
  { stage: "test", level: "info", message: "Running 96 checks across 8 shards" },
  { stage: "test", level: "success", message: "96 checks passed in 12.7s" },
];
const DEPLOY_START_LINES: ScriptLine[] = [
  { stage: "deploy", level: "info", message: "Uploading artifact to edge region code-1" },
  { stage: "deploy", level: "info", message: "POST /v1/releases -> rel_4Xa9 (queued)" },
];
const DEPLOY_OK: ScriptLine = {
  stage: "deploy",
  level: "success",
  message: "Release rel_4Xa9 accepted and marked ready",
};
const DEPLOY_ERR: ScriptLine = {
  stage: "deploy",
  level: "error",
  message: "Release rel_4Xa9 rejected: origin health check timed out after 30s",
};
const VERIFY_LINES: ScriptLine[] = [
  { stage: "verify", level: "info", message: "Draining the previous release, shifting traffic" },
  { stage: "verify", level: "success", message: "Traffic at 100% on rel_4Xa9 — 0 error budget spent" },
];

function toEntries(lines: ScriptLine[]): LogEntry[] {
  return lines.map((line, i) => ({
    id: i,
    level: line.level,
    message: line.message,
    source: line.stage,
    timestamp: BASE_TS + i * STEP_MS,
  }));
}

/** The four ordered stages, and their status for a given phase. */
const STAGE_ORDER: { id: StageId; name: string }[] = [
  { id: "build", name: "Build" },
  { id: "test", name: "Test" },
  { id: "deploy", name: "Deploy" },
  { id: "verify", name: "Verify" },
];

const STAGE_DURATIONS: Record<StageId, number> = {
  build: 38_200,
  test: 12_700,
  deploy: 9_400,
  verify: 5_100,
};

interface PhaseView {
  /** Human phase label shown in the surface header and the status pill. */
  label: string;
  /** Per-stage status keyed by stage id (build, test, deploy, verify). */
  stageStatus: Record<StageId, StageStatus>;
  /** Ordered log lines revealed at this phase. */
  lines: ScriptLine[];
  streamStatus: LogStreamStatus;
  inspectorState: InspectorState;
  /** Which canned response the inspector shows, if any. */
  response: "ok" | "fail" | null;
  retryCount: number;
}

function phaseView(phase: DeployHeroPhase): PhaseView {
  switch (phase) {
    case "ready":
      return {
        label: "Ready to deploy",
        stageStatus: { build: "queued", test: "queued", deploy: "queued", verify: "queued" },
        lines: [],
        streamStatus: "idle",
        inspectorState: "idle",
        response: null,
        retryCount: 0,
      };
    case "deploying":
      return {
        label: "Deploying",
        stageStatus: { build: "passed", test: "passed", deploy: "running", verify: "queued" },
        lines: [...BUILD_LINES, ...TEST_LINES, ...DEPLOY_START_LINES],
        streamStatus: "streaming",
        inspectorState: "loading",
        response: null,
        retryCount: 0,
      };
    case "validating":
      return {
        label: "Validating release",
        stageStatus: { build: "passed", test: "passed", deploy: "passed", verify: "running" },
        lines: [...BUILD_LINES, ...TEST_LINES, ...DEPLOY_START_LINES, DEPLOY_OK, VERIFY_LINES[0]],
        streamStatus: "streaming",
        inspectorState: "success",
        response: "ok",
        retryCount: 0,
      };
    case "failed":
      return {
        label: "Deploy failed",
        stageStatus: { build: "passed", test: "passed", deploy: "failed", verify: "cancelled" },
        lines: [...BUILD_LINES, ...TEST_LINES, ...DEPLOY_START_LINES, DEPLOY_ERR],
        streamStatus: "error",
        inspectorState: "server_error",
        response: "fail",
        retryCount: 0,
      };
    case "retrying":
      return {
        label: "Retrying deploy",
        stageStatus: { build: "passed", test: "passed", deploy: "running", verify: "queued" },
        lines: [...BUILD_LINES, ...TEST_LINES, ...DEPLOY_START_LINES],
        streamStatus: "streaming",
        inspectorState: "retrying",
        response: null,
        retryCount: 1,
      };
    case "completed":
    default:
      return {
        label: "Deployed",
        stageStatus: { build: "passed", test: "passed", deploy: "passed", verify: "passed" },
        lines: [...BUILD_LINES, ...TEST_LINES, ...DEPLOY_START_LINES, DEPLOY_OK, ...VERIFY_LINES],
        streamStatus: "completed",
        inspectorState: "success",
        response: "ok",
        retryCount: 0,
      };
  }
}

/** Natural next phase when the demo is advanced from the primary CTA. */
const NEXT_PHASE: Record<DeployHeroPhase, DeployHeroPhase> = {
  ready: "deploying",
  deploying: "validating",
  validating: "completed",
  completed: "ready",
  failed: "retrying",
  retrying: "completed",
};

function deriveStages(view: PhaseView, lines: LogEntry[]): Stage[] {
  return STAGE_ORDER.map(({ id, name }) => {
    const status = view.stageStatus[id];
    const stageLogs = lines.filter((l) => l.source === id).map((l) => l.message);
    const stage: Stage = { id, name, status };
    if (stageLogs.length) stage.logs = stageLogs;
    if (status === "passed" || status === "failed") stage.durationMs = STAGE_DURATIONS[id];
    return stage;
  });
}

/* -------------------------------------------------------------------------- */
/* Inspector request / response (fictional, provider-neutral)                  */
/* -------------------------------------------------------------------------- */

const AUTH: AuthSummary = {
  scheme: "Bearer",
  principal: "svc_release_bot",
  scopes: ["releases:write", "projects:read"],
  note: "Service token · rotates every 24h",
};

function makeRequest(env: Environment, data: DeployHeroDataset): ApiRequest {
  return {
    method: "POST",
    url: `https://${data.host}/v1/releases`,
    environment: env.type,
    requestId: "req_5b1c9e0a2f",
    timestamp: BASE_TS,
    query: { project: data.project, target: env.type, region: env.region ?? data.region },
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer ••••••",
      "X-Api-Key": "••••••",
    },
    body: {
      project: data.project,
      repo: data.repo,
      ref: data.branch,
      commit: data.commit,
      target: env.type,
    },
  };
}

function makeResponse(view: PhaseView): ApiResponse | undefined {
  if (view.response === "ok") {
    return {
      status: 201,
      statusText: "Created",
      durationMs: 742,
      retryCount: view.retryCount,
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": "req_5b1c9e0a2f",
        "X-Ratelimit-Remaining": "4991",
      },
      body: {
        id: "rel_4Xa9",
        state: "ready",
        url: "https://checkout-web-4xa9.orbit.app",
        createdAt: "2023-11-14T22:13:20Z",
      },
      phases: [
        { label: "DNS", durationMs: 21 },
        { label: "TLS", durationMs: 84 },
        { label: "TTFB", durationMs: 486 },
        { label: "Download", durationMs: 151 },
      ],
    };
  }
  if (view.response === "fail") {
    return {
      status: 503,
      statusText: "Service Unavailable",
      durationMs: 30_118,
      retryCount: view.retryCount,
      error: "Release rel_4Xa9 rejected: origin health check timed out after 30s.",
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": "req_5b1c9e0a2f",
        "Retry-After": "5",
      },
      body: {
        error: {
          code: "health_check_timeout",
          releaseId: "rel_4Xa9",
          message: "Origin did not become healthy within 30s.",
        },
      },
    };
  }
  return undefined;
}

/* -------------------------------------------------------------------------- */
/* Defaults                                                                     */
/* -------------------------------------------------------------------------- */

export interface DeployHeroDataset {
  /** Project slug shown in the request query. */
  project: string;
  /** Repository slug shown in the request body. */
  repo: string;
  branch: string;
  commit: string;
  region: string;
  /** API host used to build the (fictional) release request URL. */
  host: string;
}

const DEFAULT_DATASET: DeployHeroDataset = {
  project: "checkout-web",
  repo: "orbit/checkout-web",
  branch: "release/handoff",
  commit: "9f3c2ad",
  region: "code-1",
  host: "api.orbit-deploy.dev",
};

const DEFAULT_ENVIRONMENTS: Environment[] = [
  {
    id: "preview",
    name: "Preview · PR-311",
    type: "preview",
    status: "available",
    region: "code-1",
    branch: "feat/handoff",
    version: "v0.8.1-rc",
    health: 95,
    lastDeploy: BASE_TS - 1000 * 60 * 9,
  },
  {
    id: "staging",
    name: "Staging",
    type: "staging",
    status: "active",
    region: "code-1",
    branch: "release/handoff",
    version: "v3.2.0",
    health: 99,
    lastDeploy: BASE_TS - 1000 * 60 * 33,
  },
  {
    id: "production",
    name: "Production",
    type: "production",
    status: "active",
    region: "code-1 · code-2",
    branch: "main",
    version: "v3.1.7",
    health: 98,
    warning: "Live customer data — deploys shift real traffic.",
    lastDeploy: BASE_TS - 1000 * 60 * 60 * 4,
  },
];

/* -------------------------------------------------------------------------- */
/* Shared chrome                                                               */
/* -------------------------------------------------------------------------- */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]";

const primaryCtaCls = cn(
  "inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[var(--color-accent)]",
  "bg-[var(--color-accent)] px-5 py-2.5 text-[14px] font-semibold text-[var(--color-accent-fg,white)] transition-colors",
  "hover:bg-[color-mix(in_oklab,var(--color-accent)_88%,black)]",
  focusRing,
);

const secondaryCtaCls = cn(
  "inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[var(--color-border)]",
  "bg-[var(--color-surface)] px-5 py-2.5 text-[14px] font-semibold text-[var(--color-fg)] transition-colors",
  "hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
  focusRing,
);

function RocketGlyph() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.9.7-2.2-.1-3a2.1 2.1 0 0 0-2.9 0Z" />
      <path d="M12 15 9 12a15 15 0 0 1 8-9c2.5 0 4 1.5 4 4a15 15 0 0 1-9 8Z" />
      <path d="M9 12H4s.5-2.8 2-4c1.7-1.3 4 0 4 0M12 15v5s2.8-.5 4-2c1.3-1.7 0-4 0-4" />
    </svg>
  );
}

function ArrowGlyph() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Props                                                                        */
/* -------------------------------------------------------------------------- */

export interface DeployHeroCta {
  label: React.ReactNode;
  /** Renders the CTA as a link. When omitted, the CTA is a real button. */
  href?: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export interface DeploymentControlHeroProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  /** Small label above the headline. */
  eyebrow?: React.ReactNode;
  /** The outcome headline (rendered as the hero's <h2> heading). */
  headline?: React.ReactNode;
  /** Supporting copy under the headline. */
  copy?: React.ReactNode;
  /** Primary CTA. With no `href` it advances the demo phase. */
  primaryCta?: DeployHeroCta;
  /** Secondary CTA. */
  secondaryCta?: DeployHeroCta;
  /** Controlled demo phase. */
  phase?: DeployHeroPhase;
  /** Uncontrolled initial phase. */
  defaultPhase?: DeployHeroPhase;
  /** Notified whenever the phase changes. */
  onPhaseChange?: (phase: DeployHeroPhase) => void;
  /** Override the fictional demo dataset (repo, branch, host, …). */
  dataset?: DeployHeroDataset;
  /** Environments offered in the switcher. */
  environments?: Environment[];
  /** Which environment id is selected on first render. */
  defaultEnvironmentId?: string;
  /** A decorative slot rendered behind the hero. Never imported here. */
  background?: React.ReactNode;
  /** Force reduced motion for this block's own decorative motion. */
  reducedMotion?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                    */
/* -------------------------------------------------------------------------- */

export function DeploymentControlHero({
  eyebrow = "Ship with confidence",
  headline = "Every deploy, watched from commit to live traffic.",
  copy = "Promote a build across environments, follow the pipeline stage by stage, and read the release response — without leaving the page.",
  primaryCta = { label: "Start deploying" },
  secondaryCta = { label: "Read the docs" },
  phase,
  defaultPhase = "deploying",
  onPhaseChange,
  dataset = DEFAULT_DATASET,
  environments = DEFAULT_ENVIRONMENTS,
  defaultEnvironmentId,
  background,
  reducedMotion,
  className,
  ...rest
}: DeploymentControlHeroProps) {
  const hookReduce = useReducedMotion();
  const reduce = reducedMotion ?? hookReduce;
  const headingId = React.useId();

  const [currentPhase, setPhase] = useControllableState<DeployHeroPhase>({
    value: phase,
    defaultValue: defaultPhase,
    onChange: onPhaseChange,
  });

  const initialEnvId =
    defaultEnvironmentId ??
    environments.find((e) => e.type === "staging")?.id ??
    environments[0]?.id ??
    "";
  const [selectedEnvId, setSelectedEnvId] = React.useState(initialEnvId);
  const selectedEnv =
    environments.find((e) => e.id === selectedEnvId) ?? environments[0];

  const view = React.useMemo(() => phaseView(currentPhase), [currentPhase]);
  const entries = React.useMemo(() => toEntries(view.lines), [view.lines]);
  const stages = React.useMemo(() => deriveStages(view, entries), [view, entries]);
  const request = React.useMemo(
    () => (selectedEnv ? makeRequest(selectedEnv, dataset) : undefined),
    [selectedEnv, dataset],
  );
  const response = React.useMemo(() => makeResponse(view), [view]);

  const advance = React.useCallback(() => {
    setPhase(NEXT_PHASE[currentPhase]);
  }, [currentPhase, setPhase]);

  const retry = React.useCallback(() => setPhase("retrying"), [setPhase]);
  const onEnvChange = React.useCallback((id: string) => setSelectedEnvId(id), []);

  const running = view.streamStatus === "streaming";
  const failed = view.streamStatus === "error";
  const done = view.streamStatus === "completed";
  const pillColor = running
    ? "var(--color-accent)"
    : failed
      ? "var(--color-error)"
      : done
        ? "var(--color-success)"
        : "var(--color-muted)";

  /* CTA renderers ------------------------------------------------------- */
  const renderCta = (cta: DeployHeroCta, cls: string, isPrimary: boolean) => {
    const content = (
      <>
        {isPrimary ? <RocketGlyph /> : null}
        {cta.label}
        {!isPrimary ? <ArrowGlyph /> : null}
      </>
    );
    if (cta.href) {
      return (
        <a href={cta.href} onClick={cta.onClick} className={cls}>
          {content}
        </a>
      );
    }
    return (
      <button
        type="button"
        onClick={(e) => {
          cta.onClick?.(e);
          // With no explicit handler, the primary CTA drives the demo forward.
          if (isPrimary && !cta.onClick) advance();
        }}
        className={cls}
      >
        {content}
      </button>
    );
  };

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "relative isolate w-full overflow-hidden rounded-3xl border border-[var(--color-border)]",
        "bg-[var(--color-bg)] text-[var(--color-fg)] shadow-[var(--shadow-md)]",
        className,
      )}
      {...rest}
    >
      {/* Decorative slot — consumer-provided, purely visual. */}
      {background ? (
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          {background}
        </div>
      ) : null}

      <div className="grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:gap-10 lg:p-12">
        {/* Left: outcome copy + CTAs ------------------------------------- */}
        <div className="flex max-w-xl flex-col gap-5">
          {eyebrow ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[12.5px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" aria-hidden />
              {eyebrow}
            </span>
          ) : null}

          <h2
            id={headingId}
            className="text-balance text-[clamp(1.9rem,4.4vw,3.1rem)] font-bold leading-[1.08] tracking-tight text-[var(--color-fg)]"
          >
            {headline}
          </h2>

          {copy ? (
            <p className="max-w-prose text-[15px] leading-relaxed text-[var(--color-muted)] sm:text-[16px]">
              {copy}
            </p>
          ) : null}

          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {renderCta(primaryCta, primaryCtaCls, true)}
            {secondaryCta ? renderCta(secondaryCta, secondaryCtaCls, false) : null}
          </div>
        </div>

        {/* Right: the deployment control surface ------------------------- */}
        <div className="min-w-0">
          <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 shadow-[var(--shadow-sm)] sm:p-4">
            {/* Surface header --------------------------------------------- */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="flex items-center gap-2 text-[13px] font-semibold">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]" aria-hidden>
                  <RocketGlyph />
                </span>
                <span className="flex flex-col leading-tight">
                  <span>Release console</span>
                  <span className="font-mono text-[11px] font-normal text-[var(--color-muted)]">
                    {dataset.repo}
                  </span>
                </span>
              </span>

              <span
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-0.5 text-[11.5px] font-medium text-[var(--color-muted)]"
                role="status"
                aria-live="polite"
              >
                <span className="relative grid h-2 w-2 place-items-center" aria-hidden>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: pillColor }} />
                  {running && !reduce ? (
                    <motion.span
                      className="absolute inset-0 rounded-full"
                      style={{ background: pillColor }}
                      initial={{ opacity: 0.55, scale: 1 }}
                      animate={{ opacity: 0, scale: 2.6 }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                    />
                  ) : null}
                </span>
                {view.label}
              </span>
            </div>

            {/* Selected environment (compact) ----------------------------- */}
            <EnvironmentSwitcher
              environments={environments}
              value={selectedEnvId}
              onValueChange={onEnvChange}
              requireProductionConfirmation
              recentIds={["staging"]}
              favoriteIds={["production"]}
              now={BASE_TS}
              label="Deploy target"
              className="max-w-none"
            />

            {/* Pipeline — four clear stages ------------------------------- */}
            <section aria-label="Deployment pipeline" className="min-w-0">
              <DeploymentPipeline stages={stages} onRetry={retry} />
            </section>

            {/* One short log region --------------------------------------- */}
            <section aria-label="Deployment output" className="min-w-0">
              <LiveLogStream
                entries={entries}
                status={view.streamStatus}
                errorMessage="Release rel_4Xa9 rejected: origin health check timed out after 30s."
                onRetry={retry}
                title="Deploy output"
                label="Deployment output"
                className="[--log-height:9.5rem]"
              />
            </section>

            {/* One request/release result --------------------------------- */}
            {request ? (
              <section aria-label="Release request" className="min-w-0">
                <ApiRequestInspector
                  request={request}
                  response={response}
                  state={view.inspectorState}
                  auth={AUTH}
                  onRetry={retry}
                  defaultSection="response-body"
                  title="POST /v1/releases"
                />
              </section>
            ) : null}

            <p className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" aria-hidden />
              Demo data — fictional, no live provider
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DeploymentControlHero;
