// SERVER-ONLY registry access resolver. The protected route calls resolveAccess
// for each requested item. Everything FAILS CLOSED: any error, unknown state, or
// missing entitlement denies. Writes a durable, privacy-safe audit entry.
import { createHash } from "node:crypto";

import { stores, newId } from "./stores";
import { verifyToken, recordTokenUse } from "./tokens";
import { activeEntitlementIds } from "./entitlement-service";
import { entitlementsThatGrant } from "./entitlement-map";
import type { AuditResult, RegistryAuditEntry } from "./model";
import type { EntitlementId } from "../commerce";

export interface AccessContext {
  userAgent?: string | null;
  /** Raw IP — hashed here, never stored raw, and only when approved by config. */
  ip?: string | null;
  ipHashingEnabled?: boolean;
}

export interface AccessDecision {
  granted: boolean;
  result: AuditResult;
  httpStatus: number;
  customerId: string | null;
  organizationId: string | null;
  tokenId: string | null;
  entitlementUsed: EntitlementId | null;
  failureReason: string | null;
}

const HTTP_BY_RESULT: Record<AuditResult, number> = {
  granted: 200,
  "missing-token": 401,
  "invalid-token": 403,
  "revoked-token": 403,
  "expired-token": 403,
  "missing-entitlement": 403,
  "rate-limited": 429,
  "unknown-item": 404,
  "internal-error": 500,
};

function ipHash(ip: string | null | undefined, enabled: boolean | undefined): string | null {
  if (!ip || !enabled) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

/**
 * Resolve access to a PROTECTED item. (Free items are served publicly by the
 * route before calling this.) Records a durable audit entry with the token id —
 * never the token itself, never the source.
 */
export async function resolveAccess(
  itemName: string,
  plaintextToken: string | null,
  ctx: AccessContext = {},
  opts: { dependencyItems?: string[]; startedAt?: number } = {},
): Promise<AccessDecision> {
  const startedAt = opts.startedAt ?? Date.now();
  let customerId: string | null = null;
  let organizationId: string | null = null;
  let tokenId: string | null = null;
  let entitlementUsed: EntitlementId | null = null;

  const finalize = async (result: AuditResult, failureReason: string | null): Promise<AccessDecision> => {
    const httpStatus = HTTP_BY_RESULT[result];
    const entry: RegistryAuditEntry = {
      id: newId("aud"),
      at: Date.now(),
      customerId,
      organizationId,
      tokenId,
      item: itemName,
      entitlementUsed,
      result,
      httpStatus,
      dependencyItems: opts.dependencyItems ?? [],
      userAgent: ctx.userAgent ?? null,
      ipHash: ipHash(ctx.ip, ctx.ipHashingEnabled),
      durationMs: Date.now() - startedAt,
      failureReason,
    };
    try {
      await stores().audit.record(entry);
    } catch {
      /* audit must never block the decision, but a failure is itself notable */
    }
    return {
      granted: result === "granted",
      result,
      httpStatus,
      customerId,
      organizationId,
      tokenId,
      entitlementUsed,
      failureReason,
    };
  };

  try {
    const v = await verifyToken(plaintextToken);
    if (v.record == null) {
      const map: Record<string, AuditResult> = {
        missing: "missing-token",
        invalid: "invalid-token",
        revoked: "revoked-token",
        expired: "expired-token",
      };
      return finalize(map[v.reason], v.reason);
    }
    tokenId = v.record.id;
    customerId = v.record.customerId;
    organizationId = v.record.organizationId;
    await recordTokenUse(v.record.id);

    const held = await activeEntitlementIds(customerId);
    // Optional scope narrowing: a scoped token can't exceed its scope.
    const scoped = v.record.scope.length > 0 ? new Set(v.record.scope.filter((s) => held.has(s))) : held;

    const granting = entitlementsThatGrant(itemName);
    const match = granting.find((g) => scoped.has(g));
    if (!match) return finalize("missing-entitlement", "no held entitlement grants this item");
    entitlementUsed = match;
    return finalize("granted", null);
  } catch (err) {
    return finalize("internal-error", (err as Error).message);
  }
}

export { HTTP_BY_RESULT };
