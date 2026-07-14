import * as React from "react";
import { render, cleanup, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MobileFilterSheet,
  type FilterGroup,
  type FilterValue,
} from "./mobile-filter-sheet";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const groups: FilterGroup[] = [
  {
    id: "status",
    label: "Status",
    type: "checkbox",
    options: [
      { value: "active", label: "Active", count: 5 },
      { value: "draft", label: "Draft", count: 2 },
    ],
  },
  {
    id: "owner",
    label: "Owner",
    type: "radio",
    options: [
      { value: "ada", label: "Ada" },
      { value: "grace", label: "Grace" },
    ],
  },
];

/** Uncontrolled-open harness that reports the applied value out. */
function Harness(props: Partial<React.ComponentProps<typeof MobileFilterSheet>> & { onApplied?: (v: FilterValue) => void }) {
  const { onApplied, ...rest } = props;
  const [applied, setApplied] = React.useState<FilterValue>(props.defaultValue ?? { status: ["active"] });
  return (
    <MobileFilterSheet
      groups={groups}
      value={applied}
      onValueChange={(v) => {
        setApplied(v);
        onApplied?.(v);
      }}
      contained
      title="Filters"
      trigger="Filters"
      {...rest}
      // keep value/onValueChange controlled by the harness
      defaultValue={undefined}
    />
  );
}

async function openSheet(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /filters/i }));
  return screen.findByRole("dialog");
}

describe("MobileFilterSheet", () => {
  it("keeps editing in the draft — the applied value does not change until Apply", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onApplied={onValueChange} onApply={vi.fn()} />);
    const dialog = await openSheet(user);
    // "active" is applied; toggle "Draft" in the draft
    await user.click(within(dialog).getByRole("checkbox", { name: /Draft/i }));
    expect((within(dialog).getByRole("checkbox", { name: /Draft/i }) as HTMLInputElement).checked).toBe(true);
    // no commit yet
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("commits the draft on Apply (onApply + onValueChange fire with the new value)", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onValueChange = vi.fn();
    render(<Harness onApply={onApply} onApplied={onValueChange} />);
    const dialog = await openSheet(user);
    await user.click(within(dialog).getByRole("radio", { name: "Grace" }));
    await user.click(within(dialog).getByRole("button", { name: /apply/i }));
    await waitFor(() => expect(onApply).toHaveBeenCalledTimes(1));
    expect(onApply.mock.calls[0][0].owner).toBe("grace");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0][0].owner).toBe("grace");
  });

  it("restores the applied value on Cancel (draft edits are discarded)", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onApplied={onValueChange} onCancel={vi.fn()} />);
    let dialog = await openSheet(user);
    await user.click(within(dialog).getByRole("checkbox", { name: /Draft/i }));
    await user.click(within(dialog).getByRole("button", { name: /^cancel$/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onValueChange).not.toHaveBeenCalled();
    // reopen: the discarded "Draft" edit is gone, only applied "active" remains
    dialog = await openSheet(user);
    expect((within(dialog).getByRole("checkbox", { name: /Draft/i }) as HTMLInputElement).checked).toBe(false);
    expect((within(dialog).getByRole("checkbox", { name: /Active/i }) as HTMLInputElement).checked).toBe(true);
  });

  it("Clear all empties the draft selections", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const dialog = await openSheet(user);
    expect((within(dialog).getByRole("checkbox", { name: /Active/i }) as HTMLInputElement).checked).toBe(true);
    await user.click(within(dialog).getByRole("button", { name: /clear all/i }));
    expect((within(dialog).getByRole("checkbox", { name: /Active/i }) as HTMLInputElement).checked).toBe(false);
  });

  it("traps focus inside the dialog and restores it to the trigger on close", async () => {
    // Reduced motion → instant exit so unmount + focus restore is deterministic.
    const orig = window.matchMedia;
    window.matchMedia = ((q: string) => ({
      matches: /prefers-reduced-motion/.test(q), media: q, onchange: null,
      addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
    })) as typeof window.matchMedia;
    try {
      const user = userEvent.setup();
      render(<Harness confirmDiscard={false} />);
      const trigger = screen.getByRole("button", { name: /filters/i });
      await user.click(trigger);
      const dialog = await screen.findByRole("dialog");
      // focus landed inside the dialog
      await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
      // Tab from the last focusable wraps back inside the dialog (trap holds)
      const focusables = dialog.querySelectorAll<HTMLElement>("button, input, [tabindex]");
      focusables[focusables.length - 1].focus();
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
      // close → focus returns to the trigger
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(document.activeElement).toBe(trigger);
    } finally {
      window.matchMedia = orig;
    }
  });

  it("exposes a polite result-count announcement region", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness resultCount={12} />);
    const dialog = await openSheet(user);
    const live = dialog.querySelector('[aria-live="polite"]');
    expect(live).toBeTruthy();
    await waitFor(() => expect(live?.textContent).toMatch(/results/i));
    await noViolations(container);
  });

  it("asks to confirm before discarding unsaved changes when confirmDiscard is set", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<Harness confirmDiscard onCancel={onCancel} />);
    const dialog = await openSheet(user);
    // make the draft dirty
    await user.click(within(dialog).getByRole("checkbox", { name: /Draft/i }));
    // try to cancel → confirm prompt appears instead of closing
    await user.click(within(dialog).getByRole("button", { name: /^cancel$/i }));
    expect(await screen.findByRole("alertdialog")).toBeTruthy();
    expect(screen.getByText(/discard changes/i)).toBeTruthy();
    expect(onCancel).not.toHaveBeenCalled();
    // confirm the discard
    await user.click(screen.getByRole("button", { name: /^discard$/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
