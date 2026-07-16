// PREVIEW-ONLY customer-facing registry token API — create / rotate / revoke.
//
// This is the token endpoint the preview ONBOARDING and DASHBOARD widgets call.
// There is NO real customer login yet, so it is gated exactly like the portal
// token route:
//   - `launched` / `public-beta` → 404 (never runs in a paid production).
//   - Otherwise requires MOTIONSTACK_ENABLE_DEV_ADMIN=1, else 403. This flag is the
//     interim stand-in for "a valid activation authorizes the session". Once real
//     auth exists, an activated customer's authenticated session authorizes this
//     instead of the dev flag.
//
// PREVIEW LIMITATION (documented on purpose): the customer is taken from a
// `customerId` in the request body because there is no session/cookie yet. A
// production route MUST resolve the customer from an authenticated session and
// add CSRF protection — never trust a client-supplied id. rotate/revoke are
// additionally constrained to tokens the given customer actually owns.
//
// The plaintext token is returned EXACTLY ONCE, on `create` and `rotate`. It is
// never stored, never logged, and never returned by any listing.
import { NextResponse } from "next/server";

import { commerce } from "../../../../lib/product";
import { createToken, rotateToken, revokeToken, listTokenMeta } from "../../../../lib/server/tokens";
import type { TokenEnvironment } from "../../../../lib/server/model";

export const dynamic = "force-dynamic"; // token issuance must never be cached

/** Prod modes 404; missing dev flag 403. Mirrors the portal token route gate. */
function forbidden(): NextResponse | null {
  if (commerce.launchMode === "launched" || commerce.launchMode === "public-beta") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (process.env.MOTIONSTACK_ENABLE_DEV_ADMIN !== "1") {
    return NextResponse.json(
      { error: "preview-tokens-disabled", hint: "set MOTIONSTACK_ENABLE_DEV_ADMIN=1" },
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

  // PREVIEW LIMITATION: trusted from the body because there is no session yet.
  const customerId = typeof body.customerId === "string" ? body.customerId.trim() : "";
  if (!customerId) {
    return NextResponse.json(
      { error: "missing-customer", hint: "customerId is required during preview (no login yet)" },
      { status: 400 },
    );
  }

  try {
    switch (action) {
      case "create": {
        const environment = ENVIRONMENTS.includes(body.environment as TokenEnvironment)
          ? (body.environment as TokenEnvironment)
          : "test";
        const label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : undefined;
        const issued = await createToken({ customerId, environment, label });
        return NextResponse.json({
          ok: true,
          tokenId: issued.record.id,
          tokenPrefix: issued.record.prefix,
          token: issued.plaintext, // returned ONCE — never persisted, never listed again
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
