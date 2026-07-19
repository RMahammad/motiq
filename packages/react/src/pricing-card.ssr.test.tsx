import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PricingCard } from "./pricing-card";

describe("PricingCard SSR", () => {
  it("renders full content on the server (no window / IntersectionObserver needed)", () => {
    const html = renderToString(
      <PricingCard
        planName="Pro"
        price="$29"
        period="/mo"
        features={["A", "B"]}
        cta={{ label: "Buy", href: "/x" }}
      />,
    );
    expect(html).toContain("Pro");
    expect(html).toContain("$29");
    expect(html).toContain("scope-pricing-card");
    expect(html).toContain("Buy");
    expect(html).toContain('href="/x"');
  });

  it("SSRs even when wrapped in Reveal (revealOnView) — hidden final state", () => {
    const html = renderToString(
      <PricingCard planName="Team" price="$99" revealOnView cta={{ label: "Go", href: "/y" }} />,
    );
    expect(html).toContain("scope-reveal");
    expect(html).toContain('data-motion="hidden"');
    expect(html).toContain("Team");
  });
});
