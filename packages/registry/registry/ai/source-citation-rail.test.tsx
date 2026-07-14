import * as React from "react";
import { render, cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SourceCitationRail, CitationMarker, type CitationSource } from "./source-citation-rail";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const SOURCES: CitationSource[] = [
  {
    id: "s1",
    index: 1,
    title: "Streaming responses guide",
    domain: "docs.example.dev",
    url: "https://example.com/docs/streaming",
    type: "docs",
    publishedAt: "2026-02-11",
    relevance: 0.9,
    verified: true,
    excerpt: "Flush tokens as they are produced and apply backpressure.",
  },
  {
    id: "s2",
    index: 2,
    title: "Citation trust field study",
    domain: "review.example.org",
    url: "https://example.com/papers/trust",
    type: "paper",
    publishedAt: "2025-11-03",
    relevance: 0.7,
    verified: false,
  },
];

function Fixture(props: Partial<React.ComponentProps<typeof SourceCitationRail>>) {
  return (
    <SourceCitationRail sources={SOURCES} {...props}>
      <p>
        Stream tokens as produced <CitationMarker source="s1" />, which readers trust more{" "}
        <CitationMarker source="s2" />.
      </p>
    </SourceCitationRail>
  );
}

describe("SourceCitationRail", () => {
  it("syncs the active source between an inline marker and the rail", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Fixture onActiveSourceChange={onChange} defaultActiveSourceId={null} />);

    // Clicking the inline [1] marker selects source 1 in the rail (marker → rail).
    const marker = screen.getByRole("button", { name: /citation 1: streaming responses guide/i });
    expect(marker.getAttribute("aria-pressed")).toBe("false");
    await user.click(marker);
    expect(onChange).toHaveBeenLastCalledWith("s1");
    expect(marker.getAttribute("aria-pressed")).toBe("true");

    // The rail row for source 1 reports itself as the current selection (not colour-only).
    const railRow = screen.getByRole("button", { name: /citation 1, streaming responses guide, selected/i });
    expect(railRow.getAttribute("aria-current")).toBe("true");
    expect(within(railRow).getByText("Active")).toBeTruthy();
    await noViolations(container);
  });

  it("selects a source from the rail by keyboard (roving arrow keys)", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Fixture onActiveSourceChange={onChange} defaultActiveSourceId="s1" />);

    const firstRow = screen.getByRole("button", { name: /citation 1, streaming responses guide/i });
    firstRow.focus();
    await user.keyboard("{ArrowDown}");
    expect(onChange).toHaveBeenLastCalledWith("s2");
    await user.keyboard("{Home}");
    expect(onChange).toHaveBeenLastCalledWith("s1");
  });

  it("exposes each source URL as a semantic external link (href + rel + new-tab name)", () => {
    render(<Fixture defaultActiveSourceId="s1" />);
    const link = screen.getByRole("link", { name: /open streaming responses guide in a new tab/i });
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("https://example.com/docs/streaming");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    // Verification is shown as an app-provided state, labelled — never asserted by the component.
    expect(screen.getByText("Verified")).toBeTruthy();
    expect(screen.getByText("Unverified")).toBeTruthy();
  });

  it("toggles an app-provided excerpt via an aria-expanded disclosure", async () => {
    const user = userEvent.setup();
    render(<Fixture defaultActiveSourceId="s1" showExcerpts />);
    const toggle = screen.getByRole("button", { name: /show excerpt/i });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await user.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("region", { name: /excerpt from streaming responses guide/i })).toBeTruthy();
    expect(screen.getByText(/flush tokens as they are produced/i)).toBeTruthy();
  });

  it("renders the final state (no motion) under reduced motion", async () => {
    const orig = window.matchMedia;
    window.matchMedia = ((q: string) => ({
      matches: /prefers-reduced-motion/.test(q),
      media: q,
      onchange: null,
      addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
    })) as typeof window.matchMedia;
    try {
      const { container } = render(<Fixture defaultActiveSourceId="s1" />);
      // Active row is present and marked current without depending on animation.
      const railRow = screen.getByRole("button", { name: /citation 1, streaming responses guide, selected/i });
      expect(railRow.getAttribute("aria-current")).toBe("true");
      await noViolations(container);
    } finally {
      window.matchMedia = orig;
    }
  });
});
