import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { packs, packBySlug, packInstall, blockInstall } from "../../../lib/packs";
import { bySlug, itemInstall } from "../../../lib/catalog";
import { product } from "../../../lib/product";
import { packPrimaryCta, completeCatalogCta, statusLabel, canShowPrice } from "../../../lib/commerce";
import { docsContent } from "../../../lib/docs-content";
import { Preview } from "../../_previews";
import { PreviewStage } from "../../_components/preview-stage";
import { LazyPreview } from "../../_components/lazy-preview";
import { InstallCommand } from "../../_components/code-block";
import { AccessBadge } from "../../_components/catalog-card";
import { AccessCta } from "../../_components/access-cta";

export function generateStaticParams() {
  return packs.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pack = packBySlug.get(slug);
  if (!pack) return {};
  return { title: `${pack.name} — ${product.productName}`, description: pack.tagline };
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[var(--color-border)] py-9">
      <h2 className="text-xl font-semibold tracking-tight text-[var(--color-fg)]">{title}</h2>
      {sub ? <p className="mt-1 mb-4 max-w-2xl text-[14px] text-[var(--color-muted)]">{sub}</p> : <div className="mb-4" />}
      {children}
    </section>
  );
}

// What a pack saves a team from building (concrete, not vague).
const SAVES = [
  ["State handling", "Every interaction state modelled — loading, live, empty, partial, stale, error, recovery — not just the happy path."],
  ["Interaction design", "Keyboard, focus, pointer, and touch behaviour designed once and shared across the workflow."],
  ["Accessibility", "Roles, labels, and status-by-icon-and-text (never colour alone); reduced-motion behaviour on every animation."],
  ["Animation", "Meaningful motion tied to state change — continuity, not decoration — with the reduced-motion fallback built in."],
  ["Responsive behaviour", "Desktop, tablet, and mobile layouts for a multi-component workflow, not a single card."],
  ["Registry integration", "Installs as editable source through the shadcn CLI with dependencies resolved for you."],
];

export default async function PackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pack = packBySlug.get(slug);
  if (!pack) notFound();

  const components = pack.components
    .map((s) => bySlug.get(s))
    .filter(Boolean) as NonNullable<ReturnType<typeof bySlug.get>>[];
  const freeCount = components.filter((c) => c.access === "free").length;
  const proCount = components.filter((c) => c.access === "pro").length;
  const block = bySlug.get(pack.blockSlug);
  const blockDoc = docsContent[pack.blockSlug];
  const filesInstalled = components.length + 1; // each component + the block source
  const depSummary = Array.from(
    new Set(components.flatMap((c) => c.dependencies)),
  );

  const primary = packPrimaryCta(pack.slug);
  const complete = completeCatalogCta();

  const faq: { q: string; a: string }[] = [
    { q: "Is this a package or source code?", a: "Editable source. The shadcn CLI writes the component and block files into your repo — you own and can change them. There is no runtime dependency on us." },
    { q: "Can I edit the components?", a: "Yes. Everything installs as TypeScript source with Tailwind classes and Motion — edit freely." },
    { q: "Does it work with Next.js?", a: "Yes. Components are RSC-aware and ship the client boundary where needed." },
    { q: "Does it work with Vite?", a: "Yes. The components are framework-agnostic React; they do not import next/*." },
    { q: "Does it require shadcn?", a: "It uses the shadcn-compatible registry to install. The components themselves are plain React + Tailwind + Motion." },
    { q: "Does it require Motion?", a: "Most components use Motion for React for meaningful animation; a few are CSS-only. Dependencies are listed per component." },
    { q: "Is it accessible?", a: "Components target WCAG 2.2 AA patterns: keyboard operable, labelled, status conveyed by icon and text, with reduced-motion behaviour. Verify against your own product context." },
    { q: "Can I use it for client projects?", a: "License terms are being finalized (docs/41). See the draft license before relying on specific rights." },
    { q: "How do updates work?", a: "Since you install source, you own your copy. Update delivery and duration are to be finalized — we do not claim lifetime updates." },
    { q: "Can I buy the complete catalog?", a: "The complete catalog is planned as an access tier. Access and pricing are being finalized — join the list to be notified." },
    { q: "Is pricing finalized?", a: canShowPrice() ? "See the access section for current pricing." : "No — pricing is to be finalized. Nothing is charged during preview." },
  ];

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <nav className="mb-4 text-[13px] text-[var(--color-muted)]">
        <Link href="/packs" className="hover:text-[var(--color-fg)]">Packs</Link> / <span>{pack.name}</span>
      </nav>

      {/* HERO */}
      <header className="mb-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12px] text-[var(--color-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> {statusLabel()}
          </span>
          <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-[12px] text-[var(--color-muted)]">
            Workflow pack · {components.length} components · 1 complete block
          </span>
        </div>
        <h1 className="mt-4 text-[clamp(2rem,4.6vw,3.2rem)] font-semibold leading-[1.05] tracking-tight text-[var(--color-fg)]">
          {pack.name}
        </h1>
        <p className="mt-4 max-w-2xl text-[clamp(1rem,2.2vw,1.15rem)] leading-relaxed text-[var(--color-muted)]">{pack.tagline}</p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-[13px] text-[var(--color-fg)]">
            {freeCount} Free · {proCount} Pro
          </span>
          <span className="text-[13px] text-[var(--color-muted)]">Editable source · accessible · reduced-motion safe</span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <AccessCta cta={primary} />
          <Link
            href="#included"
            className="inline-flex items-center rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)]"
          >
            Explore components
          </Link>
        </div>
      </header>

      {/* LARGE BLOCK PREVIEW (lazy-mounted) */}
      {block ? (
        <LazyPreview label={`${pack.blockName} — live preview`}>
          <PreviewStage stage="interactive">
            <Preview id={pack.blockSlug} />
          </PreviewStage>
        </LazyPreview>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center text-[14px] text-[var(--color-muted)]">
          Block preview coming soon.
        </div>
      )}

      {/* PRODUCT PROBLEM */}
      <Section title="What this pack saves you from building">
        <p className="mb-5 max-w-2xl text-[15px] leading-relaxed text-[var(--color-muted)]">{pack.problem}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SAVES.map(([h, b]) => (
            <div key={h} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
              <p className="text-[14px] font-medium text-[var(--color-fg)]">{h}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-muted)]">{b}</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 flex flex-wrap gap-2">
          {pack.useCases.map((u) => (
            <li key={u} className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-[13px] text-[var(--color-muted)]">{u}</li>
          ))}
        </ul>
      </Section>

      {/* FULL WORKFLOW PREVIEW / STATES */}
      <Section
        title="The complete workflow"
        sub="The block cycles through the real states below — it exposes application-controlled state and never simulates a backend or model."
      >
        <ul className="flex flex-wrap gap-2">
          {pack.states.map((s) => (
            <li key={s} className="rounded-md border border-[var(--color-border)] bg-[var(--color-code-bg)] px-2.5 py-1 font-mono text-[12.5px] text-[var(--color-code-fg)]">{s}</li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] text-[var(--color-muted)]">
          You wire the data and callbacks documented on the{" "}
          <Link href={`/components/${pack.blockSlug}`} className="text-[var(--color-accent)] hover:underline">block page</Link>.
        </p>
      </Section>

      {/* INCLUDED ITEMS */}
      <Section
        title={`Included components — ${freeCount} Free · ${proCount} Pro`}
        sub="Free components install individually today. Pro components are delivered with pack or complete-catalog access."
      >
        <div id="included" className="grid gap-3 sm:grid-cols-2">
          {components.map((c) => (
            <div key={c.id} className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={c.documentationPath} className="text-[14px] font-medium text-[var(--color-fg)] hover:text-[var(--color-accent)]">
                    {c.name}
                  </Link>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-muted)]">{c.description}</p>
                </div>
                <AccessBadge access={c.access} />
              </div>
              {c.access === "free" ? (
                <InstallCommand command={itemInstall(c)} />
              ) : (
                <p className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-[12.5px] text-[var(--color-muted)]">
                  {product.premiumTierLabel} — included with this pack. Full source delivered on access.{" "}
                  <Link href={c.documentationPath} className="text-[var(--color-accent)] hover:underline">Preview & API →</Link>
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* WHAT BUYERS RECEIVE */}
      <Section title="What you receive">
        <ul className="grid gap-2 text-[14px] text-[var(--color-muted)] sm:grid-cols-2">
          {[
            "Editable TypeScript source for every component + the composed block",
            "Tailwind styling using semantic design tokens",
            "Motion for React integration (with reduced-motion fallbacks)",
            "shadcn-compatible registry installation",
            "Per-component documentation and prop/API tables",
            "Accessibility considerations documented per component",
            "Reduced-motion behaviour on every animation",
            "Updates per the eventual approved update policy (not yet finalized)",
          ].map((r) => (
            <li key={r}>· {r}</li>
          ))}
        </ul>
        <p className="mt-3 text-[12.5px] text-[var(--color-muted)]">We do not claim lifetime updates. Update duration is to be finalized (docs/41).</p>
      </Section>

      {/* INSTALLATION */}
      <Section title="Installation" sub={`Installs ${filesInstalled} source files into your repo — you own them after install.`}>
        <p className="mb-2 text-[14px] text-[var(--color-muted)]">Whole pack (block + every component):</p>
        <InstallCommand command={packInstall(pack)} />
        <p className="mt-4 mb-2 text-[14px] text-[var(--color-muted)]">Just the composed block (pulls its component dependencies):</p>
        <InstallCommand command={blockInstall(pack)} />
        <p className="mt-4 mb-2 text-[14px] text-[var(--color-muted)]">Individual Free components:</p>
        <div className="space-y-2">
          {components.filter((c) => c.access === "free").map((c) => (
            <InstallCommand key={c.id} command={itemInstall(c)} />
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
            <p className="text-[13px] font-medium text-[var(--color-fg)]">Files installed</p>
            <p className="mt-1 text-[13px] text-[var(--color-muted)]">{filesInstalled} source files (components + block)</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
            <p className="text-[13px] font-medium text-[var(--color-fg)]">Dependencies</p>
            <p className="mt-1 text-[13px] text-[var(--color-muted)]">{depSummary.length ? depSummary.join(", ") : "none beyond React"} + shared utils/primitives</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
            <p className="text-[13px] font-medium text-[var(--color-fg)]">Source ownership</p>
            <p className="mt-1 text-[13px] text-[var(--color-muted)]">Editable source in your repo. No runtime lock-in.</p>
          </div>
        </div>
        {product.namespaceIsPreview ? (
          <p className="mt-3 text-[12px] text-[var(--color-muted)]">The registry namespace/URL are temporary preview values during development. Pro items install through an authenticated registry route (docs/43).</p>
        ) : null}
      </Section>

      {/* COMPARISON */}
      <Section title="Build it, or install it" sub="A factual comparison — no invented time or cost savings.">
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-left text-[13.5px]">
            <thead className="bg-[var(--color-bg-secondary)] text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-2 font-medium">What you handle</th>
                <th className="px-4 py-2 font-medium">Build manually</th>
                <th className="px-4 py-2 font-medium">Install components</th>
                <th className="px-4 py-2 font-medium">Install the pack</th>
              </tr>
            </thead>
            <tbody className="text-[var(--color-fg)]">
              {[
                ["Components included", "You build each", `${freeCount} Free individually`, `All ${components.length} + block`],
                ["Interaction states", "You design each", "Per component", "Across the whole workflow"],
                ["Accessibility", "You implement", "Built in per component", "Built in, composed"],
                ["Responsive behaviour", "You handle", "Per component", "Whole-workflow layout"],
                ["Registry integration", "N/A", "Yes", "Yes (one command)"],
                ["Documentation", "You write", "Per component", "Per component + pack page"],
                ["Editable source", "Yours", "Yours", "Yours"],
              ].map((row) => (
                <tr key={row[0]} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-2 text-[var(--color-muted)]">{row[0]}</td>
                  <td className="px-4 py-2">{row[1]}</td>
                  <td className="px-4 py-2">{row[2]}</td>
                  <td className="px-4 py-2">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* FAQ */}
      <Section title="Questions">
        <dl className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
          {faq.map((f) => (
            <div key={f.q} className="px-4 py-3">
              <dt className="text-[14px] font-medium text-[var(--color-fg)]">{f.q}</dt>
              <dd className="mt-1 text-[13.5px] leading-relaxed text-[var(--color-muted)]">{f.a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* FINAL CTA */}
      <Section title="Get this pack">
        <div id="access" className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[15px] font-medium text-[var(--color-fg)]">{pack.name}</p>
            <p className="mt-1 text-[13px] text-[var(--color-muted)]">
              {components.length} components + 1 composed block · {freeCount} Free · {proCount} Pro · {statusLabel()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <AccessCta cta={primary} />
            <AccessCta cta={complete} variant="secondary" />
          </div>
        </div>
        {blockDoc ? (
          <ul className="mt-4 space-y-1.5 text-[13px] text-[var(--color-muted)]">
            {blockDoc.accessibility.slice(0, 2).map((a) => <li key={a}>· {a}</li>)}
            {blockDoc.performance.slice(0, 1).map((p) => <li key={p}>· {p}</li>)}
          </ul>
        ) : null}
      </Section>
    </div>
  );
}
