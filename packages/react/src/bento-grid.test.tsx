import { render, cleanup, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { BentoGrid, BentoGridItem } from "./bento-grid";

afterEach(cleanup);

describe("BentoGrid / BentoGridItem", () => {
  it("renders a grid with the column count var and items with span data attrs", () => {
    const { container } = render(
      <BentoGrid columns={4}>
        <BentoGridItem colSpan={2} rowSpan={2} title="Big" />
        <BentoGridItem title="Small" />
      </BentoGrid>,
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain("scope-bento");
    expect(grid.style.getPropertyValue("--bento-cols")).toBe("4");
    const items = container.querySelectorAll(".scope-bento-item");
    expect(items).toHaveLength(2);
    expect((items[0] as HTMLElement).getAttribute("data-col-span")).toBe("2");
    expect((items[0] as HTMLElement).getAttribute("data-row-span")).toBe("2");
  });

  it("renders title/description/icon/media slots with configurable heading level", () => {
    render(
      <BentoGridItem
        headingLevel={2}
        icon={<span data-testid="ic">★</span>}
        title="Feature"
        description="Details here"
        media={<img alt="Preview" src="/p.png" />}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Feature" })).toBeTruthy();
    expect(screen.getByText("Details here")).toBeTruthy();
    expect(screen.getByTestId("ic")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Preview" })).toBeTruthy();
  });

  it("wraps in Reveal when revealOnView (else renders the item directly)", () => {
    const { container, rerender } = render(<BentoGridItem title="T" revealOnView />);
    expect(container.querySelector(".scope-reveal .scope-bento-item")).toBeTruthy();
    rerender(<BentoGridItem title="T" />);
    expect(container.querySelector(".scope-reveal")).toBeNull();
    expect(container.querySelector(".scope-bento-item")).toBeTruthy();
  });

  it("SSRs content (server-safe) with no axe violations", async () => {
    const html = renderToString(
      <BentoGrid>
        <BentoGridItem title="A" description="desc" />
      </BentoGrid>,
    );
    expect(html).toContain("scope-bento");
    expect(html).toContain("A");
    const { container } = render(
      <BentoGrid>
        <BentoGridItem title="A" description="desc" headingLevel={2} />
      </BentoGrid>,
    );
    const res = await axe.run(container as HTMLElement, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(res.violations).toEqual([]);
  });
});
