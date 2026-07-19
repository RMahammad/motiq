import { render, cleanup, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { TextReveal } from "./text-reveal";

afterEach(cleanup);

function latestObserver() {
  const IO = globalThis.IntersectionObserver as unknown as {
    instances: Array<{ trigger: (v: boolean) => void }>;
  };
  return IO.instances[IO.instances.length - 1]!;
}

describe("TextReveal", () => {
  it("splits by word (default), preserving spaces as units", () => {
    const { container } = render(<TextReveal text="ship it fast" />);
    const units = container.querySelectorAll(".scope-text-reveal__unit");
    // "ship" " " "it" " " "fast" => 5 units
    expect(units.length).toBe(5);
    expect((units[0] as HTMLElement).style.getPropertyValue("--stagger-index")).toBe("0");
  });

  it("splits by character when by='character'", () => {
    const { container } = render(<TextReveal text="hi!" by="character" />);
    expect(container.querySelectorAll(".scope-text-reveal__unit").length).toBe(3);
  });

  it("exposes the full text to screen readers and hides the animated units", () => {
    const { container } = render(<TextReveal text="Accessible headline" />);
    const sr = container.querySelector(".scope-sr-only");
    expect(sr?.textContent).toBe("Accessible headline");
    const visual = container.querySelector('[aria-hidden="true"]');
    expect(visual).toBeTruthy();
  });

  it("reveals on intersection", () => {
    const { container } = render(<TextReveal text="word" />);
    const root = container.firstChild as HTMLElement;
    expect(root.getAttribute("data-motion")).toBe("hidden");
    act(() => latestObserver().trigger(true));
    expect(root.getAttribute("data-motion")).toBe("shown");
  });

  it("SSRs the readable text and no axe violations", async () => {
    const html = renderToString(<TextReveal text="Server text" />);
    expect(html).toContain("Server text");
    const { container } = render(
      <h2>
        <TextReveal text="Accessible heading" />
      </h2>,
    );
    const res = await axe.run(container as HTMLElement, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(res.violations).toEqual([]);
  });
});
