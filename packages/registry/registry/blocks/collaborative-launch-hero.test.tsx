import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";

import {
  CollaborativeLaunchHero,
  COLLAB_HERO_PHASES,
  type CollabHeroPhase,
} from "./collaborative-launch-hero";

afterEach(cleanup);

/** Neutralize React's global useId counter, which advances across sequential
 * renders in one test process (real SSR resets it per render). What remains is
 * the render output itself — which must be byte-identical for a given phase. */
function stableMarkup(html: string): string {
  return html.replace(/_r_[0-9a-z]+_/g, "_r_X_");
}

/** Render exactly as a real Node server would: no effects run (so the mount
 * re-anchor to Date.now never fires) and `document` is undefined (so the
 * composed components' portal guards no-op, matching production SSR). The pure
 * server output must be a deterministic function of the phase alone. */
function ssrMarkup(node: React.ReactElement): string {
  const g = globalThis as unknown as { document?: unknown };
  const realDoc = g.document;
  delete g.document;
  try {
    return stableMarkup(renderToStaticMarkup(node));
  } finally {
    g.document = realDoc;
  }
}

describe("CollaborativeLaunchHero", () => {
  it("renders the default demo without throwing", () => {
    expect(() => render(<CollaborativeLaunchHero />)).not.toThrow();
  });

  it("renders the headline as a real heading", () => {
    render(<CollaborativeLaunchHero headline="Ship it together" />);
    const heading = screen.getByRole("heading", { name: "Ship it together" });
    expect(heading.tagName).toBe("H1");
  });

  it("renders both CTAs with their labels and hrefs", () => {
    render(
      <CollaborativeLaunchHero
        primaryCta={{ label: "Start a review", href: "#go" }}
        secondaryCta={{ label: "Watch the tour", href: "#tour" }}
      />,
    );
    expect(screen.getByRole("link", { name: "Start a review" }).getAttribute("href")).toBe("#go");
    expect(screen.getByRole("link", { name: "Watch the tour" }).getAttribute("href")).toBe("#tour");
  });

  it("renders a CTA as a button when no href is supplied", () => {
    render(
      <CollaborativeLaunchHero
        primaryCta={{ label: "Get started", onClick: () => {} }}
        secondaryCta={{ label: "Learn more" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Get started" })).toBeTruthy();
  });

  it("exposes exactly the seven required phases", () => {
    expect(COLLAB_HERO_PHASES).toEqual([
      "review-open",
      "commenting",
      "changes-requested",
      "approval-pending",
      "approved",
      "rejected",
      "resolved",
    ]);
  });

  it.each(COLLAB_HERO_PHASES)("renders phase %s without throwing", (phase) => {
    expect(() =>
      render(<CollaborativeLaunchHero phase={phase as CollabHeroPhase} />),
    ).not.toThrow();
    // The collaboration surface (approval region) is present in every phase.
    expect(screen.getByRole("region", { name: "Launch sign-off" })).toBeTruthy();
  });

  it("surfaces the pending decision to the viewer in approval-pending", () => {
    render(<CollaborativeLaunchHero phase="approval-pending" />);
    const surface = screen.getByLabelText("Collaborative launch");
    // The awaiting-your-decision status is announced by text, not color alone.
    expect(within(surface).getByText("Awaiting your decision")).toBeTruthy();
  });

  it("shows the approved status when approved", () => {
    render(<CollaborativeLaunchHero phase="approved" />);
    const surface = screen.getByLabelText("Collaborative launch");
    expect(within(surface).getByText("Approved to ship")).toBeTruthy();
  });

  it("produces identical markup across two server renders (deterministic, no drift)", () => {
    // renderToStaticMarkup runs no effects, so it captures the pure server output
    // (the mount effect that re-anchors relative times never fires). Fixed-epoch
    // demo data + no clock reads during render → byte-identical server markup.
    const once = ssrMarkup(<CollaborativeLaunchHero phase="approval-pending" />);
    const twice = ssrMarkup(<CollaborativeLaunchHero phase="approval-pending" />);
    expect(once).toBe(twice);
    expect(once.length).toBeGreaterThan(0);
  });

  it("renders every phase deterministically (server markup)", () => {
    for (const phase of COLLAB_HERO_PHASES) {
      const a = ssrMarkup(<CollaborativeLaunchHero phase={phase} />);
      const b = ssrMarkup(<CollaborativeLaunchHero phase={phase} />);
      expect(a).toBe(b);
    }
  });

  it("renders with reducedMotion forced on", () => {
    expect(() =>
      render(<CollaborativeLaunchHero reducedMotion phase="review-open" />),
    ).not.toThrow();
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
  });

  it("accepts a decorative background slot", () => {
    render(<CollaborativeLaunchHero background={<div data-testid="bg-slot" />} />);
    expect(screen.getByTestId("bg-slot")).toBeTruthy();
  });
});
