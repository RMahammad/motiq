import * as React from "react";
import { render, cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WebhookEventStream, type WebhookEvent } from "./webhook-event-stream";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

// Deterministic, fictional events — timestamps passed in (no Date.now/random).
const BASE_TS = 1_700_000_000_000;
const EVENTS: WebhookEvent[] = [
  {
    id: "evt_1",
    event: "payment.succeeded",
    status: "delivered",
    endpoint: "https://hooks.demo.app/in",
    statusCode: 200,
    timestamp: BASE_TS,
    retryCount: 0,
    durationMs: 142,
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Signature": "sha256=SUPERSECRETSIGNATURE1234567890",
    },
    payload: { id: "pay_9Kq2", amount: 4200, token: "tok_LIVE_should_never_render" },
  },
  {
    id: "evt_2",
    event: "invoice.finalized",
    status: "failed",
    endpoint: "https://hooks.demo.app/in",
    statusCode: 500,
    timestamp: BASE_TS + 4000,
    retryCount: 2,
    durationMs: 30000,
    error: "Endpoint returned 500 after 30s — will retry with backoff.",
    payload: { id: "inv_5m2", total: 9900 },
  },
  {
    id: "evt_3",
    event: "customer.created",
    status: "pending",
    endpoint: "https://hooks.demo.app/in",
    timestamp: BASE_TS + 8000,
    retryCount: 0,
    payload: { id: "cus_31a" },
  },
];

describe("WebhookEventStream", () => {
  it("renders each delivery status by icon + text label (never colour alone)", async () => {
    const { container } = render(<WebhookEventStream events={EVENTS} status="idle" />);
    // Status label text is present, not only a coloured swatch.
    expect(screen.getAllByText("Delivered").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Failed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    await noViolations(container);
  });

  it("never renders a redacted secret header value in the DOM, even when expanded", async () => {
    const user = userEvent.setup();
    const { container } = render(<WebhookEventStream events={EVENTS} status="idle" />);
    // Expand the first event to reveal headers + payload.
    await user.click(screen.getByRole("button", { name: /payment\.succeeded/i }));
    // The signing secret and the payload token must never be in the document.
    expect(container.textContent).not.toContain("SUPERSECRETSIGNATURE1234567890");
    expect(container.textContent).not.toContain("tok_LIVE_should_never_render");
    // The redaction placeholder is shown instead.
    expect(screen.getAllByText(/Redacted|••••••/).length).toBeGreaterThan(0);
  });

  it("does not surface a row via search on a redacted secret value", async () => {
    const user = userEvent.setup();
    render(<WebhookEventStream events={EVENTS} status="idle" />);
    const search = screen.getByRole("searchbox", { name: /search webhook events/i });
    await user.type(search, "SUPERSECRETSIGNATURE");
    // The secret is not searchable — no event matches, empty-filter state shows.
    expect(screen.getByText(/no events match the current filters/i)).toBeTruthy();
    // The delivered row (which carries the secret header) is gone from the list.
    expect(screen.queryByRole("button", { name: /payment\.succeeded/i })).toBeNull();
  });

  it("filters by delivery status (deselecting Delivered hides delivered rows)", async () => {
    const user = userEvent.setup();
    render(<WebhookEventStream events={EVENTS} status="idle" />);
    expect(screen.getByRole("button", { name: /payment\.succeeded/i })).toBeTruthy();
    // The status filter group toggles Delivered off.
    const group = screen.getByRole("group", { name: /filter by delivery status/i });
    await user.click(within(group).getByRole("button", { name: /Delivered/i }));
    expect(screen.queryByRole("button", { name: /payment\.succeeded/i })).toBeNull();
    // Failed + pending rows remain.
    expect(screen.getByRole("button", { name: /invoice\.finalized/i })).toBeTruthy();
  });

  it("fires onRetry for a failed delivery from the row action", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<WebhookEventStream events={EVENTS} status="idle" onRetry={onRetry} />);
    // The failed row exposes a Retry control; delivered rows do not.
    await user.click(screen.getByRole("button", { name: /^Retry$/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ id: "evt_2", status: "failed" }));
  });

  it("fires onReplay with the event and reports expansion via onInspect", async () => {
    const user = userEvent.setup();
    const onReplay = vi.fn();
    const onInspect = vi.fn();
    render(
      <WebhookEventStream events={EVENTS} status="idle" onReplay={onReplay} onInspect={onInspect} />,
    );
    await user.click(screen.getAllByRole("button", { name: /replay/i })[0]);
    expect(onReplay).toHaveBeenCalledWith(expect.objectContaining({ id: "evt_1" }));

    const trigger = screen.getByRole("button", { name: /payment\.succeeded/i });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(onInspect).toHaveBeenLastCalledWith(expect.objectContaining({ id: "evt_1" }), true);
  });

  it("toggles paused state and reports it through onPausedChange", async () => {
    const user = userEvent.setup();
    const onPausedChange = vi.fn();
    render(<WebhookEventStream events={EVENTS} status="streaming" onPausedChange={onPausedChange} />);
    await user.click(screen.getByRole("button", { name: /pause/i }));
    expect(onPausedChange).toHaveBeenCalledWith(true);
    expect(screen.getByText(/webhook stream paused/i)).toBeTruthy();
  });

  it("shows an empty state and an error banner with a working Reconnect callback", async () => {
    const user = userEvent.setup();
    const onReconnect = vi.fn();
    render(
      <WebhookEventStream
        events={[]}
        status="error"
        errorMessage="Connection to the delivery worker was lost."
        onReconnect={onReconnect}
      />,
    );
    expect(screen.getByText(/ended before any events arrived/i)).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toMatch(/connection to the delivery worker was lost/i);
    await user.click(screen.getByRole("button", { name: /reconnect/i }));
    expect(onReconnect).toHaveBeenCalledTimes(1);
  });
});
