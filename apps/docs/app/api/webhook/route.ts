// Provider-neutral webhook endpoint (docs/41). POST only.
//
//   POST /api/webhook
//     Body: RAW text (a signed provider/staging event) — read UNPARSED so the
//           signature is verified against the exact bytes.
//     Header: x-motiq-signature: <hex HMAC-SHA256 of the raw body>
//                                    (or "sha256=<hex>")
//
//   200 processed / duplicate / ignored (idempotent, non-retryable)
//   400 malformed body or stale timestamp
//   401 missing/invalid signature, or no signing secret configured (fail closed)
//   422 event could not be mapped to an entitlement (provider not yet approved)
//   503 staging adapter not permitted and no real provider is configured
//
// An UNVERIFIED webhook never grants anything: verification happens before any
// parse/dedup/process step, and no source or secret is ever returned.
import { NextResponse } from "next/server";

import { commerce } from "../../../lib/product";
import {
  verifyWebhook,
  parseStagingEvent,
  withinTolerance,
  alreadyProcessed,
  markProcessed,
  processEvent,
  stagingModeEnabled,
} from "../../../lib/server/webhook";

export const dynamic = "force-dynamic"; // a webhook must never be cached

const SIGNATURE_HEADER = "x-motiq-signature";

export async function POST(req: Request) {
  const secret = process.env.MOTIQ_WEBHOOK_SECRET ?? null;

  // Fail closed: with no signing secret we cannot verify anything, so reject.
  if (!secret) {
    return NextResponse.json({ error: "webhook-not-configured" }, { status: 401 });
  }

  // Only the STAGING JSON adapter exists today. Outside dev/private-preview a real
  // provider must be configured; otherwise refuse rather than trust a JSON body.
  if (!stagingModeEnabled() && commerce.checkoutProvider === "none") {
    return NextResponse.json({ error: "no-provider" }, { status: 503 });
  }

  // Read the RAW body — do NOT JSON.parse before verifying the signature.
  const rawBody = await req.text();
  const signature = req.headers.get(SIGNATURE_HEADER);

  if (!verifyWebhook(rawBody, signature, secret)) {
    return NextResponse.json({ error: "invalid-signature" }, { status: 401 });
  }

  // Verified — now safe to interpret the body as an event.
  const event = parseStagingEvent(rawBody);
  if (!event) {
    return NextResponse.json({ error: "malformed-event" }, { status: 400 });
  }

  if (!withinTolerance(event.createdAt, Date.now())) {
    return NextResponse.json({ error: "stale-timestamp", eventId: event.id }, { status: 400 });
  }

  // Idempotency — a replayed event id is acknowledged but never re-processed.
  if (alreadyProcessed(event.id)) {
    return NextResponse.json({ ok: true, duplicate: true, eventId: event.id }, { status: 200 });
  }

  const result = await processEvent(event);

  // Unmapped product → provider not yet approved. Do NOT mark processed so the
  // event can be retried once a provider mapping is configured.
  if (!result.ok && result.action === "unmapped") {
    return NextResponse.json({ error: "unmapped-product", eventId: event.id }, { status: 422 });
  }
  if (!result.ok && result.action === "invalid") {
    return NextResponse.json({ error: "invalid-event", eventId: event.id }, { status: 400 });
  }

  // Handled (granted / refunded / revoked / suspended / noop / ignored) — record
  // the id so it is never processed twice, and acknowledge.
  markProcessed(event.id);
  return NextResponse.json({ ok: true, eventId: event.id, action: result.action }, { status: 200 });
}
