/** Fictional collaboration data (presence, comments, approval). */

import type { PresenceUser } from "@/registry/collaboration/live-presence-stack";
import type { Comment, CommentAuthor } from "@/registry/collaboration/comment-thread";

export const PEOPLE: Record<string, CommentAuthor> = {
  mira: { id: "mira", name: "Mira Chen", role: "On-call" },
  ada: { id: "ada", name: "Ada Osei", role: "Release lead" },
  noah: { id: "noah", name: "Noah Alvarez", role: "Platform" },
};

export const PRESENCE_ALL: PresenceUser[] = [
  { id: "mira", name: "Mira Chen", status: "active" },
  { id: "ada", name: "Ada Osei", status: "editing" },
  { id: "noah", name: "Noah Alvarez", status: "viewing" },
];

/** Fixed reference clock (matches the dashboard scene). */
export const COLLAB_NOW = Date.UTC(2026, 6, 18, 15, 4, 0);

export const COMMENTS_ALL: Comment[] = [
  {
    id: "c1",
    author: PEOPLE.mira,
    body: "Retry is green — the checkout session test passes now.",
    createdAt: COLLAB_NOW - 120_000,
  },
  {
    id: "c2",
    author: PEOPLE.ada,
    body: "Nice catch on the validator. Approving the release.",
    createdAt: COLLAB_NOW - 30_000,
    parentId: "c1",
  },
];

/** Static relative labels so nothing ever reads the wall clock. */
export const TIMESTAMP_LABELS: Record<number, string> = {
  [COLLAB_NOW - 120_000]: "2m ago",
  [COLLAB_NOW - 30_000]: "just now",
};
