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
