import * as React from "react";
import { render, cleanup, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import {
  LiveDataCommandHero,
  type DataHeroPhase,
} from "./live-data-command-hero";

afterEach(cleanup);

const PHASES: DataHeroPhase[] = [
  "initial",
  "live",
  "filtering",
  "refreshing",
  "partial-update",
  "stale",
  "error",
  "recovery",
];

describe("LiveDataCommandHero", () => {
  it("renders the default demo surface without throwing", () => {
    render(<LiveDataCommandHero />);
    // The live feed table caption anchors the streaming subset.
    expect(screen.getByText("Live per-signal operational metrics")).toBeTruthy();
  });

  it("renders the outcome headline as a heading", () => {
    render(<LiveDataCommandHero headline="Command your live data" />);
    const heading = screen.getByRole("heading", { name: /command your live data/i });
    expect(heading).toBeTruthy();
    expect(heading.tagName).toBe("H2");
  });

  it("renders both call-to-action controls with their labels", () => {
    render(
      <LiveDataCommandHero
        primaryCta={{ label: "Start now" }}
        secondaryCta={{ label: "See a demo" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Start now" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "See a demo" })).toBeTruthy();
  });

  it("renders a CTA with an href as a link", () => {
    render(
      <LiveDataCommandHero
        primaryCta={{ label: "Get started", href: "/signup" }}
        secondaryCta={{ label: "Contact", href: "/contact" }}
      />,
    );
    const link = screen.getByRole("link", { name: "Get started" });
    expect(link.getAttribute("href")).toBe("/signup");
  });

  it("renders each required phase without throwing", () => {
    for (const phase of PHASES) {
      const { unmount } = render(<LiveDataCommandHero phase={phase} />);
      // Every phase must still expose the outcome heading + at least one CTA.
      expect(screen.getAllByRole("heading").length).toBeGreaterThan(0);
      expect(screen.getByRole("button", { name: "Start monitoring" })).toBeTruthy();
      unmount();
    }
  });

  it("surfaces the active filter chip only in the filtering phase", () => {
    const { rerender } = render(<LiveDataCommandHero phase="live" />);
    expect(screen.queryByText("Tier-1")).toBeNull();

    rerender(<LiveDataCommandHero phase="filtering" />);
    // The active-filter chip labels the one applied facet.
    expect(screen.getByText("Tier-1")).toBeTruthy();
  });

  it("produces identical, deterministic server markup on repeat renders (SSR)", () => {
    // Server render twice: no Date.now/Math.random/new Date may leak, so the two
    // passes must be byte-identical (useId resets per server render).
    const first = renderToStaticMarkup(<LiveDataCommandHero />);
    const second = renderToStaticMarkup(<LiveDataCommandHero />);
    expect(first).toBe(second);
    expect(first).toContain("See your data change the moment it does");
  });

  it("renders under reduced motion without throwing", () => {
    render(<LiveDataCommandHero reducedMotion phase="live" />);
    expect(screen.getByText("Live per-signal operational metrics")).toBeTruthy();
  });

  it("accepts a custom deterministic dataset", () => {
    render(
      <LiveDataCommandHero
        dataset={[
          { id: "only", name: "Solo Signal", region: "us-west", tier: "tier-1", status: "healthy", throughput: 1000, latency: 50, errorRate: 0.1 },
        ]}
      />,
    );
    expect(screen.getAllByText("Solo Signal").length).toBeGreaterThan(0);
  });
});
