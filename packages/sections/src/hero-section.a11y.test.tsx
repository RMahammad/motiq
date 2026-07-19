import { render, cleanup } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { HeroSection } from "./hero-section";

afterEach(cleanup);

describe("HeroSection accessibility (axe, WCAG 2.2 AA scope)", () => {
  it("has no violations with realistic content", async () => {
    const { container } = render(
      <HeroSection
        eyebrow="New"
        title="Ship faster"
        subtitle="Production-ready motion for your app."
        actions={
          <>
            <a href="/start" className="scope-btn">
              Get started
            </a>
            <a href="/docs" className="scope-btn">
              Read the docs
            </a>
          </>
        }
        media={<img alt="Product screenshot" src="/hero.png" />}
      />,
    );
    const res = await axe.run(container as HTMLElement, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(res.violations).toEqual([]);
  });
});
