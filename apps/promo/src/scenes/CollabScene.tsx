import React from "react";
import { useCurrentFrame } from "remotion";

import { LivePresenceStack } from "@/registry/collaboration/live-presence-stack";
import { CommentThread } from "@/registry/collaboration/comment-thread";
import { ApprovalWorkflow } from "@/registry/collaboration/approval-workflow";

import { collabAt, type CollabBeats } from "../adapters/collab";
import { COLLAB_NOW, PEOPLE, TIMESTAMP_LABELS } from "../data/collab";

const stamp = (value: Date | number | string): string =>
  TIMESTAMP_LABELS[typeof value === "number" ? value : Number(value)] ?? "now";

/**
 * Collaboration moment: presence stack + comment thread + approval flipping
 * from pending to approved. All three are the real registry components.
 */
export const CollabPanels: React.FC<{
  beats: CollabBeats;
  stacked?: boolean;
  width?: number;
}> = ({ beats, stacked = false, width }) => {
  const frame = useCurrentFrame();
  const s = collabAt(frame, beats);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: stacked ? "column" : "row",
        gap: 20,
        width: width ?? "100%",
        maxWidth: "100%",
        alignItems: "flex-start",
      }}
    >
      <div style={{ flex: stacked ? undefined : "0 0 52%", width: stacked ? "100%" : undefined, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <LivePresenceStack users={s.users} label="Online now" />
        </div>
        <div style={{ borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
          <CommentThread
            comments={s.comments}
            currentUser={PEOPLE.noah}
            formatTimestamp={stamp}
            label="Release thread"
            collapseRepliesAfter={0}
          />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0, borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
        <ApprovalWorkflow
          workflow={s.workflow}
          currentUserId="noah"
          now={COLLAB_NOW}
          compactCompleted
        />
      </div>
    </div>
  );
};
