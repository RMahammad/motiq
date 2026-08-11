import * as React from "react";
import { render, cleanup, act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSequence } from "./motion";
import { AiResponseStream, type ResponseSegment } from "../ai/ai-response-stream";
import { DataRefreshState, type RefreshState } from "../data/data-refresh-state";

/**
 * Executable version of the "Driving the live data" snippets in
 * apps/docs/lib/docs-content.ts. Those snippets are strings, so nothing would
 * catch them drifting from the real props — this file compiles the same pattern
 * against the real components and asserts the motion it promises: content that
 * ARRIVES over time, rather than a finished array that mounts at once.
 */

afterEach(cleanup);

const PIECES: ResponseSegment[] = [
  { type: "text", text: "Deploys are gated on the smoke suite" },
  { type: "citation", sourceId: "1" },
  { type: "text", text: " and roll back automatically." },
];

const ATOMS: ResponseSegment[] = PIECES.flatMap((p) =>
  p.type === "text"
    ? p.text.split(/(\s+)/).filter(Boolean).map((text) => ({ type: "text", text }) as ResponseSegment)
    : [p],
);

function StreamedResponse() {
  const { index, done } = useSequence(ATOMS, { intervalMs: 50 });

  const segments = React.useMemo(() => {
    const out: ResponseSegment[] = [];
    for (const atom of ATOMS.slice(0, index + 1)) {
      const last = out[out.length - 1];
      if (atom.type === "text" && last?.type === "text") last.text += atom.text;
      else out.push({ ...atom });
    }
    return out;
  }, [index]);

  return (
    <AiResponseStream
      segments={segments}
      state={done ? "complete" : "streaming"}
      sources={[{ id: "1", title: "Deployment gates" }]}
      assistantName="Assistant"
    />
  );
}

const PHASES = ["idle", "checking", "refreshing", "success"] as const satisfies readonly RefreshState[];

function RefreshingPanel() {
  const { value } = useSequence(PHASES, { intervalMs: 50 });
  return <DataRefreshState state={value ?? "idle"} label="Revenue metrics" />;
}

const words = () => screen.getByRole("region").textContent!.trim().split(/\s+/).filter(Boolean).length;
const tick = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

describe("driving live components with useSequence", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("grows an AI response over time instead of mounting it all at once", () => {
    render(<StreamedResponse />);
    const first = words();

    tick(50 * 4);
    const middle = words();
    expect(middle).toBeGreaterThan(first);

    tick(50 * ATOMS.length);
    const final = words();
    expect(final).toBeGreaterThan(middle);

    // Settles on the whole response, and the app-owned lifecycle prop follows.
    // "Complete" appears twice by design — the visible pill and the sr-only live region.
    expect(screen.getByRole("region").textContent).toContain("roll back automatically.");
    expect(screen.getAllByText(/complete/i).length).toBeGreaterThan(0);
  });

  it("advances a lifecycle component through its documented phases", () => {
    render(<RefreshingPanel />);

    tick(50);
    const checking = document.body.textContent ?? "";
    tick(50 * 3);
    const settled = document.body.textContent ?? "";

    expect(checking).not.toBe(settled);
  });

  it("holds position while paused, so a backgrounded demo does not run to the end", () => {
    function Paused() {
      const { index } = useSequence(ATOMS, { intervalMs: 50, paused: true });
      return <span data-testid="i">{index}</span>;
    }
    render(<Paused />);
    tick(50 * 10);
    expect(screen.getByTestId("i").textContent).toBe("0");
  });
});
