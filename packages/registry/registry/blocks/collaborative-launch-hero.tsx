"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useControllableState, useReducedMotion, type StatusTone } from "@/lib/motionstack";

import {
  LivePresenceStack,
  type PresenceUser,
} from "@/components/motionstack/live-presence-stack";
import {
  TypingAndPresence,
  type Participant,
} from "@/components/motionstack/typing-and-presence";
import {
  ApprovalWorkflow,
  type ApprovalWorkflowData,
  type ApprovalStatus,
  type ActionContext,
  type Reviewer,
  type WorkflowStage,
  type Decision,
} from "@/components/motionstack/approval-workflow";
import {
  CommentThread,
  type Comment,
  type CommentAuthor,
} from "@/components/motionstack/comment-thread";
import {
  ActivityStream,
  type ActivityEvent,
} from "@/components/motionstack/activity-stream";

/* --------------------------------------------------------------------------
 * CollaborativeLaunchHero — an editable hero block for collaboration / review
 * products. The left column is a normal marketing hero (eyebrow, outcome
 * headline, copy, two CTAs). The right column is a live collaboration surface
 * that composes five released components at *reduced* complexity to tell one
 * story: people are here (LivePresenceStack), someone is writing right now
 * (TypingAndPresence), a short review is underway (ActivityStream), there is one
 * change request in the thread (CommentThread), and one decision is pending
 * (ApprovalWorkflow). It is deliberately not a generic social feed — the surface
 * always resolves to a single approaching outcome.
 *
 * The seven review phases are a controlled prop; the app owns the state. Acting
 * on the approval controls advances the phase so the hero also reads as
 * interactive. All data is clearly fictional and deterministic. Clean-room.
 * ----------------------------------------------------------------------- */

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

const MINUTE_MS = 60_000;

/** Fixed epoch anchoring the demo timeline on the first (SSR) render — never
 *  Date.now during render/init so server and client markup match. Re-anchored to
 *  the real clock (quantized to the minute) in a mount effect so relative
 *  timestamps read naturally without introducing sub-minute render drift.
 *  Chosen minute-aligned so the initial and re-anchored markup share precision. */
const T0 = 1_800_000_000_000;

const VIEWER_ID = "you";

export type CollabHeroPhase =
  | "review-open"
  | "commenting"
  | "changes-requested"
  | "approval-pending"
  | "approved"
  | "rejected"
  | "resolved";

export const COLLAB_HERO_PHASES: CollabHeroPhase[] = [
  "review-open",
  "commenting",
  "changes-requested",
  "approval-pending",
  "approved",
  "rejected",
  "resolved",
];

export interface CollabHeroCta {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface HeroPerson {
  id: string;
  name: string;
  role: string;
}

export interface CollabHeroDataset {
  /** The reviewed thing — used as the workflow + activity subject. */
  reviewTitle: string;
  /** Fictional cast. The first entry is treated as the viewer ("you"). */
  people: HeroPerson[];
}

/* -- fictional, deterministic default dataset ---------------------------- */

const DEFAULT_DATASET: CollabHeroDataset = {
  reviewTitle: "Autumn launch — pricing page refresh",
  people: [
    { id: VIEWER_ID, name: "You", role: "Frontend" },
    { id: "priya", name: "Priya Nandakumar", role: "Product lead" },
    { id: "devon", name: "Devon Achebe", role: "Design" },
    { id: "rosa", name: "Rosa Whitfield", role: "Content" },
  ],
};

/* -- phase presentation vocabulary --------------------------------------- */

interface PhaseMeta {
  label: string;
  /** Non-color status glyph, so state never reads by color alone. */
  glyph: string;
  tone: StatusTone;
  note: string;
}

const PHASE_META: Record<CollabHeroPhase, PhaseMeta> = {
  "review-open": { label: "Review open", glyph: "○", tone: "active", note: "The team is reviewing the launch now." },
  commenting: { label: "In discussion", glyph: "…", tone: "info", note: "An open comment thread is in progress." },
  "changes-requested": { label: "Changes requested", glyph: "!", tone: "warning", note: "One change was requested before sign-off." },
  "approval-pending": { label: "Awaiting your decision", glyph: "◆", tone: "active", note: "Design approved — the launch is waiting on you." },
  approved: { label: "Approved to ship", glyph: "✓", tone: "success", note: "Every reviewer signed off — clear to launch." },
  rejected: { label: "Sent back", glyph: "✕", tone: "error", note: "The launch was sent back for another pass." },
  resolved: { label: "Resolved", glyph: "✓", tone: "success", note: "Discussion resolved and the launch is approved." },
};

/* -- cast helpers -------------------------------------------------------- */

function personMap(people: HeroPerson[]): Record<string, HeroPerson> {
  return Object.fromEntries(people.map((p) => [p.id, p]));
}

/** Which of the reviewer decisions each phase encodes for lead + viewer. */
type Decisions = { lead: Reviewer["decision"]; you: Reviewer["decision"] };

function phaseDecisions(phase: CollabHeroPhase): Decisions {
  switch (phase) {
    case "changes-requested":
      return { lead: "changes_requested", you: "pending" };
    case "approval-pending":
      return { lead: "approved", you: "pending" };
    case "approved":
    case "resolved":
      return { lead: "approved", you: "approved" };
    case "rejected":
      return { lead: "approved", you: "rejected" };
    default:
      return { lead: "pending", you: "pending" };
  }
}

function stageStatus(phase: CollabHeroPhase, d: Decisions): ApprovalStatus {
  if (phase === "changes-requested") return "changes_requested";
  if (d.you === "approved" && d.lead === "approved") return "approved";
  if (d.you === "rejected") return "rejected";
  return "in_review";
}

function buildWorkflow(
  phase: CollabHeroPhase,
  anchor: number,
  dataset: CollabHeroDataset,
): ApprovalWorkflowData {
  const p = personMap(dataset.people);
  const lead = p["priya"] ?? dataset.people[1];
  const you = p[VIEWER_ID] ?? dataset.people[0];
  const d = phaseDecisions(phase);
  const status = stageStatus(phase, d);
  const terminal = status === "approved" || status === "rejected";

  const decidedNote =
    phase === "changes-requested"
      ? "The CTA copy overflows on the narrow breakpoint."
      : d.lead === "approved"
        ? "Layout and hierarchy look right."
        : undefined;

  const stage: WorkflowStage = {
    id: "stage-launch",
    name: "Launch sign-off",
    description: "Approve the refreshed pricing page for release.",
    status,
    mode: "all",
    completedAt: status === "approved" ? anchor - 8 * MIN : undefined,
    reviewers: [
      {
        id: lead.id,
        name: lead.name,
        role: lead.role,
        decision: d.lead,
        decidedAt: d.lead !== "pending" ? anchor - 22 * MIN : undefined,
        note: decidedNote,
      },
      {
        id: you.id,
        name: "You",
        role: you.role,
        decision: d.you,
        decidedAt: d.you !== "pending" ? anchor - 4 * MIN : undefined,
        note: phase === "rejected" ? "Holding — the hero image regresses LCP." : undefined,
      },
    ],
  };

  const history: Decision[] = [];
  if (d.lead === "approved") {
    history.push({
      id: "h-lead",
      action: "approve",
      actorId: lead.id,
      actorName: lead.name,
      stageId: stage.id,
      stageName: stage.name,
      comment: "Layout and hierarchy look right.",
      timestamp: anchor - 22 * MIN,
    });
  }
  if (phase === "changes-requested") {
    history.push({
      id: "h-changes",
      action: "request_changes",
      actorId: lead.id,
      actorName: lead.name,
      stageId: stage.id,
      stageName: stage.name,
      comment: "The CTA copy overflows on the narrow breakpoint.",
      timestamp: anchor - 22 * MIN,
    });
  }
  if (phase === "approved" || phase === "resolved") {
    history.push({
      id: "h-you-approve",
      action: "approve",
      actorId: you.id,
      actorName: "You",
      stageId: stage.id,
      stageName: stage.name,
      timestamp: anchor - 4 * MIN,
    });
  }
  if (phase === "rejected") {
    history.push({
      id: "h-you-reject",
      action: "reject",
      actorId: you.id,
      actorName: "You",
      stageId: stage.id,
      stageName: stage.name,
      comment: "Holding — the hero image regresses LCP.",
      timestamp: anchor - 4 * MIN,
    });
  }

  return {
    id: "wf-launch",
    title: dataset.reviewTitle,
    description: "One sign-off stands between the refreshed pricing page and release.",
    requester: { id: lead.id, name: lead.name, role: lead.role },
    status,
    priority: "high",
    createdAt: anchor - 1 * DAY,
    deadline: anchor + 6 * HOUR,
    currentStageId: terminal ? undefined : stage.id,
    stages: [stage],
    history,
  };
}

/* -- presence + typing per phase ----------------------------------------- */

function buildPresence(phase: CollabHeroPhase, dataset: CollabHeroDataset): PresenceUser[] {
  const busy = phase !== "approved" && phase !== "rejected" && phase !== "resolved";
  const [you, lead, design, content] = dataset.people;
  return [
    { id: you.id, name: "You", status: "editing" },
    { id: lead.id, name: lead.name, status: busy ? "active" : "viewing" },
    { id: design.id, name: design.name, status: busy ? "active" : "idle" },
    { id: content.id, name: content.name, status: busy ? "viewing" : "idle" },
  ];
}

function buildTypers(phase: CollabHeroPhase, dataset: CollabHeroDataset): Participant[] {
  const design = dataset.people[2];
  const typing = phase === "review-open" || phase === "commenting" || phase === "approval-pending";
  return [
    {
      id: design.id,
      displayName: design.name,
      presenceState: "active",
      typingState: typing ? "typing" : "stopped",
      role: design.role,
    },
  ];
}

/* -- comment thread (compact, one change request) ------------------------ */

function author(person: HeroPerson): CommentAuthor {
  return { id: person.id, name: person.name, role: person.role };
}

function buildComments(
  phase: CollabHeroPhase,
  anchor: number,
  dataset: CollabHeroDataset,
): Comment[] {
  const [you, lead, design] = dataset.people;

  const base: Comment = {
    id: "c-open",
    author: author(lead),
    body: "Opened the pricing refresh for a final look. The new plan grid is in — flag anything before we ship.",
    createdAt: anchor - 26 * MIN,
    reactions: [{ emoji: "👍", count: 2, label: "thumbs up" }],
  };

  if (phase === "changes-requested") {
    return [
      base,
      {
        id: "c-change",
        author: author(design),
        body: "Requesting one change: the primary CTA copy wraps under 360px. Tighten it and I'm happy to re-approve.",
        createdAt: anchor - 22 * MIN,
      },
    ];
  }
  if (phase === "commenting") {
    return [
      base,
      {
        id: "c-reply",
        author: author(design),
        body: "Plan grid reads well. One question on the annual toggle — is the savings badge final?",
        createdAt: anchor - 3 * MIN,
        parentId: "c-open",
      },
    ];
  }
  if (phase === "rejected") {
    return [
      base,
      {
        id: "c-reject",
        author: { id: you.id, name: "You", role: you.role },
        body: "Sending this back — the hero image pushed LCP to 3.1s. Let's optimize it and re-open.",
        createdAt: anchor - 4 * MIN,
      },
    ];
  }
  if (phase === "resolved") {
    return [{ ...base, resolved: true, status: "resolved" }];
  }
  return [base];
}

/* -- activity stream (review underway, few items) ------------------------ */

function buildEvents(
  phase: CollabHeroPhase,
  anchor: number,
  dataset: CollabHeroDataset,
): ActivityEvent[] {
  const [you, lead, design] = dataset.people;

  const events: ActivityEvent[] = [
    {
      id: "e-open",
      type: "created",
      actor: { id: lead.id, name: lead.name },
      target: "the pricing refresh review",
      timestamp: anchor - 26 * MIN,
    },
    {
      id: "e-upload",
      type: "uploaded",
      actor: { id: design.id, name: design.name },
      target: "pricing-grid-v3.fig",
      timestamp: anchor - 18 * MIN,
      metadata: { size: "4.1 MB" },
    },
  ];

  if (phase === "changes-requested") {
    events.unshift({
      id: "e-changes",
      type: "rejected",
      actor: { id: design.id, name: design.name },
      action: "requested changes on",
      target: "Launch sign-off",
      preview: "CTA copy overflows on the narrow breakpoint.",
      timestamp: anchor - 22 * MIN,
    });
  } else if (phase === "approval-pending") {
    events.unshift({
      id: "e-lead-approve",
      type: "approved",
      actor: { id: lead.id, name: lead.name },
      target: "Launch sign-off",
      timestamp: anchor - 22 * MIN,
    });
  } else if (phase === "approved" || phase === "resolved") {
    events.unshift(
      {
        id: "e-you-approve",
        type: "approved",
        actor: { id: you.id, name: "You" },
        target: "Launch sign-off",
        timestamp: anchor - 4 * MIN,
      },
      {
        id: "e-lead-approve-2",
        type: "approved",
        actor: { id: lead.id, name: lead.name },
        target: "Launch sign-off",
        timestamp: anchor - 22 * MIN,
      },
    );
  } else if (phase === "rejected") {
    events.unshift({
      id: "e-you-reject",
      type: "rejected",
      actor: { id: you.id, name: "You" },
      target: "Launch sign-off",
      preview: "Hero image regresses LCP to 3.1s.",
      timestamp: anchor - 4 * MIN,
    });
  }

  return events;
}

/* -- status chip --------------------------------------------------------- */

function PhaseStatus({ meta }: { meta: PhaseMeta }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-semibold text-[var(--color-fg)]"
      data-tone={meta.tone}
    >
      <span aria-hidden className="grid h-4 w-4 place-items-center text-[11px] leading-none text-[var(--color-muted)]">
        {meta.glyph}
      </span>
      {meta.label}
    </span>
  );
}

/* -- CTA ----------------------------------------------------------------- */

function CtaButton({ cta, variant }: { cta: CollabHeroCta; variant: "primary" | "secondary" }) {
  const base =
    "inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 text-[14px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]";
  const look =
    variant === "primary"
      ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground,white)] hover:brightness-110"
      : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:border-[var(--color-accent)]";
  if (cta.href) {
    return (
      <a href={cta.href} onClick={cta.onClick} className={cn(base, look)}>
        {cta.label}
      </a>
    );
  }
  return (
    <button type="button" onClick={cta.onClick} className={cn(base, look)}>
      {cta.label}
    </button>
  );
}

/* -- component ----------------------------------------------------------- */

export interface CollaborativeLaunchHeroProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  /** Small label above the headline. */
  eyebrow?: string;
  /** Outcome headline — rendered as a real <h1>. */
  headline?: string;
  /** Supporting copy under the headline. */
  copy?: string;
  primaryCta?: CollabHeroCta;
  secondaryCta?: CollabHeroCta;
  /** Controlled review phase. */
  phase?: CollabHeroPhase;
  /** Uncontrolled starting phase. */
  defaultPhase?: CollabHeroPhase;
  onPhaseChange?: (phase: CollabHeroPhase) => void;
  /** Deterministic fictional data driving the collaboration surface. */
  dataset?: CollabHeroDataset;
  /** Decorative background slot rendered behind the hero (no specific import). */
  background?: React.ReactNode;
  /** Force reduced motion regardless of the OS setting. */
  reducedMotion?: boolean;
  className?: string;
}

export function CollaborativeLaunchHero({
  eyebrow = "Collaborative launch",
  headline = "Ship the launch everyone already signed off on.",
  copy = "See who's in the room, the review as it happens, and the one decision still open — so the next release never stalls in a thread.",
  primaryCta = { label: "Start a review", href: "#" },
  secondaryCta = { label: "See how it works", href: "#" },
  phase: phaseProp,
  defaultPhase = "approval-pending",
  onPhaseChange,
  dataset = DEFAULT_DATASET,
  background,
  reducedMotion,
  className,
  ...rest
}: CollaborativeLaunchHeroProps) {
  const osReduce = useReducedMotion();
  const reduce = reducedMotion ?? osReduce;

  const [phase, setPhase] = useControllableState<CollabHeroPhase>({
    value: phaseProp,
    defaultValue: defaultPhase,
    onChange: onPhaseChange,
  });

  // Anchor the demo timeline. Starts at the fixed epoch for a deterministic SSR
  // render, then re-anchors to the real clock after mount so "3m ago" reads
  // naturally. Never reads the clock during render.
  const [anchor, setAnchor] = React.useState(T0);
  React.useEffect(() => {
    setAnchor(Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS);
  }, []);

  const meta = PHASE_META[phase];
  const workflow = buildWorkflow(phase, anchor, dataset);
  const presence = buildPresence(phase, dataset);
  const typers = buildTypers(phase, dataset);
  const comments = buildComments(phase, anchor, dataset);
  const events = buildEvents(phase, anchor, dataset);

  const viewer: CommentAuthor = { id: VIEWER_ID, name: "You", role: dataset.people[0]?.role };

  // Acting on the pending decision advances the phase, so the hero is live.
  const onApprove = () => setPhase("approved");
  const onReject = () => setPhase("rejected");
  const onRequestChanges = () => setPhase("changes-requested");

  // Only the viewer may act, and only while their decision is open.
  const canAct = (action: ActionContext["action"], ctx: ActionContext) => {
    if (action === "add_comment" || action === "resubmit" || action === "cancel") return true;
    const me = ctx.stage?.reviewers.find((r) => r.id === VIEWER_ID);
    if (!me) return { allowed: false, reason: "You are not a reviewer on this stage." };
    if (me.decision && me.decision !== "pending") {
      return { allowed: false, reason: "You already recorded a decision here." };
    }
    return true;
  };

  return (
    <section
      aria-label="Collaborative launch"
      className={cn(
        "relative isolate w-full overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 sm:p-8 lg:p-10",
        className,
      )}
      style={reduce ? undefined : { transition: "background 200ms ease" }}
      {...rest}
    >
      {background ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          {background}
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
        {/* left: the editable marketing hero */}
        <div className="flex max-w-xl flex-col gap-5">
          {eyebrow ? (
            <span className="inline-flex w-fit items-center gap-2 text-[12.5px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              {eyebrow}
            </span>
          ) : null}

          <h1 className="text-balance text-[clamp(2rem,4.4vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--color-fg)]">
            {headline}
          </h1>

          {copy ? (
            <p className="text-pretty text-[16px] leading-relaxed text-[var(--color-muted)]">{copy}</p>
          ) : null}

          <div className="mt-1 flex flex-wrap items-center gap-3">
            {primaryCta ? <CtaButton cta={primaryCta} variant="primary" /> : null}
            {secondaryCta ? <CtaButton cta={secondaryCta} variant="secondary" /> : null}
          </div>
        </div>

        {/* right: the reduced collaboration surface */}
        <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-md)] sm:p-5">
          {/* surface header: who's here + current phase */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="min-w-0 flex-1">
              <PhaseStatus meta={meta} />
              <p className="mt-1.5 text-[12.5px] text-[var(--color-muted)]">{meta.note}</p>
            </div>
            <LivePresenceStack users={presence} label={`${presence.length} people on this launch`} />
          </div>

          <TypingAndPresence
            participants={typers}
            mode="compact"
            context={dataset.reviewTitle}
            label="Live activity on the launch"
          />

          {/* the one pending decision */}
          <ApprovalWorkflow
            workflow={workflow}
            currentUserId={VIEWER_ID}
            confirmReject
            canAct={canAct}
            onApprove={onApprove}
            onReject={onReject}
            onRequestChanges={onRequestChanges}
            label="Launch sign-off"
          />

          {/* one change request / discussion */}
          <CommentThread
            comments={comments}
            currentUser={viewer}
            maxHeight={180}
            label="Launch discussion"
          />

          {/* the review, as it happens */}
          <ActivityStream events={events} maxHeight={180} label="Launch activity" />
        </div>
      </div>
    </section>
  );
}

export default CollaborativeLaunchHero;
