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
  type RunStatus,
  type StepStatus,
} from "@/components/motiq/agent-run-timeline";
import {
  ToolCallActivity,
  type ToolCall,
  type ToolCallStatus,
} from "@/components/motiq/tool-call-activity";
import {
  SourceCitationRail,
  CitationMarker,
  type CitationSource,
} from "@/components/motiq/source-citation-rail";
import {
  PromptComposer,
  type ComposerStatus,
} from "@/components/motiq/prompt-composer";

/**
 * AgentOperationsHero — an editable hero for AI / automation products. A wide
 * copy band (eyebrow + a real headline + support copy + two CTAs + live status)
 * sits above a full-width "app window" that renders a *live, reduced* preview of
 * a real agent workflow; when the surface is wide enough the workflow tiles into
 * two columns so the hero holds a calm height. It is authored mobile-first: in a
 * narrow container the CTAs are full-width 44px bars, the surface leads with the
 * prompt + the run, and the tool call plus cited sources sit behind a real
 * disclosure (`defaultDetailsOpen` opens it). Composed from released Motiq
 * components at deliberately trimmed complexity:
 *   • PromptComposer     — ONE compact prompt input
 *   • AgentRunTimeline   — ONE workflow, three steps, with approval + retry
 *   • ToolCallActivity   — ONE active tool call
 *   • SourceCitationRail — ONE grounded result with its cited sources
 *
 * It is strictly a *presentation* composition. It never talks to a model, never
 * executes an agent, never retrieves anything, never reveals chain-of-thought,
 * and never fabricates a result. The application owns the workflow state; this
 * block simply renders whatever `phase` + `dataset` it is given and reports user
 * intent (submit / approve / reject / retry / cancel / stop) back by moving the
 * phase. It ships clearly-fictional inline demo data so it renders standalone.
 *
 * EVERY layout decision is a *container* query, not a viewport query. The block
 * is routinely dropped into a documentation column or a dashboard panel that is
 * far narrower than the window, where `lg:` would claim room the component does
 * not have and split an 800px panel into two 320px columns. Two named contexts
 * drive the whole composition:
 *   • `@container/hero`    — the block root. Drives its own padding, type scale
 *     (the headline is sized in `cqi`, not `vw`) and the copy-band split, which
 *     only engages at `@5xl` (1024px) where the CTA column (~360px) and a
 *     two-line headline (~500px) both actually fit.
 *   • `@container/surface` — the app-window shell. Drives the workflow tiling,
 *     which only engages at `@4xl` (896px) — the point where two tiles clear
 *     ~418px each, the width the run timeline needs for its dense row form.
 * Each composed child carries its own container too, so a timeline inside a
 * 320px tile renders exactly as it does on a 320px phone.
 *
 * The demo state machine has six required states — Idle · Running · Tool running
 * · Waiting for approval · Completed · Failed — each of which fully determines
 * the composed children and a block-owned status label (conveyed with text, not
 * colour alone).
 *
 * Hydration-safe: no `Date.now()` / `Math.random()` / `new Date()` at module
 * scope, during render, or in a state initializer — every timestamp is a fixed
 * epoch constant, so server and client render identical markup. Reduced motion,
 * forced-colors, and dark mode are inherited from the children; `reducedMotion`
 * additionally quiets the block's own live status dot. Clean-room original.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type AgentHeroPhase =
  | "idle"
  | "running"
  | "tool-active"
  | "waiting"
  | "completed"
  | "failed";

/** A single unit of work — rendered as a timeline step and (step 1) as the tool call. */
export interface AgentHeroStepSeed {
  id: string;
  title: string;
  description: string;
  /** Tool-activity category (drives the glyph): search | read | code | approve. */
  category: string;
  /** Tool / function name, e.g. "kb.search". */
  tool: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
  summary?: string;
  errorText?: string;
}

/** The fictional demo data. Every field is overridable so a host app can drive it. */
export interface AgentHeroDataset {
  runTitle: string;
  /** Prompt shown in the compact composer. */
  prompt: string;
  /** Assistant / agent display name. */
  assistantName: string;
  /** Exactly three steps keep the hero preview readable. */
  steps: AgentHeroStepSeed[];
  /** Sources for the citation rail. */
  citationSources: CitationSource[];
  /** Claim-level attribution rendered as the citation-rail body. */
  claims: { text: string; sourceId: string }[];
  /** Run-level summary shown once the run completes. */
  runSummary: string;
  /** Outcome line shown while the answer is still forming. */
  outcomePartial: string;
  /** Outcome line shown once the answer resolves. */
  outcomeFull: string;
  /** Message shown when the run fails. */
  errorMessage: string;
}

/** A CTA the block renders as a real link (with `href`) or a real button. */
export interface AgentHeroCta {
  label: React.ReactNode;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

export type AgentHeroCtaProp = AgentHeroCta | React.ReactNode;

export interface AgentOperationsHeroProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Small label above the headline. */
  eyebrow?: React.ReactNode;
  /** The outcome headline — rendered as the section heading (`<h1>`). */
  headline?: React.ReactNode;
  /** Supporting copy under the headline. */
  copy?: React.ReactNode;
  /** Primary CTA — a `{ label, href?, onClick? }` spec or your own node. */
  primaryCta?: AgentHeroCtaProp;
  /** Secondary CTA — a `{ label, href?, onClick? }` spec or your own node. */
  secondaryCta?: AgentHeroCtaProp;
  /** Controlled workflow phase. Pair with `onPhaseChange`. */
  phase?: AgentHeroPhase;
  /** Uncontrolled initial phase. Defaults to `"running"` so the demo looks alive. */
  defaultPhase?: AgentHeroPhase;
  /** Notified whenever the phase changes (a control click or a child callback). */
  onPhaseChange?: (phase: AgentHeroPhase) => void;
  /** Override the fictional demo data with application-owned data. */
  dataset?: AgentHeroDataset;
  /** Optional decorative node rendered behind the hero (a background field, etc.). */
  background?: React.ReactNode;
  /**
   * While the app-window surface is narrower than `@4xl` (896px) it leads with
   * the prompt + the run, and the tool call plus the cited sources sit behind a
   * disclosure so the hero stays a hero in a narrow container. Set `true` to
   * render that panel open from the start. Ignored once the surface is wide
   * enough to tile, where both columns are always visible.
   */
  defaultDetailsOpen?: boolean;
  /** Force the block's own status dot to hold still (children read the OS setting). */
  reducedMotion?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Per-phase specification                                                     */
/* -------------------------------------------------------------------------- */

interface HeroPhaseSpec {
  runStatus: RunStatus;
  /** Status for the three steps, in order. */
  steps: [StepStatus, StepStatus, StepStatus];
  current?: string;
  /** Status of the single tool-call activity item (step 1's tool). */
  tool: ToolCallStatus;
  toolProgress?: number;
  /** Which outcome line, if any, the result panel shows. */
  answer: "none" | "partial" | "full";
  /** App-owned composer lifecycle. */
  composer: ComposerStatus;
  /** Whether the citation rail shows the grounded claims. */
  claims: boolean;
}

const PHASE_META: Record<AgentHeroPhase, HeroPhaseSpec> = {
  idle: {
    runStatus: "queued",
    steps: ["pending", "pending", "pending"],
    current: "h1",
    tool: "queued",
    answer: "none",
    composer: "idle",
    claims: false,
  },
  running: {
    runStatus: "running",
    steps: ["completed", "active", "pending"],
    current: "h2",
    tool: "completed",
    answer: "partial",
    composer: "streaming",
    claims: true,
  },
  "tool-active": {
    runStatus: "running",
    steps: ["active", "pending", "pending"],
    current: "h1",
    tool: "running",
    toolProgress: 0.62,
    answer: "none",
    composer: "streaming",
    claims: false,
  },
  waiting: {
    runStatus: "waiting",
    steps: ["completed", "completed", "waiting_approval"],
    current: "h3",
    tool: "completed",
    answer: "full",
    composer: "idle",
    claims: true,
  },
  completed: {
    runStatus: "completed",
    steps: ["completed", "completed", "completed"],
    current: undefined,
    tool: "completed",
    answer: "full",
    composer: "idle",
    claims: true,
  },
  failed: {
    runStatus: "failed",
    steps: ["completed", "failed", "pending"],
    current: "h2",
    tool: "failed",
    answer: "partial",
    composer: "error",
    claims: false,
  },
};

/** Human status label — text, never colour alone. Also used by tests. */
const PHASE_LABEL: Record<AgentHeroPhase, string> = {
  idle: "Idle",
  running: "Running",
  "tool-active": "Tool running",
  waiting: "Waiting for approval",
  completed: "Completed",
  failed: "Failed",
};

/* Fixed, deterministic timing so server + client render identically. */
const T0 = 1_720_000_000_000;
const STEP_START = [0, 2_100, 4_800];
const STEP_DURATION = [1_900, 2_600, 0];
const PUB_1 = 1_719_100_000_000;
const PUB_2 = 1_719_500_000_000;

/* -------------------------------------------------------------------------- */
/* Snapshot builders                                                           */
/* -------------------------------------------------------------------------- */

function buildStep(seed: AgentHeroStepSeed, i: number, status: StepStatus): RunStep {
  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    status,
    startedAt: status !== "pending" ? T0 + STEP_START[i] : undefined,
    durationMs: status === "completed" ? STEP_DURATION[i] : undefined,
    toolCall: {
      name: seed.tool,
      arguments: seed.args,
      result: status === "completed" ? seed.result : undefined,
    },
    summary: status === "completed" ? seed.summary : undefined,
    error: status === "failed" ? seed.errorText : undefined,
    attempts: status === "failed" ? 1 : undefined,
    maxAttempts: status === "failed" ? 3 : undefined,
  };
}

function buildRun(spec: HeroPhaseSpec, ds: AgentHeroDataset): AgentRun {
  return {
    title: ds.runTitle,
    status: spec.runStatus,
    startedAt: spec.runStatus === "queued" ? undefined : T0,
    currentStepId: spec.current,
    steps: ds.steps.map((seed, i) => buildStep(seed, i, spec.steps[i])),
    summary: spec.runStatus === "completed" ? ds.runSummary : undefined,
  };
}

/** The one active tool call — always the first step's tool. */
function buildCall(spec: HeroPhaseSpec, ds: AgentHeroDataset): ToolCall {
  const seed = ds.steps[0];
  const status = spec.tool;
  return {
    id: seed.id,
    name: seed.title,
    category: seed.category,
    status,
    startedAt: status !== "queued" ? T0 + STEP_START[0] : undefined,
    durationMs: status === "completed" ? STEP_DURATION[0] : undefined,
    input: seed.args,
    output: status === "completed" ? seed.result : undefined,
    error: status === "failed" ? seed.errorText : undefined,
    progress: spec.toolProgress,
  };
}

/* -------------------------------------------------------------------------- */
/* Default fictional demo data — clearly not a real product or model          */
/* -------------------------------------------------------------------------- */

const DEFAULT_STEPS: AgentHeroStepSeed[] = [
  {
    id: "h1",
    title: "Retrieve context",
    description: "Search the knowledge base for the current refund policy.",
    category: "search",
    tool: "kb.search",
    args: { query: "refund policy annual plans", top_k: 6 },
    result: { hits: 2, indices: ["policy", "changelog"] },
    summary: "2 relevant documents matched across policy and changelog.",
  },
  {
    id: "h2",
    title: "Draft the answer",
    description: "Compose a customer-facing summary grounded in the sources.",
    category: "code",
    tool: "compose.draft",
    args: { audience: "customer", tone: "plain", requireCitations: true },
    result: { words: 74, citations: 2 },
    summary: "74-word draft produced with 2 inline citations.",
    errorText:
      "compose.draft exited with code 1: a required citation could not be resolved to a retrieved source.",
  },
  {
    id: "h3",
    title: "Wait for approval",
    description: "A human reviewer signs off before anything is published.",
    category: "approve",
    tool: "gate.approval",
    args: { reviewer: "support-lead", blockOn: "publish" },
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
    relevance: 0.95,
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
    relevance: 0.86,
    location: "Downgrades",
    verified: false,
    excerpt:
      "Mid-cycle downgrades now trigger an automatic prorated refund rather than a credit applied to the next invoice.",
  },
];

const DEFAULT_CLAIMS: { text: string; sourceId: string }[] = [
  { text: "Annual plans get a 30-day refund window, up from 14 days.", sourceId: "1" },
  { text: "Mid-cycle downgrades are refunded automatically, prorated.", sourceId: "2" },
];

export const DEFAULT_AGENT_HERO_DATASET: AgentHeroDataset = {
  runTitle: "Summarize Q3 refund-policy changes",
  prompt:
    "Summarize our Q3 refund-policy changes for a help article, and cite the exact sources.",
  assistantName: "Acme Agent",
  steps: DEFAULT_STEPS,
  citationSources: DEFAULT_CITATION_SOURCES,
  claims: DEFAULT_CLAIMS,
  runSummary:
    "Draft approved and published. 3 steps completed, 2 sources cited, ready for the help center.",
  outcomePartial:
    "The agent is drafting a grounded answer - the summary and its citations will resolve here.",
  outcomeFull:
    "Annual refunds now run 30 days and mid-cycle downgrades are refunded automatically - each claim traced to its source.",
  errorMessage:
    "The run stopped while drafting - a required citation could not be resolved to a retrieved source.",
};

const DEFAULT_EYEBROW = "Agent operations";
const DEFAULT_HEADLINE = "Ship agents your team can actually approve";
const DEFAULT_COPY =
  "Give every automated run a workflow your operators can read, pause, and sign off on - grounded in real sources, never a black box.";
const DEFAULT_PRIMARY: AgentHeroCta = { label: "Start free trial", href: "#" };
const DEFAULT_SECONDARY: AgentHeroCta = { label: "See the workflow", href: "#" };

/* -------------------------------------------------------------------------- */
/* Small presentational pieces                                                 */
/* -------------------------------------------------------------------------- */

/* Both CTAs are full-bleed, equal-width, 44px-tall bars in a narrow container
   (ragged intrinsic widths read unfinished) and revert to intrinsic width once
   the HERO — not the window — is wide enough to seat them side by side. */
const ctaBase =
  "inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-[14px] font-semibold outline-none @2xl/hero:w-auto";
const primaryBtn =
  ctaBase +
  " border border-[color-mix(in_oklab,var(--color-accent)_55%,black)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-accent)_86%,white)_0%,var(--color-accent)_60%)] text-[var(--color-accent-fg)] shadow-[0_1px_0_0_color-mix(in_oklab,white_45%,transparent)_inset,0_8px_22px_-10px_color-mix(in_oklab,var(--color-accent)_80%,transparent)] transition-[transform,box-shadow,filter] hover:brightness-[1.06] hover:shadow-[0_1px_0_0_color-mix(in_oklab,white_45%,transparent)_inset,0_14px_30px_-10px_color-mix(in_oklab,var(--color-accent)_90%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] motion-safe:hover:-translate-y-px";
const secondaryBtn =
  ctaBase +
  " border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]";

function isCtaSpec(value: AgentHeroCtaProp | undefined): value is AgentHeroCta {
  return (
    value != null &&
    typeof value === "object" &&
    !React.isValidElement(value) &&
    "label" in value
  );
}

function Cta({
  cta,
  variant,
  onActivate,
}: {
  cta: AgentHeroCtaProp | undefined;
  variant: "primary" | "secondary";
  onActivate?: React.MouseEventHandler<HTMLElement>;
}) {
  if (cta == null) return null;
  const cls = variant === "primary" ? primaryBtn : secondaryBtn;
  if (!isCtaSpec(cta)) return <>{cta}</>;
  const handle: React.MouseEventHandler<HTMLElement> = (e) => {
    cta.onClick?.(e);
    onActivate?.(e);
  };
  if (cta.href) {
    return (
      <a href={cta.href} onClick={handle} className={cls}>
        {cta.label}
      </a>
    );
  }
  return (
    <button type="button" onClick={handle} className={cls}>
      {cta.label}
    </button>
  );
}

function StatusBadge({
  phase,
  reducedMotion,
}: {
  phase: AgentHeroPhase;
  reducedMotion?: boolean;
}) {
  const spec = PHASE_META[phase];
  const meta = getStatusMeta(spec.runStatus);
  const vars = statusVars(meta.tone as StatusTone);
  const live = phase === "running" || phase === "tool-active";
  return (
    <span
      className="inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1 text-[12.5px] font-medium"
      style={{ color: vars.color, borderColor: vars.border, background: vars.bg }}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full bg-current",
          live && !reducedMotion ? "motion-safe:animate-pulse" : "",
        )}
        aria-hidden
      />
      Live status: {PHASE_LABEL[phase]}
    </span>
  );
}

function ClaimsBody({ claims }: { claims: { text: string; sourceId: string }[] }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        Grounded result
      </p>
      <ul className="flex flex-col gap-2">
        {claims.map((c, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-[13px] leading-relaxed text-[var(--color-fg)]"
          >
            <span
              className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]"
              aria-hidden
            />
            <span>
              {c.text} <CitationMarker source={c.sourceId} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultOutcome({
  answer,
  dataset,
  phase,
}: {
  answer: HeroPhaseSpec["answer"];
  dataset: AgentHeroDataset;
  phase: AgentHeroPhase;
}) {
  if (phase === "failed") {
    return (
      <p className="text-[13px] leading-relaxed text-[var(--color-fg)]">
        {dataset.errorMessage}
      </p>
    );
  }
  if (answer === "none") {
    return (
      <p className="text-[13px] leading-relaxed text-[var(--color-muted)]">
        The grounded answer and its sources appear here once the agent produces a
        response.
      </p>
    );
  }
  return (
    <p className="text-[13px] leading-relaxed text-[var(--color-fg)]">
      {answer === "full" ? dataset.outcomeFull : dataset.outcomePartial}
    </p>
  );
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
  "Human approval before anything ships",
  "Every claim traced to a cited source",
  "Readable run state - never a black box",
];

/** Three short capability lines that give the copy column substance next to the
 *  live surface. Text-only; the check glyph is decorative. */
function ProofStrip({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2 @2xl/hero:gap-2.5">
      {items.map((t) => (
        <li
          key={t}
          className="flex items-start gap-2.5 text-[13px] leading-snug text-[var(--color-fg)] @2xl/hero:items-center @2xl/hero:text-[13.5px]"
        >
          <span
            className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] text-[var(--color-accent)] @2xl/hero:mt-0"
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

export function AgentOperationsHero({
  eyebrow = DEFAULT_EYEBROW,
  headline = DEFAULT_HEADLINE,
  copy = DEFAULT_COPY,
  primaryCta = DEFAULT_PRIMARY,
  secondaryCta = DEFAULT_SECONDARY,
  phase: phaseProp,
  defaultPhase = "running",
  onPhaseChange,
  dataset = DEFAULT_AGENT_HERO_DATASET,
  background,
  defaultDetailsOpen = false,
  reducedMotion,
  className,
  ...rest
}: AgentOperationsHeroProps) {
  const [phase, setPhase] = useControllableState<AgentHeroPhase>({
    value: phaseProp,
    defaultValue: defaultPhase,
    onChange: onPhaseChange,
  });

  /* Small-screen disclosure for the result column. The panel is always in the
     DOM and always visible at `lg` (CSS, not JS) so there is no media-query
     branch to hydrate and the desktop composition is untouched. */
  const detailsId = React.useId();
  const [detailsOpen, setDetailsOpen] = React.useState(defaultDetailsOpen);

  const spec = PHASE_META[phase];
  const run = React.useMemo(() => buildRun(spec, dataset), [spec, dataset]);
  const call = React.useMemo(() => buildCall(spec, dataset), [spec, dataset]);

  /* Phase transitions wired to the children's callbacks. The app owns the real
     work; here each intent simply advances the fictional demo state machine. */
  const goRunning = React.useCallback(() => setPhase("running"), [setPhase]);
  const goCompleted = React.useCallback(() => setPhase("completed"), [setPhase]);
  const goFailed = React.useCallback(() => setPhase("failed"), [setPhase]);
  const goIdle = React.useCallback(() => setPhase("idle"), [setPhase]);

  return (
    <section
      data-phase={phase}
      aria-label="Agent operations"
      className={cn(
        /* `@container/hero` — every size decision below reads THIS element's
           width, never the window's. The element is already `relative isolate`,
           so the containing block / stacking context that `container-type`
           implies is not a change: `HeroBackdrop`'s `absolute inset-0 -z-10`
           already resolved against this section. */
        "@container/hero relative isolate w-full overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-lg)]",
        className,
      )}
      {...rest}
    >
      {background != null ? (
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          {background}
        </div>
      ) : (
        <HeroBackdrop />
      )}

      <div className="flex flex-col gap-6 p-5 @2xl/hero:gap-8 @2xl/hero:p-8 @5xl/hero:gap-10 @5xl/hero:p-12">
        {/* Copy band — headline/copy on one side, CTAs + live status on the
            other, so the marketing row reads wide instead of a thin column.
            The split waits for `@5xl` (1024px of HERO): the action column is a
            fixed ~360px (two CTAs + the status pill), so anything narrower
            leaves the headline under ~500px and folds it to four lines. Below
            that the band stacks — full-width headline, actions underneath. */}
        <div className="grid gap-5 @2xl/hero:gap-6 @5xl/hero:grid-cols-[minmax(0,1fr)_auto] @5xl/hero:items-end @5xl/hero:gap-10">
          <div className="flex min-w-0 flex-col items-start gap-3.5 @2xl/hero:gap-4">
            {eyebrow != null ? (
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_80%,transparent)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted)] backdrop-blur-sm @2xl/hero:text-[12px] @2xl/hero:tracking-wide">
                <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-70 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                </span>
                {eyebrow}
              </span>
            ) : null}

            {/* `cqi`, not `vw` — this is the single biggest reason the hero read
                badly in a narrow container: a viewport-sized headline hit its
                3.25rem ceiling on a 1440px screen while sitting in a 400px
                column, and folded to four lines. Sized against the hero the
                curve is identical when the block is full-bleed (1cqi == 1vw
                there) and honest everywhere else. The 28px floor and the
                3.25rem desktop ceiling are unchanged. */}
            <h1 className="text-balance text-[clamp(1.75rem,1.1rem+2.8cqi,3.25rem)] font-semibold leading-[1.08] tracking-tight text-[var(--color-fg)] @2xl/hero:leading-[1.05]">
              {headline}
            </h1>

            {copy != null ? (
              <p className="max-w-[56ch] text-[15px] leading-relaxed text-[var(--color-muted)] @2xl/hero:text-[16px]">
                {copy}
              </p>
            ) : null}
          </div>

          <div className="flex w-full shrink-0 flex-col items-start gap-3.5 @2xl/hero:gap-4 @5xl/hero:w-auto @5xl/hero:items-end">
            <div className="flex w-full flex-col gap-2.5 @2xl/hero:w-auto @2xl/hero:flex-row @2xl/hero:flex-wrap @2xl/hero:items-center @2xl/hero:gap-3">
              <Cta cta={primaryCta} variant="primary" />
              <Cta cta={secondaryCta} variant="secondary" />
            </div>
            <StatusBadge phase={phase} reducedMotion={reducedMotion} />
          </div>
        </div>

        {/* Proof row — three capability lines that carry the copy region. */}
        <div className="flex flex-col gap-3.5 @2xl/hero:gap-4">
          <div className="h-px w-full bg-[var(--color-border)]" />
          <ProofStrip items={DEFAULT_PROOF} />
        </div>

        {/* Live workflow surface — a full-width app window. Once the WINDOW is
            wide enough the composed children tile into two columns so the run
            and its result sit side by side, keeping the hero at a calm height.
            No overflow/max-height clip: the children run Framer `layout`
            animations that collapse inside a constrained scroll ancestor. */}
        <div className="relative min-w-0">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(55% 40% at 50% 0%, color-mix(in oklab, var(--color-accent) 18%, transparent), transparent)",
            }}
          />
          {/* `@container/surface` lives on the window itself, NOT on the glow
              wrapper above: the `-inset-6 -z-10` bloom is a sibling of this box,
              so the stacking context that `container-type` implies cannot pull
              it forward. The window is already `relative overflow-hidden`, so
              nothing inside it was escaping either. */}
          <div className="@container/surface relative flex min-w-0 flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]">
            {/* Window header ------------------------------------------- */}
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_92%,var(--color-bg))] px-3.5 py-2.5 @2xl/surface:px-5 @2xl/surface:py-3">
              <span className="flex items-center gap-2.5">
                <span className="flex items-center gap-1.5" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--color-error)_65%,transparent)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--color-warning)_70%,transparent)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--color-success)_65%,transparent)]" />
                </span>
                <span className="text-[13px] font-semibold text-[var(--color-fg)]">
                  Live workflow preview
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-warning)] bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-warning)]">
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                Demo data
              </span>
            </div>

            {/* Two tiled columns: the run (left) and its result (right). The
                2-up only engages at `@4xl` of the SURFACE (896px), where each
                tile clears ~418px — the width the run timeline needs before its
                status chip and actions can sit as a right-hand column. Below it
                the tiles stack and the result column is disclosed on demand, so
                a narrow container gets one focal story (prompt → run) instead of
                four squeezed panels. */}
            <div className="grid min-w-0 gap-3 p-3 @2xl/surface:gap-3.5 @2xl/surface:p-5 @4xl/surface:grid-cols-2 @4xl/surface:gap-5 @4xl/surface:items-start">
              <div className="flex min-w-0 flex-col gap-3 @2xl/surface:gap-3.5">
                <PromptComposer
                  defaultValue={dataset.prompt}
                  label="Agent prompt"
                  placeholder="Describe the task for the agent…"
                  submitLabel="Run agent"
                  minRows={2}
                  maxRows={3}
                  status={spec.composer}
                  onSubmit={goRunning}
                  onStop={goIdle}
                  onRetry={goRunning}
                />

                <AgentRunTimeline
                  run={run}
                  followActive
                  compactCompleted
                  title={dataset.runTitle}
                  onApprove={goCompleted}
                  onReject={goFailed}
                  onRetryStep={goRunning}
                  onCancelRun={goIdle}
                  onResumeRun={goRunning}
                />

                {/* Disclosure for the result column while the surface is too
                    narrow to tile. Hidden once it tiles, where that column is
                    always shown. */}
                <button
                  type="button"
                  aria-expanded={detailsOpen}
                  aria-controls={detailsId}
                  onClick={() => setDetailsOpen((open) => !open)}
                  className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_92%,var(--color-bg))] px-3.5 py-2.5 text-left outline-none transition-colors hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] @4xl/surface:hidden"
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-[var(--color-fg)]">
                      {detailsOpen ? "Hide tool call and sources" : "Show tool call and sources"}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-[var(--color-muted)]">
                      Active tool call · {dataset.citationSources.length} cited sources
                    </span>
                  </span>
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] transition-transform",
                      detailsOpen ? "rotate-180" : "",
                    )}
                    aria-hidden
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path
                        d="m6 9 6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              </div>

              <div
                id={detailsId}
                className={cn(
                  "min-w-0 flex-col gap-3 @2xl/surface:gap-3.5 @4xl/surface:flex",
                  detailsOpen ? "flex" : "hidden",
                )}
              >
                <ToolCallActivity
                  calls={[call]}
                  title="Active tool call"
                  compactCompleted
                  onApprove={goCompleted}
                  onReject={goFailed}
                  onRetry={goRunning}
                />

                <SourceCitationRail
                  sources={dataset.citationSources}
                  layout="list"
                  title="Cited sources"
                >
                  <div className="flex flex-col gap-3">
                    <ResultOutcome answer={spec.answer} dataset={dataset} phase={phase} />
                    {spec.claims ? <ClaimsBody claims={dataset.claims} /> : null}
                  </div>
                </SourceCitationRail>
              </div>
            </div>

            {/* Honesty footer ------------------------------------------ */}
            <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 @2xl/surface:px-5">
              <p className="text-[11px] leading-relaxed text-[var(--color-muted)]">
                Demo data - a clearly-fictional agent run driven from local state. No
                model is involved; the surface only renders the phase it is given.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AgentOperationsHero;
