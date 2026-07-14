import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { bySlug, catalog, itemInstall } from "../../../lib/catalog";
import { product } from "../../../lib/product";
import { proComponentCta } from "../../../lib/commerce";
import { readAnyRegistry, canRenderFullSource, sourcePreview } from "../../../lib/registry-source";
import { docsContent } from "../../../lib/docs-content";
import { PreviewStage } from "../../_components/preview-stage";
import { Preview } from "../../_previews";
import { CodeBlock, InstallCommand } from "../../_components/code-block";
import { AccessBadge } from "../../_components/catalog-card";
import { AccessCta } from "../../_components/access-cta";

export function generateStaticParams() {
  return catalog.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = bySlug.get(slug);
  if (!item) return {};
  return { title: `${item.name} — ${product.productName}`, description: item.description };
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-[var(--color-border)] py-8">
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-[var(--color-fg)]">{title}</h2>
      {children}
    </section>
  );
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = bySlug.get(slug);
  if (!item) notFound();

  const doc = docsContent[slug];
  const reg = readAnyRegistry(item.registryItem);
  const showFullSource = canRenderFullSource(item.access);
  const source = showFullSource ? reg?.files?.[0]?.content ?? "" : "";
  const target = reg?.files?.[0]?.target;
  const preview = sourcePreview(reg, item.dependencies, item.registryDependencies);
  const isGatedPro = item.access === "pro";

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <nav className="mb-4 text-[13px] text-[var(--color-muted)]">
        <Link href="/components" className="hover:text-[var(--color-fg)]">
          Components
        </Link>{" "}
        / <span className="capitalize">{item.category.replace("-", " ")}</span> / <span>{item.name}</span>
      </nav>

      <header className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          {item.name}
        </h1>
        <AccessBadge access={item.access} />
      </header>
      <p className="mb-8 max-w-2xl text-[15px] leading-relaxed text-[var(--color-muted)]">{item.description}</p>

      {/* Preview */}
      <PreviewStage stage={item.stage}>
        <Preview id={item.id} />
      </PreviewStage>

      {/* Installation */}
      <Section id="installation" title="Installation">
        <p className="mb-3 text-[14px] text-[var(--color-muted)]">Install the editable source with the shadcn CLI:</p>
        <InstallCommand command={itemInstall(item)} />
        {product.namespaceIsPreview ? (
          <p className="mt-2 text-[12px] text-[var(--color-muted)]">
            The registry namespace/URL are temporary preview values during development.
          </p>
        ) : null}
        {target ? (
          <p className="mt-3 text-[13px] text-[var(--color-muted)]">
            Installs to <code className="rounded bg-[var(--color-code-bg)] px-1.5 py-0.5 font-mono">{target}</code>.
          </p>
        ) : null}
      </Section>

      {/* Usage */}
      {doc ? (
        <Section id="usage" title="Usage">
          <CodeBlock code={doc.usage} />
        </Section>
      ) : null}

      {/* Source code — full for Free; source-preview policy surface for gated Pro */}
      {source ? (
        <Section id="code" title="Source">
          <CodeBlock code={source} />
        </Section>
      ) : isGatedPro ? (
        <Section id="code" title="Source">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-[var(--color-border)] px-2 py-0.5 text-[12px] font-medium text-[var(--color-fg)]">
                {product.premiumTierLabel} source
              </span>
              <span className="text-[13px] text-[var(--color-muted)]">
                Live preview, API, dependencies, and installed files are shown. The full editable
                implementation is delivered on access.
              </span>
            </div>
            <p className="mb-2 text-[13px] font-medium text-[var(--color-fg)]">Files you install</p>
            <ul className="mb-4 space-y-1.5">
              {preview.files.map((f) => (
                <li key={f.path} className="font-mono text-[12.5px] text-[var(--color-muted)]">
                  → <span className="text-[var(--color-fg)]">{f.target ?? f.path}</span>
                </li>
              ))}
            </ul>
            <AccessCta cta={proComponentCta(item.slug)} />
          </div>
        </Section>
      ) : null}

      {/* API */}
      {doc ? (
        <Section id="api" title="API reference">
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-left text-[13.5px]">
              <thead className="bg-[var(--color-bg-secondary)] text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Prop</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Default</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {doc.api.map((row) => (
                  <tr key={row.prop} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-2 font-mono text-[var(--color-fg)]">{row.prop}</td>
                    <td className="px-4 py-2 font-mono text-[var(--color-accent)]">{row.type}</td>
                    <td className="px-4 py-2 font-mono text-[var(--color-muted)]">{row.def}</td>
                    <td className="px-4 py-2 text-[var(--color-muted)]">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {/* Dependencies */}
      <Section id="dependencies" title="Dependencies">
        <div className="flex flex-wrap gap-2">
          {preview.dependencies.map((d) => (
            <span key={d} className="rounded-md border border-[var(--color-border)] bg-[var(--color-code-bg)] px-2 py-1 font-mono text-[12.5px] text-[var(--color-code-fg)]">
              {d}
            </span>
          ))}
          {preview.registryDependencies.map((d) => (
            <span key={d} className="rounded-md border border-[var(--color-border)] bg-[var(--color-code-bg)] px-2 py-1 font-mono text-[12.5px] text-[var(--color-code-fg)]">
              {d}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-[var(--color-muted)]">
          Engine: {item.animationEngine} · {item.requiresClient ? "client component" : "server-safe"} · dark mode ✓ ·
          reduced motion ✓
        </p>
      </Section>

      {/* Accessibility */}
      {doc ? (
        <Section id="accessibility" title="Accessibility">
          <ul className="space-y-1.5 text-[14px] text-[var(--color-muted)]">
            {doc.accessibility.map((a) => (
              <li key={a}>· {a}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Performance */}
      {doc ? (
        <Section id="performance" title="Performance">
          <ul className="space-y-1.5 text-[14px] text-[var(--color-muted)]">
            {doc.performance.map((p) => (
              <li key={p}>· {p}</li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
