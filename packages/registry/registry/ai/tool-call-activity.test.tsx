import * as React from "react";
import { render, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToolCallActivity, type ToolCall } from "./tool-call-activity";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const BASE: ToolCall[] = [
  { id: "a", name: "Searching project documentation", category: "search", status: "waiting_approval", input: { q: "cache" } },
  { id: "b", name: "Reading a configuration file", category: "read", status: "failed", error: "File not found: config.yaml", input: { path: "config.yaml" } },
  { id: "c", name: "Generating a migration plan", category: "code", status: "running", progress: 0.4 },
];

describe("ToolCallActivity", () => {
  it("fires onApprove for a waiting_approval call and shows status labels (not colour-only)", async () => {
    const onApprove = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<ToolCallActivity calls={BASE} onApprove={onApprove} />);
    // Status conveyed as readable text, not colour alone.
    expect(screen.getByText("Waiting for approval")).toBeTruthy();
    expect(screen.getByText("Failed")).toBeTruthy();
    expect(screen.getByText("Running")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /approve searching project documentation/i }));
    expect(onApprove).toHaveBeenCalledWith("a");
    await noViolations(container);
  });

  it("fires onRetry for a failed call", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ToolCallActivity calls={BASE} onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: /retry reading a configuration file/i }));
    expect(onRetry).toHaveBeenCalledWith("b");
  });

  it("toggles the details region via aria-expanded", async () => {
    const user = userEvent.setup();
    // A completed call carries details but no action buttons, so its header is the only matching button.
    const calls: ToolCall[] = [
      { id: "d", name: "Compiling the report", category: "code", status: "completed", output: { pages: 4 } },
    ];
    render(<ToolCallActivity calls={calls} />);
    const header = screen.getByRole("button", { name: /compiling the report/i });
    expect(header.getAttribute("aria-expanded")).toBe("false");
    await user.click(header);
    expect(header.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("region", { name: /compiling the report details/i })).toBeTruthy();
  });

  it("renders the final state (no motion) under reduced motion", () => {
    const orig = window.matchMedia;
    window.matchMedia = ((q: string) => ({
      matches: /prefers-reduced-motion/.test(q),
      media: q,
      onchange: null,
      addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
    })) as typeof window.matchMedia;
    try {
      const calls: ToolCall[] = [{ id: "c", name: "Generating a migration plan", status: "running", progress: 0.6 }];
      render(<ToolCallActivity calls={calls} />);
      // Determinate progress reports a real value under reduced motion.
      const bar = screen.getByRole("progressbar", { name: /generating a migration plan progress/i });
      expect(bar.getAttribute("aria-valuenow")).toBe("60");
    } finally {
      window.matchMedia = orig;
    }
  });
});

/*
 * Responsive contract — jsdom asserts the structure that makes a narrow row
 * reflow rather than ellipsise: a line-clamped call name and a status/action
 * rail that drops to its own full-width row until the component ITSELF is wide
 * enough. Driven by `@container/toolcalls`, never by the viewport.
 */
describe("ToolCallActivity — responsive contract", () => {
  it("declares its own named container context so it sizes on its own width", () => {
    const { container } = render(<ToolCallActivity calls={BASE} />);
    const root = container.querySelector("section");
    expect(root).toBeTruthy();
    expect(root!.className).toContain("@container/toolcalls");
  });

  it("wraps a call name to two lines instead of truncating it", () => {
    const { container } = render(<ToolCallActivity calls={BASE} />);
    const names = Array.from(container.querySelectorAll("[data-call-name]"));
    expect(names.length).toBe(BASE.length);
    for (const n of names) {
      expect(n.className).toContain("line-clamp-2");
      expect(n.className).not.toContain("truncate");
    }
  });

  it("gives each call's status + actions their own full-width row until @md/toolcalls", () => {
    const { container } = render(<ToolCallActivity calls={BASE} />);
    const rails = Array.from(container.querySelectorAll("[data-call-meta]"));
    expect(rails.length).toBe(BASE.length);
    for (const rail of rails) {
      expect(rail.className).toContain("w-full");
      // Container-based, not viewport-based.
      expect(rail.className).toContain("@md/toolcalls:w-auto");
      expect(rail.className).not.toContain("sm:w-auto");
    }
  });

  it("gives call controls a 44px touch target while the panel is narrow", () => {
    render(<ToolCallActivity calls={BASE} onApprove={vi.fn()} onRetry={vi.fn()} />);
    for (const name of [
      /approve searching project documentation/i,
      /retry reading a configuration file/i,
    ]) {
      expect(screen.getByRole("button", { name }).className).toContain("min-h-[44px]");
    }
  });
});
