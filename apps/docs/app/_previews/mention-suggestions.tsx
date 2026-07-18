"use client";

import * as React from "react";

import {
  MentionSuggestions,
  type MentionUser,
  type MentionGroup,
} from "@/registry/collaboration/mention-suggestions";
import { ControlBar, ControlButton, ControlHint } from "../_components/preview-controls";

/* Clearly fictional demo — an @-mention composer for an imaginary review tool.
 * No real people, teams, or accounts and no network. The app (this preview) owns
 * the <textarea>, detects the "@" trigger, and performs the text insertion; the
 * component only presents the accessible suggestion popup and drives selection.
 * Fixed ids so there is no SSR/CSR hydration drift. */

const PEOPLE: MentionUser[] = [
  { id: "mira", name: "Mira Delacroix", handle: "@mira", role: "Product", presence: "online", group: "people" },
  { id: "devon", name: "Devon Achebe", handle: "@devon", role: "Design", presence: "online", group: "people" },
  { id: "kai", name: "Kai Ferreira", handle: "@kai", role: "Engineering", presence: "away", group: "people" },
  { id: "rosa", name: "Rosa Whitfield", handle: "@rosa", role: "Marketing", presence: "offline", group: "people" },
  { id: "tomas", name: "Tomás Nyberg", handle: "@tomas", role: "Data", presence: "dnd", group: "people" },
  {
    id: "guest",
    name: "External Reviewer",
    handle: "@guest",
    role: "Read-only guest",
    group: "people",
    disabled: true,
    disabledReason: "Guests can't be mentioned in this space.",
    keywords: ["outside", "vendor"],
  },
  { id: "design", name: "Design Team", handle: "@design", role: "6 people", group: "teams", keywords: ["ux", "visual"] },
  { id: "eng", name: "Engineering Team", handle: "@eng", role: "11 people", group: "teams", keywords: ["dev", "platform"] },
];

const GROUPS: MentionGroup[] = [
  { id: "people", label: "People" },
  { id: "teams", label: "Teams" },
];

const TRIGGER = /(?:^|\s)@([\w.-]*)$/;

export function MentionSuggestionsPreview() {
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [value, setValue] = React.useState("Nice work on the launch review - ");
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const loadingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => {
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
  }, []);

  // The app owns trigger detection: an "@" at a word boundary opens the popup and
  // the text after it becomes the query. A brief simulated fetch shows off the
  // loading state (no real network).
  const syncTrigger = React.useCallback((text: string, caret: number) => {
    const m = TRIGGER.exec(text.slice(0, caret));
    if (m) {
      setQuery(m[1]);
      setOpen(true);
      setLoading(true);
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
      loadingTimer.current = setTimeout(() => setLoading(false), 260);
    } else {
      setOpen(false);
      setLoading(false);
    }
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    syncTrigger(e.target.value, e.target.selectionStart ?? e.target.value.length);
  };

  // The app performs the insertion: replace the in-progress "@query" with the
  // chosen mention text and keep typing.
  const insert = (_item: MentionUser, ctx: { value: string }) => {
    const el = inputRef.current;
    const caret = el?.selectionStart ?? value.length;
    const before = value.slice(0, caret).replace(/@([\w.-]*)$/, `${ctx.value} `);
    const after = value.slice(caret);
    const next = before + after;
    setValue(next);
    setOpen(false);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = before.length;
      el?.setSelectionRange(pos, pos);
    });
  };

  const reset = () => {
    setValue("Nice work on the launch review - ");
    setOpen(false);
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex w-full max-w-[560px] flex-col gap-4">
      {/* composer shell */}
      <div className="overflow-hidden rounded-2xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--color-border)] px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-fg)]">
            <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            New comment
          </span>
          <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
            Fictional demo data
          </span>
        </div>

        <div className="p-3">
          {/* The relative container anchors the popup; the app owns the field. */}
          <div className="relative">
            <label htmlFor="mention-composer" className="sr-only">
              Write a comment - type @ to mention someone
            </label>
            <textarea
              id="mention-composer"
              ref={inputRef}
              value={value}
              onChange={onChange}
              onClick={(e) =>
                syncTrigger(
                  (e.target as HTMLTextAreaElement).value,
                  (e.target as HTMLTextAreaElement).selectionStart ?? 0,
                )
              }
              rows={3}
              placeholder="Write a comment… type @ to mention"
              spellCheck={false}
              className="w-full resize-y rounded-xl bg-[var(--color-surface)] px-3 py-2 text-[13.5px] leading-relaxed text-[var(--color-fg)] outline-none [border:1px_solid_var(--color-border)] placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--color-accent)_45%,transparent)]"
            />

            <MentionSuggestions
              open={open}
              query={query}
              items={PEOPLE}
              groups={GROUPS}
              loading={loading}
              inputRef={inputRef}
              onOpenChange={setOpen}
              onSelect={insert}
              label="Mention a teammate or team"
            />
          </div>

          <p className="mt-2 text-[11.5px] text-[var(--color-muted)]">
            Type <kbd className="rounded bg-[var(--color-surface)] px-1 [border:1px_solid_var(--color-border)]">@</kbd> to
            open suggestions · <kbd className="rounded bg-[var(--color-surface)] px-1 [border:1px_solid_var(--color-border)]">↑</kbd>
            <kbd className="rounded bg-[var(--color-surface)] px-1 [border:1px_solid_var(--color-border)]">↓</kbd> to move ·{" "}
            <kbd className="rounded bg-[var(--color-surface)] px-1 [border:1px_solid_var(--color-border)]">↵</kbd> to insert ·{" "}
            <kbd className="rounded bg-[var(--color-surface)] px-1 [border:1px_solid_var(--color-border)]">esc</kbd> to close
          </p>
        </div>
      </div>

      {/* working controls */}
      <ControlBar>
        <ControlButton
          onClick={() => {
            const el = inputRef.current;
            if (!el) return;
            el.focus();
            const next = value.endsWith(" ") || value.length === 0 ? value + "@" : value + " @";
            setValue(next);
            requestAnimationFrame(() => {
              el.setSelectionRange(next.length, next.length);
              syncTrigger(next, next.length);
            });
          }}
        >
          Insert @ and open
        </ControlButton>
        <ControlButton onClick={reset}>Reset</ControlButton>
        <ControlHint>The app owns the text; the popup owns selection</ControlHint>
      </ControlBar>
    </div>
  );
}

export default MentionSuggestionsPreview;
