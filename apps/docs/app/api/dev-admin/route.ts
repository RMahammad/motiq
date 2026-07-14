// DEV/STAGING-ONLY admin operations for driving the customer lifecycle without a
// live payment provider. Returns 404 in launched/public-beta so it can never run
// in a paid production. Also serves as the interim "protected internal route"
// for private-preview activation (docs §19) — replace with real auth before any
// production admin use.
//
// NEVER returns a stored token; plaintext tokens are only returned at creation
// (that IS the secure issuance flow). Full tokens are never logged.
import { NextResponse } from "next/server";

import { commerce } from "../../../lib/product";
import { _resetAllStoresForTest, stores } from "../../../lib/server/stores";
import { ensureCustomer, grantEntitlement, revokeCustomer, refundPurchase, activeEntitlementIds } from "../../../lib/server/entitlement-service";
import { createToken, rotateToken, revokeToken, listTokenMeta } from "../../../lib/server/tokens";
import type { EntitlementId } from "../../../lib/commerce";
import type { LicenseType } from "../../../lib/server/model";

export const dynamic = "force-dynamic";

function forbiddenInProd(): NextResponse | null {
  if (commerce.launchMode === "launched" || commerce.launchMode === "public-beta") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (process.env.MOTIONKIT_ENABLE_DEV_ADMIN !== "1") {
    return NextResponse.json({ error: "dev-admin-disabled", hint: "set MOTIONKIT_ENABLE_DEV_ADMIN=1" }, { status: 403 });
  }
  return null;
}

export async function POST(req: Request) {
  const guard = forbiddenInProd();
  if (guard) return guard;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "");

  try {
    switch (action) {
      case "reset": {
        _resetAllStoresForTest();
        return NextResponse.json({ ok: true });
      }
      case "seed": {
        // Create a customer + entitlement + registry token in one step.
        const customer = await ensureCustomer({ email: (body.email as string) ?? null });
        const entitlementId = body.entitlementId as EntitlementId;
        const licenseType = (body.licenseType as LicenseType) ?? "personal";
        const purchaseId = (body.purchaseId as string) ?? null;
        await grantEntitlement({ customerId: customer.id, entitlementId, licenseType, purchaseId, source: "staging-test" });
        const issued = await createToken({ customerId: customer.id, environment: "test", label: "staging token" });
        return NextResponse.json({
          customerId: customer.id,
          tokenId: issued.record.id,
          tokenPrefix: issued.record.prefix,
          token: issued.plaintext, // returned ONCE
        });
      }
      case "rotate": {
        const issued = await rotateToken(String(body.tokenId));
        if (!issued) return NextResponse.json({ error: "not_found" }, { status: 404 });
        return NextResponse.json({ tokenId: issued.record.id, tokenPrefix: issued.record.prefix, token: issued.plaintext });
      }
      case "revoke-token": {
        const ok = await revokeToken(String(body.tokenId));
        return NextResponse.json({ ok });
      }
      case "revoke-customer": {
        const r = await revokeCustomer(String(body.customerId), String(body.reason ?? "manual"), "staging-test");
        return NextResponse.json(r);
      }
      case "refund": {
        const r = await refundPurchase(String(body.purchaseId), "staging-test");
        return NextResponse.json(r);
      }
      default:
        return NextResponse.json({ error: "unknown-action", action }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: "internal-error", message: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const guard = forbiddenInProd();
  if (guard) return guard;
  const url = new URL(req.url);
  const what = url.searchParams.get("what");
  if (what === "audit") {
    const recent = await stores().audit.recent(50);
    // redact: never return anything beyond tokenId (already safe)
    return NextResponse.json({ count: recent.length, entries: recent });
  }
  if (what === "tokens") {
    const meta = await listTokenMeta(String(url.searchParams.get("customerId")));
    return NextResponse.json({ tokens: meta });
  }
  if (what === "entitlements") {
    const ids = await activeEntitlementIds(String(url.searchParams.get("customerId")));
    return NextResponse.json({ entitlements: [...ids] });
  }
  return NextResponse.json({ error: "unknown-query" }, { status: 400 });
}
