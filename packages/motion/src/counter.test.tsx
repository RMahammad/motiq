import { render, cleanup, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Counter } from "./counter";

afterEach(cleanup);

describe("Counter", () => {
  it("renders the starting value before it activates (in-view gated)", () => {
    // default startOnView=true; the IO mock keeps it out of view → shows `from`
    const { container } = render(<Counter value={100} from={0} />);
    expect((container.firstChild as HTMLElement).textContent).toBe("0");
  });

  it("jumps to the value immediately under forced reduced motion", () => {
    const { container } = render(<Counter value={100} startOnView={false} reducedMotion="force" />);
    expect((container.firstChild as HTMLElement).textContent).toBe("100");
  });

  it("animates from -> value with requestAnimationFrame (fake timers)", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(
        <Counter value={100} from={0} duration={100} startOnView={false} reducedMotion="off" />,
      );
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect((container.firstChild as HTMLElement).textContent).toBe("100");
    } finally {
      vi.useRealTimers();
    }
  });

  it("applies decimals and a custom format", () => {
    const { container: a } = render(
      <Counter value={3.14159} decimals={2} startOnView={false} reducedMotion="force" />,
    );
    expect((a.firstChild as HTMLElement).textContent).toBe("3.14");

    const { container: b } = render(
      <Counter value={1200} startOnView={false} reducedMotion="force" format={(n) => `$${Math.round(n)}`} />,
    );
    expect((b.firstChild as HTMLElement).textContent).toBe("$1200");
  });

  it("SSRs the starting value", () => {
    const html = renderToString(<Counter value={99} from={0} />);
    expect(html).toContain(">0<");
  });
});
