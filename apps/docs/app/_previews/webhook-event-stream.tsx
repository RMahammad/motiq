"use client";

import * as React from "react";

import {
  WebhookEventStream,
  type WebhookEvent,
  type WebhookDeliveryStatus,
  type WebhookStreamStatus,
} from "@/registry/developer-tools/webhook-event-stream";

/* -------------------------------------------------------------------------
 * DEMO ONLY — a fictional "Integrations · Webhook deliveries" console. Every
 * endpoint, id, signature and payload below is invented and local; there is NO
 * real webhook system here. The component only renders whatever events + state
 * the console passes it. There are deliberately NO real secrets: credential
 * headers are pre-masked placeholders (e.g. "sha256=••••••") and the stream
 * redacts them anyway — the raw value is never in the DOM, copy, or search.
 * ---------------------------------------------------------------------- */

// Fixed base timestamp so the server-rendered initial state is deterministic.
// Post-mount handlers advance from this same baseline — never wall-clock now().
const BASE_TS = 1_700_000_000_000;

interface ScriptItem {
  event: string;
  status: WebhookDeliveryStatus;
  endpoint: string;
  statusCode?: number;
  retryCount?: number;
  durationMs?: number;
  error?: string;
  payload: Record<string, unknown>;
}

// A scripted, fictional delivery feed that loops. Realistic shape, invented data.
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
    error: "Endpoint rate-limited (429) - backing off before the next attempt.",
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
    error: "Origin returned 500 on all 3 attempts - delivery parked in the dead-letter queue.",
    payload: { id: "dlv_204", reason: "origin_error" },
  },
  {
    event: "refund.created",
    status: "delivered",
    endpoint: "https://hooks.acme-demo.app/stripe",
    statusCode: 200,
    durationMs: 129,
    payload: { id: "re_18d", amount: 4200, payment: "pay_9Kq2" },
  },
  {
    event: "dispute.opened",
    status: "pending",
    endpoint: "https://hooks.acme-demo.app/risk",
    durationMs: undefined,
    payload: { id: "dp_02", amount: 4200, reason: "fraudulent" },
  },
];

// Every event carries a fictional signing header — pre-masked, then redacted.
const DEMO_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "X-Webhook-Id": "whsec_demo",
  "X-Webhook-Signature": "sha256=••••••",
  "User-Agent": "acme-webhooks/2.1",
};

let counter = 0;
function makeEvent(item: ScriptItem, ts: number): WebhookEvent {
  counter += 1;
  return {
    id: `evt-${counter}`,
    event: item.event,
    status: item.status,
    endpoint: item.endpoint,
    statusCode: item.statusCode,
    retryCount: item.retryCount ?? 0,
    durationMs: item.durationMs,
    error: item.error,
    timestamp: ts,
    headers: DEMO_HEADERS,
    payload: item.payload,
  };
}

const controlBtn =
  "inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))]";

export function WebhookEventStreamPreview() {
  const [events, setEvents] = React.useState<WebhookEvent[]>(() =>
    SCRIPT.slice(0, 4).map((item, i) => makeEvent(item, BASE_TS + i * 1600)),
  );
  const [paused, setPaused] = React.useState(false);
  const [follow, setFollow] = React.useState(true);
  const [status, setStatus] = React.useState<WebhookStreamStatus>("streaming");
  const [replays, setReplays] = React.useState(0);
  const step = React.useRef(4);
  // One deterministic clock: initial events sit at BASE_TS + i*1600; every
  // subsequent (post-mount) delivery advances from that same baseline, so the
  // demo never mixes a fixed initial clock with real wall-time.
  const clock = React.useRef(BASE_TS + 4 * 1600);
  const nextTs = React.useCallback(() => {
    clock.current += 1400;
    return clock.current;
  }, []);

  // Auto-generator: append a scripted delivery on an interval while live.
  React.useEffect(() => {
    if (paused || status !== "streaming") return;
    const timer = setInterval(() => {
      const item = SCRIPT[step.current % SCRIPT.length];
      step.current += 1;
      setEvents((prev) => [...prev, makeEvent(item, nextTs())]);
    }, 1600);
    return () => clearInterval(timer);
  }, [paused, status, nextTs]);

  const addFailed = React.useCallback(() => {
    const failed = SCRIPT.find((s) => s.status === "failed")!;
    setEvents((prev) => [...prev, makeEvent(failed, nextTs())]);
    setStatus("streaming");
  }, [nextTs]);

  // Presentation-only: "retry" flips a parked delivery to retrying, then delivered.
  const retryTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
  }, []);
  const handleRetry = React.useCallback((target: WebhookEvent) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === target.id
          ? { ...e, status: "retrying" as WebhookDeliveryStatus, retryCount: (e.retryCount ?? 0) + 1, error: "Retrying delivery…" }
          : e,
      ),
    );
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryTimer.current = setTimeout(() => {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === target.id
            ? { ...e, status: "delivered" as WebhookDeliveryStatus, statusCode: 200, durationMs: 151, error: undefined }
            : e,
        ),
      );
    }, 1100);
  }, []);

  return (
    <div className="w-full max-w-[860px]">
      {/* Console chrome ---------------------------------------------------- */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12px] font-semibold text-[var(--color-fg)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> Integrations · Webhook deliveries
        </span>
        <span className="text-[11.5px] text-[var(--color-muted)]">Fictional demo data · no live endpoints</span>
        {replays > 0 ? (
          <span className="ml-auto text-[11.5px] tabular-nums text-[var(--color-muted)]">{replays} replayed</span>
        ) : null}
      </div>

      <WebhookEventStream
        events={events}
        status={status}
        paused={paused}
        onPausedChange={setPaused}
        follow={follow}
        onFollowChange={setFollow}
        maxEvents={200}
        title="acme · production webhooks"
        onRetry={handleRetry}
        onReplay={(e) => {
          setReplays((c) => c + 1);
          setEvents((prev) => [...prev, makeEvent({ ...SCRIPT.find((s) => s.event === e.event) ?? SCRIPT[0], event: e.event }, nextTs())]);
        }}
        errorMessage="The webhook delivery worker disconnected. Reconnect to resume the feed."
        onReconnect={() => setStatus("streaming")}
        className="[--webhook-height:26rem]"
      />

      {/* Working controls -------------------------------------------------- */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5" role="group" aria-label="Demo controls">
        <button type="button" className={controlBtn} onClick={addFailed}>Add failed delivery</button>
        <span className="mx-1 h-4 w-px bg-[var(--color-border)]" aria-hidden />
        <button type="button" className={controlBtn} onClick={() => setPaused(true)} disabled={paused}>Pause</button>
        <button type="button" className={controlBtn} onClick={() => setPaused(false)} disabled={!paused}>Resume</button>
        <button type="button" className={controlBtn} onClick={() => setFollow((f) => !f)} aria-pressed={follow}>
          {follow ? "Following" : "Follow off"}
        </button>
        <span className="mx-1 h-4 w-px bg-[var(--color-border)]" aria-hidden />
        <button type="button" className={controlBtn} onClick={() => setStatus("error")}>Simulate disconnect</button>
        <button
          type="button"
          className={controlBtn}
          onClick={() => {
            setEvents([]);
            setStatus("idle");
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default WebhookEventStreamPreview;
