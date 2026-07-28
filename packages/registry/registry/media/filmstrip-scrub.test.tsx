import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FilmstripScrub, type FilmstripFrame } from "./filmstrip-scrub";

afterEach(cleanup);

const frames: FilmstripFrame[] = [
  { id: "f0", src: "/0.png", alt: "Valley at dawn", label: "dawn" },
  { id: "f1", src: "/1.png", alt: "Valley in the morning", label: "morning" },
  { id: "f2", src: "/2.png", alt: "Valley at midday", label: "midday" },
  { id: "f3", src: "/3.png", alt: "Valley at dusk", label: "dusk" },
];

/**
 * Playhead physics is rAF work jsdom can't measure, so these tests pin the
 * CONTRACT: the strip is a real slider with a full keyboard path, frames carry
 * alt text, controlled/uncontrolled selection both work, and the still variant
 * stays scrubbable.
 */
describe("FilmstripScrub", () => {
  const slider = () => screen.getByRole("slider");

  it("exposes the strip as a slider over the frame range", () => {
    render(<FilmstripScrub frames={frames} scrubberLabel="Valley timeline" />);
    const el = slider();
    expect(el.getAttribute("aria-label")).toBe("Valley timeline");
    expect(el.getAttribute("aria-valuemin")).toBe("0");
    expect(el.getAttribute("aria-valuemax")).toBe("3");
    expect(el.getAttribute("aria-valuenow")).toBe("0");
    expect(el.getAttribute("aria-valuetext")).toBe("Frame 1 of 4, dawn");
    expect(el.tabIndex).toBe(0);
  });

  it("steps one frame per arrow key and jumps with Home/End", () => {
    const onChange = vi.fn();
    render(<FilmstripScrub frames={frames} onFrameIndexChange={onChange} />);
    const el = slider();

    fireEvent.keyDown(el, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(1);
    expect(slider().getAttribute("aria-valuenow")).toBe("1");

    fireEvent.keyDown(el, { key: "End" });
    expect(slider().getAttribute("aria-valuenow")).toBe("3");

    fireEvent.keyDown(el, { key: "Home" });
    expect(slider().getAttribute("aria-valuenow")).toBe("0");

    // Unhandled keys pass straight through to the page.
    expect(fireEvent.keyDown(el, { key: "a" })).toBe(true);
  });

  it("honours a controlled frameIndex", () => {
    const onChange = vi.fn();
    const { rerender } = render(<FilmstripScrub frames={frames} frameIndex={2} onFrameIndexChange={onChange} />);
    expect(slider().getAttribute("aria-valuenow")).toBe("2");
    fireEvent.keyDown(slider(), { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(3);
    expect(slider().getAttribute("aria-valuenow")).toBe("2");
    rerender(<FilmstripScrub frames={frames} frameIndex={3} onFrameIndexChange={onChange} />);
    expect(slider().getAttribute("aria-valuenow")).toBe("3");
  });

  it("renders the preview frames with alt text and keeps thumbnails decorative", () => {
    const { container } = render(<FilmstripScrub frames={frames} />);
    expect(screen.getByAltText("Valley at dawn")).toBeTruthy();
    // Every strip thumbnail is a decorative duplicate of a preview frame.
    const thumbs = container.querySelectorAll('[data-active]');
    expect(thumbs).toHaveLength(frames.length);
    thumbs.forEach((t) => expect(t.getAttribute("aria-hidden")).toBe("true"));
    expect(container.querySelector('[data-active="true"]')).not.toBeNull();
  });

  it("stays scrubbable with no autoplay and no spring under reducedMotion", () => {
    const { container } = render(<FilmstripScrub frames={frames} reducedMotion defaultFrameIndex={1} />);
    expect(container.firstElementChild?.getAttribute("data-motion")).toBe("static");
    expect(slider().getAttribute("aria-valuenow")).toBe("1");
    fireEvent.keyDown(slider(), { key: "ArrowRight" });
    expect(slider().getAttribute("aria-valuenow")).toBe("2");
  });

  it("mounts and unmounts cleanly, including with a single frame", () => {
    expect(() => {
      const a = render(<FilmstripScrub frames={frames} idleSpeed={0} loop={false} hoverScrub={false} fps={30} />);
      a.unmount();
      cleanup();
      const b = render(<FilmstripScrub frames={[frames[0]]} />);
      b.unmount();
    }).not.toThrow();
  });
});
