import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { WordCascade } from "./word-cascade";

afterEach(cleanup);

/**
 * Springs run on rAF (inert in jsdom), so these tests pin the CONTRACT: the
 * passage is readable exactly once for AT, the animated copy is hidden from it,
 * element structure survives word-wrapping, reduced motion renders words in
 * place with no parked styles, and replay re-parks the words.
 */
describe("WordCascade", () => {
  const COPY = "Every launch deserves an entrance.";
  const words = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>("[data-mk-word]"));
  const layer = (c: HTMLElement) => c.querySelector('[aria-hidden="true"]');

  it("exposes the passage once and hides the animated copy from AT", () => {
    const { container } = render(<WordCascade>{COPY}</WordCascade>);
    expect(container.querySelector(".sr-only")?.textContent).toBe(COPY);
    expect(layer(container)).not.toBeNull();
    expect(words(container).length).toBe(COPY.split(" ").length);
    expect(words(container).map((el) => el.textContent).join(" ")).toBe(COPY);
  });

  it("preserves element structure while wrapping words", () => {
    const { container } = render(
      <WordCascade>
        <h3>Every launch deserves an entrance.</h3>
        <p>Wire it to the viewport.</p>
      </WordCascade>,
    );
    // Headings survive in BOTH layers, so semantics stay in the readable one.
    expect(container.querySelectorAll("h3").length).toBe(2);
    expect(layer(container)?.querySelector("h3")?.querySelectorAll("[data-mk-word]").length).toBe(5);
    expect(layer(container)?.querySelector("p")?.querySelectorAll("[data-mk-word]").length).toBe(5);
  });

  it("renders words in place, unstyled, under the reducedMotion prop", () => {
    const { container } = render(<WordCascade reducedMotion>{COPY}</WordCascade>);
    expect(container.querySelector("[data-motion]")?.getAttribute("data-motion")).toBe("static");
    expect(words(container).every((el) => el.style.opacity === "")).toBe(true);
    expect(words(container).every((el) => el.style.transform === "")).toBe(true);
    expect(words(container).every((el) => el.style.filter === "")).toBe(true);
  });

  it("parks every word off-rest before the first paint when animating", () => {
    const { container } = render(<WordCascade fromY={-44} blur={8}>{COPY}</WordCascade>);
    const all = words(container);
    expect(all.every((el) => el.style.opacity === "0")).toBe(true);
    expect(all.every((el) => el.style.transform.includes("translateY(-44px)"))).toBe(true);
    expect(all.every((el) => el.style.filter === "blur(8px)")).toBe(true);
    expect(all.every((el) => el.style.willChange !== "")).toBe(true);
  });

  it("re-parks the words when the replay token changes", () => {
    const { container, rerender } = render(<WordCascade replayToken={0}>{COPY}</WordCascade>);
    for (const el of words(container)) {
      el.style.opacity = "1";
      el.style.transform = "";
    }
    rerender(<WordCascade replayToken={1}>{COPY}</WordCascade>);
    expect(words(container).every((el) => el.style.opacity === "0")).toBe(true);
  });

  it("keeps replay inert under reduced motion", () => {
    const { container, rerender } = render(
      <WordCascade reducedMotion replayToken={0}>
        {COPY}
      </WordCascade>,
    );
    rerender(
      <WordCascade reducedMotion replayToken={1}>
        {COPY}
      </WordCascade>,
    );
    expect(words(container).every((el) => el.style.opacity === "")).toBe(true);
  });

  it("mounts and unmounts cleanly across spring/stagger variations", () => {
    expect(() => {
      const a = render(
        <WordCascade stiffness={240} damping={22} rotate={0} replayOnReenter={false} seed={4}>
          {COPY}
        </WordCascade>,
      );
      a.unmount();
      cleanup();
      const b = render(
        <WordCascade lineStagger={60} wordStagger={12} blur={0}>
          {COPY}
        </WordCascade>,
      );
      b.unmount();
    }).not.toThrow();
  });
});
