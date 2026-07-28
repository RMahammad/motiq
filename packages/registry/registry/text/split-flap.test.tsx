import { render, cleanup, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SplitFlap } from "./split-flap";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const PAGES = [
  ["SHIP MOTION    ON TIME", "SPLIT-FLAP    BOARDING"],
  ["OPEN SOURCE    ALL DAY", "ZERO LOCK-IN   ON TIME"],
];

/**
 * The flip choreography is rAF-driven (inert in jsdom), so these tests pin the
 * CONTRACT: the board is decorative, the settled page is announced politely,
 * the grid matches the message shape, reduced motion swaps pages as instant
 * text, and page control (controlled + auto-rotation) behaves.
 */
describe("SplitFlap", () => {
  const board = (c: HTMLElement) => c.querySelector('[aria-hidden="true"]');
  const live = (c: HTMLElement) => c.querySelector('[aria-live="polite"]');
  const cells = (c: HTMLElement) => c.querySelectorAll("[data-mk-cell]");

  it("marks the board decorative and announces the page in a polite live region", () => {
    const { container } = render(<SplitFlap messages={PAGES} reducedMotion />);
    expect(board(container)).not.toBeNull();
    expect(board(container)?.querySelectorAll("[data-mk-cell]").length).toBeGreaterThan(0);
    const region = live(container);
    expect(region).not.toBeNull();
    expect(region?.className).toContain("sr-only");
    expect(region?.textContent).toContain("SHIP MOTION");
    expect(region?.textContent).toContain("SPLIT-FLAP");
  });

  it("swaps pages as instant text under the reducedMotion prop", () => {
    const { container } = render(<SplitFlap messages={PAGES} reducedMotion index={1} />);
    expect(container.querySelector("[data-motion]")?.getAttribute("data-motion")).toBe("static");
    const glyphs = Array.from(board(container)?.querySelectorAll<HTMLElement>("[data-mk-glyph]") ?? [])
      .map((el) => el.textContent ?? "")
      .join("");
    expect(glyphs).toContain("O");
    expect(live(container)?.textContent).toContain("OPEN SOURCE");
  });

  it("sizes the grid from the messages and honours an explicit cols", () => {
    const { container } = render(<SplitFlap messages={PAGES} reducedMotion />);
    // 2 rows x 22 columns (the longest line).
    expect(cells(container).length).toBe(2 * 22);
    cleanup();
    const narrow = render(<SplitFlap messages={["MOTIQ"]} cols={8} reducedMotion />);
    expect(narrow.container.querySelectorAll("[data-mk-cell]").length).toBe(8);
  });

  it("accepts a controlled index and reports changes", () => {
    const onIndexChange = vi.fn();
    const { container, rerender } = render(
      <SplitFlap messages={PAGES} reducedMotion index={0} onIndexChange={onIndexChange} interval={0} />,
    );
    expect(live(container)?.textContent).toContain("SHIP MOTION");
    rerender(<SplitFlap messages={PAGES} reducedMotion index={1} onIndexChange={onIndexChange} interval={0} />);
    expect(live(container)?.textContent).toContain("OPEN SOURCE");
    // A controlled board never moves on its own.
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("rotates pages on the interval when uncontrolled", () => {
    vi.useFakeTimers();
    const onIndexChange = vi.fn();
    const { container } = render(
      <SplitFlap messages={PAGES} reducedMotion interval={4000} onIndexChange={onIndexChange} />,
    );
    expect(live(container)?.textContent).toContain("SHIP MOTION");
    act(() => {
      vi.advanceTimersByTime(4100);
    });
    expect(onIndexChange).toHaveBeenCalledWith(1);
    expect(live(container)?.textContent).toContain("OPEN SOURCE");
  });

  it("renders four halves per cell so a glyph can split across the fold", () => {
    const { container } = render(<SplitFlap messages={["MOTIQ"]} cols={5} reducedMotion />);
    const cell = container.querySelector("[data-mk-cell]");
    expect(cell?.querySelectorAll("[data-mk-half]").length).toBe(4);
    expect(cell?.querySelectorAll("[data-mk-glyph]").length).toBe(4);
  });

  it("mounts and unmounts cleanly, animated and static, single row and board", () => {
    expect(() => {
      const a = render(<SplitFlap messages={PAGES} seed={5} />);
      a.unmount();
      cleanup();
      const b = render(<SplitFlap messages={["NOW BOARDING"]} flutter={false} interval={0} reducedMotion />);
      b.unmount();
    }).not.toThrow();
  });
});
