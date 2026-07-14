// Commercial model layer for the docs/storefront surface.
//
// This module holds *presentation-side* commercial metadata and the launch-mode
// logic that decides which CTAs and prices are allowed to render. It deliberately
// contains NO secrets and NO final prices — concrete prices and legal terms live
// behind human sign-off (docs/41) and, at runtime, come only from an approved
// provider. Entitlement *enforcement* is server-only (see app/api + lib/server).
//
// Keep commercial metadata separate from visual catalog metadata: catalog.ts owns
// what a component looks like; this file owns what it costs and who may install it.
import { commerce, product, type LaunchMode } from "./product";

/** Stable entitlement identifiers. These are the ONLY contract between the
 *  storefront, the entitlement layer, and the protected registry. Format:
 *  `<kind>.<slug>` for items, `catalog.complete`, `license.<name>`. */
export type EntitlementId =
  | `component.${string}`
  | `block.${string}`
  | `pack.${string}`
  | "catalog.complete"
  | "license.team"
  | "license.agency";

export type AccessStatus =
  | "free" // installable now, no entitlement
  | "pro" // requires a Pro / pack / catalog entitlement
  | "pack" // available as part of a pack purchase
  | "complete" // available in the complete catalog
  | "preview" // visible, source gated, not yet purchasable
  | "coming-soon" // announced, not built
  | "experimental"; // shipped but rough / flagged

export type PurchaseState = "none" | "pending" | "active" | "refunded" | "revoked" | "expired";

/** A sellable product tier shown on pricing/storefront surfaces. */
export interface ProductTier {
  id: string;
  name: string;
  /** What the buyer gets, in concrete terms (no vague adjectives). */
  summary: string;
  /** Entitlements this tier grants. */
  grants: EntitlementId[];
  /** Whether this tier is enabled in the current launch config. */
  enabled: boolean;
  /** Slot for a price; null until pricing is approved. Never invent a value. */
  priceSlot: PricingSlot;
}

/** A license option (usage rights). Terms are drafts until legal sign-off. */
export interface LicenseOption {
  id: EntitlementId | string;
  name: string;
  /** One-line description of intended scope; not a legal promise. */
  scope: string;
  enabled: boolean;
  status: DecisionStatus;
}

/** A pricing slot. `amount` stays null until pricingFinalized + pricingEnabled. */
export interface PricingSlot {
  key: string;
  label: string;
  amount: number | null;
  currency: string;
  status: DecisionStatus;
}

export type DecisionStatus = "open" | "proposed" | "approved" | "rejected" | "deferred";

/** A customer's entitlement snapshot (server-derived; never trusted from client). */
export interface CustomerEntitlement {
  customerId: string;
  entitlements: EntitlementId[];
  state: PurchaseState;
}

/** Result of checking whether a registry item may be delivered. */
export interface RegistryEntitlement {
  itemName: string;
  required: EntitlementId | null; // null => free/public
  granted: boolean;
  reason: "free" | "entitled" | "no-token" | "invalid-token" | "not-entitled" | "revoked";
}

/** An item in a (future) checkout. No live checkout runs until approved. */
export interface CheckoutItem {
  entitlementId: EntitlementId;
  name: string;
  priceSlot: PricingSlot;
  quantity: number;
}

// ---------------------------------------------------------------------------
// Launch-mode CTA logic — the single place that decides what the visitor sees.
// ---------------------------------------------------------------------------

export type CtaKind =
  | "install-free"
  | "join-waitlist"
  | "request-access"
  | "buy-pack"
  | "get-complete-catalog"
  | "contact-sales"
  | "explore-components";

export interface Cta {
  kind: CtaKind;
  label: string;
  /** Honest, non-committal helper text shown under/near the CTA. */
  note?: string;
  href?: string;
  /** Analytics event name emitted on click. */
  event: string;
}

const FALLBACK = {
  waitlist: "Join the launch list",
  requestAccess: "Request early access",
  pricingTbd: "Pricing to be finalized",
  previewOnly: "Available during private preview",
  proSoon: "Pro access coming soon",
  teamContact: "Contact us for team access",
};

/** Whether a concrete price value is allowed to render right now. */
export function canShowPrice(): boolean {
  return commerce.pricingEnabled && product.pricingFinalized;
}

/** Whether purchase buttons may render right now. */
export function canCheckout(): boolean {
  return commerce.checkoutEnabled && commerce.checkoutProvider !== "none";
}

export function launchMode(): LaunchMode {
  return commerce.launchMode;
}

/** The primary access CTA for a pack, derived entirely from launch config. */
export function packPrimaryCta(packSlug: string): Cta {
  const explore: Cta = {
    kind: "explore-components",
    label: "Explore components",
    href: `/packs/${packSlug}#included`,
    event: "pack_explore_clicked",
  };
  if (canCheckout() && commerce.packsEnabled) {
    return {
      kind: "buy-pack",
      label: canShowPrice() ? "Buy pack" : "Get this pack",
      note: canShowPrice() ? undefined : FALLBACK.pricingTbd,
      href: `/packs/${packSlug}#access`,
      event: "pack_cta_clicked",
    };
  }
  if (commerce.waitlistEnabled) {
    return {
      kind: launchMode() === "public-beta" ? "join-waitlist" : "request-access",
      label: launchMode() === "public-beta" ? FALLBACK.waitlist : FALLBACK.requestAccess,
      note: FALLBACK.previewOnly,
      href: `/access?pack=${packSlug}`,
      event: "access_cta_clicked",
    };
  }
  return explore;
}

/** Complete-catalog CTA (shown on index/pricing surfaces). */
export function completeCatalogCta(): Cta {
  if (canCheckout() && commerce.completeCatalogEnabled) {
    return {
      kind: "get-complete-catalog",
      label: "Get the complete catalog",
      note: canShowPrice() ? undefined : FALLBACK.pricingTbd,
      href: "/access?tier=complete",
      event: "complete_catalog_cta_clicked",
    };
  }
  return {
    kind: commerce.waitlistEnabled ? "request-access" : "explore-components",
    label: commerce.waitlistEnabled ? FALLBACK.requestAccess : "Explore the catalog",
    note: commerce.waitlistEnabled ? FALLBACK.previewOnly : undefined,
    href: commerce.waitlistEnabled ? "/access?tier=complete" : "/components",
    event: commerce.waitlistEnabled ? "access_cta_clicked" : "catalog_explore_clicked",
  };
}

/** The CTA for a Pro component (free items never call this). */
export function proComponentCta(slug: string): Cta {
  if (canCheckout() && commerce.individualComponentsEnabled) {
    return {
      kind: "buy-pack",
      label: "Get Pro access",
      note: canShowPrice() ? undefined : FALLBACK.pricingTbd,
      href: `/access?component=${slug}`,
      event: "pro_cta_clicked",
    };
  }
  return {
    kind: commerce.waitlistEnabled ? "request-access" : "explore-components",
    label: commerce.waitlistEnabled ? FALLBACK.requestAccess : "See what's included",
    note: FALLBACK.proSoon,
    href: commerce.waitlistEnabled ? `/access?component=${slug}` : "/packs",
    event: commerce.waitlistEnabled ? "access_cta_clicked" : "pack_explore_clicked",
  };
}

/** Team/agency contact CTA. */
export function teamCta(): Cta | null {
  if (!commerce.teamLicenseEnabled && !commerce.agencyLicenseEnabled) {
    return {
      kind: "contact-sales",
      label: FALLBACK.teamContact,
      note: "Team and agency access are being finalized.",
      href: commerce.salesEmail ? `mailto:${commerce.salesEmail}` : "/access?tier=team",
      event: "contact_sales_clicked",
    };
  }
  return {
    kind: "contact-sales",
    label: "Contact sales",
    href: commerce.salesEmail ? `mailto:${commerce.salesEmail}` : "/access?tier=team",
    event: "contact_sales_clicked",
  };
}

/** Honest product-status label for badges/hero. */
export function statusLabel(): string {
  switch (launchMode()) {
    case "development":
      return "In development";
    case "private-preview":
      return "Private preview";
    case "public-beta":
      return "Public beta";
    case "launched":
      return "Available now";
  }
}

/** Whether upcoming/announced products should be marked non-purchasable. */
export const upcomingPacks = [
  { slug: "mobile-interaction", name: "Mobile Interaction Pack", progress: "2 / 4 components" },
  { slug: "commerce-motion", name: "Commerce Motion Pack", progress: "Planned" },
  { slug: "file-workflow", name: "File Workflow Pack", progress: "Planned" },
  { slug: "security-account", name: "Security & Account Pack", progress: "Planned" },
] as const;
