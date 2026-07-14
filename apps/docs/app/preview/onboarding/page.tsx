// PREVIEW-GRADE onboarding (Server Component).
//
// Reads ?customer=<id> because there is NO authenticated login yet (a production
// version resolves the customer from an authenticated session, never a URL). This
// page walks an activated preview participant through: what the preview includes,
// which packs exist, which features are unfinished, creating a registry token,
// configuring components.json (with the ${MOTIONKIT_TOKEN} placeholder — NEVER a
// real token), installing Free/Pro/block/pack items, rotating/revoking a token,
// where to report bugs / request components, expiration, and the honest limits of
// preview participation.
//
// SECRET-SAFE: every example uses the ${MOTIONKIT_TOKEN} placeholder. The only
// place a real token appears is the one-time reveal in the client token widget.
import type { Metadata } from "next";
import Link from "next/link";

import { product, commerce, installCommand, namespacedInstall } from "../../../lib/product";
import { statusLabel } from "../../../lib/commerce";
import type { EntitlementId } from "../../../lib/commerce";
import { stores } from "../../../lib/server/stores";
import { activeEntitlementIds } from "../../../lib/server/entitlement-service";
import { listTokenMeta } from "../../../lib/server/tokens";
import { packs } from "../../../lib/packs";
import { catalog } from "../../../lib/catalog";
import { InstallCommand, CodeBlock } from "../../_components/code-block";
import { PreviewTokenWidget } from "../token-widget";

export const dynamic = "force-dynamic"; // per-customer, reads mutable stores

export const metadata: Metadata = {
  title: `Preview onboarding — ${product.productName}`,
  description: "Get set up with your private-preview access: tokens, install configuration, and what the preview includes.",
};

// Env-var name the shadcn CLI reads the bearer token from (derived from brand).
const TOKEN_ENV = `${product.shortName.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}_TOKEN`;

function registryApiUrl(): string {
  try {
    return `${new URL(product.registryBaseUrl).origin}/api/registry/{name}`;
  } catch {
    return "/api/registry/{name}";
  }
}

function componentsJsonSnippet(): string {
  // The Authorization header references the token via an env placeholder — the
  // real token is NEVER written into components.json or shown here.
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

function previewTermsApproved(): boolean {
  // The RUNTIME gate is the env var, not the config mirror (see product.config.json).
  return process.env.MOTIONKIT_PREVIEW_TERMS_APPROVED === "1";
}

function fmtDate(ms: number | null): string {
  if (ms == null) return "—";
  return new Date(ms).toLocaleDateString();
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[var(--color-border)] py-7">
      <div className="flex items-baseline gap-3">
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[12px] font-medium text-[var(--color-fg)]">
          {n}
        </span>
        <h2 className="text-lg font-semibold tracking-tight text-[var(--color-fg)]">{title}</h2>
      </div>
      <div className="mt-3 pl-9">{children}</div>
    </section>
  );
}

function NoCustomer() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-16 sm:px-6">
      <p className="mb-3 inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12px] font-medium text-[var(--color-muted)]">
        Preview onboarding · {statusLabel()}
      </p>
      <h1 className="text-[clamp(1.8rem,4vw,2.4rem)] font-semibold tracking-tight text-[var(--color-fg)]">
        Activate your preview to begin
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">
        Onboarding is personalized to your activated preview account. In production you will reach this page through an
        authenticated login — your access, tokens, and install configuration are resolved from your session, never from a
        link you can share or edit.
      </p>
      <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-muted)]">
        Accounts are not live during {statusLabel().toLowerCase()}. Once your access request is approved and activated,
        your onboarding link will include your customer id.
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

export default async function PreviewOnboardingPage({
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
          href="/access"
          className="mt-8 inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)]"
        >
          Request access
        </Link>
      </div>
    );
  }

  const active = await activeEntitlementIds(customerId);
  const entRecords = await stores().entitlements.forCustomer(customerId);
  const tokens = await listTokenMeta(customerId);
  const hasComplete = active.has("catalog.complete");
  const entitledPacks = packs.filter((p) => hasComplete || active.has(`pack.${p.slug}` as EntitlementId));

  // Preview expiry = the max expiresAt across active preview grants (honest —
  // null when no time-boxed grant is present).
  const now = Date.now();
  const previewExpiries = entRecords
    .filter((e) => e.state === "active" && e.expiresAt != null && e.expiresAt > now)
    .map((e) => e.expiresAt as number);
  const previewExpiresAt = previewExpiries.length ? Math.max(...previewExpiries) : null;

  const firstFree = catalog.find((c) => c.access === "free");
  const firstProEntitled = catalog.find((c) => c.access === "pro" && (hasComplete || active.has(`component.${c.registryItem}` as EntitlementId) || entitledPacks.some((p) => p.components.includes(c.registryItem))));
  const termsOk = previewTermsApproved();

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      {/* Header */}
      <header className="mb-2">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12px] text-[var(--color-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> Preview onboarding · {statusLabel()}
        </p>
        <h1 className="text-[clamp(1.7rem,3.6vw,2.2rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          Welcome to the {product.productName} private preview
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--color-muted)]">
          You’re set up as <span className="font-medium text-[var(--color-fg)]">{customer.email || "a preview participant"}</span>.
          This guide gets your registry configured and your first component installed. Everything you install is editable
          source you keep.
        </p>
        <p className="mt-2 font-mono text-[12px] text-[var(--color-muted)]">{customer.id}</p>
      </header>

      {/* Honest preview banner */}
      <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 text-[13px] leading-relaxed text-[var(--color-muted)]">
        This is a <span className="font-medium text-[var(--color-fg)]">private preview</span>, not a sale. There is no
        guarantee of final pricing or permanent access, and preview builds may change without the update guarantees a paid
        launch would carry. Preview terms are{" "}
        <span className="font-medium text-[var(--color-fg)]">{termsOk ? "approved for this environment" : "not yet approved (pending owner sign-off)"}</span>.
      </div>

      {/* What the preview includes */}
      <section className="border-t border-[var(--color-border)] py-7">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--color-fg)]">What your preview includes</h2>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[var(--color-muted)]">
          Free components are installable by anyone. Your preview entitlement additionally unlocks the Pro source below as
          editable code, resolved through your registry token.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[13px] font-medium text-[var(--color-fg)]">Your active access</p>
            {active.size === 0 ? (
              <p className="mt-1 text-[12.5px] text-[var(--color-muted)]">
                No active entitlements yet. Free components are always installable.
              </p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {[...active].map((id) => (
                  <li key={id} className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 font-mono text-[11px] text-[var(--color-muted)]">
                    {id}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[13px] font-medium text-[var(--color-fg)]">Preview expires</p>
            <p className="mt-1 text-[12.5px] text-[var(--color-muted)]">
              {previewExpiresAt != null ? fmtDate(previewExpiresAt) : "No time-boxed grant on file yet."}
              {commerce.previewEntitlementDurationDays
                ? ` · previews run ~${commerce.previewEntitlementDurationDays} days`
                : ""}
            </p>
          </div>
        </div>
      </section>

      {/* Available packs */}
      <section className="border-t border-[var(--color-border)] py-7">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--color-fg)]">Available packs</h2>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[var(--color-muted)]">
          Each pack composes several components into one complete workflow block. Packs you can install now are marked.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {packs.map((p) => {
            const entitled = entitledPacks.some((ep) => ep.slug === p.slug);
            return (
              <li key={p.slug} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14px] font-medium text-[var(--color-fg)]">{p.name}</p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] ${
                      entitled
                        ? "border-[var(--color-accent)] text-[var(--color-fg)]"
                        : "border-[var(--color-border)] text-[var(--color-muted)]"
                    }`}
                  >
                    {entitled ? "Included" : "Not in your preview"}
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-muted)]">{p.tagline}</p>
                <p className="mt-2 text-[11.5px] text-[var(--color-muted)]">
                  {p.components.length} components → {p.blockName}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Unfinished features */}
      <section className="border-t border-[var(--color-border)] py-7">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--color-fg)]">What’s unfinished (stated plainly)</h2>
        <ul className="mt-3 flex flex-col gap-2 text-[13px] leading-relaxed text-[var(--color-muted)]">
          <li>• <span className="font-medium text-[var(--color-fg)]">Dev-mock entitlement provider.</span> Tokens are preview fixtures; there is no real billing or identity system behind them yet.</li>
          <li>• <span className="font-medium text-[var(--color-fg)]">File-backed store.</span> Access + audit state uses a file store, not a production database — fine for a small cohort, not a scale or HA guarantee.</li>
          <li>• <span className="font-medium text-[var(--color-fg)]">No checkout.</span> No payment is taken and no purchase flow runs. Participation is not a sale.</li>
          <li>• <span className="font-medium text-[var(--color-fg)]">Draft legal terms.</span> License, Terms, Privacy, Refund, Update, and Support pages are drafts pending review.</li>
          <li>• <span className="font-medium text-[var(--color-fg)]">Preview builds may change</span> without paid-launch update/versioning guarantees.</li>
        </ul>
        <p className="mt-3 text-[12px] text-[var(--color-muted)]">Source: private-preview runbook (docs/47).</p>
      </section>

      {/* Step 1 — create a token */}
      <Step n={1} title="Create a registry token">
        <p className="mb-4 max-w-2xl text-[13.5px] leading-relaxed text-[var(--color-muted)]">
          Your token authenticates the shadcn CLI to your entitled Pro source. It is shown in full{" "}
          <span className="font-medium text-[var(--color-fg)]">exactly once</span>, at creation or rotation — copy it
          immediately. Afterwards only a short prefix is listed.
        </p>
        <PreviewTokenWidget customerId={customer.id} tokens={tokens} tokenEnvVar={TOKEN_ENV} />
      </Step>

      {/* Step 2 — configure components.json */}
      <Step n={2} title="Configure components.json">
        <p className="mb-3 max-w-2xl text-[13.5px] leading-relaxed text-[var(--color-muted)]">
          Add your registry to <code className="font-mono">components.json</code>. The token is referenced through an
          environment placeholder — <span className="font-medium text-[var(--color-fg)]">never paste the real token here</span>.
        </p>
        <CodeBlock code={componentsJsonSnippet()} lang="jsonc" />
        <div className="mt-3 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-code-bg)] px-3 py-2">
          <code className="font-mono text-[12.5px] text-[var(--color-code-fg)]">export {TOKEN_ENV}=&lt;your token&gt;</code>
        </div>
        <p className="mt-2 text-[12px] text-[var(--color-muted)]">
          The CLI reads <code className="font-mono">{`\${${TOKEN_ENV}}`}</code> from your environment at install time. Keep it
          out of version control and out of URLs.
        </p>
      </Step>

      {/* Step 3 — install components */}
      <Step n={3} title="Install components">
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-1.5 text-[12.5px] font-medium text-[var(--color-fg)]">
              A Free component (installable by anyone, from the public URL)
            </p>
            <InstallCommand command={installCommand(firstFree?.registryItem ?? "utils")} />
          </div>
          <div>
            <p className="mb-1.5 text-[12.5px] font-medium text-[var(--color-fg)]">
              A Pro component (resolves through your token-authenticated registry)
            </p>
            {firstProEntitled ? (
              <InstallCommand command={namespacedInstall(firstProEntitled.registryItem)} />
            ) : (
              <p className="text-[13px] text-[var(--color-muted)]">
                No Pro component is in your current preview. Pro items unlock via a pack or the complete catalog.
              </p>
            )}
          </div>
          {entitledPacks.length ? (
            <>
              <div>
                <p className="mb-1.5 text-[12.5px] font-medium text-[var(--color-fg)]">A block (a composed workflow)</p>
                <InstallCommand command={namespacedInstall(entitledPacks[0].blockSlug)} />
              </div>
              <div>
                <p className="mb-1.5 text-[12.5px] font-medium text-[var(--color-fg)]">
                  A pack (its block + every component it composes)
                </p>
                <InstallCommand command={namespacedInstall(entitledPacks[0].packRegistryItem)} />
              </div>
            </>
          ) : (
            <p className="text-[13px] text-[var(--color-muted)]">
              Block and pack install commands appear here once a pack is included in your preview.
            </p>
          )}
        </div>
      </Step>

      {/* Step 4 — rotate/revoke */}
      <Step n={4} title="Rotate or revoke a token">
        <p className="max-w-2xl text-[13.5px] leading-relaxed text-[var(--color-muted)]">
          Use the widget in Step 1. <span className="font-medium text-[var(--color-fg)]">Rotate</span> issues a fresh token
          and immediately revokes the previous one (returning the new plaintext once). <span className="font-medium text-[var(--color-fg)]">Revoke</span>{" "}
          stops a token on its next registry request. If you suspect a token leaked, rotate or revoke it right away.
        </p>
      </Step>

      {/* Where to go next */}
      <section className="border-t border-[var(--color-border)] py-7">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--color-fg)]">Where to go next</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link href={`/preview/dashboard?customer=${encodeURIComponent(customer.id)}`} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]">
            <p className="text-[13px] font-medium text-[var(--color-fg)]">Your preview dashboard →</p>
            <p className="mt-1 text-[12.5px] text-[var(--color-muted)]">Access status, tokens, and install commands in one place.</p>
          </Link>
          <Link href="/updates" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]">
            <p className="text-[13px] font-medium text-[var(--color-fg)]">Product updates →</p>
            <p className="mt-1 text-[12.5px] text-[var(--color-muted)]">What changed in recent preview builds.</p>
          </Link>
          <Link href="/preview/feedback" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]">
            <p className="text-[13px] font-medium text-[var(--color-fg)]">Report a bug →</p>
            <p className="mt-1 text-[12.5px] text-[var(--color-muted)]">Tell us what broke — install issues, states, motion, a11y.</p>
          </Link>
          <Link href="/preview/feedback" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]">
            <p className="text-[13px] font-medium text-[var(--color-fg)]">Request a component →</p>
            <p className="mt-1 text-[12.5px] text-[var(--color-muted)]">Missing a workflow? Ask for it through the same feedback channel.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
