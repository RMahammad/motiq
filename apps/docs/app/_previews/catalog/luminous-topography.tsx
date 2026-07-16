"use client";

import * as React from "react";

import { LuminousTopography } from "@/registry/backgrounds/luminous-topography";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL LuminousTopography
 * FULL-BLEED — edge to edge in the ambient stage — with a concise hero overlaid
 * on its readable safe area. No demo controls or inner frame (the detail page
 * owns the interactive playground). Deterministic; sized to the ambient stage.
 */
export function LuminousTopographyCatalogPreview() {
  return (
    <LuminousTopography
      density={1.1}
      depth={3}
      focalPoint={[
        { x: 0.72, y: 0.34 },
        { x: 0.92, y: 0.72 },
      ]}
      safeArea={{ x: 0.03, y: 0.08, w: 0.52, h: 0.84 }}
      className="h-full w-full"
    >
      <div className="flex h-full flex-col justify-center px-7 py-6 sm:px-9">
        <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] px-3 py-1 text-[12px] text-[var(--color-muted)] backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> Ambient background
        </span>
        <h2 className="max-w-[15ch] text-[clamp(1.5rem,3.2vw,2.25rem)] font-semibold leading-[1.08] tracking-tight text-[var(--color-fg)]">
          Depth that reads like a map, not noise.
        </h2>
        <p className="mt-2.5 max-w-[38ch] text-[13.5px] leading-relaxed text-[var(--color-muted)]">
          Layered contours flow around your focal points and thin over a readable safe area — so headline, copy, and CTA stay crisp on top.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <span className="rounded-lg bg-[var(--color-accent)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-accent-fg,#fff)] shadow-[var(--shadow-sm)]">
            Get started
          </span>
          <span className="rounded-lg border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_65%,transparent)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-fg)] backdrop-blur">
            View docs
          </span>
        </div>
      </div>
    </LuminousTopography>
  );
}

export default LuminousTopographyCatalogPreview;
