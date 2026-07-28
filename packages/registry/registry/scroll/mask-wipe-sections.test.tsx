import { renderToString } from "react-dom/server";
import { render, cleanup } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";

import { MaskWipeSections, type WipeSection } from "./mask-wipe-sections";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const SECTIONS: WipeSection[] = [
  { node: <p>Start with the motion, not the mockup</p>, label: "draft" },
  { node: <p>One rAF loop, delta-time everywhere</p>, wipe: "sweep", label: "angled sweep" },
  { node: <p>Registry-first, install in one line</p>, wipe: "iris", label: "iris" },
  { node: <p>Measure the feel, keep the receipts</p>, wipe: "curtain", label: "curtain" },
];

describe("MaskWipeSections", () => {
  it("renders every chapter's content", () => {
    const { getByText } = render(<MaskWipeSections sections={SECTIONS} />);
    expect(getByText("Start with the motion, not the mockup")).toBeTruthy();
    expect(getByText("One rAF loop, delta-time everywhere")).toBeTruthy();
    expect(getByText("Registry-first, install in one line")).toBeTruthy();
    expect(getByText("Measure the feel, keep the receipts")).toBeTruthy();
  });

  it("server markup carries no clip-path, so every chapter is readable without JS", () => {
    const html = renderToString(<MaskWipeSections sections={SECTIONS} />);
    expect(html).not.toContain("clip-path");
    expect(html).not.toContain("polygon(");
    expect(html).toContain("Measure the feel, keep the receipts");
  });

  it("reduced motion collapses the sticky stack into plain stacked sections", () => {
    const { container } = render(<MaskWipeSections sections={SECTIONS} reducedMotion />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-motion")).toBe("static");
    container.querySelectorAll<HTMLElement>("div").forEach((el) => {
      expect(el.style.clipPath).toBe("");
    });
    // Edge glows, the ring, and the HUD are motion-only chrome.
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector('[role="region"]')).toBeNull();
  });

  it("draws the iris ring as an SVG circle so the stroke never scales with the reveal", () => {
    // Regression guard: a bordered element scaled to the clip radius thickens its
    // border as it grows. The ring is two SVG circles whose `r` is animated instead.
    const { container } = render(<MaskWipeSections sections={SECTIONS} scrollMode="container" height={400} />);
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(2);
    const widths = Array.from(circles).map((c) => c.getAttribute("stroke-width"));
    expect(widths).toEqual(["10", "2.5"]);
    circles.forEach((c) => {
      expect(Number(c.getAttribute("r"))).toBe(0);
      // No transform on the ring — growth is the radius attribute, not a scale.
      expect((c as SVGCircleElement).style.transform).toBe("");
    });
  });

  it("container mode exposes a keyboard-scrollable, overscroll-contained region", () => {
    const { container } = render(<MaskWipeSections sections={SECTIONS} scrollMode="container" height={400} />);
    const region = container.querySelector<HTMLElement>('[role="region"]');
    expect(region).not.toBeNull();
    expect(region?.tabIndex).toBe(0);
    expect(region?.getAttribute("aria-label")).toBeTruthy();
    expect(region?.className).toContain("overscroll-contain");
  });

  it("page mode creates no internal scroll container", () => {
    const { container } = render(<MaskWipeSections sections={SECTIONS} scrollMode="page" />);
    expect(container.querySelector('[role="region"]')).toBeNull();
    expect(container.querySelector(".overflow-y-auto")).toBeNull();
  });

  it("mounts and unmounts cleanly with edge glow off and a single section", () => {
    expect(() => {
      const { unmount } = render(<MaskWipeSections sections={SECTIONS} edgeGlow={false} showProgress={false} />);
      unmount();
    }).not.toThrow();
    cleanup();
    expect(() => {
      const { unmount } = render(<MaskWipeSections sections={[SECTIONS[0]]} scrollMode="container" />);
      unmount();
    }).not.toThrow();
  });

  it("has no axe violations in either motion mode", async () => {
    const { container: animated } = render(<MaskWipeSections sections={SECTIONS} scrollMode="container" />);
    await noViolations(animated);
    cleanup();
    const { container: still } = render(<MaskWipeSections sections={SECTIONS} reducedMotion />);
    await noViolations(still);
  });
});
