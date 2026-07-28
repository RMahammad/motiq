import { render, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CardStackDeck, type CardStackDeckItem } from "./card-stack-deck";

afterEach(cleanup);

const ITEMS: CardStackDeckItem[] = [
  { id: "backgrounds", label: "Backgrounds", content: <span>Backgrounds</span> },
  { id: "cards", label: "Cards & Surfaces", content: <span>Cards &amp; Surfaces</span> },
  { id: "navigation", label: "Navigation", content: <span>Navigation</span> },
  { id: "forms", label: "Forms & Inputs", content: <span>Forms &amp; Inputs</span> },
];

const live = (c: HTMLElement) => c.querySelector('[aria-live="polite"]')?.textContent ?? "";

describe("CardStackDeck", () => {
  it("exposes a focusable deck group and announces the front card", () => {
    const { container, getByRole } = render(<CardStackDeck items={ITEMS} label="Category deck" />);
    const group = getByRole("group", { name: "Category deck" });
    expect(group.getAttribute("tabindex")).toBe("0");
    expect(group.getAttribute("aria-roledescription")).toBe("card deck");
    expect(live(container)).toContain("Backgrounds");
  });

  it("hides every card except the front one from assistive tech", () => {
    const { container } = render(<CardStackDeck items={ITEMS} />);
    const cards = Array.from(container.querySelectorAll("[data-card-slot]"));
    expect(cards.length).toBe(ITEMS.length);
    const exposed = cards.filter((el) => el.getAttribute("aria-hidden") !== "true");
    expect(exposed.length).toBe(1);
    expect(exposed[0].getAttribute("data-card-slot")).toBe("0");
  });

  it("advances the front card with ArrowRight and announces the change", () => {
    const onTopChange = vi.fn();
    const { container, getByRole } = render(<CardStackDeck items={ITEMS} onTopChange={onTopChange} />);
    fireEvent.keyDown(getByRole("group"), { key: "ArrowRight" });
    expect(onTopChange).toHaveBeenCalledWith(1);
    expect(live(container)).toContain("Cards & Surfaces");
  });

  it("steps backward with ArrowLeft (wrapping to the last card)", () => {
    const onTopChange = vi.fn();
    const { container, getByRole } = render(<CardStackDeck items={ITEMS} onTopChange={onTopChange} />);
    fireEvent.keyDown(getByRole("group"), { key: "ArrowLeft" });
    expect(onTopChange).toHaveBeenCalledWith(ITEMS.length - 1);
    expect(live(container)).toContain("Forms & Inputs");
  });

  it("drives the same state from the visible prev/next buttons", () => {
    const onTopChange = vi.fn();
    const { getByLabelText } = render(<CardStackDeck items={ITEMS} onTopChange={onTopChange} />);
    fireEvent.click(getByLabelText(/send the front card to the back/i));
    expect(onTopChange).toHaveBeenCalledWith(1);
    cleanup();
    onTopChange.mockClear();
    const second = render(<CardStackDeck items={ITEMS} onTopChange={onTopChange} />);
    fireEvent.click(second.getByLabelText(/bring the previous card to the front/i));
    expect(onTopChange).toHaveBeenCalledWith(ITEMS.length - 1);
  });

  it("honours a controlled topIndex", () => {
    const { container, rerender } = render(<CardStackDeck items={ITEMS} topIndex={2} />);
    expect(live(container)).toContain("Navigation");
    rerender(<CardStackDeck items={ITEMS} topIndex={0} />);
    expect(live(container)).toContain("Backgrounds");
  });

  it("stays fully operable under reduced motion", () => {
    const { container, getByRole } = render(<CardStackDeck items={ITEMS} reducedMotion />);
    expect(getByRole("group").getAttribute("data-motion")).toBe("static");
    fireEvent.keyDown(getByRole("group"), { key: "ArrowRight" });
    expect(live(container)).toContain("Cards & Surfaces");
    // No busy gate under reduced motion — a second press moves again immediately.
    fireEvent.keyDown(getByRole("group"), { key: "ArrowRight" });
    expect(live(container)).toContain("Navigation");
  });

  it("renders custom faces through renderItem and mounts/unmounts cleanly", () => {
    const { getByText, unmount } = render(
      <CardStackDeck
        items={ITEMS}
        cardBack={<span>back</span>}
        renderItem={(item, state) => <span>{`${item.label}${state.isFront ? " (front)" : ""}`}</span>}
      />,
    );
    expect(getByText("Backgrounds (front)")).toBeTruthy();
    expect(() => unmount()).not.toThrow();
  });
});
