import * as React from "react";
import { render, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TaskDependencyMap, type Task, type TaskGroup } from "./task-dependency-map";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const GROUPS: TaskGroup[] = [
  { id: "design", name: "Design" },
  { id: "eng", name: "Engineering" },
  { id: "gtm", name: "Go-to-market" },
];

/* Fixed ids/statuses — deterministic (no Math.random / Date.now). */
function seed(): Task[] {
  return [
    { id: "brief", title: "Brief", status: "completed", group: "design", dependencyIds: [] },
    { id: "wires", title: "Wireframes", status: "active", group: "design", dependencyIds: ["brief"] },
    { id: "api", title: "Public API", status: "active", group: "eng", dependencyIds: ["brief"] },
    { id: "app", title: "App build", status: "blocked", group: "eng", dependencyIds: ["wires", "api"], blockedReason: "Waiting on wireframes." },
    { id: "qa", title: "QA pass", status: "planned", group: "eng", dependencyIds: ["app"] },
    { id: "launch", title: "Public launch", status: "planned", group: "gtm", dependencyIds: ["qa"], milestone: true },
  ];
}

const node = (container: HTMLElement, id: string) =>
  container.querySelector<HTMLButtonElement>(`[data-task-node="${id}"]`);

describe("TaskDependencyMap", () => {
  it("selects a task by keyboard and navigates relationships from the detail panel", async () => {
    const user = userEvent.setup();
    const onSelectedTaskChange = vi.fn();
    const { container } = render(
      <TaskDependencyMap tasks={seed()} groups={GROUPS} onSelectedTaskChange={onSelectedTaskChange} reducedMotion />,
    );

    // Keyboard selection: focus the node, press Enter → app-owned selection fires.
    const appNode = node(container, "app")!;
    appNode.focus();
    await user.keyboard("{Enter}");
    expect(onSelectedTaskChange).toHaveBeenLastCalledWith("app");

    // The detail panel now lists prerequisites ("what blocks this"). Navigating to
    // one selects it — the relationship button is distinct from the map node.
    const wiresButtons = screen.getAllByRole("button", { name: /Wireframes/i });
    const relBtn = wiresButtons.find((b) => !b.hasAttribute("data-task-node"))!;
    expect(relBtn).toBeTruthy();
    await user.click(relBtn);
    expect(onSelectedTaskChange).toHaveBeenLastCalledWith("wires");

    await noViolations(container);
  });

  it("fires onAddDependency and onRemoveDependency from the detail controls", async () => {
    const user = userEvent.setup();
    const onAddDependency = vi.fn();
    const onRemoveDependency = vi.fn();
    render(
      <TaskDependencyMap
        tasks={seed()}
        groups={GROUPS}
        selectedTaskId="app"
        onAddDependency={onAddDependency}
        onRemoveDependency={onRemoveDependency}
        reducedMotion
      />,
    );

    // Remove: "App build" is blocked by "Public API" — remove that prerequisite.
    await user.click(screen.getByRole("button", { name: /Remove Public API as a prerequisite/i }));
    expect(onRemoveDependency).toHaveBeenCalledWith("app", "api");

    // Add: open the "Add prerequisite" menu and pick an eligible task.
    await user.click(screen.getByRole("button", { name: /^Add prerequisite$/i }));
    const menu = await screen.findByRole("menu", { name: /Add a prerequisite to App build/i });
    await user.click(within(menu).getByRole("menuitem", { name: /QA pass/i }));
    expect(onAddDependency).toHaveBeenCalledWith("app", "qa");
  });

  it("presents an app-supplied cycle error", () => {
    render(
      <TaskDependencyMap
        tasks={seed()}
        groups={GROUPS}
        cycleError={{ message: "Brief already comes before Launch.", taskIds: ["launch", "brief"] }}
        reducedMotion
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/cycle/i);
    expect(alert.textContent).toMatch(/Brief already comes before Launch/i);
  });

  it("rolls back an optimistic move when the app's onMoveTask rejects", async () => {
    const user = userEvent.setup();
    const onMoveTask = vi.fn(() => Promise.reject(new Error("save failed")));
    render(
      <TaskDependencyMap tasks={seed()} groups={GROUPS} selectedTaskId="qa" onMoveTask={onMoveTask} reducedMotion />,
    );

    await user.click(screen.getByRole("button", { name: /^Move to group$/i }));
    const menu = await screen.findByRole("menu", { name: /Move QA pass to another group/i });
    await user.click(within(menu).getByRole("menuitem", { name: /^Design$/i }));

    expect(onMoveTask).toHaveBeenCalledWith("qa", "design");
    // On rejection the optimistic move rolls back and the failure is announced.
    await waitFor(() => expect(screen.getByRole("status").textContent).toMatch(/move failed/i));
  });

  it("renders the compact list fallback without the spatial map", async () => {
    const user = userEvent.setup();
    const onSelectedTaskChange = vi.fn();
    const { container } = render(
      <TaskDependencyMap tasks={seed()} groups={GROUPS} layout="list" onSelectedTaskChange={onSelectedTaskChange} reducedMotion />,
    );

    // List rows exist; spatial map nodes do not.
    expect(container.querySelector('[data-task-row="app"]')).toBeTruthy();
    expect(container.querySelector('[data-task-node="app"]')).toBeNull();

    await user.click(container.querySelector<HTMLButtonElement>('[data-task-row="app"]')!);
    expect(onSelectedTaskChange).toHaveBeenCalledWith("app");

    await noViolations(container);
  });
});
