import { render, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AuroraPanel } from "./aurora-panel";

afterEach(cleanup);

/**
 * Canvas output can't be asserted in jsdom (getContext("2d") returns null), so
 * these tests pin the CONTRACT: the roof is decorative, card content keeps plain
 * semantics, both static paths (reducedMotion and speed=0) are prop-reachable,
 * and the null context is guarded.
 */
describe("AuroraPanel", () => {
  it("renders a decorative roof canvas above plain card content", () => {
    const { container, getByRole } = render(
      <AuroraPanel>
        <h3>aurora-panel</h3>
      </AuroraPanel>,
    );
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas?.getAttribute("aria-hidden")).toBe("true");
    const decorative = Array.from(container.querySelectorAll('[aria-hidden="true"]'));
    expect(decorative.some((d) => d.contains(getByRole("heading", { name: "aurora-panel" })))).toBe(false);
  });

  it("renders the overlay badge slot on the roof", () => {
    const { getByText } = render(<AuroraPanel overlay={<span>Live surface</span>}>body</AuroraPanel>);
    expect(getByText("Live surface")).toBeTruthy();
  });

  it("flips data-motion to static under the reducedMotion prop", () => {
    const { container: animated } = render(<AuroraPanel />);
    expect(animated.firstElementChild?.getAttribute("data-motion")).toBe("animated");
    cleanup();
    const { container: still } = render(<AuroraPanel reducedMotion />);
    expect(still.firstElementChild?.getAttribute("data-motion")).toBe("static");
  });

  it("treats speed=0 as the frozen sky", () => {
    const { container } = render(<AuroraPanel speed={0} />);
    expect(container.firstElementChild?.getAttribute("data-motion")).toBe("static");
  });

  it("does not throw when the 2d context is unavailable (jsdom)", () => {
    // jsdom's canvas returns null from getContext — the component must no-op draw.
    expect(() => {
      const { unmount } = render(<AuroraPanel seed={9} />);
      unmount();
    }).not.toThrow();
  });

  it("clamps the ribbon count and accepts custom colors without throwing", () => {
    expect(() => {
      const a = render(<AuroraPanel ribbons={9} colors={["#22c7d9", "#4f7cff"]} intensity={1.4} />);
      a.unmount();
      cleanup();
      const b = render(<AuroraPanel ribbons={1} grain={0} roofHeight={140} lean={false} />);
      b.unmount();
    }).not.toThrow();
  });

  it("leans on pointer move over the roof and relaxes on leave", () => {
    const { container, unmount } = render(<AuroraPanel roofHeight={200} />);
    const roof = container.querySelector("canvas")?.parentElement;
    expect(roof).toBeTruthy();
    expect(() => {
      if (roof) {
        fireEvent.pointerMove(roof, { clientX: 180, clientY: 40 });
        fireEvent.pointerLeave(roof);
      }
      unmount();
    }).not.toThrow();
  });
});
