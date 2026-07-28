import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CompareReveal } from "./compare-reveal";

afterEach(cleanup);

const before = { src: "/wireframe.png", alt: "Wireframe pass" };
const after = { src: "/render.png", alt: "Finished render" };

/**
 * The spring + intro sweep are rAF work jsdom can't measure, so these tests pin
 * the CONTRACT: both sides are described, the handle is a real slider with a
 * full keyboard path, controlled/uncontrolled position both work, and the still
 * variant remains fully operable.
 */
describe("CompareReveal", () => {
  const handle = () => screen.getByRole("slider");

  it("renders both sides with alt text and a named comparison group", () => {
    render(<CompareReveal before={before} after={after} labels={["v1 wireframe", "v2 render"]} />);
    expect(screen.getByAltText("Wireframe pass")).toBeTruthy();
    expect(screen.getByAltText("Finished render")).toBeTruthy();
    expect(screen.getByRole("group", { name: /v1 wireframe versus v2 render/i })).toBeTruthy();
  });

  it("gives the handle slider semantics seeded from defaultPosition", () => {
    render(<CompareReveal before={before} after={after} defaultPosition={30} />);
    const el = handle();
    expect(el.tagName).toBe("BUTTON");
    expect(el.getAttribute("aria-valuemin")).toBe("0");
    expect(el.getAttribute("aria-valuemax")).toBe("100");
    expect(el.getAttribute("aria-valuenow")).toBe("30");
    expect(el.getAttribute("aria-valuetext")).toContain("30%");
  });

  it("moves 2% per arrow, 10% with Shift, and pins the ends with Home/End", () => {
    const onChange = vi.fn();
    render(<CompareReveal before={before} after={after} onPositionChange={onChange} />);
    fireEvent.keyDown(handle(), { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(52);
    expect(handle().getAttribute("aria-valuenow")).toBe("52");

    fireEvent.keyDown(handle(), { key: "ArrowLeft", shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith(42);

    fireEvent.keyDown(handle(), { key: "End" });
    expect(handle().getAttribute("aria-valuenow")).toBe("100");
    fireEvent.keyDown(handle(), { key: "Home" });
    expect(handle().getAttribute("aria-valuenow")).toBe("0");

    // Unhandled keys pass through.
    expect(fireEvent.keyDown(handle(), { key: "a" })).toBe(true);
  });

  it("honours a controlled position (a parent that ignores changes keeps the divider put)", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CompareReveal before={before} after={after} position={20} onPositionChange={onChange} />,
    );
    expect(handle().getAttribute("aria-valuenow")).toBe("20");
    fireEvent.keyDown(handle(), { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(22);
    expect(handle().getAttribute("aria-valuenow")).toBe("20");
    rerender(<CompareReveal before={before} after={after} position={80} onPositionChange={onChange} />);
    expect(handle().getAttribute("aria-valuenow")).toBe("80");
  });

  it("snaps home on double-click", () => {
    const onChange = vi.fn();
    const { container } = render(
      <CompareReveal before={before} after={after} defaultPosition={12} snapOnDoubleClick={50} onPositionChange={onChange} />,
    );
    fireEvent.doubleClick(container.firstElementChild as HTMLElement);
    expect(onChange).toHaveBeenLastCalledWith(50);
    expect(handle().getAttribute("aria-valuenow")).toBe("50");
  });

  it("stays operable with no sweep and no spring under reducedMotion", () => {
    const { container } = render(<CompareReveal before={before} after={after} reducedMotion defaultPosition={40} />);
    expect(container.firstElementChild?.getAttribute("data-motion")).toBe("static");
    fireEvent.keyDown(handle(), { key: "ArrowRight" });
    expect(handle().getAttribute("aria-valuenow")).toBe("42");
  });

  it("keeps the divider and side chips decorative, and unmounts cleanly", () => {
    const { container, unmount } = render(<CompareReveal before={before} after={after} labels={["A", "B"]} />);
    const chips = Array.from(container.querySelectorAll('[aria-hidden="true"]'));
    expect(chips.some((c) => c.textContent === "A")).toBe(true);
    expect(chips.some((c) => c.textContent === "B")).toBe(true);
    expect(() => unmount()).not.toThrow();
  });
});
