import * as React from "react";
import { render, cleanup, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import {
  DeploymentControlHero,
  type DeployHeroPhase,
} from "./deployment-control-hero";

/**
 * Integration coverage for the hero block itself: it composes the four real
 * developer-tools components, so these tests assert the block's own contract —
 * heading semantics, both CTAs, the four-stage pipeline, the phase machine
 * driving the surface, SSR determinism, and reduced motion — against the real
 * rendered output.
 */

afterEach(cleanup);

const ALL_PHASES: DeployHeroPhase[] = [
  "ready",
  "deploying",
  "validating",
  "failed",
  "retrying",
  "completed",
];

/** The pipeline lives in its own labelled section; scope stage queries to it. */
function pipelineStages(container: HTMLElement): HTMLElement[] {
  const section = container.querySelector<HTMLElement>(
    'section[aria-label="Deployment pipeline"]',
  );
  if (!section) throw new Error("pipeline section not found");
  return within(section).getAllByRole("listitem");
}

describe("DeploymentControlHero", () => {
  it("renders the default demo, composing all four surfaces, without throwing", () => {
    const { container } = render(<DeploymentControlHero />);
    // Environment switcher (its trigger is a labelled button).
    expect(screen.getByRole("button", { name: /Deploy target/i })).toBeTruthy();
    // Live log region carries an accessible name.
    expect(screen.getByRole("log", { name: "Deployment output" })).toBeTruthy();
    // Pipeline + inspector render.
    expect(pipelineStages(container)).toHaveLength(4);
    expect(screen.getAllByText(/POST \/v1\/releases/i).length).toBeGreaterThan(0);
  });

  it("exposes the headline as a real heading tied to the section", () => {
    const { container } = render(<DeploymentControlHero headline="Deploy without fear" />);
    const heading = screen.getByRole("heading", { name: /deploy without fear/i });
    expect(heading.tagName).toBe("H2");
    const section = container.querySelector("section[aria-labelledby]");
    expect(section?.getAttribute("aria-labelledby")).toBe(heading.getAttribute("id"));
  });

  it("renders both CTAs as real interactive elements", () => {
    render(
      <DeploymentControlHero
        primaryCta={{ label: "Launch it" }}
        secondaryCta={{ label: "See the guide", href: "/docs" }}
      />,
    );
    expect(screen.getByRole("button", { name: /launch it/i })).toBeTruthy();
    const link = screen.getByRole("link", { name: /see the guide/i });
    expect(link.getAttribute("href")).toBe("/docs");
  });

  it("shows four ordered pipeline stages", () => {
    const { container } = render(<DeploymentControlHero phase="deploying" />);
    const rows = pipelineStages(container);
    expect(rows).toHaveLength(4);
    const names = rows.map((r) => r.textContent ?? "");
    expect(names[0]).toMatch(/Build/);
    expect(names[1]).toMatch(/Test/);
    expect(names[2]).toMatch(/Deploy/);
    expect(names[3]).toMatch(/Verify/);
  });

  it.each(ALL_PHASES)("renders the %s phase without throwing", (phase) => {
    expect(() => render(<DeploymentControlHero phase={phase} />)).not.toThrow();
    expect(screen.getByRole("heading", { level: 2 })).toBeTruthy();
  });

  it("drives the pipeline deploy stage from the phase prop", () => {
    const { container, rerender } = render(<DeploymentControlHero phase="failed" />);
    // Deploy is the third stage.
    expect(pipelineStages(container)[2].textContent).toMatch(/Failed/);

    rerender(<DeploymentControlHero phase="completed" />);
    expect(pipelineStages(container)[2].textContent).toMatch(/Passed/);
  });

  it("produces identical markup on two server renders (SSR determinism)", () => {
    // Emulate real Node SSR (no `document`), where portal-using children render
    // their server-safe null branch. jsdom otherwise reports `document`, which
    // the server renderer rejects for portals.
    const g = globalThis as unknown as { document?: Document };
    const original = g.document;
    try {
      g.document = undefined;
      const first = renderToStaticMarkup(<DeploymentControlHero />);
      const second = renderToStaticMarkup(<DeploymentControlHero />);
      expect(first).toBe(second);
      expect(first.length).toBeGreaterThan(0);
    } finally {
      g.document = original;
    }
  });

  it("renders with forced reduced motion", () => {
    expect(() =>
      render(<DeploymentControlHero reducedMotion phase="deploying" />),
    ).not.toThrow();
    expect(screen.getByRole("heading", { level: 2 })).toBeTruthy();
  });
});
