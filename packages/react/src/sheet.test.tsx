import { render, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { Sheet } from "./sheet";

afterEach(cleanup);

function renderSheet(side: "left" | "right" | "top" | "bottom" = "right") {
  return render(
    <Sheet trigger={<button type="button">Open</button>} title="Filters" side={side}>
      <button type="button">Apply</button>
    </Sheet>,
  );
}

describe("Sheet", () => {
  it("opens with dialog role + label, traps focus, and records its side", async () => {
    const user = userEvent.setup();
    renderSheet("left");
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = await screen.findByRole("dialog", { name: "Filters" });
    expect(dialog.getAttribute("data-side")).toBe("left");
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    renderSheet();
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it("has no axe violations when open", async () => {
    const user = userEvent.setup();
    render(
      <Sheet
        trigger={<button type="button">Open</button>}
        title="Settings"
        description="Adjust your preferences."
      >
        <button type="button">Save</button>
      </Sheet>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = await screen.findByRole("dialog", { name: "Settings" });
    const res = await axe.run(dialog, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(res.violations).toEqual([]);
  });

  it("SSRs only the trigger when closed", () => {
    const html = renderToString(
      <Sheet trigger={<button type="button">Open</button>} title="Filters">
        <p>Body</p>
      </Sheet>,
    );
    expect(html).toContain("Open");
    expect(html).not.toContain("Filters");
    expect(html).not.toContain("Body");
  });
});
