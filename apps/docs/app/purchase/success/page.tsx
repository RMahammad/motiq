// Purchase-success flow (Server Component).
//
// Reads ?session or ?customer, but does NOT trust the URL alone. Access is
// re-derived server-side and fails closed. In this preview there is no live
// charge — entitlements are driven by the internal admin/webhook flow — so the
// page is honest about what a "success" URL does and does not mean. Tokens and
// Pro source are NEVER shown here; the portal issues tokens after verification.
import type { Metadata } from "next";
import Link from "next/link";

import { product, commerce } from "../../../lib/product";
import type { EntitlementId } from "../../../lib/commerce";
import { statusLabel } from "../../../lib/commerce";
import { stores } from "../../../lib/server/stores";
import { activeEntitlementIds } from "../../../lib/server/entitlement-service";
import { packBySlug } from "../../../lib/packs";
import { bySlug, catalog } from "../../../lib/catalog";
import { RefreshButton } from "./refresh-button";

export const dynamic = "force-dynamic"; // verification reads mutable stores

export const metadata: Metadata = {
  title: `Order status — ${product.productName}`,
  description: "We verify your access server-side before granting anything.",
  robots: { index: false }, // not a public/indexable page
};

type Status = "verifying" | "pending" | "active" | "failed" | "refunded" | "disputed";

function labelEntitlement(id: EntitlementId): string {
  if (id === "catalog.complete") return "Complete catalog";
  if (id === "license.team") return "Team license";
  if (id === "license.agency") return "Agency license";
  if (id.startsWith("pack.")) return packBySlug.get(id.slice("pack.".length))?.name ?? id;
  if (id.startsWith("block.")) return bySlug.get(id.slice("block.".length))?.name ?? id;
  if (id.startsWith("component.")) return bySlug.get(id.slice("component.".length))?.name ?? id;
  return id;
}

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

function supportHref(): { href: string; label: string } {
  if (commerce.supportEmail) return { href: `mailto:${commerce.supportEmail}`, label: commerce.supportEmail };
  if (product.supportUrl) return { href: product.supportUrl, label: "Contact support" };
  return { href: commerce.supportPolicyUrl || "/legal/support-policy", label: "Support" };
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-[760px] px-4 py-14 sm:px-6">{children}</div>;
}

function Badge({ status }: { status: Status }) {
  const map: Record<Status, { text: string; dot: string }> = {
    verifying: { text: "Verifying", dot: "var(--color-muted)" },
    pending: { text: "Processing", dot: "var(--color-warning, #d97706)" },
    active: { text: "Access granted", dot: "var(--color-success, #16a34a)" },
    failed: { text: "Not verified", dot: "var(--color-error, #dc2626)" },
    refunded: { text: "Refunded", dot: "var(--color-muted)" },
    disputed: { text: "Disputed", dot: "var(--color-warning, #d97706)" },
  };
  const s = map[status];
  return (
    <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12px] font-medium text-[var(--color-muted)]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} /> {s.text} · {statusLabel()}
    </p>
  );
}

export default async function PurchaseSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; customer?: string }>;
}) {
  const { session, customer: customerId } = await searchParams;
  const support = supportHref();

  // Resolve status server-side. We never trust the URL to grant access.
  let status: Status = "verifying";
  let activeIds: EntitlementId[] = [];
  let resolvedCustomerId: string | null = null;

  if (customerId) {
    const customer = await stores().customers.get(customerId);
    if (!customer) {
      status = "pending"; // an id we can't resolve yet — treat as still processing
    } else if (customer.state !== "active") {
      status = "failed";
    } else {
      resolvedCustomerId = customer.id;
      const active = await activeEntitlementIds(customerId);
      if (active.size > 0) {
        status = "active";
        activeIds = [...active].sort((a, b) =>
          a === "catalog.complete" ? -1 : b === "catalog.complete" ? 1 : a.localeCompare(b),
        );
      } else {
        // No active grant — inspect records to explain WHY (fail closed).
        const records = await stores().entitlements.forCustomer(customerId);
        if (records.some((e) => e.state === "refunded")) status = "refunded";
        else if (records.some((e) => e.state === "disputed")) status = "disputed";
        else if (records.some((e) => e.state === "revoked" || e.state === "suspended" || e.state === "expired")) status = "failed";
        else status = "pending"; // record not yet created / webhook still processing
      }
    }
  } else if (session) {
    // A session id alone cannot be verified here — the entitlement is created by
    // the (internal, in preview) webhook/admin flow keyed to the customer.
    status = "pending";
  } else {
    status = "verifying";
  }

  // ---- ACTIVE: access granted --------------------------------------------
  if (status === "active" && resolvedCustomerId) {
    const items = Array.from(new Set(activeIds.flatMap(includedItemNames)))
      .map((n) => bySlug.get(n))
      .filter(Boolean) as NonNullable<ReturnType<typeof bySlug.get>>[];
    return (
      <Shell>
        <Badge status="active" />
        <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          You’re all set
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">
          We verified your access server-side. Here’s what’s now unlocked on your account. Manage tokens and installation
          from your portal.
        </p>

        <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="text-[13px] font-medium text-[var(--color-fg)]">Entitlements granted</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {activeIds.map((id) => (
              <li key={id} className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-[13px] text-[var(--color-fg)]">
                {labelEntitlement(id)}
              </li>
            ))}
          </ul>
          {items.length ? (
            <>
              <p className="mt-4 text-[13px] font-medium text-[var(--color-fg)]">Included items ({items.length})</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-muted)]">
                {items.slice(0, 10).map((c) => c.name).join(", ")}
                {items.length > 10 ? `, +${items.length - 10} more` : ""}
              </p>
            </>
          ) : null}
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--color-border)] p-5">
          <p className="text-[13px] font-medium text-[var(--color-fg)]">Install your components</p>
          <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-[13.5px] leading-relaxed text-[var(--color-muted)]">
            <li>Open your portal and create a registry token (shown once).</li>
            <li>Add the registry to your <code className="font-mono">components.json</code> and set the token in your environment.</li>
            <li>Install any entitled item with the shadcn CLI — it authenticates with your token.</li>
          </ol>
          <p className="mt-2 text-[12px] text-[var(--color-muted)]">
            For your security, tokens and Pro source are never shown on this page — only in your authenticated portal.
          </p>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href={`/portal?customer=${encodeURIComponent(resolvedCustomerId)}`}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-accent-contrast,#fff)] transition-opacity hover:opacity-90"
          >
            Go to your portal
          </Link>
          <Link
            href="/components"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)]"
          >
            Browse components
          </Link>
          <a href={support.href} className="text-[13px] text-[var(--color-accent)] hover:underline">
            Need help? {support.label}
          </a>
        </div>
        <p className="mt-4 text-[12px] text-[var(--color-muted)]">
          Invoice / receipt will appear here once billing is connected.{" "}
          {session ? <span className="font-mono">Ref: {session}</span> : null}
        </p>
        <p className="mt-2 text-[12px] text-[var(--color-muted)]">
          Preview note: {statusLabel()} access is driven by the internal admin/webhook flow — no live charge is processed.
        </p>
      </Shell>
    );
  }

  // ---- REFUNDED / DISPUTED / FAILED --------------------------------------
  if (status === "refunded" || status === "disputed" || status === "failed") {
    const copy: Record<"refunded" | "disputed" | "failed", { h: string; p: string }> = {
      refunded: {
        h: "This order was refunded",
        p: "The entitlements from this purchase have been withdrawn and any registry tokens revoked. If you believe this is an error, contact support.",
      },
      disputed: {
        h: "This order is under dispute",
        p: "Access is paused while the payment dispute is reviewed. No source is delivered until it resolves.",
      },
      failed: {
        h: "We couldn’t verify access",
        p: "This account has no active entitlement. If you just completed setup, processing may still be underway — check again shortly or contact support.",
      },
    };
    const c = copy[status];
    return (
      <Shell>
        <Badge status={status} />
        <h1 className="text-[clamp(1.7rem,4vw,2.3rem)] font-semibold tracking-tight text-[var(--color-fg)]">{c.h}</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">{c.p}</p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          {status === "failed" ? <RefreshButton /> : null}
          <a
            href={support.href}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-accent-contrast,#fff)] transition-opacity hover:opacity-90"
          >
            Contact support
          </a>
          <Link href="/components" className="text-[13px] text-[var(--color-accent)] hover:underline">
            Explore components
          </Link>
        </div>
      </Shell>
    );
  }

  // ---- PENDING -----------------------------------------------------------
  if (status === "pending") {
    return (
      <Shell>
        <Badge status="pending" />
        <h1 className="text-[clamp(1.7rem,4vw,2.3rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          We’re finalizing your access
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">
          Your order reference was received, but the entitlement isn’t active yet. Access is granted by our webhook
          processing after the order is confirmed — this can take a moment and may not be complete right now.
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-muted)]">
          Nothing is unlocked until verification completes — we never grant access from the link alone. No tokens or
          source are shown until then.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <RefreshButton />
          {customerId ? (
            <Link
              href={`/portal?customer=${encodeURIComponent(customerId)}`}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)]"
            >
              Open your portal
            </Link>
          ) : null}
          <a href={support.href} className="text-[13px] text-[var(--color-accent)] hover:underline">
            Order not showing up? {support.label}
          </a>
        </div>
        <p className="mt-4 text-[12px] text-[var(--color-muted)]">
          {session ? <span className="font-mono">Ref: {session} · </span> : null}
          Preview note: in {statusLabel().toLowerCase()}, entitlements are created by the internal admin/webhook flow, not
          a live charge.
        </p>
      </Shell>
    );
  }

  // ---- VERIFYING (no identifiers at all) ---------------------------------
  return (
    <Shell>
      <Badge status="verifying" />
      <h1 className="text-[clamp(1.7rem,4vw,2.3rem)] font-semibold tracking-tight text-[var(--color-fg)]">
        Nothing to verify yet
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">
        This page confirms an order and unlocks access after server-side verification. It was opened without an order
        reference, so there’s nothing to check. If you reached here after an order, use the link from your confirmation.
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Link
          href="/portal"
          className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-accent-contrast,#fff)] transition-opacity hover:opacity-90"
        >
          Go to your portal
        </Link>
        <a href={support.href} className="text-[13px] text-[var(--color-accent)] hover:underline">
          {support.label}
        </a>
      </div>
    </Shell>
  );
}
