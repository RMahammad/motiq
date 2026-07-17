import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { QueuePulseLanes, type LaneData } from "./queue-pulse-lanes";

afterEach(cleanup);

const pulseStyles = (c: HTMLElement) =>
  Array.from(c.querySelectorAll(".mk-qpl-pulse")).map((p) => p.getAttribute("style"));
const fills = (c: HTMLElement) => c.querySelectorAll(".mk-qpl-fill").length;
const stops = (c: HTMLElement) => c.querySelectorAll(".mk-qpl-stop").length;

describe("QueuePulseLanes", () => {
  it("renders identical pulse geometry for the same seed (SSR-stable)", () => {
    const a = render(<QueuePulseLanes seed={42} />);
    const first = pulseStyles(a.container);
    cleanup();
    const b = render(<QueuePulseLanes seed={42} />);
    expect(first.length).toBeGreaterThan(0);
    expect(pulseStyles(b.container)).toEqual(first);
  });

  it("reducedMotion renders the static snapshot (no animation class, no pulses, keeps lane fills)", () => {
    const { container } = render(<QueuePulseLanes reducedMotion seed={7} />);
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.className).not.toContain("mk-qpl-animated");
    // No moving pulses …
    expect(container.querySelectorAll(".mk-qpl-pulse").length).toBe(0);
    // … but the snapshot markers (occupancy fill bars) still convey lane state.
    expect(fills(container)).toBeGreaterThan(0);
  });

  it("animates the lanes by default", () => {
    const { container } = render(<QueuePulseLanes seed={7} />);
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.className).toContain("mk-qpl-animated");
    expect(container.querySelectorAll(".mk-qpl-pulse").length).toBeGreaterThan(0);
  });

  it("congestion changes rhythm: a congested lane packs more, slower pulses than a quiet one", () => {
    const lanes: LaneData[] = [
      { id: "quiet", queued: 1, active: 1, completed: 30, capacity: 20 },
      { id: "jammed", queued: 24, active: 6, completed: 10, capacity: 24 },
    ];
    const { container } = render(<QueuePulseLanes lanes={lanes} seed={3} />);
    const laneEls = Array.from(container.querySelectorAll(".mk-qpl-lane"));
    const count = (el: Element) => el.querySelectorAll(".mk-qpl-pulse").length;
    const durOf = (el: Element) => {
      const p = el.querySelector(".mk-qpl-pulse") as HTMLElement | null;
      return Number((p?.style.getPropertyValue("--dur") ?? "0").replace("s", ""));
    };
    const quiet = laneEls.find((l) => l.getAttribute("data-status") !== "congested")!;
    const jammed = laneEls.find((l) => l.getAttribute("data-status") === "congested")!;
    expect(count(jammed)).toBeGreaterThan(count(quiet));
    expect(durOf(jammed)).toBeGreaterThan(durOf(quiet));
  });

  it("marks a blocked lane with a non-color stop cap + glyph (not color alone)", () => {
    const lanes: LaneData[] = [
      { id: "ok", queued: 3, active: 2, completed: 10, capacity: 12 },
      { id: "stuck", queued: 8, active: 0, completed: 5, capacity: 12, blocked: true },
    ];
    const { container } = render(<QueuePulseLanes lanes={lanes} />);
    expect(stops(container)).toBe(1);
    // The blocked lane renders a shape glyph, not just a colored fill.
    const stop = container.querySelector(".mk-qpl-stop")!;
    expect(stop.querySelector(".mk-qpl-glyph")).toBeTruthy();
    // A blocked lane carries no flowing pulses.
    const blockedLane = container.querySelector('.mk-qpl-lane[data-blocked="true"]')!;
    expect(blockedLane.querySelectorAll(".mk-qpl-pulse").length).toBe(0);
  });

  it("pauses the pulses when hidden (data-paused wired)", () => {
    const { container } = render(<QueuePulseLanes seed={3} />);
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.getAttribute("data-paused")).toBeTruthy();
    const style = container.querySelector("style");
    expect(style?.textContent).toContain('[data-paused="true"]');
    expect(style?.textContent).toContain("animation-play-state: paused");
  });

  it("is aria-hidden and keeps children outside the decorative layer", () => {
    const { container, getByText } = render(
      <QueuePulseLanes seed={3}>
        <h2>Readable headline</h2>
      </QueuePulseLanes>,
    );
    const bg = container.querySelector('[aria-hidden="true"]');
    expect(bg?.contains(getByText("Readable headline"))).toBe(false);
  });

  it("runs the lanes full-bleed and places a glass scrim behind the copy (no hard mask edge)", () => {
    const { container, getByText } = render(
      <QueuePulseLanes seed={4} contentPlacement="center">
        <h2>Readable headline</h2>
      </QueuePulseLanes>,
    );
    // The decorative field (first aria-hidden div) is no longer carved away by a
    // CSS mask on the content side — it runs full-bleed.
    const bg = container.querySelector('div[aria-hidden="true"]') as HTMLElement | null;
    expect(bg?.className).toContain("mk-qpl-");
    expect(bg?.style.maskImage).toBe("");
    expect(bg?.style.getPropertyValue("-webkit-mask-image")).toBe("");
    // A frosted-glass scrim sits behind the copy for readability.
    const scrim = container.querySelector(".z-0") as HTMLElement | null;
    expect(scrim).toBeTruthy();
    expect(scrim?.getAttribute("aria-hidden")).toBe("true");
    expect(scrim?.style.backdropFilter || scrim?.style.getPropertyValue("backdrop-filter")).toContain("blur");
    // The copy still lives outside the decorative layer.
    expect(bg?.contains(getByText("Readable headline"))).toBe(false);
  });

  it("renders no scrim when there is no content placement (full-bleed only)", () => {
    const { container } = render(
      <QueuePulseLanes seed={4}>
        <h2>Headline</h2>
      </QueuePulseLanes>,
    );
    expect(container.querySelector(".z-0")).toBeNull();
  });

  it("ships a forced-colors fallback hook", () => {
    const { container } = render(<QueuePulseLanes seed={5} />);
    const style = container.querySelector("style");
    expect(style?.textContent).toContain("forced-colors: active");
    expect(style?.textContent).toContain("CanvasText");
  });
});
