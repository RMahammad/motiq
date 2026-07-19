import { render, cleanup, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { CTASection } from "./cta-section";

afterEach(cleanup);

describe("CTASection", () => {
  it("renders heading, subtitle and actions slot", () => {
    render(
      <CTASection
        title="Ready to ship?"
        subtitle="Start building today."
        actions={<a href="/start" className="scope-btn">Get started</a>}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Ready to ship?" })).toBeTruthy();
    expect(screen.getByText("Start building today.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Get started" })).toBeTruthy();
  });

  it("wraps content in Reveal by default and can disable it", () => {
    const { container, rerender } = render(<CTASection title="T" />);
    expect(container.querySelector(".scope-reveal .scope-cta__inner")).toBeTruthy();
    rerender(<CTASection title="T" animate={false} />);
    expect(container.querySelector(".scope-reveal")).toBeNull();
    expect(container.querySelector(".scope-cta__inner")).toBeTruthy();
  });

  it("reflects align and honors headingLevel", () => {
    const { container } = render(<CTASection title="T" align="start" headingLevel={3} />);
    expect((container.firstChild as HTMLElement).getAttribute("data-align")).toBe("start");
    expect(screen.getByRole("heading", { level: 3, name: "T" })).toBeTruthy();
  });

  it("SSRs (server-safe) with no axe violations", async () => {
    const html = renderToString(
      <CTASection title="Ready?" actions={<a href="/x">Go</a>} />,
    );
    expect(html).toContain("<section");
    expect(html).toContain("Ready?");
    const { container } = render(<CTASection title="Ready?" actions={<a href="/x">Go</a>} />);
    const res = await axe.run(container as HTMLElement, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(res.violations).toEqual([]);
  });
});
