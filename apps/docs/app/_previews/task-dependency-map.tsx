"use client";

import * as React from "react";

import {
  TaskDependencyMap,
  type Task,
  type TaskGroup,
  type TaskCycleError,
  type TaskLayoutMode,
} from "@/registry/productivity/task-dependency-map";

/* Clearly fictional demo — a made-up product-launch plan for an imaginary
 * company. The PREVIEW is the "app": it owns the tasks, their statuses, cycle
 * validation, and persistence (a simulated async move that can be made to
 * fail). The component owns only the dependency visualization + reading/editing
 * UX. Fixed ids/orders keep it deterministic (no SSR/CSR drift, no Math.random
 * / Date.now at render); new state is only produced inside handlers.
 *
 * The control buttons drive the *real* component paths — they dispatch real
 * clicks/keystrokes on the real nodes, menus, and detail buttons — so what you
 * click is what a user would do. */

const GROUPS: TaskGroup[] = [
  { id: "design", name: "Design" },
  { id: "engineering", name: "Engineering" },
  { id: "gtm", name: "Go-to-market" },
];

function seed(): Task[] {
  return [
    { id: "brief", title: "Product brief", status: "completed", group: "design", dependencyIds: [], milestone: true },
    { id: "research", title: "User research", status: "completed", group: "design", dependencyIds: ["brief"] },
    { id: "wires", title: "Wireframes", status: "active", group: "design", dependencyIds: ["research"], progress: 0.6, assignee: "Priya" },
    { id: "visual", title: "Visual design", status: "planned", group: "design", dependencyIds: ["wires"] },
    { id: "api", title: "Public API", status: "active", group: "engineering", dependencyIds: ["brief"], priority: "high", assignee: "Marco" },
    { id: "app", title: "App build", status: "blocked", group: "engineering", dependencyIds: ["wires", "api"], blockedReason: "Waiting on wireframe sign-off." },
    { id: "qa", title: "QA pass", status: "planned", group: "engineering", dependencyIds: ["app"], priority: "urgent" },
    { id: "docs", title: "Launch docs", status: "planned", group: "gtm", dependencyIds: ["api"] },
    { id: "landing", title: "Landing page", status: "planned", group: "gtm", dependencyIds: ["visual"] },
    { id: "launch", title: "Public launch", status: "planned", group: "gtm", dependencyIds: ["qa", "docs", "landing"], milestone: true, dueDate: "2026-09-01" },
  ];
}

/** The critical path the app considers most at-risk. */
const CRITICAL_PATH = ["brief", "wires", "app", "qa", "launch"];

const raf = () =>
  new Promise<void>((r) => (typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame(() => r()) : setTimeout(r, 16)));

const control =
  "rounded-lg px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)] outline-none transition-colors [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

/** App-owned cycle check: would `taskId` depending on `depId` create a cycle? */
function createsCycle(tasks: Task[], taskId: string, depId: string): boolean {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  // A cycle forms if `taskId` is already (transitively) a prerequisite of `depId`.
  const stack = [depId];
  const seen = new Set<string>();
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === taskId) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const d of byId.get(cur)?.dependencyIds ?? []) stack.push(d);
  }
  return false;
}

export function TaskDependencyMapPreview() {
  const [tasks, setTasks] = React.useState<Task[]>(seed);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>("app");
  const [layout, setLayout] = React.useState<TaskLayoutMode>("map");
  const [activePath, setActivePath] = React.useState<string[] | undefined>(undefined);
  const [cycleError, setCycleError] = React.useState<TaskCycleError | null>(null);
  const [failNext, setFailNext] = React.useState(false);
  const [note, setNote] = React.useState("Select a task to see what blocks it and what it unblocks. Every path is keyboard-accessible.");

  const failRef = React.useRef(false);
  failRef.current = failNext;
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  /* -- app-owned mutations -------------------------------------------- */

  const onAddDependency = React.useCallback((taskId: string, depId: string) => {
    setCycleError(null);
    setTasks((prev) => {
      if (createsCycle(prev, taskId, depId)) {
        const a = prev.find((t) => t.id === taskId)?.title ?? taskId;
        const b = prev.find((t) => t.id === depId)?.title ?? depId;
        setCycleError({ message: `“${a}” already comes before “${b}”, so this would loop.`, taskIds: [depId, taskId] });
        return prev;
      }
      return prev.map((t) => (t.id === taskId && !t.dependencyIds.includes(depId) ? { ...t, dependencyIds: [...t.dependencyIds, depId] } : t));
    });
  }, []);

  const onRemoveDependency = React.useCallback((taskId: string, depId: string) => {
    setCycleError(null);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, dependencyIds: t.dependencyIds.filter((d) => d !== depId) } : t)));
  }, []);

  // Simulated async persistence for a group move; rejects once when armed so the
  // component's optimistic layer rolls the node back to its origin lane.
  const onMoveTask = React.useCallback(
    (taskId: string, toGroup: string) =>
      new Promise<void>((resolve, reject) => {
        window.setTimeout(() => {
          if (failRef.current) {
            failRef.current = false;
            setFailNext(false);
            reject(new Error("Simulated save failure - task returned to its group."));
            return;
          }
          setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, group: toGroup } : t)));
          resolve();
        }, 420);
      }),
    [],
  );

  /* -- controls that drive the real component UI ---------------------- */

  const clickNode = React.useCallback((id: string) => {
    rootRef.current?.querySelector<HTMLButtonElement>(`[data-task-node="${id}"], [data-task-row="${id}"]`)?.click();
  }, []);

  const demoSelect = React.useCallback(() => {
    setNote("Selected “Launch docs” - its prerequisites and dependents light up on the map.");
    clickNode("docs");
  }, [clickNode]);

  const demoComplete = React.useCallback(() => {
    setNote("Completed prerequisite “Wireframes”. “App build” is no longer blocked by it.");
    setTasks((prev) => prev.map((t) => (t.id === "wires" ? { ...t, status: "completed", progress: 1 } : t)));
  }, []);

  const demoBlock = React.useCallback(() => {
    setNote("Marked “Public API” blocked. Everything downstream inherits the risk.");
    setSelectedTaskId("api");
    setTasks((prev) => prev.map((t) => (t.id === "api" ? { ...t, status: "blocked", blockedReason: "Security review pending." } : t)));
  }, []);

  const demoAddDependency = React.useCallback(async () => {
    setSelectedTaskId("landing");
    setNote("Added “QA pass” as a prerequisite of “Landing page” via the detail panel.");
    await raf();
    const trigger = rootRef.current?.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]');
    trigger?.click();
    await raf();
    const item = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []).find((b) =>
      b.textContent?.includes("QA pass"),
    );
    item?.click();
  }, []);

  const demoRemoveDependency = React.useCallback(async () => {
    setSelectedTaskId("app");
    setNote("Removed “Public API” as a prerequisite of “App build” from the detail panel.");
    await raf();
    const remove = rootRef.current?.querySelector<HTMLButtonElement>('button[aria-label="Remove Public API as a prerequisite"]');
    remove?.click();
  }, []);

  const demoCycle = React.useCallback(async () => {
    setSelectedTaskId("brief");
    setNote("Tried to make “Product brief” depend on “Public launch” - the app rejects the loop.");
    await raf();
    const trigger = rootRef.current?.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]');
    trigger?.click();
    await raf();
    const item = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []).find((b) =>
      b.textContent?.includes("Public launch"),
    );
    item?.click();
  }, []);

  const demoHighlight = React.useCallback(() => {
    setActivePath((p) => (p ? undefined : CRITICAL_PATH));
    setNote((n) => (activePath ? "Cleared the highlighted path." : "Highlighted the critical path: Brief → Wireframes → App build → QA → Launch."));
  }, [activePath]);

  const demoCollapse = React.useCallback(async () => {
    setLayout("map");
    setNote("Collapsed the Go-to-market group to focus on upstream work.");
    await raf();
    const btn = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []).find(
      (b) => b.getAttribute("aria-expanded") === "true" && b.textContent?.includes("Go-to-market"),
    );
    btn?.click();
  }, []);

  const demoView = React.useCallback(() => {
    setLayout((v) => (v === "map" ? "list" : "map"));
    setNote((_n) => (layout === "map" ? "Switched to the compact list view (also the mobile mode)." : "Switched back to the dependency map."));
  }, [layout]);

  const demoFailure = React.useCallback(async () => {
    setFailNext(true);
    failRef.current = true;
    setSelectedTaskId("docs");
    setNote("Armed a save failure, then moved “Launch docs” - watch it snap back on rejection.");
    await raf();
    const trigger = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('button[aria-haspopup="menu"]') ?? []).find((b) =>
      b.textContent?.includes("Move to group"),
    );
    trigger?.click();
    await raf();
    const item = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []).find((b) =>
      b.textContent?.includes("Engineering"),
    );
    item?.click();
  }, []);

  const reset = React.useCallback(() => {
    setTasks(seed());
    setSelectedTaskId("app");
    setLayout("map");
    setActivePath(undefined);
    setCycleError(null);
    setFailNext(false);
    failRef.current = false;
    setNote("Reset. Select a task to see what blocks it and what it unblocks.");
  }, []);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      {/* project-plan shell */}
      <div className="overflow-hidden rounded-2xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--color-border)] px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-fg)]">
            <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            Helio · Product launch plan
          </span>
          <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
            Fictional demo data
          </span>
          <span className="ml-auto text-[12px] text-[var(--color-muted)]">Q3 launch · dependency view</span>
        </div>

        <div ref={rootRef} className="p-3">
          <TaskDependencyMap
            tasks={tasks}
            groups={GROUPS}
            selectedTaskId={selectedTaskId}
            onSelectedTaskChange={setSelectedTaskId}
            onAddDependency={onAddDependency}
            onRemoveDependency={onRemoveDependency}
            onMoveTask={onMoveTask}
            layout={layout}
            activePath={activePath}
            cycleError={cycleError}
            label="Product launch dependency map"
          />
        </div>
      </div>

      {/* working controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={control} onClick={demoSelect}>Select task</button>
        <button type="button" className={control} onClick={demoComplete}>Complete prerequisite</button>
        <button type="button" className={control} onClick={demoBlock}>Block task</button>
        <button type="button" className={control} onClick={demoAddDependency}>Add dependency</button>
        <button type="button" className={control} onClick={demoRemoveDependency}>Remove dependency</button>
        <button type="button" className={control} onClick={demoCycle}>Cycle error</button>
        <button type="button" className={control} onClick={demoHighlight}>Highlight path</button>
        <button type="button" className={control} onClick={demoCollapse}>Collapse group</button>
        <button type="button" className={control} onClick={demoView}>Switch list/map</button>
        <button type="button" className={control} onClick={demoFailure}>Optimistic move + rollback</button>
        <button type="button" className={control} onClick={reset}>Reset</button>
        <span aria-live="polite" className="ml-auto max-w-[340px] text-right text-[12px] text-[var(--color-muted)]">
          {note}
        </span>
      </div>
    </div>
  );
}

export default TaskDependencyMapPreview;
