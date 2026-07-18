"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  getStatusMeta,
  statusVars,
  useControllableState,
  type StatusTone,
} from "@/lib/motiq";
import {
  AgentRunTimeline,
  type AgentRun,
  type RunStep,
  type RunStage,
  type StepStatus,
} from "@/components/motiq/agent-run-timeline";
import {
  ToolCallActivity,
  type ToolCall,
  type ToolCallStatus,
} from "@/components/motiq/tool-call-activity";
import {
  AiResponseStream,
  type ResponseSegment,
  type StreamState,
  type StreamSource,
} from "@/components/motiq/ai-response-stream";
import {
  SourceCitationRail,
  CitationMarker,
  type CitationSource,
} from "@/components/motiq/source-citation-rail";

/**
 * AiAgentWorkspace — a composed, full-page AI agent workspace built from four
 * released Motiq components:
 *   • AgentRunTimeline    — the run, step-by-step, with approval + retry controls
 *   • ToolCallActivity    — the same run seen as a live tool-call inspector
 *   • AiResponseStream    — the streamed answer, with inline citations
 *   • SourceCitationRail   — interactive, claim-level source attribution
 *
 * It is strictly a *presentation* composition. It never talks to a model, never
 * executes an agent, never retrieves anything, and never fabricates a result.
 * The application owns the workspace state end to end; this block simply renders
 * whatever `phase` + `dataset` it is given and reports user intent
 * (approve / reject / retry / cancel / stop) back by moving the phase. It ships
 * with clearly-fictional inline demo data so it renders standalone, and every
 * override is a prop so a host app can drive the exact same UI from real state.
 *
 * The demo state machine has six required states — Idle · Running · Waiting for
 * approval · Completed · Failed · Cancelled — each of which fully determines the
 * state of all four child components. Callbacks transition between phases:
 *   approve  → completed     reject  → cancelled
 *   retry    → running       cancel  → cancelled       stop → cancelled
 *
 * Hydration-safe: there is no `Date.now()` / `Math.random()` / `new Date()` at
 * module scope, during render, or in a state initializer — every timestamp is a
 * fixed epoch constant, so the server and client render identical markup.
 * Reduced-motion, forced-colors, and dark mode are all inherited from the
 * children. Clean-room original.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type WorkspacePhase =
  | "idle"
  | "running"
  | "waiting"
  | "completed"
  | "failed"
  | "cancelled";

/** A single unit of work — rendered both as a run step and as a tool call. */
export interface WorkspaceStepSeed {
  id: string;
  /** Step / call display name, e.g. "Search knowledge base". */
  title: string;
  /** One-line description shown on the timeline step. */
  description: string;
  /** Tool-activity category (drives the glyph): search | read | code | approve | web. */
  category: string;
  /** Tool / function name, e.g. "kb.search". */
  tool: string;
  /** Arguments the tool was invoked with (rendered read-only). */
  args: Record<string, unknown>;
  /** Result the tool returned (rendered read-only, only when completed). */
  result?: Record<string, unknown>;
  /** Short summary shown on a completed step. */
  summary?: string;
  /** Error surfaced when this unit fails. */
  errorText?: string;
  /** Optional nested sub-stages for the timeline step. */
  stages?: { id: string; label: string }[];
}

/** The fictional demo data. Every field is overridable so a host app can drive it. */
export interface WorkspaceDataset {
  runTitle: string;
  steps: WorkspaceStepSeed[];
  /** The full, resolved answer. */
  fullAnswer: ResponseSegment[];
  /** A partial answer, used while streaming / after an interruption. */
  partialAnswer: ResponseSegment[];
  /** Compact source list rendered in the stream footer. */
  streamSources: StreamSource[];
  /** Rich, interactive sources for the citation rail. */
  citationSources: CitationSource[];
  /** Claim-level attribution rendered as the citation-rail body. */
  claims: { text: string; sourceId: string }[];
  /** Run-level summary shown once the run completes. */
  runSummary: string;
  /** Message shown in the answer error banner when the run fails. */
  errorMessage: string;
}

export interface AiAgentWorkspaceProps {
  /** Controlled workspace phase. Pair with `onPhaseChange`. */
  phase?: WorkspacePhase;
  /** Uncontrolled initial phase. Defaults to `"running"` so the demo looks alive. */
  defaultPhase?: WorkspacePhase;
  /** Notified whenever the phase changes (control click or a child callback). */
  onPhaseChange?: (phase: WorkspacePhase) => void;
  /** The prompt shown in the workspace header. */
  prompt?: string;
  /** The assistant / model display name shown on the answer. */
  assistantName?: string;
  /** Override the fictional demo data with application-owned data. */
  dataset?: WorkspaceDataset;
  /** Hide the built-in state controls when the host app supplies its own. */
  showStateControls?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Per-phase specification                                                     */
/* -------------------------------------------------------------------------- */

interface PhaseSpec {
  runStatus: AgentRun["status"];
  /** Status for each of the six steps, in order. */
  steps: StepStatus[];
  current?: string;
  stream: StreamState;
  answer: "none" | "partial" | "full";
  /** Whether the citation rail shows the grounded claims. */
  claims: boolean;
}

const PHASE_META: Record<WorkspacePhase, PhaseSpec> = {
  idle: {
    runStatus: "queued",
    steps: ["pending", "pending", "pending", "pending", "pending", "pending"],
    current: "s1",
    stream: "stopped",
    answer: "none",
    claims: false,
  },
  running: {
    runStatus: "running",
    steps: ["completed", "completed", "active", "pending", "pending", "pending"],
    current: "s3",
    stream: "streaming",
    answer: "partial",
    claims: true,
  },
  waiting: {
    runStatus: "waiting",
    steps: ["completed", "completed", "completed", "completed", "waiting_approval", "pending"],
    current: "s5",
    stream: "complete",
    answer: "full",
    claims: true,
  },
  completed: {
    runStatus: "completed",
    steps: ["completed", "completed", "completed", "completed", "completed", "completed"],
    current: undefined,
    stream: "complete",
    answer: "full",
    claims: true,
  },
  failed: {
    runStatus: "failed",
    steps: ["completed", "completed", "failed", "pending", "pending", "pending"],
    current: "s3",
    stream: "error",
    answer: "partial",
    claims: false,
  },
  cancelled: {
    runStatus: "cancelled",
    steps: ["completed", "completed", "cancelled", "cancelled", "cancelled", "cancelled"],
    current: undefined,
    stream: "stopped",
    answer: "partial",
    claims: false,
  },
};

const PHASES: { id: WorkspacePhase; label: string }[] = [
  { id: "idle", label: "Idle" },
  { id: "running", label: "Running" },
  { id: "waiting", label: "Waiting for approval" },
  { id: "completed", label: "Completed" },
  { id: "failed", label: "Failed" },
  { id: "cancelled", label: "Cancelled" },
];

const STEP_TO_CALL: Record<StepStatus, ToolCallStatus> = {
  pending: "queued",
  active: "running",
  completed: "completed",
  failed: "failed",
  skipped: "cancelled",
  waiting_approval: "waiting_approval",
  cancelled: "cancelled",
};

/* Fixed, deterministic timing so server + client render identically. */
const T0 = 1_720_000_000_000;
const STEP_START = [0, 1_800, 2_600, 5_200, 7_400, 9_100];
const STEP_DURATION = [1_600, 700, 2_400, 3_100, 0, 1_200];

/* -------------------------------------------------------------------------- */
/* Snapshot builders                                                           */
/* -------------------------------------------------------------------------- */

function buildStages(seed: WorkspaceStepSeed, status: StepStatus): RunStage[] | undefined {
  if (!seed.stages) return undefined;
  return seed.stages.map((s, j) => {
    let sub: StepStatus;
    if (status === "completed") sub = "completed";
    else if (status === "active") sub = j === 0 ? "active" : "pending";
    else if (status === "failed") sub = j === 0 ? "completed" : j === 1 ? "failed" : "pending";
    else if (status === "cancelled") sub = "cancelled";
    else sub = "pending";
    return { id: s.id, label: s.label, status: sub };
  });
}

function buildStep(seed: WorkspaceStepSeed, i: number, status: StepStatus): RunStep {
  const started = status !== "pending";
  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    status,
    startedAt: started ? T0 + STEP_START[i] : undefined,
    durationMs: status === "completed" ? STEP_DURATION[i] : undefined,
    toolCall: {
      name: seed.tool,
      arguments: seed.args,
      result: status === "completed" ? seed.result : undefined,
    },
    stages: buildStages(seed, status),
    summary: status === "completed" ? seed.summary : undefined,
    error: status === "failed" ? seed.errorText : undefined,
    attempts: status === "failed" ? 1 : undefined,
    maxAttempts: status === "failed" ? 3 : undefined,
  };
}

function buildRun(spec: PhaseSpec, ds: WorkspaceDataset): AgentRun {
  return {
    title: ds.runTitle,
    status: spec.runStatus,
    startedAt: spec.runStatus === "queued" ? undefined : T0,
    currentStepId: spec.current,
    steps: ds.steps.map((seed, i) => buildStep(seed, i, spec.steps[i])),
    summary: spec.runStatus === "completed" ? ds.runSummary : undefined,
  };
}

function buildCall(seed: WorkspaceStepSeed, i: number, status: ToolCallStatus): ToolCall {
  return {
    id: seed.id,
    name: seed.title,
    category: seed.category,
    status,
    startedAt: status !== "queued" ? T0 + STEP_START[i] : undefined,
    durationMs: status === "completed" ? STEP_DURATION[i] : undefined,
    input: seed.args,
    output: status === "completed" ? seed.result : undefined,
    error: status === "failed" ? seed.errorText : undefined,
    progress: status === "running" ? 0.62 : undefined,
  };
}

function buildCalls(spec: PhaseSpec, ds: WorkspaceDataset): ToolCall[] {
  return ds.steps.map((seed, i) => buildCall(seed, i, STEP_TO_CALL[spec.steps[i]]));
}

/* -------------------------------------------------------------------------- */
/* Default fictional demo data — clearly not a real product or model          */
/* -------------------------------------------------------------------------- */

const PUB_1 = 1_719_100_000_000;
const PUB_2 = 1_719_500_000_000;
const PUB_3 = 1_719_700_000_000;

const DEFAULT_STEPS: WorkspaceStepSeed[] = [
  {
    id: "s1",
    title: "Search knowledge base",
    description: "Find every internal doc touching the Q3 refund policy.",
    category: "search",
    tool: "kb.search",
    args: { query: "refund policy Q3 changes", scopes: ["policy", "changelog", "support"], top_k: 8 },
    result: { hits: 3, indices: ["policy", "changelog", "support"] },
    summary: "3 relevant documents matched across policy, changelog, and support.",
  },
  {
    id: "s2",
    title: "Read policy document",
    description: "Open Refund Policy v3 and extract the changed clauses.",
    category: "read",
    tool: "docs.read",
    args: { doc: "policy/refunds", version: "v3", sections: ["window", "proration", "add-ons"] },
    result: { clauses: 3, effectiveDate: "Q3", reversible: true },
    summary: "Extracted 3 changed clauses from Refund Policy v3.",
  },
  {
    id: "s3",
    title: "Compare policy versions",
    description: "Diff v2 against v3 to isolate the customer-visible changes.",
    category: "code",
    tool: "policy.diff",
    args: { from: "v2", to: "v3", ignore: ["formatting", "internal-notes"] },
    result: { changed: 3, added: 1, removed: 0, flagged: ["add-ons"] },
    summary: "3 clauses changed; add-on handling flagged for review.",
    errorText: "policy.diff exited with code 1: schema drift between v2 and v3 exceeded the safe-diff threshold.",
    stages: [
      { id: "s3a", label: "Normalize both versions" },
      { id: "s3b", label: "Compute clause-level diff" },
      { id: "s3c", label: "Classify customer impact" },
    ],
  },
  {
    id: "s4",
    title: "Draft the summary",
    description: "Write a customer-facing summary grounded in the diff.",
    category: "generate",
    tool: "compose.draft",
    args: { audience: "customer", tone: "plain", maxWords: 120, requireCitations: true },
    result: { words: 92, citations: 3, readingGrade: 7 },
    summary: "92-word draft produced with 3 inline citations.",
  },
  {
    id: "s5",
    title: "Wait for compliance approval",
    description: "A human reviewer must approve before anything is published.",
    category: "approve",
    tool: "gate.approval",
    args: { reviewer: "compliance", blockOn: "publish", policy: "customer-comms" },
  },
  {
    id: "s6",
    title: "Publish to help center",
    description: "Update the public refund article once approved.",
    category: "web",
    tool: "helpcenter.publish",
    args: { article: "refunds", channel: "public", notify: ["support"] },
    result: { url: "help.acme.internal/refunds", revision: 47 },
    summary: "Published revision 47 of the public refund article.",
  },
];

const DEFAULT_FULL_ANSWER: ResponseSegment[] = [
  {
    type: "text",
    text: "Q3 ships three customer-facing changes to the refund policy. First, the standard refund window on annual plans moves from 14 to 30 days ",
  },
  { type: "citation", sourceId: "1" },
  {
    type: "text",
    text: ". Second, mid-cycle downgrades now issue a prorated refund automatically, instead of a credit applied to the next invoice ",
  },
  { type: "citation", sourceId: "2" },
  {
    type: "text",
    text: ".\n\nThe effective policy the agent extracted looks like this:",
  },
  {
    type: "code",
    lang: "json",
    filename: "refund-policy.q3.json",
    code: '{\n  "annualRefundWindowDays": 30,\n  "proration": "automatic",\n  "addonRefunds": "follow-parent"\n}',
  },
  {
    type: "text",
    text: "Finally, add-on refunds now follow the parent subscription's status rather than a separate track, and the support macro was updated to match ",
  },
  { type: "citation", sourceId: "3" },
  { type: "text", text: "." },
];

const DEFAULT_PARTIAL_ANSWER: ResponseSegment[] = [
  {
    type: "text",
    text: "Q3 ships three customer-facing changes to the refund policy. First, the standard refund window on annual plans moves from 14 to 30 days ",
  },
  { type: "citation", sourceId: "1" },
  { type: "text", text: ". Second, mid-cycle downgrades now issue a prorated" },
];

const DEFAULT_STREAM_SOURCES: StreamSource[] = [
  {
    id: "1",
    title: "Refund Policy v3 - Q3 2026",
    url: "https://docs.acme.internal/policy/refunds",
    snippet: "docs.acme.internal · §2.1 Refund window",
  },
  {
    id: "2",
    title: "Payments changelog - Q3 release",
    url: "https://changelog.acme.internal/q3",
    snippet: "changelog.acme.internal · Downgrades",
  },
  {
    id: "3",
    title: "Support macro - refund requests",
    url: "https://help.acme.internal/macros/refunds",
    snippet: "help.acme.internal · Add-ons",
  },
];

const DEFAULT_CITATION_SOURCES: CitationSource[] = [
  {
    id: "1",
    index: 1,
    title: "Refund Policy v3 - Q3 2026",
    domain: "docs.acme.internal",
    url: "https://docs.acme.internal/policy/refunds",
    type: "docs",
    author: "Policy Ops",
    publishedAt: PUB_1,
    retrievedAt: T0,
    relevance: 0.96,
    location: "§2.1",
    verified: true,
    excerpt:
      "Annual plans are eligible for a full refund within 30 days of the invoice date, extended from the previous 14-day window.",
  },
  {
    id: "2",
    index: 2,
    title: "Payments changelog - Q3 release",
    domain: "changelog.acme.internal",
    url: "https://changelog.acme.internal/q3",
    type: "article",
    author: "Payments",
    publishedAt: PUB_2,
    retrievedAt: T0,
    relevance: 0.88,
    location: "Downgrades",
    verified: true,
    excerpt:
      "Mid-cycle downgrades now trigger an automatic prorated refund rather than a credit applied to the next invoice.",
  },
  {
    id: "3",
    index: 3,
    title: "Support macro - refund requests",
    domain: "help.acme.internal",
    url: "https://help.acme.internal/macros/refunds",
    type: "web",
    author: "Support Enablement",
    publishedAt: PUB_3,
    retrievedAt: T0,
    relevance: 0.71,
    location: "Add-ons",
    verified: false,
    excerpt:
      "Add-on refunds inherit the status of the parent subscription; agents should no longer process them on a separate track.",
  },
];

const DEFAULT_CLAIMS: { text: string; sourceId: string }[] = [
  { text: "Annual plans get a 30-day refund window, up from 14 days.", sourceId: "1" },
  { text: "Mid-cycle downgrades are now refunded automatically, prorated.", sourceId: "2" },
  { text: "Add-on refunds follow the parent subscription's status.", sourceId: "3" },
];

export const DEFAULT_WORKSPACE_DATASET: WorkspaceDataset = {
  runTitle: "Summarize Q3 refund-policy changes",
  steps: DEFAULT_STEPS,
  fullAnswer: DEFAULT_FULL_ANSWER,
  partialAnswer: DEFAULT_PARTIAL_ANSWER,
  streamSources: DEFAULT_STREAM_SOURCES,
  citationSources: DEFAULT_CITATION_SOURCES,
  claims: DEFAULT_CLAIMS,
  runSummary:
    "Draft approved by Compliance and published to the help center. 6 steps completed, 3 sources cited, 1 add-on clause flagged for follow-up.",
  errorMessage:
    "The run stopped while comparing policy versions - the answer was drafted only up to the point the agent reached.",
};

const DEFAULT_PROMPT =
  "Summarize our Q3 refund-policy changes for a customer-facing help article, and cite the exact sources.";
const DEFAULT_ASSISTANT = "Acme Agent";

/* -------------------------------------------------------------------------- */
/* Small presentational pieces                                                 */
/* -------------------------------------------------------------------------- */

const segBtn =
  "rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]";
const segBtnOn =
  "border-transparent bg-[var(--color-accent)] text-[var(--color-accent-fg)]";
const segBtnOff =
  "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]";
const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-accent-fg)] outline-none transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]";

function DemoPill() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-warning)] bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-warning)]">
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      Demo data
    </span>
  );
}

function OverallStatusChip({ status }: { status: AgentRun["status"] }) {
  const meta = getStatusMeta(status);
  const vars = statusVars(meta.tone as StatusTone);
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium"
      style={{ color: vars.color, borderColor: vars.border, background: vars.bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {meta.label}
    </span>
  );
}

function ClaimsBody({ claims }: { claims: { text: string; sourceId: string }[] }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        Key claims
      </p>
      <ul className="flex flex-col gap-2.5">
        {claims.map((c, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-[13.5px] leading-relaxed text-[var(--color-fg)]"
          >
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" aria-hidden />
            <span>
              {c.text} <CitationMarker source={c.sourceId} />
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11.5px] leading-relaxed text-[var(--color-muted)]">
        Select a citation or a source to sync the two. Verification badges are provided by the application, not
        inferred by the component.
      </p>
    </div>
  );
}

function PlaceholderBody() {
  return (
    <p className="text-[13.5px] leading-relaxed text-[var(--color-muted)]">
      The grounded answer and its citations appear here once the agent produces a response.
    </p>
  );
}

function IdleAnswer({ onStart }: { onStart: () => void }) {
  return (
    <section className="flex w-full flex-col items-start gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 shadow-[var(--shadow-md)]">
      <span
        className="grid h-10 w-10 place-items-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] text-[var(--color-accent)]"
        aria-hidden
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M8 5v14l11-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </span>
      <p className="text-[14px] font-semibold text-[var(--color-fg)]">Ready to run</p>
      <p className="max-w-[46ch] text-[13px] leading-relaxed text-[var(--color-muted)]">
        Start the run and the agent will search the knowledge base, draft an answer, and stream it here with inline
        citations.
      </p>
      <button type="button" onClick={onStart} className={primaryBtn}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M8 5v14l11-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
        Start run
      </button>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                    */
/* -------------------------------------------------------------------------- */

export function AiAgentWorkspace({
  phase: phaseProp,
  defaultPhase = "running",
  onPhaseChange,
  prompt = DEFAULT_PROMPT,
  assistantName = DEFAULT_ASSISTANT,
  dataset = DEFAULT_WORKSPACE_DATASET,
  showStateControls = true,
  className,
}: AiAgentWorkspaceProps) {
  const [phase, setPhase] = useControllableState<WorkspacePhase>({
    value: phaseProp,
    defaultValue: defaultPhase,
    onChange: onPhaseChange,
  });

  const spec = PHASE_META[phase];
  const run = React.useMemo(() => buildRun(spec, dataset), [spec, dataset]);
  const calls = React.useMemo(() => buildCalls(spec, dataset), [spec, dataset]);
  const segments =
    spec.answer === "full" ? dataset.fullAnswer : spec.answer === "partial" ? dataset.partialAnswer : [];

  /* Phase transitions wired to the children's callbacks. The app owns the real
     work; here each intent simply advances the fictional demo state machine. */
  const goRunning = React.useCallback(() => setPhase("running"), [setPhase]);
  const goCompleted = React.useCallback(() => setPhase("completed"), [setPhase]);
  const goCancelled = React.useCallback(() => setPhase("cancelled"), [setPhase]);

  return (
    <div
      data-phase={phase}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-lg)]",
        className,
      )}
    >
      {/* Workspace top bar: prompt + state controls -------------------------- */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-start gap-3">
          <span
            className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--color-accent),color-mix(in_oklab,var(--color-accent)_55%,#000))] text-[var(--color-accent-fg)]"
            aria-hidden
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="7" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.7" />
              <path d="M12 7V4M9.5 12h.01M14.5 12h.01M9.5 15.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold text-[var(--color-fg)]">Agent workspace</h2>
              <DemoPill />
            </div>
            <p className="mt-1 max-w-[68ch] text-[13px] leading-relaxed text-[var(--color-muted)]">
              <span className="text-[var(--color-fg)]">Prompt:</span> “{prompt}”
            </p>
          </div>

          <OverallStatusChip status={run.status} />
        </div>

        {showStateControls ? (
          <div className="mt-3.5 flex flex-col gap-2 border-t border-[var(--color-border)] pt-3.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
              Workspace state
            </span>
            <div role="group" aria-label="Workspace state" className="flex flex-wrap gap-1.5">
              {PHASES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={phase === p.id}
                  onClick={() => setPhase(p.id)}
                  className={cn(segBtn, phase === p.id ? segBtnOn : segBtnOff)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      {/* Body: run column + answer column ----------------------------------- */}
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
        {/* Run column ------------------------------------------------------- */}
        <div className="flex min-w-0 flex-col gap-4">
          <AgentRunTimeline
            run={run}
            followActive
            compactCompleted
            onApprove={goCompleted}
            onReject={goCancelled}
            onRetryStep={goRunning}
            onCancelRun={goCancelled}
            onResumeRun={goRunning}
          />
          <ToolCallActivity
            calls={calls}
            title="Tool call activity"
            onApprove={goCompleted}
            onReject={goCancelled}
            onRetry={goRunning}
          />
        </div>

        {/* Answer column ---------------------------------------------------- */}
        <div className="flex min-w-0 flex-col gap-4">
          {spec.answer === "none" ? (
            <IdleAnswer onStart={goRunning} />
          ) : (
            <AiResponseStream
              segments={segments}
              state={spec.stream}
              sources={dataset.streamSources}
              assistantName={assistantName}
              errorMessage={dataset.errorMessage}
              onStop={goCancelled}
              onRetry={goRunning}
            />
          )}

          <SourceCitationRail
            sources={dataset.citationSources}
            layout="list"
            title="Cited sources"
            showExcerpts
          >
            {spec.claims ? <ClaimsBody claims={dataset.claims} /> : <PlaceholderBody />}
          </SourceCitationRail>
        </div>
      </div>

      {/* Footer note -------------------------------------------------------- */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 sm:px-5">
        <p className="text-[11.5px] leading-relaxed text-[var(--color-muted)]">
          Demo data - a clearly-fictional agent run driven from local state. No model is involved and nothing is
          executed; the workspace only renders the phase and data it is given, and reports approve / reject / retry /
          cancel / stop back to the application.
        </p>
      </footer>
    </div>
  );
}

export default AiAgentWorkspace;
