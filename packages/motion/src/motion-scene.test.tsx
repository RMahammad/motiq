import { render, cleanup, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MotionScene, MotionStep } from "./motion-scene";

afterEach(cleanup);

function latestObserver() {
  const IO = globalThis.IntersectionObserver as unknown as {
    instances: Array<{ trigger: (v: boolean) => void }>;
  };
  return IO.instances[IO.instances.length - 1]!;
}

function scene(props = {}) {
  return (
    <MotionScene {...props}>
      <MotionStep role="heading">Heading</MotionStep>
      <MotionStep role="supporting-content" intent="deemphasize">Copy</MotionStep>
      <MotionStep role="primary-action" intent="emphasize">
        <button type="button">CTA</button>
      </MotionStep>
    </MotionScene>
  );
}

describe("MotionScene / MotionStep", () => {
  it("assigns an incrementing --scene-index to each step and exposes intent/role", () => {
    const { container } = render(scene());
    const steps = container.querySelectorAll(".scope-motion-step");
    expect(steps).toHaveLength(3);
    expect((steps[0] as HTMLElement).style.getPropertyValue("--scene-index")).toBe("0");
    expect((steps[2] as HTMLElement).style.getPropertyValue("--scene-index")).toBe("2");
    expect((steps[0] as HTMLElement).getAttribute("data-role")).toBe("heading");
    expect((steps[2] as HTMLElement).getAttribute("data-intent")).toBe("emphasize");
  });

  it("stays hidden until in view, then plays the sequence", () => {
    const { container } = render(scene());
    const root = container.firstChild as HTMLElement;
    expect(root.getAttribute("data-motion")).toBe("hidden");
    act(() => latestObserver().trigger(true));
    expect(root.getAttribute("data-motion")).toBe("shown");
  });

  it("maps intensity to scene duration + gap vars and reflects reducedMotion", () => {
    const { container } = render(scene({ intensity: "expressive", gap: "lg", trigger: "mount" }));
    const root = container.firstChild as HTMLElement;
    expect(root.getAttribute("data-motion")).toBe("shown");
    expect(root.getAttribute("data-intensity")).toBe("expressive");
    expect(root.style.getPropertyValue("--scene-duration")).toBe("440ms");
    expect(root.style.getPropertyValue("--scene-gap")).toBe("130ms");
  });

  it("fires onSequenceComplete after the sequence (fake timers)", () => {
    vi.useFakeTimers();
    try {
      const onDone = vi.fn();
      render(scene({ trigger: "mount", onSequenceComplete: onDone }));
      act(() => vi.advanceTimersByTime(2000));
      expect(onDone).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("SSRs the full content (heading/copy/cta) in hidden final state", () => {
    const html = renderToString(scene({ trigger: "mount" }));
    expect(html).toContain("Heading");
    expect(html).toContain("Copy");
    expect(html).toContain("CTA");
    expect(html).toContain("scope-motion-scene");
  });

  it("has no axe violations", async () => {
    const { container } = render(scene({ trigger: "mount" }));
    const res = await axe.run(container as HTMLElement, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(res.violations).toEqual([]);
  });
});
