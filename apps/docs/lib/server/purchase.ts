// SERVER-ONLY purchase/checkout layer. Never import from a client component.
//
// Provider-neutral: the storefront calls this interface to create a checkout and
// read its status; a real payment provider (Stripe, Lemon Squeezy, Paddle) is
// plugged in later behind the same shape. Provider selection is a HUMAN decision
// tracked in docs/41 — it is not chosen automatically here. The bundled adapter
// is a DEVELOPMENT MOCK that charges nothing and trusts nothing; it is NOT a real
// purchase flow and must be replaced before any paid launch. No secrets live in
// this file, and checkout-provider secrets must NEVER be exposed to client code.
import type { EntitlementId, CheckoutItem, PurchaseState } from "../commerce";
import { commerce } from "../product";

// ---------------------------------------------------------------------------
// Provider-neutral checkout types.
// ---------------------------------------------------------------------------

/** Lifecycle of a checkout session, provider-agnostic. */
export type CheckoutStatus = "created" | "pending" | "complete" | "expired" | "failed";

/** A checkout session created by a provider. `url` is where the buyer is sent. */
export interface CheckoutSession {
  id: string;
  url: string;
  state: CheckoutStatus;
}

/** A purchasing customer as seen by the purchase layer. */
export interface PurchaseCustomer {
  id: string;
  entitlements: EntitlementId[];
  state: PurchaseState;
}

/** Options for opening a checkout (all optional; provider decides support). */
export interface CreateCheckoutOptions {
  customerId?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

/** A provider webhook event (refund/purchase update). Shape is intentionally
 *  loose because each provider serializes its own payload; adapters narrow it. */
export interface PurchaseEvent {
  type: string;
  customerId?: string;
  entitlement?: EntitlementId;
  raw?: unknown;
}

export interface PurchaseProvider {
  readonly name: string;
  /** Open a checkout for the given line items; returns a session to redirect to. */
  createCheckout(items: CheckoutItem[], opts?: CreateCheckoutOptions): Promise<CheckoutSession>;
  /** Current lifecycle status of a previously created checkout session. */
  getCheckoutStatus(sessionId: string): Promise<CheckoutStatus>;
  /** Resolve a customer, or null if unknown. */
  getCustomer(customerId: string): Promise<PurchaseCustomer | null>;
  /** Grant an entitlement to a customer (post-purchase fulfilment). */
  createEntitlement(customerId: string, entitlement: EntitlementId): Promise<void>;
  /** A managed customer/billing portal URL, or null if not available. */
  getCustomerPortalUrl(customerId: string): Promise<string | null>;
  /** Process a refund event (revoke access, record state). */
  handleRefund(event: PurchaseEvent): Promise<void>;
  /** Process a purchase-update event (renewal, plan change, state change). */
  updatePurchase(event: PurchaseEvent): Promise<void>;
  /** Verify a provider webhook signature against the raw request body. */
  verifyWebhook(rawBody: string, signature: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Development adapter — MOCK ONLY. Charges nothing, trusts nothing.
// Replace with an approved provider before any paid launch (docs/41).
// ---------------------------------------------------------------------------

// In-memory customer store for the dev session. These are development fixtures,
// not secrets, and are lost on restart — this is intentional for a mock.
const DEV_CUSTOMERS: Record<string, PurchaseCustomer> = {};

const devProvider: PurchaseProvider = {
  name: "dev-mock",
  async createCheckout(items, opts) {
    // DEV MOCK — not a real purchase. No charge is made; we mint a fake local
    // session that points back into the app instead of a payment provider.
    const id = `dev_checkout_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    void items; // line items are accepted but never billed in the mock
    void opts;
    return { id, url: `/access?checkout=${id}`, state: "created" };
  },
  async getCheckoutStatus(_sessionId) {
    // DEV MOCK — the fake session never advances past creation.
    return "created";
  },
  async getCustomer(customerId) {
    const c = DEV_CUSTOMERS[customerId];
    return c ? { ...c } : null;
  },
  async createEntitlement(customerId, entitlement) {
    // DEV MOCK — not a real purchase. Grants are in-memory only and confer no
    // real access; the entitlement layer's own mock is the source of truth.
    const existing = DEV_CUSTOMERS[customerId] ?? { id: customerId, entitlements: [], state: "active" as PurchaseState };
    if (!existing.entitlements.includes(entitlement)) existing.entitlements.push(entitlement);
    DEV_CUSTOMERS[customerId] = existing;
  },
  async getCustomerPortalUrl(_customerId) {
    return commerce.customerPortalUrl || null;
  },
  async handleRefund(_event) {
    // DEV MOCK — not a real purchase. No refund is processed; no-op stub.
  },
  async updatePurchase(_event) {
    // DEV MOCK — not a real purchase. No billing state changes; no-op stub.
  },
  async verifyWebhook(_rawBody, _signature) {
    // DEV MOCK — nothing is trusted. Always false so no webhook is ever
    // accepted without a real, signature-verifying provider.
    return false;
  },
};

// ---------------------------------------------------------------------------
// Provider selection. This is a HUMAN decision (docs/41): only the dev-mock
// exists today, and real providers are wired in behind approval. Selecting a
// real provider before it is implemented is a hard error, not a silent
// fallthrough, so a misconfiguration can never quietly run against the mock.
// ---------------------------------------------------------------------------

export function purchaseProvider(): PurchaseProvider {
  switch (commerce.checkoutProvider) {
    case "none":
      return devProvider;
    case "stripe":
    case "lemon-squeezy":
    case "paddle":
      throw new Error(
        `Checkout provider "${commerce.checkoutProvider}" is selected but not configured - see docs/41. ` +
          `No live provider is implemented yet; keep checkoutProvider "none" until approved.`,
      );
    default:
      // Unknown value → fall back to the safe dev mock rather than charging.
      return devProvider;
  }
}
