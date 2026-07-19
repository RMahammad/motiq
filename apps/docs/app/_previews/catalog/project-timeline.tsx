"use client";

import * as React from "react";

import {
  ProjectTimeline,
  type TimelineItem,
  type TimelineGroup,
} from "@/registry/productivity/project-timeline";

/**
 * Compact catalog adapter (docs/55). Renders the REAL ProjectTimeline on a
 * readable subset — six items across two phases — in timeline view with the
 * fixed "Today" marker, one item selected so the detail panel and its
 * dependency connectors read clearly. No demo control bar and no reschedule
 * controls (move/resize handlers are omitted). Deterministic ISO-date data.
 */

const TODAY = "2026-07-14";

const GROUPS: TimelineGroup[] = [
  { id: "discovery", name: "Discovery" },
  { id: "build", name: "Build" },
];

const ITEMS: TimelineItem[] = [
  { id: "kickoff", title: "Kickoff", type: "milestone", group: "discovery", startDate: "2026-05-04", endDate: "2026-05-04", status: "completed", milestone: true },
  { id: "research", title: "User research", type: "task", group: "discovery", startDate: "2026-05-05", endDate: "2026-05-22", status: "completed", progress: 1, assignee: "Priya" },
  { id: "spec", title: "Product spec", type: "phase", group: "discovery", startDate: "2026-05-18", endDate: "2026-06-12", status: "completed", progress: 1, dependencyIds: ["research"] },
  { id: "design", title: "Design system", type: "phase", group: "build", startDate: "2026-06-08", endDate: "2026-07-10", status: "active", progress: 0.75, dependencyIds: ["spec"], assignee: "Marco", priority: "high" },
  { id: "api", title: "Platform API", type: "phase", group: "build", startDate: "2026-06-15", endDate: "2026-08-01", status: "active", progress: 0.4, dependencyIds: ["spec"] },
  { id: "app", title: "App build", type: "phase", group: "build", startDate: "2026-07-06", endDate: "2026-08-20", status: "blocked", dependencyIds: ["design", "api"], metadata: { note: "Waiting on design-system sign-off." } },
];

export function ProjectTimelineCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[760px]">
      <ProjectTimeline
        items={ITEMS}
        groups={GROUPS}
        today={TODAY}
        defaultScale="week"
        defaultSelectedItemId="app"
        label="Northwind launch roadmap"
      />
    </div>
  );
}

export default ProjectTimelineCatalogPreview;
