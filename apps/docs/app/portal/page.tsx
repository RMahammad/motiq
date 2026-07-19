// PREVIEW-GRADE customer portal (Server Component).
//
// Reads ?customer=<id> because there is NO authenticated login yet. A production
// portal resolves the customer from an authenticated session — never from a URL.
// This surface is honest about that limitation and never exposes a full registry
// token or any Pro source.
import type { Metadata } from "next";
import Link from "next/link";

import { product, commerce } from "../../lib/product";
import { statusLabel } from "../../lib/commerce";
import type { EntitlementId } from "../../lib/commerce";
import { stores } from "../../lib/server/stores";
import { activeEntitlementIds } from "../../lib/server/entitlement-service";
import { listTokenMeta } from "../../lib/server/tokens";
import { packsContaining } from "../../lib/server/entitlement-map";
import { packs, packBySlug, packInstall, blockInstall } from "../../lib/packs";
import { bySlug, itemInstall, catalog } from "../../lib/catalog";
import { installCommand, namespacedInstall } from "../../lib/product";
import { InstallCommand, CodeBlock } from "../_components/code-block";
import { TokenManager } from "./token-manager";

export const dynamic = "force-dynamic"; // per-customer, reads mutable stores

export const metadata: Metadata = {
  title: `Customer portal - ${product.productName}`,
  description: "Manage your access, registry tokens, and installation configuration.",
};

// Env-var name the shadcn CLI reads the bearer token from (derived from brand).
const TOKEN_ENV = `${product.shortName.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}_TOKEN`;

function registryApiUrl(): string {
  // Derive the API origin from the configured registry base URL — never hardcode.
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

/** Human label + one-line detail for an entitlement id. */
function labelEntitlement(id: EntitlementId): { title: string; detail: string } {
  if (id === "catalog.complete") return { title: "Complete catalog", detail: "Every component, block, and pack." };
  if (id === "license.team") return { title: "Team license", detail: "Multi-seat usage rights." };
  if (id === "license.agency") return { title: "Agency license", detail: "Client-project usage rights." };
  if (id.startsWith("pack.")) {
    const pack = packBySlug.get(id.slice("pack.".length));
    return { title: pack ? pack.name : id, detail: pack ? pack.tagline : "Workflow pack." };
  }
  if (id.startsWith("block.")) {
    const item = bySlug.get(id.slice("block.".length));
    return { title: item ? item.name : id, detail: item ? item.description : "Composed block." };
  }
  if (id.startsWith("component.")) {
    const item = bySlug.get(id.slice("component.".length));
    return { title: item ? item.name : id, detail: item ? item.description : "Single component." };
  }
  return { title: id, detail: "" };
}

/** Registry item names an entitlement includes (for portal display). */
function includedItemNames(id: EntitlementId): string[] {
  if (id === "catalog.complete") return catalog.map((c) => c.registryItem);
  if (id.startsWith("pack.")) {
    const pack = packBySlug.get(id.slice("pack.".length));
    return pack ? [...pack.components, pack.blockSlug] : [];
  }
  if (id.startsWith("block.")) return [id.slice("block.".length)];
  if (id.startsWith("component.")) return [id.slice("component.".length)];
  return [];
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[var(--color-border)] py-8">
      <h2 className="text-lg font-semibold tracking-tight text-[var(--color-fg)]">{title}</h2>
      {sub ? <p className="mt-1 mb-4 max-w-2xl text-[13.5px] leading-relaxed text-[var(--color-muted)]">{sub}</p> : <div className="mb-4" />}
      {children}
    </section>
  );
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

// ---------------------------------------------------------------------------
// No-customer state — honest about the production login requirement.
// ---------------------------------------------------------------------------
function NoCustomer() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-16 sm:px-6">
      <p className="mb-3 inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12px] font-medium text-[var(--color-muted)]">
        Customer portal · {statusLabel()}
      </p>
      <h1 className="text-[clamp(1.8rem,4vw,2.4rem)] font-semibold tracking-tight text-[var(--color-fg)]">
        Sign in to manage your access
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">
        The production portal will require an authenticated login. Your entitlements, registry tokens, and install
        configuration are resolved from your session - never from a link you can share or edit.
      </p>
      <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-muted)]">
        Authenticated accounts are not enabled during {statusLabel().toLowerCase()}. This portal is not yet a way to sign
        in - it is a preview of what you will see once accounts are live.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/components"
          className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)]"
        >
          Explore components
        </Link>
        <Link
          href="/access"
          className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-accent-contrast,#fff)] transition-opacity hover:opacity-90"
        >
          Request access
        </Link>
      </div>
    </div>
  );
}

export default async function PortalPage({
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
          No customer matches this identifier. If you just completed access setup, processing may still be underway.
        </p>
        <Link
          href="/portal"
          className="mt-8 inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)]"
        >
          Back to portal
        </Link>
      </div>
    );
  }

  const active = await activeEntitlementIds(customerId);
  const entRecords = await stores().entitlements.forCustomer(customerId);
  const tokens = await listTokenMeta(customerId);

  const activeIds = [...active].sort((a, b) => (a === "catalog.complete" ? -1 : b === "catalog.complete" ? 1 : a.localeCompare(b)));
  const hasComplete = active.has("catalog.complete");

  // License types across the customer's active-ish records.
  const licenseTypes = Array.from(new Set(entRecords.filter((e) => e.state === "active").map((e) => e.licenseType)));

  // Update eligibility — the max updateUntil across active records (null = not set).
  const updateWindows = entRecords
    .filter((e) => e.state === "active" && e.updateUntil != null)
    .map((e) => e.updateUntil as number);
  const updateUntil = updateWindows.length ? Math.max(...updateWindows) : null;

  // Entitled packs (for pack/block install commands).
  const entitledPacks = packs.filter((p) => hasComplete || active.has(`pack.${p.slug}` as EntitlementId));

  const support = supportHref();

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      {/* IDENTITY */}
      <header className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12px] text-[var(--color-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> Customer portal · {statusLabel()}
          </p>
          <h1 className="text-[clamp(1.6rem,3.6vw,2.1rem)] font-semibold tracking-tight text-[var(--color-fg)]">
            {customer.email || "Your account"}
          </h1>
          <p className="mt-1 font-mono text-[12.5px] text-[var(--color-muted)]">
            {customer.id}
            {customer.externalRef ? ` · ${customer.externalRef}` : ""} · account {customer.state}
          </p>
        </div>
        {/* Sign-out placeholder — no real session yet. */}
        <button
          type="button"
          disabled
          title="A production portal signs you out of your authenticated session. This preview reads ?customer=."
          className="inline-flex cursor-not-allowed items-center rounded-lg border border-[var(--color-border)] px-3 py-2 text-[13px] text-[var(--color-muted)] opacity-70"
        >
          Sign out
        </button>
      </header>
      <p className="mb-2 text-[12.5px] text-[var(--color-muted)]">
        Preview note: production requires an authenticated login. This page reads <code className="font-mono">?customer=</code> because accounts are not live yet.
      </p>

      {/* ENTITLEMENTS */}
      <Section
        title="Active entitlements"
        sub="Access resolved server-side and fail-closed - only active, unexpired grants appear."
      >
        {activeIds.length === 0 ? (
          <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 text-[13.5px] text-[var(--color-muted)]">
            No active entitlements on this account yet. Free components are always installable; Pro items unlock with a
            pack or complete-catalog entitlement.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {activeIds.map((id) => {
              const { title, detail } = labelEntitlement(id);
              const items = includedItemNames(id)
                .map((n) => bySlug.get(n))
                .filter(Boolean) as NonNullable<ReturnType<typeof bySlug.get>>[];
              return (
                <li key={id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[14px] font-medium text-[var(--color-fg)]">{title}</p>
                    <code className="font-mono text-[11px] text-[var(--color-muted)]">{id}</code>
                  </div>
                  {detail ? <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-muted)]">{detail}</p> : null}
                  {items.length ? (
                    <p className="mt-2 text-[12px] text-[var(--color-muted)]">
                      Includes {items.length} item{items.length === 1 ? "" : "s"}:{" "}
                      {items.slice(0, 6).map((c) => c.name).join(", ")}
                      {items.length > 6 ? `, +${items.length - 6} more` : ""}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-3 text-[13px] text-[var(--color-muted)]">
          <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1">
            License: {licenseTypes.length ? licenseTypes.join(", ") : "-"}
          </span>
          <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1">
            Updates included until: {updateUntil != null ? fmtDate(updateUntil) : "to be finalized (docs/45)"}
          </span>
        </div>
        {updateUntil == null ? (
          <p className="mt-2 text-[12px] text-[var(--color-muted)]">
            You install editable source and keep it. An update-window policy is not yet finalized - we don’t claim
            lifetime updates.
          </p>
        ) : null}
      </Section>

      {/* INSTALL CONFIGURATION */}
      <Section
        title="Install configuration"
        sub="Add this to your project’s components.json, then set your token as an environment variable. The token is read from your environment - never committed, never placed in a URL."
      >
        <CodeBlock code={componentsJsonSnippet()} lang="jsonc" />
        <div className="mt-3 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-code-bg)] px-3 py-2">
          <code className="font-mono text-[12.5px] text-[var(--color-code-fg)]">
            export {TOKEN_ENV}=&lt;your token&gt;
          </code>
        </div>
        <p className="mt-2 text-[12px] text-[var(--color-muted)]">
          The token above is shown as the <code className="font-mono">{`\${${TOKEN_ENV}}`}</code> placeholder - your real
          token is only ever displayed once, at the moment you create or rotate it below.
        </p>
      </Section>

      {/* PACK / BLOCK INSTALL COMMANDS */}
      {entitledPacks.length ? (
        <Section title="Install your packs" sub="One command installs a pack’s block and every component it composes, as editable source.">
          <div className="flex flex-col gap-5">
            {entitledPacks.map((p) => (
              <div key={p.slug} className="rounded-xl border border-[var(--color-border)] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14px] font-medium text-[var(--color-fg)]">{p.name}</p>
                  <Link href={`/packs/${p.slug}`} className="text-[12.5px] text-[var(--color-accent)] hover:underline">
                    Pack page →
                  </Link>
                </div>
                <p className="mt-2 mb-1 text-[12.5px] text-[var(--color-muted)]">Whole pack (block + all components):</p>
                <InstallCommand command={packInstall(p)} />
                <p className="mt-3 mb-1 text-[12.5px] text-[var(--color-muted)]">Just the composed block:</p>
                <InstallCommand command={blockInstall(p)} />
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* INDIVIDUAL ITEM INSTALL COMMANDS */}
      <Section
        title="Install individual items"
        sub="Pro items resolve through your configured registry using the token above; Free items install from the public URL."
      >
        {(() => {
          const includedNames = new Set<string>(
            hasComplete ? catalog.map((c) => c.registryItem) : activeIds.flatMap((id) => includedItemNames(id)),
          );
          const proItems = catalog.filter((c) => c.access === "pro" && includedNames.has(c.registryItem));
          return (
            <div className="flex flex-col gap-4">
              {proItems.length ? (
                <div>
                  <p className="mb-2 text-[12.5px] font-medium text-[var(--color-fg)]">Your Pro items</p>
                  <div className="flex flex-col gap-2">
                    {proItems.map((c) => (
                      <div key={c.id} className="flex flex-col gap-1">
                        <p className="text-[12.5px] text-[var(--color-muted)]">
                          {c.name}
                          {packsContaining(c.registryItem).length
                            ? ` · in ${packsContaining(c.registryItem).join(", ")}`
                            : ""}
                        </p>
                        <InstallCommand command={namespacedInstall(c.registryItem)} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-[var(--color-muted)]">
                  No Pro items on this account yet. Free components install from their public URL below.
                </p>
              )}
              <div>
                <p className="mb-2 text-[12.5px] font-medium text-[var(--color-fg)]">Free components (installable by anyone)</p>
                <InstallCommand command={installCommand(catalog.find((c) => c.access === "free")?.registryItem ?? "utils")} />
                <p className="mt-1 text-[12px] text-[var(--color-muted)]">
                  Browse and copy per-component commands on each{" "}
                  <Link href="/components" className="text-[var(--color-accent)] hover:underline">component page</Link>.
                </p>
              </div>
            </div>
          );
        })()}
      </Section>

      {/* REGISTRY TOKENS */}
      <Section
        title="Registry tokens"
        sub="Tokens authenticate the shadcn CLI to your entitled Pro source. Only a short prefix is ever listed - the full token is shown once, at creation or rotation."
      >
        <TokenManager customerId={customer.id} tokens={tokens} tokenEnvVar={TOKEN_ENV} />
      </Section>

      {/* ACCOUNT & SUPPORT */}
      <Section title="Account & support">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
            <p className="text-[13px] font-medium text-[var(--color-fg)]">Billing</p>
            {commerce.customerPortalUrl ? (
              <a
                href={commerce.customerPortalUrl}
                className="mt-1 inline-block text-[13px] text-[var(--color-accent)] hover:underline"
              >
                Open billing portal →
              </a>
            ) : (
              <p className="mt-1 text-[13px] text-[var(--color-muted)]">Billing portal appears here once configured.</p>
            )}
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
            <p className="text-[13px] font-medium text-[var(--color-fg)]">Support</p>
            <a href={support.href} className="mt-1 inline-block text-[13px] text-[var(--color-accent)] hover:underline">
              {support.label} →
            </a>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
            <p className="text-[13px] font-medium text-[var(--color-fg)]">License terms</p>
            <a href={commerce.licenseUrl} className="mt-1 inline-block text-[13px] text-[var(--color-accent)] hover:underline">
              Review license →
            </a>
          </div>
        </div>
      </Section>
    </div>
  );
}
