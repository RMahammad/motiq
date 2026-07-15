"use client";

import * as React from "react";

import {
  WebhookEventStream,
  type WebhookEvent,
} from "@/registry/developer-tools/webhook-event-stream";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL WebhookEventStream in
 * one representative streaming state — a populated, deterministic delivery feed
 * (delivered / retrying / failed) — with no Add/Pause/Clear controls and no
 * preview timer. Signing headers are pre-masked and redacted. Timestamps are
 * fixed. The detail page keeps the full live-stream rig.
 */

const BASE_TS = 1_700_000_000_000;

const DEMO_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "X-Webhook-Id": "whsec_demo",
  "X-Webhook-Signature": "sha256=••••••",
};

interface ScriptItem {
  event: string;
  status: WebhookEvent["status"];
  endpoint: string;
  statusCode?: number;
  retryCount?: number;
  durationMs?: number;
  error?: string;
  payload: Record<string, unknown>;
}

const SCRIPT: ScriptItem[] = [
  {
    event: "payment.succeeded",
    status: "delivered",
    endpoint: "https://hooks.acme-demo.app/stripe",
    statusCode: 200,
    durationMs: 138,
    payload: { id: "pay_9Kq2", amount: 4200, currency: "usd", customer: "cus_31a" },
  },
  {
    event: "invoice.finalized",
    status: "delivered",
    endpoint: "https://hooks.acme-demo.app/billing",
    statusCode: 200,
    durationMs: 211,
    payload: { id: "inv_5m2", total: 9900, lines: 3 },
  },
  {
    event: "subscription.updated",
    status: "retrying",
    endpoint: "https://hooks.acme-demo.app/billing",
    statusCode: 429,
    retryCount: 1,
    durationMs: 88,
    error: "Endpoint rate-limited (429) — backing off before the next attempt.",
    payload: { id: "sub_7ab", plan: "team", seats: 12 },
  },
  {
    event: "customer.created",
    status: "delivered",
    endpoint: "https://hooks.acme-demo.app/crm",
    statusCode: 201,
    durationMs: 164,
    payload: { id: "cus_88f", email: "person@example.test", source: "checkout" },
  },
  {
    event: "delivery.failed",
    status: "failed",
    endpoint: "https://hooks.partner-demo.app/in",
    statusCode: 500,
    retryCount: 3,
    durationMs: 30000,
    error: "Origin returned 500 on all 3 attempts — delivery parked in the dead-letter queue.",
    payload: { id: "dlv_204", reason: "origin_error" },
  },
];

const EVENTS: WebhookEvent[] = SCRIPT.map((item, i) => ({
  id: `evt-${i + 1}`,
  event: item.event,
  status: item.status,
  endpoint: item.endpoint,
  statusCode: item.statusCode,
  retryCount: item.retryCount ?? 0,
  durationMs: item.durationMs,
  error: item.error,
  timestamp: BASE_TS + i * 1600,
  headers: DEMO_HEADERS,
  payload: item.payload,
}));

export function WebhookEventStreamCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <WebhookEventStream
        events={EVENTS}
        status="streaming"
        title="acme · production webhooks"
        className="[--webhook-height:16rem]"
      />
    </div>
  );
}

export default WebhookEventStreamCatalogPreview;
