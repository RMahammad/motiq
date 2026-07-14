"use client";

import * as React from "react";

import {
  ThreadExpansion,
  type ThreadNode,
} from "@/registry/communication/thread-expansion";

/* Clearly fictional demo — a product-design critique thread for an imaginary
 * app ("Nimbus · Board canvas redesign"). No real people or documents. Fixed
 * ids + timestamps so there is no SSR/CSR hydration drift; live changes are
 * driven only by the controls below. The app (this preview) owns the node tree,
 * unread accounting, resolution, and lazy reply loading; the component owns
 * navigation, expansion, and focus. */

const MIN = 60_000;
const HOUR = 3_600_000;
const T0 = 1_800_000_000_000; // fixed epoch anchoring the demo timeline

const P = {
  lena: { id: "lena", name: "Lena Ortiz", role: "Design lead" },
  theo: { id: "theo", name: "Theo Bright", role: "Product" },
  amara: { id: "amara", name: "Amara Cole", role: "Design" },
  ravi: { id: "ravi", name: "Ravi Nair", role: "Engineering" },
  jun: { id: "jun", name: "Jun Park", role: "Research" },
  you: { id: "you", name: "You", role: "Reviewer" },
} as const;

function seed(): ThreadNode[] {
  return [
    {
      id: "n1",
      author: P.lena,
      body: "Kicking off the Board canvas redesign critique. Three open questions: the zoom control, the node grouping affordance, and the empty state.",
      timestamp: T0 - 5 * HOUR,
      replyCount: 3,
      unreadCount: 2,
      children: [
        {
          id: "n1-1",
          author: P.amara,
          body: "For zoom I leaned toward a floating pill bottom-right, so it never collides with the left rail.",
          timestamp: T0 - 4 * HOUR - 30 * MIN,
          replyCount: 2,
          unreadCount: 1,
          children: [
            {
              id: "n1-1-1",
              author: P.ravi,
              body: "That works technically — the canvas transform is decoupled from the rail. One ask: keyboard +/- should mirror it.",
              timestamp: T0 - 4 * HOUR,
              replyCount: 1,
              unreadCount: 1,
              children: [
                {
                  id: "n1-1-1-1",
                  author: P.jun,
                  body: "Usability sessions back this up — 4 of 6 participants reached for the keyboard first on dense boards.",
                  timestamp: T0 - 25 * MIN,
                  unread: true,
                  unreadCount: 1,
                },
              ],
            },
            {
              id: "n1-1-2",
              author: P.theo,
              body: "Pill is fine. Let's not add a percentage readout yet — scope creep for v1.",
              timestamp: T0 - 3 * HOUR - 40 * MIN,
              resolved: true,
            },
          ],
        },
        {
          id: "n1-2",
          author: P.jun,
          // replyCount (4) exceeds the loaded children (0) → a "Load more" row
          // appears when this branch is expanded; the control below loads them.
          body: "Grouping affordance has the most research history — I pulled the older explorations into this branch.",
          timestamp: T0 - 3 * HOUR,
          replyCount: 4,
        },
        {
          id: "n1-3",
          author: P.amara,
          body: "Empty state copy draft is in the doc. Superseded by Lena's newer version.",
          timestamp: T0 - 2 * HOUR,
          deleted: true,
        },
      ],
    },
    {
      id: "n2",
      author: P.theo,
      body: "Separate thread: do we ship the redesign behind a flag or straight to 20% rollout?",
      timestamp: T0 - 90 * MIN,
      replyCount: 1,
      unreadCount: 1,
      children: [
        {
          id: "n2-1",
          author: P.ravi,
          body: "Flag first. The canvas transform touches the render loop and I want a kill switch.",
          timestamp: T0 - 15 * MIN,
          unread: true,
          unreadCount: 1,
        },
      ],
    },
  ];
}

// The lazily-loaded replies for the "grouping" branch (n1-2).
function lazyReplies(): ThreadNode[] {
  return [
    { id: "n1-2-a", parentId: "n1-2", author: P.lena, body: "Explored a marquee-select + right-click group.", timestamp: T0 - 2 * HOUR - 50 * MIN },
    { id: "n1-2-b", parentId: "n1-2", author: P.amara, body: "And a persistent 'frames' primitive like the whiteboard tools use.", timestamp: T0 - 2 * HOUR - 40 * MIN },
    { id: "n1-2-c", parentId: "n1-2", author: P.jun, body: "Frames tested better for recall a week later.", timestamp: T0 - 2 * HOUR - 20 * MIN, unread: true, unreadCount: 1 },
    { id: "n1-2-d", parentId: "n1-2", author: P.ravi, body: "Frames are also cheaper to render — they're just a container node.", timestamp: T0 - 2 * HOUR },
  ];
}

const control =
  "rounded-lg px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

/* -- immutable tree helpers (app-owned data) ----------------------------- */

function mapTree(nodes: ThreadNode[], fn: (n: ThreadNode) => ThreadNode): ThreadNode[] {
  return nodes.map((n) => {
    const mapped = fn(n);
    return mapped.children?.length ? { ...mapped, children: mapTree(mapped.children, fn) } : mapped;
  });
}

function addChildren(nodes: ThreadNode[], parentId: string, kids: ThreadNode[]): ThreadNode[] {
  return mapTree(nodes, (n) =>
    n.id === parentId ? { ...n, children: [...(n.children ?? []), ...kids] } : n,
  );
}

export function ThreadExpansionPreview() {
  const [nodes, setNodes] = React.useState<ThreadNode[]>(seed);
  const [selectedId, setSelectedId] = React.useState<string>("n1-1-1");
  const [expandedIds, setExpandedIds] = React.useState<string[]>(["n1", "n1-1", "n1-1-1", "n2"]);
  const [loadingId, setLoadingId] = React.useState<string | undefined>();
  const [errorId, setErrorId] = React.useState<string | undefined>();
  const [failNext, setFailNext] = React.useState(false);

  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const ensureExpanded = (ids: string[]) =>
    setExpandedIds((prev) => Array.from(new Set([...prev, ...ids])));

  // App-owned lazy load for the grouping branch (n1-2).
  const loadMore = (node: ThreadNode) => {
    ensureExpanded([node.id]);
    setErrorId(undefined);
    setLoadingId(node.id);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setLoadingId(undefined);
      if (failNext) {
        setFailNext(false);
        setErrorId(node.id);
        return;
      }
      if (node.id === "n1-2") {
        setNodes((prev) =>
          mapTree(addChildren(prev, "n1-2", lazyReplies()), (n) =>
            n.id === "n1-2" ? { ...n, replyCount: 4 } : n,
          ),
        );
      }
    }, 700);
  };

  const retryLoad = (node: ThreadNode) => {
    setErrorId(undefined);
    loadMore(node);
  };

  // Demo controls — drive the same paths the real UI does.
  const expandBranch = () => ensureExpanded(["n1", "n1-1", "n1-1-1", "n1-1-1-1"]);
  const collapseBranch = () =>
    setExpandedIds((prev) => prev.filter((id) => id !== "n1-1"));
  const addNestedReply = () => {
    const id = "n1-1-1-x";
    setNodes((prev) =>
      addChildren(prev, "n1-1-1", [
        { id, parentId: "n1-1-1", author: P.you, body: "Agreed — I'll spec the keyboard zoom mapping alongside the pill.", timestamp: T0, unread: true, unreadCount: 1 },
      ]),
    );
    setNodes((prev) => mapTree(prev, (n) => (n.id === "n1-1-1" ? { ...n, replyCount: (n.replyCount ?? 0) + 1 } : n)));
    ensureExpanded(["n1", "n1-1", "n1-1-1"]);
    setSelectedId(id);
  };
  const markUnread = () =>
    setNodes((prev) => mapTree(prev, (n) => (n.id === "n1-1-2" ? { ...n, unread: true, unreadCount: 1 } : n)));
  const resolveBranch = () =>
    setNodes((prev) => mapTree(prev, (n) => (n.id === "n2" ? { ...n, resolved: true } : n)));

  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    setNodes(seed());
    setSelectedId("n1-1-1");
    setExpandedIds(["n1", "n1-1", "n1-1-1", "n2"]);
    setLoadingId(undefined);
    setErrorId(undefined);
    setFailNext(false);
  };

  return (
    <div className="flex w-full max-w-[680px] flex-col gap-4">
      {/* discussion workspace shell */}
      <div className="overflow-hidden rounded-2xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--color-border)] px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-fg)]">
            <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            Nimbus · Board canvas redesign
          </span>
          <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
            Fictional demo data
          </span>
          <span className="ml-auto text-[12px] text-[var(--color-muted)]">Design critique</span>
        </div>

        <div className="p-3">
          <ThreadExpansion
            nodes={nodes}
            selectedId={selectedId}
            onSelect={(n) => setSelectedId(n.id)}
            expandedIds={expandedIds}
            onExpandedChange={setExpandedIds}
            onLoadMore={loadMore}
            loadingId={loadingId}
            errorId={errorId}
            errorMessage="Couldn't load older explorations."
            onRetryLoad={retryLoad}
            collapseResolved
            maxHeight={440}
            label="Critique thread"
          />
        </div>
      </div>

      {/* working controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={control} onClick={expandBranch}>
          Expand branch
        </button>
        <button type="button" className={control} onClick={collapseBranch}>
          Collapse
        </button>
        <button type="button" className={control} onClick={addNestedReply}>
          Add nested reply
        </button>
        <button type="button" className={control} onClick={markUnread}>
          Mark unread
        </button>
        <button type="button" className={control} onClick={() => loadMore({ id: "n1-2" } as ThreadNode)}>
          Simulate loading
        </button>
        <button type="button" className={control} aria-pressed={failNext} onClick={() => setFailNext((f) => !f)}>
          {failNext ? "Fail next: on" : "Fail next: off"}
        </button>
        <button type="button" className={control} onClick={() => setErrorId("n1-2")}>
          Simulate error
        </button>
        <button type="button" className={control} onClick={resolveBranch}>
          Resolve branch
        </button>
        <button type="button" className={control} onClick={reset}>
          Reset
        </button>
        <span className="ml-auto text-[12px] text-[var(--color-muted)]">↑/↓ move · →/← expand/collapse · ↵ select</span>
      </div>
    </div>
  );
}

export default ThreadExpansionPreview;
