"use client";

import * as React from "react";

import {
  ApprovalWorkflow,
  type ApprovalWorkflowData,
} from "@/registry/collaboration/approval-workflow";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL ApprovalWorkflow in one
 * representative "in review" state — the active security stage plus its immediate
 * neighbors (approved product, pending marketing), so the card shows the active +
 * adjacent stages only. No demo control panel (Add reviewer / Collapse / Reset).
 * A fixed `now` keeps relative timestamps deterministic.
 */

const DAY = 86_400_000;
const HOUR = 3_600_000;
const T0 = 1_800_000_000_000; // fixed reference instant

/* Clearly fictional demo — a launch approval for an imaginary product. */
const WORKFLOW: ApprovalWorkflowData = {
  id: "wf-launch-2401",
  title: "Launch approval - Aurora 2.0 public release",
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
        { id: "sec-kai", name: "Kai Ferreira", role: "Security lead", decision: "approved", decidedAt: T0 - 6 * HOUR },
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
      ],
    },
  ],
};

export function ApprovalWorkflowCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <ApprovalWorkflow workflow={WORKFLOW} currentUserId="you" compactCompleted now={T0} />
    </div>
  );
}

export default ApprovalWorkflowCatalogPreview;
