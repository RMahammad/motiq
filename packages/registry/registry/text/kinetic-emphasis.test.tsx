import * as React from "react";
import { renderToString } from "react-dom/server";
import { render, cleanup, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { KineticEmphasis } from "./kinetic-emphasis";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const sentence = (
  <>
    Motion that <em>understands emphasis</em>, not just easing.
  </>
);

describe("KineticEmphasis", () => {
  it("exposes the sentence once with native <em> semantics; animated layer is aria-hidden", async () => {
    const { container } = render(
      <KineticEmphasis as="h2" reducedMotion>
        {sentence}
      </KineticEmphasis>,
    );
    const sr = container.querySelector(".sr-only");
    expect(sr?.textContent).toBe("Motion that understands emphasis, not just easing.");
    expect(sr?.querySelector("em")?.textContent).toBe("understands emphasis");
    const hidden = container.querySelector('[aria-hidden="true"]');
    expect(hidden).toBeTruthy();
    // exactly one accessible copy: the aria-hidden layer duplicates visually only
    expect(hidden?.className).toContain("select-none");
    await noViolations(container);
  });

  it("server markup renders the FINAL designed state (no hidden content, underline present)", () => {
    const html = renderToString(
      <KineticEmphasis as="h2">{sentence}</KineticEmphasis>,
    );
    // no client-side muted inline styles in server output
    expect(html).not.toContain("translateY(0.38em)");
    expect(html).not.toContain("opacity:0.35");
    // persistent emphasis underline is part of the designed rest state
    expect(html).toContain("data-ke-underline");
    // words all present
    for (const w of ["Motion", "understands", "easing."]) expect(html).toContain(w);
  });

  it("reduced motion renders final state with no inline animation styles", () => {
    const { container } = render(
      <KineticEmphasis as="p" reducedMotion>
        {sentence}
      </KineticEmphasis>,
    );
    const words = container.querySelectorAll<HTMLElement>("[data-ke-word]");
    expect(words.length).toBe(7);
    words.forEach((w) => {
      expect(w.style.opacity).toBe("");
      expect(w.style.transform).toBe("");
    });
  });

  it("marks emphasis words as real <em> in the animated layer and splits by word", () => {
    const { container } = render(
      <KineticEmphasis reducedMotion>{sentence}</KineticEmphasis>,
    );
    const emWords = container.querySelectorAll('[data-ke-word="em"]');
    expect(emWords.length).toBe(2);
    emWords.forEach((el) => expect(el.tagName.toLowerCase()).toBe("em"));
  });

  it("controlled mode sweeps on the rising edge and calls onComplete; re-trigger is interruption-safe", async () => {
    const onComplete = vi.fn();
    const { rerender } = render(
      <KineticEmphasis play="controlled" active={false} speed="fast" onComplete={onComplete}>
        Fast <em>sweep</em> here.
      </KineticEmphasis>,
    );
    rerender(
      <KineticEmphasis play="controlled" active speed="fast" onComplete={onComplete}>
        Fast <em>sweep</em> here.
      </KineticEmphasis>,
    );
    await waitFor(() => expect(onComplete).toHaveBeenCalled(), { timeout: 5000 });
  });

  it("warns (dev) on unsupported children but still renders them accessibly", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = render(
      <KineticEmphasis reducedMotion>
        Hello <b>bold</b> world
      </KineticEmphasis>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("[KineticEmphasis]"));
    // accessible layer still carries the original children
    expect(container.querySelector(".sr-only b")?.textContent).toBe("bold");
    warn.mockRestore();
  });

  it("reduced motion keeps the DESIGNED accent on emphasis words (independent review, major #1)", () => {
    const { container } = render(
      <KineticEmphasis as="p" reducedMotion>
        {sentence}
      </KineticEmphasis>,
    );
    container.querySelectorAll<HTMLElement>('[data-ke-word="em"]').forEach((el) => {
      expect(el.style.color).toContain("--ke-accent");
    });
    // and the accent chain resolves through the contrast-safe text token
    const em = container.querySelector<HTMLElement>('[data-ke-word="em"]');
    expect(em?.style.color).toContain("--color-accent-text");
  });

  it("keeps a continuous underline across a multi-word phrase (space inside the <em>)", () => {
    const { container } = render(
      <KineticEmphasis reducedMotion>{sentence}</KineticEmphasis>,
    );
    const emWords = Array.from(container.querySelectorAll('[data-ke-word="em"]'));
    // first phrase word carries its trailing space so underline + forced-colors
    // text-decoration bridge the gap
    expect(emWords[0]?.textContent).toBe("understands ");
    expect(emWords[1]?.textContent).toBe("emphasis,");
  });

  it("supports emphasisStyle none (no persistent underline element)", () => {
    const { container } = render(
      <KineticEmphasis reducedMotion emphasisStyle="none">
        {sentence}
      </KineticEmphasis>,
    );
    expect(container.querySelector("[data-ke-underline]")).toBeNull();
  });
});
