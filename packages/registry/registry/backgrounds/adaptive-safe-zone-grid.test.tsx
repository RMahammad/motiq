import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdaptiveSafeZoneGrid } from "./adaptive-safe-zone-grid";

afterEach(cleanup);

const lines = (c: HTMLElement) =>
  Array.from(c.querySelectorAll(".mk-aszg-line")).map(
    (l) =>
      `${l.getAttribute("x1")},${l.getAttribute("y1")},${l.getAttribute("x2")},${l.getAttribute("y2")}:${l.getAttribute("stroke-opacity")}`,
  );

describe("AdaptiveSafeZoneGrid", () => {
  it("renders identical grid geometry for the same seed (SSR-stable)", () => {
    const a = render(<AdaptiveSafeZoneGrid seed={42} />);
    const first = lines(a.container);
    cleanup();
    const b = render(<AdaptiveSafeZoneGrid seed={42} />);
    expect(first.length).toBeGreaterThan(0);
    expect(lines(b.container)).toEqual(first);
  });

  it("reducedMotion renders the static variant (no animation class, no shimmer)", () => {
    const { container } = render(<AdaptiveSafeZoneGrid reducedMotion seed={7} />);
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.className).not.toContain("mk-aszg-animated");
    expect(container.querySelectorAll(".mk-aszg-shimmer").length).toBe(0);
  });

  it("animates the shimmer by default", () => {
    const { container } = render(<AdaptiveSafeZoneGrid seed={7} />);
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.className).toContain("mk-aszg-animated");
    expect(container.querySelectorAll(".mk-aszg-shimmer").length).toBeGreaterThan(0);
  });

  it("uses the multi-zone luminance mask only for an array of safe areas", () => {
    // A single rect reads through the glass scrim → the field stays full-bleed with
    // no luminance-mask ellipse cutting it away.
    const single = render(<AdaptiveSafeZoneGrid seed={3} safeArea={{ x: 0.1, y: 0.2, w: 0.3, h: 0.4 }} />);
    expect(single.container.querySelectorAll(".mk-aszg-safe").length).toBe(0);
    cleanup();
    // An array keeps the multi-zone mask — one ellipse per zone.
    const multi = render(
      <AdaptiveSafeZoneGrid
        seed={3}
        safeArea={[
          { x: 0.06, y: 0.16, w: 0.4, h: 0.5 },
          { x: 0.6, y: 0.55, w: 0.3, h: 0.35 },
        ]}
      />,
    );
    expect(multi.container.querySelectorAll(".mk-aszg-safe").length).toBe(2);
  });

  it("marks highlighted cells with an accent cell rect", () => {
    const { container } = render(
      <AdaptiveSafeZoneGrid seed={3} highlightCells={[{ col: 2, row: 1 }, { col: 5, row: 3 }]} />,
    );
    expect(container.querySelectorAll(".mk-aszg-cell").length).toBe(2);
  });

  it("keeps the field full-bleed and renders a glass scrim behind copy for a placement", () => {
    const placed = render(
      <AdaptiveSafeZoneGrid seed={3} contentPlacement="left">
        <h2>Copy</h2>
      </AdaptiveSafeZoneGrid>,
    );
    // The animated field runs full-bleed — no hard edge-fade mask on the layer.
    const field = placed.container.querySelector('[class*="mk-aszg-"]') as HTMLElement;
    expect(field.style.maskImage || field.style.webkitMaskImage).toBeFalsy();
    // A frosted-glass scrim sits behind the copy (its own z-0 layer).
    expect(placed.container.querySelector(".z-0")).toBeTruthy();
    cleanup();
    // No placement → no scrim.
    const raw = render(
      <AdaptiveSafeZoneGrid seed={3} contentPlacement="none">
        <h2>Copy</h2>
      </AdaptiveSafeZoneGrid>,
    );
    expect(raw.container.querySelector(".z-0")).toBeFalsy();
  });

  it("never renders a highlighted cell behind left-placed content", () => {
    const { container } = render(
      <AdaptiveSafeZoneGrid seed={3} contentPlacement="left" highlightCells={[{ col: 1, row: 3 }]} />,
    );
    expect(container.querySelectorAll(".mk-aszg-cell").length).toBe(0);
  });

  it("pauses the shimmer when hidden (data-paused wired)", () => {
    const { container } = render(<AdaptiveSafeZoneGrid seed={3} />);
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.getAttribute("data-paused")).toBeTruthy();
    const style = container.querySelector("style");
    expect(style?.textContent).toContain('[data-paused="true"]');
  });

  it("is aria-hidden and keeps children outside the decorative layer", () => {
    const { container, getByText } = render(
      <AdaptiveSafeZoneGrid seed={3}>
        <h2>Readable headline</h2>
      </AdaptiveSafeZoneGrid>,
    );
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.contains(getByText("Readable headline"))).toBe(false);
  });

  it("ships a forced-colors fallback hook", () => {
    const { container } = render(<AdaptiveSafeZoneGrid seed={5} />);
    const style = container.querySelector("style");
    expect(style?.textContent).toContain("forced-colors: active");
    expect(style?.textContent).toContain("CanvasText");
  });
});
