"use client";

import * as React from "react";

import {
  TaskDependencyMap,
  type Task,
  type TaskGroup,
} from "@/registry/productivity/task-dependency-map";

/**
 * Compact catalog adapter (docs/55). Renders the REAL TaskDependencyMap on a
 * readable subset — six tasks across two lanes — with one task selected so its
 * dependency edges and detail panel read clearly. No demo control bar and no
 * edit menus (add-dependency / move handlers are omitted to stay calm).
 * Deterministic, clearly fictional launch-plan data.
 */

const GROUPS: TaskGroup[] = [
  { id: "design", name: "Design" },
  { id: "engineering", name: "Engineering" },
];

const TASKS: Task[] = [
  { id: "brief", title: "Product brief", status: "completed", group: "design", dependencyIds: [], milestone: true },
  { id: "research", title: "User research", status: "completed", group: "design", dependencyIds: ["brief"] },
  { id: "wires", title: "Wireframes", status: "active", group: "design", dependencyIds: ["research"], progress: 0.6, assignee: "Priya" },
  { id: "api", title: "Public API", status: "active", group: "engineering", dependencyIds: ["brief"], priority: "high", assignee: "Marco" },
  { id: "app", title: "App build", status: "blocked", group: "engineering", dependencyIds: ["wires", "api"], blockedReason: "Waiting on wireframe sign-off." },
  { id: "qa", title: "QA pass", status: "planned", group: "engineering", dependencyIds: ["app"], priority: "urgent" },
];

export function TaskDependencyMapCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[760px]">
      <TaskDependencyMap
        tasks={TASKS}
        groups={GROUPS}
        defaultSelectedTaskId="app"
        label="Product launch dependency map"
      />
    </div>
  );
}

export default TaskDependencyMapCatalogPreview;
