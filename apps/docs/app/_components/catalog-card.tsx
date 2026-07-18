import Link from "next/link";

import type { CatalogItem } from "../../lib/catalog";
import { kindOf, resolvePresentation } from "../../lib/catalog";
import { namespacedInstall } from "../../lib/product";
import { CatalogStage } from "./catalog-stage";
import { CatalogPreview } from "../_previews";
import { LazyPreview } from "./lazy-preview";
import { CopyButton } from "./code-block";

/** Highlights a standout design. The whole catalog is free, so there is no
 *  tier badge — only featured items carry a marker. */
export function FeaturedBadge({ featured }: { featured: boolean }) {
  if (!featured) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-accent)]">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
      </svg>
      Featured
    </span>
  );
}

export function KindBadge({ item }: { item: CatalogItem }) {
  const kind = kindOf(item);
  if (kind === "component") return null;
  return (
    <span className="rounded-full border border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_10%,transparent)] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
      {kind}
    </span>
  );
}

const categoryLabel = (c: string) =>
  c.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

export function CatalogCard({ item }: { item: CatalogItem }) {
  const p = resolvePresentation(item);
  const isEnvironment = kindOf(item) !== "component";

  const stage = (
    <CatalogStage
      size={p.previewSize}
      family={p.stageFamily}
      ambient={p.previewMode === "ambient"}
      mobileFrame={p.previewSize === "mobile"}
    >
      <CatalogPreview id={item.id} />
    </CatalogStage>
  );

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] transition-colors hover:border-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-border))]">
      {/* Heavy/full environments lazy-mount; small cards render immediately. */}
      {isEnvironment || p.previewSize === "full" || p.previewSize === "wide" ? (
        <LazyPreview label={`${item.name} preview`} minHeightClass="min-h-[380px]">
          {stage}
        </LazyPreview>
      ) : (
        stage
      )}

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <Link
            href={item.documentationPath}
            className="truncate text-[15px] font-semibold text-[var(--color-fg)] hover:text-[var(--color-accent)]"
          >
            {item.name}
          </Link>
          <KindBadge item={item} />
          <FeaturedBadge featured={item.featured} />
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[var(--color-muted)]">
          {item.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="text-[12px] text-[var(--color-muted)]">{categoryLabel(item.category)}</span>
          <div className="flex items-center gap-2">
            <CopyButton
              text={namespacedInstall(item.registryItem)}
              label="Install"
              trackEvent="free_install_copied"
              trackProps={{ item: item.id }}
            />
            <Link
              href={item.documentationPath}
              className="rounded-md px-2.5 py-1 text-[12px] font-medium text-[var(--color-accent)] hover:underline"
            >
              Open →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
