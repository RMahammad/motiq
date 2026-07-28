import * as React from "react";
import { render, cleanup, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    expect(screen.queryAllByText("Tier-1")).toHaveLength(0);

    rerender(<LiveDataCommandHero phase="filtering" />);
    // The active-filter chip labels the one applied facet — inside the results
    // header, and again in the narrow-viewport watchlist summary so the facet is
    // visible without expanding the disclosure.
    expect(screen.getAllByText("Tier-1").length).toBeGreaterThan(0);
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

  /* ------------------------------------------------------------------------ *
   * Responsive contracts. jsdom has no layout, so these assert the *structure*
   * that produces the small-screen behaviour: grouped meta, wrapping titles,
   * mobile-first utilities, and a real disclosure.
   * ------------------------------------------------------------------------ */

  describe("responsive contract", () => {
    it("renders full-bleed, 44px-tall CTAs below sm and intrinsic ones from sm up", () => {
      render(<LiveDataCommandHero />);
      for (const name of ["Start monitoring", "Book a walkthrough"]) {
        const cta = screen.getByRole("button", { name });
        expect(cta.className).toContain("w-full");
        expect(cta.className).toContain("min-h-[44px]");
        expect(cta.className).toContain("@md/hero:w-auto");
        expect(cta.className).toContain("@md/hero:min-h-0");
      }
    });

    it("scales the headline from a phone-first clamp, not a desktop one", () => {
      const { container } = render(<LiveDataCommandHero />);
      const h2 = container.querySelector("h2") as HTMLElement;
      // The unprefixed clamp must be legible on its own — a container rule may
      // only enhance it.
      expect(h2.className).toContain("text-[clamp(1.75rem,7.5cqw,2.2rem)]");
      expect(h2.className).toContain("@4xl/hero:text-[clamp(2rem,4.4cqw,3.1rem)]");
      expect(h2.className).toContain("text-balance");
    });

    it("presents the metrics as a snap-scrolling labelled rail below sm and a 3-up grid from sm", () => {
      const { container } = render(<LiveDataCommandHero />);
      const rail = container.querySelector("[data-metric-rail]") as HTMLElement;
      expect(rail).toBeTruthy();
      for (const cls of ["snap-x", "snap-mandatory", "overflow-x-auto", "overscroll-x-contain"]) {
        expect(rail.className).toContain(cls);
      }
      // …and the original desktop composition is preserved verbatim.
      expect(rail.className).toContain("@2xl/hero:grid");
      expect(rail.className).toContain("@2xl/hero:grid-cols-3");
      expect(rail.children).toHaveLength(3);
    });

    it("collapses the watchlist behind a real disclosure that only exists below sm", async () => {
      const user = userEvent.setup();
      const { container } = render(<LiveDataCommandHero />);
      const toggle = screen.getByRole("button", { name: /watched signals/i });
      const panel = container.querySelector("[data-watchlist-panel]") as HTMLElement;

      expect(toggle.className).toContain("@2xl/hero:hidden");
      // 44px tap target.
      expect(toggle.className).toContain("min-h-[44px]");
      expect(toggle.getAttribute("aria-controls")).toBe(panel.id);
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
      // Collapsed on a phone, but unconditionally open from sm up.
      expect(panel.className).toContain("hidden");
      expect(panel.className).toContain("@2xl/hero:block");

      await user.click(toggle);
      expect(toggle.getAttribute("aria-expanded")).toBe("true");
      expect((container.querySelector("[data-watchlist-panel]") as HTMLElement).className).toContain("block");
    });

    it("wraps signal titles instead of ellipsising them to a few characters", () => {
      const { container } = render(<LiveDataCommandHero />);
      const titles = container.querySelectorAll("[data-watchlist-panel] .line-clamp-2");
      expect(titles.length).toBeGreaterThan(0);
      // A single-line `truncate` on a title is the failure this replaces.
      for (const t of titles) expect(t.className).not.toContain("truncate");
    });

    it("groups every stacked-row meta label with its value so neither can be orphaned", () => {
      // Force the stacked (narrow) presentation. The table measures its OWN box
      // via ResizeObserver (not the viewport), and jsdom reports every box as
      // 0x0, so stub the observer to report a narrow content rect.
      const originalMatchMedia = globalThis.ResizeObserver;
      class NarrowResizeObserver {
        constructor(private readonly cb: ResizeObserverCallback) {}
        observe(target: Element) {
          this.cb(
            [{ target, contentRect: { width: 320, height: 0 } } as unknown as ResizeObserverEntry],
            this as unknown as ResizeObserver,
          );
        }
        unobserve() {}
        disconnect() {}
      }
      globalThis.ResizeObserver = NarrowResizeObserver as unknown as typeof ResizeObserver;
      let container!: HTMLElement;
      try {
        act(() => {
          ({ container } = render(<LiveDataCommandHero />));
        });
      } finally {
        globalThis.ResizeObserver = originalMatchMedia;
      }

      const metas = container.querySelectorAll("[data-signal-meta]");
      expect(metas.length).toBeGreaterThan(0);
      for (const meta of metas) {
        expect(meta.className).toContain("flex-wrap");
        const pairs = meta.querySelectorAll("[data-meta-pair]");
        expect(pairs.length).toBe(3);
        for (const pair of pairs) {
          // Label + value travel together to the next line, never separately.
          expect(pair.className).toContain("whitespace-nowrap");
          expect(pair.querySelector("dt")).toBeTruthy();
          expect(pair.querySelector("dd")).toBeTruthy();
        }
      }
      // The numeric readouts keep tabular figures in the stacked layout too.
      expect(container.querySelectorAll("[data-meta-pair] dd.tabular-nums").length).toBeGreaterThan(0);
    });
  });
});
