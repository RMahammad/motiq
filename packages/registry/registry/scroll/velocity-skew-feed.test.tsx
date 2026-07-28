import { renderToString } from "react-dom/server";
import { render, cleanup } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";

import { VelocitySkewFeed } from "./velocity-skew-feed";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const ITEMS = [
  <article key="a">Mira Chen approved the release checklist</article>,
  <article key="b">deploy-bot shipped v0.9.4 to production</article>,
  <article key="c">Jonas Weber commented on the parallax RFC</article>,
];

describe("VelocitySkewFeed", () => {
  it("renders every item as real, readable content", () => {
    const { getByText } = render(<VelocitySkewFeed items={ITEMS} />);
    expect(getByText("Mira Chen approved the release checklist")).toBeTruthy();
    expect(getByText("deploy-bot shipped v0.9.4 to production")).toBeTruthy();
    expect(getByText("Jonas Weber commented on the parallax RFC")).toBeTruthy();
  });

  it("server markup is an untransformed feed", () => {
    const html = renderToString(<VelocitySkewFeed items={ITEMS} />);
    expect(html).not.toContain("skewY");
    expect(html).not.toContain("scaleY");
    expect(html).toContain("deploy-bot shipped v0.9.4 to production");
  });

  it("container mode exposes a keyboard-scrollable, overscroll-contained region", () => {
    const { container } = render(<VelocitySkewFeed items={ITEMS} height={320} />);
    const region = container.querySelector<HTMLElement>('[role="region"]');
    expect(region).not.toBeNull();
    expect(region?.tabIndex).toBe(0);
    expect(region?.getAttribute("aria-label")).toBeTruthy();
    expect(region?.className).toContain("overscroll-contain");
    expect(region?.className).toContain("overflow-y-auto");
  });

  it("page mode is a plain flow list with no scroll container", () => {
    const { container } = render(<VelocitySkewFeed items={ITEMS} scrollMode="page" />);
    expect(container.querySelector('[role="region"]')).toBeNull();
    expect(container.querySelector(".overflow-y-auto")).toBeNull();
    expect((container.firstElementChild as HTMLElement).getAttribute("data-scroll-mode")).toBe("page");
  });

  it("reduced motion drops the physics and leaves the feed plainly scrollable", () => {
    const { container, getByText } = render(<VelocitySkewFeed items={ITEMS} reducedMotion />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-motion")).toBe("static");
    expect(getByText("Mira Chen approved the release checklist")).toBeTruthy();
    container.querySelectorAll<HTMLElement>("div").forEach((el) => {
      expect(el.style.transform).toBe("");
      expect(el.style.willChange).toBe("");
    });
    // Still a real scroll region — reduced motion must not remove scrollability.
    expect(container.querySelector('[role="region"]')).not.toBeNull();
  });

  it("keeps the velocity meter off by default and decorative when enabled", () => {
    const { container: bare } = render(<VelocitySkewFeed items={ITEMS} />);
    expect(bare.textContent).not.toContain("px/s");
    cleanup();
    const { container: metered, getByText } = render(<VelocitySkewFeed items={ITEMS} meter />);
    expect(getByText("0 px/s")).toBeTruthy();
    expect(getByText("peak 0 px/s")).toBeTruthy();
    const bar = metered.querySelector<HTMLElement>('[aria-hidden="true"]');
    expect(bar?.textContent).toContain("scroll velocity");
  });

  it("mounts and unmounts cleanly on both axes", () => {
    expect(() => {
      const { unmount } = render(<VelocitySkewFeed items={ITEMS} axis="x" meter stiffness={120} damping={20} />);
      unmount();
    }).not.toThrow();
    cleanup();
    expect(() => {
      const { unmount } = render(<VelocitySkewFeed items={ITEMS} scrollMode="page" maxSkew={3} />);
      unmount();
    }).not.toThrow();
  });

  it("has no axe violations in either motion mode", async () => {
    const { container: animated } = render(<VelocitySkewFeed items={ITEMS} meter />);
    await noViolations(animated);
    cleanup();
    const { container: still } = render(<VelocitySkewFeed items={ITEMS} reducedMotion />);
    await noViolations(still);
  });
});
