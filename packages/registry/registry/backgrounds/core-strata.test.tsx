import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CoreStrata } from "./core-strata";

afterEach(cleanup);

/**
 * Canvas output can't be asserted visually in jsdom (getContext("2d") returns
 * null), so these tests pin the accessibility + lifecycle CONTRACT instead: the
 * component must render its static markup, guard the null context, expose the
 * data attributes the standard relies on, and mount/unmount without throwing.
 */
describe("CoreStrata", () => {
  const bg = (c: HTMLElement) => c.querySelector('[aria-hidden="true"]');

  it("renders a canvas inside an aria-hidden decorative layer", () => {
    const { container } = render(<CoreStrata seed={3} />);
    const layer = bg(container);
    expect(layer).not.toBeNull();
    expect(layer?.querySelector("canvas")).not.toBeNull();
  });

  it("keeps children outside the decorative (aria-hidden) layer", () => {
    const { container, getByText } = render(
      <CoreStrata seed={3}>
        <h2>Readable headline</h2>
      </CoreStrata>,
    );
    expect(bg(container)?.contains(getByText("Readable headline"))).toBe(false);
  });

  it("flips data-motion to static under the reducedMotion prop", () => {
    const { container: animated } = render(<CoreStrata seed={7} />);
    expect(bg(animated)?.getAttribute("data-motion")).toBe("animated");
    cleanup();
    const { container: still } = render(<CoreStrata seed={7} reducedMotion />);
    expect(bg(still)?.getAttribute("data-motion")).toBe("static");
  });

  it("wires the data-paused attribute", () => {
    const { container } = render(<CoreStrata seed={3} />);
    expect(bg(container)?.getAttribute("data-paused")).toBeTruthy();
  });

  it("ships a forced-colors fallback hook", () => {
    const { container } = render(<CoreStrata seed={5} />);
    const style = container.querySelector("style");
    expect(style?.textContent).toContain("forced-colors: active");
    expect(style?.textContent).toContain("CanvasText");
    expect(container.querySelector(".mk-cs-fallback")).not.toBeNull();
  });

  it("does not throw when the 2d context is unavailable (jsdom)", () => {
    // jsdom's canvas returns null from getContext — the component must no-op draw.
    expect(() => {
      const { unmount } = render(<CoreStrata seed={9} />);
      unmount();
    }).not.toThrow();
  });

  it("mounts and unmounts cleanly under reduced motion (static frame path)", () => {
    expect(() => {
      const { unmount } = render(<CoreStrata seed={2} reducedMotion />);
      unmount();
    }).not.toThrow();
  });

  it("mounts and unmounts cleanly with speed=0 (parked-beam still frame)", () => {
    expect(() => {
      const { unmount } = render(<CoreStrata seed={2} speed={0} />);
      unmount();
    }).not.toThrow();
  });

  it("accepts faults/readingLine/safeArea/accent/density/intensity variations without throwing", () => {
    expect(() => {
      const { unmount } = render(
        <CoreStrata
          seed={11}
          faults={6}
          readingLine={0.2}
          density={1.7}
          intensity={1.3}
          accent="#ff8844"
          safeArea={{ x: 0.1, y: 0.1, w: 0.3, h: 0.3 }}
        />,
      );
      unmount();
    }).not.toThrow();
    cleanup();
    expect(() => {
      const { unmount } = render(<CoreStrata seed={12} faults={1} readingLine={0.9} density={0.4} />);
      unmount();
    }).not.toThrow();
  });

  it("mounts cleanly across many seeds (deterministic model build never throws)", () => {
    for (let seed = 1; seed <= 12; seed++) {
      const { unmount } = render(<CoreStrata seed={seed} />);
      unmount();
      cleanup();
    }
  });

  it("uses no DOM backdrop-blur scrim - readability is the canvas-painted quiet zone", () => {
    // A blur layer stacked on top of the canvas quiet zone renders as a visible
    // dark ellipse; the Motion Lab look has no such layer (regression guard).
    const { container } = render(
      <CoreStrata seed={4}>
        <h2>Readable headline</h2>
      </CoreStrata>,
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
      <CoreStrata seed={4}>
        <h2>Readable headline</h2>
      </CoreStrata>,
    );
    const layer = container.querySelector('[aria-hidden="true"]');
    expect(layer?.contains(getByText("Readable headline"))).toBe(false);
  });
});
