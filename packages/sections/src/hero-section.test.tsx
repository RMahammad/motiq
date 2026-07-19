import { render, cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HeroSection } from "./hero-section";

afterEach(cleanup);

describe("HeroSection", () => {
  it("renders the title as an h1 plus eyebrow/subtitle/actions/media slots", () => {
    const { container } = render(
      <HeroSection
        eyebrow="New"
        title="Ship faster"
        subtitle="Production-ready motion for your app."
        actions={
          <a href="/start" className="scope-btn">
            Get started
          </a>
        }
        media={<img alt="Product screenshot" src="/hero.png" />}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Ship faster" })).toBeTruthy();
    expect(screen.getByText("New")).toBeTruthy();
    expect(screen.getByText("Production-ready motion for your app.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Get started" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Product screenshot" })).toBeTruthy();
    expect(container.querySelector("section.scope-hero")).toBeTruthy();
  });

  it("honors headingLevel for semantic hierarchy", () => {
    render(<HeroSection title="Secondary hero" headingLevel={2} />);
    expect(screen.getByRole("heading", { level: 2, name: "Secondary hero" })).toBeTruthy();
  });

  it("animates by default (Stagger present) and can be turned off", () => {
    const { container, rerender } = render(<HeroSection title="T" />);
    expect(container.querySelector(".scope-stagger")).toBeTruthy();
    rerender(<HeroSection title="T" animate={false} />);
    expect(container.querySelector(".scope-stagger")).toBeNull();
    // content still rendered when animation is off
    expect(screen.getByRole("heading", { name: "T" })).toBeTruthy();
  });

  it("reflects align and forwards ref/className", () => {
    const ref = { current: null as HTMLElement | null };
    const { container } = render(
      <HeroSection title="T" align="center" ref={ref} className="custom" />,
    );
    const section = container.firstChild as HTMLElement;
    expect(section.getAttribute("data-align")).toBe("center");
    expect(section.classList.contains("custom")).toBe(true);
    expect(ref.current).toBe(section);
  });

  it("omits optional slots cleanly", () => {
    const { container } = render(<HeroSection title="Only a title" />);
    expect(container.querySelector(".scope-hero__eyebrow")).toBeNull();
    expect(container.querySelector(".scope-hero__subtitle")).toBeNull();
    expect(container.querySelector(".scope-hero__actions")).toBeNull();
    expect(container.querySelector(".scope-hero__media")).toBeNull();
  });
});
