// SERVER-ONLY commercial data model. Shared by the durable stores, the registry
// route, webhook processing, the portal, and the staging lifecycle test.
//
// Everything here is provider-neutral: no vendor field names, no SDK types. A
// real billing/auth provider maps ONTO these shapes in an adapter file.
import type { EntitlementId } from "../commerce";

// ---------------------------------------------------------------------------
// Entitlement lifecycle — access FAILS CLOSED. Only `active` (and unexpired)
// grants. Any unknown/other state denies.
// ---------------------------------------------------------------------------
export type EntitlementState =
  | "active"
  | "pending"
  | "expired"
  | "revoked"
  | "refunded"
  | "disputed"
  | "suspended";

/** The single predicate that decides whether an entitlement currently grants. */
export function entitlementGrants(e: Pick<EntitlementRecord, "state" | "expiresAt">, nowMs: number): boolean {
  if (e.state !== "active") return false;
  if (e.expiresAt != null && e.expiresAt <= nowMs) return false;
  return true;
}

export type LicenseType = "personal" | "team" | "agency" | "preview";

export interface EntitlementRecord {
  id: string; // internal record id
  customerId: string;
  entitlementId: EntitlementId; // e.g. pack.ai-interface, catalog.complete
  licenseType: LicenseType;
  purchaseId: string | null; // provider purchase/order id (null for preview grants)
  state: EntitlementState;
  createdAt: number;
  updatedAt: number;
  expiresAt: number | null; // preview grants + limited-update windows
  revokedAt: number | null;
  refundedAt: number | null;
  organizationId: string | null;
  seatCount: number; // 1 for personal
  /** Update window end (source stays; new updates cut off). Policy TBD (docs/45). */
  updateUntil: number | null;
  metadata: Record<string, string>;
  /** Append-only history of state changes for this entitlement. */
  history: EntitlementHistoryEntry[];
}

export interface EntitlementHistoryEntry {
  at: number;
  from: EntitlementState | null;
  to: EntitlementState;
  reason: string;
  source: string; // "webhook" | "admin" | "preview-activation" | "staging-test" | ...
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------
export type CustomerState = "active" | "suspended";

export interface CustomerRecord {
  id: string;
  email: string | null; // may be null until known
  externalRef: string | null; // provider customer id
  state: CustomerState;
  organizationId: string | null;
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Access token — we store a HASH + prefix, never the plaintext.
// ---------------------------------------------------------------------------
export type TokenEnvironment = "test" | "live";

export interface TokenRecord {
  id: string; // token id (also the display handle)
  prefix: string; // first chars of the plaintext, for identification only
  hash: string; // sha-256 of the plaintext token (never the plaintext itself)
  customerId: string;
  organizationId: string | null;
  environment: TokenEnvironment;
  createdAt: number;
  lastUsedAt: number | null;
  expiresAt: number | null;
  revokedAt: number | null;
  /** Optional scope narrowing; empty = full customer entitlement lookup. */
  scope: EntitlementId[];
  label: string;
}

export function tokenActive(t: Pick<TokenRecord, "revokedAt" | "expiresAt">, nowMs: number): boolean {
  if (t.revokedAt != null) return false;
  if (t.expiresAt != null && t.expiresAt <= nowMs) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Registry audit — durable, privacy-safe (token id, never the plaintext).
// ---------------------------------------------------------------------------
export type AuditResult =
  | "granted"
  | "missing-token"
  | "invalid-token"
  | "revoked-token"
  | "expired-token"
  | "missing-entitlement"
  | "rate-limited"
  | "unknown-item"
  | "internal-error";

export interface RegistryAuditEntry {
  id: string;
  at: number;
  customerId: string | null;
  organizationId: string | null;
  tokenId: string | null; // token identifier, NEVER the full token
  item: string;
  entitlementUsed: EntitlementId | null;
  result: AuditResult;
  httpStatus: number;
  dependencyItems: string[];
  userAgent: string | null;
  ipHash: string | null; // privacy-safe hash, only when approved
  durationMs: number;
  failureReason: string | null;
}

// ---------------------------------------------------------------------------
// Organization / team
// ---------------------------------------------------------------------------
export type OrgRole = "owner" | "admin" | "developer" | "billing";
export type OrgState = "active" | "suspended";

export interface OrganizationRecord {
  id: string;
  name: string;
  ownerCustomerId: string;
  state: OrgState;
  seatLimit: number;
  members: OrgMember[];
  entitlementIds: EntitlementId[]; // org-level entitlements (grant all seats)
  createdAt: number;
  updatedAt: number;
}

export interface OrgMember {
  customerId: string;
  role: OrgRole;
  addedAt: number;
}
