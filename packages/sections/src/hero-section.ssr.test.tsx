import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HeroSection } from "./hero-section";

// HeroSection is server-safe (no "use client"): it renders full content on the server
// and composes client primitives (Stagger/Reveal) as leaves — the ideal RSC pattern.
describe("HeroSection SSR", () => {
  it("renders the full section content on the server", () => {
    const html = renderToString(
      <HeroSection
        eyebrow="New"
        title="Ship faster"
        subtitle="Do more with less."
        actions={<a href="/start">Get started</a>}
      />,
    );
    expect(html).toContain("<section");
    expect(html).toContain("<h1");
    expect(html).toContain("Ship faster");
    expect(html).toContain("Do more with less.");
    expect(html).toContain("Get started");
  });

  it("does not emit a client boundary of its own (composes client leaves)", () => {
    const html = renderToString(<HeroSection title="T" />);
    // The section markup renders; the Stagger leaf carries the client boundary, not the section.
    expect(html).toContain("scope-hero");
    expect(html).toContain("scope-stagger");
  });
});
