"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  getStatusMeta,
  statusVars,
  formatTimestamp,
  useDisclosure,
  streamItemVariants,
  type StatusTone,
} from "@/lib/motionkit";

/* --------------------------------------------------------------------------
 * ApprovalWorkflow — presentation + control for an app-owned approval/sign-off
 * process. The APPLICATION owns authorization: this component never decides
 * whether an action is permitted — it renders the state it is given and asks
 * the host (via `canAct`) whether each action is allowed, surfacing the host's
 * disabled reason in the UI. Supports sequential (all-must-approve) and
 * parallel (any-one / quorum) stages, minimum approvals, required vs optional
 * approvers, a current-user action state, a decision history, and destructive
 * reject confirmation. Clean-room original.
 * ----------------------------------------------------------------------- */

export type ApprovalStatus =
  | "draft"
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "changes_requested"
  | "cancelled"
  | "expired";

export type ApprovalAction =
  | "approve"
  | "reject"
  | "request_changes"
  | "add_comment"
  | "cancel"
  | "resubmit";

/** How a stage aggregates its reviewers' decisions. */
export type StageMode = "all" | "any" | "quorum";

/** A reviewer's current decision on their stage. */
export type ReviewerDecision =
  | "pending"
  | "approved"
  | "rejected"
  | "changes_requested";

export interface Person {
  /** Stable identity — drives keys, current-user matching, and avatar hue. */
  id: string;
  name: string;
  /** Optional role/title, e.g. "Security lead". */
  role?: string;
  /** Optional avatar image; when absent an initials + hue avatar is generated. */
  avatarUrl?: string;
  /** Optional explicit avatar color (any CSS color). */
  color?: string;
}

export interface Reviewer extends Person {
  /** Optional approvers do not count toward `requiredApprovals`. */
  optional?: boolean;
  /** The reviewer's current decision on this stage. Defaults to "pending". */
  decision?: ReviewerDecision;
  /** When the decision was recorded. */
  decidedAt?: Date | number | string;
  /** A short note attached to the decision. */
  note?: string;
}

export interface WorkflowStage {
  /** Stable id — drives keys and the `currentStageId` pointer. */
  id: string;
  name: string;
  description?: string;
  /** Stage-level status (same vocabulary as the workflow status). */
  status: ApprovalStatus;
  reviewers: Reviewer[];
  /**
   * How the stage aggregates decisions. "all" = every required reviewer must
   * approve (sequential AND); "any" = one approval clears it (parallel OR);
   * "quorum" = `requiredApprovals` of the reviewers. Defaults to "all".
   */
  mode?: StageMode;
  /** Minimum approvals to clear the stage. Defaults per `mode`. */
  requiredApprovals?: number;
  completedAt?: Date | number | string;
}

export interface Decision {
  id: string;
  action: ApprovalAction;
  actorId: string;
  actorName: string;
  stageId?: string;
  stageName?: string;
  comment?: string;
  timestamp: Date | number | string;
}

export interface Attachment {
  id: string;
  name: string;
  /** Human-readable size, e.g. "2.4 MB". */
  meta?: string;
  href?: string;
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface ApprovalWorkflowData {
  id: string;
  title: string;
  description?: string;
  requester: Person;
  status: ApprovalStatus;
  stages: WorkflowStage[];
  /** Which stage is awaiting action. Defaults to the first non-terminal stage. */
  currentStageId?: string;
  risk?: RiskLevel;
  priority?: "low" | "normal" | "high" | "urgent";
  deadline?: Date | number | string;
  createdAt?: Date | number | string;
  attachments?: Attachment[];
  history?: Decision[];
}

/** Payload passed to `canAct` and to every action callback. */
export interface ActionContext {
  action: ApprovalAction;
  stage?: WorkflowStage;
  /** The note typed into the composer at the time of the action, if any. */
  comment?: string;
  workflow: ApprovalWorkflowData;
}

/** `canAct` may return a bare boolean or an object carrying a disabled reason. */
export type ActPermission = boolean | { allowed: boolean; reason?: string };

export interface ApprovalWorkflowProps {
  /** Controlled workflow data. The app owns and updates this. */
  workflow: ApprovalWorkflowData;
  /** The viewer, used to surface the current-user action state. */
  currentUserId?: string;
  /**
   * App-provided authorization gate. Returns whether the current user may take
   * `action` and, optionally, a reason shown when disabled. The component never
   * decides permissions itself — absent this, actions default to allowed.
   */
  canAct?: (action: ApprovalAction, context: ActionContext) => ActPermission;
  onApprove?: (context: ActionContext) => void;
  onReject?: (context: ActionContext) => void;
  onRequestChanges?: (context: ActionContext) => void;
  onComment?: (context: ActionContext) => void;
  onCancel?: (context: ActionContext) => void;
  onResubmit?: (context: ActionContext) => void;
  /** Collapse resolved stages to a slim line (expandable). Default true. */
  compactCompleted?: boolean;
  /** Require an inline confirmation before a reject fires. Default false. */
  confirmReject?: boolean;
  /** Enables relative timestamps ("2h ago"); pass a stable value to avoid drift. */
  now?: number;
  renderAttachment?: (attachment: Attachment) => React.ReactNode;
  renderReviewer?: (reviewer: Reviewer) => React.ReactNode;
  /** Accessible label for the workflow region. */
  label?: string;
  className?: string;
}

/* -- status + tone metadata --------------------------------------------- */

const STATUS_OVERRIDES: Record<string, { label: string; tone: StatusTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  pending: { label: "Pending", tone: "warning" },
  in_review: { label: "In review", tone: "active" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "error" },
  changes_requested: { label: "Changes requested", tone: "warning" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  expired: { label: "Expired", tone: "error" },
};

const DECISION_META: Record<ReviewerDecision, { label: string; tone: StatusTone }> = {
  pending: { label: "Awaiting", tone: "neutral" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "error" },
  changes_requested: { label: "Changes", tone: "warning" },
};

const RISK_META: Record<RiskLevel, { label: string; tone: StatusTone }> = {
  low: { label: "Low risk", tone: "success" },
  medium: { label: "Medium risk", tone: "warning" },
  high: { label: "High risk", tone: "warning" },
  critical: { label: "Critical risk", tone: "error" },
};

const EASE: Transition["ease"] = [0.2, 0, 0, 1];

const P = (d: string) => (
  <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
);

/** Icon per semantic tone — so status is never conveyed by color alone. */
function ToneIcon({ tone, size = 13 }: { tone: StatusTone; size?: number }) {
  const paths: Record<StatusTone, React.ReactNode> = {
    success: P("M4 12.5 9 17.5 20 6.5"),
    error: P("M6 6l12 12M18 6 6 18"),
    warning: P("M12 8v5M12 17h.01M10.3 4.3 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z"),
    info: P("M12 8h.01M11 12h1v5h1M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"),
    active: P("M12 3a9 9 0 1 0 9 9M12 7v5l3 2"),
    neutral: P("M5 12h14"),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {paths[tone]}
    </svg>
  );
}

/* -- helpers ------------------------------------------------------------- */

function toMs(value: Date | number | string): number {
  const d = value instanceof Date ? value : new Date(value);
  return d.getTime();
}

function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + second).toUpperCase();
}

const TERMINAL: ReadonlySet<ApprovalStatus> = new Set([
  "approved",
  "rejected",
  "cancelled",
  "expired",
]);

function isResolved(status: ApprovalStatus): boolean {
  return status === "approved" || status === "rejected" || status === "cancelled";
}

interface StageProgress {
  given: number;
  needed: number;
  modeLabel: string;
}

function stageProgress(stage: WorkflowStage): StageProgress {
  const mode: StageMode = stage.mode ?? "all";
  const required = stage.reviewers.filter((r) => !r.optional);
  const given = stage.reviewers.filter((r) => r.decision === "approved").length;
  let needed: number;
  let modeLabel: string;
  if (mode === "any") {
    needed = stage.requiredApprovals ?? 1;
    modeLabel = "Any one reviewer";
  } else if (mode === "quorum") {
    needed = stage.requiredApprovals ?? Math.max(1, Math.ceil(required.length / 2));
    modeLabel = `${needed} of ${stage.reviewers.length} must approve`;
  } else {
    needed = stage.requiredApprovals ?? required.length;
    modeLabel = "All reviewers must approve";
  }
  return { given: Math.min(given, needed), needed: Math.max(1, needed), modeLabel };
}

function resolveCurrentStageId(workflow: ApprovalWorkflowData): string | undefined {
  if (workflow.currentStageId) return workflow.currentStageId;
  const active = workflow.stages.find((s) => !isResolved(s.status));
  return active?.id ?? workflow.stages[workflow.stages.length - 1]?.id;
}

/* -- avatar -------------------------------------------------------------- */

function Avatar({ person, size = 30 }: { person: Person; size?: number }) {
  const h = hueFromString(person.color ?? person.id + person.name);
  const bg = person.color ?? `linear-gradient(140deg, hsl(${h} 62% 52%), hsl(${(h + 42) % 360} 66% 42%))`;
  if (person.avatarUrl) {
    return (
      <img
        src={person.avatarUrl}
        alt={person.name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover ring-2 ring-[var(--color-surface)] [border:1px_solid_rgba(0,0,0,0.08)]"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={person.name}
      className="grid shrink-0 select-none place-items-center rounded-full font-semibold text-white ring-2 ring-[var(--color-surface)] [border:1px_solid_rgba(0,0,0,0.08)]"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), background: bg }}
    >
      {initials(person.name)}
    </span>
  );
}

/* -- pills --------------------------------------------------------------- */

function StatusPill({
  tone,
  label,
  size = "md",
}: {
  tone: StatusTone;
  label: string;
  size?: "sm" | "md";
}) {
  const v = statusVars(tone);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold [border:1px_solid]",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]",
      )}
      style={{ color: v.color, background: v.bg, borderColor: v.border }}
    >
      <ToneIcon tone={tone} size={size === "sm" ? 11 : 13} />
      {label}
    </span>
  );
}

/* -- component ----------------------------------------------------------- */

export function ApprovalWorkflow({
  workflow,
  currentUserId,
  canAct,
  onApprove,
  onReject,
  onRequestChanges,
  onComment,
  onCancel,
  onResubmit,
  compactCompleted = true,
  confirmReject = false,
  now,
  renderAttachment,
  renderReviewer,
  label,
  className,
}: ApprovalWorkflowProps) {
  const reduce = useReducedMotion();
  const composer = useDisclosure({ idPrefix: "mk-approval-note" });
  const history = useDisclosure({ idPrefix: "mk-approval-history" });

  const [comment, setComment] = React.useState("");
  const [confirmingReject, setConfirmingReject] = React.useState(false);
  const [announce, setAnnounce] = React.useState("");
  const [expandedStages, setExpandedStages] = React.useState<Set<string>>(() => new Set());

  const statusRef = React.useRef<HTMLDivElement | null>(null);
  const rejectBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const confirmRejectRef = React.useRef<HTMLButtonElement | null>(null);
  const commentRef = React.useRef<HTMLTextAreaElement | null>(null);

  const currentStageId = resolveCurrentStageId(workflow);
  const currentStage = workflow.stages.find((s) => s.id === currentStageId);
  const currentIndex = workflow.stages.findIndex((s) => s.id === currentStageId);
  const meta = getStatusMeta(workflow.status, STATUS_OVERRIDES);
  const actionable = !TERMINAL.has(workflow.status);
  const canResubmit =
    workflow.status === "rejected" ||
    workflow.status === "changes_requested" ||
    workflow.status === "expired";

  const clearedCount = workflow.stages.filter((s) => s.status === "approved").length;

  // The viewer's own decision on the current stage (surfaced as a note).
  const viewerReviewer = currentStage?.reviewers.find((r) => r.id === currentUserId);

  const fmt = React.useCallback(
    (value: Date | number | string) =>
      now != null
        ? formatTimestamp(value, { relative: true, now })
        : formatTimestamp(value, {
            format: (d) =>
              new Intl.DateTimeFormat(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }).format(d),
          }),
    [now],
  );

  const permission = React.useCallback(
    (action: ApprovalAction): { allowed: boolean; reason?: string } => {
      if (!canAct) return { allowed: true };
      const raw = canAct(action, { action, stage: currentStage, workflow });
      if (typeof raw === "boolean") return { allowed: raw };
      return raw;
    },
    [canAct, currentStage, workflow],
  );

  const toStatus = React.useCallback((message: string) => {
    setAnnounce(message);
    // Move focus to the status region so keyboard/SR users land on the outcome.
    requestAnimationFrame(() => statusRef.current?.focus());
  }, []);

  const runAction = React.useCallback(
    (action: ApprovalAction, handler?: (ctx: ActionContext) => void, message?: string) => {
      const note = comment.trim();
      handler?.({ action, stage: currentStage, comment: note || undefined, workflow });
      if (note) setComment("");
      if (composer.open) composer.setOpen(false);
      if (message) toStatus(message);
    },
    [comment, currentStage, workflow, composer, toStatus],
  );

  const handleApprove = () => {
    if (!permission("approve").allowed) return;
    runAction("approve", onApprove, `You approved the ${currentStage?.name ?? "current"} stage.`);
  };

  const handleRequestChanges = () => {
    if (!permission("request_changes").allowed) return;
    runAction("request_changes", onRequestChanges, `Changes requested on the ${currentStage?.name ?? "current"} stage.`);
  };

  const handleRejectClick = () => {
    if (!permission("reject").allowed) return;
    if (confirmReject && !confirmingReject) {
      setConfirmingReject(true);
      requestAnimationFrame(() => confirmRejectRef.current?.focus());
      return;
    }
    setConfirmingReject(false);
    runAction("reject", onReject, `You rejected the ${currentStage?.name ?? "current"} stage.`);
  };

  const cancelRejectConfirm = () => {
    setConfirmingReject(false);
    requestAnimationFrame(() => rejectBtnRef.current?.focus());
  };

  const handleComment = () => {
    const note = comment.trim();
    if (!note) {
      commentRef.current?.focus();
      return;
    }
    onComment?.({ action: "add_comment", stage: currentStage, comment: note, workflow });
    setComment("");
    composer.setOpen(false);
    toStatus("Comment added.");
  };

  const handleCancel = () => {
    if (!permission("cancel").allowed) return;
    runAction("cancel", onCancel, "Request cancelled.");
  };

  const handleResubmit = () => {
    if (!permission("resubmit").allowed) return;
    runAction("resubmit", onResubmit, "Request resubmitted for review.");
  };

  const openComposer = () => {
    if (!permission("add_comment").allowed) return;
    composer.setOpen(true);
    requestAnimationFrame(() => commentRef.current?.focus());
  };

  const toggleStage = (id: string) =>
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const regionLabel = label ?? `Approval workflow: ${workflow.title}`;

  return (
    <section
      aria-label={regionLabel}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]",
        className,
      )}
    >
      {/* header */}
      <header className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold leading-snug text-[var(--color-fg)]">
              {workflow.title}
            </h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12.5px] text-[var(--color-muted)]">
              <span>
                Requested by <span className="font-medium text-[var(--color-fg)]">{workflow.requester.name}</span>
              </span>
              {workflow.createdAt != null ? (
                <>
                  <span aria-hidden>·</span>
                  <time dateTime={new Date(toMs(workflow.createdAt)).toISOString()}>{fmt(workflow.createdAt)}</time>
                </>
              ) : null}
            </p>
          </div>
          <StatusPill tone={meta.tone} label={meta.label} />
        </div>

        {workflow.description ? (
          <p className="text-[13px] leading-relaxed text-[var(--color-muted)]">{workflow.description}</p>
        ) : null}

        {/* risk / priority / deadline chips */}
        {workflow.risk || workflow.priority || workflow.deadline != null ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {workflow.risk ? (
              <StatusPill tone={RISK_META[workflow.risk].tone} label={RISK_META[workflow.risk].label} size="sm" />
            ) : null}
            {workflow.priority && workflow.priority !== "normal" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[11px] font-medium capitalize text-[var(--color-fg)] [border:1px_solid_var(--color-border)]">
                {workflow.priority} priority
              </span>
            ) : null}
            {workflow.deadline != null ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                  {P("M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z")}
                </svg>
                <span>
                  Due <time dateTime={new Date(toMs(workflow.deadline)).toISOString()}>{fmt(workflow.deadline)}</time>
                </span>
              </span>
            ) : null}
          </div>
        ) : null}

        {/* overall progress */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium tabular-nums text-[var(--color-muted)]">
            Stage {Math.min(currentIndex + 1, workflow.stages.length)} of {workflow.stages.length}
          </span>
          <div
            className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-bg-secondary)]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={workflow.stages.length}
            aria-valuenow={clearedCount}
            aria-label="Stages approved"
          >
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-success)]"
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${(clearedCount / Math.max(1, workflow.stages.length)) * 100}%` }}
              transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
            />
          </div>
          <span className="text-[11px] font-medium tabular-nums text-[var(--color-muted)]">
            {clearedCount}/{workflow.stages.length} approved
          </span>
        </div>
      </header>

      {/* stages */}
      <ol role="list" className="flex flex-col px-3 py-3 sm:px-4">
        {workflow.stages.map((stage, i) => {
          const isCurrent = stage.id === currentStageId && actionable;
          const resolved = isResolved(stage.status);
          const collapsed = compactCompleted && resolved && !isCurrent && !expandedStages.has(stage.id);
          return (
            <StageRow
              key={stage.id}
              stage={stage}
              index={i}
              isLast={i === workflow.stages.length - 1}
              isCurrent={isCurrent}
              collapsed={collapsed}
              expanded={expandedStages.has(stage.id)}
              onToggle={() => toggleStage(stage.id)}
              reduce={reduce}
              fmt={fmt}
              renderReviewer={renderReviewer}
            />
          );
        })}
      </ol>

      {/* current-stage action bar */}
      {actionable && currentStage ? (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 sm:px-5">
          {viewerReviewer && viewerReviewer.decision && viewerReviewer.decision !== "pending" ? (
            <p className="mb-2.5 flex items-center gap-1.5 text-[12.5px] text-[var(--color-muted)]">
              <ToneIcon tone={DECISION_META[viewerReviewer.decision].tone} />
              You already {DECISION_META[viewerReviewer.decision].label.toLowerCase()} this stage.
            </p>
          ) : (
            <p className="mb-2.5 text-[12.5px] text-[var(--color-muted)]">
              Awaiting your decision on <span className="font-medium text-[var(--color-fg)]">{currentStage.name}</span>.
            </p>
          )}

          {/* comment composer (useDisclosure) */}
          <AnimatePresence initial={false}>
            {composer.open ? (
              <motion.div
                {...composer.panelProps}
                key="composer"
                initial={reduce ? false : { height: 0, opacity: 0 }}
                animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.24, ease: EASE }}
                className="overflow-hidden"
              >
                <label htmlFor={`${composer.panelProps.id}-field`} className="mb-1 block text-[12px] font-medium text-[var(--color-muted)]">
                  Add a note
                </label>
                <textarea
                  id={`${composer.panelProps.id}-field`}
                  ref={commentRef}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  placeholder="Optional context for your decision…"
                  className="mb-2.5 w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[13px] text-[var(--color-fg)] outline-none placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* reject confirmation */}
          {confirmingReject ? (
            <div
              role="alertdialog"
              aria-label="Confirm rejection"
              className="mb-2.5 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2.5 text-[13px]"
              style={{ background: statusVars("error").bg, border: `1px solid ${statusVars("error").border}` }}
            >
              <span className="flex items-center gap-1.5 font-medium" style={{ color: statusVars("error").color }}>
                <ToneIcon tone="error" /> Reject {currentStage.name}? This returns the request to the requester.
              </span>
              <span className="ml-auto flex gap-2">
                <button
                  type="button"
                  ref={confirmRejectRef}
                  onClick={handleRejectClick}
                  className="rounded-md px-2.5 py-1 text-[12.5px] font-semibold text-[var(--color-error-foreground,white)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  style={{ background: statusVars("error").color }}
                >
                  Confirm reject
                </button>
                <button
                  type="button"
                  onClick={cancelRejectConfirm}
                  className="rounded-md px-2.5 py-1 text-[12.5px] font-medium text-[var(--color-fg)] outline-none [border:1px_solid_var(--color-border)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                >
                  Keep reviewing
                </button>
              </span>
            </div>
          ) : null}

          {/* action buttons */}
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Stage actions">
            <ActionButton tone="success" primary permission={permission("approve")} onClick={handleApprove}>
              <ToneIcon tone="success" /> Approve
            </ActionButton>
            <ActionButton tone="warning" permission={permission("request_changes")} onClick={handleRequestChanges}>
              <ToneIcon tone="warning" /> Request changes
            </ActionButton>
            <ActionButton
              tone="error"
              ref={rejectBtnRef}
              permission={permission("reject")}
              onClick={handleRejectClick}
              aria-expanded={confirmReject ? confirmingReject : undefined}
            >
              <ToneIcon tone="error" /> Reject
            </ActionButton>
            <ActionButton
              tone="neutral"
              permission={permission("add_comment")}
              onClick={openComposer}
              aria-expanded={composer.open}
            >
              {composer.open ? "Notes open" : "Add comment"}
            </ActionButton>
            {onCancel ? (
              <ActionButton tone="neutral" className="ml-auto" permission={permission("cancel")} onClick={handleCancel}>
                Cancel request
              </ActionButton>
            ) : null}
            {composer.open ? (
              <ActionButton tone="active" permission={{ allowed: true }} onClick={handleComment}>
                Post note
              </ActionButton>
            ) : null}
          </div>
        </div>
      ) : canResubmit && onResubmit ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 sm:px-5">
          <p className="text-[12.5px] text-[var(--color-muted)]">
            This request was {meta.label.toLowerCase()}. Address the feedback and resubmit for review.
          </p>
          <span className="ml-auto">
            <ActionButton tone="active" primary permission={permission("resubmit")} onClick={handleResubmit}>
              Resubmit for review
            </ActionButton>
          </span>
        </div>
      ) : null}

      {/* decision history (useDisclosure) */}
      {workflow.history && workflow.history.length > 0 ? (
        <div className="border-t border-[var(--color-border)] px-4 py-2.5 sm:px-5">
          <button
            type="button"
            {...history.triggerProps}
            className="flex w-full items-center gap-2 rounded-md py-1 text-left text-[12.5px] font-medium text-[var(--color-fg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <motion.svg
              aria-hidden
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              className="shrink-0 text-[var(--color-muted)]"
              animate={reduce ? undefined : { rotate: history.open ? 90 : 0 }}
              style={reduce ? { transform: history.open ? "rotate(90deg)" : "none" } : undefined}
              transition={{ duration: 0.2, ease: EASE }}
            >
              {P("m9 6 6 6-6 6")}
            </motion.svg>
            Decision history
            <span className="rounded-full bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-[11px] tabular-nums text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
              {workflow.history.length}
            </span>
          </button>
          <AnimatePresence initial={false}>
            {history.open ? (
              <motion.div
                {...history.panelProps}
                key="history"
                initial={reduce ? false : { height: 0, opacity: 0 }}
                animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.24, ease: EASE }}
                className="overflow-hidden"
              >
                {/* ml-4 gives the status discs room to sit ON the rail without
                    being clipped by this panel's overflow-hidden left edge. */}
                <ol role="list" className="mt-1 ml-4 space-y-2 border-l border-[var(--color-border)] py-2 pl-5">
                  <AnimatePresence initial={false}>
                    {workflow.history.map((d) => (
                      <HistoryRow key={d.id} decision={d} reduce={reduce} fmt={fmt} />
                    ))}
                  </AnimatePresence>
                </ol>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}

      {/* attachments */}
      {workflow.attachments && workflow.attachments.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] px-4 py-3 sm:px-5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Attachments</span>
          {workflow.attachments.map((a) =>
            renderAttachment ? (
              <React.Fragment key={a.id}>{renderAttachment(a)}</React.Fragment>
            ) : (
              <AttachmentChip key={a.id} attachment={a} />
            ),
          )}
        </div>
      ) : null}

      {/* polite status announcement + focus target */}
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="sr-only"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        {announce}
      </div>
    </section>
  );
}

/* -- action button (gated by app permission) ---------------------------- */

interface ActionButtonProps {
  tone: StatusTone;
  primary?: boolean;
  permission: { allowed: boolean; reason?: string };
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  "aria-expanded"?: boolean;
}

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton(
  { tone, primary, permission, onClick, children, className, ...rest },
  ref,
) {
  const v = statusVars(tone);
  const reasonId = React.useId();
  const disabled = !permission.allowed;
  return (
    <span className={cn("inline-flex flex-col", className)}>
      <button
        type="button"
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        title={disabled ? permission.reason : undefined}
        aria-describedby={disabled && permission.reason ? reasonId : undefined}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45",
          primary && !disabled && "text-[var(--color-success-foreground,white)]",
        )}
        style={
          primary
            ? { background: v.color, color: tone === "success" ? "var(--color-success-foreground, white)" : "white" }
            : { color: v.color, background: v.bg, border: `1px solid ${v.border}` }
        }
        {...rest}
      >
        {children}
      </button>
      {disabled && permission.reason ? (
        <span id={reasonId} className="mt-1 max-w-[16rem] text-[11px] leading-tight text-[var(--color-muted)]">
          {permission.reason}
        </span>
      ) : null}
    </span>
  );
});

/* -- stage row ----------------------------------------------------------- */

function StageRow({
  stage,
  index,
  isLast,
  isCurrent,
  collapsed,
  expanded,
  onToggle,
  reduce,
  fmt,
  renderReviewer,
}: {
  stage: WorkflowStage;
  index: number;
  isLast: boolean;
  isCurrent: boolean;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  reduce: boolean;
  fmt: (v: Date | number | string) => string;
  renderReviewer?: (reviewer: Reviewer) => React.ReactNode;
}) {
  const stageMeta = getStatusMeta(stage.status, STATUS_OVERRIDES);
  const progress = stageProgress(stage);
  const resolved = isResolved(stage.status);
  const nodeTone: StatusTone = isCurrent ? "active" : stageMeta.tone;
  const panelId = `stage-panel-${stage.id}`;

  return (
    <li className="relative flex gap-3">
      {/* rail */}
      <div className="flex flex-col items-center">
        <span
          className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold [border:2px_solid]"
          style={{
            color: statusVars(nodeTone).color,
            background: statusVars(nodeTone).bg,
            borderColor: statusVars(nodeTone).border,
          }}
          aria-hidden
        >
          {resolved ? <ToneIcon tone={stageMeta.tone} size={14} /> : index + 1}
        </span>
        {!isLast ? (
          <span
            className="w-0.5 flex-1"
            style={{
              minHeight: 18,
              background:
                stage.status === "approved"
                  ? "var(--color-success)"
                  : "var(--color-border)",
            }}
            aria-hidden
          />
        ) : null}
      </div>

      {/* body */}
      <div className={cn("min-w-0 flex-1", isLast ? "pb-1" : "pb-4")}>
        {collapsed ? (
          <button
            type="button"
            aria-expanded={false}
            aria-controls={panelId}
            onClick={onToggle}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <span className="text-[13.5px] font-medium text-[var(--color-fg)]">{stage.name}</span>
            <StatusPill tone={stageMeta.tone} label={stageMeta.label} size="sm" />
            <span className="text-[12px] text-[var(--color-muted)]">{progress.given} approvals</span>
            <span className="ml-auto text-[12px] text-[var(--color-accent)]">Show</span>
          </button>
        ) : (
          <motion.div
            id={expanded || resolved ? panelId : undefined}
            layout={!reduce}
            className={cn(
              "rounded-xl p-2.5",
              isCurrent && "bg-[color-mix(in_oklab,var(--color-accent)_7%,transparent)] [box-shadow:inset_0_0_0_1px_color-mix(in_oklab,var(--color-accent)_35%,transparent)]",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13.5px] font-semibold text-[var(--color-fg)]">{stage.name}</span>
              <StatusPill tone={stageMeta.tone} label={stageMeta.label} size="sm" />
              {isCurrent ? (
                <span className="rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-accent-foreground,white)]">
                  Current
                </span>
              ) : null}
              {resolved && stage.completedAt != null ? (
                <span className="text-[12px] text-[var(--color-muted)]">{fmt(stage.completedAt)}</span>
              ) : null}
              {resolved ? (
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={onToggle}
                  className="ml-auto rounded-md px-1.5 py-0.5 text-[12px] font-medium text-[var(--color-accent)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                >
                  Hide
                </button>
              ) : null}
            </div>

            {stage.description ? (
              <p className="mt-1 text-[12.5px] leading-snug text-[var(--color-muted)]">{stage.description}</p>
            ) : null}

            <p className="mt-1.5 flex items-center gap-2 text-[12px] text-[var(--color-muted)]">
              <span className="font-medium text-[var(--color-fg)]">{progress.modeLabel}</span>
              <span aria-hidden>·</span>
              <span className="tabular-nums">
                {progress.given} of {progress.needed} approval{progress.needed === 1 ? "" : "s"}
              </span>
            </p>

            {/* reviewers */}
            <ul role="list" className="mt-2 flex flex-col gap-1.5">
              {stage.reviewers.map((r) =>
                renderReviewer ? (
                  <li key={r.id}>{renderReviewer(r)}</li>
                ) : (
                  <ReviewerRow key={r.id} reviewer={r} reduce={reduce} fmt={fmt} />
                ),
              )}
            </ul>
          </motion.div>
        )}
      </div>
    </li>
  );
}

/* -- reviewer row -------------------------------------------------------- */

function ReviewerRow({
  reviewer,
  reduce,
  fmt,
}: {
  reviewer: Reviewer;
  reduce: boolean;
  fmt: (v: Date | number | string) => string;
}) {
  const decision = reviewer.decision ?? "pending";
  const dm = DECISION_META[decision];
  return (
    <motion.li
      layout={!reduce}
      className="flex items-center gap-2.5 rounded-lg px-1.5 py-1"
    >
      <Avatar person={reviewer} size={28} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-1.5 text-[13px] leading-tight text-[var(--color-fg)]">
          <span className="font-medium">{reviewer.name}</span>
          {reviewer.optional ? (
            <span className="rounded bg-[var(--color-bg-secondary)] px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
              Optional
            </span>
          ) : null}
        </span>
        {reviewer.role ? <span className="block text-[11.5px] text-[var(--color-muted)]">{reviewer.role}</span> : null}
        {reviewer.note ? (
          <span className="mt-0.5 block truncate text-[11.5px] italic text-[var(--color-muted)]">“{reviewer.note}”</span>
        ) : null}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-0.5">
        <StatusPill tone={dm.tone} label={dm.label} size="sm" />
        {reviewer.decidedAt != null && decision !== "pending" ? (
          <span className="text-[10.5px] text-[var(--color-muted)]">{fmt(reviewer.decidedAt)}</span>
        ) : null}
      </span>
    </motion.li>
  );
}

/* -- history row --------------------------------------------------------- */

const ACTION_LABEL: Record<ApprovalAction, { verb: string; tone: StatusTone }> = {
  approve: { verb: "approved", tone: "success" },
  reject: { verb: "rejected", tone: "error" },
  request_changes: { verb: "requested changes on", tone: "warning" },
  add_comment: { verb: "commented on", tone: "info" },
  cancel: { verb: "cancelled", tone: "neutral" },
  resubmit: { verb: "resubmitted", tone: "active" },
};

function HistoryRow({
  decision,
  reduce,
  fmt,
}: {
  decision: Decision;
  reduce: boolean;
  fmt: (v: Date | number | string) => string;
}) {
  const al = ACTION_LABEL[decision.action];
  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? false : streamItemVariants.initial}
      animate={streamItemVariants.animate}
      exit={reduce ? { opacity: 0 } : streamItemVariants.exit}
      transition={{ duration: 0.24, ease: EASE }}
      className="relative"
    >
      <span
        aria-hidden
        className="absolute -left-[29px] top-0.5 grid h-4 w-4 place-items-center rounded-full ring-2 ring-[var(--color-surface)] [border:1.5px_solid]"
        style={{ color: statusVars(al.tone).color, background: statusVars(al.tone).bg, borderColor: statusVars(al.tone).border }}
      >
        <ToneIcon tone={al.tone} size={9} />
      </span>
      <p className="text-[12.5px] leading-snug text-[var(--color-fg)]">
        <span className="font-medium">{decision.actorName}</span>{" "}
        <span className="text-[var(--color-muted)]">{al.verb}</span>
        {decision.stageName ? <span className="text-[var(--color-muted)]"> {decision.stageName}</span> : null}
      </p>
      {decision.comment ? (
        <p className="mt-0.5 rounded-md border-l-2 border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-1 text-[11.5px] leading-snug text-[var(--color-muted)]">
          {decision.comment}
        </p>
      ) : null}
      <time className="text-[11px] text-[var(--color-muted)]" dateTime={new Date(toMs(decision.timestamp)).toISOString()}>
        {fmt(decision.timestamp)}
      </time>
    </motion.li>
  );
}

/* -- attachment chip ----------------------------------------------------- */

function AttachmentChip({ attachment }: { attachment: Attachment }) {
  const inner = (
    <>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
        {P("M14 3v5h5M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-5Z")}
      </svg>
      <span className="min-w-0 truncate">{attachment.name}</span>
      {attachment.meta ? <span className="shrink-0 whitespace-nowrap text-[var(--color-muted)]">· {attachment.meta}</span> : null}
    </>
  );
  const base =
    "inline-flex min-w-0 max-w-[15rem] items-center gap-1.5 rounded-lg bg-[var(--color-bg-secondary)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-fg)] [border:1px_solid_var(--color-border)]";
  if (attachment.href) {
    return (
      <a
        href={attachment.href}
        className={cn(base, "outline-none hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]")}
      >
        {inner}
      </a>
    );
  }
  return <span className={base}>{inner}</span>;
}

export default ApprovalWorkflow;
