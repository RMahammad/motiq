// PREVIEW-GRADE dashboard (Server Component).
//
// Reads ?customer=<id> because there is NO authenticated login yet (production
// resolves the customer from an authenticated session, never a URL). Shows the
// participant their available packs, included components, blocks, preview
// entitlement status + expiration, registry-token metadata (via listTokenMeta —
// never full tokens), a create/rotate/revoke widget, install instructions, and
// honest limitations + support links.
//
// NO billing controls, NO fake invoices/prices/discounts/purchases. SECRET-SAFE:
// every command/example uses the ${MOTIQ_TOKEN} placeholder; the only place a
// real token appears is the one-time reveal in the client token widget.
import type { Metadata } from "next";
import Link from "next/link";

import { product, commerce, installCommand, namespacedInstall } from "../../../lib/product";
import { statusLabel } from "../../../lib/commerce";
import type { EntitlementId } from "../../../lib/commerce";
import { stores } from "../../../lib/server/stores";
import { activeEntitlementIds } from "../../../lib/server/entitlement-service";
import { listTokenMeta } from "../../../lib/server/tokens";
import { packsContaining } from "../../../lib/server/entitlement-map";
import { packs } from "../../../lib/packs";
import { catalog, bySlug } from "../../../lib/catalog";
import { InstallCommand, CodeBlock } from "../../_components/code-block";
import { PreviewTokenWidget } from "../token-widget";

export const dynamic = "force-dynamic"; // per-customer, reads mutable stores

export const metadata: Metadata = {
  title: `Preview dashboard - ${product.productName}`,
  description: "Your private-preview access, registry tokens, and install commands.",
};

const TOKEN_ENV = `${product.shortName.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}_TOKEN`;

function registryApiUrl(): string {
  try {
    return `${new URL(product.registryBaseUrl).origin}/api/registry/{name}`;
  } catch {
    return "/api/registry/{name}";
  }
}

function componentsJsonSnippet(): string {
  const config = {
    registries: {
      [product.registryNamespace]: {
        url: registryApiUrl(),
        headers: { Authorization: `Bearer \${${TOKEN_ENV}}` },
      },
    },
  };
  return JSON.stringify(config, null, 2);
}

function fmtDate(ms: number | null): string {
  if (ms == null) return "-";
  return new Date(ms).toLocaleDateString();
}

function supportHref(): { href: string; label: string } {
  if (commerce.supportEmail) return { href: `mailto:${commerce.supportEmail}`, label: commerce.supportEmail };
  if (product.supportUrl) return { href: product.supportUrl, label: "Contact support" };
  return { href: commerce.supportPolicyUrl || "/legal/support-policy", label: "Support" };
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[var(--color-border)] py-8">
      <h2 className="text-lg font-semibold tracking-tight text-[var(--color-fg)]">{title}</h2>
      {sub ? (
        <p className="mt-1 mb-4 max-w-2xl text-[13.5px] leading-relaxed text-[var(--color-muted)]">{sub}</p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </section>
  );
}

function NoCustomer() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-16 sm:px-6">
      <p className="mb-3 inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12px] font-medium text-[var(--color-muted)]">
        Preview dashboard · {statusLabel()}
      </p>
      <h1 className="text-[clamp(1.8rem,4vw,2.4rem)] font-semibold tracking-tight text-[var(--color-fg)]">
        Sign in to see your preview
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">
        The production dashboard will require an authenticated login. Your access, registry tokens, and install
        configuration are resolved from your session - never from a link you can share or edit.
      </p>
      <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-muted)]">
        Accounts are not live during {statusLabel().toLowerCase()}. Your activation link includes your customer id until
        real logins exist.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/access"
          className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-accent-contrast,#fff)] transition-opacity hover:opacity-90"
        >
          Request access
        </Link>
        <Link
          href="/components"
          className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)]"
        >
          Explore components
        </Link>
      </div>
    </div>
  );
}

export default async function PreviewDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const { customer: customerId } = await searchParams;
  if (!customerId) return <NoCustomer />;

  const customer = await stores().customers.get(customerId);
  if (!customer) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-16 sm:px-6">
        <h1 className="text-[clamp(1.7rem,4vw,2.2rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          We couldn’t find that account
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">
          No customer matches this identifier. If your access was just activated, processing may still be underway.
        </p>
        <Link
          href="/preview/onboarding"
          className="mt-8 inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)]"
        >
          Back to onboarding
        </Link>
      </div>
    );
  }

  const active = await activeEntitlementIds(customerId);
  const entRecords = await stores().entitlements.forCustomer(customerId);
  const tokens = await listTokenMeta(customerId);
  const hasComplete = active.has("catalog.complete");
  const entitledPacks = packs.filter((p) => hasComplete || active.has(`pack.${p.slug}` as EntitlementId));

  const now = Date.now();
  const previewGrants = entRecords.filter((e) => e.state === "active" && e.licenseType === "preview");
  const previewExpiries = previewGrants
    .filter((e) => e.expiresAt != null && e.expiresAt > now)
    .map((e) => e.expiresAt as number);
  const previewExpiresAt = previewExpiries.length ? Math.max(...previewExpiries) : null;
  const previewActive = previewExpiresAt != null && customer.state === "active";

  // Registry item names included by the customer's active entitlements.
  const includedNames = new Set<string>(
    hasComplete
      ? catalog.map((c) => c.registryItem)
      : entitledPacks.flatMap((p) => [...p.components, p.blockSlug, p.packRegistryItem]),
  );
  const includedComponents = catalog.filter((c) => (c.kind ?? "component") === "component" && includedNames.has(c.registryItem));
  const includedBlocks = catalog.filter((c) => c.kind === "block" && includedNames.has(c.registryItem));
  const proIncluded = includedComponents.filter((c) => c.access === "pro");

  const support = supportHref();

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      {/* Header */}
      <header className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12px] text-[var(--color-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> Preview dashboard · {statusLabel()}
          </p>
          <h1 className="text-[clamp(1.6rem,3.6vw,2.1rem)] font-semibold tracking-tight text-[var(--color-fg)]">
            {customer.email || "Your preview"}
          </h1>
          <p className="mt-1 font-mono text-[12.5px] text-[var(--color-muted)]">
            {customer.id} · account {customer.state}
          </p>
        </div>
        <Link
          href={`/preview/onboarding?customer=${encodeURIComponent(customer.id)}`}
          className="inline-flex items-center rounded-lg border border-[var(--color-border)] px-3 py-2 text-[13px] text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)]"
        >
          Onboarding guide
        </Link>
      </header>
      <p className="mb-2 text-[12.5px] text-[var(--color-muted)]">
        Preview note: production requires an authenticated login. This page reads <code className="font-mono">?customer=</code> because accounts are not live yet. No billing runs during preview.
      </p>

      {/* Preview status */}
      <Section title="Preview status" sub="Access is resolved server-side and fails closed - only active, unexpired grants count.">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[12.5px] text-[var(--color-muted)]">Preview access</p>
            <p className="mt-1 text-[15px] font-medium text-[var(--color-fg)]">
              {previewActive ? "Active" : previewGrants.length ? "Expired" : "None on file"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[12.5px] text-[var(--color-muted)]">Expires</p>
            <p className="mt-1 text-[15px] font-medium text-[var(--color-fg)]">{fmtDate(previewExpiresAt)}</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[12.5px] text-[var(--color-muted)]">Active entitlements</p>
            <p className="mt-1 text-[15px] font-medium text-[var(--color-fg)]">{active.size}</p>
          </div>
        </div>
        {active.size ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {[...active].map((id) => (
              <li key={id} className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 font-mono text-[11px] text-[var(--color-muted)]">
                {id}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[13px] text-[var(--color-muted)]">
            No active entitlements yet. Free components are always installable.
          </p>
        )}
      </Section>

      {/* Available packs */}
      <Section title="Available packs" sub="Packs compose components into complete workflow blocks. Packs included in your preview are marked.">
        <ul className="grid gap-3 sm:grid-cols-2">
          {packs.map((p) => {
            const entitled = entitledPacks.some((ep) => ep.slug === p.slug);
            return (
              <li key={p.slug} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14px] font-medium text-[var(--color-fg)]">{p.name}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] ${entitled ? "border-[var(--color-accent)] text-[var(--color-fg)]" : "border-[var(--color-border)] text-[var(--color-muted)]"}`}>
                    {entitled ? "Included" : "Not in preview"}
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-muted)]">{p.tagline}</p>
                {entitled ? (
                  <div className="mt-3">
                    <InstallCommand command={namespacedInstall(p.packRegistryItem)} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Included components + blocks */}
      <Section title="Included components & blocks" sub="Everything your preview entitlement makes installable as editable source.">
        {includedComponents.length === 0 && includedBlocks.length === 0 ? (
          <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 text-[13px] text-[var(--color-muted)]">
            Your preview doesn’t include Pro items yet. Free components across the catalog are always installable - browse
            them on the{" "}
            <Link href="/components" className="text-[var(--color-accent)] hover:underline">components page</Link>.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {includedBlocks.length ? (
              <div>
                <p className="mb-2 text-[12.5px] font-medium text-[var(--color-fg)]">Blocks ({includedBlocks.length})</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {includedBlocks.map((b) => (
                    <li key={b.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                      <p className="text-[13px] font-medium text-[var(--color-fg)]">{b.name}</p>
                      <p className="mt-0.5 text-[11.5px] text-[var(--color-muted)]">
                        {(b.composes ?? []).map((s) => bySlug.get(s)?.name ?? s).join(" · ")}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div>
              <p className="mb-2 text-[12.5px] font-medium text-[var(--color-fg)]">
                Components ({includedComponents.length}
                {proIncluded.length ? `, ${proIncluded.length} Pro` : ""})
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {includedComponents.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-[var(--color-fg)]">{c.name}</p>
                      {packsContaining(c.registryItem).length ? (
                        <p className="mt-0.5 truncate text-[11.5px] text-[var(--color-muted)]">in {packsContaining(c.registryItem).join(", ")}</p>
                      ) : null}
                    </div>
                    <span className="shrink-0 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10.5px] uppercase tracking-wide text-[var(--color-muted)]">
                      {c.access}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Section>

      {/* Registry tokens */}
      <Section title="Registry tokens" sub="Tokens authenticate the shadcn CLI to your entitled Pro source. Only a short prefix is ever listed - the full token is shown once, at creation or rotation.">
        <PreviewTokenWidget customerId={customer.id} tokens={tokens} tokenEnvVar={TOKEN_ENV} />
      </Section>

      {/* Install configuration */}
      <Section title="Install configuration" sub="Add this to components.json, then set your token as an environment variable. The token is read from your environment - never committed, never placed in a URL.">
        <CodeBlock code={componentsJsonSnippet()} lang="jsonc" />
        <div className="mt-3 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-code-bg)] px-3 py-2">
          <code className="font-mono text-[12.5px] text-[var(--color-code-fg)]">export {TOKEN_ENV}=&lt;your token&gt;</code>
        </div>
        <p className="mt-3 mb-1 text-[12.5px] text-[var(--color-muted)]">Free components install from their public URL:</p>
        <InstallCommand command={installCommand(catalog.find((c) => c.access === "free")?.registryItem ?? "utils")} />
      </Section>

      {/* Known limitations */}
      <Section title="Known limitations" sub="Stated plainly (private-preview runbook, docs/47).">
        <ul className="flex flex-col gap-2 text-[13px] leading-relaxed text-[var(--color-muted)]">
          <li>• Dev-mock entitlement provider - tokens are preview fixtures, no real billing/identity behind them.</li>
          <li>• File-backed store - not a production database; a small-cohort convenience, not a scale/HA guarantee.</li>
          <li>• No checkout - no payment, no purchase flow; participation is not a sale.</li>
          <li>• Draft legal terms; preview builds may change without paid-launch update guarantees.</li>
          <li>• No guarantee of final pricing or permanent access.</li>
        </ul>
      </Section>

      {/* Support & feedback */}
      <Section title="Support & feedback">
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/preview/feedback" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 transition-colors hover:border-[var(--color-accent)]">
            <p className="text-[13px] font-medium text-[var(--color-fg)]">Report a bug / request a component →</p>
            <p className="mt-1 text-[12.5px] text-[var(--color-muted)]">Structured feedback intake for the cohort.</p>
          </Link>
          <a href={support.href} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 transition-colors hover:border-[var(--color-accent)]">
            <p className="text-[13px] font-medium text-[var(--color-fg)]">Support →</p>
            <p className="mt-1 text-[12.5px] text-[var(--color-muted)]">{support.label}</p>
          </a>
          <Link href="/updates" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 transition-colors hover:border-[var(--color-accent)]">
            <p className="text-[13px] font-medium text-[var(--color-fg)]">Product updates →</p>
            <p className="mt-1 text-[12.5px] text-[var(--color-muted)]">Recent preview build changes.</p>
          </Link>
        </div>
      </Section>
    </div>
  );
}
