"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { getStatusMeta, statusVars } from "@/lib/motiq";

import {
  LivePresenceStack,
  type PresenceUser,
} from "@/components/motiq/live-presence-stack";
import {
  ApprovalWorkflow,
  type ApprovalWorkflowData,
  type ApprovalAction,
  type ActionContext,
  type ApprovalStatus,
  type Decision,
  type Reviewer,
  type WorkflowStage,
} from "@/components/motiq/approval-workflow";
import {
  CommentThread,
  type Comment,
  type CommentAuthor,
  type CommentDraft,
} from "@/components/motiq/comment-thread";
import {
  ActivityStream,
  type ActivityEvent,
  type ActivityActor,
} from "@/components/motiq/activity-stream";

/* --------------------------------------------------------------------------
 * CollaborativeReviewWorkspace — a composed review surface that wires four
 * released collaboration components into one realistic screen: the presence of
 * who's here, an app-owned approval workflow as the main column, the discussion
 * thread under it, and an activity feed as the right rail.
 *
 * It owns a small in-memory demo state machine that connects the components'
 * callbacks: approving a stage advances the workflow AND appends an activity
 * event; posting a comment appears in the thread AND the activity; resolving the
 * discussion updates the thread AND records it. Preset buttons load the review
 * lifecycle states so you can see every phase without scripting.
 *
 * Presentation only — clearly fictional users, no real persistence or
 * authorization. In a real app you would replace the demo state with your own
 * data source and let these same callbacks drive real mutations. Clean-room
 * original.
 * ----------------------------------------------------------------------- */

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
/** Fixed epoch anchoring the demo timeline for the first render (never Date.now
 *  during render/init). Re-anchored to the real clock in a mount effect so the
 *  relative timestamps read naturally. */
const T0 = 1_800_000_000_000;

const VIEWER_ID = "you";

/* -- fictional cast ------------------------------------------------------ */

const PEOPLE = {
  you: { id: "you", name: "You" },
  mira: { id: "mira", name: "Mira Delacroix" },
  devon: { id: "devon", name: "Devon Achebe" },
  rosa: { id: "rosa", name: "Rosa Whitfield" },
  kai: { id: "kai", name: "Kai Ferreira" },
  june: { id: "june", name: "June Park" },
} as const;

const DEFAULT_MENTIONABLE: CommentAuthor[] = [
  { id: PEOPLE.mira.id, name: PEOPLE.mira.name, role: "Product design" },
  { id: PEOPLE.devon.id, name: PEOPLE.devon.name, role: "Eng lead" },
  { id: PEOPLE.rosa.id, name: PEOPLE.rosa.name, role: "Content" },
  { id: PEOPLE.kai.id, name: PEOPLE.kai.name, role: "Brand" },
  { id: PEOPLE.june.id, name: PEOPLE.june.name, role: "Counsel" },
];

export type ReviewPhase =
  | "open"
  | "commenting"
  | "changes"
  | "pending"
  | "approved"
  | "rejected"
  | "resolved";

const PHASES: { id: ReviewPhase; label: string }[] = [
  { id: "open", label: "Review open" },
  { id: "commenting", label: "Commenting" },
  { id: "changes", label: "Changes requested" },
  { id: "pending", label: "Approval pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "resolved", label: "Resolved discussion" },
];

export interface WorkspaceData {
  workflow: ApprovalWorkflowData;
  comments: Comment[];
  events: ActivityEvent[];
  presence: PresenceUser[];
  unreadAfter?: number;
  statusNote: string;
}

/* -- workflow builders --------------------------------------------------- */

type WorkflowLevel = "open" | "changes" | "eng" | "approved" | "rejected";

const WORKFLOW_TITLE = "Homepage redesign - Q3 hero refresh";

function reviewer(
  id: keyof typeof PEOPLE,
  role: string,
  decision: Reviewer["decision"] = "pending",
  opts: { decidedAt?: number; note?: string; optional?: boolean } = {},
): Reviewer {
  return {
    id: PEOPLE[id].id,
    name: PEOPLE[id].name,
    role,
    decision,
    decidedAt: opts.decidedAt,
    note: opts.note,
    optional: opts.optional,
  };
}

function buildStages(anchor: number, level: WorkflowLevel): WorkflowStage[] {
  const designApproved = level !== "open" && level !== "changes";

  const design: WorkflowStage = {
    id: "stage-design",
    name: "Design review",
    description: "Layout, hierarchy, and the new hero composition.",
    status:
      level === "changes"
        ? "changes_requested"
        : designApproved
          ? "approved"
          : "in_review",
    mode: "all",
    completedAt: designApproved ? anchor - 3 * HOUR : undefined,
    reviewers: [
      reviewer(
        "kai",
        "Brand",
        designApproved ? "approved" : level === "changes" ? "approved" : "pending",
        designApproved
          ? { decidedAt: anchor - 3 * HOUR, note: "Type scale looks right." }
          : {},
      ),
      reviewer(
        "rosa",
        "Content",
        designApproved ? "approved" : level === "changes" ? "changes_requested" : "pending",
        level === "changes"
          ? { decidedAt: anchor - 30 * MIN, note: "CTA copy is too long on mobile." }
          : designApproved
            ? { decidedAt: anchor - 3 * HOUR }
            : {},
      ),
    ],
  };

  const eng: WorkflowStage = {
    id: "stage-eng",
    name: "Engineering review",
    description: "Responsive behavior and Core Web Vitals budget.",
    status:
      level === "approved"
        ? "approved"
        : level === "rejected"
          ? "rejected"
          : level === "eng"
            ? "in_review"
            : "pending",
    mode: "quorum",
    requiredApprovals: 2,
    completedAt: level === "approved" ? anchor - 20 * MIN : undefined,
    reviewers: [
      reviewer(
        "you",
        "Frontend",
        level === "approved" ? "approved" : level === "rejected" ? "rejected" : "pending",
        level === "approved"
          ? { decidedAt: anchor - 25 * MIN }
          : level === "rejected"
            ? { decidedAt: anchor - 25 * MIN, note: "LCP regressed to 3.1s." }
            : {},
      ),
      reviewer(
        "devon",
        "Eng lead",
        level === "approved" || level === "eng" ? "approved" : "pending",
        level === "approved" || level === "eng"
          ? { decidedAt: anchor - 40 * MIN, note: "Bundle is within budget." }
          : {},
      ),
    ],
  };

  const legal: WorkflowStage = {
    id: "stage-legal",
    name: "Legal sign-off",
    description: "Claims in the headline and the pricing footnote.",
    status: level === "approved" ? "approved" : "pending",
    mode: "any",
    completedAt: level === "approved" ? anchor - 10 * MIN : undefined,
    reviewers: [
      reviewer(
        "june",
        "Counsel",
        level === "approved" ? "approved" : "pending",
        level === "approved" ? { decidedAt: anchor - 10 * MIN } : {},
      ),
    ],
  };

  return [design, eng, legal];
}

function buildHistory(anchor: number, level: WorkflowLevel): Decision[] {
  const out: Decision[] = [];
  if (level !== "open" && level !== "changes") {
    out.push({
      id: "wf-h-design",
      action: "approve",
      actorId: PEOPLE.kai.id,
      actorName: PEOPLE.kai.name,
      stageId: "stage-design",
      stageName: "Design review",
      comment: "Type scale looks right.",
      timestamp: anchor - 3 * HOUR,
    });
  }
  if (level === "changes") {
    out.push({
      id: "wf-h-changes",
      action: "request_changes",
      actorId: PEOPLE.rosa.id,
      actorName: PEOPLE.rosa.name,
      stageId: "stage-design",
      stageName: "Design review",
      comment: "CTA copy is too long on mobile.",
      timestamp: anchor - 30 * MIN,
    });
  }
  if (level === "eng" || level === "approved" || level === "rejected") {
    out.push({
      id: "wf-h-eng-devon",
      action: "approve",
      actorId: PEOPLE.devon.id,
      actorName: PEOPLE.devon.name,
      stageId: "stage-eng",
      stageName: "Engineering review",
      comment: "Bundle is within budget.",
      timestamp: anchor - 40 * MIN,
    });
  }
  if (level === "approved") {
    out.push({
      id: "wf-h-legal",
      action: "approve",
      actorId: PEOPLE.june.id,
      actorName: PEOPLE.june.name,
      stageId: "stage-legal",
      stageName: "Legal sign-off",
      timestamp: anchor - 10 * MIN,
    });
  }
  if (level === "rejected") {
    out.push({
      id: "wf-h-eng-reject",
      action: "reject",
      actorId: PEOPLE.you.id,
      actorName: "You",
      stageId: "stage-eng",
      stageName: "Engineering review",
      comment: "LCP regressed to 3.1s - needs another pass.",
      timestamp: anchor - 25 * MIN,
    });
  }
  return out;
}

function buildWorkflow(anchor: number, level: WorkflowLevel): ApprovalWorkflowData {
  const stages = buildStages(anchor, level);
  const status: ApprovalStatus =
    level === "approved"
      ? "approved"
      : level === "rejected"
        ? "rejected"
        : level === "changes"
          ? "changes_requested"
          : "in_review";
  const currentStageId =
    level === "approved" || level === "rejected"
      ? undefined
      : level === "eng"
        ? "stage-eng"
        : "stage-design";

  return {
    id: "wf-hero-q3",
    title: WORKFLOW_TITLE,
    description:
      "Sign-off from design, engineering, and legal before the new homepage hero replaces the current one.",
    requester: { id: PEOPLE.mira.id, name: PEOPLE.mira.name, role: "Product designer" },
    status,
    risk: "medium",
    priority: "high",
    createdAt: anchor - 2 * DAY,
    deadline: anchor + 2 * DAY,
    currentStageId,
    stages,
    attachments: [
      { id: "att-1", name: "hero-redesign-v4.fig", meta: "Design source", href: "#" },
      { id: "att-2", name: "lcp-report.pdf", meta: "180 KB", href: "#" },
    ],
    history: buildHistory(anchor, level),
  };
}

/* -- comment builders ---------------------------------------------------- */

function author(id: keyof typeof PEOPLE, role?: string): CommentAuthor {
  return { id: PEOPLE[id].id, name: PEOPLE[id].name, role };
}

function baseComments(anchor: number): Comment[] {
  return [
    {
      id: "c-1",
      author: author("mira", "Product design"),
      body: "Opened the hero refresh for review. Flagged the CTA contrast and the headline length - @Devon can you take the engineering pass once design clears?",
      createdAt: anchor - 40 * MIN,
      mentions: ["devon"],
      reactions: [{ emoji: "👍", count: 2, label: "thumbs up" }],
    },
    {
      id: "c-2",
      author: author("devon", "Eng lead"),
      body: "Contrast is fixed in the latest build. Headline still wraps to two lines under 380px - not blocking, just noting.",
      createdAt: anchor - 25 * MIN,
      parentId: "c-1",
    },
    {
      id: "c-3",
      author: author("rosa", "Content"),
      body: "Final copy is locked: “Ship faster, together.” Please don't shorten it further.",
      createdAt: anchor - 8 * MIN,
      reactions: [{ emoji: "🎉", count: 1, label: "party" }],
    },
  ];
}

/* -- activity builders --------------------------------------------------- */

function actor(id: keyof typeof PEOPLE): ActivityActor {
  return { id: PEOPLE[id].id, name: PEOPLE[id].name };
}

function baseEvents(anchor: number, level: WorkflowLevel): ActivityEvent[] {
  const events: ActivityEvent[] = [
    {
      id: "e-created",
      type: "created",
      actor: actor("mira"),
      target: "the hero refresh review",
      timestamp: anchor - 2 * DAY,
    },
    {
      id: "e-joined-kai",
      type: "joined",
      actor: actor("kai"),
      timestamp: anchor - 26 * HOUR,
    },
    {
      id: "e-uploaded",
      type: "uploaded",
      actor: actor("mira"),
      target: "hero-redesign-v4.fig",
      timestamp: anchor - 5 * HOUR,
      metadata: { size: "6.2 MB" },
    },
    {
      id: "e-commented-devon",
      type: "commented",
      actor: actor("devon"),
      target: "the hero refresh review",
      preview: "Contrast is fixed in the latest build…",
      timestamp: anchor - 25 * MIN,
    },
  ];

  if (level !== "open" && level !== "changes") {
    events.push({
      id: "e-approved-design",
      type: "approved",
      actor: actor("kai"),
      target: "Design review",
      timestamp: anchor - 3 * HOUR,
    });
  }
  if (level === "changes") {
    events.push({
      id: "e-changes",
      type: "rejected",
      actor: actor("rosa"),
      action: "requested changes on",
      target: "Design review",
      preview: "CTA copy is too long on mobile.",
      timestamp: anchor - 30 * MIN,
    });
  }
  if (level === "eng" || level === "approved" || level === "rejected") {
    events.push({
      id: "e-approved-eng-devon",
      type: "approved",
      actor: actor("devon"),
      target: "Engineering review",
      timestamp: anchor - 40 * MIN,
    });
  }
  if (level === "approved") {
    events.push({
      id: "e-approved-legal",
      type: "approved",
      actor: actor("june"),
      target: "Legal sign-off",
      timestamp: anchor - 10 * MIN,
    });
  }
  if (level === "rejected") {
    events.push({
      id: "e-rejected-eng",
      type: "rejected",
      actor: actor("you"),
      target: "Engineering review",
      preview: "LCP regressed to 3.1s - needs another pass.",
      timestamp: anchor - 25 * MIN,
    });
  }
  return events;
}

/* -- presence per phase -------------------------------------------------- */

function basePresence(active: boolean): PresenceUser[] {
  return [
    { id: PEOPLE.you.id, name: "You", status: "editing" },
    { id: PEOPLE.mira.id, name: PEOPLE.mira.name, status: active ? "active" : "viewing" },
    { id: PEOPLE.devon.id, name: PEOPLE.devon.name, status: active ? "active" : "idle" },
    { id: PEOPLE.rosa.id, name: PEOPLE.rosa.name, status: active ? "viewing" : "idle" },
    { id: PEOPLE.kai.id, name: PEOPLE.kai.name, status: "idle" },
  ];
}

/* -- scenario assembly --------------------------------------------------- */

function buildScenario(phase: ReviewPhase, anchor: number): WorkspaceData {
  switch (phase) {
    case "open":
      return {
        workflow: buildWorkflow(anchor, "open"),
        comments: baseComments(anchor),
        events: baseEvents(anchor, "open"),
        presence: basePresence(true),
        statusNote: "Design review is open - awaiting the first sign-off.",
      };
    case "commenting":
      return {
        workflow: buildWorkflow(anchor, "open"),
        comments: [
          ...baseComments(anchor),
          {
            id: "c-4",
            author: author("kai", "Brand"),
            body: "@You one thing before eng - can the hero image be a real asset, not a placeholder?",
            createdAt: anchor - 3 * MIN,
            mentions: ["you"],
          },
        ],
        events: [
          {
            id: "e-commented-kai",
            type: "commented",
            actor: actor("kai"),
            target: "the hero refresh review",
            preview: "…can the hero image be a real asset, not a placeholder?",
            timestamp: anchor - 3 * MIN,
          },
          ...baseEvents(anchor, "open"),
        ],
        presence: basePresence(true),
        unreadAfter: anchor - 6 * MIN,
        statusNote: "An open discussion is in progress - you have unread comments.",
      };
    case "changes":
      return {
        workflow: buildWorkflow(anchor, "changes"),
        comments: [
          ...baseComments(anchor),
          {
            id: "c-changes",
            author: author("rosa", "Content"),
            body: "Requested changes on design - the CTA copy overflows on small screens. Once that's tightened I'm happy to re-approve.",
            createdAt: anchor - 30 * MIN,
          },
        ],
        events: baseEvents(anchor, "changes"),
        presence: basePresence(true),
        statusNote: "Changes were requested - the request is back with the author.",
      };
    case "pending":
      return {
        workflow: buildWorkflow(anchor, "eng"),
        comments: baseComments(anchor),
        events: baseEvents(anchor, "eng"),
        presence: basePresence(true),
        statusNote: "Engineering review is awaiting your decision.",
      };
    case "approved":
      return {
        workflow: buildWorkflow(anchor, "approved"),
        comments: baseComments(anchor),
        events: baseEvents(anchor, "approved"),
        presence: basePresence(false),
        statusNote: "All stages cleared - the redesign is approved to ship.",
      };
    case "rejected":
      return {
        workflow: buildWorkflow(anchor, "rejected"),
        comments: [
          ...baseComments(anchor),
          {
            id: "c-reject",
            author: author("you", "Frontend"),
            body: "Rejecting the engineering pass - LCP regressed to 3.1s on the hero image. Let's revisit once it's optimized.",
            createdAt: anchor - 25 * MIN,
          },
        ],
        events: baseEvents(anchor, "rejected"),
        presence: basePresence(false),
        statusNote: "The request was rejected - it returns to the requester.",
      };
    case "resolved":
      return {
        workflow: buildWorkflow(anchor, "approved"),
        comments: baseComments(anchor).map((c) =>
          c.id === "c-1" ? { ...c, resolved: true, status: "resolved" } : c,
        ),
        events: [
          {
            id: "e-resolved",
            type: "archived",
            actor: actor("mira"),
            action: "resolved the discussion on",
            target: "the hero refresh review",
            timestamp: anchor - 4 * MIN,
          },
          ...baseEvents(anchor, "approved"),
        ],
        presence: basePresence(false),
        statusNote: "The discussion is resolved and the redesign is approved.",
      };
  }
}

/* -- decision → workflow advancement ------------------------------------- */

function stageNeeded(stage: WorkflowStage): number {
  if (stage.mode === "any") return stage.requiredApprovals ?? 1;
  if (stage.mode === "quorum") return stage.requiredApprovals ?? 2;
  return stage.reviewers.filter((r) => !r.optional).length;
}

function applyDecision(
  wf: ApprovalWorkflowData,
  action: ApprovalAction,
  note: string | undefined,
  ts: number,
  histId: string,
): ApprovalWorkflowData {
  const idx = wf.stages.findIndex((s) => s.id === wf.currentStageId);
  if (idx < 0) return wf;
  const stages = wf.stages.map((s) => ({ ...s, reviewers: s.reviewers.map((r) => ({ ...r })) }));
  const cur = stages[idx];
  const me = cur.reviewers.find((r) => r.id === VIEWER_ID);

  const entry: Decision = {
    id: histId,
    action,
    actorId: VIEWER_ID,
    actorName: "You",
    stageId: cur.id,
    stageName: cur.name,
    comment: note,
    timestamp: ts,
  };

  if (action === "approve") {
    if (me) {
      me.decision = "approved";
      me.decidedAt = ts;
      if (note) me.note = note;
    }
    const approvals = cur.reviewers.filter((r) => r.decision === "approved").length;
    if (approvals >= stageNeeded(cur)) {
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
          history: [...(wf.history ?? []), entry],
        };
      }
      return {
        ...wf,
        stages,
        status: "approved",
        currentStageId: undefined,
        history: [...(wf.history ?? []), entry],
      };
    }
    return { ...wf, stages, history: [...(wf.history ?? []), entry] };
  }

  if (action === "reject") {
    if (me) {
      me.decision = "rejected";
      me.decidedAt = ts;
      if (note) me.note = note;
    }
    cur.status = "rejected";
    return { ...wf, stages, status: "rejected", currentStageId: undefined, history: [...(wf.history ?? []), entry] };
  }

  if (action === "request_changes") {
    if (me) {
      me.decision = "changes_requested";
      me.decidedAt = ts;
      if (note) me.note = note;
    }
    cur.status = "changes_requested";
    return { ...wf, stages, status: "changes_requested", history: [...(wf.history ?? []), entry] };
  }

  return { ...wf, history: [...(wf.history ?? []), entry] };
}

/* -- flat comment helpers ------------------------------------------------ */

function patchComment(comments: Comment[], id: string, fn: (c: Comment) => Comment): Comment[] {
  return comments.map((c) => (c.id === id ? fn(c) : c));
}

/* -- header status pill -------------------------------------------------- */

const PILL_OVERRIDES: Record<string, { label: string; tone: Parameters<typeof statusVars>[0] }> = {
  in_review: { label: "In review", tone: "active" },
  changes_requested: { label: "Changes requested", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "error" },
};

function HeaderStatus({ status }: { status: ApprovalStatus }) {
  const meta = getStatusMeta(status, PILL_OVERRIDES);
  const v = statusVars(meta.tone);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold [border:1px_solid]"
      style={{ color: v.color, background: v.bg, borderColor: v.border }}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: v.color }} />
      {meta.label}
    </span>
  );
}

/* -- component ----------------------------------------------------------- */

export interface CollaborativeReviewWorkspaceProps {
  /** Optional starting workflow (defaults to inline fictional demo data). */
  workflow?: ApprovalWorkflowData;
  /** Optional starting comments. */
  comments?: Comment[];
  /** Optional starting activity events. */
  events?: ActivityEvent[];
  /** Optional starting presence. */
  presence?: PresenceUser[];
  /** The viewer — drives approval authorization + comment authorship. */
  currentUser?: CommentAuthor;
  /** People who can be @-mentioned in the thread. */
  mentionable?: CommentAuthor[];
  /** Workspace heading. */
  title?: string;
  /** Show the phase-preset control bar. Default true. */
  showControls?: boolean;
  className?: string;
}

export function CollaborativeReviewWorkspace({
  workflow: workflowProp,
  comments: commentsProp,
  events: eventsProp,
  presence: presenceProp,
  currentUser = { id: VIEWER_ID, name: "You", role: "Frontend" },
  mentionable = DEFAULT_MENTIONABLE,
  title = "Homepage redesign review",
  showControls = true,
  className,
}: CollaborativeReviewWorkspaceProps) {
  const hasOverride =
    !!workflowProp || !!commentsProp || !!eventsProp || !!presenceProp;

  const anchorRef = React.useRef(T0);
  const [phase, setPhase] = React.useState<ReviewPhase>("open");
  const seqRef = React.useRef(0);

  const [data, setData] = React.useState<WorkspaceData>(() => {
    const seed = buildScenario("open", T0);
    return {
      workflow: workflowProp ?? seed.workflow,
      comments: commentsProp ?? seed.comments,
      events: eventsProp ?? seed.events,
      presence: presenceProp ?? seed.presence,
      unreadAfter: seed.unreadAfter,
      statusNote: seed.statusNote,
    };
  });

  // Re-anchor the demo timeline to the real clock after mount (never during
  // render) so relative timestamps read naturally. Skips when the host supplied
  // its own data.
  React.useEffect(() => {
    if (hasOverride) return;
    anchorRef.current = Date.now();
    setData(buildScenario("open", anchorRef.current));
    // Only run on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasOverride]);

  const viewerActor: ActivityActor = { id: currentUser.id, name: currentUser.name };

  const nextId = (prefix: string) => {
    seqRef.current += 1;
    return `live-${prefix}-${seqRef.current}`;
  };

  const loadPhase = (id: ReviewPhase) => {
    setPhase(id);
    setData(buildScenario(id, anchorRef.current));
  };

  /* -- approval callbacks: advance workflow AND record activity ---------- */

  const recordDecision =
    (action: ApprovalAction, verb: string) => (ctx: ActionContext) => {
      const ts = Date.now();
      const stageName = ctx.stage?.name ?? "the current stage";
      setData((s) => {
        const workflow = applyDecision(s.workflow, action, ctx.comment, ts, nextId("wf"));
        const event: ActivityEvent = {
          id: nextId("evt"),
          type: action === "approve" ? "approved" : action === "reject" ? "rejected" : "edited",
          actor: viewerActor,
          action: action === "request_changes" ? "requested changes on" : verb,
          target: stageName,
          preview: ctx.comment,
          timestamp: ts,
        };
        return { ...s, workflow, events: [event, ...s.events] };
      });
    };

  const handleComment = (ctx: ActionContext) => {
    if (!ctx.comment) return;
    const ts = Date.now();
    setData((s) => ({
      ...s,
      events: [
        {
          id: nextId("evt"),
          type: "commented",
          actor: viewerActor,
          action: "commented on",
          target: ctx.stage?.name ?? "the review",
          preview: ctx.comment,
          timestamp: ts,
        },
        ...s.events,
      ],
    }));
  };

  /* -- comment thread callbacks: thread AND activity --------------------- */

  const addComment = (draft: CommentDraft): Comment => {
    const ts = Date.now();
    const comment: Comment = {
      id: draft.tempId,
      author: currentUser,
      body: draft.body,
      createdAt: ts,
      parentId: draft.parentId,
      mentions: draft.mentions,
      status: "normal",
    };
    setData((s) => ({
      ...s,
      comments: [...s.comments, comment],
      events: [
        {
          id: nextId("evt"),
          type: "commented",
          actor: viewerActor,
          action: draft.parentId ? "replied on" : "commented on",
          target: "the hero refresh review",
          preview: draft.body,
          timestamp: ts,
        },
        ...s.events,
      ],
    }));
    return comment;
  };

  const editComment = (draft: CommentDraft): Comment | undefined => {
    if (!draft.editId) return undefined;
    const ts = Date.now();
    let edited: Comment | undefined;
    setData((s) => {
      const comments = patchComment(s.comments, draft.editId!, (c) => {
        edited = { ...c, body: draft.body, mentions: draft.mentions, editedAt: ts, status: "edited" };
        return edited;
      });
      return { ...s, comments };
    });
    return edited;
  };

  const resolveComment = (comment: Comment) => {
    const ts = Date.now();
    setData((s) => ({
      ...s,
      comments: patchComment(s.comments, comment.id, (c) => ({ ...c, resolved: true, status: "resolved" })),
      events: [
        {
          id: nextId("evt"),
          type: "archived",
          actor: viewerActor,
          action: "resolved the discussion on",
          target: "the hero refresh review",
          timestamp: ts,
        },
        ...s.events,
      ],
      statusNote: "The discussion was resolved.",
    }));
  };

  const reopenComment = (comment: Comment) => {
    setData((s) => ({
      ...s,
      comments: patchComment(s.comments, comment.id, (c) => ({ ...c, resolved: false, status: "normal" })),
    }));
  };

  const reactComment = (comment: Comment, emoji: string, active: boolean) => {
    setData((s) => ({
      ...s,
      comments: patchComment(s.comments, comment.id, (c) => {
        const reactions = [...(c.reactions ?? [])];
        const i = reactions.findIndex((r) => r.emoji === emoji);
        if (i >= 0) {
          const count = Math.max(0, reactions[i].count + (active ? 1 : -1));
          if (count === 0) reactions.splice(i, 1);
          else reactions[i] = { ...reactions[i], count, reactedByMe: active };
        } else if (active) {
          reactions.push({ emoji, count: 1, reactedByMe: true });
        }
        return { ...c, reactions };
      }),
    }));
  };

  /* -- authorization gate (app-owned) ------------------------------------ */

  const canAct = (action: ApprovalAction, ctx: ActionContext) => {
    if (action === "add_comment" || action === "resubmit" || action === "cancel") return true;
    const me = ctx.stage?.reviewers.find((r) => r.id === currentUser.id);
    if (!me) return { allowed: false, reason: "You are not a reviewer on this stage." };
    if (me.decision && me.decision !== "pending") {
      return { allowed: false, reason: "You already recorded a decision here." };
    }
    return true;
  };

  const control =
    "rounded-lg px-2.5 py-1 text-[12.5px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

  return (
    <section
      aria-label={`${title} workspace`}
      className={cn(
        "flex w-full flex-col gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 sm:p-5",
        className,
      )}
    >
      {/* header: title + presence + status */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-semibold leading-tight text-[var(--color-fg)]">{title}</h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-muted)]">{data.statusNote}</p>
          </div>
          <HeaderStatus status={data.workflow.status} />
          <LivePresenceStack users={data.presence} label={`${data.presence.length} people reviewing`} />
        </div>

        {showControls ? (
          <div
            className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-2"
            role="group"
            aria-label="Load a review phase"
          >
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Phase
            </span>
            {PHASES.map((p) => {
              const active = phase === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => loadPhase(p.id)}
                  className={cn(
                    control,
                    active
                      ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground,white)] [border:1px_solid_var(--color-accent)]"
                      : "bg-[var(--color-surface)] text-[var(--color-fg)] [border:1px_solid_var(--color-border)] hover:border-[var(--color-accent)]",
                  )}
                >
                  {p.label}
                </button>
              );
            })}
            <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              Demo data - fictional users
            </span>
          </div>
        ) : null}
      </header>

      {/* body: main column (approval + thread) + activity rail */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <ApprovalWorkflow
            workflow={data.workflow}
            currentUserId={currentUser.id}
            confirmReject
            canAct={canAct}
            onApprove={recordDecision("approve", "approved")}
            onReject={recordDecision("reject", "rejected")}
            onRequestChanges={recordDecision("request_changes", "requested changes on")}
            onComment={handleComment}
            onResubmit={() => loadPhase("open")}
          />
          <CommentThread
            comments={data.comments}
            currentUser={currentUser}
            mentionable={mentionable}
            unreadAfter={data.unreadAfter}
            collapseRepliesAfter={4}
            maxHeight={420}
            onAddComment={addComment}
            onReply={addComment}
            onEdit={editComment}
            onResolve={resolveComment}
            onReopen={reopenComment}
            onReact={reactComment}
          />
        </div>

        <aside aria-label="Activity" className="min-w-0">
          <div className="lg:sticky lg:top-4">
            <ActivityStream events={data.events} unreadAfter={data.unreadAfter} maxHeight={620} />
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CollaborativeReviewWorkspace;
