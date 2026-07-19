// SERVER-ONLY secure access tokens for the private registry.
//
// The PLAINTEXT token is shown to the customer exactly ONCE (at creation or
// rotation). We persist only a sha-256 HASH plus a short PREFIX for
// identification. Verification hashes the presented token and looks it up.
//
// Rules enforced here:
//   - crypto-random tokens (node:crypto), never guessable
//   - store hash, never plaintext
//   - never return the plaintext again after issuance
//   - never log the full token (callers must log tokenId, not the token)
//   - environment separation (test vs live) baked into the prefix
import { randomBytes, createHash } from "node:crypto";

import { stores, newId } from "./stores";
import type { TokenRecord, TokenEnvironment } from "./model";
import { tokenActive } from "./model";
import type { EntitlementId } from "../commerce";

const PREFIX_BY_ENV: Record<TokenEnvironment, string> = { test: "mk_test_", live: "mk_live_" };

function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext, "utf8").digest("hex");
}

/** A newly created token — the plaintext is present ONCE and never stored. */
export interface IssuedToken {
  plaintext: string; // return to the customer once; never persisted
  record: TokenMeta;
}

/** Token metadata safe to return to a customer/portal (no hash, no plaintext). */
export interface TokenMeta {
  id: string;
  prefix: string;
  label: string;
  environment: TokenEnvironment;
  createdAt: number;
  lastUsedAt: number | null;
  expiresAt: number | null;
  revokedAt: number | null;
  scope: EntitlementId[];
}

function toMeta(r: TokenRecord): TokenMeta {
  return {
    id: r.id,
    prefix: r.prefix,
    label: r.label,
    environment: r.environment,
    createdAt: r.createdAt,
    lastUsedAt: r.lastUsedAt,
    expiresAt: r.expiresAt,
    revokedAt: r.revokedAt,
    scope: r.scope,
  };
}

export interface CreateTokenInput {
  customerId: string;
  organizationId?: string | null;
  environment: TokenEnvironment;
  label?: string;
  expiresAt?: number | null;
  scope?: EntitlementId[];
}

export async function createToken(input: CreateTokenInput): Promise<IssuedToken> {
  const secret = randomBytes(24).toString("base64url"); // 192 bits
  const plaintext = `${PREFIX_BY_ENV[input.environment]}${secret}`;
  const now = Date.now();
  const record: TokenRecord = {
    id: newId("tok"),
    prefix: plaintext.slice(0, 16), // e.g. "mk_live_AbCd" — identification only
    hash: hashToken(plaintext),
    customerId: input.customerId,
    organizationId: input.organizationId ?? null,
    environment: input.environment,
    createdAt: now,
    lastUsedAt: null,
    expiresAt: input.expiresAt ?? null,
    revokedAt: null,
    scope: input.scope ?? [],
    label: input.label ?? "Registry token",
  };
  await stores().tokens.upsert(record);
  return { plaintext, record: toMeta(record) };
}

/** Verify a presented plaintext token. Returns the record or null (fail closed). */
export async function verifyToken(plaintext: string | null): Promise<{ record: TokenRecord; reason: "ok" } | { record: null; reason: "missing" | "invalid" | "revoked" | "expired" }> {
  if (!plaintext) return { record: null, reason: "missing" };
  const rec = await stores().tokens.getByHash(hashToken(plaintext));
  if (!rec) return { record: null, reason: "invalid" };
  const now = Date.now();
  if (rec.revokedAt != null) return { record: null, reason: "revoked" };
  if (rec.expiresAt != null && rec.expiresAt <= now) return { record: null, reason: "expired" };
  return { record: rec, reason: "ok" };
}

export async function recordTokenUse(id: string): Promise<void> {
  const t = await stores().tokens.get(id);
  if (!t) return;
  await stores().tokens.upsert({ ...t, lastUsedAt: Date.now() });
}

export async function revokeToken(id: string): Promise<boolean> {
  const t = await stores().tokens.get(id);
  if (!t) return false;
  if (t.revokedAt != null) return true;
  await stores().tokens.upsert({ ...t, revokedAt: Date.now() });
  return true;
}

/** Rotate: issue a fresh token for the same customer/scope and revoke the old. */
export async function rotateToken(id: string): Promise<IssuedToken | null> {
  const t = await stores().tokens.get(id);
  if (!t) return null;
  const issued = await createToken({
    customerId: t.customerId,
    organizationId: t.organizationId,
    environment: t.environment,
    label: t.label,
    scope: t.scope,
    expiresAt: t.expiresAt,
  });
  await revokeToken(id);
  return issued;
}

/** Metadata list for a customer (never hashes or plaintext). */
export async function listTokenMeta(customerId: string): Promise<TokenMeta[]> {
  const list = await stores().tokens.forCustomer(customerId);
  return list.sort((a, b) => b.createdAt - a.createdAt).map(toMeta);
}

export { tokenActive };
