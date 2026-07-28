import { render, cleanup, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GooeyActions, type GooeyAction } from "./gooey-actions";

afterEach(cleanup);

const actions: GooeyAction[] = [
  { id: "reply", label: "Reply" },
  { id: "star", label: "Star" },
  { id: "share", label: "Share" },
];

/**
 * The bloom is spring-driven on rAF, which jsdom can't measure — so these tests
 * pin the interaction CONTRACT: menu-button semantics, controlled/uncontrolled
 * open state, keyboard operability (roving focus, Escape + focus restore), and
 * the decorative goo layer staying out of the accessibility tree.
 */
describe("GooeyActions", () => {
  const root = (c: HTMLElement) => c.querySelector("[data-motion]");
  const core = () => screen.getByRole("button", { name: "Actions", hidden: true });

  it("exposes menu-button semantics on the core and keeps satellites inert while closed", () => {
    const { container } = render(<GooeyActions actions={actions} />);
    const fab = core();
    expect(fab.getAttribute("aria-expanded")).toBe("false");
    expect(fab.getAttribute("aria-haspopup")).toBe("true");
    const menu = container.querySelector('[role="menu"]');
    expect(menu?.getAttribute("id")).toBe(fab.getAttribute("aria-controls"));
    expect(menu?.getAttribute("aria-hidden")).toBe("true");
    container.querySelectorAll<HTMLButtonElement>('[role="menuitem"]').forEach((b) => {
      expect(b.disabled).toBe(true);
      expect(b.tabIndex).toBe(-1);
    });
  });

  it("opens on click and reports through onOpenChange (uncontrolled)", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<GooeyActions actions={actions} onOpenChange={onOpenChange} />);
    await user.click(core());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(core().getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector('[role="menu"]')?.getAttribute("aria-hidden")).toBeNull();
    expect(screen.getByRole("menuitem", { name: "Reply" })).toBeTruthy();
  });

  it("honours a controlled open prop without owning the state", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<GooeyActions actions={actions} open onOpenChange={onOpenChange} />);
    expect(core().getAttribute("aria-expanded")).toBe("true");
    await user.click(core());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    // Still open — the consumer owns the value.
    expect(core().getAttribute("aria-expanded")).toBe("true");
  });

  it("moves focus across satellites with arrow keys (roving tabindex)", async () => {
    const user = userEvent.setup();
    render(<GooeyActions actions={actions} defaultOpen />);
    const first = screen.getByRole("menuitem", { name: "Reply" });
    act(() => first.focus());
    expect(document.activeElement).toBe(first);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Star" }));
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Share" }));
    expect(screen.getByRole("menuitem", { name: "Share" }).tabIndex).toBe(0);
    expect(screen.getByRole("menuitem", { name: "Reply" }).tabIndex).toBe(-1);
  });

  it("closes on Escape and restores focus to the core button", async () => {
    const user = userEvent.setup();
    render(<GooeyActions actions={actions} defaultOpen />);
    act(() => screen.getByRole("menuitem", { name: "Star" }).focus());
    await user.keyboard("{Escape}");
    expect(core().getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(core());
  });

  it("commits a satellite: fires onSelect, closes, and returns focus", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<GooeyActions actions={actions} defaultOpen onSelect={onSelect} />);
    await user.click(screen.getByRole("menuitem", { name: "Share" }));
    expect(onSelect).toHaveBeenCalledWith("share");
    expect(core().getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(core());
  });

  it("keeps the goo blob field decorative and flips data-motion under reducedMotion", () => {
    const { container: animated } = render(<GooeyActions actions={actions} />);
    expect(root(animated)?.getAttribute("data-motion")).toBe("animated");
    expect(root(animated)?.getAttribute("data-paused")).toBeTruthy();
    const field = animated.querySelector('[aria-hidden="true"][style*="filter"]');
    expect(field).not.toBeNull();
    expect(animated.querySelector("filter")).not.toBeNull();
    cleanup();
    const { container: still } = render(<GooeyActions actions={actions} reducedMotion />);
    expect(root(still)?.getAttribute("data-motion")).toBe("static");
  });

  it("mounts and unmounts cleanly across prop variations", () => {
    expect(() => {
      const a = render(<GooeyActions actions={actions} radius={80} arc={[-200, 20]} stagger={0} magnetRange={0} autoPeek={false} />);
      a.unmount();
      const b = render(<GooeyActions actions={[{ id: "solo", label: "Solo" }]} defaultOpen reducedMotion seed={7} />);
      b.unmount();
    }).not.toThrow();
  });
});
