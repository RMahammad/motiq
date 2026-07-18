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
 * DeploymentControlHero — an editable hero for developer-tool and infrastructure
 * products. A wide copy band (eyebrow + headline + copy + two CTAs + live status)
 * sits above a full-width release-console window that composes four released
 * developer-tools components — an EnvironmentSwitcher (the selected target), a
 * DeploymentPipeline (four clear stages), one short LiveLogStream, and one
 * ApiRequestInspector (the release request/result). On wide screens the surface
 * tiles into two columns (target + pipeline + logs · release response) so the
 * hero holds a calm height. It is a hero framing of a real workflow, not a
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
  { stage: "verify", level: "success", message: "Traffic at 100% on rel_4Xa9 - 0 error budget spent" },
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
    warning: "Live customer data - deploys shift real traffic.",
    lastDeploy: BASE_TS - 1000 * 60 * 60 * 4,
  },
];

/* -------------------------------------------------------------------------- */
/* Shared chrome                                                               */
/* -------------------------------------------------------------------------- */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]";

const primaryCtaCls = cn(
  "inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[color-mix(in_oklab,var(--color-accent)_55%,black)]",
  "bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-accent)_86%,white)_0%,var(--color-accent)_60%)] px-5 py-2.5 text-[14px] font-semibold text-[var(--color-accent-fg,white)]",
  "shadow-[0_1px_0_0_color-mix(in_oklab,white_45%,transparent)_inset,0_8px_22px_-10px_color-mix(in_oklab,var(--color-accent)_80%,transparent)]",
  "transition-[transform,box-shadow,filter] hover:brightness-[1.06] motion-safe:hover:-translate-y-px",
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

/** Decorative, static, token-based ambient field — soft accent glows + a fading
 *  dot grid. Purely visual: aria-hidden, no motion, no browser globals. Renders
 *  only when the consumer provides no `background` of their own. */
function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -left-[12%] -top-[20%] h-[65%] w-[55%] rounded-full opacity-70 blur-[90px]"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in oklab, var(--color-accent) 20%, transparent), transparent 68%)",
        }}
      />
      <div
        className="absolute -right-[8%] top-1/3 h-[60%] w-[45%] rounded-full opacity-50 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in oklab, var(--color-accent) 12%, transparent), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in oklab, var(--color-border) 55%, transparent) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          WebkitMaskImage: "radial-gradient(115% 80% at 50% 0%, black, transparent 72%)",
          maskImage: "radial-gradient(115% 80% at 50% 0%, black, transparent 72%)",
        }}
      />
    </div>
  );
}

const DEFAULT_PROOF: string[] = [
  "Promote one build across every environment",
  "Follow every stage from commit to live traffic",
  "Read the real release response, not a spinner",
];

/** Three short capability lines that give the copy region substance beside the
 *  live surface. Text-only; the check glyph is decorative. */
function ProofStrip({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-7 sm:gap-y-2">
      {items.map((t) => (
        <li key={t} className="flex items-center gap-2.5 text-[13.5px] text-[var(--color-fg)]">
          <span
            className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]"
            aria-hidden
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 6.2 5 8.5l4.5-5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                    */
/* -------------------------------------------------------------------------- */

export function DeploymentControlHero({
  eyebrow = "Ship with confidence",
  headline = "Every deploy, watched from commit to live traffic.",
  copy = "Promote a build across environments, follow the pipeline stage by stage, and read the release response - without leaving the page.",
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
      {/* Decorative slot — consumer-provided, else the built-in ambient field. */}
      {background ? (
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          {background}
        </div>
      ) : (
        <HeroBackdrop />
      )}

      <div className="flex flex-col gap-8 p-6 sm:p-8 lg:gap-10 lg:p-12">
        {/* Copy band — headline/copy on one side, CTAs + live status on the
            other, so the marketing row reads wide instead of a thin column. */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-10">
          <div className="flex min-w-0 flex-col gap-4">
            {eyebrow ? (
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_80%,transparent)] px-3 py-1 text-[12.5px] font-semibold uppercase tracking-wide text-[var(--color-muted)] backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5" aria-hidden>
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-70 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                </span>
                {eyebrow}
              </span>
            ) : null}

            <h2
              id={headingId}
              className="text-balance text-[clamp(2rem,4.6vw,3.25rem)] font-bold leading-[1.05] tracking-tight text-[var(--color-fg)]"
            >
              {headline}
            </h2>

            {copy ? (
              <p className="max-w-[56ch] text-[15px] leading-relaxed text-[var(--color-muted)] sm:text-[16px]">
                {copy}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col items-start gap-4 lg:items-end">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {renderCta(primaryCta, primaryCtaCls, true)}
              {secondaryCta ? renderCta(secondaryCta, secondaryCtaCls, false) : null}
            </div>
            <span
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[12.5px] font-medium text-[var(--color-fg)]"
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
              Live status: {view.label}
            </span>
          </div>
        </div>

        {/* Proof row — three capability lines that carry the copy region. */}
        <div className="flex flex-col gap-4">
          <div className="h-px w-full bg-[var(--color-border)]" />
          <ProofStrip items={DEFAULT_PROOF} />
        </div>

        {/* Release console — a full-width app window. On wide screens the control
            surface tiles into two columns (target + pipeline · logs + response)
            so the hero holds a calm height. No overflow/max-height clip: the
            composed children run Framer `layout` animations that collapse inside
            a constrained scroll ancestor. */}
        <div className="relative min-w-0">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(55% 40% at 50% 0%, color-mix(in oklab, var(--color-accent) 18%, transparent), transparent)",
            }}
          />
          <div className="relative flex min-w-0 flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-[var(--shadow-lg)]">
            {/* Window header --------------------------------------------- */}
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_60%,var(--color-bg-secondary))] px-4 py-3 sm:px-5">
              <span className="flex items-center gap-2.5 text-[13px] font-semibold">
                <span className="flex items-center gap-1.5" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--color-error)_65%,transparent)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--color-warning)_70%,transparent)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--color-success)_65%,transparent)]" />
                </span>
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

              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-warning)] bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-warning)]">
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                Demo data
              </span>
            </div>

            {/* Two tiled columns: target + pipeline · logs + response ---- */}
            <div className="grid min-w-0 gap-4 p-4 sm:p-5 lg:grid-cols-2 lg:gap-5 lg:items-start">
              <div className="flex min-w-0 flex-col gap-4">
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

                <section aria-label="Deployment pipeline" className="min-w-0">
                  <DeploymentPipeline stages={stages} onRetry={retry} />
                </section>

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
              </div>

              <div className="flex min-w-0 flex-col gap-4">
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
              </div>
            </div>

            {/* Honesty footer ------------------------------------------- */}
            <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5 sm:px-5">
              <p className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" aria-hidden />
                Demo data - fictional, no live provider.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DeploymentControlHero;
