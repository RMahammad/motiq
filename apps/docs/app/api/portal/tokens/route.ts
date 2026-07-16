// PREVIEW-ONLY portal token API — create / rotate / revoke registry tokens.
//
// There is NO real customer login yet. This route is therefore gated hard:
//   - It only works in `development` / `private-preview` launch modes, AND only
//     when MOTIONSTACK_ENABLE_DEV_ADMIN=1. In `public-beta`/`launched` it 404s so
//     it can never run in a paid production. With the flag off it 403s.
//   - It requires an explicit `customerId` in the request body. This is a CLEAR
//     PREVIEW LIMITATION: a production version resolves the customer from an
//     authenticated session/cookie, never from a client-supplied id. Do not ship
//     this route to a launched product without replacing the id-in-body model
//     with real authentication + CSRF protection.
//
// The plaintext token is returned EXACTLY ONCE, on `create` and `rotate`. It is
// never stored and never returned again (listing only ever yields metadata).
import { NextResponse } from "next/server";

import { commerce } from "../../../../lib/product";
import { createToken, rotateToken, revokeToken, listTokenMeta } from "../../../../lib/server/tokens";
import type { EntitlementId } from "../../../../lib/commerce";
import type { TokenEnvironment } from "../../../../lib/server/model";

export const dynamic = "force-dynamic"; // token issuance must never be cached

/** Same gate the dev-admin route uses: prod modes 404, missing flag 403. */
function forbidden(): NextResponse | null {
  if (commerce.launchMode === "launched" || commerce.launchMode === "public-beta") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (process.env.MOTIONSTACK_ENABLE_DEV_ADMIN !== "1") {
    return NextResponse.json(
      { error: "dev-admin-disabled", hint: "set MOTIONSTACK_ENABLE_DEV_ADMIN=1" },
      { status: 403 },
    );
  }
  return null;
}

const ENVIRONMENTS: TokenEnvironment[] = ["test", "live"];

/** Confirm the token belongs to this customer before rotating/revoking it. */
async function ownsToken(customerId: string, tokenId: string): Promise<boolean> {
  const meta = await listTokenMeta(customerId);
  return meta.some((t) => t.id === tokenId);
}

export async function POST(req: Request) {
  const guard = forbidden();
  if (guard) return guard;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "");

  // PREVIEW LIMITATION: the customer is trusted from the request body because
  // there is no session yet. A production route resolves it from auth instead.
  const customerId = typeof body.customerId === "string" ? body.customerId.trim() : "";
  if (!customerId) {
    return NextResponse.json({ error: "missing-customer", hint: "customerId is required in preview" }, { status: 400 });
  }

  try {
    switch (action) {
      case "create": {
        const environment = ENVIRONMENTS.includes(body.environment as TokenEnvironment)
          ? (body.environment as TokenEnvironment)
          : "test";
        const label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : undefined;
        const scope = Array.isArray(body.scope) ? (body.scope as EntitlementId[]) : undefined;
        const issued = await createToken({ customerId, environment, label, scope });
        return NextResponse.json({
          ok: true,
          tokenId: issued.record.id,
          tokenPrefix: issued.record.prefix,
          token: issued.plaintext, // returned ONCE — never persisted, never listed
          record: issued.record,
        });
      }
      case "rotate": {
        const tokenId = String(body.tokenId ?? "");
        if (!tokenId) return NextResponse.json({ error: "missing-token-id" }, { status: 400 });
        if (!(await ownsToken(customerId, tokenId))) {
          return NextResponse.json({ error: "not_found" }, { status: 404 });
        }
        const issued = await rotateToken(tokenId);
        if (!issued) return NextResponse.json({ error: "not_found" }, { status: 404 });
        return NextResponse.json({
          ok: true,
          tokenId: issued.record.id,
          tokenPrefix: issued.record.prefix,
          token: issued.plaintext, // returned ONCE (fresh token; old one revoked)
          record: issued.record,
        });
      }
      case "revoke": {
        const tokenId = String(body.tokenId ?? "");
        if (!tokenId) return NextResponse.json({ error: "missing-token-id" }, { status: 400 });
        if (!(await ownsToken(customerId, tokenId))) {
          return NextResponse.json({ error: "not_found" }, { status: 404 });
        }
        const ok = await revokeToken(tokenId);
        return NextResponse.json({ ok });
      }
      default:
        return NextResponse.json({ error: "unknown-action", action }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: "internal-error", message: (err as Error).message }, { status: 500 });
  }
}
