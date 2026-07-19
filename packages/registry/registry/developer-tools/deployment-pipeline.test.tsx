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

  it("calls onRetry with the stage id from a failed stage's Retry control", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<DeploymentPipeline stages={STAGES} onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: /retry test stage/i }));
    expect(onRetry).toHaveBeenCalledWith("test");
  });
});
