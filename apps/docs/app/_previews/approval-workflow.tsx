"use client";

import * as React from "react";

import {
  ApprovalWorkflow,
  type ApprovalWorkflowData,
  type ApprovalAction,
  type ActionContext,
  type Decision,
  type Reviewer,
} from "@/registry/collaboration/approval-workflow";

/* Clearly fictional demo — a launch approval for an imaginary product. No real
 * people, teams, or documents. Fixed ids + timestamps so there is no SSR/CSR
 * hydration drift; live timestamps/ids are only minted inside handlers. */

const DAY = 86_400_000;
const T0 = 1_800_000_000_000; // fixed epoch anchoring the demo timeline

const CURRENT_USER = "you";

/** The reviewers pool the "Add reviewer" control draws from. */
const EXTRA_REVIEWERS: Reviewer[] = [
  { id: "legal-nadia", name: "Nadia Brant", role: "Legal counsel", optional: true, decision: "pending" },
  { id: "data-oskar", name: "Oskar Lindqvist", role: "Data protection", optional: true, decision: "pending" },
  { id: "ops-priya", name: "Priya Ramanathan", role: "Release ops", decision: "pending" },
];

function seed(): ApprovalWorkflowData {
  return {
    id: "wf-launch-2401",
    title: "Launch approval — Aurora 2.0 public release",
    description: "Sign-off required from product, security, and marketing before Aurora 2.0 ships to general availability.",
    requester: { id: "req-mira", name: "Mira Delacroix", role: "Product manager" },
    status: "in_review",
    risk: "high",
    priority: "high",
    createdAt: T0 - 2 * DAY,
    deadline: T0 + 3 * DAY,
    currentStageId: "stage-security",
    stages: [
      {
        id: "stage-product",
        name: "Product review",
        description: "Scope, metrics, and rollout plan reviewed.",
        status: "approved",
        mode: "all",
        completedAt: T0 - 1 * DAY,
        reviewers: [
          { id: "pm-lead", name: "Devon Achebe", role: "Group PM", decision: "approved", decidedAt: T0 - 1 * DAY, note: "Rollout plan is solid." },
        ],
      },
      {
        id: "stage-security",
        name: "Security review",
        description: "Threat model, pen-test findings, and data handling.",
        status: "in_review",
        mode: "quorum",
        requiredApprovals: 2,
        reviewers: [
          { id: "you", name: "You (Security reviewer)", role: "AppSec", decision: "pending" },
          { id: "sec-kai", name: "Kai Ferreira", role: "Security lead", decision: "approved", decidedAt: T0 - 6 * 3_600_000 },
          { id: "sec-tomas", name: "Tomás Nakamura", role: "Infra security", decision: "pending" },
        ],
      },
      {
        id: "stage-marketing",
        name: "Marketing approval",
        description: "Announcement, positioning, and press assets.",
        status: "pending",
        mode: "any",
        reviewers: [
          { id: "mk-rosa", name: "Rosa Whitfield", role: "Head of marketing", decision: "pending" },
          { id: "mk-june", name: "June Park", role: "Comms", optional: true, decision: "pending" },
        ],
      },
      {
        id: "stage-release",
        name: "Final release",
        description: "Ship button — requires all prior stages cleared.",
        status: "pending",
        mode: "all",
        reviewers: [
          { id: "rel-eng", name: "Sasha Merton", role: "Release engineer", decision: "pending" },
        ],
      },
    ],
    attachments: [
      { id: "a1", name: "aurora-2.0-threat-model.pdf", meta: "2.1 MB", href: "#" },
      { id: "a2", name: "rollout-plan.xlsx", meta: "540 KB", href: "#" },
    ],
    history: [
      {
        id: "h1",
        action: "approve",
        actorId: "pm-lead",
        actorName: "Devon Achebe",
        stageId: "stage-product",
        stageName: "Product review",
        comment: "Rollout plan is solid.",
        timestamp: T0 - 1 * DAY,
      },
      {
        id: "h2",
        action: "approve",
        actorId: "sec-kai",
        actorName: "Kai Ferreira",
        stageId: "stage-security",
        stageName: "Security review",
        timestamp: T0 - 6 * 3_600_000,
      },
    ],
  };
}

const STATUS_ORDER: Record<string, number> = { pending: 0, in_review: 1, approved: 2, rejected: 2, changes_requested: 2 };

/** Advance a workflow after a decision on the current stage. */
function applyDecision(
  wf: ApprovalWorkflowData,
  action: ApprovalAction,
  note: string | undefined,
  ts: number,
  histId: string,
): ApprovalWorkflowData {
  const idx = wf.stages.findIndex((s) => s.id === wf.currentStageId);
  if (idx < 0) return wf;
  const stage = wf.stages[idx];
  const stages = wf.stages.map((s) => ({ ...s, reviewers: s.reviewers.map((r) => ({ ...r })) }));
  const cur = stages[idx];
  const reviewer = cur.reviewers.find((r) => r.id === CURRENT_USER);

  const decisionEntry: Decision = {
    id: histId,
    action,
    actorId: CURRENT_USER,
    actorName: "You",
    stageId: cur.id,
    stageName: cur.name,
    comment: note,
    timestamp: ts,
  };

  if (action === "approve") {
    if (reviewer) {
      reviewer.decision = "approved";
      reviewer.decidedAt = ts;
      if (note) reviewer.note = note;
    }
    const approvals = cur.reviewers.filter((r) => r.decision === "approved").length;
    const needed =
      cur.mode === "any"
        ? 1
        : cur.mode === "quorum"
          ? cur.requiredApprovals ?? 2
          : cur.reviewers.filter((r) => !r.optional).length;
    if (approvals >= needed) {
      cur.status = "approved";
      cur.completedAt = ts;
      const nextIdx = idx + 1;
      if (nextIdx < stages.length) {
        stages[nextIdx].status = "in_review";
        return {
          ...wf,
          stages,
          status: "in_review",
          currentStageId: stages[nextIdx].id,
          history: [...(wf.history ?? []), decisionEntry],
        };
      }
      return { ...wf, stages, status: "approved", history: [...(wf.history ?? []), decisionEntry] };
    }
    return { ...wf, stages, history: [...(wf.history ?? []), decisionEntry] };
  }

  if (action === "reject") {
    if (reviewer) {
      reviewer.decision = "rejected";
      reviewer.decidedAt = ts;
    }
    cur.status = "rejected";
    return { ...wf, stages, status: "rejected", history: [...(wf.history ?? []), decisionEntry] };
  }

  if (action === "request_changes") {
    if (reviewer) {
      reviewer.decision = "changes_requested";
      reviewer.decidedAt = ts;
    }
    cur.status = "changes_requested";
    return { ...wf, stages, status: "changes_requested", history: [...(wf.history ?? []), decisionEntry] };
  }

  return wf;
}

const control =
  "rounded-lg px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

export function ApprovalWorkflowPreview() {
  const [workflow, setWorkflow] = React.useState<ApprovalWorkflowData>(seed);
  const [compact, setCompact] = React.useState(true);
  const [requireConfirm, setRequireConfirm] = React.useState(true);
  const idRef = React.useRef(0);
  const extraRef = React.useRef(0);

  const nextId = () => {
    idRef.current += 1;
    return `live-${idRef.current}`;
  };

  const record = (action: ApprovalAction) => (ctx: ActionContext) => {
    // Timestamps + ids are minted here (handler), never during render.
    setWorkflow((wf) => applyDecision(wf, action, ctx.comment, Date.now(), nextId()));
  };

  const addComment = (ctx: ActionContext) => {
    if (!ctx.comment) return;
    setWorkflow((wf) => ({
      ...wf,
      history: [
        ...(wf.history ?? []),
        {
          id: nextId(),
          action: "add_comment",
          actorId: CURRENT_USER,
          actorName: "You",
          stageId: ctx.stage?.id,
          stageName: ctx.stage?.name,
          comment: ctx.comment,
          timestamp: Date.now(),
        },
      ],
    }));
  };

  const addReviewer = () => {
    setWorkflow((wf) => {
      const idx = wf.stages.findIndex((s) => s.id === wf.currentStageId);
      if (idx < 0 || extraRef.current >= EXTRA_REVIEWERS.length) return wf;
      const template = EXTRA_REVIEWERS[extraRef.current];
      extraRef.current += 1;
      const stages = wf.stages.map((s, i) =>
        i === idx ? { ...s, reviewers: [...s.reviewers, { ...template }] } : s,
      );
      return { ...wf, stages };
    });
  };

  const resubmit = () => {
    setWorkflow((wf) => {
      // Re-open the earliest non-approved stage for another review pass.
      const idx = wf.stages.findIndex((s) => s.status === "rejected" || s.status === "changes_requested");
      const target = idx < 0 ? wf.stages.findIndex((s) => STATUS_ORDER[s.status] < 2) : idx;
      if (target < 0) return wf;
      const stages = wf.stages.map((s, i) =>
        i === target
          ? { ...s, status: "in_review" as const, reviewers: s.reviewers.map((r) => ({ ...r, decision: "pending" as const, decidedAt: undefined })) }
          : s,
      );
      return {
        ...wf,
        stages,
        status: "in_review",
        currentStageId: stages[target].id,
        history: [
          ...(wf.history ?? []),
          { id: nextId(), action: "resubmit" as const, actorId: "req-mira", actorName: "Mira Delacroix", timestamp: Date.now() },
        ],
      };
    });
  };

  const reset = () => {
    setWorkflow(seed());
    setCompact(true);
    setRequireConfirm(true);
    idRef.current = 0;
    extraRef.current = 0;
  };

  const noMoreReviewers = extraRef.current >= EXTRA_REVIEWERS.length;
  const isTerminal = ["approved", "rejected", "cancelled", "expired", "changes_requested"].includes(workflow.status);

  return (
    <div className="flex w-full max-w-[620px] flex-col gap-4">
      <ApprovalWorkflow
        workflow={workflow}
        currentUserId={CURRENT_USER}
        compactCompleted={compact}
        confirmReject={requireConfirm}
        onApprove={record("approve")}
        onReject={record("reject")}
        onRequestChanges={record("request_changes")}
        onComment={addComment}
        onResubmit={resubmit}
        onCancel={(ctx) => setWorkflow((wf) => ({ ...wf, status: "cancelled", history: [...(wf.history ?? []), { id: nextId(), action: "cancel", actorId: CURRENT_USER, actorName: "You", stageId: ctx.stage?.id, stageName: ctx.stage?.name, timestamp: Date.now() }] }))}
        // The app owns authorization — the current user can only act on stages
        // they review, and only once. The component surfaces the reason.
        canAct={(action, ctx) => {
          if (action === "resubmit" || action === "cancel" || action === "add_comment") return true;
          const stage = ctx.stage;
          const me = stage?.reviewers.find((r) => r.id === CURRENT_USER);
          if (!me) return { allowed: false, reason: "You are not a reviewer on this stage." };
          if (me.decision && me.decision !== "pending") return { allowed: false, reason: "You already recorded a decision here." };
          return true;
        }}
      />

      {/* working controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={control} onClick={addReviewer} disabled={noMoreReviewers || isTerminal}>
          Add reviewer
        </button>
        <button type="button" className={control} aria-pressed={compact} onClick={() => setCompact((c) => !c)}>
          {compact ? "Collapse done: on" : "Collapse done: off"}
        </button>
        <button type="button" className={control} aria-pressed={requireConfirm} onClick={() => setRequireConfirm((c) => !c)}>
          {requireConfirm ? "Confirm reject: on" : "Confirm reject: off"}
        </button>
        <button type="button" className={control} onClick={reset}>
          Reset
        </button>
        <span className="ml-auto text-[12px] text-[var(--color-muted)]">Fictional demo data</span>
      </div>
    </div>
  );
}

export default ApprovalWorkflowPreview;
