"use client";

import * as React from "react";

import { track } from "../../lib/analytics";
import { formatStars, github } from "../../lib/github";
import { markStarred } from "../../lib/star-nudge";

/**
 * "Star on GitHub" surfaces. One component family drives the nav pill, the
 * homepage and page-level CTAs, the footer link, and the sidebar card, so the
 * ask reads as one consistent thing rather than five improvised buttons.
 *
 * The live star count is decoration: every variant renders and works without
 * it, and the count pill simply stays absent when the API is unreachable.
 */

/* -------------------------------------------------------------------------- *
 * Star count — fetched once per page load, shared by every button on the page,
 * and cached in sessionStorage so client-side navigation does not re-request.
 * -------------------------------------------------------------------------- */

const CACHE_KEY = "motiq:stars";
const CACHE_TTL_MS = 3_600_000;

let inflight: Promise<number | null> | null = null;

function readCache(): number | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { stars?: unknown; at?: unknown };
    if (typeof parsed.stars !== "number" || typeof parsed.at !== "number") return null;
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null;
    return parsed.stars;
  } catch {
    return null;
  }
}

function writeCache(stars: number): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ stars, at: Date.now() }));
  } catch {
    // Storage denied — the count just re-fetches on the next page load.
  }
}

function loadStarCount(): Promise<number | null> {
  if (inflight) return inflight;
  const cached = readCache();
  if (cached !== null) {
    inflight = Promise.resolve(cached);
    return inflight;
  }
  inflight = fetch("/api/github-stars")
    .then((res) => (res.ok ? (res.json() as Promise<{ stars: number | null }>) : { stars: null }))
    .then((body) => {
      const stars = typeof body.stars === "number" ? body.stars : null;
      if (stars !== null) writeCache(stars);
      return stars;
    })
    .catch(() => null);
  return inflight;
}

/** Live star count, or null while loading and whenever GitHub is unreachable. */
export function useStarCount(): number | null {
  const [count, setCount] = React.useState<number | null>(null);
  React.useEffect(() => {
    let active = true;
    loadStarCount().then((stars) => {
      if (active) setCount(stars);
    });
    return () => {
      active = false;
    };
  }, []);
  return count;
}

/* -------------------------------------------------------------------------- *
 * Icons
 * -------------------------------------------------------------------------- */

export function GithubMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden className="shrink-0">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export function StarIcon({ size = 14, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      <path d="M12 2.6l2.85 6.16 6.65.83-4.9 4.63 1.28 6.78L12 17.7l-5.88 3.3 1.28-6.78L2.5 9.59l6.65-.83L12 2.6z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- *
 * Buttons
 * -------------------------------------------------------------------------- */

/** Where the click came from — kept coarse so analytics stays non-identifying. */
export type StarSource = "nav" | "nav-mobile" | "hero" | "footer" | "rail" | "page" | "prompt";

export function useStarClick(source: StarSource) {
  return React.useCallback(() => {
    // Opening the repo is the closest observable proxy for starring; treat it as
    // done so the prompt stops asking someone who already went to do it.
    markStarred();
    track("github_star_clicked", { source });
  }, [source]);
}

type ButtonProps = {
  source: StarSource;
  /** `nav` is the compact header pill; `solid` and `outline` are full CTAs. */
  variant?: "nav" | "solid" | "outline";
  /** Stretch to the container width (mobile drawer, stacked CTA rows). */
  block?: boolean;
  label?: string;
  className?: string;
};

const BASE =
  "group inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]";

const VARIANT: Record<NonNullable<ButtonProps["variant"]>, string> = {
  nav: "h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[13px] text-[var(--color-fg)] hover:border-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-border))] hover:bg-[var(--color-bg-secondary)]",
  solid:
    "h-11 rounded-xl bg-[var(--color-accent)] px-6 text-[15px] text-[var(--color-accent-fg)] shadow-[var(--shadow-sm)] hover:bg-[var(--color-accent-hover)]",
  outline:
    "h-11 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] px-6 text-[15px] text-[var(--color-fg)] backdrop-blur hover:border-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-border))] hover:bg-[var(--color-bg-secondary)]",
};

/**
 * The primary star CTA. Renders the live count as a separate segment when it is
 * available — a visible count is social proof, and an absent one is invisible.
 */
export function StarButton({ source, variant = "outline", block = false, label = "Star on GitHub", className }: ButtonProps) {
  const count = useStarCount();
  const formatted = formatStars(count);
  const onClick = useStarClick(source);
  const isNav = variant === "nav";

  return (
    <a
      href={github.starUrl}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      aria-label={formatted ? `${label} - ${count} stars` : label}
      className={`${BASE} ${VARIANT[variant]} ${block ? "w-full" : ""} ${className ?? ""}`}
    >
      <GithubMark size={isNav ? 15 : 17} />
      <span>{isNav ? "Star" : label}</span>
      {formatted ? (
        <span
          aria-hidden
          className={
            isNav
              ? "ml-0.5 rounded-md bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-[12px] font-semibold tabular-nums text-[var(--color-fg-secondary)]"
              : "ml-0.5 rounded-md bg-[color-mix(in_oklab,var(--color-fg)_10%,transparent)] px-2 py-0.5 text-[13px] font-semibold tabular-nums"
          }
        >
          {formatted}
        </span>
      ) : null}
      <span
        aria-hidden
        className={`transition-transform duration-200 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
          variant === "solid" ? "" : "text-[var(--color-warning)]"
        }`}
      >
        <StarIcon size={isNav ? 13 : 15} filled />
      </span>
    </a>
  );
}

/**
 * Sidebar / page card. Longer form than the button: states plainly why a star
 * matters for a free project, which converts better than a bare "star us".
 */
export function StarCta({
  source = "rail",
  compact = false,
}: {
  source?: StarSource;
  compact?: boolean;
}) {
  const count = useStarCount();
  const formatted = formatStars(count);
  const onClick = useStarClick(source);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3.5">
      <div className="flex items-center gap-2">
        <GithubMark size={15} />
        <p className="text-[12.5px] font-semibold text-[var(--color-fg)]">
          {compact ? "Star Motiq on GitHub" : "Found this useful?"}
        </p>
      </div>
      <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-muted)]">
        {compact
          ? "A star takes a second and helps other developers find the catalog."
          : "Motiq is free and MIT-licensed. A star costs you a second and is how other developers find it."}
      </p>
      <a
        href={github.starUrl}
        target="_blank"
        rel="noreferrer"
        onClick={onClick}
        className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[12.5px] font-semibold text-[var(--color-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-border))] hover:bg-[var(--color-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      >
        <StarIcon size={13} filled />
        Star on GitHub
        {formatted ? (
          <span aria-hidden className="rounded bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-[11.5px] tabular-nums text-[var(--color-fg-secondary)]">
            {formatted}
          </span>
        ) : null}
      </a>
    </div>
  );
}

/** Footer link: repo slug plus the count, no button chrome. */
export function FooterStarLink() {
  const count = useStarCount();
  const formatted = formatStars(count);
  const onClick = useStarClick("footer");

  return (
    <a
      href={github.starUrl}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 hover:text-[var(--color-fg)]"
    >
      <GithubMark size={14} />
      Star on GitHub
      {formatted ? (
        <span aria-hidden className="rounded bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-[11.5px] font-semibold tabular-nums text-[var(--color-fg-secondary)]">
          {formatted}
        </span>
      ) : null}
    </a>
  );
}
