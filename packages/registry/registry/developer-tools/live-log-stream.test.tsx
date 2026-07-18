import * as React from "react";
import { render, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LiveLogStream, type LogEntry, type LogLevel } from "./live-log-stream";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const mk = (id: string, level: LogLevel, message: string): LogEntry => ({ id, level, message });
const BASE: LogEntry[] = [
  mk("1", "info", "build started"),
  mk("2", "success", "compiled 240 modules"),
  mk("3", "warning", "unused export detected"),
];

describe("LiveLogStream", () => {
  it("pauses appends and surfaces a jump-to-latest indicator instead of auto-following", async () => {
    const user = userEvent.setup();
    const onPausedChange = vi.fn();
    const { rerender } = render(<LiveLogStream entries={BASE} onPausedChange={onPausedChange} />);

    // No indicator while following at the tail.
    expect(screen.queryByRole("button", { name: /jump to latest/i })).toBeNull();

    // Pause (uncontrolled) — following is now disabled.
    await user.click(screen.getByRole("button", { name: /pause/i }));
    expect(onPausedChange).toHaveBeenCalledWith(true);

    // The app appends a line while paused: it is retained but not auto-followed.
    rerender(<LiveLogStream entries={[...BASE, mk("4", "error", "deploy failed")]} onPausedChange={onPausedChange} />);
    const jump = await screen.findByRole("button", { name: /1 new line - jump to latest/i });
    expect(jump).toBeTruthy();
    // The new line is present in the log (scrolling is never disabled).
    expect(screen.getByText("deploy failed")).toBeTruthy();
  });

  it("resuming via the indicator clears it and reports resume", async () => {
    const user = userEvent.setup();
    const onPausedChange = vi.fn();
    const { rerender } = render(<LiveLogStream entries={BASE} paused onPausedChange={onPausedChange} />);

    rerender(<LiveLogStream entries={[...BASE, mk("4", "info", "retrying")]} paused onPausedChange={onPausedChange} />);
    const jump = await screen.findByRole("button", { name: /jump to latest/i });

    await user.click(jump);
    expect(onPausedChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(screen.queryByRole("button", { name: /jump to latest/i })).toBeNull());
  });

  it("filters by level, hiding lines of deselected levels", async () => {
    const user = userEvent.setup();
    render(
      <LiveLogStream
        entries={[mk("a", "info", "listening on :3000"), mk("b", "error", "unhandled rejection")]}
      />,
    );
    expect(screen.getByText("unhandled rejection")).toBeTruthy();

    // Turn the Error level off via its filter chip.
    await user.click(screen.getByRole("button", { name: "Error", pressed: true }));
    expect(screen.queryByText("unhandled rejection")).toBeNull();
    // Other levels remain visible.
    expect(screen.getByText("listening on :3000")).toBeTruthy();
  });

  it("caps retained rows at maxEntries, dropping the oldest", () => {
    const many: LogEntry[] = Array.from({ length: 10 }, (_, i) => mk(`e${i}`, "info", `line ${i}`));
    const { container } = render(<LiveLogStream entries={many} maxEntries={4} />);

    expect(screen.queryByText("line 0")).toBeNull();
    expect(screen.queryByText("line 5")).toBeNull();
    expect(screen.getByText("line 9")).toBeTruthy();
    expect(container.querySelectorAll("ol > li").length).toBe(4);
  });

  it("has no axe violations in the populated streaming state", async () => {
    const { container } = render(
      <LiveLogStream entries={BASE} title="Deploy logs" onClear={() => {}} />,
    );
    await noViolations(container);
  });
});
