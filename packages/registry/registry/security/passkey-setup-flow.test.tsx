import * as React from "react";
import { render, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PasskeySetupFlow,
  type PasskeyState,
  type PasskeyCapability,
} from "./passkey-setup-flow";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const CAP: PasskeyCapability = { supported: true, platformAuthenticator: true, detail: "Touch ID detected." };

function renderFlow(state: PasskeyState, extra: Partial<React.ComponentProps<typeof PasskeySetupFlow>> = {}) {
  return render(
    <PasskeySetupFlow
      state={state}
      relyingPartyName="Acme"
      capability={CAP}
      onUseAlternative={() => {}}
      {...extra}
    />,
  );
}

describe("PasskeySetupFlow", () => {
  it("advances the ordered step semantics as the app-owned state changes", () => {
    const { rerender } = renderFlow("naming");
    const steps = screen.getByRole("list", { name: /setup steps/i });
    const items = () => Array.from(steps.querySelectorAll("li"));

    // On "naming" the current step is step 2 ("Name your passkey").
    let current = items().filter((li) => li.getAttribute("aria-current") === "step");
    expect(current).toHaveLength(1);
    expect(current[0].getAttribute("data-status")).toBe("current");
    expect(current[0].textContent).toMatch(/name your passkey/i);
    // Step 1 is already complete.
    expect(items()[0].getAttribute("data-status")).toBe("complete");

    // App advances to the confirm step.
    rerender(
      <PasskeySetupFlow state="system-prompt-waiting" relyingPartyName="Acme" capability={CAP} onUseAlternative={() => {}} />,
    );
    current = items().filter((li) => li.getAttribute("aria-current") === "step");
    expect(current[0].textContent).toMatch(/confirm on your device/i);
    expect(items()[1].getAttribute("data-status")).toBe("complete");
  });

  it("fires onBegin when the user starts creating the passkey", async () => {
    const user = userEvent.setup();
    const onBegin = vi.fn();
    renderFlow("naming", { onBegin, defaultName: "My laptop" });
    await user.click(screen.getByRole("button", { name: /create passkey/i }));
    expect(onBegin).toHaveBeenCalledTimes(1);
  });

  it("fires onRetry from the failure screen's Try again control", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderFlow("failure", {
      onRetry,
      error: { message: "You didn't finish the prompt in time.", code: "NotAllowedError" },
    });
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows an unsupported-browser state without trapping the user (no create control, alt path offered)", () => {
    const onUseAlternative = vi.fn();
    renderFlow("unsupported", {
      capability: { supported: false, detail: "This browser can't create passkeys." },
      onUseAlternative,
    });
    // No linear stepper and no create/primary passkey action on a dead-end device.
    expect(screen.queryByRole("list", { name: /setup steps/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /create passkey|set up a passkey/i })).toBeNull();
    // Not blocked: the alternative path is present and the capability reason is in text.
    expect(screen.getByRole("button", { name: /another sign-in method/i })).toBeTruthy();
    expect(screen.getByText(/can't create passkeys/i)).toBeTruthy();
  });

  it("surfaces honest failure detail and associates it with the retry control", () => {
    renderFlow("failure", {
      error: { title: "Couldn't create the passkey", message: "The security key was removed before setup finished.", code: "AbortError" },
    });
    const alert = screen.getByRole("alert");
    // The specific, app-supplied detail (not a vague message) is shown, plus the reason code.
    expect(alert.textContent).toMatch(/security key was removed/i);
    expect(alert.textContent).toMatch(/AbortError/);
    // The retry button is programmatically associated with the failure detail.
    const detail = screen.getByText(/security key was removed/i);
    const retry = screen.getByRole("button", { name: /try again/i });
    expect(retry.getAttribute("aria-describedby")).toBe(detail.getAttribute("id"));
    expect(detail.getAttribute("id")).toBeTruthy();
  });

  it("offers the alternative auth path on the intro and fires onUseAlternative (and passes axe)", async () => {
    const user = userEvent.setup();
    const onUseAlternative = vi.fn();
    const { container } = renderFlow("intro", { onUseAlternative });
    const alt = screen.getByRole("button", { name: /another sign-in method/i });
    await user.click(alt);
    expect(onUseAlternative).toHaveBeenCalledTimes(1);
    await noViolations(container);
  });
});
