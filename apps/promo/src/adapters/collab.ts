import type { PresenceUser } from "@/registry/collaboration/live-presence-stack";
import type { Comment } from "@/registry/collaboration/comment-thread";
import type {
  ApprovalWorkflowData,
  ReviewerDecision,
} from "@/registry/collaboration/approval-workflow";

import { COLLAB_NOW, COMMENTS_ALL, PEOPLE, PRESENCE_ALL } from "../data/collab";

export interface CollabBeats {
  /** Third collaborator joins the presence stack. */
  join: number;
  /** The new comment lands. */
  comment: number;
  /** Approval flips from pending to approved. */
  approve: number;
}

export interface CollabFrameState {
  users: PresenceUser[];
  comments: Comment[];
  workflow: ApprovalWorkflowData;
}

export function collabAt(frame: number, b: CollabBeats): CollabFrameState {
  const users = frame < b.join ? PRESENCE_ALL.slice(0, 2) : PRESENCE_ALL;
  const comments = frame < b.comment ? COMMENTS_ALL.slice(0, 1) : COMMENTS_ALL;

  const approved = frame >= b.approve;
  const adaDecision: ReviewerDecision = "approved";
  const noahDecision: ReviewerDecision = approved ? "approved" : "pending";

  const workflow: ApprovalWorkflowData = {
    id: "rel-2472",
    title: "Release 24.7.2 to production",
    requester: PEOPLE.mira,
    status: approved ? "approved" : "in_review",
    risk: "medium",
    priority: "high",
    createdAt: COLLAB_NOW - 1_500_000,
    currentStageId: "release",
    stages: [
      {
        id: "checks",
        name: "Automated checks",
        status: "approved",
        reviewers: [],
        completedAt: COLLAB_NOW - 900_000,
      },
      {
        id: "release",
        name: "Release approval",
        status: approved ? "approved" : "in_review",
        mode: "all",
        reviewers: [
          {
            ...PEOPLE.ada,
            decision: adaDecision,
            decidedAt: COLLAB_NOW - 60_000,
            note: "Validator fix verified on the retry.",
          },
          {
            ...PEOPLE.noah,
            decision: noahDecision,
            decidedAt: approved ? COLLAB_NOW : undefined,
          },
        ],
        completedAt: approved ? COLLAB_NOW : undefined,
      },
    ],
  };

  return { users, comments, workflow };
}
