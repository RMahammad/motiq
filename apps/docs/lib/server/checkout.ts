// SERVER-ONLY checkout creation. Turns an INTERNAL checkout item id into a
// provider checkout session — never trusting a price from the caller. The price
// (and whether a charge happens at all) is owned by product-mapping + the approved
// provider; the client only names WHAT it wants to buy, never how much it costs.
//
// Fails closed and stays honest about launch state: returns a `disabled` state
// (not an error) whenever pricing/checkout are off, the provider is 'none', or the
// launch mode does not permit live checkout. No secrets are read or returned here.
import type { CheckoutItem, PricingSlot } from "../commerce";
import { commerce } from "../product";
import { purchaseProvider } from "./purchase";
import { resolveCheckoutItem, type CheckoutItemDefinition } from "./product-mapping";

/** Rendered checkout state machine. `disabled` is a valid, honest resting state
 *  (checkout is off), distinct from `error` (a real failure while creating one). */
export type CheckoutState = "idle" | "creating" | "redirecting" | "error" | "disabled";

export interface CreateCheckoutInput {
  checkoutItemId: string;
  /** Optional license/seat selection — recorded as metadata, never priced here. */
  licenseOption?: string;
  seatCount?: number;
  promoId?: string;
  /** Relative path to return to after checkout (validated to be same-origin). */
  returnPath?: string;
}

export interface CreateCheckoutResult {
  state: CheckoutState;
  /** Provider redirect URL — present only when state === "redirecting". */
  url?: string;
  /** Non-sensitive reason, safe to surface in the UI. */
  reason?: string;
  /** Echo of the resolved item name (never a price). */
  item?: string;
}

/** Whether live checkout is permitted right now (all conditions must hold). */
export function checkoutPermitted(): boolean {
  const launchPermits = commerce.launchMode === "public-beta" || commerce.launchMode === "launched";
  return commerce.pricingEnabled && commerce.checkoutEnabled && commerce.checkoutProvider !== "none" && launchPermits;
}

/** Only accept a same-origin relative return path (never an absolute/external URL). */
function safeReturnPath(p: string | undefined): string | undefined {
  if (!p) return undefined;
  if (!p.startsWith("/") || p.startsWith("//")) return undefined;
  return p;
}

function seatQuantity(def: CheckoutItemDefinition, requested: number | undefined): number {
  if (requested == null || !Number.isFinite(requested)) return 1;
  const n = Math.floor(requested);
  if (n < 1) return 1;
  // Never exceed the item's seat allowance for a personal license line item.
  return def.seatAllowance > 1 ? Math.min(n, def.seatAllowance) : 1;
}

export async function createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
  const def = resolveCheckoutItem(input.checkoutItemId);
  if (!def) {
    return { state: "error", reason: "unknown-checkout-item" };
  }

  if (!checkoutPermitted()) {
    return { state: "disabled", reason: "checkout-not-available", item: def.name };
  }

  // Build the line item OURSELVES. The price slot carries NO amount here — a
  // concrete price is resolved by the approved provider, never accepted from the
  // caller. This prevents client-supplied price tampering by construction.
  const priceSlot: PricingSlot = {
    key: def.checkoutItemId,
    label: def.name,
    amount: null,
    currency: commerce.currency,
    status: "open",
  };
  const item: CheckoutItem = {
    entitlementId: def.entitlementId,
    name: def.name,
    priceSlot,
    quantity: 1,
  };

  const metadata: Record<string, string> = {
    checkoutItemId: def.checkoutItemId,
    entitlementId: def.entitlementId,
  };
  if (input.licenseOption) metadata.licenseOption = input.licenseOption;
  const seats = seatQuantity(def, input.seatCount);
  if (seats > 1) metadata.seatCount = String(seats);
  if (input.promoId) metadata.promoId = input.promoId;

  const returnPath = safeReturnPath(input.returnPath);

  try {
    const session = await purchaseProvider().createCheckout([item], {
      metadata,
      successUrl: returnPath,
    });
    if (!session?.url) {
      return { state: "error", reason: "no-session-url", item: def.name };
    }
    return { state: "redirecting", url: session.url, item: def.name };
  } catch {
    // purchaseProvider() throws when a real provider is selected but unconfigured.
    // Never surface the underlying message (may reference internal config).
    return { state: "error", reason: "provider-unavailable", item: def.name };
  }
}
