import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { categories, itemsByCategory, type CategoryId } from "../../../../lib/catalog";
import { categoryIntro } from "../../../../lib/component-seo";
import { pageMetadata, absoluteUrl } from "../../../../lib/seo";

// Indexable category landing pages. Each targets a head term ("animated AI
// interface components") with unique intro copy + a linked grid of the
// category's components, so Google has ~15 distinct entry points instead of one
// query-param view.

/** Only build pages for categories that actually contain components. */
function categoryComponents(id: CategoryId) {
  return itemsByCategory(id).filter((c) => (c.kind ?? "component") === "component");
}

export function generateStaticParams() {
  return categories.filter((c) => categoryComponents(c.id).length > 0).map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const category = categories.find((c) => c.id === id);
  if (!category) return {};
  return pageMetadata({
    title: `${category.label} components`,
    description: categoryIntro(category.id, category.blurb).slice(0, 160),
    path: `/components/category/${category.id}`,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();
  const items = categoryComponents(category.id);
  if (!items.length) notFound();

  const intro = categoryIntro(category.id, category.blurb);
  const url = absoluteUrl(`/components/category/${category.id}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${category.label} components`,
        description: intro,
        url,
        isPartOf: { "@id": `${absoluteUrl("/")}#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: items.length,
          itemListElement: items.map((it, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: it.name,
            url: absoluteUrl(`/components/${it.slug}`),
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Components", item: absoluteUrl("/components") },
          { "@type": "ListItem", position: 2, name: category.label, item: url },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-4 text-[13px] text-[var(--color-muted)]">
        <Link href="/components" className="hover:text-[var(--color-fg)]">
          Components
        </Link>{" "}
        / <span>{category.label}</span>
      </nav>

      <header className="mb-8 max-w-3xl">
        <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          {category.label} components
        </h1>
        <p className="mt-4 text-[15.5px] leading-relaxed text-[var(--color-muted)]">{intro}</p>
        <p className="mt-3 text-[13.5px] text-[var(--color-muted)]">
          {items.length} component{items.length === 1 ? "" : "s"} · free · editable source · accessible ·
          reduced-motion-safe
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <li key={it.slug}>
            <Link
              href={`/components/${it.slug}`}
              className="flex h-full flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 transition-colors hover:border-[var(--color-accent)]"
            >
              <span className="text-[15px] font-medium text-[var(--color-fg)]">{it.name}</span>
              <span className="mt-1 line-clamp-3 text-[13.5px] leading-relaxed text-[var(--color-muted)]">
                {it.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <nav aria-label="Other categories" className="mt-12 border-t border-[var(--color-border)] pt-6">
        <p className="mb-3 text-[13px] font-medium uppercase tracking-wide text-[var(--color-fg)]">
          Other categories
        </p>
        <div className="flex flex-wrap gap-2">
          {categories
            .filter((c) => c.id !== category.id && categoryComponents(c.id).length > 0)
            .map((c) => (
              <Link
                key={c.id}
                href={`/components/category/${c.id}`}
                className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[13px] text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-fg)]"
              >
                {c.label}
              </Link>
            ))}
        </div>
      </nav>
    </div>
  );
}
