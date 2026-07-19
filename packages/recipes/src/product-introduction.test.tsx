import { render, cleanup, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { ProductIntroduction } from "./product-introduction";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };

describe("ProductIntroduction", () => {
  it("renders the title as an h1 plus every content slot", () => {
    render(
      <ProductIntroduction
        eyebrow="New"
        title="Ship motion, not keyframes"
        subtitle="A coordinated product hero in one component."
        media={<img alt="Product preview" src="/preview.png" />}
        primaryAction={<a href="/start">Get started</a>}
        secondaryAction={<a href="/docs">Read the docs</a>}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Ship motion, not keyframes" })).toBeTruthy();
    expect(screen.getByText("New")).toBeTruthy();
    expect(screen.getByText("A coordinated product hero in one component.")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Product preview" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Get started" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Read the docs" })).toBeTruthy();
  });

  it("choreographs through a MotionScene with the product-introduction preset", () => {
    const { container } = render(<ProductIntroduction title="T" />);
    const scene = container.querySelector(".scope-motion-scene");
    expect(scene).toBeTruthy();
    expect(scene?.getAttribute("data-preset")).toBe("product-introduction");
  });

  it("assigns semantic roles/intents to each step and orders CTA last", () => {
    const { container } = render(
      <ProductIntroduction
        eyebrow="New"
        title="T"
        subtitle="S"
        media={<img alt="p" src="/p.png" />}
        primaryAction={<button type="button">Go</button>}
      />,
    );
    const roles = [...container.querySelectorAll(".scope-motion-step")].map((s) =>
      s.getAttribute("data-role"),
    );
    // DOM order drives the scene sequence: eyebrow → heading → subtitle → preview → actions.
    expect(roles).toEqual([
      "detail",
      "heading",
      "supporting-content",
      "product-preview",
      "primary-action",
    ]);
    expect(container.querySelector(".scope-recipe-intro__title")?.getAttribute("data-role")).toBe(
      "heading",
    );
    expect(
      container.querySelector(".scope-recipe-intro__actions")?.getAttribute("data-intent"),
    ).toBe("emphasize");
  });

  it("honors headingLevel for nested-section use", () => {
    render(<ProductIntroduction title="Nested" headingLevel={2} />);
    expect(screen.getByRole("heading", { level: 2, name: "Nested" })).toBeTruthy();
  });

  it("flags the two-column layout only when media is present, and forwards ref/className", () => {
    const ref = { current: null as HTMLElement | null };
    const { container, rerender } = render(
      <ProductIntroduction title="T" className="custom" ref={ref} />,
    );
    const section = container.firstChild as HTMLElement;
    expect(section.hasAttribute("data-has-media")).toBe(false);
    expect(section.classList.contains("custom")).toBe(true);
    expect(ref.current).toBe(section);

    rerender(<ProductIntroduction title="T" media={<img alt="p" src="/p.png" />} />);
    expect((container.firstChild as HTMLElement).hasAttribute("data-has-media")).toBe(true);
  });

  it("omits optional slots cleanly", () => {
    const { container } = render(<ProductIntroduction title="Only a title" />);
    expect(container.querySelector(".scope-recipe-intro__eyebrow")).toBeNull();
    expect(container.querySelector(".scope-recipe-intro__subtitle")).toBeNull();
    expect(container.querySelector(".scope-recipe-intro__media")).toBeNull();
    expect(container.querySelector(".scope-recipe-intro__actions")).toBeNull();
    // heading always renders
    expect(screen.getByRole("heading", { name: "Only a title" })).toBeTruthy();
  });

  it("forwards the reduced-motion policy to the scene", () => {
    const { container } = render(<ProductIntroduction title="T" reducedMotion="force-reduce" />);
    expect(
      container.querySelector(".scope-motion-scene")?.getAttribute("data-reduced-motion"),
    ).toBe("force-reduce");
  });

  it("SSRs (server-safe) with content present and no axe violations", async () => {
    const html = renderToString(
      <ProductIntroduction
        eyebrow="New"
        title="Server rendered"
        subtitle="Renders on the server."
        media={<img alt="Preview" src="/p.png" />}
        primaryAction={<a href="/start">Get started</a>}
      />,
    );
    expect(html).toContain("Server rendered");
    expect(html).toContain("Renders on the server.");

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    const res = await axe.run(container, { runOnly: WCAG });
    document.body.removeChild(container);
    expect(res.violations).toEqual([]);
  });
});
