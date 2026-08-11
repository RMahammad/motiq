// Typed loader for the single-source-of-truth product config (repo-root
// product.config.json). Import `product` and `installCommand()` everywhere the
// UI needs brand identity, registry namespace, or install commands — never
// hardcode the brand or namespace in components/pages/metadata.
import raw from "../../../product.config.json";

export interface ProductConfig {
  productName: string;
  shortName: string;
  description: string;
  tagline: string;
  /** Internal workspace npm scope — configurable, NEVER shown to visitors. */
  npmScope: string;
  /** Registry namespace for install commands. Listed in the shadcn CLI directory. */
  registryNamespace: string;
  registryBaseUrl: string;
  documentationUrl: string;
  githubUrl: string;
  supportUrl: string;
  /** External funding page (Ko-fi). Shown as the "Sponsor" CTA in docs. */
  sponsorUrl: string;
  defaultTheme: "light" | "dark";
  freeTierLabel: string;
  premiumTierLabel: string;
  /** True while the registry namespace/URL are placeholders, not final. */
  namespaceIsPreview: boolean;
  pricingFinalized: boolean;
  commerce: CommerceConfig;
}

export type LaunchMode = "development" | "private-preview" | "public-beta" | "launched";
export type CheckoutProvider = "none" | "stripe" | "lemon-squeezy" | "paddle";
export type AnalyticsProvider = "dev-logger" | "none" | "posthog" | "plausible" | "custom";
export type WaitlistProvider = "dev-store" | "none" | "email" | "custom";

/** Launch controls — see product.config.json `commerce` and docs/41. */
export interface CommerceConfig {
  productStatus: string;
  /** Current product phase. `private-preview-only` = docs/45 phase decision. */
  productPhase?: string;
  launchMode: LaunchMode;
  pricingEnabled: boolean;
  checkoutEnabled: boolean;
  waitlistEnabled: boolean;
  privateRegistryEnabled: boolean;
  /** Configurable private-preview cohort size (default 10). */
  previewCohortSize?: number;
  /** Configurable preview entitlement duration in days. */
  previewEntitlementDurationDays?: number;
  /** Documentation mirror of the owner's preview-terms approval. The RUNTIME
   *  gate uses env MOTIQ_PREVIEW_TERMS_APPROVED=1, not this flag. */
  previewTermsApproved?: boolean;
  individualComponentsEnabled: boolean;
  packsEnabled: boolean;
  completeCatalogEnabled: boolean;
  teamLicenseEnabled: boolean;
  agencyLicenseEnabled: boolean;
  currency: string;
  supportEmail: string;
  salesEmail: string;
  termsUrl: string;
  privacyUrl: string;
  licenseUrl: string;
  refundPolicyUrl: string;
  updatePolicyUrl: string;
  supportPolicyUrl: string;
  checkoutProvider: CheckoutProvider;
  analyticsProvider: AnalyticsProvider;
  waitlistProvider: WaitlistProvider;
  customerPortalUrl: string;
}

export const product = raw as ProductConfig;
export const commerce = product.commerce;

/**
 * User-facing shadcn install command for a registry item, from config. Uses the
 * `@motiq/<name>` namespace form: since shadcn-ui/ui#11220 merged (2026-08-11) the
 * namespace ships in the CLI's own registry directory, so it resolves with NO
 * `components.json` entry and no setup step — same zero-config guarantee the URL
 * form had, in a shorter command. Keep `registryUrlInstall()` for surfaces that
 * must work on CLI versions predating the directory.
 */
export function installCommand(itemName: string): string {
  return `npx shadcn@latest add ${product.registryNamespace}/${itemName}`;
}

/**
 * Extensionless registry-URL install form — the universal fallback that works on
 * any shadcn CLI version. The docs app rewrites `/r/<name>` to the generated
 * `/r/<name>.json` (see next.config.ts), so no `.json` shows in the command.
 */
export function registryUrlInstall(itemName: string): string {
  return `npx shadcn@latest add ${product.registryBaseUrl}/${itemName}`;
}
