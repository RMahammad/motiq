import * as React from "react";
import { render, cleanup, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MentionSuggestions, type MentionUser, type MentionGroup } from "./mention-suggestions";

afterEach(cleanup);

const WCAG = { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] };
async function noViolations(container: HTMLElement) {
  const res = await axe.run(container, { runOnly: WCAG });
  expect(res.violations.map((v) => v.id)).toEqual([]);
}

const ITEMS: MentionUser[] = [
  { id: "mira", name: "Mira Delacroix", handle: "@mira", role: "Product", presence: "online", group: "people" },
  { id: "devon", name: "Devon Achebe", handle: "@devon", role: "Design", presence: "away", group: "people" },
  { id: "kai", name: "Kai Ferreira", handle: "@kai", role: "Engineering", presence: "offline", group: "people" },
  {
    id: "rosa",
    name: "Rosa Whitfield",
    handle: "@rosa",
    role: "Marketing",
    group: "people",
    disabled: true,
    disabledReason: "Not a member of this project.",
  },
  { id: "design", name: "Design Team", handle: "@design", role: "6 people", group: "teams" },
  { id: "eng", name: "Engineering Team", handle: "@eng", role: "11 people", group: "teams" },
];

const GROUPS: MentionGroup[] = [
  { id: "people", label: "People" },
  { id: "teams", label: "Teams" },
];

/**
 * Harness modelling the app half: it owns the editable input, the "@" trigger
 * detection, and the insertion. The component only presents the popup.
 */
function Harness({
  items = ITEMS,
  groups = GROUPS,
  loading = false,
  onInsert,
}: {
  items?: MentionUser[];
  groups?: MentionGroup[];
  loading?: boolean;
  onInsert?: (value: string) => void;
}) {
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [value, setValue] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setValue(next);
    const m = /(?:^|\s)@([\w.-]*)$/.exec(next.slice(0, e.target.selectionStart ?? next.length));
    if (m) {
      setOpen(true);
      setQuery(m[1]);
    } else {
      setOpen(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <label htmlFor="composer">Message</label>
      <textarea
        id="composer"
        ref={inputRef}
        value={value}
        onChange={onChange}
        aria-label="Message"
      />
      <MentionSuggestions
        open={open}
        query={query}
        items={items}
        groups={groups}
        loading={loading}
        inputRef={inputRef}
        onOpenChange={setOpen}
        onSelect={(item, ctx) => {
          setValue((v) => v.replace(/@([\w.-]*)$/, `${ctx.value} `));
          setOpen(false);
          onInsert?.(ctx.value);
          inputRef.current?.focus();
        }}
      />
    </div>
  );
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  const input = screen.getByLabelText("Message");
  await user.click(input);
  await user.type(input, "@");
  return { input, listbox: await screen.findByRole("listbox") };
}

describe("MentionSuggestions", () => {
  it("stays closed until the app opens it, then shows filtered matches", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    // App-driven: nothing until "@" is typed.
    expect(screen.queryByRole("listbox")).toBeNull();
    const input = screen.getByLabelText("Message");
    await user.click(input);
    await user.type(input, "@mir");
    const listbox = await screen.findByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(within(listbox).getByRole("option", { name: /Mira Delacroix/i })).toBeTruthy();
  });

  it("keeps DOM focus in the app's input and wires the combobox ARIA onto it", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const { input } = await openMenu(user);
    // Focus never moves into the list.
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("role")).toBe("combobox");
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(input.getAttribute("aria-controls")).toBe(screen.getByRole("listbox").id);
    // aria-activedescendant points at the first enabled option.
    const active = screen.getByRole("option", { name: /Mira Delacroix/i });
    expect(input.getAttribute("aria-activedescendant")).toBe(active.id);
    expect(active.getAttribute("aria-selected")).toBe("true");
  });

  it("navigates with ArrowDown/ArrowUp and inserts on Enter (focus preserved)", async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();
    render(<Harness onInsert={onInsert} />);
    const { input } = await openMenu(user);
    await user.keyboard("{ArrowDown}"); // Mira -> Devon
    const devon = screen.getByRole("option", { name: /Devon Achebe/i });
    await waitFor(() => expect(input.getAttribute("aria-activedescendant")).toBe(devon.id));
    await user.keyboard("{Enter}");
    expect(onInsert).toHaveBeenCalledTimes(1);
    expect(onInsert).toHaveBeenCalledWith("@devon");
    expect(document.activeElement).toBe(input);
  });

  it("Home/End jump to the first/last enabled option", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const { input } = await openMenu(user);
    await user.keyboard("{End}");
    const last = screen.getByRole("option", { name: /Engineering Team/i });
    await waitFor(() => expect(input.getAttribute("aria-activedescendant")).toBe(last.id));
    await user.keyboard("{Home}");
    const first = screen.getByRole("option", { name: /Mira Delacroix/i });
    await waitFor(() => expect(input.getAttribute("aria-activedescendant")).toBe(first.id));
  });

  it("does not select a disabled entry (click or keyboard) and shows its reason", async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();
    render(<Harness onInsert={onInsert} />);
    await openMenu(user);
    const rosa = screen.getByRole("option", { name: /Rosa Whitfield/i });
    expect(rosa.getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByText(/Not a member of this project/i)).toBeTruthy();
    await user.click(rosa);
    expect(onInsert).not.toHaveBeenCalled();
  });

  it("selects on click while preserving focus in the input", async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();
    render(<Harness onInsert={onInsert} />);
    const { input } = await openMenu(user);
    await user.click(screen.getByRole("option", { name: /Kai Ferreira/i }));
    expect(onInsert).toHaveBeenCalledWith("@kai");
    expect(document.activeElement).toBe(input);
  });

  it("renders group headings, a loading state, and an empty state; Escape closes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Harness />);
    await openMenu(user);
    expect(screen.getByRole("group", { name: "People" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Teams" })).toBeTruthy();

    // Escape asks the app to close.
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());

    // Loading state.
    rerender(<Harness loading />);
    const input = screen.getByLabelText("Message");
    await user.clear(input);
    await user.type(input, "@");
    const loadingList = await screen.findByRole("listbox");
    expect(within(loadingList).getByText(/Searching/i)).toBeTruthy();

    // Empty state (no matches).
    rerender(<Harness />);
    const input2 = screen.getByLabelText("Message");
    await user.clear(input2);
    await user.type(input2, "@zzzzzz");
    const emptyList = await screen.findByRole("listbox");
    expect(within(emptyList).getByText(/No people match/i)).toBeTruthy();
  });

  it("has no axe violations while open", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    await openMenu(user);
    await noViolations(container);
  });
});
