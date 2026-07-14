// SERVER-ONLY entitlement lifecycle. The one place that CREATES, RESOLVES, and
// REVOKES entitlements. Webhook processing, checkout success, preview
// activation, and the staging test all go through here — never mutate records
// directly. Access resolution FAILS CLOSED (only active + unexpired grants).
import { stores, newId } from "./stores";
import { entitlementGrants } from "./model";
import type { CustomerRecord, EntitlementRecord, EntitlementState, LicenseType } from "./model";
import type { EntitlementId } from "../commerce";
import { revokeToken } from "./tokens";

// --- customers -------------------------------------------------------------

export async function ensureCustomer(input: {
  email?: string | null;
  externalRef?: string | null;
  organizationId?: string | null;
}): Promise<CustomerRecord> {
  const s = stores();
  if (input.externalRef) {
    const existing = await s.customers.getByExternalRef(input.externalRef);
    if (existing) return existing;
  }
  if (input.email) {
    const existing = await s.customers.getByEmail(input.email);
    if (existing) return existing;
  }
  const now = Date.now();
  const rec: CustomerRecord = {
    id: newId("cust"),
    email: input.email ?? null,
    externalRef: input.externalRef ?? null,
    state: "active",
    organizationId: input.organizationId ?? null,
    createdAt: now,
    updatedAt: now,
    metadata: {},
  };
  return s.customers.upsert(rec);
}

// --- grant -----------------------------------------------------------------

export interface GrantInput {
  customerId: string;
  entitlementId: EntitlementId;
  licenseType: LicenseType;
  purchaseId?: string | null;
  source: string; // "webhook" | "checkout" | "preview-activation" | "staging-test"
  expiresAt?: number | null;
  organizationId?: string | null;
  seatCount?: number;
  updateUntil?: number | null;
  metadata?: Record<string, string>;
}

export async function grantEntitlement(input: GrantInput): Promise<EntitlementRecord> {
  const now = Date.now();
  const rec: EntitlementRecord = {
    id: newId("ent"),
    customerId: input.customerId,
    entitlementId: input.entitlementId,
    licenseType: input.licenseType,
    purchaseId: input.purchaseId ?? null,
    state: "active",
    createdAt: now,
    updatedAt: now,
    expiresAt: input.expiresAt ?? null,
    revokedAt: null,
    refundedAt: null,
    organizationId: input.organizationId ?? null,
    seatCount: input.seatCount ?? 1,
    updateUntil: input.updateUntil ?? null,
    metadata: input.metadata ?? {},
    history: [{ at: now, from: null, to: "active", reason: "granted", source: input.source }],
  };
  return stores().entitlements.upsert(rec);
}

async function transition(
  rec: EntitlementRecord,
  to: EntitlementState,
  reason: string,
  source: string,
): Promise<EntitlementRecord> {
  const now = Date.now();
  const next: EntitlementRecord = {
    ...rec,
    state: to,
    updatedAt: now,
    revokedAt: to === "revoked" || to === "suspended" ? now : rec.revokedAt,
    refundedAt: to === "refunded" ? now : rec.refundedAt,
    history: [...rec.history, { at: now, from: rec.state, to, reason, source }],
  };
  return stores().entitlements.upsert(next);
}

/** Revoke every active/pending entitlement for a customer + revoke their tokens. */
export async function revokeCustomer(
  customerId: string,
  reason: string,
  source: string,
  to: Extract<EntitlementState, "revoked" | "refunded" | "suspended"> = "revoked",
): Promise<{ entitlements: number; tokens: number }> {
  const s = stores();
  const ents = await s.entitlements.forCustomer(customerId);
  let changed = 0;
  for (const e of ents) {
    if (e.state === "active" || e.state === "pending" || e.state === "disputed") {
      await transition(e, to, reason, source);
      changed++;
    }
  }
  // Revoke registry tokens so future protected downloads fail immediately.
  const toks = await s.tokens.forCustomer(customerId);
  let tokRevoked = 0;
  for (const t of toks) {
    if (t.revokedAt == null) {
      await revokeToken(t.id);
      tokRevoked++;
    }
  }
  return { entitlements: changed, tokens: tokRevoked };
}

/** Apply a refund to a specific purchase (revokes the purchase's entitlements). */
export async function refundPurchase(purchaseId: string, source: string): Promise<{ entitlements: number; customers: number }> {
  const ents = await stores().entitlements.byPurchase(purchaseId);
  const customers = new Set<string>();
  let changed = 0;
  for (const e of ents) {
    if (e.state === "active" || e.state === "pending" || e.state === "disputed") {
      await transition(e, "refunded", "refund", source);
      customers.add(e.customerId);
      changed++;
    }
  }
  // Revoke tokens for affected customers (fail-closed after refund).
  for (const cid of customers) {
    const toks = await stores().tokens.forCustomer(cid);
    for (const t of toks) if (t.revokedAt == null) await revokeToken(t.id);
  }
  return { entitlements: changed, customers: customers.size };
}

// --- resolve (fail closed) -------------------------------------------------

/**
 * The set of entitlement ids currently GRANTING for a customer, including any
 * organization-level entitlements. Only active + unexpired records count.
 */
export async function activeEntitlementIds(customerId: string, nowMs = Date.now()): Promise<Set<EntitlementId>> {
  const s = stores();
  const out = new Set<EntitlementId>();
  const customer = await s.customers.get(customerId);
  if (!customer || customer.state !== "active") return out; // suspended customer → nothing

  const personal = await s.entitlements.forCustomer(customerId);
  for (const e of personal) if (entitlementGrants(e, nowMs)) out.add(e.entitlementId);

  const orgId = customer.organizationId;
  if (orgId) {
    const org = await s.organizations.get(orgId);
    if (org && org.state === "active") {
      const orgEnts = await s.entitlements.forOrganization(orgId);
      for (const e of orgEnts) if (entitlementGrants(e, nowMs)) out.add(e.entitlementId);
      for (const id of org.entitlementIds) out.add(id);
    }
  }
  return out;
}
