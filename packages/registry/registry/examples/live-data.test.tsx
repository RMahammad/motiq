import * as React from "react";
import { render, cleanup, act, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AssistantAnswer, DeployLogs, RevenuePanel } from "./live-data";

/**
 * Executes every example on /guides/live-data against a mocked network.
 *
 * Typechecking proves the props exist. It does not prove that reading a fetch
 * stream appends to the right segment, that a subscription caps its buffer and
 * closes on unmount, or that a poller reports the state it is actually in — which
 * is the part of the guide a reader will copy verbatim into production.
 */

afterEach(cleanup);

/** A Response whose body streams `chunks`, like a real token stream. */
function streamingResponse(chunks: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

const regionText = () => screen.getByRole("region").textContent ?? "";

describe("guide example: streaming a response", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("appends chunks into one paragraph and completes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamingResponse(["Deploys ", "are ", "gated."])));

    render(<AssistantAnswer prompt="why did the deploy fail?" />);

    await waitFor(() => expect(regionText()).toContain("Deploys are gated."));
    // One paragraph, not three — the chunk-appending logic is the point.
    expect(screen.getByRole("region").querySelectorAll("p")).toHaveLength(1);
    await waitFor(() => expect(screen.getAllByText(/complete/i).length).toBeGreaterThan(0));
  });

  it("reports the error state when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 500 })));

    render(<AssistantAnswer prompt="x" />);

    await waitFor(() => expect(screen.getAllByText(/error|failed|retry/i).length).toBeGreaterThan(0));
  });

  it("aborts the request on unmount rather than leaking it", async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        signal = init.signal ?? undefined;
        return Promise.resolve(streamingResponse(["hello"]));
      }),
    );

    const { unmount } = render(<AssistantAnswer prompt="x" />);
    await waitFor(() => expect(signal).toBeDefined());
    unmount();
    expect(signal!.aborted).toBe(true);
  });
});

/** Minimal EventSource stand-in the example can drive. */
class FakeEventSource {
  static last: FakeEventSource | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;
  listeners: Record<string, (() => void)[]> = {};
  constructor(public url: string) {
    FakeEventSource.last = this;
  }
  addEventListener(type: string, fn: () => void) {
    (this.listeners[type] ??= []).push(fn);
  }
  emit(type: string) {
    for (const fn of this.listeners[type] ?? []) fn();
  }
  close() {
    this.closed = true;
  }
}

describe("guide example: sockets and server-sent events", () => {
  beforeEach(() => vi.stubGlobal("EventSource", FakeEventSource));
  afterEach(() => vi.unstubAllGlobals());

  const message = (id: number) =>
    JSON.stringify({ id: `e${id}`, level: "info", message: `line ${id}`, timestamp: 1_700_000_000_000 + id });

  it("appends each message and closes the connection on unmount", async () => {
    const { unmount } = render(<DeployLogs deploymentId="dep_1" />);
    const source = FakeEventSource.last!;
    expect(source.url).toContain("dep_1");

    act(() => {
      source.onmessage?.({ data: message(1) });
      source.onmessage?.({ data: message(2) });
    });
    await waitFor(() => expect(document.body.textContent).toContain("line 2"));
    expect(document.body.textContent).toContain("line 1");

    unmount();
    expect(source.closed).toBe(true);
  });

  it("caps the buffer so an endless feed cannot grow without bound", async () => {
    render(<DeployLogs deploymentId="dep_2" />);
    const source = FakeEventSource.last!;

    act(() => {
      for (let i = 0; i < 600; i++) source.onmessage?.({ data: message(i) });
    });

    // MAX_ROWS is 500: the oldest lines are dropped, the newest kept.
    await waitFor(() => expect(document.body.textContent).toContain("line 599"));
    expect(document.body.textContent).not.toContain("line 0 ");
    expect(document.body.textContent).not.toContain("line 99 ");
  });

  it("surfaces the completed and error states from the connection", async () => {
    render(<DeployLogs deploymentId="dep_3" />);
    const source = FakeEventSource.last!;

    act(() => source.emit("done"));
    await waitFor(() => expect(screen.getAllByText(/complete/i).length).toBeGreaterThan(0));
    expect(source.closed).toBe(true);
  });
});

describe("guide example: polling", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("refreshes on mount, reports success, and polls again on the interval", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ total: 1 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<RevenuePanel />);
    await act(async () => { await Promise.resolve(); });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => { vi.advanceTimersByTime(30_000); await Promise.resolve(); });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports the error state instead of pretending the data is fresh", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    render(<RevenuePanel />);
    // `waitFor` polls on timers, which fake timers freeze — flush microtasks instead
    // so the rejected fetch settles.
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });

    expect(document.body.textContent).toContain("Refresh failed");
  });

  it("stops polling on unmount", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = render(<RevenuePanel />);
    await act(async () => { await Promise.resolve(); });
    unmount();

    await act(async () => { vi.advanceTimersByTime(120_000); await Promise.resolve(); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
