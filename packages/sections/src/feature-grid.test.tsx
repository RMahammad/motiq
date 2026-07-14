import { render, cleanup, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { FeatureGrid } from "./feature-grid";

afterEach(cleanup);

const features = [
  { title: "Fast", description: "Sub-second builds." },
  { title: "Accessible", description: "WCAG 2.2 AA." },
  { title: "Typed", description: "Strict TypeScript." },
];

describe("FeatureGrid", () => {
  it("renders an optional heading block and one item per feature", () => {
    const { container } = render(
      <FeatureGrid eyebrow="Why us" title="Everything you need" subtitle="Batteries included." features={features} />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Everything you need" })).toBeTruthy();
    expect(screen.getByText("Why us")).toBeTruthy();
    expect(container.querySelectorAll(".scope-bento-item").length).toBe(3);
    // feature titles render at a nested level (h3)
    expect(screen.getByRole("heading", { level: 3, name: "Fast" })).toBeTruthy();
  });

  it("works with no heading block (features only)", () => {
    const { container } = render(<FeatureGrid features={features} />);
    expect(container.querySelector(".scope-feature-grid__head")).toBeNull();
    expect(container.querySelectorAll(".scope-bento-item").length).toBe(3);
  });

  it("SSRs (server-safe) with no axe violations", async () => {
    const html = renderToString(<FeatureGrid title="Features" features={features} />);
    expect(html).toContain("<section");
    expect(html).toContain("Fast");
    const { container } = render(<FeatureGrid title="Features" features={features} />);
    const res = await axe.run(container as HTMLElement, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(res.violations).toEqual([]);
  });
});
