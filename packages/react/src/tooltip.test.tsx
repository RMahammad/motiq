import { render, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { Tooltip } from "./tooltip";

afterEach(cleanup);

describe("Tooltip", () => {
  it("opens on keyboard focus and exposes role=tooltip with the content", async () => {
    render(
      <Tooltip content="Save changes">
        <button type="button">Save</button>
      </Tooltip>,
    );
    screen.getByRole("button", { name: "Save" }).focus();
    const tip = await screen.findByRole("tooltip");
    expect(tip.textContent).toContain("Save changes");
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Info">
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    screen.getByRole("button", { name: "Trigger" }).focus();
    await screen.findByRole("tooltip");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
  });

  it("has no axe violations when open", async () => {
    render(
      <Tooltip content="Help text">
        <button type="button">Help</button>
      </Tooltip>,
    );
    screen.getByRole("button", { name: "Help" }).focus();
    await screen.findByRole("tooltip");
    const res = await axe.run(document.body, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(res.violations).toEqual([]);
  });
});
