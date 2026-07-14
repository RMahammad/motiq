import * as React from "react";
import { render, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AiResponseStream, type ResponseSegment } from "./ai-response-stream";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const SEGMENTS: ResponseSegment[] = [
  { type: "text", text: "Stale-while-revalidate serves cached data instantly" },
  { type: "citation", sourceId: "1" },
  { type: "text", text: ".\n\nExample:" },
  { type: "code", lang: "ts", filename: "cache.ts", code: "export const ttl = 30_000;" },
];
const SOURCES = [{ id: "1", title: "Caching Handbook", url: "https://example.com/caching" }];

describe("AiResponseStream", () => {
  it("renders the complete response as readable text with no axe violations", async () => {
    const { container } = render(
      <AiResponseStream segments={SEGMENTS} state="complete" sources={SOURCES} assistantName="Atlas" />,
    );
    // The full answer text is present and readable (single region).
    expect(container.textContent).toContain("Stale-while-revalidate serves cached data instantly");
    expect(screen.getByText("export const ttl = 30_000;")).toBeTruthy();
    // Cited source appears in the rail as a real link.
    expect(screen.getByRole("link", { name: "Caching Handbook" })).toBeTruthy();
    await noViolations(container);
  });

  it("shows a Retry control in the error state", () => {
    render(<AiResponseStream segments={SEGMENTS} state="error" onRetry={() => {}} />);
    expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^stop$/i })).toBeNull();
  });

  it("calls onStop when Stop is pressed while streaming", async () => {
    const onStop = vi.fn();
    const user = userEvent.setup();
    render(<AiResponseStream segments={SEGMENTS} state="streaming" onStop={onStop} />);
    await user.click(screen.getByRole("button", { name: /stop/i }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
