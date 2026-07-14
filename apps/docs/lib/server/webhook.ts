// SERVER-ONLY provider-neutral webhook processing. This is the ONLY path that
// turns an inbound payment/billing event into an entitlement change, and it does
// so ONLY after a signature has been verified. Never call processEvent on an
// unverified event.
//
// Provider-neutral: no vendor SDK, no vendor field names. A STAGING adapter treats
// a signed JSON body as the canonical event shape; a real provider adapter (once
// approved, docs/41) narrows its own payload onto the same WebhookEvent and its own
// signature scheme onto verifyWebhook. All entitlement mutations go through the
// entitlement-service (never direct store writes). Nothing sensitive is persisted
// here — only opaque event ids for idempotency.
import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

import type { EntitlementId } from "../commerce";
import type { LicenseType } from "./model";
import { commerce } from "../product";
import { ensureCustomer, grantEntitlement, refundPurchase, revokeCustomer } from "./entitlement-service";
import { resolveCheckoutItem, providerProductToCheckoutItem, type CheckoutItemDefinition } from "./product-mapping";

// ---------------------------------------------------------------------------
// Event shape (provider-neutral). A real adapter maps its payload onto this.
// ---------------------------------------------------------------------------
export const ALLOWED_EVENT_TYPES = [
  "purchase.completed",
  "purchase.updated",
  "payment.failed",
  "refund.created",
  "refund.completed",
  "dispute.opened",
  "subscription.renewed",
  "subscription.cancelled",
  "customer.updated",
] as const;

export type WebhookEventType = (typeof ALLOWED_EVENT_TYPES)[number];

export interface WebhookCustomer {
  email?: string | null;
  externalRef?: string | null;
  organizationId?: string | null;
}

export interface WebhookEventData {
  /** Provider product id (real provider) — resolved via product-mapping env map. */
  providerProductId?: string;
  /** Internal checkout item id (staging path) — resolved directly. */
  checkoutItemId?: string;
  /** Provider purchase/order id — the idempotent handle refunds target. */
  purchaseId?: string;
  customer?: WebhookCustomer;
  licenseType?: LicenseType;
  seatCount?: number;
  organizationId?: string | null;
  /** Optional human-readable reason (non-sensitive) for revoke/refund. */
  reason?: string;
}

export interface WebhookEvent {
  /** Provider event id — the idempotency key. Required. */
  id: string;
  type: string;
  /** Epoch milliseconds. Used for replay/timestamp-tolerance checks. */
  createdAt: number;
  data: WebhookEventData;
}

// ---------------------------------------------------------------------------
// Signature verification — HMAC-SHA256, constant-time compare. The STAGING path
// signs the raw body with MOTIONKIT_WEBHOOK_SECRET; a real provider adapter can
// override this with its own scheme. Returns false on ANY mismatch or bad input.
// ---------------------------------------------------------------------------
export function verifyWebhook(rawBody: string, signature: string | null, secret: string | null): boolean {
  if (!secret || !signature) return false; // fail closed
  const provided = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  let expected: string;
  try {
    expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  } catch {
    return false;
  }
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length) return false; // avoids length-leak + timingSafeEqual throw
  return timingSafeEqual(a, b);
}

/** Compute the signature a caller must send (STAGING/test helper only). */
export function signWebhook(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

// ---------------------------------------------------------------------------
// STAGING adapter — parse a (verified) JSON body into a WebhookEvent. Structural
// validation only; NEVER trust an event that has not passed verifyWebhook first.
// ---------------------------------------------------------------------------
export function parseStagingEvent(rawBody: string): WebhookEvent | null {
  let obj: unknown;
  try {
    obj = JSON.parse(rawBody);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  if (typeof o.id !== "string" || o.id.length === 0) return null;
  if (typeof o.type !== "string") return null;
  const createdAt = typeof o.createdAt === "number" ? o.createdAt : NaN;
  if (!Number.isFinite(createdAt)) return null;
  const data = (o.data && typeof o.data === "object" ? (o.data as WebhookEventData) : {}) as WebhookEventData;
  return { id: o.id, type: o.type, createdAt, data };
}

/** Whether an event type is in the processing allowlist. */
export function isAllowedEventType(type: string): type is WebhookEventType {
  return (ALLOWED_EVENT_TYPES as readonly string[]).includes(type);
}

// ---------------------------------------------------------------------------
// Timestamp tolerance — reject events whose timestamp is outside the window
// (stale replay or clock-skew abuse). Default ±5 minutes.
// ---------------------------------------------------------------------------
export const DEFAULT_TOLERANCE_MS = 5 * 60_000;

export function withinTolerance(eventCreatedAt: number, nowMs: number, toleranceMs = DEFAULT_TOLERANCE_MS): boolean {
  if (!Number.isFinite(eventCreatedAt)) return false;
  return Math.abs(nowMs - eventCreatedAt) <= toleranceMs;
}

// ---------------------------------------------------------------------------
// Durable processed-event log — idempotency/dedup. File-backed under the same
// .data dir as stores.ts (atomic write via rename). Survives restarts so a
// replayed event id is never processed twice.
// ---------------------------------------------------------------------------
function dataDir(): string {
  return process.env.MOTIONKIT_DATA_DIR ? resolve(process.env.MOTIONKIT_DATA_DIR) : resolve(process.cwd(), ".data");
}

interface ProcessedRecord {
  id: string;
  at: number;
}

class ProcessedEventLog {
  private cache: Map<string, ProcessedRecord> | null = null;
  private readonly file = "webhook-events.json";

  private path(): string {
    return join(dataDir(), this.file);
  }
  private load(): Map<string, ProcessedRecord> {
    if (this.cache) return this.cache;
    const m = new Map<string, ProcessedRecord>();
    try {
      if (existsSync(this.path())) {
        const arr = JSON.parse(readFileSync(this.path(), "utf8")) as ProcessedRecord[];
        for (const r of arr) m.set(r.id, r);
      }
    } catch (err) {
      // Fail closed: if we cannot read the dedup log we must not risk double-grant.
      throw new Error(`[webhook] cannot read ${this.file}: ${(err as Error).message}`);
    }
    this.cache = m;
    return m;
  }
  private persist(m: Map<string, ProcessedRecord>): void {
    mkdirSync(dataDir(), { recursive: true });
    const tmp = this.path() + ".tmp";
    writeFileSync(tmp, JSON.stringify([...m.values()], null, 2) + "\n");
    renameSync(tmp, this.path());
  }
  has(id: string): boolean {
    return this.load().has(id);
  }
  record(id: string, at: number): void {
    const m = this.load();
    m.set(id, { id, at });
    this.persist(m);
  }
  /** Test/staging helper — clears the dedup log. */
  _clear(): void {
    this.cache = new Map();
    this.persist(this.cache);
  }
}

const processedLog = new ProcessedEventLog();

/** Whether this event id has already been processed (idempotency). */
export function alreadyProcessed(eventId: string): boolean {
  return processedLog.has(eventId);
}
/** Mark an event id as processed (call only after successful handling). */
export function markProcessed(eventId: string, at = Date.now()): void {
  processedLog.record(eventId, at);
}
/** Test/staging only — reset the dedup log. */
export function _resetProcessedLog(): void {
  processedLog._clear();
}

// ---------------------------------------------------------------------------
// Event processing — maps product → entitlement and mutates entitlements via the
// service layer. NEVER call this on an unverified event. Returns a non-sensitive
// result describing the action taken.
// ---------------------------------------------------------------------------
export type WebhookAction =
  | "granted"
  | "refunded"
  | "revoked"
  | "suspended"
  | "noop"
  | "ignored" // type not in allowlist
  | "unmapped" // product could not be resolved to an entitlement
  | "invalid"; // event missing required fields

export interface ProcessResult {
  ok: boolean;
  eventId: string;
  type: string;
  action: WebhookAction;
  message: string;
}

/** Resolve an event's product → internal checkout item (staging id or provider id). */
function resolveItem(data: WebhookEventData): CheckoutItemDefinition | null {
  if (data.checkoutItemId) return resolveCheckoutItem(data.checkoutItemId);
  if (data.providerProductId) return providerProductToCheckoutItem(data.providerProductId);
  return null;
}

export async function processEvent(event: WebhookEvent): Promise<ProcessResult> {
  const base = { eventId: event.id, type: event.type };

  if (!isAllowedEventType(event.type)) {
    return { ...base, ok: true, action: "ignored", message: "event type not in allowlist" };
  }

  const type = event.type as WebhookEventType;
  const data = event.data ?? {};

  switch (type) {
    case "purchase.completed":
    case "subscription.renewed": {
      const item = resolveItem(data);
      if (!item) return { ...base, ok: false, action: "unmapped", message: "product not mapped to an entitlement" };
      const customer = await ensureCustomer({
        email: data.customer?.email ?? null,
        externalRef: data.customer?.externalRef ?? null,
        organizationId: data.organizationId ?? data.customer?.organizationId ?? null,
      });
      await grantEntitlement({
        customerId: customer.id,
        entitlementId: item.entitlementId,
        licenseType: data.licenseType ?? item.licenseType,
        purchaseId: data.purchaseId ?? null,
        source: "webhook",
        organizationId: customer.organizationId,
        seatCount: data.seatCount ?? item.seatAllowance,
      });
      return { ...base, ok: true, action: "granted", message: `granted ${item.entitlementId}` };
    }

    case "refund.created":
    case "refund.completed": {
      if (!data.purchaseId) return { ...base, ok: false, action: "invalid", message: "refund event missing purchaseId" };
      const r = await refundPurchase(data.purchaseId, "webhook");
      return { ...base, ok: true, action: "refunded", message: `refunded ${r.entitlements} entitlement(s)` };
    }

    case "dispute.opened": {
      // A dispute suspends access pending resolution (reversible, unlike refund).
      const customer = await ensureCustomer({
        email: data.customer?.email ?? null,
        externalRef: data.customer?.externalRef ?? null,
        organizationId: data.organizationId ?? data.customer?.organizationId ?? null,
      });
      const r = await revokeCustomer(customer.id, data.reason ?? "dispute", "webhook", "suspended");
      return { ...base, ok: true, action: "suspended", message: `suspended ${r.entitlements} entitlement(s)` };
    }

    case "subscription.cancelled": {
      const customer = await ensureCustomer({
        email: data.customer?.email ?? null,
        externalRef: data.customer?.externalRef ?? null,
        organizationId: data.organizationId ?? data.customer?.organizationId ?? null,
      });
      const r = await revokeCustomer(customer.id, data.reason ?? "subscription-cancelled", "webhook", "revoked");
      return { ...base, ok: true, action: "revoked", message: `revoked ${r.entitlements} entitlement(s)` };
    }

    case "customer.updated":
    case "purchase.updated": {
      // Ensure the customer record exists/settles; no entitlement change implied.
      await ensureCustomer({
        email: data.customer?.email ?? null,
        externalRef: data.customer?.externalRef ?? null,
        organizationId: data.organizationId ?? data.customer?.organizationId ?? null,
      });
      return { ...base, ok: true, action: "noop", message: "customer/purchase metadata acknowledged" };
    }

    case "payment.failed": {
      // A failed payment grants nothing; acknowledge without state change.
      return { ...base, ok: true, action: "noop", message: "payment failure acknowledged (no grant)" };
    }
  }
}

/** Whether the STAGING JSON adapter may be used (dev/private-preview only). */
export function stagingModeEnabled(): boolean {
  return commerce.launchMode === "development" || commerce.launchMode === "private-preview";
}
