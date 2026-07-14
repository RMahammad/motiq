"use client";

import * as React from "react";

import {
  SwipeActionRow,
  SwipeActionGroup,
  type SwipeAction,
  type SwipeOpenState,
} from "@/registry/mobile/swipe-action-row";

/* ------------------------------------------------------------------ icons */

function Icon({ d, fill }: { d: string; fill?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
const ICONS = {
  archive: <Icon d="M4 8h16M5 8l1 11a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-11M4 8 6 4h12l2 4M10 12h4" />,
  unread: <Icon d="M4 6h16v12H4zM4 7l8 6 8-6" />,
  complete: <Icon d="M5 13l4 4L19 7" />,
  snooze: <Icon d="M12 8v4l2.5 2.5M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />,
  trash: <Icon d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
};

/* --------------------------------------------------------------- fixtures */

interface Mail {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  hue: number;
}

/* Deterministic seed — no Date.now()/random, so SSR and client agree. */
const SEED: Mail[] = [
  { id: "m1", from: "Ada Lovelace", subject: "Q3 launch plan — final review", preview: "Pushed the deck, need your sign-off before Friday.", time: "9:24", unread: true, hue: 255 },
  { id: "m2", from: "Deploys", subject: "Production deploy succeeded", preview: "web-app · 42s · 3 services updated.", time: "8:51", unread: true, hue: 150 },
  { id: "m3", from: "Kit Marlowe", subject: "Re: onboarding copy", preview: "Two tiny tweaks and I think we ship it.", time: "8:07", unread: false, hue: 320 },
  { id: "m4", from: "Billing", subject: "Invoice #1042 paid", preview: "$480.00 · Visa ending 6411 · receipt attached.", time: "Tue", unread: false, hue: 40 },
];

const LEFT: SwipeAction[] = [{ id: "archive", label: "Archive", tone: "warning", icon: ICONS.archive }];
const RIGHT: SwipeAction[] = [
  { id: "unread", label: "Unread", tone: "info", icon: ICONS.unread },
  { id: "snooze", label: "Snooze", tone: "neutral", icon: ICONS.snooze },
  { id: "complete", label: "Done", tone: "success", icon: ICONS.complete },
  { id: "delete", label: "Delete", tone: "error", destructive: true, confirmLabel: "Delete message", icon: ICONS.trash },
];

/* ----------------------------------------------------------------- control */

const control =
  "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-fg)] outline-none transition-colors hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-45";

export function SwipeActionRowPreview() {
  const [mail, setMail] = React.useState<Mail[]>(() => SEED);
  const [undo, setUndo] = React.useState<{ item: Mail; index: number; verb: string } | null>(null);
  const [fullSwipe, setFullSwipe] = React.useState(false);
  const [topOpen, setTopOpen] = React.useState<SwipeOpenState>(null);
  const [status, setStatus] = React.useState("4 messages · drag a row, open the ⋯ menu, or Tab to an action");
  const listRef = React.useRef<HTMLUListElement | null>(null);

  const removeMail = React.useCallback((id: string, verb: string) => {
    setMail((prev) => {
      const index = prev.findIndex((m) => m.id === id);
      if (index === -1) return prev;
      setUndo({ item: prev[index], index, verb });
      setStatus(`${verb} “${prev[index].subject}”`);
      return prev.filter((m) => m.id !== id);
    });
    setTopOpen(null);
    // Move focus somewhere stable so it isn't lost with the removed row.
    requestAnimationFrame(() => listRef.current?.focus());
  }, []);

  const handleAction = React.useCallback(
    (id: string, mailId: string) => {
      if (id === "unread") {
        setMail((prev) => prev.map((m) => (m.id === mailId ? { ...m, unread: !m.unread } : m)));
        setStatus("Marked as unread");
        setTopOpen(null);
        return;
      }
      const verb = id === "archive" ? "Archived" : id === "snooze" ? "Snoozed" : id === "complete" ? "Completed" : "Deleted";
      removeMail(mailId, verb);
    },
    [removeMail],
  );

  const restore = React.useCallback(() => {
    if (!undo) return;
    setMail((prev) => {
      const next = [...prev];
      next.splice(Math.min(undo.index, next.length), 0, undo.item);
      return next;
    });
    setStatus(`Restored “${undo.item.subject}”`);
    setUndo(null);
  }, [undo]);

  const reset = () => {
    setMail(SEED);
    setUndo(null);
    setTopOpen(null);
    setFullSwipe(false);
    setStatus("Reset · 4 messages");
  };

  const topId = mail[0]?.id;

  return (
    <div className="flex w-full max-w-[520px] flex-col items-center gap-5">
      {/* phone frame */}
      <div className="w-full max-w-[380px] overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2 shadow-[var(--shadow-md,0_10px_40px_rgba(0,0,0,0.18))]">
        <div className="overflow-hidden rounded-[1.5rem] bg-[var(--color-bg)]">
          {/* header */}
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <div>
              <p className="text-[15px] font-semibold text-[var(--color-fg)]">Inbox</p>
              <p className="text-[11.5px] text-[var(--color-muted)]">
                {mail.filter((m) => m.unread).length} unread · {mail.length} total
              </p>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]">
              <Icon d="M4 6h16v12H4zM4 7l8 6 8-6" />
            </span>
          </div>

          {/* the list */}
          <ul
            ref={listRef}
            tabIndex={-1}
            aria-label="Messages"
            className="flex flex-col gap-1.5 p-2 outline-none min-h-[220px]"
          >
            <SwipeActionGroup>
              {mail.length === 0 ? (
                <li className="grid place-items-center py-14 text-center text-[13px] text-[var(--color-muted)]">
                  Inbox zero. Use Reset to bring the messages back.
                </li>
              ) : (
                mail.map((m) => {
                  const isTop = m.id === topId;
                  return (
                    <li key={m.id}>
                      <SwipeActionRow
                        label={`${m.from}: ${m.subject}`}
                        leftActions={LEFT}
                        rightActions={RIGHT}
                        fullSwipe={fullSwipe}
                        open={isTop ? topOpen : undefined}
                        onOpenChange={isTop ? setTopOpen : undefined}
                        onAction={(id) => handleAction(id, m.id)}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-white"
                            style={{ background: `linear-gradient(135deg, hsl(${m.hue} 68% 56%), hsl(${m.hue + 28} 66% 46%))` }}
                            aria-hidden
                          >
                            {m.from.slice(0, 1)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              {m.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" aria-hidden />}
                              <span className={`truncate text-[13.5px] ${m.unread ? "font-semibold text-[var(--color-fg)]" : "font-medium text-[var(--color-fg)]"}`}>
                                {m.from}
                              </span>
                              <span className="ml-auto shrink-0 text-[11px] text-[var(--color-muted)]">{m.time}</span>
                            </span>
                            <span className="mt-0.5 block truncate text-[12.5px] font-medium text-[var(--color-fg)]">{m.subject}</span>
                            <span className="mt-0.5 block truncate text-[12px] text-[var(--color-muted)]">{m.preview}</span>
                          </span>
                        </div>
                      </SwipeActionRow>
                    </li>
                  );
                })
              )}
            </SwipeActionGroup>
          </ul>
        </div>
      </div>

      {/* working controls — operate on the top row so mouse users see it too */}
      <div className="flex w-full max-w-[420px] flex-wrap items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <button type="button" className={control} onClick={() => setTopOpen("left")} disabled={!topId}>
          Open left
        </button>
        <button type="button" className={control} onClick={() => setTopOpen("right")} disabled={!topId}>
          Open right
        </button>
        <button type="button" className={control} onClick={() => topId && handleAction("complete", topId)} disabled={!topId}>
          Complete top
        </button>
        <button type="button" className={control} data-on={fullSwipe} onClick={() => setFullSwipe((v) => !v)}>
          Full-swipe: {fullSwipe ? "on" : "off"}
        </button>
        <button type="button" className={control} onClick={reset}>
          Reset
        </button>
        {undo && (
          <button
            type="button"
            onClick={restore}
            className="rounded-lg border border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--color-accent)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            Undo {undo.verb.toLowerCase()}
          </button>
        )}
        <span className="ml-auto max-w-full basis-full truncate pt-1 text-[12px] text-[var(--color-muted)]" role="status" aria-live="polite">
          {status}
        </span>
      </div>
    </div>
  );
}

export default SwipeActionRowPreview;
