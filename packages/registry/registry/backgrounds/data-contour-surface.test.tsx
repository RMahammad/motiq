import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  DataContourSurface,
  sampleField,
  type ContourPoint,
} from "./data-contour-surface";

afterEach(cleanup);

describe("sampleField (pure, data-driven)", () => {
  const points: ContourPoint[] = [{ x: 0.5, y: 0.5, value: 1, radius: 0.2 }];

  it("is deterministic — same inputs, same output", () => {
    expect(sampleField(points, 0.5, 0.5)).toBe(sampleField(points, 0.5, 0.5));
    expect(sampleField(points, 0.3, 0.7)).toBe(sampleField(points, 0.3, 0.7));
  });

  it("peaks at a positive point's center and falls off with distance", () => {
    const center = sampleField(points, 0.5, 0.5);
    const away = sampleField(points, 0.9, 0.1);
    expect(center).toBeCloseTo(1, 5);
    expect(center).toBeGreaterThan(away);
  });

  it("responds to supplied data — adding a positive point raises the value at its center", () => {
    const before = sampleField(points, 0.2, 0.2);
    const after = sampleField(
      [...points, { x: 0.2, y: 0.2, value: 0.8, radius: 0.15 }],
      0.2,
      0.2,
    );
    expect(after).toBeGreaterThan(before);
  });

  it("negative pressure lowers the field", () => {
    const v = sampleField([{ x: 0.5, y: 0.5, value: -1, radius: 0.2 }], 0.5, 0.5);
    expect(v).toBeLessThan(0);
  });
});

describe("DataContourSurface", () => {
  it("renders a canvas inside an aria-hidden wrapper", () => {
    const { container } = render(<DataContourSurface />);
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg).toBeTruthy();
    expect(bg?.querySelector("canvas")).toBeTruthy();
  });

  it("keeps children outside the decorative aria-hidden layer", () => {
    const { container, getByText } = render(
      <DataContourSurface>
        <h2>Readable headline</h2>
      </DataContourSurface>,
    );
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.contains(getByText("Readable headline"))).toBe(false);
  });

  it("defaults to animated and flips to static under reducedMotion", () => {
    const { container: a } = render(<DataContourSurface />);
    expect(a.querySelector('[aria-hidden="true"]')?.getAttribute("data-motion")).toBe("animated");
    cleanup();
    const { container: b } = render(<DataContourSurface reducedMotion />);
    expect(b.querySelector('[aria-hidden="true"]')?.getAttribute("data-motion")).toBe("static");
  });

  it("runs the canvas full-bleed (never mask-cut) and adds a glass scrim behind copy", () => {
    // With a placement + copy the field stays full-bleed (no content-side mask)
    // and a frosted-glass scrim sits behind the copy — readability via blur, not a
    // hard cut. The scrim is the aria-hidden, z-0 layer just behind the children.
    const placed = render(
      <DataContourSurface contentPlacement="left">
        <h2>Readable headline</h2>
      </DataContourSurface>,
    );
    const canvas = placed.container.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.style.maskImage || canvas.style.webkitMaskImage).toBeFalsy();
    const scrim = placed.container.querySelector(".z-0");
    expect(scrim).toBeTruthy();
    expect(scrim?.getAttribute("aria-hidden")).toBeTruthy();
    cleanup();
    // No placement → no scrim, and still no mask on the canvas.
    const raw = render(
      <DataContourSurface contentPlacement="none">
        <h2>Readable headline</h2>
      </DataContourSurface>,
    );
    const canvas2 = raw.container.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas2.style.maskImage || canvas2.style.webkitMaskImage).toBeFalsy();
    expect(raw.container.querySelector(".z-0")).toBeFalsy();
  });

  it("wires the offscreen-pause hook (data-paused present)", () => {
    const { container } = render(<DataContourSurface />);
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.getAttribute("data-paused")).toBeTruthy();
  });

  it("ships a forced-colors fallback hook", () => {
    const { container } = render(<DataContourSurface />);
    const style = container.querySelector("style");
    expect(style?.textContent).toContain("forced-colors: active");
    expect(style?.textContent).toContain("CanvasText");
  });

  it("mounts and unmounts without throwing (guards a null 2d context)", () => {
    // jsdom's canvas.getContext returns null — the component must not crash.
    const { unmount } = render(
      <DataContourSurface
        points={[
          { x: 0.3, y: 0.4, value: 1 },
          { x: 0.7, y: 0.6, value: -0.6 },
        ]}
        thresholds={[-0.3, 0.3]}
        activeRegion={{ x: 0.4, y: 0.2, w: 0.4, h: 0.5 }}
        comparisonRegions={[{ x: 0.1, y: 0.1, w: 0.3, h: 0.3 }]}
      />,
    );
    expect(() => unmount()).not.toThrow();
  });

  it("accepts a data change without throwing (transition path)", () => {
    const { rerender } = render(
      <DataContourSurface points={[{ x: 0.3, y: 0.3, value: 1 }]} />,
    );
    expect(() =>
      rerender(<DataContourSurface points={[{ x: 0.7, y: 0.7, value: -1 }]} />),
    ).not.toThrow();
  });
});
