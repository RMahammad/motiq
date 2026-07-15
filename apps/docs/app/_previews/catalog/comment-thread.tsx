"use client";

import * as React from "react";

import { CommentThread, type Comment, type CommentAuthor } from "@/registry/collaboration/comment-thread";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL CommentThread in one
 * representative populated state — a single root comment (with reactions + an
 * attachment) and 2 replies, one unread. No bottom composer, no demo control
 * panel (Add comment / Fail next / Retry / Reset), no pending/failed dumps.
 */

const MIN = 60_000;
const HOUR = 3_600_000;
const T0 = 1_800_000_000_000; // fixed reference instant

const ME: CommentAuthor = { id: "you", name: "You", role: "Reviewer" };

const PEOPLE: CommentAuthor[] = [
  ME,
  { id: "mira", name: "Mira Delacroix", role: "Product" },
  { id: "devon", name: "Devon Achebe", role: "Design" },
  { id: "kai", name: "Kai Ferreira", role: "Engineering" },
];

/* Clearly fictional demo — a launch-review discussion for an imaginary product. */
const COMMENTS: Comment[] = [
  {
    id: "c-root",
    author: PEOPLE[1],
    body: "Launch review for Aurora 2.0 is open. Flagging the hero banner and the pricing table — @Devon can you take the visuals?",
    createdAt: T0 - 3 * HOUR,
    mentions: ["devon"],
    reactions: [
      { emoji: "🚀", count: 3, reactedByMe: false, label: "rocket" },
      { emoji: "👀", count: 1, reactedByMe: true, label: "eyes" },
    ],
    attachments: [{ id: "att1", name: "aurora-hero-v4.fig", meta: "Figma · 2.1 MB", href: "#" }],
    replies: [
      {
        id: "c-r1",
        author: PEOPLE[2],
        body: "On it. The hero contrast passes AA now, but the CTA still feels light against the gradient.",
        createdAt: T0 - 2 * HOUR - 20 * MIN,
        parentId: "c-root",
        editedAt: T0 - 2 * HOUR - 10 * MIN,
        reactions: [{ emoji: "👍", count: 2, reactedByMe: false, label: "thumbs up" }],
      },
      {
        id: "c-r2",
        author: PEOPLE[3],
        body: "Deploy of the pricing table is green on staging. @You mind a final pass before we tag the release?",
        createdAt: T0 - 4 * MIN,
        parentId: "c-root",
        mentions: ["you"],
      },
    ],
  },
];

function formatTimestamp(value: Comment["createdAt"]): string {
  const ms = typeof value === "number" ? value : new Date(value).getTime();
  const diff = Math.max(0, T0 - ms);
  const m = Math.round(diff / MIN);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function CommentThreadCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <CommentThread
        comments={COMMENTS}
        currentUser={ME}
        mentionable={PEOPLE}
        unreadAfter={T0 - 10 * MIN}
        formatTimestamp={formatTimestamp}
        label="Review discussion"
        maxHeight={420}
      />
    </div>
  );
}

export default CommentThreadCatalogPreview;
