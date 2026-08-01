"use client";

import * as React from "react";
import Link from "next/link";

import { VelocityMarquee, type VelocityMarqueeRow } from "@/registry/media/velocity-marquee";
import { useSceneImages, type SceneSpec } from "../_previews/media-scenes";

/* -------------------------------------------------------------------------
 * Lead card of the homepage catalog grid (docs/61 §catalog): the real Velocity
 * Marquee, two counter-rotating rails that drift at rest and surge with scroll
 * velocity — the most kinetic thing in the catalog, so it earns the widest slot.
 *
 * Artwork is generated in-canvas by the shared media-scenes helper (the same one
 * the component's own preview uses), so this ships no image assets and re-paints
 * itself when the theme flips. Shell mirrors CategoryCard — count chip, meta row
 * with a go-arrow — but stays a <div>: the marquee is pointer/keyboard reactive,
 * so it must not sit inside a card-wide link.
 * ---------------------------------------------------------------------- */

const SPECS: SceneSpec[] = [
  { kind: "land", t: 0.3, seed: 11 },
  { kind: "geo", v: 0 },
  { kind: "land", t: 0.62, seed: 23 },
  { kind: "orbs" },
  { kind: "city" },
  { kind: "land", t: 0.08, seed: 31 },
  { kind: "geo", v: 2 },
  { kind: "land", t: 0.9, seed: 41 },
];

const MEDIA: [string, string][] = [
  ["Basin at noon", "RAW"],
  ["Signal bloom", "GEN"],
  ["Ridgeline, dusk", "RAW"],
  ["Night transit", "GEN"],
  ["Glass district", "RAW"],
  ["First light", "RAW"],
  ["Static tide", "GEN"],
  ["Amber field", "RAW"],
];

const RAIL_TWO = [
  "Orbital Gallery",
  "Flow Warp Image",
  "Velocity Marquee",
  "Filmstrip Scrub",
  "Compare Reveal",
];

export function MediaGalleryHero({ count, href }: { count: number; href: string }) {
  const images = useSceneImages(SPECS, 336, 208);

  const rows = React.useMemo<VelocityMarqueeRow[]>(
    () => [
      {
        id: "captures",
        label: "Recent captures",
        direction: 1,
        items: MEDIA.map(([name, tag], i) => ({
          id: `capture-${i}`,
          node: (
            <div className="w-[168px] overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)]">
              {images[i] ? (
                <img src={images[i]} alt="" className="block h-[104px] w-full object-cover" />
              ) : (
                <div className="h-[104px] w-full bg-[var(--color-surface-2)]" />
              )}
              <div className="flex items-center justify-between gap-2 px-3 py-2 text-[11.5px] font-semibold leading-none text-[var(--color-fg-secondary)]">
                {name}
                <span className="font-mono text-[10px] leading-none text-[var(--color-muted)]">{tag}</span>
              </div>
            </div>
          ),
        })),
      },
      {
        id: "components",
        label: "Components in this category",
        direction: -1,
        items: RAIL_TWO.map((name, i) => ({
          id: `cat-${i}`,
          node: (
            <span className="flex h-[52px] items-center gap-2.5 whitespace-nowrap rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-[13.5px] font-semibold tracking-[-0.01em] text-[var(--color-muted)]">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--fam)]" />
              {name}
            </span>
          ),
        })),
      },
    ],
    [images],
  );

  return (
    <div
      className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:border-[color-mix(in_oklab,var(--fam)_45%,var(--color-border))] hover:shadow-[var(--shadow-md)]"
      style={{ ["--fam" as string]: "#22c7d9" }}
    >
      <div
        className="relative flex min-h-[300px] flex-1 items-center overflow-hidden border-b border-[var(--color-border)] py-8"
        style={{
          background:
            "radial-gradient(100% 100% at 50% 0%, color-mix(in oklab, var(--fam) 9%, transparent), transparent 72%), var(--color-bg-elevated)",
        }}
      >
        <VelocityMarquee rows={rows} baseSpeed={26} maxSkew={5} showMeter={false} className="w-full" aria-label="Media gallery marquee" />

        <span
          className="pointer-events-none absolute left-[15px] top-[15px] z-[3] inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tabular-nums tracking-[0.04em]"
          style={{
            color: "var(--fam)",
            background: "color-mix(in oklab, var(--fam) 13%, var(--color-surface))",
            borderColor: "color-mix(in oklab, var(--fam) 32%, transparent)",
          }}
        >
          {count} components
        </span>
      </div>

      <div className="flex items-center gap-3.5 px-[19px] py-[17px]">
        <span className="min-w-0">
          <h3 className="text-[16.5px] font-semibold tracking-[-0.012em] text-[var(--color-fg)]">
            <Link href={href} className="outline-none hover:text-[var(--color-accent-text)]">
              Media &amp; galleries
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-[13.5px] text-[var(--color-muted)]">
            Galleries, scrubbers, and image effects with real physics.
          </p>
        </span>
        <Link
          href={href}
          aria-label="Browse media and galleries"
          className="ml-auto grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-[var(--color-border-strong)] text-[var(--color-muted)] transition-all duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] group-hover:-rotate-45 group-hover:border-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-accent-fg)]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
