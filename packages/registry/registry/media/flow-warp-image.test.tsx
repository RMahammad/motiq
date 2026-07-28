import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FlowWarpImage } from "./flow-warp-image";

afterEach(cleanup);

/**
 * The mesh is canvas work jsdom cannot measure (getContext("2d") returns null),
 * so these tests pin the CONTRACT: the picture is described, the pointer effect
 * has a keyboard equivalent, decoration stays out of the accessibility tree, and
 * the still variant never starts a loop.
 */
describe("FlowWarpImage", () => {
  it("exposes the surface as a labelled image with a keyboard affordance", () => {
    render(<FlowWarpImage alt="Ridgeline at dusk" />);
    const img = screen.getByRole("img");
    expect(img.getAttribute("aria-label")).toContain("Ridgeline at dusk");
    expect(img.getAttribute("aria-label")).toContain("arrow keys");
    expect(img.tabIndex).toBe(0);
  });

  it("treats an empty alt as decoration: hidden from AT and not focusable", () => {
    const { container } = render(<FlowWarpImage alt="" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.getAttribute("role")).toBeNull();
    expect(root.hasAttribute("tabindex")).toBe(false);
  });

  it("keeps the canvas aria-hidden and survives a null 2d context (jsdom)", () => {
    expect(() => {
      const { container, unmount } = render(<FlowWarpImage alt="Ridgeline" />);
      const canvas = container.querySelector("canvas");
      expect(canvas).not.toBeNull();
      expect(canvas?.getAttribute("aria-hidden")).toBe("true");
      unmount();
    }).not.toThrow();
  });

  it("handles arrow keys and Space as the ripple/splash keyboard equivalent", () => {
    render(<FlowWarpImage alt="Ridgeline" />);
    const img = screen.getByRole("img");
    for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "]) {
      const handled = fireEvent.keyDown(img, { key });
      // fireEvent returns false once a handler called preventDefault().
      expect(handled).toBe(false);
    }
    // Unrelated keys are left alone so the page keeps its own shortcuts.
    expect(fireEvent.keyDown(img, { key: "a" })).toBe(true);
  });

  it("flips data-motion to static and drops the tab stop under reducedMotion", () => {
    const { container } = render(<FlowWarpImage alt="Ridgeline" reducedMotion />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-motion")).toBe("static");
    expect(root.hasAttribute("tabindex")).toBe(false);
  });

  it("mounts and unmounts cleanly across grid/spring/source variations", () => {
    expect(() => {
      const a = render(<FlowWarpImage alt="A" grid={[12, 8]} stiffness={140} damping={12} radius={90} strength={1.4} />);
      a.unmount();
      cleanup();
      const b = render(<FlowWarpImage alt="B" src="/photo.jpg" splashOnLeave={false} idleWave={false} seed={99} />);
      b.unmount();
    }).not.toThrow();
  });
});
