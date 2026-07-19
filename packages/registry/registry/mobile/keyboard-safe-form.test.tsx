import * as React from "react";
import { render, cleanup, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { KeyboardSafeForm, type FieldError } from "./keyboard-safe-form";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

/** A minimal app-owned field set with real labelled inputs. */
function Fields() {
  return (
    <>
      <label htmlFor="email" className="block">
        Email address
        <input id="email" name="email" type="email" />
      </label>
      <label htmlFor="name" className="block">
        Full name
        <input id="name" name="name" type="text" />
      </label>
    </>
  );
}

/** A deferred promise so async submission phases are deterministic. */
function deferred<T = void>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("KeyboardSafeForm", () => {
  it("shows a validation summary linking each error to its field and blocks submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const ERRORS: FieldError[] = [
      { fieldId: "email", label: "Email address", message: "Enter a valid email." },
      { fieldId: "name", label: "Full name", message: "This field is required." },
    ];
    const { container } = render(
      <KeyboardSafeForm title="Contact" onSubmit={onSubmit} onValidate={() => ERRORS}>
        <Fields />
      </KeyboardSafeForm>,
    );
    await user.click(screen.getByRole("button", { name: /save/i }));
    // Submit is blocked while errors remain.
    expect(onSubmit).not.toHaveBeenCalled();
    const summary = await screen.findByRole("alert");
    expect(within(summary).getByText(/enter a valid email/i)).toBeTruthy();
    // Each error links to its field id.
    const emailLink = within(summary).getByRole("link", { name: /email address/i });
    expect(emailLink.getAttribute("href")).toBe("#email");
    await noViolations(container);
  });

  it("moves focus to the matching field when a summary item is activated", async () => {
    const user = userEvent.setup();
    render(
      <KeyboardSafeForm
        onSubmit={vi.fn()}
        onValidate={() => [{ fieldId: "name", label: "Full name", message: "Required." }]}
      >
        <Fields />
      </KeyboardSafeForm>,
    );
    await user.click(screen.getByRole("button", { name: /save/i }));
    await screen.findByRole("alert");
    await user.click(screen.getByRole("link", { name: /full name/i }));
    expect(document.activeElement).toBe(document.getElementById("name"));
  });

  it("drives loading → success and reports it in a live region", async () => {
    const user = userEvent.setup();
    const d = deferred();
    const onSubmit = vi.fn(() => d.promise);
    const onSubmitSuccess = vi.fn();
    render(
      <KeyboardSafeForm onSubmit={onSubmit} onValidate={() => []} onSubmitSuccess={onSubmitSuccess} successMessage="Message sent">
        <Fields />
      </KeyboardSafeForm>,
    );
    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    // Pending: submit disabled + a cancel-submission affordance.
    expect(screen.getByRole("button", { name: /submitting/i })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: /cancel submission/i })).toBeTruthy();
    d.resolve();
    await waitFor(() => expect(screen.getByText(/message sent/i)).toBeTruthy());
    expect(onSubmitSuccess).toHaveBeenCalledTimes(1);
  });

  it("shows an error banner with Retry when submit rejects, and retry re-runs", async () => {
    const user = userEvent.setup();
    const first = deferred();
    const second = deferred();
    const onSubmit = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    render(
      <KeyboardSafeForm onSubmit={onSubmit} onValidate={() => []}>
        <Fields />
      </KeyboardSafeForm>,
    );
    await user.click(screen.getByRole("button", { name: /save/i }));
    first.reject(new Error("Network unreachable"));
    const banner = await screen.findByText(/network unreachable/i);
    expect(banner).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onSubmit).toHaveBeenCalledTimes(2);
    second.resolve();
  });

  it("cancels an in-flight submission without reporting success", async () => {
    const user = userEvent.setup();
    const d = deferred();
    const onSubmit = vi.fn(() => d.promise);
    const onSubmitSuccess = vi.fn();
    render(
      <KeyboardSafeForm onSubmit={onSubmit} onValidate={() => []} onSubmitSuccess={onSubmitSuccess} successMessage="Saved!">
        <Fields />
      </KeyboardSafeForm>,
    );
    await user.click(screen.getByRole("button", { name: /save/i }));
    await user.click(screen.getByRole("button", { name: /cancel submission/i }));
    // Late resolution after cancel must not surface a success state.
    d.resolve();
    await Promise.resolve();
    expect(screen.queryByText(/saved!/i)).toBeNull();
    expect(onSubmitSuccess).not.toHaveBeenCalled();
  });

  it("guards unsaved changes: Cancel opens a discard dialog before onCancel fires", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <KeyboardSafeForm onSubmit={vi.fn()} onValidate={() => []} dirty onCancel={onCancel}>
        <Fields />
      </KeyboardSafeForm>,
    );
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(onCancel).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByRole("heading", { name: /discard changes/i })).toBeTruthy();
    // "Keep editing" dismisses without discarding.
    await user.click(within(dialog).getByRole("button", { name: /keep editing/i }));
    expect(onCancel).not.toHaveBeenCalled();
    // Re-open and confirm the discard this time.
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: /discard changes/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("cancels immediately with no guard when the form is clean", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <KeyboardSafeForm onSubmit={vi.fn()} onValidate={() => []} onCancel={onCancel}>
        <Fields />
      </KeyboardSafeForm>,
    );
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("has no axe violations in the default (idle) state", async () => {
    const { container } = render(
      <KeyboardSafeForm title="Profile" description="Update your details" onSubmit={vi.fn()} onValidate={() => []}>
        <Fields />
      </KeyboardSafeForm>,
    );
    await noViolations(container);
  });
});
