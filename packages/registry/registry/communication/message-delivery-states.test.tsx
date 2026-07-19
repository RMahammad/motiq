import * as React from "react";
import { render, cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MessageDeliveryStates,
  type DeliveryMessage,
  type DeliveryState,
} from "./message-delivery-states";

afterEach(() => {
  cleanup();
  // Reset any matchMedia override between tests.
  restoreMatchMedia();
});

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

// Deterministic timestamp: absolute output driven by a passed formatter, so no
// clock/`now` drift enters the DOM.
const fmt = () => "10:30";
const T = 1_800_000_000_000;

const ME = { id: "me", name: "You" };
const OTHER = { id: "mira", name: "Mira Delacroix" };

function makeMessage(state: DeliveryState, over: Partial<DeliveryMessage> = {}): DeliveryMessage {
  return {
    id: "m1",
    body: "Shipping the release notes now.",
    author: ME,
    timestamp: T,
    deliveryState: state,
    ...over,
  };
}

function renderStates(message: DeliveryMessage, props: Partial<React.ComponentProps<typeof MessageDeliveryStates>> = {}) {
  return render(
    <MessageDeliveryStates messages={[message]} currentUserId="me" formatTimestamp={fmt} {...props} />,
  );
}

/* -- matchMedia override for the reduced-motion test --------------------- */
const originalMatchMedia = window.matchMedia;
function setReducedMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && /prefers-reduced-motion/.test(query),
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  })) as typeof window.matchMedia;
}
function restoreMatchMedia() {
  window.matchMedia = originalMatchMedia;
}

describe("MessageDeliveryStates", () => {
  it("shows the delivery progression sending → sent → delivered → read as text", () => {
    const { rerender } = renderStates(makeMessage("sending"));
    expect(screen.getByText("Sending")).toBeTruthy();

    rerender(
      <MessageDeliveryStates messages={[makeMessage("sent")]} currentUserId="me" formatTimestamp={fmt} />,
    );
    expect(screen.getByText("Sent")).toBeTruthy();

    rerender(
      <MessageDeliveryStates messages={[makeMessage("delivered")]} currentUserId="me" formatTimestamp={fmt} />,
    );
    expect(screen.getByText("Delivered")).toBeTruthy();

    rerender(
      <MessageDeliveryStates messages={[makeMessage("read")]} currentUserId="me" formatTimestamp={fmt} />,
    );
    expect(screen.getByText("Read")).toBeTruthy();
  });

  it("renders a failure state with its error associated to the message", () => {
    const { container } = renderStates(
      makeMessage("failed", { error: "Connection reset — message not delivered." }),
    );
    // Failure conveyed as text, not colour/icon alone.
    expect(screen.getByText("Not delivered")).toBeTruthy();
    const errorEl = screen.getByText(/Connection reset/i);
    expect(errorEl).toBeTruthy();
    // The message references its error via aria-describedby.
    const article = container.querySelector("article");
    const describedby = article?.getAttribute("aria-describedby");
    expect(describedby).toBeTruthy();
    expect(errorEl.id).toBe(describedby);
  });

  it("fires onRetry from the failed message's Retry control", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const message = makeMessage("failed", { error: "Timed out." });
    renderStates(message, { onRetry });
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ id: "m1" }));
  });

  it("fires onCancel from a scheduled message's Cancel control", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const message = makeMessage("scheduled", { scheduledFor: T + 3_600_000 });
    renderStates(message, { onCancel });
    expect(screen.getByText("Scheduled")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledWith(expect.objectContaining({ id: "m1" }));
  });

  it("labels the read state with recipient text, not an icon alone", () => {
    const message = makeMessage("read", {
      readRecipients: [
        { id: "mira", name: "Mira Delacroix" },
        { id: "devon", name: "Devon Achebe" },
      ],
    });
    renderStates(message);
    // The state itself is text.
    expect(screen.getByText("Read")).toBeTruthy();
    // Read receipts are labelled with the readers' names (as text, not an icon).
    expect(screen.getAllByText(/Read by Mira Delacroix and Devon Achebe/i).length).toBeGreaterThan(0);
  });

  it("renders every state instantly under reduced motion with no axe violations", async () => {
    setReducedMotion(true);
    const messages: DeliveryMessage[] = (
      ["draft", "sending", "sent", "delivered", "read", "failed", "retrying", "scheduled", "cancelled", "edited"] as DeliveryState[]
    ).map((state, i) => ({
      id: `m-${i}`,
      body: `Message in the ${state} state.`,
      author: i % 2 === 0 ? ME : OTHER,
      timestamp: T,
      deliveryState: state,
      ...(state === "failed" ? { error: "Delivery failed." } : {}),
      ...(state === "read" ? { readRecipients: [{ id: "r", name: "Rosa Whitfield" }] } : {}),
    }));
    const { container } = render(
      <MessageDeliveryStates messages={messages} currentUserId="me" formatTimestamp={fmt} onRetry={() => {}} onCancel={() => {}} />,
    );
    // A representative state is present and readable.
    expect(within(container).getByText("Delivered")).toBeTruthy();
    await noViolations(container);
  });
});
