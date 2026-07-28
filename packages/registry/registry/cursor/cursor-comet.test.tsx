import { render, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CursorComet } from "./cursor-comet";

afterEach(cleanup);

/**
 * Canvas output can't be asserted visually in jsdom (getContext("2d") returns
 * null), so these tests pin the accessibility + lifecycle CONTRACT: the canvas
 * must be decorative and non-blocking, wrapped content must stay in the readable
 * tree, the data attributes the standard relies on must exist, the null 2d
 * context must be guarded, and pointer input must never throw.
 */
describe("CursorComet", () => {
  const root = (c: HTMLElement) => c.querySelector("[data-motion]");

  it("paints into an aria-hidden canvas that never intercepts pointer events", () => {
    const { container } = render(<CursorComet seed={3} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas?.getAttribute("aria-hidden")).toBe("true");
    expect(canvas?.className).toContain("pointer-events-none");
  });

  it("keeps wrapped content in the readable tree", () => {
    const { getByText, container } = render(
      <CursorComet seed={3}>
        <h2>Flick fast</h2>
      </CursorComet>,
    );
    const heading = getByText("Flick fast");
    expect(container.querySelector("canvas")?.contains(heading)).toBe(false);
    expect(heading.closest('[aria-hidden="true"]')).toBeNull();
  });

  it("flips data-motion to static under the reducedMotion prop", () => {
    const { container: animated } = render(<CursorComet seed={7} />);
    expect(root(animated)?.getAttribute("data-motion")).toBe("animated");
    cleanup();
    const { container: still } = render(<CursorComet seed={7} reducedMotion />);
    expect(root(still)?.getAttribute("data-motion")).toBe("static");
  });

  it("wires the data-paused attribute", () => {
    const { container } = render(<CursorComet seed={3} />);
    expect(root(container)?.getAttribute("data-paused")).toBeTruthy();
  });

  it("does not throw when the 2d context is unavailable (jsdom)", () => {
    // jsdom's canvas returns null from getContext — the component must no-op draw.
    expect(() => {
      const { unmount } = render(<CursorComet seed={9} particleBudget={600} />);
      unmount();
    }).not.toThrow();
  });

  it("tracks pointer and touch input without throwing", () => {
    const { container } = render(<CursorComet seed={4} />);
    const el = root(container) as HTMLElement;
    expect(() => {
      fireEvent.pointerMove(el, { clientX: 20, clientY: 30 });
      fireEvent.pointerMove(el, { clientX: 300, clientY: 90 });
      fireEvent.pointerDown(el, { clientX: 310, clientY: 95, pointerType: "touch" });
      fireEvent.pointerLeave(el);
      fireEvent.pointerCancel(el);
    }).not.toThrow();
  });

  it("mounts and unmounts cleanly across prop variations", () => {
    expect(() => {
      const a = render(<CursorComet seed={2} idleOrbit={false} velocityGain={0} drag={6} sparkThreshold={200} />);
      a.unmount();
      const b = render(<CursorComet seed={5} reducedMotion particleBudget={24} headColor="#fff" tailColor="#0ff" sparkColor="#f00" />);
      b.unmount();
    }).not.toThrow();
  });
});
