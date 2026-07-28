import { renderToString } from "react-dom/server";
import { render, cleanup } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";

import { DepthParallaxScene, type ParallaxLayer } from "./depth-parallax-scene";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const LAYERS: ParallaxLayer[] = [
  { node: <div data-testid="sky">sky</div>, depth: 0.06 },
  { node: <div data-testid="ridge">ridge</div>, depth: 0.16, blurAtDepth: 2.5 },
  { node: <div data-testid="city">city</div>, depth: 0.32 },
  { node: <div data-testid="cards">cards</div>, depth: 0.78 },
];

const LABEL = "Layered ridge scene with floating cards.";

describe("DepthParallaxScene", () => {
  it("renders every layer node and names the scene once as an image", () => {
    const { container, getByTestId } = render(<DepthParallaxScene layers={LAYERS} label={LABEL} />);
    for (const id of ["sky", "ridge", "city", "cards"]) expect(getByTestId(id)).toBeTruthy();
    const scene = container.querySelector('[role="img"]');
    expect(scene?.getAttribute("aria-label")).toBe(LABEL);
  });

  it("marks every layer decorative so the scene reads as a single image", () => {
    const { container } = render(<DepthParallaxScene layers={LAYERS} label={LABEL} />);
    const scene = container.querySelector('[role="img"]');
    const layers = scene?.querySelectorAll(":scope > div") ?? [];
    expect(layers.length).toBe(LAYERS.length);
    layers.forEach((el) => expect(el.getAttribute("aria-hidden")).toBe("true"));
  });

  it("server markup is the centered composition — no transforms, no blur", () => {
    const html = renderToString(<DepthParallaxScene layers={LAYERS} label={LABEL} />);
    expect(html).not.toContain("translate3d");
    expect(html).not.toContain("blur(");
    expect(html).toContain(LABEL);
  });

  it("flips data-motion to static under the reducedMotion prop and leaves layers untransformed", () => {
    const { container } = render(<DepthParallaxScene layers={LAYERS} reducedMotion label={LABEL} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-motion")).toBe("static");
    container.querySelectorAll<HTMLElement>('[aria-hidden="true"]').forEach((el) => {
      expect(el.style.transform).toBe("");
      expect(el.style.filter).toBe("");
    });
    expect(container.querySelector('[role="region"]')).toBeNull();
  });

  it("container mode adds a keyboard-scrollable, overscroll-contained stage", () => {
    const { container } = render(
      <DepthParallaxScene layers={LAYERS} scrollMode="container" height={320} scrollLength={3} label={LABEL} />,
    );
    const region = container.querySelector<HTMLElement>('[role="region"]');
    expect(region).not.toBeNull();
    expect(region?.tabIndex).toBe(0);
    expect(region?.className).toContain("overscroll-contain");
    // Lead-in and lead-out spacers bracket the scene so it travels through the stage.
    expect(region?.querySelectorAll(':scope > [aria-hidden="true"]').length).toBe(2);
  });

  it("page mode creates no scroll container of its own", () => {
    const { container } = render(<DepthParallaxScene layers={LAYERS} scrollMode="page" label={LABEL} />);
    expect(container.querySelector('[role="region"]')).toBeNull();
    expect(container.querySelector(".overflow-y-auto")).toBeNull();
  });

  it("mounts and unmounts cleanly across modes and option combinations", () => {
    expect(() => {
      const { unmount } = render(
        <DepthParallaxScene layers={LAYERS} pointer={false} depthOfField={false} ambientDrift={false} label={LABEL} />,
      );
      unmount();
    }).not.toThrow();
    cleanup();
    expect(() => {
      const { unmount } = render(
        <DepthParallaxScene layers={LAYERS} scrollMode="container" range={90} pointerStrength={10} label={LABEL} />,
      );
      unmount();
    }).not.toThrow();
  });

  it("has no axe violations in either motion mode", async () => {
    const { container: animated } = render(<DepthParallaxScene layers={LAYERS} scrollMode="container" label={LABEL} />);
    await noViolations(animated);
    cleanup();
    const { container: still } = render(<DepthParallaxScene layers={LAYERS} reducedMotion label={LABEL} />);
    await noViolations(still);
  });
});
