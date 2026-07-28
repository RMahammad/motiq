import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CopperplateHatch } from "./copperplate-hatch";

afterEach(cleanup);

/**
 * Canvas output can't be asserted visually in jsdom (getContext("2d") returns
 * null), so these tests pin the accessibility + lifecycle CONTRACT instead: the
 * component must render its static markup, guard the null context, expose the
 * data attributes the standard relies on, and mount/unmount without throwing.
 */
describe("CopperplateHatch", () => {
  const bg = (c: HTMLElement) => c.querySelector('[aria-hidden="true"]');

  it("renders a canvas inside an aria-hidden decorative layer", () => {
    const { container } = render(<CopperplateHatch seed={3} />);
    const layer = bg(container);
    expect(layer).not.toBeNull();
    expect(layer?.querySelector("canvas")).not.toBeNull();
  });

  it("keeps children outside the decorative (aria-hidden) layer", () => {
    const { container, getByText } = render(
      <CopperplateHatch seed={3}>
        <h2>Readable headline</h2>
      </CopperplateHatch>,
    );
    expect(bg(container)?.contains(getByText("Readable headline"))).toBe(false);
  });

  it("flips data-motion to static under the reducedMotion prop", () => {
    const { container: animated } = render(<CopperplateHatch seed={7} />);
    expect(bg(animated)?.getAttribute("data-motion")).toBe("animated");
    cleanup();
    const { container: still } = render(<CopperplateHatch seed={7} reducedMotion />);
    expect(bg(still)?.getAttribute("data-motion")).toBe("static");
  });

  it("wires the data-paused attribute", () => {
    const { container } = render(<CopperplateHatch seed={3} />);
    expect(bg(container)?.getAttribute("data-paused")).toBeTruthy();
  });

  it("ships a forced-colors fallback hook", () => {
    const { container } = render(<CopperplateHatch seed={5} />);
    const style = container.querySelector("style");
    expect(style?.textContent).toContain("forced-colors: active");
    expect(style?.textContent).toContain("CanvasText");
    expect(style?.textContent).toContain("display: none");
    expect(container.querySelector(".mk-cph-fallback")).not.toBeNull();
  });

  it("does not throw when the 2d context is unavailable (jsdom)", () => {
    // jsdom's canvas returns null from getContext — the component must no-op draw.
    expect(() => {
      const { unmount } = render(<CopperplateHatch seed={9} />);
      unmount();
    }).not.toThrow();
  });

  it("mounts and unmounts cleanly under reduced motion (static frame path)", () => {
    expect(() => {
      const { unmount } = render(<CopperplateHatch seed={2} reducedMotion />);
      unmount();
    }).not.toThrow();
  });

  it("mounts and unmounts cleanly with speed=0 (stalled, no loop)", () => {
    expect(() => {
      const { unmount } = render(<CopperplateHatch seed={2} speed={0} />);
      unmount();
    }).not.toThrow();
  });

  it("mounts and unmounts cleanly with interactive + custom accent/density/safeArea", () => {
    expect(() => {
      const { unmount } = render(
        <CopperplateHatch
          seed={4}
          interactive
          density={1.4}
          intensity={1.2}
          accent="#eab365"
          safeArea={{ x: 0.1, y: 0.1, w: 0.4, h: 0.5 }}
        />,
      );
      unmount();
    }).not.toThrow();
  });

  it("accepts a single focalPoint object or an array of up to two, without throwing", () => {
    expect(() => {
      const a = render(<CopperplateHatch seed={5} focalPoint={{ x: 0.7, y: 0.3 }} />);
      a.unmount();
      const b = render(
        <CopperplateHatch seed={5} focalPoint={[{ x: 0.7, y: 0.3 }, { x: 0.2, y: 0.8 }]} />,
      );
      b.unmount();
    }).not.toThrow();
  });

  it("does not schedule a requestAnimationFrame loop under reduced motion", () => {
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    const { unmount } = render(<CopperplateHatch seed={6} reducedMotion />);
    expect(raf).not.toHaveBeenCalled();
    unmount();
    raf.mockRestore();
  });

  it("uses no DOM backdrop-blur scrim - readability is the canvas-painted quiet zone", () => {
    // A blur layer stacked on top of the canvas quiet zone renders as a visible
    // dark ellipse; the Motion Lab look has no such layer (regression guard).
    const { container } = render(
      <CopperplateHatch seed={4}>
        <h2>Readable headline</h2>
      </CopperplateHatch>,
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
      <CopperplateHatch seed={4}>
        <h2>Readable headline</h2>
      </CopperplateHatch>,
    );
    const layer = container.querySelector('[aria-hidden="true"]');
    expect(layer?.contains(getByText("Readable headline"))).toBe(false);
  });
});
