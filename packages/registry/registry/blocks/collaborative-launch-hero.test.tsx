import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

/* -- responsive contract ------------------------------------------------- */

/** A "·" that is its own element inside a flex row becomes its own flex item and
 *  can wrap onto a line alone. Separators must travel with their text. */
function standaloneSeparatorsInFlex(root: HTMLElement): string[] {
  const bad: string[] = [];
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    if (el.children.length > 0) return;
    const text = (el.textContent ?? "").trim();
    if (text !== "·" && text !== "•") return;
    const parentClass = String(el.parentElement?.className ?? "");
    if (/(^|[\s:])flex(\s|$)/.test(parentClass)) bad.push(parentClass);
  });
  return bad;
}

describe("CollaborativeLaunchHero — responsive contract", () => {
  it("is a named size container and gates every layout decision on it, not on the viewport", () => {
    const { container } = render(<CollaborativeLaunchHero phase="approval-pending" />);
    const section = container.querySelector<HTMLElement>(
      'section[aria-label="Collaborative launch"]',
    ) as HTMLElement;
    expect(String(section.className)).toMatch(/@container\/hero/);
    // An element is never its own query container, so nothing on the section
    // itself may query `…/hero` — in particular the gutter, which is why it
    // lives on the inner wrapper.
    expect(String(section.className)).not.toMatch(/@[^\s]*\/hero:/);
    expect(String(section.className)).not.toMatch(/(^|\s)p-\d/);

    // Not one viewport breakpoint survives in the whole composed hero: a docs
    // preview renders this block in a ~782px column at a 1440px viewport, so a
    // viewport query is a query about the wrong box.
    container.querySelectorAll("*").forEach((el) => {
      expect(String(el.className)).not.toMatch(/(^|\s)(sm|md|lg|xl|2xl):/);
    });
  });

  it("folds the discussion + activity behind one accessible disclosure in a narrow container", () => {
    const { container } = render(<CollaborativeLaunchHero phase="approval-pending" />);
    const trigger = container.querySelector<HTMLElement>(
      'button[aria-controls^="collab-hero-secondary-pn"]',
    );
    expect(trigger).not.toBeNull();
    // The control exists only while the HERO'S container is under 1000px —
    // a wide container keeps the two-column composition.
    expect(String(trigger?.className)).toMatch(/@\[1000px\]\/hero:hidden/);
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");

    const panelId = trigger?.getAttribute("aria-controls") ?? "";
    const panel = container.querySelector<HTMLElement>(`[id="${panelId}"]`);
    expect(panel).not.toBeNull();
    // Collapsed in a narrow container, always laid out from 1000px of container.
    expect(String(panel?.className)).toMatch(/(^|\s)hidden(\s|$)/);
    expect(String(panel?.className)).toMatch(/@\[1000px\]\/hero:flex/);
  });

  it("splits the copy band and tiles the surface on the same container threshold", () => {
    const { container } = render(<CollaborativeLaunchHero phase="approval-pending" />);
    const h1 = container.querySelector("h1") as HTMLElement;
    const copyBand = h1.closest(".grid") as HTMLElement;
    expect(String(copyBand.className)).toMatch(
      /@\[1000px\]\/hero:grid-cols-\[minmax\(0,1fr\)_auto\]/,
    );
    const surface = container.querySelector<HTMLElement>(
      'section[aria-label="Launch sign-off"]',
    )?.closest(".grid") as HTMLElement;
    expect(String(surface.className)).toMatch(/@\[1000px\]\/hero:grid-cols-2/);
  });

  it("expands the disclosure on activation and reveals both supporting tiles", async () => {
    const user = userEvent.setup();
    const { container } = render(<CollaborativeLaunchHero phase="approval-pending" />);
    const trigger = container.querySelector<HTMLElement>(
      'button[aria-controls^="collab-hero-secondary-pn"]',
    ) as HTMLElement;
    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const panelId = trigger.getAttribute("aria-controls") ?? "";
    const panel = container.querySelector<HTMLElement>(`[id="${panelId}"]`) as HTMLElement;
    expect(String(panel.className)).toMatch(/(^|\s)flex(\s|$)/);
    expect(String(panel.className)).not.toMatch(/(^|\s)hidden(\s|$)/);
    expect(within(panel).getByRole("region", { name: "Launch discussion" })).toBeTruthy();
    expect(within(panel).getByText("Launch activity")).toBeTruthy();
  });

  it("renders both CTAs full-width with a 44px target in a narrow container", () => {
    render(
      <CollaborativeLaunchHero
        primaryCta={{ label: "Start a review", href: "#go" }}
        secondaryCta={{ label: "See how it works", href: "#tour" }}
      />,
    );
    for (const name of ["Start a review", "See how it works"]) {
      const cta = screen.getByRole("link", { name });
      expect(String(cta.className)).toMatch(/(^|\s)w-full(\s|$)/);
      expect(String(cta.className)).toMatch(/@lg\/hero:w-auto/);
      expect(String(cta.className)).toMatch(/min-h-\[44px\]/);
    }
  });

  it("ramps the headline from 28px in a narrow container without changing the desktop ramp", () => {
    render(<CollaborativeLaunchHero />);
    const h1 = screen.getByRole("heading", { level: 1 });
    const cls = String(h1.className);
    // The fluid term is capped by whichever is smaller — the screen or the
    // hero's own column — so a 782px column at a 1440px viewport no longer
    // gets a headline sized for a 1440px page. For a full-bleed hero the `vw`
    // term always wins, which is what preserves the desktop ramp exactly.
    expect(cls).toMatch(/text-\[clamp\(1\.75rem,min\(7\.5vw,9cqw\),2\.25rem\)\]/);
    expect(cls).toMatch(/@lg\/hero:text-\[clamp\(2rem,min\(4\.4vw,6cqw\),3\.25rem\)\]/);
    expect(cls).toMatch(/text-balance/);
  });

  it("never renders a bare separator as its own flex item, in any phase", () => {
    for (const phase of COLLAB_HERO_PHASES) {
      const { container, unmount } = render(<CollaborativeLaunchHero phase={phase} />);
      expect(standaloneSeparatorsInFlex(container)).toEqual([]);
      unmount();
    }
  });
});
