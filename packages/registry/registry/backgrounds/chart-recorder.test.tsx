import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChartRecorderBackground } from "./chart-recorder";

afterEach(cleanup);

/**
 * Canvas output can't be asserted visually in jsdom (getContext("2d") returns
 * null), so these tests pin the accessibility + lifecycle CONTRACT instead: the
 * component must render its static markup, guard the null context, expose the
 * data attributes the standard relies on, and mount/unmount without throwing.
 */
describe("ChartRecorderBackground", () => {
  const bg = (c: HTMLElement) => c.querySelector('[aria-hidden="true"]');

  it("renders a canvas inside an aria-hidden decorative layer", () => {
    const { container } = render(<ChartRecorderBackground seed={3} />);
    const layer = bg(container);
    expect(layer).not.toBeNull();
    expect(layer?.querySelector("canvas")).not.toBeNull();
  });

  it("keeps children outside the decorative (aria-hidden) layer", () => {
    const { container, getByText } = render(
      <ChartRecorderBackground seed={3}>
        <h2>Readable headline</h2>
      </ChartRecorderBackground>,
    );
    expect(bg(container)?.contains(getByText("Readable headline"))).toBe(false);
  });

  it("flips data-motion to static under the reducedMotion prop", () => {
    const { container: animated } = render(<ChartRecorderBackground seed={7} />);
    expect(bg(animated)?.getAttribute("data-motion")).toBe("animated");
    cleanup();
    const { container: still } = render(<ChartRecorderBackground seed={7} reducedMotion />);
    expect(bg(still)?.getAttribute("data-motion")).toBe("static");
  });

  it("flips data-motion to static when speed is 0 (freezes on a still frame)", () => {
    const { container } = render(<ChartRecorderBackground seed={7} speed={0} />);
    expect(bg(container)?.getAttribute("data-motion")).toBe("static");
  });

  it("wires the data-paused attribute", () => {
    const { container } = render(<ChartRecorderBackground seed={3} />);
    expect(bg(container)?.getAttribute("data-paused")).toBeTruthy();
  });

  it("ships a forced-colors fallback hook", () => {
    const { container } = render(<ChartRecorderBackground seed={5} />);
    const style = container.querySelector("style");
    expect(style?.textContent).toContain("forced-colors: active");
    expect(style?.textContent).toContain("CanvasText");
    expect(container.querySelector(".mk-cr-fallback")).not.toBeNull();
  });

  it("does not throw when the 2d context is unavailable (jsdom)", () => {
    // jsdom's canvas returns null from getContext — the component must no-op draw.
    expect(() => {
      const { unmount } = render(<ChartRecorderBackground seed={9} />);
      unmount();
    }).not.toThrow();
  });

  it("mounts and unmounts cleanly under reduced motion (static frame path)", () => {
    expect(() => {
      const { unmount } = render(<ChartRecorderBackground seed={2} reducedMotion />);
      unmount();
    }).not.toThrow();
  });

  it("accepts lanes across the full 2–5 range without throwing", () => {
    for (const lanes of [2, 3, 4, 5]) {
      expect(() => {
        const { unmount } = render(<ChartRecorderBackground seed={4} lanes={lanes} />);
        unmount();
      }).not.toThrow();
      cleanup();
    }
  });

  it("clamps out-of-range lanes instead of throwing", () => {
    expect(() => {
      const a = render(<ChartRecorderBackground seed={4} lanes={0} />);
      a.unmount();
      const b = render(<ChartRecorderBackground seed={4} lanes={12} />);
      b.unmount();
    }).not.toThrow();
  });

  it("accepts density, intensity, accent, and a custom safeArea without throwing", () => {
    expect(() => {
      const { unmount } = render(
        <ChartRecorderBackground
          seed={6}
          density={1.4}
          intensity={0.8}
          accent="#ff8800"
          safeArea={{ x: 0.1, y: 0.1, w: 0.4, h: 0.5 }}
        />,
      );
      unmount();
    }).not.toThrow();
  });

  it("uses no DOM backdrop-blur scrim - readability is the canvas-painted quiet zone", () => {
    // A blur layer stacked on top of the canvas quiet zone renders as a visible
    // dark ellipse; the Motion Lab look has no such layer (regression guard).
    const { container } = render(
      <ChartRecorderBackground seed={4}>
        <h2>Readable headline</h2>
      </ChartRecorderBackground>,
    );
    const blurred = Array.from(container.querySelectorAll<HTMLElement>("*")).find(
      (el) =>
        (el.style as unknown as Record<string, string>).backdropFilter ||
        el.style.getPropertyValue("backdrop-filter"),
    );
    expect(blurred).toBeUndefined();
  });

  it("renders children in a layer outside the decorative canvas layer", () => {
    const { container, getByText } = render(
      <ChartRecorderBackground seed={4}>
        <h2>Readable headline</h2>
      </ChartRecorderBackground>,
    );
    const layer = container.querySelector('[aria-hidden="true"]');
    expect(layer?.contains(getByText("Readable headline"))).toBe(false);
  });
});
