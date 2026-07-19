import { render, cleanup, act, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RotatingWords } from "./rotating-words";

afterEach(cleanup);

describe("RotatingWords", () => {
  it("cycles words on the interval and wraps around", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<RotatingWords words={["one", "two", "three"]} interval={1000} />);
      const el = container.firstChild as HTMLElement;
      expect(el.textContent).toBe("one");
      act(() => vi.advanceTimersByTime(1000));
      expect(el.textContent).toBe("two");
      act(() => vi.advanceTimersByTime(1000));
      expect(el.textContent).toBe("three");
      act(() => vi.advanceTimersByTime(1000));
      expect(el.textContent).toBe("one");
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows the first word and does not rotate under forced reduced motion", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(
        <RotatingWords words={["a", "b"]} interval={500} reducedMotion="force" />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.textContent).toBe("a");
      act(() => vi.advanceTimersByTime(2000));
      expect(el.textContent).toBe("a");
    } finally {
      vi.useRealTimers();
    }
  });

  it("pauses on hover", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<RotatingWords words={["x", "y"]} interval={1000} />);
      const el = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(el);
      act(() => vi.advanceTimersByTime(3000));
      expect(el.textContent).toBe("x"); // paused, unchanged
      fireEvent.mouseLeave(el);
      act(() => vi.advanceTimersByTime(1000));
      expect(el.textContent).toBe("y");
    } finally {
      vi.useRealTimers();
    }
  });

  it("announces via aria-live and passes axe; SSRs the first word", async () => {
    const html = renderToString(<RotatingWords words={["hello", "world"]} />);
    expect(html).toContain("hello");
    expect(html).toContain('aria-live="polite"');
    const { container } = render(<RotatingWords words={["hello", "world"]} />);
    const res = await axe.run(container as HTMLElement, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(res.violations).toEqual([]);
  });
});
