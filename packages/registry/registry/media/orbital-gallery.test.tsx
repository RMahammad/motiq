import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OrbitalGallery, type OrbitalGalleryItem } from "./orbital-gallery";

afterEach(cleanup);

const items: OrbitalGalleryItem[] = [
  { id: "a", src: "/a.png", alt: "Basin at noon", caption: "Basin at noon" },
  { id: "b", src: "/b.png", alt: "Signal bloom", caption: "Signal bloom" },
  { id: "c", src: "/c.png", alt: "Ridgeline, dusk", caption: "Ridgeline, dusk" },
  { id: "d", src: "/d.png", alt: "Glass district", caption: "Glass district" },
];

/**
 * The ring itself is transform-only work driven by rAF, which jsdom can't
 * measure — so these tests pin the CONTRACT: media reaches the accessibility
 * tree, drag has a full keyboard equivalent, controlled/uncontrolled selection
 * both work, and the still variant is complete.
 */
describe("OrbitalGallery", () => {
  it("renders every item with its alt text and caption", () => {
    render(<OrbitalGallery items={items} />);
    for (const item of items) {
      expect(screen.getByAltText(item.alt ?? "")).toBeTruthy();
    }
    // Caption text is duplicated in the footer bar for the fronted card.
    expect(screen.getAllByText("Basin at noon").length).toBeGreaterThan(1);
  });

  it("rotates one card per arrow key and jumps with Home/End", () => {
    const onChange = vi.fn();
    const { container } = render(<OrbitalGallery items={items} onActiveIndexChange={onChange} />);
    const cards = Array.from(container.querySelectorAll("button"));
    expect(cards[0].getAttribute("aria-current")).toBe("true");

    fireEvent.keyDown(cards[0], { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(1, items[1]);
    expect(container.querySelectorAll("button")[1].getAttribute("aria-current")).toBe("true");

    fireEvent.keyDown(cards[1], { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith(3, items[3]);

    fireEvent.keyDown(cards[3], { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith(0, items[0]);
  });

  it("uses a roving tabindex so the ring is one tab stop", () => {
    const { container } = render(<OrbitalGallery items={items} defaultActiveIndex={2} />);
    const tabbable = Array.from(container.querySelectorAll("button")).filter((b) => b.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0].getAttribute("aria-current")).toBe("true");
  });

  it("honours a controlled activeIndex (parent that ignores changes keeps its card fronted)", () => {
    const onChange = vi.fn();
    const { container } = render(<OrbitalGallery items={items} activeIndex={2} onActiveIndexChange={onChange} />);
    const cards = Array.from(container.querySelectorAll("button"));
    expect(cards[2].getAttribute("aria-current")).toBe("true");

    fireEvent.keyDown(cards[2], { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(3, items[3]);
    // The parent did not update the prop, so the fronted card must not move.
    expect(container.querySelectorAll("button")[2].getAttribute("aria-current")).toBe("true");
  });

  it("flips data-motion to static under the reducedMotion prop and stays operable", () => {
    const { container: animated } = render(<OrbitalGallery items={items} />);
    expect(animated.firstElementChild?.getAttribute("data-motion")).toBe("animated");
    cleanup();

    const onChange = vi.fn();
    const { container } = render(<OrbitalGallery items={items} reducedMotion onActiveIndexChange={onChange} />);
    expect(container.firstElementChild?.getAttribute("data-motion")).toBe("static");
    fireEvent.keyDown(container.querySelectorAll("button")[0], { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(1, items[1]);
  });

  it("marks the depth/floor decoration aria-hidden and announces the fronted card", () => {
    const { container } = render(<OrbitalGallery items={items} />);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
    const live = container.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toContain("Basin at noon");
    expect(live?.textContent).toContain("1 of 4");
  });

  it("mounts and unmounts cleanly, including with no items", () => {
    expect(() => {
      const a = render(<OrbitalGallery items={items} />);
      a.unmount();
      cleanup();
      const b = render(<OrbitalGallery items={[]} />);
      b.unmount();
    }).not.toThrow();
  });
});
