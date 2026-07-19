import * as React from "react";
import { render, cleanup, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";

import { LivePresenceStack, type PresenceUser } from "./live-presence-stack";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const USERS: PresenceUser[] = [
  { id: "a", name: "Ada L.", status: "editing" },
  { id: "b", name: "Kit M.", status: "active" },
  { id: "c", name: "Ravi P.", status: "viewing" },
  { id: "d", name: "Noor S.", status: "idle" },
  { id: "e", name: "Tomás V.", status: "active" },
  { id: "f", name: "Mei W.", status: "viewing" },
];

describe("LivePresenceStack", () => {
  it("shows capped avatars with accessible names, a +N overflow chip, and is axe-clean", async () => {
    const { container } = render(<LivePresenceStack users={USERS} max={5} />);
    // 6 users, cap 5 → 4 named avatars + a "+2" chip.
    expect(screen.getByRole("img", { name: /Ada L\., Editing/ })).toBeTruthy();
    expect(screen.getByRole("img", { name: /Kit M\., Active/ })).toBeTruthy();
    expect(screen.getByRole("img", { name: /2 more people/ })).toBeTruthy();
    expect(screen.getByRole("group", { name: /6 people here/ })).toBeTruthy();
    await noViolations(container);
  });

  it("opens the detail popover and lists every participant with a status label", async () => {
    const user = userEvent.setup();
    render(<LivePresenceStack users={USERS} max={5} />);
    await user.click(screen.getByRole("button", { name: /Show details/ }));
    const dialog = await screen.findByRole("dialog", { name: "Participants" });
    // All six participants appear as rows (not just the four visible avatars).
    USERS.forEach((u) => expect(within(dialog).getByText(u.name)).toBeTruthy());
    expect(within(dialog).getAllByText("Active").length).toBe(2);
    await noViolations(document.body);
  });

  it("opens with the keyboard (Enter) and closes on Escape, restoring focus", async () => {
    const user = userEvent.setup();
    render(<LivePresenceStack users={USERS.slice(0, 3)} />);
    const trigger = screen.getByRole("button", { name: /Show details/ });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("dialog")).toBeTruthy();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });
});
