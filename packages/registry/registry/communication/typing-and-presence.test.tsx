import * as React from "react";
import { render, cleanup, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";

import { TypingAndPresence, typingSummary, type Participant } from "./typing-and-presence";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const PEOPLE: Participant[] = [
  { id: "jamie", displayName: "Jamie", presenceState: "active", typingState: "typing" },
  { id: "morgan", displayName: "Morgan", presenceState: "online" },
  { id: "ada", displayName: "Ada", presenceState: "idle" },
];

describe("typingSummary", () => {
  it("uses is/are + a word count for one, two, and many typers", () => {
    expect(typingSummary([])).toBe("");
    expect(typingSummary(["Jamie"])).toBe("Jamie is typing");
    expect(typingSummary(["Jamie", "Morgan"])).toBe("Jamie and Morgan are typing");
    expect(typingSummary(["Jamie", "Morgan", "Ada"])).toBe("Three people are typing");
    // Verb swaps for other activities while the auxiliary stays count-driven.
    expect(typingSummary(["Jamie"], "recording audio")).toBe("Jamie is recording audio");
  });
});

describe("TypingAndPresence", () => {
  it("renders the settled typing summary as text and passes axe", async () => {
    const two = PEOPLE.map((p, i) => (i < 2 ? { ...p, typingState: "typing" as const } : p));
    const { container } = render(<TypingAndPresence participants={two} context="#redesign" />);
    expect(screen.getAllByText("Jamie and Morgan are typing").length).toBeGreaterThan(0);
    await noViolations(container);
  });
});

/* -- responsive contract ------------------------------------------------- */

describe("TypingAndPresence — responsive contract", () => {
  it("responds to its own width, not the viewport: the strip is a named size container", () => {
    const { container } = render(
      <TypingAndPresence participants={PEOPLE} mode="compact" context="#redesign" />,
    );
    const root = container.querySelector<HTMLElement>('[role="group"]');
    expect(String(root?.className)).toMatch(/@container\/presence/);
    // No viewport variants survive anywhere in the strip.
    container.querySelectorAll("*").forEach((el) => {
      expect(String(el.className)).not.toMatch(/(^|\s)(sm|md|lg|xl|2xl):/);
    });
  });

  it("lets the compact strip wrap in a narrow container instead of ellipsizing the summary away", () => {
    const { container } = render(
      <TypingAndPresence participants={PEOPLE} mode="compact" context="#redesign" />,
    );
    const root = container.querySelector<HTMLElement>('[role="group"]');
    // The flex row lives one level inside the container element: an element is
    // never its own query container, so `@…/presence` written on the root would
    // silently never match.
    const row = root?.firstElementChild as HTMLElement;
    const cls = String(row.className);
    expect(cls).toMatch(/flex-wrap/);
    expect(cls).toMatch(/@\[400px\]\/presence:flex-nowrap/);
    // The root must stay block-level: an inline-flex box with
    // `container-type: inline-size` is sized as if empty and collapses to 0.
    expect(String(root?.className)).not.toMatch(/inline-flex/);

    const summary = screen.getAllByText("Jamie is typing")[0];
    // Truncation only applies once the strip itself has room; in a narrow
    // container the sentence wraps rather than clipping to a few characters.
    expect(String(summary.className)).toMatch(/@\[400px\]\/presence:truncate/);
    expect(String(summary.className)).not.toMatch(/(^|\s)truncate(\s|$)/);
  });

  it("caps the participant panel to the viewport and gives its rows a 44px target", async () => {
    const { container } = render(<TypingAndPresence participants={PEOPLE} maxVisible={2} />);
    const trigger = container.querySelector<HTMLElement>('button[aria-haspopup="dialog"]');
    expect(trigger).not.toBeNull();
    trigger?.click();
    const panel = await screen.findByRole("dialog");
    expect(String(panel.className)).toMatch(/w-\[min\(256px,calc\(100vw-2rem\)\)\]/);
    const row = panel.querySelector<HTMLElement>("[data-participant]");
    expect(String(row?.className)).toMatch(/min-h-\[44px\]/);
  });
});
