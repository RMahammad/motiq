import { render, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnimatedDialog } from "./dialog";

afterEach(cleanup);

function renderDialog() {
  return render(
    <AnimatedDialog
      trigger={<button type="button">Open</button>}
      title="Confirm"
      description="Are you sure?"
    >
      <button type="button">Inside action</button>
    </AnimatedDialog>,
  );
}

describe("AnimatedDialog", () => {
  it("is closed initially and opens on trigger with dialog role + accessible name", async () => {
    const user = userEvent.setup();
    renderDialog();
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Open" }));
    // findByRole("dialog", { name }) proves role="dialog" + aria-labelledby wiring to the title.
    const dialog = await screen.findByRole("dialog", { name: "Confirm" });
    expect(dialog).toBeTruthy();
    // content rendered inside the dialog
    expect(screen.getByRole("button", { name: "Inside action" })).toBeTruthy();
    expect(screen.getByText("Are you sure?")).toBeTruthy();
  });

  it("moves focus into the dialog on open (focus trap)", async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    renderDialog();
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it("closes via the close button", async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: "Open" }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("supports controlled open state + onOpenChange", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <AnimatedDialog open onOpenChange={onOpenChange} title="Controlled">
        <p>Body</p>
      </AnimatedDialog>,
    );
    expect(await screen.findByRole("dialog", { name: "Controlled" })).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
