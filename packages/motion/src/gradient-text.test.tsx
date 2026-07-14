import { render, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { GradientText } from "./gradient-text";

afterEach(cleanup);

describe("GradientText", () => {
  it("renders selectable text with the base class", () => {
    const { getByText, container } = render(<GradientText>Beautiful</GradientText>);
    expect(getByText("Beautiful")).toBeTruthy();
    expect((container.firstChild as HTMLElement).className).toContain("scope-gradient-text");
  });

  it("builds a gradient custom property from from/via/to", () => {
    const { container } = render(
      <GradientText from="#f00" via="#0f0" to="#00f">
        x
      </GradientText>,
    );
    const grad = (container.firstChild as HTMLElement).style.getPropertyValue("--gradient");
    expect(grad).toContain("#f00");
    expect(grad).toContain("#0f0");
    expect(grad).toContain("#00f");
  });

  it("only sets data-animate when animate is true", () => {
    const { container, rerender } = render(<GradientText animate>x</GradientText>);
    expect((container.firstChild as HTMLElement).getAttribute("data-animate")).toBe("true");
    rerender(<GradientText>x</GradientText>);
    expect((container.firstChild as HTMLElement).getAttribute("data-animate")).toBeNull();
  });

  it("SSRs the text (server-safe)", () => {
    const html = renderToString(<GradientText animate>Headline</GradientText>);
    expect(html).toContain("Headline");
    expect(html).toContain("scope-gradient-text");
  });

  it("has no axe violations (text remains real content)", async () => {
    const { container } = render(
      <h2>
        <GradientText>Accessible heading</GradientText>
      </h2>,
    );
    const res = await axe.run(container as HTMLElement, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(res.violations).toEqual([]);
  });
});
