import { render, cleanup, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InView } from "./in-view";

afterEach(cleanup);

function latestObserver() {
  const IO = globalThis.IntersectionObserver as unknown as {
    instances: Array<{ trigger: (v: boolean) => void; elements: Set<Element> }>;
  };
  return IO.instances[IO.instances.length - 1]!;
}

describe("InView", () => {
  it("starts not-in-view and flips on intersection (data attr + callback + render-prop)", () => {
    const onChange = vi.fn();
    const { container, getByTestId } = render(
      <InView onChange={onChange}>{(v) => <span data-testid="state">{String(v)}</span>}</InView>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute("data-inview")).toBe("false");
    expect(getByTestId("state").textContent).toBe("false");
    act(() => latestObserver().trigger(true));
    expect(el.getAttribute("data-inview")).toBe("true");
    expect(getByTestId("state").textContent).toBe("true");
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("disconnects after the first hit when once (default)", () => {
    render(<InView>x</InView>);
    const io = latestObserver();
    act(() => io.trigger(true));
    expect(io.elements.size).toBe(0);
  });

  it("cleans up the observer on unmount", () => {
    const { unmount } = render(<InView once={false}>x</InView>);
    const io = latestObserver();
    expect(io.elements.size).toBe(1);
    unmount();
    expect(io.elements.size).toBe(0);
  });

  it("supports plain (non-function) children", () => {
    const { getByText } = render(
      <InView>
        <b>hi</b>
      </InView>,
    );
    expect(getByText("hi")).toBeTruthy();
  });
});
