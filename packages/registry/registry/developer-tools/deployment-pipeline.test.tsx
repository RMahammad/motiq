import * as React from "react";
import { render, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DeploymentPipeline, type Stage } from "./deployment-pipeline";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const STAGES: Stage[] = [
  { id: "install", name: "Install", status: "passed", durationMs: 8400, logs: ["$ pnpm install", "Done in 8.4s"] },
  { id: "build", name: "Build", status: "passed", durationMs: 22600, logs: ["$ next build"] },
  { id: "test", name: "Test", status: "failed", durationMs: 14200, logs: ["$ vitest run", "1 failed"] },
  { id: "deploy", name: "Deploy", status: "cancelled" },
];

describe("DeploymentPipeline", () => {
  it("renders every stage with its status announced as text and is axe-clean", async () => {
    const { container } = render(<DeploymentPipeline stages={STAGES} />);
    // Stage names present.
    for (const s of STAGES) expect(screen.getByText(s.name)).toBeTruthy();
    // Status labels are real text, not color-only.
    expect(screen.getAllByText("Passed").length).toBe(2);
    expect(screen.getByText("Failed")).toBeTruthy();
    expect(screen.getByText("Cancelled")).toBeTruthy();
    await noViolations(container);
  });

  it("keeps logs collapsed until the toggle is activated", async () => {
    const user = userEvent.setup();
    render(<DeploymentPipeline stages={STAGES} />);
    expect(screen.queryByText("Done in 8.4s")).toBeNull();
    const toggle = screen.getAllByRole("button", { name: /logs/i })[0];
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await user.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(await screen.findByText("Done in 8.4s")).toBeTruthy();
  });

  it("exposes the `label` prop as the accessible name of the pipeline group", () => {
    render(<DeploymentPipeline stages={STAGES} label="Release pipeline" />);
    expect(screen.getByRole("group", { name: "Release pipeline" })).toBeTruthy();
  });

  it("calls onRetry with the stage id from a failed stage's Retry control", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<DeploymentPipeline stages={STAGES} onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: /retry test stage/i }));
    expect(onRetry).toHaveBeenCalledWith("test");
  });

  /* Responsive contract — see docs/responsive-standard.md. jsdom cannot lay out,
     so these assert the *structure* that makes the row reflow at 320–375px. */
  describe("responsive contract", () => {
    it("keeps the status pill and duration inside one wrapping group", () => {
      const { container } = render(<DeploymentPipeline stages={STAGES} />);
      const rows = container.querySelectorAll<HTMLElement>('[data-slot="stage-meta"]');
      expect(rows.length).toBe(STAGES.length);
      for (const row of rows) {
        expect(row.className).toContain("flex-wrap");
      }
      // A duration is never a standalone flex child of the wrapping meta row:
      // it always lives inside the status group, so it can never strand alone.
      const install = rows[0];
      const group = install.querySelector<HTMLElement>('[data-slot="stage-status-group"]');
      expect(group).toBeTruthy();
      expect(group!.textContent).toContain("Passed");
      expect(group!.textContent).toContain("8.4s");
    });

    it("omits the action wrapper entirely when a stage has neither logs nor retry", () => {
      const { container } = render(
        <DeploymentPipeline stages={[{ id: "only", name: "Only", status: "passed" }]} />,
      );
      const row = container.querySelector<HTMLElement>('[data-slot="stage-meta"]');
      // Stage name + status group only — no empty `w-full` child claiming a line.
      expect(row!.children.length).toBe(2);
    });

    it("gives the row controls a 44px narrow target that relaxes from @sm/pipeline up", () => {
      render(<DeploymentPipeline stages={STAGES} onRetry={() => {}} />);
      const retry = screen.getByRole("button", { name: /retry test stage/i });
      const logs = screen.getAllByRole("button", { name: /logs/i })[0];
      for (const el of [retry, logs]) {
        expect(el.className).toContain("min-h-[44px]");
        expect(el.className).toContain("@sm/pipeline:min-h-0");
      }
    });

    it("lets a long stage name wrap instead of ellipsising", () => {
      render(
        <DeploymentPipeline
          stages={[{ id: "x", name: "Provision ephemeral preview infrastructure", status: "running" }]}
        />,
      );
      const name = screen.getByText("Provision ephemeral preview infrastructure");
      expect(name.className).toContain("break-words");
      expect(name.className).not.toContain("truncate");
    });
  });
});
