import { render, cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LensCard } from "./lens-card";

afterEach(cleanup);

const Content = () => (
  <div className="grid grid-cols-3 gap-4 p-6">
    <div>
      <span>Latency p95</span>
      <strong>128ms</strong>
    </div>
  </div>
);

/**
 * The refraction layers are duplicated clones of the consumer's own content, so
 * the release-blocking contract is that assistive tech reads that content EXACTLY
 * once: the clones must be aria-hidden and pointer-transparent. The rest pins the
 * optional layers, the motion attributes, and clean mount/unmount.
 */
describe("LensCard", () => {
  const root = (c: HTMLElement) => c.querySelector("[data-motion]");

  it("exposes the base content once — the magnified clones are aria-hidden", () => {
    render(
      <LensCard seed={3}>
        <Content />
      </LensCard>,
    );
    // Three copies exist in the DOM; only the base one is in the a11y tree.
    const all = screen.getAllByText("Latency p95");
    expect(all.length).toBeGreaterThan(1);
    const visible = all.filter((el) => el.closest('[aria-hidden="true"]') === null);
    expect(visible).toHaveLength(1);
  });

  it("keeps the clone layers out of the pointer path so base content stays clickable", () => {
    const { container } = render(
      <LensCard seed={3}>
        <Content />
      </LensCard>,
    );
    const overlays = Array.from(container.querySelectorAll('[aria-hidden="true"]'));
    expect(overlays.length).toBeGreaterThan(0);
    overlays.forEach((el) => expect(el.className).toContain("pointer-events-none"));
  });

  it("flips data-motion to static under the reducedMotion prop", () => {
    const { container: animated } = render(
      <LensCard seed={7}>
        <Content />
      </LensCard>,
    );
    expect(root(animated)?.getAttribute("data-motion")).toBe("animated");
    cleanup();
    const { container: still } = render(
      <LensCard seed={7} reducedMotion>
        <Content />
      </LensCard>,
    );
    expect(root(still)?.getAttribute("data-motion")).toBe("static");
  });

  it("drops the optional layers when their props are off", () => {
    const { container } = render(
      <LensCard seed={1} chromatic={0} gridBend={false} showRing={false}>
        <Content />
      </LensCard>,
    );
    expect(container.querySelector("canvas")).toBeNull();
    expect(container.querySelector(".rounded-full")).toBeNull();
    // Only the magnifier clone + the colour probe remain aria-hidden.
    const clones = Array.from(container.querySelectorAll('[aria-hidden="true"]')).filter((el) =>
      el.textContent?.includes("Latency p95"),
    );
    expect(clones).toHaveLength(1);
  });

  it("wires the data-paused attribute", () => {
    const { container } = render(
      <LensCard seed={3}>
        <Content />
      </LensCard>,
    );
    expect(root(container)?.getAttribute("data-paused")).toBeTruthy();
  });

  it("tracks pointer and touch input without throwing (null 2d context in jsdom)", () => {
    const { container } = render(
      <LensCard seed={4}>
        <Content />
      </LensCard>,
    );
    const el = root(container) as HTMLElement;
    expect(() => {
      fireEvent.pointerMove(el, { clientX: 40, clientY: 60 });
      fireEvent.pointerDown(el, { clientX: 44, clientY: 62, pointerType: "touch" });
      fireEvent.pointerLeave(el);
    }).not.toThrow();
  });

  it("mounts and unmounts cleanly across prop variations", () => {
    expect(() => {
      const a = render(
        <LensCard seed={2} radius={160} magnification={2} chromatic={6} idleDrift={false} lag={{ stiffness: 120, damping: 18 }}>
          <Content />
        </LensCard>,
      );
      a.unmount();
      const b = render(
        <LensCard seed={5} reducedMotion>
          <Content />
        </LensCard>,
      );
      b.unmount();
    }).not.toThrow();
  });
});
