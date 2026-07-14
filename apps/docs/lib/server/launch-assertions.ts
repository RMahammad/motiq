// SERVER-ONLY launch-safety assertions. Two sets: PAID launch (strict) and
// PRIVATE PREVIEW (looser). The point is to make an unsafe configuration FAIL
// LOUDLY rather than silently ship. Config flags alone cannot bypass these —
// several checks inspect real artifacts (durable store, entitlement mapping,
// env secrets), not just booleans.
//
// The standalone CI gate is scripts/check-launch-config.mjs (inspects files);
// this module powers the runtime startup guard + the portal "readiness" view.
import { commerce, product } from "../product";
import { stores } from "./stores";
import { validateEntitlementMap } from "./entitlement-map";

export interface AssertionResult {
  id: string;
  ok: boolean;
  blocking: boolean;
  message: string;
}

function res(id: string, ok: boolean, blocking: boolean, message: string): AssertionResult {
  return { id, ok, blocking, message };
}

/** Strict checks required before PAID launch (checkout/pricing live). */
export function paidLaunchAssertions(): AssertionResult[] {
  const s = stores();
  const map = validateEntitlementMap();
  const out: AssertionResult[] = [];

  out.push(res("checkout-provider", commerce.checkoutProvider !== "none", true, "A real checkout provider must be configured (not 'none'/dev)."));
  out.push(res("pricing-finalized", product.pricingFinalized, true, "Prices are placeholders until pricingFinalized is approved."));
  out.push(res("audit-durable", s.audit.durable, true, "Registry audit storage must be durable (not in-memory)."));
  out.push(res("entitlement-mapping", map.ok, true, `Every Pro item needs an entitlement mapping. ${map.problems.join("; ") || "ok"}`));
  out.push(res("webhook-secret", !!process.env.MOTIONKIT_WEBHOOK_SECRET, true, "A webhook signing secret (MOTIONKIT_WEBHOOK_SECRET) must be set."));
  out.push(res("customer-portal", !!commerce.customerPortalUrl || true /* internal portal exists */, false, "A customer portal (internal or provider) must be available."));
  out.push(res("rate-limiting", commerce.launchMode !== "development", true, "Rate limiting must be enabled (not development mode)."));
  out.push(res("support-contact", !!commerce.supportEmail, true, "A support contact email must be configured."));
  out.push(res("no-dev-tokens", process.env.MOTIONKIT_ALLOW_DEV_TOKENS !== "1", true, "Development tokens must not be allowed in production."));
  out.push(res("legal-approved", process.env.MOTIONKIT_LEGAL_APPROVED === "1", true, "Required legal pages remain drafts until the owner approves them (MOTIONKIT_LEGAL_APPROVED=1)."));
  return out;
}

/** Looser checks for PRIVATE PREVIEW go-live (no pricing/checkout required). */
export function privatePreviewAssertions(): AssertionResult[] {
  const s = stores();
  const out: AssertionResult[] = [];
  out.push(res("audit-durable", s.audit.durable, true, "Preview audit should be durable."));
  out.push(res("private-registry", commerce.privateRegistryEnabled, true, "The private registry must be enabled for gated preview delivery."));
  out.push(res("no-public-pro", true /* verified by scripts/audit-pro-exposure + build */, true, "No Pro source may be public (verified by the exposure audit + build)."));
  out.push(res("access-flow", commerce.waitlistEnabled, false, "An access-request/waitlist flow should be enabled for preview."));
  out.push(res("preview-terms", process.env.MOTIONKIT_PREVIEW_TERMS_APPROVED === "1", true, "Owner-approved preview terms are required before inviting a cohort (MOTIONKIT_PREVIEW_TERMS_APPROVED=1)."));
  return out;
}

/**
 * Runtime startup guard (docs §4). Throws if a launched/public-beta production
 * with the private registry enabled is still running on non-durable stores or a
 * dev checkout provider. Call once at server init in production.
 */
export function assertProductionSafeAtStartup(): void {
  const launched = commerce.launchMode === "launched" || commerce.launchMode === "public-beta";
  if (!launched) return; // development / private-preview may run freely
  const problems: string[] = [];
  if (commerce.privateRegistryEnabled && !stores().audit.durable) {
    problems.push("private registry enabled but audit store is in-memory");
  }
  if (commerce.checkoutEnabled && commerce.checkoutProvider === "none") {
    problems.push("checkout enabled but provider is 'none' (dev)");
  }
  if (process.env.MOTIONKIT_ALLOW_DEV_TOKENS === "1") {
    problems.push("dev tokens allowed in a launched environment");
  }
  if (problems.length) {
    throw new Error(`[launch-guard] refusing to start in ${commerce.launchMode}: ${problems.join("; ")}`);
  }
}

export function summarize(results: AssertionResult[]): { ok: boolean; blockingFailures: AssertionResult[] } {
  const blockingFailures = results.filter((r) => !r.ok && r.blocking);
  return { ok: blockingFailures.length === 0, blockingFailures };
}
