import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PricingCard } from "./pricing-card";

afterEach(cleanup);

const base = {
  planName: "Pro",
  price: "$29",
  period: "/mo",
  description: "For growing teams",
  features: ["Unlimited projects", "Priority support"],
};

describe("PricingCard", () => {
  it("renders the plan name as a heading that labels the card", () => {
    const { getByRole } = render(<PricingCard {...base} />);
    const heading = getByRole("heading", { level: 3, name: "Pro" });
    expect(heading).toBeTruthy();
    const group = getByRole("group", { name: "Pro" });
    expect(group).toBeTruthy(); // aria-labelledby wires the card to the heading
  });

  it("renders price, period, description and features as a list", () => {
    const { getByText, getAllByRole } = render(<PricingCard {...base} />);
    expect(getByText("$29")).toBeTruthy();
    expect(getByText("/mo")).toBeTruthy();
    expect(getByText("For growing teams")).toBeTruthy();
    expect(getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders a button CTA that calls onClick", () => {
    const onClick = vi.fn();
    const { getByRole } = render(
      <PricingCard {...base} cta={{ label: "Start trial", onClick }} />,
    );
    const btn = getByRole("button", { name: "Start trial" });
    btn.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders a link CTA when href is provided", () => {
    const { getByRole } = render(
      <PricingCard {...base} cta={{ label: "Buy", href: "/checkout" }} />,
    );
    const link = getByRole("link", { name: "Buy" });
    expect(link.getAttribute("href")).toBe("/checkout");
  });

  it("marks featured cards and renders a badge", () => {
    const { container, getByText } = render(
      <PricingCard {...base} featured badge="Most popular" />,
    );
    const card = container.querySelector('[data-slot="pricing-card"]') as HTMLElement;
    expect(card.getAttribute("data-featured")).toBe("true");
    expect(getByText("Most popular")).toBeTruthy();
  });

  it("forwards ref and merges className", () => {
    const ref = { current: null as HTMLDivElement | null };
    const { container } = render(<PricingCard {...base} ref={ref} className="custom" />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(container.querySelector(".scope-pricing-card.custom")).toBeTruthy();
  });
});
