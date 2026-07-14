import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LuminousTopography } from "./luminous-topography";

afterEach(cleanup);

const paths = (c: HTMLElement) =>
  Array.from(c.querySelectorAll("path[data-lt-path]")).map((p) => p.getAttribute("d"));

describe("LuminousTopography", () => {
  it("generates identical contour geometry for the same seed (SSR-stable)", () => {
    const a = render(<LuminousTopography seed={42} />);
    const first = paths(a.container);
    cleanup();
    const b = render(<LuminousTopography seed={42} />);
    const second = paths(b.container);

    expect(first.length).toBeGreaterThan(0);
    expect(second).toEqual(first);
  });

  it("changing the seed changes the geometry", () => {
    const a = render(<LuminousTopography seed={1} />);
    const one = paths(a.container);
    cleanup();
    const b = render(<LuminousTopography seed={2} />);
    const two = paths(b.container);
    expect(two).not.toEqual(one);
  });

  it("reducedMotion renders the static variant (no animation class)", () => {
    const { container } = render(<LuminousTopography reducedMotion seed={7} />);
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg).toBeTruthy();
    expect(bg?.className).not.toContain("mk-lt-animated");
  });

  it("animates by default (animation class present)", () => {
    const { container } = render(<LuminousTopography seed={7} />);
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.className).toContain("mk-lt-animated");
  });

  it("the decorative background layer is aria-hidden and children stay outside it", () => {
    const { container, getByText } = render(
      <LuminousTopography seed={3}>
        <h2>Readable headline</h2>
      </LuminousTopography>,
    );
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg).toBeTruthy();
    expect(bg?.contains(getByText("Readable headline"))).toBe(false);
  });

  it("ships a forced-colors fallback hook", () => {
    const { container } = render(<LuminousTopography seed={5} />);
    const style = container.querySelector("style");
    expect(style?.textContent).toContain("forced-colors: active");
    expect(style?.textContent).toContain("CanvasText");
  });
});
