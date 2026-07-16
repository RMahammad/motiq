"use client";

import * as React from "react";

import {
  MentionSuggestions,
  type MentionUser,
  type MentionGroup,
} from "@/registry/collaboration/mention-suggestions";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL MentionSuggestions popup
 * in its open, populated state above a static composer field — 3 people + 2 teams,
 * with mixed presence. No demo control panel (Insert @ / Reset). `open` is fixed
 * true so the card shows the suggestion list without needing interaction.
 */

/* Clearly fictional demo — no real people, teams, or accounts. */
const PEOPLE: MentionUser[] = [
  { id: "mira", name: "Mira Delacroix", handle: "@mira", role: "Product", presence: "online", group: "people" },
  { id: "devon", name: "Devon Achebe", handle: "@devon", role: "Design", presence: "online", group: "people" },
  { id: "kai", name: "Kai Ferreira", handle: "@kai", role: "Engineering", presence: "away", group: "people" },
  { id: "design", name: "Design Team", handle: "@design", role: "6 people", group: "teams" },
  { id: "eng", name: "Engineering Team", handle: "@eng", role: "11 people", group: "teams" },
];

const GROUPS: MentionGroup[] = [
  { id: "people", label: "People" },
  { id: "teams", label: "Teams" },
];

export function MentionSuggestionsCatalogPreview() {
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  return (
    <div className="mx-auto w-full max-w-[460px]">
      {/* `container` keeps the popup INSIDE this card (absolute, not a viewport-
          fixed overlay) so it never floats over the site nav or flickers on scroll. */}
      <div ref={containerRef} className="relative min-h-[360px]">
        <label htmlFor="catalog-mention-composer" className="sr-only">
          Write a comment — type @ to mention someone
        </label>
        <textarea
          id="catalog-mention-composer"
          ref={inputRef}
          defaultValue="Nice work on the launch review — @"
          rows={3}
          readOnly
          spellCheck={false}
          className="w-full resize-none rounded-xl bg-[var(--color-surface)] px-3 py-2 text-[13.5px] leading-relaxed text-[var(--color-fg)] outline-none [border:1px_solid_var(--color-border)]"
        />
        <MentionSuggestions
          open
          query=""
          items={PEOPLE}
          groups={GROUPS}
          inputRef={inputRef}
          container={containerRef}
          onSelect={() => {}}
          label="Mention a teammate or team"
        />
      </div>
    </div>
  );
}

export default MentionSuggestionsCatalogPreview;
