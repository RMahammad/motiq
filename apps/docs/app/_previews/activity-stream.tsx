"use client";

import * as React from "react";

import {
  ActivityStream,
  type ActivityEvent,
  type ActivityFilters,
} from "@/registry/collaboration/activity-stream";

/* Clearly fictional demo data — no real people, teams, or documents. */

const MIN = 60_000;

// A stable reference point so the seeded timestamps read sensibly ("just now",
// "5m ago") without SSR/CSR drift.
const T0 = 1_800_000_000_000; // fixed epoch used for the demo timeline

const SEED: ActivityEvent[] = [
  {
    id: "e-1",
    type: "mentioned",
    actor: { id: "riley", name: "Riley Okafor" },
    target: "the Q3 launch review",
    preview: "@you can you sanity-check the rollout dates before we lock the plan?",
    timestamp: T0 - 2 * MIN,
    link: "#",
  },
  {
    id: "e-2",
    type: "approved",
    actor: { id: "morgan", name: "Morgan Vale" },
    target: "the launch checklist",
    metadata: { items: 12 },
    timestamp: T0 - 9 * MIN,
  },
  {
    id: "e-3",
    type: "commented",
    actor: { id: "jamie", name: "Jamie Fields" },
    target: "the onboarding guide",
    preview: "Second the callout box — makes the setup step much clearer.",
    timestamp: T0 - 24 * MIN,
  },
  // A run of edits by the same actor on the same target → collapses into a group.
  { id: "e-4a", type: "edited", actor: { id: "jamie", name: "Jamie Fields" }, target: "the onboarding guide", timestamp: T0 - 41 * MIN },
  { id: "e-4b", type: "edited", actor: { id: "jamie", name: "Jamie Fields" }, target: "the onboarding guide", timestamp: T0 - 44 * MIN },
  { id: "e-4c", type: "edited", actor: { id: "jamie", name: "Jamie Fields" }, target: "the onboarding guide", timestamp: T0 - 47 * MIN },
  { id: "e-4d", type: "edited", actor: { id: "jamie", name: "Jamie Fields" }, target: "the onboarding guide", timestamp: T0 - 52 * MIN },
  // A run of uploads → also a group.
  { id: "e-5a", type: "uploaded", actor: { id: "taylor", name: "Taylor Reyes" }, target: "Launch assets", timestamp: T0 - 70 * MIN },
  { id: "e-5b", type: "uploaded", actor: { id: "taylor", name: "Taylor Reyes" }, target: "Launch assets", timestamp: T0 - 72 * MIN },
  { id: "e-5c", type: "uploaded", actor: { id: "taylor", name: "Taylor Reyes" }, target: "Launch assets", timestamp: T0 - 74 * MIN },
  {
    id: "e-6",
    type: "assigned",
    actor: { id: "morgan", name: "Morgan Vale" },
    target: "the press kit to Riley",
    timestamp: T0 - 3 * 60 * MIN,
  },
  {
    id: "e-7",
    type: "published",
    actor: { id: "taylor", name: "Taylor Reyes" },
    target: "the changelog",
    timestamp: T0 - 27 * 60 * MIN, // yesterday
  },
  {
    id: "e-8",
    type: "joined",
    actor: { id: "noor", name: "Noor Haddad" },
    target: "the workspace",
    timestamp: T0 - 29 * 60 * MIN, // yesterday
  },
];

const LIVE: Omit<ActivityEvent, "id" | "timestamp">[] = [
  { type: "commented", actor: { id: "noor", name: "Noor Haddad" }, target: "the Q3 launch review", preview: "Dates look right to me — shipping." },
  { type: "created", actor: { id: "riley", name: "Riley Okafor" }, target: "a follow-up task" },
  { type: "approved", actor: { id: "morgan", name: "Morgan Vale" }, target: "the press kit" },
  { type: "edited", actor: { id: "taylor", name: "Taylor Reyes" }, target: "the changelog" },
];

const control =
  "rounded-lg px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

export function ActivityStreamPreview() {
  const [events, setEvents] = React.useState<ActivityEvent[]>(SEED);
  const [group, setGroup] = React.useState(true);
  const [showUnread, setShowUnread] = React.useState(true);
  const [filters, setFilters] = React.useState<ActivityFilters>({});
  const liveRef = React.useRef(0);
  const addRef = React.useRef(0);

  const addActivity = () => {
    const tmpl = LIVE[liveRef.current % LIVE.length];
    liveRef.current += 1;
    addRef.current += 1;
    const id = `live-${addRef.current}`;
    // Newer than the seed's newest so it lands at the top and reads as unread.
    setEvents((prev) => [{ ...tmpl, id, timestamp: T0 + addRef.current * MIN }, ...prev]);
  };

  const toggleComments = () => {
    setFilters((f) =>
      f.types?.length === 1 && f.types[0] === "commented" ? {} : { types: ["commented"] },
    );
  };

  const reset = () => {
    setEvents(SEED);
    setFilters({});
    setGroup(true);
    setShowUnread(true);
    liveRef.current = 0;
    addRef.current = 0;
  };

  // Unread boundary sits just under the newest seeded item, so the top of the
  // feed (and anything added live) shows as unread with a "New" divider.
  const unreadAfter = showUnread ? T0 - 5 * MIN : undefined;

  return (
    <div className="flex w-full max-w-[560px] flex-col gap-4">
      {/* collaboration workspace panel — the component dominates the card */}
      <ActivityStream
        events={events}
        collapseThreshold={group ? 3 : 0}
        unreadAfter={unreadAfter}
        filters={filters}
        onFiltersChange={setFilters}
        onEventAction={() => {}}
        label="Team activity"
        maxHeight={440}
      />

      {/* working controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={control} onClick={addActivity}>
          Add activity
        </button>
        <button type="button" className={control} aria-pressed={group} onClick={() => setGroup((g) => !g)}>
          {group ? "Grouping: on" : "Grouping: off"}
        </button>
        <button type="button" className={control} aria-pressed={showUnread} onClick={() => setShowUnread((u) => !u)}>
          {showUnread ? "Unread divider: on" : "Unread divider: off"}
        </button>
        <button
          type="button"
          className={control}
          aria-pressed={filters.types?.[0] === "commented"}
          onClick={toggleComments}
        >
          {filters.types?.[0] === "commented" ? "Showing comments" : "Filter comments"}
        </button>
        <button type="button" className={control} onClick={reset}>
          Reset
        </button>
        <span className="ml-auto text-[12px] text-[var(--color-muted)]">Demo data</span>
      </div>
    </div>
  );
}

export default ActivityStreamPreview;
