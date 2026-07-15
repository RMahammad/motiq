"use client";

import * as React from "react";

import { ActivityStream, type ActivityEvent } from "@/registry/collaboration/activity-stream";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL ActivityStream in one
 * representative populated state — 5 recent events with an unread boundary at the
 * top — no filter bar, grouping toggle, "Add activity", or reset controls. Timestamps
 * are formatted against a fixed reference instant so the card is fully deterministic.
 */

const MIN = 60_000;
const NOW = 1_800_000_000_000; // fixed reference instant for the demo timeline

/* Clearly fictional demo data — no real people, teams, or documents. */
const EVENTS: ActivityEvent[] = [
  {
    id: "e-1",
    type: "mentioned",
    actor: { id: "riley", name: "Riley Okafor" },
    target: "the Q3 launch review",
    preview: "@you can you sanity-check the rollout dates before we lock the plan?",
    timestamp: NOW - 2 * MIN,
    link: "#",
  },
  {
    id: "e-2",
    type: "approved",
    actor: { id: "morgan", name: "Morgan Vale" },
    target: "the launch checklist",
    metadata: { items: 12 },
    timestamp: NOW - 9 * MIN,
  },
  {
    id: "e-3",
    type: "commented",
    actor: { id: "jamie", name: "Jamie Fields" },
    target: "the onboarding guide",
    preview: "Second the callout box — makes the setup step much clearer.",
    timestamp: NOW - 24 * MIN,
  },
  {
    id: "e-4",
    type: "uploaded",
    actor: { id: "taylor", name: "Taylor Reyes" },
    target: "Launch assets",
    timestamp: NOW - 70 * MIN,
  },
  {
    id: "e-5",
    type: "published",
    actor: { id: "taylor", name: "Taylor Reyes" },
    target: "the changelog",
    timestamp: NOW - 27 * 60 * MIN,
  },
];

function formatTimestamp(value: ActivityEvent["timestamp"]): string {
  const ms = typeof value === "number" ? value : new Date(value).getTime();
  const diff = Math.max(0, NOW - ms);
  const m = Math.round(diff / MIN);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function ActivityStreamCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <ActivityStream
        events={EVENTS}
        collapseThreshold={0}
        showFilters={false}
        unreadAfter={NOW - 3 * MIN}
        formatTimestamp={formatTimestamp}
        label="Team activity"
        maxHeight={420}
      />
    </div>
  );
}

export default ActivityStreamCatalogPreview;
