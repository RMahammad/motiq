import * as React from "react";
import { render, cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  TwoFactorSetupFlow,
  type TwoFactorState,
  type TwoFactorMethod,
  type TwoFactorSetupData,
} from "./two-factor-setup-flow";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const METHODS: TwoFactorMethod[] = [
  { kind: "authenticator", label: "Authenticator app", description: "Codes from an app.", recommended: true },
  { kind: "sms", label: "Text message (SMS)", description: "A texted code.", tradeoff: "SMS can be intercepted." },
];

const SETUP: TwoFactorSetupData = {
  setupKey: "DEMO-ONLY-NOT-A-REAL-SECRET",
  codeLength: 6,
};

const RECOVERY = ["DEMO-0000-0001", "DEMO-0000-0002"];

describe("TwoFactorSetupFlow", () => {
  it("renders ordered step semantics that progress with the app-owned state", () => {
    // The linear security progression method → prepare → verify → recovery is
    // reflected in aria-current moving across the steps as `state` advances.
    const { rerender } = render(<TwoFactorSetupFlow state="method-selection" methods={METHODS} />);
    let steps = screen.getAllByRole("listitem");
    expect(steps[0].getAttribute("aria-current")).toBe("step");

    rerender(<TwoFactorSetupFlow state="secret-or-QR-ready" methods={METHODS} setupData={SETUP} />);
    steps = screen.getAllByRole("listitem");
    expect(steps[1].getAttribute("aria-current")).toBe("step");
    expect(steps[0].getAttribute("data-status")).toBe("complete");

    rerender(<TwoFactorSetupFlow state="waiting-for-code" methods={METHODS} setupData={SETUP} />);
    steps = screen.getAllByRole("listitem");
    expect(steps[2].getAttribute("aria-current")).toBe("step");

    rerender(<TwoFactorSetupFlow state="recovery-codes" methods={METHODS} recoveryCodes={RECOVERY} />);
    steps = screen.getAllByRole("listitem");
    expect(steps[3].getAttribute("aria-current")).toBe("step");
  });

  it("submits the entered code through onVerify (verification stays app-owned)", async () => {
    const user = userEvent.setup();
    const onVerify = vi.fn();
    const { container } = render(
      <TwoFactorSetupFlow state="waiting-for-code" methods={METHODS} setupData={SETUP} onVerify={onVerify} />,
    );
    const input = screen.getByLabelText(/6-digit code/i);
    // Verify is disabled until enough digits are present.
    expect(screen.getByRole("button", { name: /^Verify$/i })).toHaveProperty("disabled", true);
    await user.type(input, "123456");
    // Non-digits are stripped — the component never invents/validates a code itself.
    expect((input as HTMLInputElement).value).toBe("123456");
    await user.click(screen.getByRole("button", { name: /^Verify$/i }));
    expect(onVerify).toHaveBeenCalledWith("123456");
    await noViolations(container);
  });

  it("associates the invalid-code error with the input and keeps a retry path", () => {
    const error = { title: "That code didn't match", message: "Check the latest code and try again.", code: "code_mismatch" };
    render(<TwoFactorSetupFlow state="invalid-code" methods={METHODS} setupData={SETUP} error={error} />);
    const input = screen.getByLabelText(/6-digit code/i) as HTMLInputElement;
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/latest code/i);
    // The input is described by the same error node it points to.
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy && document.getElementById(describedBy)?.textContent).toMatch(/latest code/i);
  });

  it("handles an expired code by offering a fresh code instead of a stuck Verify", async () => {
    const user = userEvent.setup();
    const onResend = vi.fn();
    render(
      <TwoFactorSetupFlow
        state="expired-code"
        methods={METHODS}
        setupData={SETUP}
        error={{ message: "Codes are only valid briefly.", code: "code_expired" }}
        onResend={onResend}
      />,
    );
    // No plain "Verify" on an expired code — the primary action requests a new one.
    expect(screen.queryByRole("button", { name: /^Verify$/i })).toBeNull();
    await user.click(screen.getByRole("button", { name: /new code/i }));
    expect(onResend).toHaveBeenCalledTimes(1);
  });

  it("gates finishing behind confirming recovery codes were saved", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<TwoFactorSetupFlow state="recovery-codes" methods={METHODS} recoveryCodes={RECOVERY} onConfirmRecoveryCodes={onConfirm} />);
    const finish = screen.getByRole("button", { name: /finish setup/i });
    // Disabled until the user acknowledges saving the (sensitive) codes.
    expect(finish).toHaveProperty("disabled", true);
    await user.click(finish);
    expect(onConfirm).not.toHaveBeenCalled();
    await user.click(screen.getByRole("checkbox", { name: /saved my recovery codes/i }));
    expect(finish).toHaveProperty("disabled", false);
    await user.click(finish);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("always offers the alternative-method path before completion", async () => {
    const user = userEvent.setup();
    const onUseAlternative = vi.fn();
    render(<TwoFactorSetupFlow state="method-unavailable" methods={METHODS} onUseAlternative={onUseAlternative} error={{ message: "Not available." }} />);
    await user.click(screen.getByRole("button", { name: /different method/i }));
    expect(onUseAlternative).toHaveBeenCalledTimes(1);
  });
});
