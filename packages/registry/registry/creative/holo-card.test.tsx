import { render, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HoloCard } from "./holo-card";

afterEach(cleanup);

/**
 * The tilt itself is a per-frame transform that jsdom can't meaningfully assert,
 * so these tests pin the CONTRACT: decorative light layers stay out of the
 * accessibility tree, content stays in it, the reduced-motion still is reachable
 * from a prop, and pointer/keyboard handling never throws.
 */
describe("HoloCard", () => {
  const decorative = (c: HTMLElement) => Array.from(c.querySelectorAll('[aria-hidden="true"]'));

  it("marks the foil, glare and ground shadow aria-hidden", () => {
    const { container } = render(<HoloCard />);
    // foil + glare + shadow
    expect(decorative(container).length).toBe(3);
  });

  it("keeps children out of every decorative layer", () => {
    const { container, getByText } = render(
      <HoloCard>
        <span>Open pass</span>
      </HoloCard>,
    );
    const node = getByText("Open pass");
    expect(decorative(container).some((d) => d.contains(node))).toBe(false);
  });

  it("flips data-motion to static under the reducedMotion prop", () => {
    const { container: animated } = render(<HoloCard />);
    expect(animated.firstElementChild?.getAttribute("data-motion")).toBe("animated");
    cleanup();
    const { container: still } = render(<HoloCard reducedMotion />);
    expect(still.firstElementChild?.getAttribute("data-motion")).toBe("static");
  });

  it("drops the foil, glare and shadow layers when they are switched off", () => {
    const { container } = render(<HoloCard foil="none" glare={false} shadow={false} />);
    expect(decorative(container).length).toBe(0);
  });

  it("exposes a focusable, labelled tilt surface with a keyboard hint", () => {
    const { getByRole, getByText } = render(<HoloCard label="Membership pass" />);
    const card = getByRole("group", { name: "Membership pass" });
    expect(card.getAttribute("tabindex")).toBe("0");
    expect(getByText(/arrow keys to tilt/i)).toBeTruthy();
  });

  it("handles arrow keys and pointer tracking without throwing", () => {
    const { container, getByRole } = render(<HoloCard label="Pass" />);
    const card = getByRole("group", { name: "Pass" });
    const root = container.firstElementChild;
    expect(() => {
      fireEvent.keyDown(card, { key: "ArrowRight" });
      fireEvent.keyDown(card, { key: "ArrowUp" });
      fireEvent.keyDown(card, { key: "Escape" });
      fireEvent.keyDown(card, { key: "a" });
      if (root) {
        fireEvent.pointerMove(root, { clientX: 40, clientY: 30 });
        fireEvent.pointerLeave(root);
      }
    }).not.toThrow();
  });

  it("mounts and unmounts cleanly in both motion modes", () => {
    expect(() => {
      const live = render(<HoloCard foil="azure" maxTilt={20} />);
      live.unmount();
      cleanup();
      const still = render(<HoloCard reducedMotion idleSway={false} aspect={0} />);
      still.unmount();
    }).not.toThrow();
  });
});
