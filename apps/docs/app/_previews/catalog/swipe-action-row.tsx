"use client";

import * as React from "react";

import {
  SwipeActionRow,
  SwipeActionGroup,
  type SwipeAction,
} from "@/registry/mobile/swipe-action-row";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL SwipeActionRow in one
 * representative "mobile inbox" state — a small group of message rows with their
 * inherent swipe + overflow-menu affordances. No demo control panel, no
 * open-left/full-swipe toggles. Trimmed to 3 messages. Deterministic.
 */

function Icon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const LEFT: SwipeAction[] = [{ id: "archive", label: "Archive", tone: "warning", icon: <Icon d="M4 8h16M5 8l1 11a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-11M4 8 6 4h12l2 4M10 12h4" /> }];
const RIGHT: SwipeAction[] = [
  { id: "snooze", label: "Snooze", tone: "neutral", icon: <Icon d="M12 8v4l2.5 2.5M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" /> },
  { id: "delete", label: "Delete", tone: "error", destructive: true, confirmLabel: "Delete message", icon: <Icon d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /> },
];

interface Mail {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  hue: number;
}

const MAIL: Mail[] = [
  { id: "m1", from: "Ada Lovelace", subject: "Q3 launch plan — final review", preview: "Pushed the deck, need your sign-off before Friday.", time: "9:24", unread: true, hue: 255 },
  { id: "m2", from: "Deploys", subject: "Production deploy succeeded", preview: "web-app · 42s · 3 services updated.", time: "8:51", unread: true, hue: 150 },
  { id: "m3", from: "Kit Marlowe", subject: "Re: onboarding copy", preview: "Two tiny tweaks and I think we ship it.", time: "8:07", unread: false, hue: 320 },
  { id: "m4", from: "Iris Wren", subject: "Design sync moved to 3pm", preview: "Grabbed the corner room so we can sketch.", time: "7:42", unread: false, hue: 24 },
  { id: "m5", from: "Billing", subject: "Receipt · Pro plan", preview: "Your invoice for June is ready to view.", time: "Tue", unread: false, hue: 200 },
  { id: "m6", from: "Noor Haddad", subject: "Notes from the customer call", preview: "Two feature asks, both small. Recap inside.", time: "Mon", unread: false, hue: 285 },
];

export function SwipeActionRowCatalogPreview() {
  return (
    <div className="flex h-full w-full flex-col bg-[var(--color-bg)]">
      <div className="flex shrink-0 items-center justify-between px-4 pb-2.5 pt-1.5">
        <div>
          <p className="text-[19px] font-bold leading-tight tracking-tight text-[var(--color-fg)]">Inbox</p>
          <p className="text-[11.5px] font-medium text-[var(--color-muted)]">2 unread</p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[color-mix(in_oklab,var(--color-accent)_15%,transparent)] text-[var(--color-accent)]">
          <Icon d="M12 5v14M5 12h14" />
        </span>
      </div>

      <ul aria-label="Messages" className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden px-2 pb-2">
        <SwipeActionGroup>
          {MAIL.map((m) => (
            <li key={m.id}>
              <SwipeActionRow label={`${m.from}: ${m.subject}`} leftActions={LEFT} rightActions={RIGHT}>
                <div className="flex items-start gap-3 py-0.5">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-semibold text-white shadow-[var(--shadow-sm)]"
                    style={{ background: `linear-gradient(140deg, hsl(${m.hue} 70% 58%), hsl(${m.hue + 30} 66% 47%))` }}
                    aria-hidden
                  >
                    {m.from.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      {m.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" aria-hidden />}
                      <span className={`truncate text-[14px] text-[var(--color-fg)] ${m.unread ? "font-bold" : "font-semibold"}`}>{m.from}</span>
                      <span className="ml-auto shrink-0 text-[11px] font-medium text-[var(--color-muted)]">{m.time}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[12.5px] font-medium text-[var(--color-fg)]">{m.subject}</span>
                    <span className="mt-0.5 block truncate text-[12px] leading-snug text-[var(--color-muted)]">{m.preview}</span>
                  </span>
                </div>
              </SwipeActionRow>
            </li>
          ))}
        </SwipeActionGroup>
      </ul>
    </div>
  );
}

export default SwipeActionRowCatalogPreview;
