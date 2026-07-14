import { render, cleanup } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { Stagger, StaggerItem } from "./stagger";
import { InView } from "./in-view";

afterEach(cleanup);

async function violations(node: Element) {
  const results = await axe.run(node as HTMLElement, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations;
}

describe("Stagger / InView accessibility (axe, WCAG 2.2 AA scope)", () => {
  it("Stagger wraps interactive items without violations", async () => {
    const { container } = render(
      <Stagger trigger="mount">
        <StaggerItem>
          <button type="button">One</button>
        </StaggerItem>
        <StaggerItem>
          <button type="button">Two</button>
        </StaggerItem>
      </Stagger>,
    );
    expect(await violations(container)).toEqual([]);
  });

  it("InView is a transparent wrapper (no violations, no altering ARIA)", async () => {
    const { container } = render(
      <InView>
        <p>Readable content.</p>
      </InView>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.getAttributeNames().filter((n) => n.startsWith("aria-"))).toEqual([]);
    expect(await violations(container)).toEqual([]);
  });
});
