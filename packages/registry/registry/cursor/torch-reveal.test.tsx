import { render, cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TorchReveal } from "./torch-reveal";

afterEach(cleanup);

const front = (
  <div>
    <h3>Ship the interface</h3>
    <button type="button">Start deploying</button>
  </div>
);
const reveal = (
  <div>
    <span>radius 10 · pad 9/16</span>
  </div>
);

/**
 * The reveal is a CSS alpha mask driven by custom properties — SVG luminance
 * masks with gradient content silently no-op in Chromium, so that is pinned as a
 * regression guard here. The rest is the a11y contract: the finished layer is the
 * only one AT reads, and reduced motion must land on a designed static state.
 */
describe("TorchReveal", () => {
  const root = (c: HTMLElement) => c.querySelector("[data-motion]");
  const maskLayer = (c: HTMLElement) =>
    Array.from(c.querySelectorAll<HTMLElement>('[aria-hidden="true"]')).find((el) =>
      el.textContent?.includes("radius 10"),
    );

  it("keeps the finished layer readable and the reveal twin aria-hidden", () => {
    const { container } = render(<TorchReveal front={front} reveal={reveal} />);
    expect(screen.getByRole("heading", { name: "Ship the interface" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start deploying" })).toBeTruthy();
    const layer = maskLayer(container);
    expect(layer).toBeTruthy();
    expect(layer?.className).toContain("pointer-events-none");
  });

  it("masks with a CSS radial-gradient alpha mask, never an SVG luminance mask", () => {
    const { container } = render(<TorchReveal front={front} reveal={reveal} />);
    const layer = maskLayer(container);
    const mask = layer?.style.maskImage || layer?.style.getPropertyValue("-webkit-mask-image") || "";
    expect(mask).toContain("radial-gradient");
    expect(mask).toContain("--mk-tr");
    expect(container.querySelector("mask")).toBeNull();
  });

  it("flips data-motion to static under the reducedMotion prop and lands on the split view", () => {
    const { container: animated } = render(<TorchReveal front={front} reveal={reveal} />);
    expect(root(animated)?.getAttribute("data-motion")).toBe("animated");
    cleanup();
    const { container: still } = render(<TorchReveal front={front} reveal={reveal} reducedMotion />);
    expect(root(still)?.getAttribute("data-motion")).toBe("static");
    expect(root(still)?.getAttribute("data-fallback")).toBe("split");
    const layer = maskLayer(still);
    expect(layer?.style.clipPath).toContain("inset(0 0 0 55%)");
    expect(layer?.style.maskImage).toBe("");
  });

  it('hides the reveal layer entirely when reducedFallback is "off"', () => {
    const { container } = render(<TorchReveal front={front} reveal={reveal} reducedMotion reducedFallback="off" />);
    expect(maskLayer(container)).toBeUndefined();
    expect(screen.getByRole("heading", { name: "Ship the interface" })).toBeTruthy();
  });

  it("softness maps to the mask's opaque core stop", () => {
    const { container } = render(<TorchReveal front={front} reveal={reveal} softness={0.2} />);
    expect(maskLayer(container)?.style.maskImage).toContain("80%");
  });

  it("wires data-paused and tracks pointer/touch input without throwing", () => {
    const { container } = render(<TorchReveal front={front} reveal={reveal} seed={4} />);
    const el = root(container) as HTMLElement;
    expect(el.getAttribute("data-paused")).toBeTruthy();
    expect(() => {
      fireEvent.pointerMove(el, { clientX: 120, clientY: 80 });
      fireEvent.pointerDown(el, { clientX: 122, clientY: 82, pointerType: "touch" });
      fireEvent.pointerLeave(el);
    }).not.toThrow();
  });

  it("mounts and unmounts cleanly across prop variations", () => {
    expect(() => {
      const a = render(
        <TorchReveal front={front} reveal={reveal} radius={90} flicker={0} idlePatrol={false} lag={{ stiffness: 400, damping: 30 }} />,
      );
      a.unmount();
      const b = render(<TorchReveal front={front} reveal={reveal} reducedMotion seed={11} revealClassName="bg-black" />);
      b.unmount();
    }).not.toThrow();
  });
});
