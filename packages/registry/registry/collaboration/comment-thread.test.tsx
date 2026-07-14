import * as React from "react";
import { render, cleanup, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CommentThread, type Comment, type CommentAuthor } from "./comment-thread";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const T = 1_800_000_000_000; // fixed epoch — deterministic, no Date.now() in fixtures
const me: CommentAuthor = { id: "me", name: "You Reviewer" };
const mira: CommentAuthor = { id: "mira", name: "Mira Delacroix", role: "PM" };

function baseComments(): Comment[] {
  return [
    {
      id: "c1",
      author: mira,
      body: "Is the launch banner ready for review?",
      createdAt: T - 3_600_000,
      reactions: [{ emoji: "👍", count: 2, reactedByMe: false, label: "thumbs up" }],
      replies: [{ id: "c1r1", author: me, body: "Almost — one nit on spacing.", createdAt: T - 1_800_000, parentId: "c1" }],
    },
  ];
}

describe("CommentThread", () => {
  it("fires onAddComment with the composed draft", async () => {
    const user = userEvent.setup();
    const onAddComment = vi.fn();
    render(<CommentThread comments={baseComments()} currentUser={me} onAddComment={onAddComment} />);

    const composer = screen.getByLabelText("Add a comment…");
    await user.click(composer);
    await user.type(composer, "Looks solid, shipping it.");
    await user.keyboard("{Enter}");

    expect(onAddComment).toHaveBeenCalledTimes(1);
    expect(onAddComment.mock.calls[0][0]).toMatchObject({ body: "Looks solid, shipping it." });
  });

  it("fires onReply carrying the parent id", async () => {
    const user = userEvent.setup();
    const onReply = vi.fn();
    render(<CommentThread comments={baseComments()} currentUser={me} onReply={onReply} />);

    await user.click(screen.getAllByRole("button", { name: "Reply" })[0]);
    const replyBox = await screen.findByLabelText(/reply to mira/i);
    await user.type(replyBox, "Fixed the spacing.");
    await user.keyboard("{Enter}");

    expect(onReply).toHaveBeenCalledTimes(1);
    expect(onReply.mock.calls[0][0]).toMatchObject({ body: "Fixed the spacing.", parentId: "c1" });
  });

  it("shows an optimistic pending state that resolves to sent", async () => {
    const user = userEvent.setup();
    let resolveSend!: () => void;
    const onAddComment = vi.fn(() => new Promise<void>((res) => (resolveSend = res)));
    render(<CommentThread comments={baseComments()} currentUser={me} onAddComment={onAddComment} />);

    const composer = screen.getByLabelText("Add a comment…");
    await user.type(composer, "Deploying now.");
    await user.keyboard("{Enter}");

    // Optimistic comment appears immediately in a pending state.
    expect(screen.getByText("Deploying now.")).toBeTruthy();
    expect(screen.getByText("Sending…")).toBeTruthy();

    resolveSend();
    await waitFor(() => expect(screen.queryByText("Sending…")).toBeNull());
    // The comment remains — now sent, no longer pending.
    expect(screen.getByText("Deploying now.")).toBeTruthy();
  });

  it("surfaces Retry on a failed send and fires onRetry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onAddComment = vi.fn(() => Promise.reject(new Error("network")));
    render(<CommentThread comments={baseComments()} currentUser={me} onAddComment={onAddComment} onRetry={onRetry} />);

    const composer = screen.getByLabelText("Add a comment…");
    await user.type(composer, "This will fail.");
    await user.keyboard("{Enter}");

    const retry = await screen.findByRole("button", { name: /retry/i });
    expect(screen.getByText("Failed to send")).toBeTruthy();
    await user.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry.mock.calls[0][0]).toMatchObject({ body: "This will fail." });
  });

  it("fires onResolve then onReopen as the app toggles resolved", async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn();
    const onReopen = vi.fn();
    function Host() {
      const [comments, setComments] = React.useState<Comment[]>(() => baseComments());
      return (
        <CommentThread
          comments={comments}
          currentUser={me}
          onResolve={(c) => {
            onResolve(c);
            setComments((prev) => prev.map((x) => (x.id === c.id ? { ...x, resolved: true } : x)));
          }}
          onReopen={(c) => {
            onReopen(c);
            setComments((prev) => prev.map((x) => (x.id === c.id ? { ...x, resolved: false } : x)));
          }}
        />
      );
    }
    render(<Host />);

    await user.click(screen.getByRole("button", { name: "Resolve" }));
    expect(onResolve).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Resolved")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Reopen" }));
    expect(onReopen).toHaveBeenCalledTimes(1);
  });

  it("nests a reply under its parent with a labelled reply relationship, and has no axe violations", async () => {
    const { container } = render(<CommentThread comments={baseComments()} currentUser={me} onReply={vi.fn()} onAddComment={vi.fn()} />);
    const replies = screen.getByRole("list", { name: /replies to mira/i });
    expect(within(replies).getByText("Almost — one nit on spacing.")).toBeTruthy();
    // reaction count is conveyed to assistive tech, not by the glyph alone
    expect(screen.getByText(/2 thumbs up reactions/i)).toBeTruthy();
    await noViolations(container);
  });

  it("preserves focus in the composer across an optimistic update", async () => {
    const user = userEvent.setup();
    let resolveSend!: () => void;
    const onAddComment = vi.fn(() => new Promise<void>((res) => (resolveSend = res)));
    render(<CommentThread comments={baseComments()} currentUser={me} onAddComment={onAddComment} />);

    const composer = screen.getByLabelText("Add a comment…") as HTMLTextAreaElement;
    await user.click(composer);
    await user.type(composer, "Keep my focus.");
    await user.keyboard("{Enter}");

    expect(document.activeElement).toBe(composer);
    resolveSend();
    await waitFor(() => expect(screen.queryByText(/sending/i)).toBeNull());
    // Focus is not stolen by the pending → sent transition.
    expect(document.activeElement).toBe(composer);
  });
});
