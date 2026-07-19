// Checkout creation endpoint (docs/41). POST only.
//
//   POST /api/checkout
//     Body: { checkoutItemId: string, licenseOption?: string, seatCount?: number,
//             promoId?: string, returnPath?: string }
//
// The caller names WHAT to buy (an internal checkout item id) — never a price. The
// server resolves the price/provider itself (product-mapping + approved provider).
//   200 { state, url? }  — including state "disabled" when checkout is off (an
//                          honest resting state, NOT an error)
//   400 unknown checkout item / malformed body
//
// No secrets are read from the request or returned in the response.
import { NextResponse } from "next/server";

import { resolveCheckoutItem } from "../../../lib/server/product-mapping";
import { createCheckout } from "../../../lib/server/checkout";

export const dynamic = "force-dynamic"; // checkout state depends on live config

interface CheckoutBody {
  checkoutItemId?: unknown;
  licenseOption?: unknown;
  seatCount?: unknown;
  promoId?: unknown;
  returnPath?: unknown;
}

export async function POST(req: Request) {
  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "malformed-body" }, { status: 400 });
  }

  const checkoutItemId = typeof body.checkoutItemId === "string" ? body.checkoutItemId : "";
  if (!checkoutItemId) {
    return NextResponse.json({ error: "missing-checkout-item" }, { status: 400 });
  }

  // Validate against the mapping BEFORE doing anything — reject unknown items.
  if (!resolveCheckoutItem(checkoutItemId)) {
    return NextResponse.json({ error: "unknown-checkout-item" }, { status: 400 });
  }

  const seatCount = typeof body.seatCount === "number" && Number.isFinite(body.seatCount) ? body.seatCount : undefined;
  const licenseOption = typeof body.licenseOption === "string" ? body.licenseOption : undefined;
  const promoId = typeof body.promoId === "string" ? body.promoId : undefined;
  const returnPath = typeof body.returnPath === "string" ? body.returnPath : undefined;

  const result = await createCheckout({ checkoutItemId, licenseOption, seatCount, promoId, returnPath });

  // A "disabled" state is a normal 200 response (checkout is simply off), not an
  // error. Only a genuinely unresolvable request returns a non-200 above.
  return NextResponse.json(result, { status: 200 });
}
