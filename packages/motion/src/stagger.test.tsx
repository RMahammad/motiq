import { render, cleanup, act } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Stagger, StaggerItem } from "./stagger";

afterEach(cleanup);

function latestObserver() {
  const IO = globalThis.IntersectionObserver as unknown as {
    instances: Array<{ trigger: (v: boolean) => void; elements: Set<Element> }>;
  };
  return IO.instances[IO.instances.length - 1]!;
}

describe("Stagger", () => {
  it("assigns incremental --stagger-index to items and sets the gap token", () => {
    const { container } = render(
      <Stagger gap="sm">
        <div>a</div>
        <div>b</div>
        <div>c</div>
      </Stagger>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.style.getPropertyValue("--stagger-gap")).toBe("var(--motion-stagger-sm)");
    const items = root.querySelectorAll(".scope-stagger-item");
    expect(items.length).toBe(3);
    expect((items[0] as HTMLElement).style.getPropertyValue("--stagger-index")).toBe("0");
    expect((items[2] as HTMLElement).style.getPropertyValue("--stagger-index")).toBe("2");
  });

  it("wraps explicit StaggerItem children and preserves their style", () => {
    const { container } = render(
      <Stagger>
        <StaggerItem style={{ color: "red" }}>x</StaggerItem>
      </Stagger>,
    );
    const item = container.querySelector(".scope-stagger-item") as HTMLElement;
    expect(item.style.color).toBe("red");
    expect(item.style.getPropertyValue("--stagger-index")).toBe("0");
  });

  it("toggles data-motion hidden -> shown on intersection", () => {
    const { container } = render(
      <Stagger>
        <div>a</div>
      </Stagger>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.getAttribute("data-motion")).toBe("hidden");
    act(() => latestObserver().trigger(true));
    expect(root.getAttribute("data-motion")).toBe("shown");
  });

  it("mount trigger is shown immediately and reflects reducedMotion", () => {
    const { container } = render(
      <Stagger trigger="mount" reducedMotion="force-reduce">
        <div>a</div>
      </Stagger>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.getAttribute("data-motion")).toBe("shown");
    expect(root.getAttribute("data-reduced-motion")).toBe("force-reduce");
  });
});
