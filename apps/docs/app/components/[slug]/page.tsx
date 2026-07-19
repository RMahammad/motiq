import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { bySlug, catalog, itemInstall, itemsByCategory, categories, kindOf } from "../../../lib/catalog";
import { product } from "../../../lib/product";
import { pageMetadata, absoluteUrl } from "../../../lib/seo";
import { whenToUse, faqFor } from "../../../lib/component-seo";
import { readAnyRegistry, sourcePreview } from "../../../lib/registry-source";
import { docsContent } from "../../../lib/docs-content";
import { PreviewStage } from "../../_components/preview-stage";
import { Preview } from "../../_previews";
import { CodeBlock, InstallCommand } from "../../_components/code-block";
import { PreviewCodeTabs } from "../../_components/preview-code-tabs";
import { FeaturedBadge } from "../../_components/catalog-card";
import { DocsSidebar, DocsMobileControls, type TocItem } from "../../_components/docs-sidebar";
import { DocsToc } from "../../_components/docs-toc";
import { SponsorCta } from "../../_components/sponsor-cta";

export function generateStaticParams() {
  return catalog.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = bySlug.get(slug);
  if (!item) return {};
  return pageMetadata({
    title: item.name,
    description: item.description,
    path: `/components/${item.slug}`,
    type: "article",
  });
}

/**
 * Registry deps ship in the payload as absolute URLs so `npx shadcn add` resolves
 * them zero-config; show just the item name instead of the full URL.
 */
function depLabel(dep: string): string {
  if (!/^https?:\/\//.test(dep)) return dep;
  return dep.split("/").pop()?.replace(/\.json$/, "") ?? dep;
}

/* Anchor offset: 56px header + the sticky "On this page" bar below xl. */
const SCROLL_MT = "scroll-mt-28 xl:scroll-mt-20";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`${SCROLL_MT} break-words border-t border-[var(--color-border)] py-8`}>
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-[var(--color-fg)]">{title}</h2>
      {children}
    </section>
  );
}

function MetaBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-fg-secondary)]">
      {children}
    </span>
  );
}

const ENGINE_LABEL: Record<string, string> = {
  motion: "Motion for React",
  css: "CSS animation",
  "motion+radix": "Motion + Radix",
};

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = bySlug.get(slug);
  if (!item) notFound();

  const doc = docsContent[slug];
  const reg = readAnyRegistry(item.registryItem);
  // The whole catalog is free/open — full editable source is always shown.
  const source = reg?.files?.[0]?.content ?? "";
  const target = reg?.files?.[0]?.target;
  const preview = sourcePreview(reg, item.dependencies, item.registryDependencies);

  const guide = whenToUse(item);
  const faq = faqFor(item);
  const categoryLabel = categories.find((c) => c.id === item.category)?.label ?? "Components";
  const related = itemsByCategory(item.category)
    .filter((c) => c.slug !== item.slug && (c.kind ?? "component") === "component")
    .slice(0, 6);
  const url = absoluteUrl(`/components/${item.slug}`);

  // Previous / next across the catalog's authored order.
  const idx = catalog.findIndex((c) => c.slug === item.slug);
  const prevItem = idx > 0 ? catalog[idx - 1] : null;
  const nextItem = idx >= 0 && idx < catalog.length - 1 ? catalog[idx + 1] : null;

  const toc: TocItem[] = [
    { id: "preview", label: "Preview" },
    { id: "installation", label: "Installation" },
    ...(doc ? [{ id: "usage", label: "Usage" }] : []),
    { id: "when-to-use", label: "When to use" },
    ...(doc ? [{ id: "api", label: "API reference" }] : []),
    { id: "dependencies", label: "Dependencies" },
    ...(doc
      ? [
          { id: "accessibility", label: "Accessibility" },
          { id: "performance", label: "Performance" },
        ]
      : []),
    { id: "faq", label: "FAQ" },
    ...(related.length ? [{ id: "related", label: "Related components" }] : []),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareSourceCode",
        name: item.name,
        description: item.description,
        url,
        codeRepository: product.githubUrl,
        programmingLanguage: "TypeScript",
        runtimePlatform: "React",
        keywords: item.tags.join(", "),
        isAccessibleForFree: true,
        author: { "@type": "Organization", name: product.productName },
      },
      {
        "@type": "HowTo",
        name: `How to install ${item.name}`,
        description: `Install ${item.name} as editable source with the shadcn CLI.`,
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Run the shadcn add command",
            text: itemInstall(item),
            url: `${url}#installation`,
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Import and use the component",
            text: `Import ${item.name} from your components directory and render it in your React or Next.js app.`,
            url: `${url}#usage`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Components", item: absoluteUrl("/components") },
          {
            "@type": "ListItem",
            position: 2,
            name: categoryLabel,
            item: absoluteUrl(`/components/category/${item.category}`),
          },
          { "@type": "ListItem", position: 3, name: item.name, item: url },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Docs shell: left nav rail / article / table of contents. The right rail
          appears at xl; at lg only the left rail; below lg the DocsMobileControls
          bar replaces both. */}
      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[260px_minmax(0,860px)_220px] xl:justify-center">
        <DocsSidebar activeSlug={item.slug} />

        <div className="min-w-0">
          <DocsMobileControls activeSlug={item.slug} toc={toc} />

          <article className="pb-10 pt-2 lg:pt-8">
            <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-[var(--color-muted)]">
              <Link href="/components" className="hover:text-[var(--color-fg)]">
                Components
              </Link>{" "}
              /{" "}
              <Link href={`/components/category/${item.category}`} className="hover:text-[var(--color-fg)]">
                {categoryLabel}
              </Link>{" "}
              / <span aria-current="page">{item.name}</span>
            </nav>

            <header className="mb-4 flex flex-wrap items-center gap-3">
              <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] font-semibold tracking-tight text-[var(--color-fg)]">
                {item.name}
              </h1>
              <FeaturedBadge featured={item.featured} />
            </header>
            <p className="mb-5 max-w-2xl break-words text-[15px] leading-relaxed text-[var(--color-muted)]">
              {item.description}
            </p>

            {/* Metadata badges — honest, catalog-derived */}
            <div className="mb-8 flex flex-wrap gap-2">
              <MetaBadge>{categoryLabel}</MetaBadge>
              {kindOf(item) !== "component" ? <MetaBadge>{kindOf(item) === "block" ? "Block" : "Pack"}</MetaBadge> : null}
              <MetaBadge>{item.status === "stable" ? "Stable" : "Beta"}</MetaBadge>
              <MetaBadge>{ENGINE_LABEL[item.animationEngine] ?? item.animationEngine}</MetaBadge>
              <MetaBadge>{item.requiresClient ? "Client component" : "Server-safe"}</MetaBadge>
              <MetaBadge>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[var(--color-success)]">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Reduced motion
              </MetaBadge>
            </div>

            {/* Preview / Code tabs */}
            <div id="preview" className={SCROLL_MT}>
              <PreviewCodeTabs
                idBase={item.slug}
                preview={
                  <PreviewStage stage={item.stage}>
                    <Preview id={item.id} />
                  </PreviewStage>
                }
                code={
                  source ? (
                    <div id="code">
                      <p className="mb-2 text-[13px] font-medium text-[var(--color-fg)]">
                        Source
                        {target ? (
                          <span className="ml-2 font-mono text-[12px] font-normal text-[var(--color-muted)]">{target}</span>
                        ) : null}
                      </p>
                      <CodeBlock code={source} />
                    </div>
                  ) : (
                    <p className="text-[14px] text-[var(--color-muted)]">
                      Source installs into your project with the command below.
                    </p>
                  )
                }
              />
            </div>

            {/* Installation — kept right below the preview */}
            <Section id="installation" title="Installation">
              <p className="mb-3 text-[14px] text-[var(--color-muted)]">
                Install the editable source with the shadcn CLI - no account, no config:
              </p>
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

            {/* When to use — unique, keyword-rich prose derived from real attributes */}
            <Section id="when-to-use" title="When to use">
              <p className="mb-4 text-[15px] leading-relaxed text-[var(--color-muted)]">{guide.intro}</p>
              <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-[var(--color-fg)]">Best for</p>
              <ul className="space-y-1.5 text-[14px] text-[var(--color-muted)]">
                {guide.bestFor.map((b) => (
                  <li key={b}>· {b}</li>
                ))}
              </ul>
            </Section>

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
                  <span
                    key={d}
                    className="rounded-md border border-[var(--color-border)] bg-[var(--color-code-bg)] px-2 py-1 font-mono text-[12.5px] text-[var(--color-code-fg)]"
                  >
                    {d}
                  </span>
                ))}
                {preview.registryDependencies.map((d) => (
                  <span
                    key={depLabel(d)}
                    className="rounded-md border border-[var(--color-border)] bg-[var(--color-code-bg)] px-2 py-1 font-mono text-[12.5px] text-[var(--color-code-fg)]"
                  >
                    {depLabel(d)}
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

            {/* FAQ — accurate Q&A, also emitted as FAQPage structured data above */}
            <Section id="faq" title="Frequently asked questions">
              <dl className="space-y-5">
                {faq.map((f) => (
                  <div key={f.q}>
                    <dt className="mb-1 text-[15px] font-medium text-[var(--color-fg)]">{f.q}</dt>
                    <dd className="text-[14px] leading-relaxed text-[var(--color-muted)]">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </Section>

            {/* Related components — internal linking + crawl depth within the category */}
            {related.length ? (
              <Section id="related" title="Related components">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link
                        href={`/components/${r.slug}`}
                        className="block rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3.5 transition-colors hover:border-[var(--color-accent)]"
                      >
                        <span className="block text-[14px] font-medium text-[var(--color-fg)]">{r.name}</span>
                        <span className="mt-0.5 block line-clamp-2 text-[13px] text-[var(--color-muted)]">
                          {r.description}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[13.5px] text-[var(--color-muted)]">
                  See all{" "}
                  <Link href={`/components/category/${item.category}`} className="text-[var(--color-accent)] hover:underline">
                    {categoryLabel} components
                  </Link>
                  .
                </p>
              </Section>
            ) : null}

            {/* Previous / next */}
            <nav aria-label="Component pagination" className="mt-2 grid gap-3 border-t border-[var(--color-border)] pt-8 sm:grid-cols-2">
              {prevItem ? (
                <Link
                  href={prevItem.documentationPath}
                  className="group flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]"
                >
                  <span className="text-[12px] text-[var(--color-muted)]">← Previous</span>
                  <span className="mt-1 text-[14.5px] font-medium text-[var(--color-fg)] group-hover:text-[var(--color-accent-text)]">
                    {prevItem.name}
                  </span>
                </Link>
              ) : (
                <span aria-hidden className="hidden sm:block" />
              )}
              {nextItem ? (
                <Link
                  href={nextItem.documentationPath}
                  className="group flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-right transition-colors hover:border-[var(--color-accent)] sm:col-start-2"
                >
                  <span className="text-[12px] text-[var(--color-muted)]">Next →</span>
                  <span className="mt-1 text-[14.5px] font-medium text-[var(--color-fg)] group-hover:text-[var(--color-accent-text)]">
                    {nextItem.name}
                  </span>
                </Link>
              ) : null}
            </nav>
          </article>
        </div>

        {/* Right rail: scrollspy TOC + compact metadata + sponsor nudge */}
        <aside className="hidden xl:block" aria-label="Page tools">
          <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] space-y-6 overflow-y-auto py-8 pl-1">
            <DocsToc items={toc} />
            <div className="rounded-xl border border-[var(--color-border)] p-3.5 text-[12.5px]">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                Component
              </p>
              <dl className="space-y-1.5 text-[var(--color-fg-secondary)]">
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--color-muted)]">Category</dt>
                  <dd className="text-right">{categoryLabel}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--color-muted)]">Status</dt>
                  <dd>{item.status === "stable" ? "Stable" : "Beta"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--color-muted)]">Engine</dt>
                  <dd className="text-right">{ENGINE_LABEL[item.animationEngine] ?? item.animationEngine}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--color-muted)]">Rendering</dt>
                  <dd>{item.requiresClient ? "Client" : "Server-safe"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--color-muted)]">Reduced motion</dt>
                  <dd>Supported</dd>
                </div>
              </dl>
            </div>
            <SponsorCta />
          </div>
        </aside>
      </div>
    </div>
  );
}
