import { render, cleanup } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { PricingCard } from "./pricing-card";

afterEach(cleanup);

async function violations(node: Element) {
  const results = await axe.run(node as HTMLElement, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations;
}

describe("PricingCard accessibility (axe, WCAG 2.2 AA scope)", () => {
  it("has no violations with a button CTA", async () => {
    const { container } = render(
      <PricingCard
        planName="Pro"
        price="$29"
        period="/mo"
        description="For teams"
        features={["Unlimited projects", "Priority support"]}
        cta={{ label: "Start trial" }}
        featured
        badge="Most popular"
      />,
    );
    expect(await violations(container)).toEqual([]);
  });

  it("has no violations with a link CTA", async () => {
    const { container } = render(
      <PricingCard planName="Free" price="$0" cta={{ label: "Get started", href: "/signup" }} />,
    );
    expect(await violations(container)).toEqual([]);
  });
});
