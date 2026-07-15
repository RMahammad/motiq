import Link from "next/link";

import type { CatalogItem } from "../../lib/catalog";
import { accessLabel, itemInstall, kindOf, resolvePresentation } from "../../lib/catalog";
import { CatalogStage } from "./catalog-stage";
import { CatalogPreview } from "../_previews";
import { LazyPreview } from "./lazy-preview";
import { CopyButton } from "./code-block";

export function AccessBadge({ access }: { access: CatalogItem["access"] }) {
  const pro = access === "pro";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
        pro
          ? "bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]"
          : "bg-[var(--color-bg-secondary)] text-[var(--color-muted)]"
      }`}
    >
      {accessLabel[access]}
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
          <AccessBadge access={item.access} />
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[var(--color-muted)]">
          {item.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="text-[12px] text-[var(--color-muted)]">{categoryLabel(item.category)}</span>
          <div className="flex items-center gap-2">
            {item.access === "free" ? (
              <CopyButton
                text={itemInstall(item)}
                label="Install"
                trackEvent="free_install_copied"
                trackProps={{ item: item.id }}
              />
            ) : (
              <span
                className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-[12px] text-[var(--color-muted)]"
                title="Delivered with pack or complete-catalog access"
              >
                🔒 Pro
              </span>
            )}
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
