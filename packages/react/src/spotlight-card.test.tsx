import { render, cleanup, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SpotlightCard } from "./spotlight-card";

afterEach(cleanup);

describe("SpotlightCard", () => {
  it("writes pointer position into CSS vars on mouse move (no re-render)", () => {
    const { container } = render(<SpotlightCard>content</SpotlightCard>);
    const el = container.firstChild as HTMLElement;
    fireEvent.mouseMove(el, { clientX: 120, clientY: 40 });
    // jsdom getBoundingClientRect is 0,0 → var equals clientX/clientY px
    expect(el.style.getPropertyValue("--spotlight-x")).toBe("120px");
    expect(el.style.getPropertyValue("--spotlight-y")).toBe("40px");
  });

  it("sets the radius var and forwards a custom onMouseMove", () => {
    const onMouseMove = vi.fn();
    const { container } = render(
      <SpotlightCard radius={300} onMouseMove={onMouseMove}>
        x
      </SpotlightCard>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.getPropertyValue("--spotlight-radius")).toBe("300px");
    fireEvent.mouseMove(el, { clientX: 1, clientY: 1 });
    expect(onMouseMove).toHaveBeenCalledTimes(1);
  });

  it("forwards ref and merges className", () => {
    const ref = { current: null as HTMLDivElement | null };
    const { container } = render(
      <SpotlightCard ref={ref} className="custom">
        x
      </SpotlightCard>,
    );
    expect(ref.current).toBe(container.firstChild);
    expect((container.firstChild as HTMLElement).classList.contains("custom")).toBe(true);
  });

  it("SSRs its content and no violations", async () => {
    const html = renderToString(<SpotlightCard>Card body</SpotlightCard>);
    expect(html).toContain("scope-spotlight-card");
    expect(html).toContain("Card body");
    const { container } = render(
      <SpotlightCard>
        <a href="/x">Actionable</a>
      </SpotlightCard>,
    );
    const res = await axe.run(container as HTMLElement, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(res.violations).toEqual([]);
  });
});
