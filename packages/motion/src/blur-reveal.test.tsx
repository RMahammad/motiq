import { render, cleanup, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { BlurReveal } from "./blur-reveal";

afterEach(cleanup);

function latestObserver() {
  const IO = globalThis.IntersectionObserver as unknown as {
    instances: Array<{ trigger: (v: boolean) => void; elements: Set<Element> }>;
  };
  return IO.instances[IO.instances.length - 1]!;
}

describe("BlurReveal", () => {
  it("starts hidden (in-view) and reveals on intersection", () => {
    const { container } = render(<BlurReveal>content</BlurReveal>);
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute("data-motion")).toBe("hidden");
    act(() => latestObserver().trigger(true));
    expect(el.getAttribute("data-motion")).toBe("shown");
  });

  it("maps amount to a blur CSS var and duration to a token", () => {
    const { container } = render(
      <BlurReveal amount="lg" duration="slow">
        x
      </BlurReveal>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.getPropertyValue("--blur-amount")).toBe("16px");
    expect(el.style.getPropertyValue("--blur-duration")).toBe("var(--motion-duration-slow)");
  });

  it("mount trigger is shown immediately and reflects reducedMotion", () => {
    const { container } = render(
      <BlurReveal trigger="mount" reducedMotion="force-reduce">
        x
      </BlurReveal>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute("data-motion")).toBe("shown");
    expect(el.getAttribute("data-reduced-motion")).toBe("force-reduce");
  });

  it("SSRs hidden final state", () => {
    const html = renderToString(<BlurReveal>server</BlurReveal>);
    expect(html).toContain('data-motion="hidden"');
    expect(html).toContain("server");
  });
});
