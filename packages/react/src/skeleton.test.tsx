import { render, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { Skeleton } from "./skeleton";

afterEach(cleanup);

describe("Skeleton", () => {
  it("is decorative (aria-hidden) with the base class and variant", () => {
    const { container } = render(<Skeleton variant="circle" width={40} height={40} />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("scope-skeleton");
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.getAttribute("data-variant")).toBe("circle");
  });

  it("applies width/height/radius via style", () => {
    const { container } = render(<Skeleton width="80%" height={16} radius={8} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe("80%");
    expect(el.style.height).toBe("16px");
    expect(el.style.borderRadius).toBe("8px");
  });

  it("SSRs (server-safe)", () => {
    const html = renderToString(<Skeleton variant="text" width={120} />);
    expect(html).toContain("scope-skeleton");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-variant="text"');
  });

  it("has no axe violations when used inside a busy region", async () => {
    const { container } = render(
      <div role="status" aria-busy="true" aria-label="Loading">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="90%" />
      </div>,
    );
    const res = await axe.run(container as HTMLElement, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(res.violations).toEqual([]);
  });
});
