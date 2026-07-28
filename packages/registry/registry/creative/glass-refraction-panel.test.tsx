import { render, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { GlassRefractionPanel } from "./glass-refraction-panel";

afterEach(cleanup);

/**
 * Canvas output can't be asserted in jsdom (getContext("2d") returns null), so
 * these tests pin the CONTRACT: the scene is decorative, all real content keeps
 * normal semantics, the still state is prop-reachable, and the null context is
 * guarded so the component still renders its markup.
 */
describe("GlassRefractionPanel", () => {
  it("renders a decorative canvas and keeps content out of it", () => {
    const { container, getByRole } = render(
      <GlassRefractionPanel>
        <h3>Everything ships free</h3>
        <button type="button">Browse the catalog</button>
      </GlassRefractionPanel>,
    );
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas?.getAttribute("aria-hidden")).toBe("true");
    const decorative = Array.from(container.querySelectorAll('[aria-hidden="true"]'));
    expect(decorative.some((d) => d.contains(getByRole("button", { name: "Browse the catalog" })))).toBe(false);
  });

  it("renders extra glass layers at their own depths", () => {
    const { getByText } = render(
      <GlassRefractionPanel
        layers={[
          { id: "a", node: <span>4,900+ installs</span>, depth: 26, position: { top: "13%", left: "8%" } },
          { id: "b", node: <span>128 components</span>, depth: 9, position: { bottom: "12%", right: "7%" } },
        ]}
      >
        <h3>Main pane</h3>
      </GlassRefractionPanel>,
    );
    expect(getByText("4,900+ installs")).toBeTruthy();
    expect(getByText("128 components")).toBeTruthy();
  });

  it("flips data-motion to static under the reducedMotion prop", () => {
    const { container: animated } = render(<GlassRefractionPanel />);
    expect(animated.firstElementChild?.getAttribute("data-motion")).toBe("animated");
    cleanup();
    const { container: still } = render(<GlassRefractionPanel reducedMotion />);
    expect(still.firstElementChild?.getAttribute("data-motion")).toBe("static");
  });

  it("does not sweep the entrance streak under reduced motion", () => {
    const { container } = render(<GlassRefractionPanel reducedMotion />);
    expect(container.querySelector(".mk-glass-streak")).toBeNull();
  });

  it("does not throw when the 2d context is unavailable (jsdom)", () => {
    // jsdom's canvas returns null from getContext — the component must no-op draw.
    expect(() => {
      const { unmount } = render(<GlassRefractionPanel scene="none" />);
      unmount();
    }).not.toThrow();
  });

  it("tracks the pointer for parallax without throwing, and can disable it", () => {
    const { container, unmount } = render(<GlassRefractionPanel blur={24} parallax={1.4} tint="rgba(255,255,255,0.1)" />);
    const root = container.firstElementChild;
    expect(() => {
      if (root) {
        fireEvent.pointerMove(root, { clientX: 120, clientY: 80 });
        fireEvent.pointerLeave(root);
      }
      unmount();
    }).not.toThrow();
    cleanup();
    expect(() => {
      const off = render(<GlassRefractionPanel parallax={0} streakOnEnter={false} minHeight={240} />);
      off.unmount();
    }).not.toThrow();
  });
});
