import * as React from "react";
import { render, cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  /* ------------------------------------------------------------------------ */
  /* Responsive contract (docs/responsive-standard.md)                          */
  /*                                                                            */
  /* Layout is CONTAINER driven, not viewport driven: the block must lay itself  */
  /* out from the width it actually has, so a hero in a 782px docs column of a   */
  /* 1440px page renders the stacked composition rather than two ~311px slivers. */
  /* jsdom has no layout engine, so these lock the *structure* that produces it. */
  /* ------------------------------------------------------------------------ */
  describe("responsive contract", () => {
    const disclosure = () =>
      screen.getByRole("button", { name: /deploy output & response/i });

    it("declares the hero and console container contexts the layout reads from", () => {
      const { container } = render(<DeploymentControlHero />);
      const section = container.querySelector<HTMLElement>("section[aria-labelledby]");
      expect(section!.className).toContain("@container/hero");
      // Copy band and outer rhythm respond to the hero's own width.
      expect(section!.querySelector('[class*="@5xl/hero:grid-cols-"]')).toBeTruthy();
      // The release console is its own container: the panels inside it get the
      // console's width, which is what actually decides whether tiling fits.
      const console_ = container.querySelector<HTMLElement>('[class~="@container/console"]');
      expect(console_).toBeTruthy();
      expect(console_!.querySelector('[class*="@4xl/console:grid-cols-2"]')).toBeTruthy();
    });

    it("keeps no viewport breakpoint in charge of the block's layout", () => {
      const { container } = render(<DeploymentControlHero />);
      const classes = Array.from(container.querySelectorAll<HTMLElement>("*"))
        .flatMap((el) => Array.from(el.classList));
      // Every responsive utility must be container scoped (`@…/name:`), never
      // viewport scoped — the whole point of the fix.
      expect(classes.filter((c) => /^(sm|md|lg|xl|2xl):/.test(c))).toEqual([]);
    });

    it("collapses the two dense panels behind a narrow-console disclosure", () => {
      const { container } = render(<DeploymentControlHero />);
      const trigger = disclosure();
      expect(trigger.className).toContain("@lg/console:hidden");
      expect(trigger.getAttribute("aria-expanded")).toBe("false");

      const controlled = (trigger.getAttribute("aria-controls") ?? "").split(" ").filter(Boolean);
      expect(controlled).toHaveLength(2);
      const logs = container.querySelector<HTMLElement>('section[aria-label="Deployment output"]');
      const response = container.querySelector<HTMLElement>('section[aria-label="Release request"]');
      expect(controlled).toContain(logs!.id);
      expect(controlled).toContain(response!.id);

      // Collapsed only while the console is under 512px wide; always visible
      // from `@lg/console` up — which includes the 782px docs column and every
      // true desktop width, so nothing there changes.
      for (const panel of [logs!, response!]) {
        expect(panel.className).toContain("hidden");
        expect(panel.className).toContain("@lg/console:block");
      }
    });

    it("reveals both panels when the disclosure is activated", async () => {
      const user = userEvent.setup();
      const { container } = render(<DeploymentControlHero />);
      await user.click(disclosure());
      expect(disclosure().getAttribute("aria-expanded")).toBe("true");
      for (const label of ["Deployment output", "Release request"]) {
        const panel = container.querySelector<HTMLElement>(`section[aria-label="${label}"]`);
        expect(panel!.className).not.toContain("hidden");
      }
    });

    it("honours defaultDetailPanelsOpen for consumers that want everything expanded", () => {
      const { container } = render(<DeploymentControlHero defaultDetailPanelsOpen />);
      expect(disclosure().getAttribute("aria-expanded")).toBe("true");
      const logs = container.querySelector<HTMLElement>('section[aria-label="Deployment output"]');
      expect(logs!.className).not.toContain("hidden");
    });

    it("renders both CTAs as equal full-width blocks in a narrow hero", () => {
      render(<DeploymentControlHero />);
      const primary = screen.getByRole("button", { name: /start deploying/i });
      const secondary = screen.getByRole("button", { name: /read the docs/i });
      for (const cta of [primary, secondary]) {
        expect(cta.className).toContain("w-full");
        expect(cta.className).toContain("@md/hero:w-auto");
        expect(cta.className).toContain("min-h-[46px]");
      }
    });

    it("scales the headline from the hero's own width, not the viewport's", () => {
      render(<DeploymentControlHero />);
      const heading = screen.getByRole("heading", { level: 2 });
      // One `cqi` curve: a 28px floor, and the same 52px ceiling the desktop
      // curve has always had, reached at a 1000px hero. `vw` would keep sizing a
      // 782px column's headline as if it had the whole 1440px page.
      expect(heading.className).toContain("text-[clamp(1.75rem,5.2cqi,3.25rem)]");
      expect(heading.className).not.toMatch(/\dvw/);
      expect(heading.className).toContain("text-balance");
    });

    it("keeps the live-status pill on its own line", () => {
      render(<DeploymentControlHero />);
      const pill = screen
        .getAllByRole("status")
        .find((el) => /live status/i.test(el.textContent ?? ""));
      expect(pill).toBeTruthy();
      expect(pill!.className).toContain("w-fit");
    });
  });
});
