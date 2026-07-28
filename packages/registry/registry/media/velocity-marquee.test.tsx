import { render, cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VelocityMarquee, type VelocityMarqueeRow } from "./velocity-marquee";

afterEach(cleanup);

const rows: VelocityMarqueeRow[] = [
  {
    id: "media",
    label: "Recent captures",
    direction: 1,
    items: [
      { id: "m1", node: <img src="/1.png" alt="Basin at noon" /> },
      { id: "m2", node: <img src="/2.png" alt="Signal bloom" /> },
    ],
  },
  {
    id: "logos",
    label: "Customers",
    direction: -1,
    items: [
      { id: "l1", node: <span>Northbeam</span> },
      { id: "l2", node: <span>Kelp Audio</span> },
    ],
  },
];

/**
 * Scroll-driven surge is rAF + layout work jsdom can't measure, so these tests
 * pin the CONTRACT: consumer content is announced exactly once, the seamless
 * duplicate is inert decoration, scroll is read through a single passive
 * listener that is cleaned up, and the still variant is complete.
 */
describe("VelocityMarquee", () => {
  it("renders each item twice but exposes only the canonical copy to AT", () => {
    render(<VelocityMarquee rows={rows} />);
    // Both copies are in the DOM…
    expect(screen.getAllByAltText("Basin at noon")).toHaveLength(2);
    // …but only one is reachable (the duplicate is aria-hidden + inert).
    expect(screen.getAllByAltText("Basin at noon").filter((el) => !el.closest("[aria-hidden]"))).toHaveLength(1);
    expect(screen.getAllByText("Northbeam").filter((el) => !el.closest("[aria-hidden]"))).toHaveLength(1);
  });

  it("names every rail as its own group", () => {
    render(<VelocityMarquee rows={rows} aria-label="Media marquee" />);
    expect(screen.getByRole("group", { name: "Media marquee" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Recent captures" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Customers" })).toBeTruthy();
  });

  it("reads page scroll through exactly one passive listener and removes it on unmount", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<VelocityMarquee rows={rows} />);
    const scrollAdds = add.mock.calls.filter((c) => c[0] === "scroll");
    expect(scrollAdds).toHaveLength(1);
    expect(scrollAdds[0][2]).toEqual({ passive: true });
    unmount();
    expect(remove.mock.calls.filter((c) => c[0] === "scroll")).toHaveLength(1);
    add.mockRestore();
    remove.mockRestore();
  });

  it("stills the rails under reducedMotion and never attaches a scroll listener", () => {
    const add = vi.spyOn(window, "addEventListener");
    const { container } = render(<VelocityMarquee rows={rows} reducedMotion />);
    expect(container.firstElementChild?.getAttribute("data-motion")).toBe("static");
    expect(add.mock.calls.filter((c) => c[0] === "scroll")).toHaveLength(0);
    // Every item is still present and hoverable/focusable.
    expect(screen.getAllByText("Kelp Audio").length).toBeGreaterThan(0);
    add.mockRestore();
  });

  it("keeps the boost meter out of the accessibility tree and hides it on request", () => {
    const { container, rerender } = render(<VelocityMarquee rows={rows} />);
    const meter = container.querySelector('[aria-hidden="true"].pointer-events-none');
    expect(meter?.textContent).toContain("1.00×");
    rerender(<VelocityMarquee rows={rows} showMeter={false} />);
    expect(container.textContent).not.toContain("1.00×");
  });

  it("mounts and unmounts cleanly with one row and with none", () => {
    expect(() => {
      const a = render(<VelocityMarquee rows={[rows[0]]} baseSpeed={80} maxSkew={4} hoverSlow={0.5} />);
      a.unmount();
      cleanup();
      const b = render(<VelocityMarquee rows={[]} />);
      b.unmount();
    }).not.toThrow();
  });
});
