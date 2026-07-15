"use client";

import * as React from "react";

import { ThreadExpansion, type ThreadNode } from "@/registry/communication/thread-expansion";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL ThreadExpansion over a
 * small, representative expanded tree — one root with two replies (one carrying a
 * nested, unread reply) and one selected path shown as a breadcrumb. No demo
 * control panel (Expand branch / Mark unread / Simulate loading / Fail next / Reset).
 * `formatTimestamp` is fixed so timestamps are deterministic.
 */

const MIN = 60_000;
const HOUR = 3_600_000;
const T0 = 1_800_000_000_000; // fixed reference instant

const P = {
  lena: { id: "lena", name: "Lena Ortiz", role: "Design lead" },
  amara: { id: "amara", name: "Amara Cole", role: "Design" },
  ravi: { id: "ravi", name: "Ravi Nair", role: "Engineering" },
  theo: { id: "theo", name: "Theo Bright", role: "Product" },
} as const;

/* Clearly fictional demo — a product-design critique thread. No real people. */
const NODES: ThreadNode[] = [
  {
    id: "n1",
    author: P.lena,
    body: "Kicking off the Board canvas redesign critique. Three open questions: the zoom control, node grouping, and the empty state.",
    timestamp: T0 - 5 * HOUR,
    replyCount: 2,
    unreadCount: 1,
    children: [
      {
        id: "n1-1",
        author: P.amara,
        body: "For zoom I leaned toward a floating pill bottom-right, so it never collides with the left rail.",
        timestamp: T0 - 4 * HOUR - 30 * MIN,
        replyCount: 1,
        unreadCount: 1,
        children: [
          {
            id: "n1-1-1",
            author: P.ravi,
            body: "Works technically — the canvas transform is decoupled from the rail. Keyboard +/- should mirror it.",
            timestamp: T0 - 25 * MIN,
            unread: true,
            unreadCount: 1,
          },
        ],
      },
      {
        id: "n1-2",
        author: P.theo,
        body: "Pill is fine. Let's not add a percentage readout yet — scope creep for v1.",
        timestamp: T0 - 3 * HOUR - 40 * MIN,
        resolved: true,
      },
    ],
  },
];

function formatTimestamp(value: ThreadNode["timestamp"]): string {
  const ms = typeof value === "number" ? value : new Date(value).getTime();
  const diff = Math.max(0, T0 - ms);
  const m = Math.round(diff / MIN);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function ThreadExpansionCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <ThreadExpansion
        nodes={NODES}
        selectedId="n1-1"
        expandedIds={["n1", "n1-1"]}
        collapseResolved
        formatTimestamp={formatTimestamp}
        label="Critique thread"
        maxHeight={420}
      />
    </div>
  );
}

export default ThreadExpansionCatalogPreview;
