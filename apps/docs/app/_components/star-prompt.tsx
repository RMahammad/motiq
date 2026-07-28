"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { track } from "../../lib/analytics";
import { formatStars, github } from "../../lib/github";
import { markDismissed, onStarSignal, recordSignal } from "../../lib/star-nudge";
import { GithubMark, StarIcon, useStarClick, useStarCount } from "./github-star";

/**
 * The earned star ask. Mounted once in the root layout; whether it ever appears
 * is decided entirely by lib/star-nudge (never on arrival, once per session, and
 * never again after a star or a second decline).
 *
 * Dialog mechanics mirror the mobile nav drawer: portaled to <body> so no
 * backdrop-filter ancestor can capture `position: fixed`, focus trapped while
 * open, Esc closes, focus returns to whatever had it before.
 */

/** Delay after the trigger so the prompt does not collide with the copy confirmation. */
const OPEN_DELAY_MS = 1100;

export function StarPrompt() {
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const restoreFocusRef = React.useRef<HTMLElement | null>(null);
  const shownThisSession = React.useRef(false);
  const openTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = useStarCount();
  const formatted = formatStars(count);
  const onStarClick = useStarClick("prompt");

  React.useEffect(() => setMounted(true), []);

  const show = React.useCallback(() => {
    if (shownThisSession.current) return;
    shownThisSession.current = true;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    setOpen(true);
    track("star_prompt_shown");
  }, []);

  const handleSignal = React.useCallback(
    (kind: "install" | "browse") => {
      if (shownThisSession.current) return;
      if (!recordSignal(kind)) return;
      openTimer.current = setTimeout(show, OPEN_DELAY_MS);
    },
    [show],
  );

  // An install copy (or any other explicit intent event) qualifies on its own.
  React.useEffect(() => {
    const unsubscribe = onStarSignal(handleSignal);
    return () => {
      unsubscribe();
      if (openTimer.current) clearTimeout(openTimer.current);
    };
  }, [handleSignal]);

  // Page views accumulate until the browse threshold is met. Keyed on pathname
  // so client-side navigation counts — the layout never remounts between pages.
  React.useEffect(() => {
    handleSignal("browse");
  }, [pathname, handleSignal]);

  const close = React.useCallback(
    (reason: "dismiss" | "star") => {
      if (reason === "dismiss") {
        markDismissed();
        track("star_prompt_dismissed");
      }
      setOpen(false);
      restoreFocusRef.current?.focus?.();
    },
    [],
  );

  // Focus trap + Esc, active only while open.
  React.useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const selector = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const focusables = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(selector)).filter((node) => node.offsetParent !== null);
    focusables()[0]?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close("dismiss");
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const index = items.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        items[items.length - 1].focus();
      } else if (!event.shiftKey && index === items.length - 1) {
        event.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center" role="presentation">
      <div
        className="absolute inset-0 bg-[color-mix(in_oklab,var(--color-bg)_45%,black)]/70 backdrop-blur-sm"
        onClick={() => close("dismiss")}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="star-prompt-title"
        aria-describedby="star-prompt-body"
        className="star-prompt-panel relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--shadow-lg)]"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, color-mix(in oklab, var(--color-accent) 60%, transparent), transparent)" }}
        />
        <button
          type="button"
          aria-label="Close"
          onClick={() => close("dismiss")}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-warning)_18%,transparent)] text-[var(--color-warning)]">
          <StarIcon size={20} filled />
        </span>

        <h2 id="star-prompt-title" className="mt-3.5 text-[19px] font-semibold tracking-tight text-[var(--color-fg)]">
          Enjoying Motiq? Give it a star
        </h2>
        <p id="star-prompt-body" className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">
          Motiq is free, MIT-licensed, and built in the open. Stars are the only thing that puts it in front of
          the next developer looking for this — it takes a second and costs nothing.
        </p>

        {github.slug ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-[var(--color-muted)]">
            <GithubMark size={13} />
            <span className="font-mono">{github.slug}</span>
            {formatted ? (
              <span className="rounded bg-[var(--color-bg-secondary)] px-1.5 py-0.5 font-semibold tabular-nums text-[var(--color-fg-secondary)]">
                {formatted} stars
              </span>
            ) : null}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <a
            href={github.starUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              onStarClick();
              close("star");
            }}
            className="group inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 text-[14.5px] font-semibold text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-raised)]"
          >
            <GithubMark size={16} />
            Star on GitHub
          </a>
          <button
            type="button"
            onClick={() => close("dismiss")}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--color-border)] px-5 text-[14.5px] font-medium text-[var(--color-fg-secondary)] transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            Maybe later
          </button>
        </div>

        <p className="mt-3.5 text-[12px] text-[var(--color-muted)]">
          Not into stars?{" "}
          <Link href="/sponsor" onClick={() => close("dismiss")} className="underline underline-offset-2 hover:text-[var(--color-fg)]">
            Sponsoring
          </Link>{" "}
          helps just as much.
        </p>
      </div>
    </div>,
    document.body,
  );
}
