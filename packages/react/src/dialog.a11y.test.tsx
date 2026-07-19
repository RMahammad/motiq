import { render, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { AnimatedDialog } from "./dialog";

afterEach(cleanup);

async function violations(node: Element) {
  const results = await axe.run(node as HTMLElement, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations;
}

describe("AnimatedDialog accessibility (axe, WCAG 2.2 AA scope)", () => {
  it("open dialog with description has no violations", async () => {
    const user = userEvent.setup();
    render(
      <AnimatedDialog
        trigger={<button type="button">Open</button>}
        title="Delete item"
        description="This cannot be undone."
      >
        <button type="button">Confirm delete</button>
      </AnimatedDialog>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete item" });
    expect(await violations(dialog)).toEqual([]);
  });

  it("open dialog without description has no violations (description opt-out)", async () => {
    const user = userEvent.setup();
    render(
      <AnimatedDialog trigger={<button type="button">Open</button>} title="Notice">
        <p>Body</p>
      </AnimatedDialog>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = await screen.findByRole("dialog", { name: "Notice" });
    expect(await violations(dialog)).toEqual([]);
  });
});
