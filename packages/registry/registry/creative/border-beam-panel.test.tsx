import { render, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { BorderBeamPanel } from "./border-beam-panel";

afterEach(cleanup);

/**
 * The orbit is a single custom property animated per frame, so these tests pin
 * the CONTRACT: the ring is a CSS alpha mask (never an SVG luminance mask, which
 * silently no-ops in Chromium), decorative layers stay out of the a11y tree, the
 * start angle is seed-deterministic for SSR, and the still state is prop-reachable.
 */
describe("BorderBeamPanel", () => {
  const styleText = (c: HTMLElement) => c.querySelector("style")?.textContent ?? "";

  it("keeps the ring and glow aria-hidden and the content outside them", () => {
    const { container, getByText } = render(
      <BorderBeamPanel>
        <h3>One command, zero setup</h3>
      </BorderBeamPanel>,
    );
    const decorative = Array.from(container.querySelectorAll('[aria-hidden="true"]'));
    expect(decorative.length).toBe(2);
    expect(decorative.some((d) => d.contains(getByText("One command, zero setup")))).toBe(false);
  });

  it("cuts the ring with a CSS alpha mask, not an SVG luminance mask", () => {
    const { container } = render(<BorderBeamPanel />);
    const css = styleText(container);
    expect(css).toContain("mask-composite: exclude");
    expect(css).toContain("-webkit-mask-composite: xor");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("adds the coral signature comet only for the two-beam variant", () => {
    const { container: two } = render(<BorderBeamPanel beams={2} />);
    expect(styleText(two)).toContain("--color-signature");
    cleanup();
    const { container: one } = render(<BorderBeamPanel beams={1} />);
    expect(styleText(one)).not.toContain("--color-signature");
  });

  it("drops the cast-light glow when glow is off", () => {
    const { container } = render(<BorderBeamPanel glow={false} />);
    expect(container.querySelector(".mk-beam-glow")).toBeNull();
    expect(container.querySelector(".mk-beam-ring")).not.toBeNull();
  });

  it("derives a deterministic start angle from the seed (SSR-stable)", () => {
    const angleFor = (seed: number) => {
      const { container } = render(<BorderBeamPanel seed={seed} />);
      const angle = container.querySelector<HTMLElement>("[data-motion]")?.style.getPropertyValue("--mk-beam-a");
      cleanup();
      return angle;
    };
    const a1 = angleFor(4);
    const a2 = angleFor(4);
    const b = angleFor(9);
    expect(a1).toBeTruthy();
    expect(a1).toBe(a2);
    expect(a1).not.toBe(b);
  });

  it("flips data-motion to static under the reducedMotion prop", () => {
    const { container: animated } = render(<BorderBeamPanel />);
    expect(animated.firstElementChild?.getAttribute("data-motion")).toBe("animated");
    cleanup();
    const { container: still } = render(<BorderBeamPanel reducedMotion />);
    expect(still.firstElementChild?.getAttribute("data-motion")).toBe("static");
  });

  it("surges on hover and focus without throwing, and unmounts cleanly", () => {
    const { container, unmount } = render(<BorderBeamPanel hoverSpeed={300} idleSpeed={30} />);
    const root = container.firstElementChild;
    expect(() => {
      if (root) {
        fireEvent.pointerEnter(root);
        fireEvent.focus(root);
        fireEvent.blur(root);
        fireEvent.pointerLeave(root);
      }
      unmount();
    }).not.toThrow();
  });
});
