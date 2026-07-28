import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LiquidFillHeadline } from "./liquid-fill-headline";

afterEach(cleanup);

/**
 * The pour is a per-frame clip-path rebuild (rAF is inert in jsdom), so these
 * tests pin the CONTRACT: one readable string for AT behind an aria-hidden
 * four-layer stack, reduced motion rendering a fully-poured headline, the
 * controlled `level` path, and the clip-path (never an SVG luminance mask)
 * technique the component depends on.
 */
describe("LiquidFillHeadline", () => {
  const TEXT = "Set it in motion";
  const stack = (c: HTMLElement) => c.querySelector('[aria-hidden="true"]');
  const layers = (c: HTMLElement) => Array.from(stack(c)?.children ?? []) as HTMLElement[];

  it("exposes the real string once and hides the layered headline from AT", () => {
    const { container } = render(<LiquidFillHeadline text={TEXT} />);
    expect(container.querySelector(".sr-only")?.textContent).toBe(TEXT);
    expect(stack(container)).not.toBeNull();
    // outline + back + fill + shimmer
    expect(layers(container).length).toBe(4);
    expect(layers(container).every((el) => el.textContent === TEXT)).toBe(true);
  });

  it("drops the shimmer layer when shimmer is off", () => {
    const { container } = render(<LiquidFillHeadline text={TEXT} shimmer={false} />);
    expect(layers(container).length).toBe(3);
  });

  it("renders a fully poured, static headline under the reducedMotion prop", () => {
    const { container } = render(<LiquidFillHeadline text={TEXT} reducedMotion />);
    expect(container.querySelector("[data-motion]")?.getAttribute("data-motion")).toBe("static");
    const [, back, fill, shine] = layers(container);
    expect(fill.style.clipPath).toBe("none");
    expect(back.style.clipPath).toContain("polygon");
    expect(shine.style.opacity).toBe("0");
  });

  it("clips with clip-path polygons, never an SVG luminance mask", () => {
    const { container } = render(<LiquidFillHeadline text={TEXT} level={0.5} reducedMotion />);
    const fill = layers(container)[2];
    expect(fill.style.clipPath).toContain("polygon(");
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector("mask")).toBeNull();
  });

  it("marks itself controlled when a level is supplied, and maps 0/1 to empty/full", () => {
    const { container, rerender } = render(<LiquidFillHeadline text={TEXT} level={0} reducedMotion />);
    expect(container.querySelector("[data-controlled]")?.getAttribute("data-controlled")).toBe("true");
    const empty = layers(container)[2].style.clipPath;
    rerender(<LiquidFillHeadline text={TEXT} level={1} reducedMotion />);
    const full = layers(container)[2].style.clipPath;
    expect(empty).not.toBe(full);
    expect(empty).toContain("108.0%");
    expect(full).toContain("-6.0%");
  });

  it("applies a custom gradient to the liquid", () => {
    const { container } = render(
      <LiquidFillHeadline text={TEXT} gradient={["#112233", "#445566"]} reducedMotion />,
    );
    expect(layers(container)[2].style.backgroundImage).toContain("#112233");
    expect(layers(container)[2].style.backgroundImage).toContain("#445566");
  });

  it("mounts and unmounts cleanly across trigger/loop variations", () => {
    expect(() => {
      const a = render(<LiquidFillHeadline text={TEXT} loop={false} fillMs={800} holdMs={200} />);
      a.unmount();
      cleanup();
      const b = render(<LiquidFillHeadline text={TEXT} trigger="manual" as="h1" amplitude={2} />);
      b.unmount();
    }).not.toThrow();
  });
});
