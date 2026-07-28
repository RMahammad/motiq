import { renderToString } from "react-dom/server";
import { render, cleanup } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StickyZoomHero } from "./sticky-zoom-hero";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const STAGES = [
  { caption: "Meet the workspace", body: "Every metric on one calm surface.", label: "framed", at: 0 },
  { caption: "Zoom into the detail", body: "The frame gives way.", label: "zooming", at: 0.34 },
  { caption: "Full bleed, full focus", body: "At 100% the border disappears.", label: "full bleed", at: 0.7 },
];

const hero = <div data-testid="hero">Render overview</div>;

describe("StickyZoomHero", () => {
  it("renders the hero scene and every caption beat", () => {
    const { getByTestId, getByText } = render(<StickyZoomHero stages={STAGES}>{hero}</StickyZoomHero>);
    expect(getByTestId("hero")).toBeTruthy();
    for (const s of STAGES) expect(getByText(s.caption)).toBeTruthy();
  });

  it("server markup is the settled scene — no zoom transform, every caption present", () => {
    const html = renderToString(<StickyZoomHero stages={STAGES}>{hero}</StickyZoomHero>);
    // Progressive enhancement: without JS the frame is full size and readable.
    expect(html).not.toContain("scale(0.45");
    expect(html).not.toContain("sticky");
    for (const s of STAGES) expect(html).toContain(s.caption);
    expect(html).toContain("Render overview");
  });

  it("flips data-motion to static under the reducedMotion prop and keeps captions in flow", () => {
    const { container } = render(
      <StickyZoomHero stages={STAGES} reducedMotion>
        {hero}
      </StickyZoomHero>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-motion")).toBe("static");
    // No caption is faded out — the final states are all readable.
    const captions = Array.from(container.querySelectorAll<HTMLElement>("[data-zoom-caption]"));
    expect(captions).toHaveLength(STAGES.length);
    captions.forEach((el) => {
      expect(el.style.opacity).toBe("");
      expect(el.style.transform).toBe("");
    });
    // Static mode is plain content: no scroll trap at all.
    expect(container.querySelector('[role="region"]')).toBeNull();
  });

  it("container mode exposes a keyboard-scrollable, overscroll-contained region", () => {
    const { container } = render(
      <StickyZoomHero stages={STAGES} scrollMode="container" height={400}>
        {hero}
      </StickyZoomHero>,
    );
    const region = container.querySelector<HTMLElement>('[role="region"]');
    expect(region).not.toBeNull();
    expect(region?.tabIndex).toBe(0);
    expect(region?.getAttribute("aria-label")).toBeTruthy();
    expect(region?.className).toContain("overscroll-contain");
    expect(region?.className).toContain("overflow-y-auto");
  });

  it("page mode never creates an internal scroll container (no scroll jacking)", () => {
    const { container } = render(
      <StickyZoomHero stages={STAGES} scrollMode="page">
        {hero}
      </StickyZoomHero>,
    );
    expect(container.querySelector('[role="region"]')).toBeNull();
    expect(container.querySelector(".overflow-y-auto")).toBeNull();
    expect((container.firstElementChild as HTMLElement).getAttribute("data-scroll-mode")).toBe("page");
  });

  it("mounts and unmounts cleanly in both modes and does not fire onStageChange on mount", () => {
    const onStageChange = vi.fn();
    expect(() => {
      const { unmount } = render(
        <StickyZoomHero stages={STAGES} onStageChange={onStageChange}>
          {hero}
        </StickyZoomHero>,
      );
      unmount();
    }).not.toThrow();
    cleanup();
    expect(() => {
      const { unmount } = render(
        <StickyZoomHero stages={STAGES} scrollMode="container" vignette={false} showProgress={false}>
          {hero}
        </StickyZoomHero>,
      );
      unmount();
    }).not.toThrow();
    // Stage 0 is the resting stage — nothing "changed" to announce.
    expect(onStageChange).not.toHaveBeenCalled();
  });

  it("has no axe violations in either motion mode", async () => {
    const { container: animated } = render(
      <StickyZoomHero stages={STAGES} scrollMode="container">
        {hero}
      </StickyZoomHero>,
    );
    await noViolations(animated);
    cleanup();
    const { container: still } = render(
      <StickyZoomHero stages={STAGES} reducedMotion>
        {hero}
      </StickyZoomHero>,
    );
    await noViolations(still);
  });
});
