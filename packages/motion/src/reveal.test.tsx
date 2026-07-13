import { render, cleanup, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Reveal } from "./reveal";

afterEach(cleanup);

function latestObserver() {
  const IO = globalThis.IntersectionObserver as unknown as {
    instances: Array<{ trigger: (v: boolean) => void; elements: Set<Element> }>;
  };
  return IO.instances[IO.instances.length - 1]!;
}

describe("Reveal", () => {
  it("renders children with the base class and hidden state (in-view default)", () => {
    const { getByText, container } = render(<Reveal>hello</Reveal>);
    expect(getByText("hello")).toBeTruthy();
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("scope-reveal");
    expect(el.getAttribute("data-motion")).toBe("hidden");
  });

  it("is shown immediately for trigger='mount'", () => {
    const { container } = render(<Reveal trigger="mount">x</Reveal>);
    expect((container.firstChild as HTMLElement).getAttribute("data-motion")).toBe("shown");
  });

  it("maps direction+distance to a signed offset CSS var (up => negative, token-based)", () => {
    const { container } = render(
      <Reveal direction="up" distance="lg">
        x
      </Reveal>,
    );
    const offset = (container.firstChild as HTMLElement).style.getPropertyValue("--reveal-offset");
    expect(offset).toContain("var(--motion-distance-lg)");
    expect(offset.startsWith("-")).toBe(true);
  });

  it("uses token-named duration var (no raw ms in Level-1 API)", () => {
    const { container } = render(<Reveal duration="slow">x</Reveal>);
    const dur = (container.firstChild as HTMLElement).style.getPropertyValue("--reveal-duration");
    expect(dur).toBe("var(--motion-duration-slow)");
  });

  it("reveals on intersection, fires onVisibilityChange, and disconnects when once", () => {
    const onVis = vi.fn();
    const { container } = render(<Reveal onVisibilityChange={onVis}>x</Reveal>);
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute("data-motion")).toBe("hidden");
    const io = latestObserver();
    act(() => io.trigger(true));
    expect(el.getAttribute("data-motion")).toBe("shown");
    expect(onVis).toHaveBeenCalledWith(true);
    // once=true default => observer disconnected (no observed elements remain)
    expect(io.elements.size).toBe(0);
  });

  it("reflects the reducedMotion prop as a data attribute (CSS neutralizes motion)", () => {
    const { container } = render(<Reveal reducedMotion="force-reduce">x</Reveal>);
    expect((container.firstChild as HTMLElement).getAttribute("data-reduced-motion")).toBe(
      "force-reduce",
    );
  });

  it("forwards ref to the underlying DOM node", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Reveal ref={ref}>x</Reveal>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("cleans up the observer on unmount (no leak)", () => {
    const { unmount } = render(<Reveal>x</Reveal>);
    const io = latestObserver();
    expect(io.elements.size).toBe(1);
    unmount();
    expect(io.elements.size).toBe(0);
  });
});
