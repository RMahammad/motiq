import * as React from "react";
import { render, cleanup, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SessionSecurityCenter, type Session } from "./session-security-center";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const NOW = 1_800_000_000_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

// Fictional, deterministic data. MacBook is the current session; Pixel (recent)
// and iPad (idle) are the two revocable others.
const SESSIONS: Session[] = [
  {
    id: "mac",
    device: "MacBook Pro",
    browser: "Chrome 128",
    os: "macOS 15",
    location: "Lisbon, PT",
    ipSummary: "203.0.113.x",
    createdTime: NOW - 40 * DAY,
    lastActiveTime: NOW - 20_000,
    current: true,
    state: "current",
    authMethod: "Passkey",
  },
  {
    id: "pixel",
    device: "Pixel 8",
    os: "Android 15",
    createdTime: NOW - 18 * DAY,
    lastActiveTime: NOW - 3 * HOUR,
    state: "active",
    authMethod: "Password + 2FA",
  },
  {
    id: "ipad",
    device: "iPad Air",
    os: "iPadOS 18",
    createdTime: NOW - 9 * DAY,
    lastActiveTime: NOW - 5 * DAY,
    state: "idle",
    authMethod: "Password",
  },
];

describe("SessionSecurityCenter", () => {
  it("preserves the current session when revoking all others, and gives it no revoke control (axe clean)", async () => {
    const user = userEvent.setup();
    const onRevokeAllOthers = vi.fn();
    const { container } = render(
      <SessionSecurityCenter sessions={SESSIONS} now={NOW} onRevokeAllOthers={onRevokeAllOthers} onRevoke={() => {}} />,
    );

    // The current session cannot be revoked from its row.
    expect(screen.queryByRole("button", { name: /revoke session on MacBook/i })).toBeNull();
    expect(screen.getByText(/current session — kept active/i)).toBeTruthy();

    await noViolations(container);

    await user.click(screen.getByRole("button", { name: /revoke all other sessions/i }));
    const dialog = await screen.findByRole("alertdialog");
    // Confirm the bulk action.
    await user.click(within(dialog).getByRole("button", { name: /^revoke 2$/i }));

    expect(onRevokeAllOthers).toHaveBeenCalledTimes(1);
    const affected = onRevokeAllOthers.mock.calls[0][0] as Session[];
    expect(affected.map((s) => s.id).sort()).toEqual(["ipad", "pixel"]);
    // The safeguard: current is never in the affected set.
    expect(affected.some((s) => s.id === "mac")).toBe(false);
  });

  it("requires confirmation before firing onRevoke for a single session", async () => {
    const user = userEvent.setup();
    const onRevoke = vi.fn();
    render(<SessionSecurityCenter sessions={SESSIONS} now={NOW} onRevoke={onRevoke} />);

    await user.click(screen.getByRole("button", { name: /revoke session on Pixel 8/i }));
    // Not committed yet — a confirmation dialog is required first.
    expect(onRevoke).not.toHaveBeenCalled();

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByRole("heading", { name: /revoke this session/i })).toBeTruthy();
    await user.click(within(dialog).getByRole("button", { name: /^revoke$/i }));

    expect(onRevoke).toHaveBeenCalledTimes(1);
    expect(onRevoke.mock.calls[0][0].id).toBe("pixel");
  });

  it("cancelling the confirmation does not revoke", async () => {
    const user = userEvent.setup();
    const onRevoke = vi.fn();
    render(<SessionSecurityCenter sessions={SESSIONS} now={NOW} onRevoke={onRevoke} />);

    await user.click(screen.getByRole("button", { name: /revoke session on Pixel 8/i }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: /keep signed in/i }));

    expect(onRevoke).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("shows a failed revocation honestly and fires onRetry from the banner", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <SessionSecurityCenter
        sessions={SESSIONS}
        now={NOW}
        error="Couldn't revoke the session on Pixel 8. It is still signed in — please try again."
        onRetry={onRetry}
        onRevoke={() => {}}
      />,
    );

    expect(screen.getByRole("alert").textContent).toMatch(/still signed in/i);
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("preserves focus onto a neighbouring session after one is removed", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [sessions, setSessions] = React.useState<Session[]>(SESSIONS);
      return (
        <SessionSecurityCenter
          sessions={sessions}
          now={NOW}
          onRevoke={(s) => setSessions((prev) => prev.filter((x) => x.id !== s.id))}
        />
      );
    }
    render(<Harness />);

    // Revoke the middle (Pixel) session; iPad is its neighbour.
    await user.click(screen.getByRole("button", { name: /revoke session on Pixel 8/i }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: /^revoke$/i }));

    // The Pixel row is gone; focus lands on the neighbour's revoke control.
    await waitFor(() => expect(screen.queryByRole("button", { name: /revoke session on Pixel 8/i })).toBeNull());
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("button", { name: /revoke session on iPad Air/i })),
    );
  });
});
