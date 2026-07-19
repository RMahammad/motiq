import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { EventPropagationMatrix, type EventData } from "./event-propagation-matrix";

afterEach(cleanup);

const pulses = (c: HTMLElement) =>
  Array.from(c.querySelectorAll(".mk-epm-pulse")).map((p) => `${p.getAttribute("cx")},${p.getAttribute("cy")}`);
const glyphPaths = (c: HTMLElement) =>
  Array.from(c.querySelectorAll("path.mk-epm-glyph")).map((p) => p.getAttribute("d") ?? "");

describe("EventPropagationMatrix", () => {
  it("renders identical cell geometry for the same seed (SSR-stable)", () => {
    const a = render(<EventPropagationMatrix seed={42} />);
    const first = pulses(a.container);
    cleanup();
    const b = render(<EventPropagationMatrix seed={42} />);
    expect(first.length).toBeGreaterThan(0);
    expect(pulses(b.container)).toEqual(first);
  });

  it("reducedMotion renders the static variant AND still shows lit relationship cells", () => {
    const { container } = render(<EventPropagationMatrix reducedMotion seed={7} />);
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.className).not.toContain("mk-epm-animated");
    // The current relationships are still drawn (origins + propagated cells).
    expect(container.querySelectorAll(".mk-epm-pulse").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".mk-epm-origin").length).toBeGreaterThan(0);
  });

  it("animates propagation by default", () => {
    const { container } = render(<EventPropagationMatrix seed={7} />);
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.className).toContain("mk-epm-animated");
    expect(container.querySelectorAll(".mk-epm-pulse").length).toBeGreaterThan(0);
  });

  it("propagation follows the matrix grid (cells align to grid intersections)", () => {
    const events: EventData[] = [
      { id: "e", origin: { row: 2, col: 3 }, severity: "warning", direction: "out" },
    ];
    const { container } = render(<EventPropagationMatrix events={events} rows={6} cols={10} />);
    const grid = container.querySelectorAll(".mk-epm-grid");
    // Vertical lane x-coordinates the pulses must snap to.
    const laneX = new Set(
      Array.from(grid)
        .filter((l) => l.getAttribute("data-c") !== null)
        .map((l) => l.getAttribute("x1")),
    );
    const cells = Array.from(container.querySelectorAll(".mk-epm-pulse"));
    expect(cells.length).toBeGreaterThan(0);
    // Every propagated cell sits on a grid lane — a wave through the matrix, not
    // a free-space circle.
    for (const cell of cells) expect(laneX.has(cell.getAttribute("cx"))).toBe(true);
  });

  it("marks a failed event with a non-color glyph (× cross), not color alone", () => {
    const events: EventData[] = [
      { id: "boom", origin: { row: 2, col: 4 }, severity: "critical", direction: "out", failed: true },
    ];
    const { container } = render(<EventPropagationMatrix events={events} />);
    const paths = glyphPaths(container);
    // The × glyph is a single path with two line segments (two "l" commands).
    const hasCross = paths.some((d) => (d.match(/ l /g) ?? []).length >= 2);
    expect(hasCross).toBe(true);
  });

  it("dims acknowledged events behind a check glyph", () => {
    const events: EventData[] = [
      { id: "ok", origin: { row: 1, col: 1 }, severity: "warning", acknowledged: true },
    ];
    const { container } = render(<EventPropagationMatrix events={events} />);
    // An acknowledged origin still renders a status glyph (a check path).
    expect(glyphPaths(container).length).toBeGreaterThan(0);
  });

  it("pauses propagation when hidden (data-paused wired)", () => {
    const { container } = render(<EventPropagationMatrix seed={3} />);
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.getAttribute("data-paused")).toBeTruthy();
    const style = container.querySelector("style");
    expect(style?.textContent).toContain('[data-paused="true"]');
    expect(style?.textContent).toContain("animation-play-state: paused");
  });

  it("is aria-hidden and keeps children outside the decorative layer", () => {
    const { container, getByText } = render(
      <EventPropagationMatrix seed={3}>
        <h2>Readable headline</h2>
      </EventPropagationMatrix>,
    );
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.contains(getByText("Readable headline"))).toBe(false);
  });

  it("ships a forced-colors fallback hook", () => {
    const { container } = render(<EventPropagationMatrix seed={5} />);
    const style = container.querySelector("style");
    expect(style?.textContent).toContain("forced-colors: active");
    expect(style?.textContent).toContain("CanvasText");
  });

  it("keeps the matrix full-bleed and adds a glass scrim behind the copy (no hard mask cut)", () => {
    // New composition: the decorative field runs full-bleed (no CSS mask that would
    // cut it off), and a frosted-glass scrim sits behind the copy instead.
    const withPlacement = render(
      <EventPropagationMatrix contentPlacement="left" seed={9}>
        <h2>Readable headline</h2>
      </EventPropagationMatrix>,
    );
    // The full-bleed matrix layer (the one holding the SVG) carries NO mask.
    const bg = withPlacement.container.querySelector<HTMLElement>('svg')?.closest<HTMLElement>('[aria-hidden="true"]');
    expect(bg?.style.maskImage || "").toBe("");
    // A scrim element (feathered backdrop blur) is rendered behind the copy.
    const scrim = Array.from(withPlacement.container.querySelectorAll<HTMLElement>("div[aria-hidden]")).find(
      (d) => (d.style.backdropFilter || d.style.getPropertyValue("backdrop-filter") || d.style.getPropertyValue("-webkit-backdrop-filter")).includes("blur"),
    );
    expect(scrim).toBeTruthy();
    const withHistory = withPlacement.container.querySelectorAll(".mk-epm-history circle, .mk-epm-history path.mk-epm-glyph").length;
    cleanup();

    // Without a placement there is no scrim and no mask — the raw full-bleed field.
    const noPlacement = render(<EventPropagationMatrix contentPlacement="none" seed={9} />);
    const plainBg = noPlacement.container.querySelector<HTMLElement>('[aria-hidden="true"]');
    expect(plainBg?.style.maskImage || "").toBe("");
    const noScrim = Array.from(noPlacement.container.querySelectorAll<HTMLElement>("div[aria-hidden]")).find(
      (d) => (d.style.backdropFilter || d.style.getPropertyValue("backdrop-filter")).includes("blur"),
    );
    expect(noScrim).toBeFalsy();
    const fullHistory = noPlacement.container.querySelectorAll(".mk-epm-history circle, .mk-epm-history path.mk-epm-glyph").length;

    // The left safe region still suppresses the history ticks behind the copy, so
    // no text collides even though the field is now full-bleed.
    expect(fullHistory).toBeGreaterThan(0);
    expect(withHistory).toBeLessThan(fullHistory);
  });

  it("emits a smaller matrix on mobile (hides outer lanes/rows)", () => {
    const { container } = render(<EventPropagationMatrix seed={5} rows={6} cols={10} />);
    const style = container.querySelector("style");
    expect(style?.textContent).toContain("max-width: 640px");
    expect(style?.textContent).toContain('[data-c="6"]');
  });
});
