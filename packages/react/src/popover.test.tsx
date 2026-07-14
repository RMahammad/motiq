import { render, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { Popover } from "./popover";

afterEach(cleanup);

describe("Popover", () => {
  it("opens on click, closes on Escape, and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    render(
      <Popover trigger={<button type="button">Menu</button>}>
        <p>Panel content</p>
      </Popover>,
    );
    const trigger = screen.getByRole("button", { name: "Menu" });
    await user.click(trigger);
    expect(await screen.findByText("Panel content")).toBeTruthy();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Panel content")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it("closes via the optional close button", async () => {
    const user = userEvent.setup();
    render(
      <Popover trigger={<button type="button">Open</button>} closeLabel="Dismiss">
        <p>Body</p>
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    await screen.findByText("Body");
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(screen.queryByText("Body")).toBeNull());
  });

  it("has no axe violations when open", async () => {
    const user = userEvent.setup();
    render(
      <Popover trigger={<button type="button">Open</button>} closeLabel="Close">
        <p>Accessible popover body</p>
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    await screen.findByText("Accessible popover body");
    const res = await axe.run(document.body, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(res.violations).toEqual([]);
  });
});
