import { render, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DecryptText } from "./decrypt-text";

afterEach(cleanup);

/**
 * The scramble itself is rAF-driven and can't be asserted frame-by-frame in
 * jsdom, so these tests pin the CONTRACT: the readable string is always exposed
 * exactly once to assistive tech, the animated glyph layer is hidden from it,
 * reduced motion never scrambles, and the trigger/lifecycle wiring holds.
 */
describe("DecryptText", () => {
  const LINE = "Ship interfaces that feel alive.";
  const hidden = (c: HTMLElement) => c.querySelector('[aria-hidden="true"]');
  const readable = (c: HTMLElement) => c.querySelector(".sr-only");
  const states = (c: HTMLElement) =>
    Array.from(c.querySelectorAll<HTMLElement>("[data-mk-char]")).map((el) => el.dataset.state);

  it("exposes the real string once, in a visually-hidden node, and hides the glyphs", () => {
    const { container } = render(<DecryptText text={LINE} />);
    expect(readable(container)?.textContent).toBe(LINE);
    const layer = hidden(container);
    expect(layer).not.toBeNull();
    expect(layer?.querySelectorAll("[data-mk-char]").length).toBe(LINE.replace(/ /g, "").length);
  });

  it("renders the full readable text immediately under the reducedMotion prop", () => {
    const { container } = render(<DecryptText text={LINE} reducedMotion />);
    expect(container.querySelector("[data-motion]")?.getAttribute("data-motion")).toBe("static");
    expect(states(container).every((s) => s === "plain")).toBe(true);
    const glyphs = Array.from(container.querySelectorAll<HTMLElement>("[data-mk-char]")).map(
      (el) => el.textContent,
    );
    expect(glyphs.join("")).toBe(LINE.replace(/ /g, ""));
  });

  it("scrambles every character on mount when the trigger fires", () => {
    const { container } = render(<DecryptText text={LINE} trigger="mount" />);
    expect(states(container).every((s) => s === "scramble")).toBe(true);
  });

  it("waits for a hover with trigger=\"hover\", then re-scrambles", () => {
    const { container } = render(<DecryptText text={LINE} trigger="hover" />);
    expect(states(container).every((s) => s === "plain")).toBe(true);
    const root = container.querySelector("[data-motion]");
    expect(root).not.toBeNull();
    if (root) fireEvent.pointerEnter(root);
    expect(states(container).every((s) => s === "scramble")).toBe(true);
  });

  it("never scrambles on hover under reduced motion", () => {
    const { container } = render(<DecryptText text={LINE} reducedMotion trigger="hover" />);
    const root = container.querySelector("[data-motion]");
    if (root) fireEvent.pointerEnter(root);
    expect(states(container).every((s) => s === "plain")).toBe(true);
  });

  it("renders the terminal variant with a prompt and a caret", () => {
    const { container } = render(<DecryptText text="motiq add decrypt-text" variant="terminal" />);
    expect(container.querySelector("[data-variant]")?.getAttribute("data-variant")).toBe("terminal");
    expect(container.querySelector("[data-mk-caret]")).not.toBeNull();
    expect(hidden(container)?.parentElement?.textContent).toContain("$");
  });

  it("honours the `as` tag and reports its character count", () => {
    const { container } = render(<DecryptText text="Ship it" as="h1" />);
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1?.getAttribute("data-chars")).toBe("6");
  });

  it("mounts and unmounts cleanly, looping and non-looping", () => {
    expect(() => {
      const a = render(<DecryptText text={LINE} loop={1200} />);
      a.unmount();
      cleanup();
      const b = render(<DecryptText text={LINE} loop={false} variant="terminal" seed={9} />);
      b.unmount();
    }).not.toThrow();
  });
});
