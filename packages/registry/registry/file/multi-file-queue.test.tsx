import * as React from "react";
import { render, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MultiFileQueue, type QueueItem } from "./multi-file-queue";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

// Three same-priority, same-status items → one lane of three (reorderable).
const THREE: QueueItem[] = [
  { id: "a", fileName: "a.png", fileType: "image/png", fileSize: 1000, priority: "normal", status: "queued", progress: 0 },
  { id: "b", fileName: "b.png", fileType: "image/png", fileSize: 2000, priority: "normal", status: "queued", progress: 0 },
  { id: "c", fileName: "c.png", fileType: "image/png", fileSize: 3000, priority: "normal", status: "queued", progress: 0 },
];

describe("MultiFileQueue", () => {
  it("reorders via a keyboard-activated move button and announces the new lane position", async () => {
    const user = userEvent.setup();
    const onReorder = vi.fn();
    render(<MultiFileQueue items={THREE} onReorder={onReorder} />);

    // Move the second item (global index 1) up; keyboard activation on a real button.
    const upB = screen.getByRole("button", { name: /Move b\.png up/i });
    upB.focus();
    expect(document.activeElement).toBe(upB);
    await user.keyboard("{Enter}");

    // Reorder is emitted with global indices (app owns the actual move).
    expect(onReorder).toHaveBeenCalledWith(1, 0);
    // The polite live region announces the item's new position, not a percentage.
    expect(screen.getByRole("status").textContent).toMatch(/b\.png to position 1 of 3/i);
  });

  it("keeps focus on a neighbouring row after an item is removed", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [items, setItems] = React.useState<QueueItem[]>(THREE);
      return <MultiFileQueue items={items} onRemove={(it) => setItems((p) => p.filter((x) => x.id !== it.id))} />;
    }
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: /Remove b\.png/i }));

    // Focus lands on the following row's remove control (c), never lost to <body>.
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole("button", { name: /Remove c\.png/i }));
    });
  });

  it("shows Pause all only while the queue is running, and Resume all only when work is paused", () => {
    const running: QueueItem[] = [
      { id: "r", fileName: "r.mp4", fileType: "video/mp4", fileSize: 5000, priority: "high", status: "active", progress: 40 },
    ];
    const { rerender } = render(
      <MultiFileQueue items={running} onPauseAll={vi.fn()} onResumeAll={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: /Pause all/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Resume all/i })).toBeNull();

    const paused: QueueItem[] = [{ ...running[0], status: "paused" }];
    rerender(<MultiFileQueue items={paused} onPauseAll={vi.fn()} onResumeAll={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Resume all/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Pause all/i })).toBeNull();
  });

  it("raises priority by one step through onPriorityChange", async () => {
    const user = userEvent.setup();
    const onPriorityChange = vi.fn();
    const low: QueueItem[] = [
      { id: "z", fileName: "z.wav", fileType: "audio/wav", fileSize: 900, priority: "low", status: "queued", progress: 0 },
    ];
    render(<MultiFileQueue items={low} onPriorityChange={onPriorityChange} />);

    await user.click(screen.getByRole("button", { name: /Increase priority of z\.wav/i }));
    expect(onPriorityChange).toHaveBeenCalledWith(expect.objectContaining({ id: "z" }), "normal");
  });

  it("has no axe violations across lanes, blocked, failed, and completed states", async () => {
    const mixed: QueueItem[] = [
      { id: "1", fileName: "hero.mp4", fileType: "video/mp4", fileSize: 8000, priority: "high", status: "active", progress: 60, speed: 1000, remainingTime: 12 },
      { id: "2", fileName: "dep.mp4", fileType: "video/mp4", fileSize: 4000, priority: "high", status: "blocked", progress: 0, dependency: "hero.mp4 to finish" },
      { id: "3", fileName: "doc.pdf", fileType: "application/pdf", fileSize: 3000, priority: "normal", status: "failed", progress: 0, error: "Import rejected: too large." },
      { id: "4", fileName: "clip.wav", fileType: "audio/wav", fileSize: 2000, priority: "low", status: "completed", progress: 100 },
    ];
    const { container } = render(
      <MultiFileQueue
        items={mixed}
        concurrency={2}
        onRemove={vi.fn()}
        onPause={vi.fn()}
        onRetry={vi.fn()}
        onReorder={vi.fn()}
        onPriorityChange={vi.fn()}
        onPauseAll={vi.fn()}
        onRetryFailed={vi.fn()}
        onClearCompleted={vi.fn()}
      />,
    );
    await noViolations(container);
  });
});
