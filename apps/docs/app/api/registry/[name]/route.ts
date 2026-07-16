// Entitlement-aware registry route (docs/43) — production-shaped.
//
// GET /api/registry/<name> (optionally <name>.json)
//   FREE item        → 200 public JSON, no auth (light per-IP rate limit).
//   PROTECTED item   → requires Authorization: Bearer <token>:
//        200 granted · 401 missing-token · 403 invalid/revoked/expired/not-entitled
//        · 404 unknown · 429 rate-limited (Retry-After, NO source body).
//
// The token is read ONLY from the Authorization header (docs/43: no query keys).
// Access + dependency resolution go through the fail-closed resolver, which
// writes a durable, privacy-safe audit entry (token id, never the token/source).
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { readPublicRegistry, readProtectedRegistry } from "../../../../lib/registry-source";
import { resolveAccess } from "../../../../lib/server/access";
import { stores } from "../../../../lib/server/stores";
import { product, commerce } from "../../../../lib/product";

export const dynamic = "force-dynamic"; // never statically cache a gated response

function bearer(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1].trim() : null;
}
function normalize(name: string): string {
  return name.replace(/\.json$/i, "");
}
function clientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}
function rateKey(prefix: string, id: string): string {
  return `${prefix}:${createHash("sha256").update(id).digest("hex").slice(0, 16)}`;
}
function protectedDepNames(regDeps: string[] | undefined): string[] {
  const ns = product.registryNamespace + "/";
  return (regDeps || [])
    .filter((d) => d.startsWith(ns))
    .map((d) => d.slice(ns.length))
    .filter((bare) => readProtectedRegistry(bare) !== null);
}

// Development bypass of rate limiting only in explicit development mode.
const RATE_LIMIT_ENABLED = commerce.launchMode !== "development" || process.env.MOTIONSTACK_FORCE_RATELIMIT === "1";

export async function GET(req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name: raw } = await ctx.params;
  const name = normalize(raw);
  const ip = clientIp(req);
  const token = bearer(req);
  const s = stores();

  // ---- rate limiting (server-side; blocked responses carry NO source) -------
  if (RATE_LIMIT_ENABLED) {
    const key = token ? rateKey("tok", token) : rateKey("ip", ip ?? "unknown");
    const limit = token ? { limit: 120, windowMs: 60_000, burst: 30 } : { limit: 30, windowMs: 60_000, burst: 10 };
    const rl = await s.rateLimiter.check(key, limit);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "rate-limited", item: name },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }
  }

  // ---- free item → public, no auth -----------------------------------------
  const pub = readPublicRegistry(name);
  if (pub) {
    // Record a lightweight free-access audit (no customer/token).
    await s.audit
      .record({
        id: `aud_free_${createHash("sha256").update(name + Date.now()).digest("hex").slice(0, 16)}`,
        at: Date.now(),
        customerId: null,
        organizationId: null,
        tokenId: null,
        item: name,
        entitlementUsed: null,
        result: "granted",
        httpStatus: 200,
        dependencyItems: [],
        userAgent: req.headers.get("user-agent"),
        ipHash: null,
        durationMs: 0,
        failureReason: "free",
      })
      .catch(() => {});
    return NextResponse.json(pub, { status: 200 });
  }

  // ---- protected item -------------------------------------------------------
  const prot = readProtectedRegistry(name);
  if (!prot) {
    return NextResponse.json({ error: "not_found", item: name }, { status: 404 });
  }

  const depNames = protectedDepNames(prot.registryDependencies);
  const decision = await resolveAccess(name, token, { userAgent: req.headers.get("user-agent"), ip }, { dependencyItems: depNames });

  if (!decision.granted) {
    // NO source in a denied response.
    return NextResponse.json(
      {
        error: decision.result,
        item: name,
        message:
          decision.result === "missing-token"
            ? "This is a protected item. Send Authorization: Bearer <token>."
            : decision.result === "missing-entitlement"
              ? "This token is not entitled to this item."
              : "Access to this item was denied.",
      },
      { status: decision.httpStatus },
    );
  }

  // Entitled: resolve protected dependencies under the SAME token (each audited).
  const resolvedDependencies: { name: string; granted: boolean; result: string }[] = [];
  for (const dep of depNames) {
    const d = await resolveAccess(dep, token, { userAgent: req.headers.get("user-agent"), ip });
    resolvedDependencies.push({ name: dep, granted: d.granted, result: d.result });
  }

  return NextResponse.json(
    {
      ...prot,
      meta: {
        ...(prot.meta ?? {}),
        customerId: decision.customerId,
        entitlementUsed: decision.entitlementUsed,
        resolvedDependencies,
      },
    },
    { status: 200 },
  );
}
