import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { bySlug, catalog, itemInstall, itemsByCategory, categories, resolvePresentation } from "../../../lib/catalog";
import { product, namespacedInstall, registriesConfig } from "../../../lib/product";
import { pageMetadata, absoluteUrl } from "../../../lib/seo";
import { whenToUse, faqFor } from "../../../lib/component-seo";
import { readAnyRegistry, sourcePreview } from "../../../lib/registry-source";
import { docsContent } from "../../../lib/docs-content";
import { PreviewStage } from "../../_components/preview-stage";
import { Preview } from "../../_previews";
import { CodeBlock, InstallCommand } from "../../_components/code-block";
import { PreviewCodeTabs } from "../../_components/preview-code-tabs";
import { FeaturedBadge } from "../../_components/catalog-card";

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
 * them zero-config; show the friendly `@namespace/name` form instead of the URL.
 */
function depLabel(dep: string): string {
  if (!/^https?:\/\//.test(dep)) return dep;
  const base = dep.split("/").pop()?.replace(/\.json$/, "") ?? dep;
  return `${product.registryNamespace}/${base}`;
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 break-words border-t border-[var(--color-border)] py-8">
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
  // The whole catalog is free/open — full editable source is always shown.
  const source = reg?.files?.[0]?.content ?? "";
  const target = reg?.files?.[0]?.target;
  const preview = sourcePreview(reg, item.dependencies, item.registryDependencies);

  // Large/complex components get a wider preview stage than the reading column so
  // maps, timelines, dashboards, and blocks are not squeezed into prose width (docs/56 §19).
  const { previewSize } = resolvePresentation(item);
  const previewMax =
    previewSize === "full" || previewSize === "ambient"
      ? "max-w-[1360px]"
      : previewSize === "wide"
        ? "max-w-[1200px]"
        : "max-w-[1000px]";
  const READ = "mx-auto max-w-[920px]";

  const guide = whenToUse(item);
  const faq = faqFor(item);
  const categoryLabel = categories.find((c) => c.id === item.category)?.label ?? "Components";
  const related = itemsByCategory(item.category)
    .filter((c) => c.slug !== item.slug && (c.kind ?? "component") === "component")
    .slice(0, 6);
  const url = absoluteUrl(`/components/${item.slug}`);

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
    <div className="mx-auto max-w-[1360px] px-4 py-10 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className={READ}>
        <nav className="mb-4 text-[13px] text-[var(--color-muted)]">
          <Link href="/components" className="hover:text-[var(--color-fg)]">
            Components
          </Link>{" "}
          /{" "}
          <Link href={`/components/category/${item.category}`} className="hover:text-[var(--color-fg)]">
            {categoryLabel}
          </Link>{" "}
          / <span>{item.name}</span>
        </nav>

        <header className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-semibold tracking-tight text-[var(--color-fg)]">
            {item.name}
          </h1>
          <FeaturedBadge featured={item.featured} />
        </header>
        <p className="mb-8 max-w-2xl break-words text-[15px] leading-relaxed text-[var(--color-muted)]">{item.description}</p>
      </div>

      {/* Preview / Code tabs — width scales with component complexity */}
      <div id="preview" className={`mx-auto ${previewMax}`}>
        <PreviewCodeTabs
          idBase={item.slug}
          preview={
            <PreviewStage stage={item.stage}>
              <Preview id={item.id} />
            </PreviewStage>
          }
          code={
            source ? (
              <div className="space-y-5">
                {doc ? (
                  <div id="usage">
                    <p className="mb-2 text-[13px] font-medium text-[var(--color-fg)]">Usage</p>
                    <CodeBlock code={doc.usage} />
                  </div>
                ) : null}
                <div id="code">
                  <p className="mb-2 text-[13px] font-medium text-[var(--color-fg)]">
                    Source
                    {target ? (
                      <span className="ml-2 font-mono text-[12px] font-normal text-[var(--color-muted)]">{target}</span>
                    ) : null}
                  </p>
                  <CodeBlock code={source} />
                </div>
              </div>
            ) : (
              <p className="text-[14px] text-[var(--color-muted)]">Source installs into your project with the command below.</p>
            )
          }
        />
      </div>

      <div className={READ}>
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

      {/* Installation */}
      <Section id="installation" title="Installation">
        <p className="mb-3 text-[14px] text-[var(--color-muted)]">Install the editable source with the shadcn CLI — no setup, no account, works in any shadcn project:</p>
        <InstallCommand command={itemInstall(item)} />
        <details className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-2.5 [&_summary]:cursor-pointer">
          <summary className="text-[13px] text-[var(--color-fg)] marker:text-[var(--color-muted)]">
            Prefer a shorter command? Use the <code className="rounded bg-[var(--color-code-bg)] px-1 py-0.5 font-mono text-[12px]">{product.registryNamespace}</code> namespace shortcut
          </summary>
          <div className="mt-3 space-y-2.5">
            <p className="text-[13px] text-[var(--color-muted)]">
              Add {product.shortName} to your <code className="rounded bg-[var(--color-code-bg)] px-1 py-0.5 font-mono text-[12px]">components.json</code> once (a one-time convenience — the command above always works without it), then install any component with the short form:
            </p>
            <CodeBlock code={registriesConfig()} lang="json" />
            <InstallCommand command={namespacedInstall(item.registryItem)} />
          </div>
        </details>
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
                  <span className="mt-0.5 block line-clamp-2 text-[13px] text-[var(--color-muted)]">{r.description}</span>
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
      </div>
    </div>
  );
}
