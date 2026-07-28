import { render, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MagneticDock, type DockItem } from "./magnetic-dock";

afterEach(cleanup);

const items: DockItem[] = [
  { id: "compose", label: "Compose" },
  { id: "search", label: "Search" },
  { id: "deploy", label: "Deploy" },
];

/**
 * The gaussian field runs on rAF against measured geometry, which jsdom cannot
 * lay out — so these tests pin the CONTRACT instead: real button semantics, the
 * select callback, the decorative tooltip, the motion/pause data attributes, and
 * clean mount/unmount in both the animated and the static path.
 */
describe("MagneticDock", () => {
  const root = (c: HTMLElement) => c.querySelector("[data-motion]");

  it("renders one real button per item with its label as the accessible name", () => {
    render(<MagneticDock items={items} />);
    expect(screen.getByRole("button", { name: "Compose" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Search" })).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("fires onSelect with the item id on click and on keyboard activation", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<MagneticDock items={items} onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "Deploy" }));
    expect(onSelect).toHaveBeenCalledWith("deploy");
    screen.getByRole("button", { name: "Search" }).focus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenLastCalledWith("search");
  });

  it("flips data-motion to static under the reducedMotion prop", () => {
    const { container: animated } = render(<MagneticDock items={items} />);
    expect(root(animated)?.getAttribute("data-motion")).toBe("animated");
    cleanup();
    const { container: still } = render(<MagneticDock items={items} reducedMotion />);
    expect(root(still)?.getAttribute("data-motion")).toBe("static");
  });

  it("keeps the tooltip chip decorative, and drops it entirely when disabled or static", () => {
    const { container } = render(<MagneticDock items={items} />);
    const chip = container.querySelectorAll('[aria-hidden="true"]');
    expect(chip.length).toBeGreaterThan(0);
    cleanup();
    const { container: noTip } = render(<MagneticDock items={items} tooltip={false} />);
    // Only the icon-initial spans remain aria-hidden; no positioned chip.
    expect(noTip.querySelectorAll(".absolute.left-0.top-0")).toHaveLength(0);
    cleanup();
    const { container: still } = render(<MagneticDock items={items} reducedMotion />);
    expect(still.querySelectorAll(".absolute.left-0.top-0")).toHaveLength(0);
  });

  it("wires the data-paused attribute", () => {
    const { container } = render(<MagneticDock items={items} />);
    expect(root(container)?.getAttribute("data-paused")).toBeTruthy();
  });

  it("renders a custom icon node when provided, and a label initial otherwise", () => {
    const { container } = render(
      <MagneticDock
        items={[{ id: "a", label: "Alpha", icon: <svg data-testid="glyph" viewBox="0 0 24 24" /> }, { id: "b", label: "Beta" }]}
      />,
    );
    expect(container.querySelector('[data-testid="glyph"]')).not.toBeNull();
    expect(screen.getByRole("button", { name: "Beta" }).textContent).toBe("B");
  });

  it("mounts and unmounts cleanly across prop variations", () => {
    expect(() => {
      const a = render(<MagneticDock items={items} idleWave={false} magnetRadius={40} maxScale={1.2} lift={10} />);
      a.unmount();
      const b = render(<MagneticDock items={items} reducedMotion seed={9} stiffness={600} damping={40} />);
      b.unmount();
      const c = render(<MagneticDock items={[]} />);
      c.unmount();
    }).not.toThrow();
  });
});
