import * as React from "react";
import { render, cleanup, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSequence } from "./motion";

afterEach(cleanup);

const STEPS = ["queued", "running", "passed"] as const;

/** Renders the hook's state as text so assertions read the same thing a user would. */
function Probe({ steps = STEPS, ...options }: { steps?: readonly string[] } & Parameters<typeof useSequence>[1]) {
  const seq = useSequence(steps, options);
  return (
    <div>
      <span data-testid="index">{seq.index}</span>
      <span data-testid="value">{String(seq.value)}</span>
      <span data-testid="done">{String(seq.done)}</span>
      <span data-testid="running">{String(seq.running)}</span>
      <button onClick={seq.start}>start</button>
      <button onClick={seq.stop}>stop</button>
      <button onClick={seq.reset}>reset</button>
    </div>
  );
}

const read = (id: string) => document.querySelector(`[data-testid="${id}"]`)?.textContent;
const tick = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

describe("useSequence", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("advances one step per interval and stops at the last", () => {
    render(<Probe intervalMs={100} />);
    expect(read("index")).toBe("0");
    expect(read("value")).toBe("queued");

    tick(100);
    expect(read("value")).toBe("running");

    tick(100);
    expect(read("value")).toBe("passed");
    expect(read("done")).toBe("true");
    expect(read("running")).toBe("false");

    // Past the end it holds the last step rather than wrapping or overflowing.
    tick(500);
    expect(read("index")).toBe("2");
  });

  it("wraps and never reports done when looping", () => {
    render(<Probe intervalMs={100} loop />);
    tick(300);
    expect(read("index")).toBe("0");
    expect(read("done")).toBe("false");
    expect(read("running")).toBe("true");
  });

  it("holds position while paused and resumes from it", () => {
    const { rerender } = render(<Probe intervalMs={100} paused />);
    tick(500);
    expect(read("index")).toBe("0");

    rerender(<Probe intervalMs={100} paused={false} />);
    tick(100);
    expect(read("index")).toBe("1");
  });

  it("does not start on its own when autoStart is false", () => {
    render(<Probe intervalMs={100} autoStart={false} />);
    tick(500);
    expect(read("index")).toBe("0");
    expect(read("running")).toBe("false");
  });

  it("start() replays from the beginning after finishing", () => {
    render(<Probe intervalMs={100} />);
    tick(200);
    expect(read("done")).toBe("true");

    act(() => { (document.querySelector("button") as HTMLButtonElement).click(); }); // start
    expect(read("index")).toBe("0");
    tick(100);
    expect(read("index")).toBe("1");
  });

  it("tolerates an empty step list", () => {
    render(<Probe steps={[]} intervalMs={100} />);
    tick(300);
    expect(read("index")).toBe("0");
    expect(read("value")).toBe("undefined");
  });

  it("clears its interval on unmount", () => {
    const clear = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = render(<Probe intervalMs={100} />);
    unmount();
    expect(clear).toHaveBeenCalled();
    clear.mockRestore();
  });
});
