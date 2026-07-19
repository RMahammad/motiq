import * as React from "react";
import { render, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PromptComposer,
  type PromptVariable,
  type PromptTemplate,
  type PromptModel,
  type PromptAttachment,
} from "./prompt-composer";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const VARIABLES: PromptVariable[] = [
  { key: "customer_name", label: "Customer name", description: "The recipient" },
  { key: "product", label: "Product" },
];
const TEMPLATES: PromptTemplate[] = [
  { id: "t1", label: "Support reply", body: "Thanks for reaching out about {{product}}." },
];
const MODELS: PromptModel[] = [
  { id: "fast", name: "Demo Fast", caption: "quick" },
  { id: "deep", name: "Demo Deep", caption: "thorough" },
  { id: "legacy", name: "Demo Legacy", disabled: true, disabledReason: "Retired" },
];
const ATTACHMENTS: PromptAttachment[] = [
  { id: "a1", name: "spec.pdf", kind: "file", meta: "82 KB", status: "ready" },
];

describe("PromptComposer", () => {
  it("edits an uncontrolled draft and submits with Cmd/Ctrl+Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { container } = render(<PromptComposer onSubmit={onSubmit} />);
    const textarea = screen.getByRole("textbox", { name: /prompt/i });
    await user.click(textarea);
    await user.type(textarea, "Summarise this");
    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("Summarise this");
    await noViolations(container);
  });

  it("reflects a controlled value and reports edits via onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<PromptComposer value="frozen" onValueChange={onValueChange} />);
    const textarea = screen.getByRole("textbox", { name: /prompt/i }) as HTMLTextAreaElement;
    expect(textarea.value).toBe("frozen");
    await user.type(textarea, "!");
    expect(onValueChange).toHaveBeenCalled();
    // Controlled: the DOM value stays app-owned until the app updates `value`.
    expect(textarea.value).toBe("frozen");
  });

  it("does not submit an empty prompt", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PromptComposer onSubmit={onSubmit} />);
    const send = screen.getByRole("button", { name: /send/i });
    expect((send as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("textbox", { name: /prompt/i }));
    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("inserts a variable and fires onInsertVariable", async () => {
    const user = userEvent.setup();
    const onInsertVariable = vi.fn();
    render(<PromptComposer variables={VARIABLES} onInsertVariable={onInsertVariable} defaultValue="Hi " />);
    // The variable-chip row exposes each variable as an insert control.
    await user.click(screen.getByRole("button", { name: /customer name.*insert into prompt/i }));
    expect(onInsertVariable).toHaveBeenCalledWith(expect.objectContaining({ key: "customer_name" }));
    const textarea = screen.getByRole("textbox", { name: /prompt/i }) as HTMLTextAreaElement;
    expect(textarea.value).toContain("{{customer_name}}");
  });

  it("inserts a template body at the caret and fires onInsertTemplate", async () => {
    const user = userEvent.setup();
    const onInsertTemplate = vi.fn();
    render(<PromptComposer templates={TEMPLATES} onInsertTemplate={onInsertTemplate} />);
    await user.click(screen.getByRole("button", { name: /insert a template/i }));
    await user.click(await screen.findByRole("menuitem", { name: /support reply/i }));
    expect(onInsertTemplate).toHaveBeenCalledWith(expect.objectContaining({ id: "t1" }));
    const textarea = screen.getByRole("textbox", { name: /prompt/i }) as HTMLTextAreaElement;
    expect(textarea.value).toContain("Thanks for reaching out");
  });

  it("removes an attachment and does not select a disabled model", async () => {
    const user = userEvent.setup();
    const onRemoveAttachment = vi.fn();
    const onModelChange = vi.fn();
    render(
      <PromptComposer
        attachments={ATTACHMENTS}
        onRemoveAttachment={onRemoveAttachment}
        models={MODELS}
        selectedModelId="fast"
        onModelChange={onModelChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /remove attachment spec\.pdf/i }));
    expect(onRemoveAttachment).toHaveBeenCalledWith(expect.objectContaining({ id: "a1" }));

    await user.click(screen.getByRole("button", { name: /choose a model/i }));
    await user.click(await screen.findByRole("menuitemradio", { name: /Demo Deep/i }));
    expect(onModelChange).toHaveBeenCalledWith("deep", expect.objectContaining({ id: "deep" }));

    onModelChange.mockClear();
    await user.click(screen.getByRole("button", { name: /choose a model/i }));
    await user.click(await screen.findByRole("menuitemradio", { name: /Demo Legacy/i }));
    expect(onModelChange).not.toHaveBeenCalled();
  });

  it("blocks submit when over the token budget and shows an over-limit status", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PromptComposer defaultValue="lots of text" tokenCount={120} maxTokens={100} onSubmit={onSubmit} />);
    // Status is conveyed with text, not colour alone.
    expect(screen.getByText(/over tokens limit by 20/i)).toBeTruthy();
    const send = screen.getByRole("button", { name: /send/i });
    expect((send as HTMLButtonElement).disabled).toBe(true);
    await user.click(send);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows Stop while busy and Retry on error, wiring their callbacks", async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    const { rerender } = render(
      <PromptComposer defaultValue="go" status="streaming" onStop={onStop} onRetry={vi.fn()} />,
    );
    expect(screen.queryByRole("button", { name: /^send$/i })).toBeNull();
    await user.click(screen.getByRole("button", { name: /stop/i }));
    expect(onStop).toHaveBeenCalledTimes(1);

    const onRetry = vi.fn();
    rerender(<PromptComposer defaultValue="go" status="error" onStop={onStop} onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
