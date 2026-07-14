import * as React from "react";
import { render, cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApiRequestInspector,
  type ApiRequest,
  type ApiResponse,
} from "./api-request-inspector";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const REQUEST: ApiRequest = {
  method: "POST",
  url: "https://api.demo.dev/v1/deployments",
  environment: "production",
  requestId: "req_test01",
  timestamp: 1_700_000_000_000,
  query: { wait: "true" },
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer TOPSECRETVALUE123",
  },
  body: { project: "ledger-web", ref: "main" },
};

const RESPONSE: ApiResponse = {
  status: 201,
  statusText: "Created",
  durationMs: 812,
  headers: { "Content-Type": "application/json" },
  body: { id: "dpl_uniqueid", state: "queued" },
};

describe("ApiRequestInspector", () => {
  it("redacts a sensitive value: the secret is absent and a Redacted marker is shown", async () => {
    const { container } = render(
      <ApiRequestInspector request={REQUEST} response={RESPONSE} state="success" defaultSection="request-headers" />,
    );
    // The Authorization value must never reach the DOM.
    expect(screen.queryByText(/TOPSECRETVALUE123/)).toBeNull();
    // A clearly-labelled redaction marker is present instead.
    expect(screen.getAllByText("Redacted").length).toBeGreaterThan(0);
    await noViolations(container);
  });

  it("shows the status as a text label, not colour alone", () => {
    render(<ApiRequestInspector request={REQUEST} response={{ ...RESPONSE, status: 503 }} state="server_error" />);
    expect(screen.getByText("Server error")).toBeTruthy();
  });

  it("exposes expandable sections via aria-expanded", async () => {
    const user = userEvent.setup();
    render(<ApiRequestInspector request={REQUEST} response={RESPONSE} state="success" defaultSection="response-body" />);
    const trigger = screen.getByRole("button", { name: /request headers/i });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("fires onRetry from the Retry control in an error state", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ApiRequestInspector request={REQUEST} response={RESPONSE} state="timeout" onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("fires onCopy when the URL is copied", async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    render(<ApiRequestInspector request={REQUEST} response={RESPONSE} state="success" onCopy={onCopy} />);
    await user.click(screen.getByRole("button", { name: /url/i }));
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onCopy.mock.calls[0][0]).toContain("api.demo.dev/v1/deployments");
  });

  it("keeps payload text selectable (rendered, not aria-hidden)", () => {
    const { container } = render(
      <ApiRequestInspector request={REQUEST} response={RESPONSE} state="success" defaultSection="response-body" />,
    );
    // The response body is open by default; find the code block that carries it.
    const code = within(container).getAllByText((_, el) => (el?.textContent ?? "").includes("dpl_uniqueid"))
      .find((el) => el.tagName === "CODE");
    expect(code).toBeTruthy();
    expect(code!.closest('[aria-hidden="true"]')).toBeNull();
    expect(code!.className).toContain("select-text");
  });
});
