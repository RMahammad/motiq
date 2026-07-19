import * as React from "react";
import { render, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ThreadExpansion, type ThreadNode } from "./thread-expansion";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const MIN = 60_000;
const HOUR = 3_600_000;
const T0 = 1_800_000_000_000; // fixed epoch — deterministic, no hydration drift

const NODES: ThreadNode[] = [
  {
    id: "r1",
    author: { id: "ada", name: "Ada Root" },
    body: "Top of the thread.",
    timestamp: T0 - 2 * HOUR,
    replyCount: 2,
    unreadCount: 1,
    children: [
      { id: "r1c1", author: { id: "bo", name: "Bo Child" }, body: "A nested unread reply.", timestamp: T0 - 30 * MIN, unread: true, unreadCount: 1 },
      { id: "r1c2", author: { id: "cy", name: "Cy Gone" }, timestamp: T0 - 20 * MIN, deleted: true },
    ],
  },
  {
    id: "r2",
    author: { id: "di", name: "Di Lazy" },
    body: "Branch with unloaded replies.",
    timestamp: T0 - 10 * MIN,
    replyCount: 2, // no children loaded → lazy "Load more"
  },
];

describe("ThreadExpansion", () => {
  it("expands and collapses a branch via keyboard, toggling aria-expanded", async () => {
    const user = userEvent.setup();
    render(<ThreadExpansion nodes={NODES} defaultExpandDepth={0} />);

    const root = screen.getByRole("treeitem", { name: /Ada Root/i });
    expect(root.getAttribute("aria-expanded")).toBe("false");
    // Collapsed: the nested reply is not rendered.
    expect(screen.queryByRole("treeitem", { name: /Bo Child/i })).toBeNull();

    root.focus();
    await user.keyboard("{ArrowRight}"); // expand
    expect(root.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("treeitem", { name: /Bo Child/i })).toBeTruthy();

    await user.keyboard("{ArrowLeft}"); // collapse
    expect(root.getAttribute("aria-expanded")).toBe("false");
  });

  it("jumps to the next unread branch, expanding its path and selecting it", async () => {
    const user = userEvent.setup();
    const onNavigateUnread = vi.fn();
    render(<ThreadExpansion nodes={NODES} defaultExpandDepth={0} onNavigateUnread={onNavigateUnread} />);

    // Unread reply is nested and initially hidden.
    expect(screen.queryByRole("treeitem", { name: /Bo Child/i })).toBeNull();
    await user.click(screen.getByRole("button", { name: /next unread/i }));

    const target = await screen.findByRole("treeitem", { name: /Bo Child/i });
    expect(target.getAttribute("aria-selected")).toBe("true");
    expect(onNavigateUnread).toHaveBeenCalledWith(expect.objectContaining({ id: "r1c1" }));
  });

  it("preserves focus by moving it onto the branch reached by navigation", async () => {
    const user = userEvent.setup();
    render(<ThreadExpansion nodes={NODES} defaultExpandDepth={0} />);

    await user.click(screen.getByRole("button", { name: /next unread/i }));
    const target = await screen.findByRole("treeitem", { name: /Bo Child/i });
    // Focus follows the jump (roving tabindex) rather than staying on the button.
    await waitFor(() => expect(document.activeElement).toBe(target));
    expect(target.getAttribute("tabindex")).toBe("0");

    // "Go to parent" climbs the hierarchy and moves focus with it.
    await user.click(screen.getByRole("button", { name: /go to parent/i }));
    const parent = await screen.findByRole("treeitem", { name: /Ada Root/i });
    await waitFor(() => expect(document.activeElement).toBe(parent));
  });

  it("renders a placeholder for a deleted reply without dropping the branch", () => {
    render(<ThreadExpansion nodes={NODES} expandedIds={["r1"]} />);
    expect(screen.getByText(/This reply was removed/i)).toBeTruthy();
    // The live siblings around it still render.
    expect(screen.getByRole("treeitem", { name: /Bo Child/i })).toBeTruthy();
  });

  it("shows load-more, loading, and error branch states with a working retry", async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    const onRetryLoad = vi.fn();

    // Load-more row for a branch whose replyCount exceeds loaded children.
    const { unmount } = render(<ThreadExpansion nodes={NODES} expandedIds={["r2"]} onLoadMore={onLoadMore} />);
    const moreRow = screen.getByRole("treeitem", { name: /Load 2 replies/i });
    await user.click(moreRow);
    expect(onLoadMore).toHaveBeenCalledWith(expect.objectContaining({ id: "r2" }));
    unmount();

    // App-owned loading state.
    const loading = render(<ThreadExpansion nodes={NODES} expandedIds={["r2"]} loadingId="r2" />);
    expect(screen.getByText(/Loading replies/i)).toBeTruthy();
    loading.unmount();

    // App-owned error state + retry.
    render(
      <ThreadExpansion nodes={NODES} expandedIds={["r2"]} errorId="r2" errorMessage="Couldn't load." onRetryLoad={onRetryLoad} />,
    );
    expect(screen.getByText(/Couldn't load\./i)).toBeTruthy();
    await user.click(screen.getByRole("treeitem", { name: /Retry/i }));
    expect(onRetryLoad).toHaveBeenCalledWith(expect.objectContaining({ id: "r2" }));
  });

  it("has no axe violations across expanded branches and status rows", async () => {
    const { container } = render(
      <ThreadExpansion
        nodes={NODES}
        selectedId="r1c1"
        expandedIds={["r1", "r2"]}
        onLoadMore={() => {}}
        label="Critique thread"
      />,
    );
    await noViolations(container);
  });
});
