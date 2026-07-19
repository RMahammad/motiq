"use client";

import * as React from "react";

import {
  CommentThread,
  type Comment,
  type CommentAuthor,
} from "@/registry/collaboration/comment-thread";

/* Clearly fictional demo — a launch-review discussion for an imaginary product.
 * No real people, teams, or documents. Fixed ids + timestamps so there is no
 * SSR/CSR hydration drift; live ids/timestamps are only minted inside handlers.
 * The app (this preview) owns the comment data + permissions; the component owns
 * the optimistic send/retry UX internally. */

const MIN = 60_000;
const HOUR = 3_600_000;
const T0 = 1_800_000_000_000; // fixed epoch anchoring the demo timeline

const ME: CommentAuthor = { id: "you", name: "You", role: "Reviewer" };

const PEOPLE: CommentAuthor[] = [
  ME,
  { id: "mira", name: "Mira Delacroix", role: "Product" },
  { id: "devon", name: "Devon Achebe", role: "Design" },
  { id: "kai", name: "Kai Ferreira", role: "Engineering" },
  { id: "rosa", name: "Rosa Whitfield", role: "Marketing" },
];

function seed(): Comment[] {
  return [
    {
      id: "c-root",
      author: PEOPLE[1],
      body: "Launch review for Aurora 2.0 is open. Flagging the hero banner and the pricing table - @Devon can you take the visuals?",
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
          createdAt: T0 - 40 * MIN,
          parentId: "c-root",
          mentions: ["you"],
        },
        {
          id: "c-r3-pending",
          author: ME,
          body: "Pulling it up now - will confirm the CTA fix and pricing rows.",
          createdAt: T0 - 4 * MIN,
          parentId: "c-root",
          status: "pending",
        },
      ],
    },
    {
      id: "c-fail",
      author: ME,
      body: "Left an annotation on row 3 of the pricing table - the annual toggle label is truncating on mobile.",
      createdAt: T0 - 2 * MIN,
      status: "failed",
    },
  ];
}

const control =
  "rounded-lg px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

export function CommentThreadPreview() {
  const [comments, setComments] = React.useState<Comment[]>(seed);
  const [failNext, setFailNext] = React.useState(false);
  const idRef = React.useRef(0);

  const nextId = () => {
    idRef.current += 1;
    return `demo-${idRef.current}`;
  };

  // Simulate the app's async persistence. Resolves (or rejects when "Fail next"
  // is armed) so the component's internal optimistic layer can flip pending →
  // sent / failed. On success we write the confirmed comment into our data so
  // the temporary optimistic entry is reconciled away by id.
  const persist = (draft: { tempId: string; body: string; parentId?: string; mentions: string[]; editId?: string }) =>
    new Promise<Comment>((resolve, reject) => {
      window.setTimeout(() => {
        if (failNext) {
          setFailNext(false);
          reject(new Error("Simulated network error"));
          return;
        }
        const confirmed: Comment = {
          id: nextId(),
          author: ME,
          body: draft.body,
          createdAt: Date.now(),
          parentId: draft.parentId,
          mentions: draft.mentions,
          status: "normal",
        };
        if (draft.editId) {
          setComments((prev) => editById(prev, draft.editId!, draft.body, Date.now()));
        } else if (draft.parentId) {
          setComments((prev) => addReply(prev, draft.parentId!, confirmed));
        } else {
          setComments((prev) => [...prev, confirmed]);
        }
        resolve(confirmed);
      }, 650);
    });

  const react = (comment: Comment, emoji: string, active: boolean) => {
    setComments((prev) => toggleReaction(prev, comment.id, emoji, active));
  };

  const resolveThread = (comment: Comment) =>
    setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, resolved: true } : c)));
  const reopenThread = (comment: Comment) =>
    setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, resolved: false } : c)));
  const del = (comment: Comment) =>
    setComments((prev) => setStatusById(prev, comment.id, "deleted"));

  // Demo-only control shims (drive the same paths the real UI does).
  const addSample = () => {
    void persist({ tempId: `t-${nextId()}`, body: "Approved from my side - ready to ship. 🚀", mentions: [] });
  };
  const addSampleReply = () => {
    void persist({ tempId: `t-${nextId()}`, body: "Confirmed the CTA fix looks good on desktop and mobile.", parentId: "c-root", mentions: [] });
  };
  const retryFailed = () => {
    setComments((prev) => setStatusById(prev, "c-fail", "pending"));
    window.setTimeout(() => setComments((prev) => setStatusById(prev, "c-fail", "normal")), 650);
  };
  const addReactionSample = () => react({ id: "c-root" } as Comment, "🎉", true);
  const reset = () => {
    setComments(seed());
    setFailNext(false);
    idRef.current = 0;
  };

  return (
    <div className="flex w-full max-w-[680px] flex-col gap-4">
      {/* review workspace shell */}
      <div className="overflow-hidden rounded-2xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--color-border)] px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-fg)]">
            <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            Aurora 2.0 · Launch review
          </span>
          <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
            Fictional demo data
          </span>
          <span className="ml-auto text-[12px] text-[var(--color-muted)]">Draft · in review</span>
        </div>

        <div className="p-3">
          <CommentThread
            comments={comments}
            currentUser={ME}
            mentionable={PEOPLE}
            unreadAfter={T0 - 10 * MIN}
            reactionChoices={["👍", "🎉", "🚀", "👀", "❤️", "😄"]}
            collapseRepliesAfter={4}
            maxHeight={460}
            label="Review discussion"
            onAddComment={persist}
            onReply={persist}
            onEdit={persist}
            onRetry={() => {}}
            onReact={react}
            onResolve={resolveThread}
            onReopen={reopenThread}
            onDelete={del}
            onCopyLink={() => {}}
          />
        </div>
      </div>

      {/* working controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={control} onClick={addSample}>
          Add comment
        </button>
        <button type="button" className={control} onClick={addSampleReply}>
          Add reply
        </button>
        <button type="button" className={control} aria-pressed={failNext} onClick={() => setFailNext((f) => !f)}>
          {failNext ? "Fail next: on" : "Fail next: off"}
        </button>
        <button type="button" className={control} onClick={retryFailed}>
          Retry
        </button>
        <button type="button" className={control} onClick={() => resolveThread({ id: "c-root" } as Comment)}>
          Resolve thread
        </button>
        <button type="button" className={control} onClick={addReactionSample}>
          Add reaction
        </button>
        <button type="button" className={control} onClick={reset}>
          Reset
        </button>
        <span className="ml-auto text-[12px] text-[var(--color-muted)]">Type @ to mention · ↵ to send</span>
      </div>
    </div>
  );
}

/* -- immutable tree helpers (app-owned data) ----------------------------- */

function addReply(comments: Comment[], parentId: string, reply: Comment): Comment[] {
  return comments.map((c) => {
    if (c.id === parentId) return { ...c, replies: [...(c.replies ?? []), reply] };
    if (c.replies?.length) return { ...c, replies: addReply(c.replies, parentId, reply) };
    return c;
  });
}

function editById(comments: Comment[], id: string, body: string, editedAt: number): Comment[] {
  return comments.map((c) => {
    if (c.id === id) return { ...c, body, editedAt, status: "edited" as const };
    if (c.replies?.length) return { ...c, replies: editById(c.replies, id, body, editedAt) };
    return c;
  });
}

function setStatusById(comments: Comment[], id: string, status: Comment["status"]): Comment[] {
  return comments.map((c) => {
    if (c.id === id) return { ...c, status };
    if (c.replies?.length) return { ...c, replies: setStatusById(c.replies, id, status) };
    return c;
  });
}

function toggleReaction(comments: Comment[], id: string, emoji: string, active: boolean): Comment[] {
  return comments.map((c) => {
    if (c.id === id) {
      const existing = (c.reactions ?? []).find((r) => r.emoji === emoji);
      let reactions = c.reactions ?? [];
      if (existing) {
        reactions = reactions
          .map((r) =>
            r.emoji === emoji
              ? { ...r, reactedByMe: active, count: Math.max(0, r.count + (active ? 1 : -1)) }
              : r,
          )
          .filter((r) => r.count > 0);
      } else if (active) {
        reactions = [...reactions, { emoji, count: 1, reactedByMe: true }];
      }
      return { ...c, reactions };
    }
    if (c.replies?.length) return { ...c, replies: toggleReaction(c.replies, id, emoji, active) };
    return c;
  });
}

export default CommentThreadPreview;
