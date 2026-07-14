"use client";

import Link from "next/link";

import type { Cta } from "../../lib/commerce";
import { track, type AnalyticsEvent } from "../../lib/analytics";

/** A config-driven access CTA. Emits its analytics event on click and never
 *  renders a dead button — the href/label/note are resolved from launch config
 *  in lib/commerce (see packPrimaryCta / proComponentCta / completeCatalogCta). */
export function AccessCta({ cta, variant = "primary" }: { cta: Cta; variant?: "primary" | "secondary" }) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-[14px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]";
  const style =
    variant === "primary"
      ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast,#fff)] hover:opacity-90"
      : "border border-[var(--color-border)] text-[var(--color-fg)] hover:bg-[var(--color-bg-secondary)]";
  return (
    <div className="flex flex-col gap-1.5">
      <Link
        href={cta.href ?? "#"}
        className={`${base} ${style}`}
        onClick={() => track(cta.event as AnalyticsEvent, { kind: cta.kind })}
      >
        {cta.label}
      </Link>
      {cta.note ? <span className="text-[12.5px] text-[var(--color-muted)]">{cta.note}</span> : null}
    </div>
  );
}
