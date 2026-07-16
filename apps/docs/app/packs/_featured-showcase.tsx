"use client";

import * as React from "react";
import Link from "next/link";

import { Preview } from "../_previews";
import { InstallCommand } from "../_components/code-block";

/** Serializable summary the server page passes for each pack tab. */
export interface FeaturedPack {
  slug: string;
  name: string;
  blockSlug: string;
  blockName: string;
  tagline: string;
  install: string;
  detailHref: string;
  components: { slug: string; name: string; access: "free" | "pro" }[];
  states: string[];
  domain: string;
}

const TABS: { slug: string; label: string }[] = [
  { slug: "ai-interface", label: "AI" },
  { slug: "developer-tools", label: "Developer Tools" },
  { slug: "collaboration", label: "Collaboration" },
  { slug: "data-motion", label: "Data Motion" },
];

export function FeaturedShowcase({ packs }: { packs: FeaturedPack[] }) {
  const [active, setActive] = React.useState(TABS[0].slug);
  const bySlug = React.useMemo(() => new Map(packs.map((p) => [p.slug, p])), [packs]);
  const pack = bySlug.get(active) ?? packs[0];
  const tablist = TABS.filter((t) => bySlug.has(t.slug));

  return (
    <div>
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Featured pack"
        className="mb-6 inline-flex flex-wrap gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-1"
      >
        {tablist.map((t) => {
          const selected = t.slug === active;
          return (
            <button
              key={t.slug}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setActive(t.slug)}
              className={`rounded-lg px-3.5 py-2 text-[13.5px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${
                selected
                  ? "bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-fg)]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Browser-style stage */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
          <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5">
            <div className="flex gap-1.5" aria-hidden>
              <span className="h-3 w-3 rounded-full bg-[color-mix(in_oklab,var(--color-error)_70%,var(--color-border))]" />
              <span className="h-3 w-3 rounded-full bg-[color-mix(in_oklab,var(--color-warning)_70%,var(--color-border))]" />
              <span className="h-3 w-3 rounded-full bg-[color-mix(in_oklab,var(--color-success)_70%,var(--color-border))]" />
            </div>
            <div className="mx-auto flex max-w-[60%] items-center gap-1.5 truncate rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[12px] text-[var(--color-muted)]">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
                <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="truncate">{pack.domain}</span>
            </div>
            <span className="shrink-0 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-muted)]">
              Live demo
            </span>
          </div>

          {/* Bounded stage: one realistic workflow state, no page-sized scroll. */}
          <div className="relative bg-[var(--color-stage-bg)]">
            <div className="max-h-[600px] min-w-0 overflow-hidden px-4 py-6 sm:px-6">
              <div className="min-w-0 overflow-x-hidden">
                <Preview id={pack.blockSlug} />
              </div>
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--color-stage-bg)] to-transparent"
            />
          </div>
        </div>

        {/* Meta rail */}
        <aside className="flex min-w-0 flex-col gap-5">
          <div>
            <h3 className="text-[19px] font-semibold tracking-tight text-[var(--color-fg)]">{pack.blockName}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--color-muted)]">{pack.tagline}</p>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Included components
            </p>
            <ul className="flex flex-col gap-1">
              {pack.components.map((c) => (
                <li key={c.slug} className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="text-[var(--color-fg)]">{c.name}</span>
                  <span
                    className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
                      c.access === "free"
                        ? "border-[var(--color-border)] text-[var(--color-muted)]"
                        : "border-[color-mix(in_oklab,var(--color-accent)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] text-[var(--color-accent-text)]"
                    }`}
                  >
                    {c.access === "free" ? "Free" : "Pro"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Workflow states
            </p>
            <div className="flex flex-wrap gap-1.5">
              {pack.states.map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[11.5px] text-[var(--color-muted)]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <InstallCommand command={pack.install} label="Install this pack" />
          </div>

          <Link
            href={pack.detailHref}
            className="inline-flex w-fit items-center gap-1.5 text-[13.5px] font-medium text-[var(--color-accent-text)] hover:underline"
          >
            View details
            <span aria-hidden>→</span>
          </Link>
        </aside>
      </div>
    </div>
  );
}
