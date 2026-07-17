import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RuntimeSignalMap, type ServiceData, type ConnectionData } from "./runtime-signal-map";

afterEach(cleanup);

/**
 * Canvas output can't be asserted visually in jsdom (getContext("2d") returns
 * null), so these tests pin the accessibility + lifecycle CONTRACT instead: the
 * component must render its static markup, guard the null context, expose the
 * data attributes the standard relies on, and mount/unmount without throwing.
 */
describe("RuntimeSignalMap", () => {
  const bg = (c: HTMLElement) => c.querySelector('[aria-hidden="true"]');

  it("renders a canvas inside an aria-hidden decorative layer", () => {
    const { container } = render(<RuntimeSignalMap seed={3} />);
    const layer = bg(container);
    expect(layer).not.toBeNull();
    expect(layer?.querySelector("canvas")).not.toBeNull();
  });

  it("keeps children outside the decorative (aria-hidden) layer", () => {
    const { container, getByText } = render(
      <RuntimeSignalMap seed={3}>
        <h2>Readable headline</h2>
      </RuntimeSignalMap>,
    );
    expect(bg(container)?.contains(getByText("Readable headline"))).toBe(false);
  });

  it("flips data-motion to static under the reducedMotion prop", () => {
    const { container: animated } = render(<RuntimeSignalMap seed={7} />);
    expect(bg(animated)?.getAttribute("data-motion")).toBe("animated");
    cleanup();
    const { container: still } = render(<RuntimeSignalMap seed={7} reducedMotion />);
    expect(bg(still)?.getAttribute("data-motion")).toBe("static");
  });

  it("wires the data-paused attribute", () => {
    const { container } = render(<RuntimeSignalMap seed={3} />);
    expect(bg(container)?.getAttribute("data-paused")).toBeTruthy();
  });

  it("ships a forced-colors fallback hook", () => {
    const { container } = render(<RuntimeSignalMap seed={5} />);
    const style = container.querySelector("style");
    expect(style?.textContent).toContain("forced-colors: active");
    expect(style?.textContent).toContain("CanvasText");
    expect(container.querySelector(".mk-rsm-fallback")).not.toBeNull();
  });

  it("does not throw when the 2d context is unavailable (jsdom)", () => {
    // jsdom's canvas returns null from getContext — the component must no-op draw.
    expect(() => {
      const { unmount } = render(<RuntimeSignalMap seed={9} />);
      unmount();
    }).not.toThrow();
  });

  it("accepts application-supplied services/connections without throwing", () => {
    const services: ServiceData[] = [
      { id: "a", x: 0.2, y: 0.5, health: "healthy" },
      { id: "b", x: 0.8, y: 0.3, health: "error" },
      { id: "c", x: 0.8, y: 0.7, health: "degraded" },
    ];
    const connections: ConnectionData[] = [
      { from: "a", to: "b", direction: "forward" },
      { from: "a", to: "c", direction: "bidirectional", latencyBand: "high" },
    ];
    expect(() => {
      const { unmount } = render(
        <RuntimeSignalMap services={services} connections={connections} />,
      );
      unmount();
    }).not.toThrow();
  });

  it("mounts and unmounts cleanly under reduced motion (static frame path)", () => {
    expect(() => {
      const { unmount } = render(<RuntimeSignalMap seed={2} reducedMotion />);
      unmount();
    }).not.toThrow();
  });

  // The field now runs full-bleed (the canvas is never masked); readability comes
  // from a glass scrim rendered BEHIND the copy — a backdrop-blur layer present
  // only when a contentPlacement is set AND children exist.
  const canvasMask = (c: HTMLElement) => {
    const canvas = c.querySelector("canvas");
    return (
      canvas?.style.maskImage ||
      canvas?.style.getPropertyValue("mask-image") ||
      (canvas?.style as unknown as Record<string, string>)?.WebkitMaskImage ||
      ""
    );
  };
  const scrimOf = (c: HTMLElement) =>
    Array.from(c.querySelectorAll<HTMLElement>('[aria-hidden="true"]')).find(
      (el) => (el.style as unknown as Record<string, string>).backdropFilter || el.style.getPropertyValue("backdrop-filter"),
    ) ?? null;

  it("keeps the canvas full-bleed (never masked), with or without a placement", () => {
    const { container } = render(<RuntimeSignalMap seed={4} contentPlacement="left" />);
    expect(canvasMask(container)).toBe("");
    cleanup();
    const { container: none } = render(<RuntimeSignalMap seed={4} contentPlacement="none" />);
    expect(canvasMask(none)).toBe("");
  });

  it("renders a readability scrim behind the copy when a contentPlacement is set", () => {
    const { container } = render(
      <RuntimeSignalMap seed={4} contentPlacement="left">
        <h2>Readable headline</h2>
      </RuntimeSignalMap>,
    );
    expect(scrimOf(container)).not.toBeNull();
  });

  it("omits the scrim when there is no placement or no children", () => {
    const { container } = render(
      <RuntimeSignalMap seed={4} contentPlacement="none">
        <h2>Headline</h2>
      </RuntimeSignalMap>,
    );
    expect(scrimOf(container)).toBeNull();
    cleanup();
    const { container: noKids } = render(<RuntimeSignalMap seed={4} contentPlacement="left" />);
    expect(scrimOf(noKids)).toBeNull();
  });
});
