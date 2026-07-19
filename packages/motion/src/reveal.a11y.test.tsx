import { render, cleanup } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { Reveal } from "./reveal";

afterEach(cleanup);

// WCAG 2.2 AA is a release blocker (docs/12). We scope axe to real WCAG rules and
// disable color-contrast (jsdom can't compute layout/colors reliably).
async function violations(node: Element) {
  const results = await axe.run(node as HTMLElement, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
    },
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations;
}

describe("Reveal accessibility (axe, WCAG 2.2 AA scope)", () => {
  it("wraps interactive content without introducing violations", async () => {
    const { container } = render(
      <Reveal trigger="mount">
        <button type="button">Action</button>
      </Reveal>,
    );
    expect(await violations(container)).toEqual([]);
  });

  it("is inert markup around static content (no violations)", async () => {
    const { container } = render(
      <Reveal trigger="mount">
        <p>Readable content revealed on scroll.</p>
      </Reveal>,
    );
    expect(await violations(container)).toEqual([]);
  });

  it("adds no ARIA that would confuse assistive tech (presentational wrapper)", () => {
    const { container } = render(<Reveal trigger="mount">x</Reveal>);
    const el = container.firstChild as HTMLElement;
    // The wrapper carries only styling/data hooks — no role/aria-* that alters semantics.
    expect(el.getAttribute("role")).toBeNull();
    expect(el.getAttributeNames().filter((n) => n.startsWith("aria-"))).toEqual([]);
  });
});
