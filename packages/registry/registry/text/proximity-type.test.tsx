import { render, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProximityType } from "./proximity-type";

afterEach(cleanup);

/**
 * Weight chasing is rAF + getBoundingClientRect driven (both inert in jsdom),
 * so these tests pin the CONTRACT: the readable string is exposed once, the
 * per-character layer is hidden and unselectable, reduced motion leaves the
 * line at its rest weight with no listeners doing work, and pointer input never
 * throws.
 */
describe("ProximityType", () => {
  const LINE = "Gravity has a typeface.";
  const chars = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>("[data-mk-char]"));

  it("exposes the real string once and hides the per-character layer from AT", () => {
    const { container } = render(<ProximityType text={LINE} />);
    expect(container.querySelector(".sr-only")?.textContent).toBe(LINE);
    const layer = container.querySelector('[aria-hidden="true"]');
    expect(layer).not.toBeNull();
    expect(layer?.className).toContain("select-none");
    expect(chars(container).length).toBe(LINE.replace(/ /g, "").length);
    expect(chars(container).map((el) => el.textContent).join("")).toBe(LINE.replace(/ /g, ""));
  });

  it("renders a static line at the rest weight under the reducedMotion prop", () => {
    const { container } = render(<ProximityType text={LINE} reducedMotion restWeight={430} />);
    const root = container.querySelector("[data-motion]") as HTMLElement | null;
    expect(root?.getAttribute("data-motion")).toBe("static");
    expect(root?.style.fontWeight).toBe("430");
    // No per-character weight/glow was ever written.
    expect(chars(container).every((el) => el.style.fontWeight === "")).toBe(true);
    expect(chars(container).every((el) => el.style.textShadow === "")).toBe(true);
  });

  it("keeps the whole string readable (no character is hidden)", () => {
    const { container } = render(<ProximityType text={LINE} />);
    expect(chars(container).every((el) => el.style.opacity === "")).toBe(true);
  });

  it("accepts pointer input without throwing, in both motion modes", () => {
    const { container, rerender } = render(<ProximityType text={LINE} />);
    const root = container.querySelector("[data-motion]");
    expect(root).not.toBeNull();
    expect(() => {
      if (!root) return;
      fireEvent.pointerMove(root, { clientX: 120, clientY: 40 });
      fireEvent.pointerDown(root, { clientX: 120, clientY: 40 });
      fireEvent.pointerLeave(root);
    }).not.toThrow();
    rerender(<ProximityType text={LINE} reducedMotion />);
    expect(() => {
      if (root) fireEvent.pointerMove(root, { clientX: 10, clientY: 10 });
    }).not.toThrow();
  });

  it("honours the `as` tag and reports its character count", () => {
    const { container } = render(<ProximityType text="Set it" as="h2" />);
    const h2 = container.querySelector("h2");
    expect(h2).not.toBeNull();
    expect(h2?.getAttribute("data-chars")).toBe("5");
  });

  it("mounts and unmounts cleanly across prop variations", () => {
    expect(() => {
      const a = render(
        <ProximityType text={LINE} radius={90} weightRange={[200, 800]} falloff="linear" glow={false} />,
      );
      a.unmount();
      cleanup();
      const b = render(<ProximityType text={LINE} idleWave={false} spacing="0.1em" />);
      b.unmount();
    }).not.toThrow();
  });
});
