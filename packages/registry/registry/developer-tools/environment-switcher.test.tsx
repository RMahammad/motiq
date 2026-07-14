import * as React from "react";
import { render, cleanup, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EnvironmentSwitcher, type Environment } from "./environment-switcher";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const ENVS: Environment[] = [
  { id: "local", name: "Local", type: "local", status: "available", branch: "main" },
  { id: "staging", name: "Staging", type: "staging", status: "active", region: "us-east-1", health: 96 },
  { id: "prod", name: "Production", type: "production", status: "available", region: "us-east-1", warning: "Live customer data", health: 99 },
  { id: "legacy", name: "Legacy", type: "development", status: "available", disabled: true, disabledReason: "Decommissioned — contact platform team." },
];

const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /environment/i }));
  return screen.findByRole("listbox");
};

describe("EnvironmentSwitcher", () => {
  it("commits a controlled selection through onValueChange (value stays app-owned)", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <EnvironmentSwitcher environments={ENVS} value="local" onValueChange={onValueChange} />,
    );
    // Controlled: the trigger reflects the app's value.
    expect(screen.getByRole("button", { name: /Local/i })).toBeTruthy();
    await openMenu(user);
    await user.click(screen.getByRole("option", { name: /Staging/i }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("staging", expect.objectContaining({ id: "staging" }));
    await noViolations(container);
  });

  it("supports keyboard: ArrowDown opens, Arrow moves, Enter selects", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<EnvironmentSwitcher environments={ENVS} defaultValue="local" onValueChange={onValueChange} />);
    const trigger = screen.getByRole("button", { name: /environment/i });
    trigger.focus();
    await user.keyboard("{ArrowDown}"); // opens the popup
    const combobox = await screen.findByRole("combobox");
    await waitFor(() => expect(document.activeElement).toBe(combobox));
    await user.keyboard("{ArrowDown}{Enter}"); // move from Local → Staging, select
    expect(onValueChange).toHaveBeenCalledWith("staging", expect.objectContaining({ id: "staging" }));
  });

  it("gates a Production switch behind confirmation before firing onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <EnvironmentSwitcher environments={ENVS} defaultValue="local" onValueChange={onValueChange} requireProductionConfirmation />,
    );
    await openMenu(user);
    await user.click(screen.getByRole("option", { name: /Production/i }));
    // Not committed yet — a confirmation dialog is required first.
    expect(onValueChange).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByRole("heading", { name: /switch to production/i })).toBeTruthy();
    // The warning is conveyed in text, not colour alone.
    expect(within(dialog).getByText(/live users|customer/i)).toBeTruthy();
    await user.click(within(dialog).getByRole("button", { name: /switch to production/i }));
    expect(onValueChange).toHaveBeenCalledWith("prod", expect.objectContaining({ id: "prod" }));
  });

  it("does not select a disabled environment and shows its reason", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<EnvironmentSwitcher environments={ENVS} defaultValue="local" onValueChange={onValueChange} />);
    await openMenu(user);
    const option = screen.getByRole("option", { name: /Legacy/i });
    expect(option.getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByText(/Decommissioned/i)).toBeTruthy();
    await user.click(option);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("renders an app-owned loading state on the trigger", () => {
    render(<EnvironmentSwitcher environments={ENVS} value="local" switching switchingId="staging" />);
    // Shown on the trigger and echoed in the polite live region.
    expect(screen.getAllByText(/Switching to Staging/i).length).toBeGreaterThan(0);
  });

  it("fires onRetry from the error banner's Retry control", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <EnvironmentSwitcher environments={ENVS} value="local" error="Switch to Staging failed: connection reset." onRetry={onRetry} />,
    );
    expect(screen.getByRole("alert").textContent).toMatch(/connection reset/i);
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
