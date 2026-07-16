// INTERNAL private-preview COHORT admin operations. Narrowly scoped; NEVER
// accessible to normal visitors.
//
// GATE (three layers, in order):
//   1. In `launched` / `public-beta` this route 404s — it can never run in a paid
//      production. (Same posture as app/api/dev-admin/route.ts.)
//   2. The env var MOTIONSTACK_ADMIN_SECRET MUST be set. If it is not, every request
//      403s "admin-disabled" — the admin surface is OFF unless the owner enables it.
//   3. Every request must carry `x-motionstack-admin-secret` header matching that
//      secret (constant-time compare). A missing/wrong header 401s.
//
// This is the INTERIM protected internal route for driving the preview cohort
// lifecycle (approve → invite → activate → convert / expire) without a real auth
// layer. A production admin console (docs/45) REPLACES the shared-secret model
// with authenticated, per-operator authorization + audit. Do not expose this to
// participants; do not link it from any visitor-facing page.
//
// SECRET-SAFE: the only place a plaintext registry token is ever returned is the
// `activate` action (that IS the one-time secure issuance flow). Full tokens are
// never logged and never returned by any read. The GET cohort report is REDACTED:
// token PREFIXES only, email DOMAINS only, no source, honest zero states.
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { commerce } from "../../../lib/product";
import { catalog, kindOf } from "../../../lib/catalog";
import { packs } from "../../../lib/packs";
import { waitlistProvider } from "../../../lib/server/waitlist";
import { stores } from "../../../lib/server/stores";
import {
  ensureCustomer,
  grantEntitlement,
  revokeCustomer,
} from "../../../lib/server/entitlement-service";
import { listTokenMeta } from "../../../lib/server/tokens";
import {
  approveRequest,
  recordInvite,
  activate,
  expirePreview,
  markConverted,
  getPreviewRequest,
  listPreviewRequests,
  type PreviewRequestRecord,
} from "../../../lib/server/preview-workflow";
import type { EntitlementId } from "../../../lib/commerce";

export const dynamic = "force-dynamic"; // admin ops mutate/read live stores; never cache

const DAY_MS = 86_400_000;

// ---------------------------------------------------------------------------
// Gate
// ---------------------------------------------------------------------------
function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false; // length leak is acceptable; content is not
  return timingSafeEqual(ab, bb);
}

/** Returns a response to short-circuit with, or null when the caller is authorized. */
function adminGuard(req: Request): NextResponse | null {
  // 1. Never in a paid production.
  if (commerce.launchMode === "launched" || commerce.launchMode === "public-beta") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  // 2. The secret MUST be configured, or the admin surface stays off.
  const secret = process.env.MOTIONSTACK_ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "admin-disabled", hint: "set MOTIONSTACK_ADMIN_SECRET to enable preview-admin" },
      { status: 403 },
    );
  }
  // 3. Header must match.
  const provided = req.headers.get("x-motionstack-admin-secret") ?? "";
  if (!provided || !constantTimeEqual(provided, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const KNOWN_TOP_ENTITLEMENTS = new Set<string>(["catalog.complete", "license.team", "license.agency"]);

/** Loosely validate an entitlement id string against the commerce contract. */
function isEntitlementId(value: unknown): value is EntitlementId {
  if (typeof value !== "string") return false;
  return (
    KNOWN_TOP_ENTITLEMENTS.has(value) ||
    value.startsWith("pack.") ||
    value.startsWith("block.") ||
    value.startsWith("component.")
  );
}

function previewDurationDays(): number {
  const d = commerce.previewEntitlementDurationDays;
  return typeof d === "number" && Number.isFinite(d) && d > 0 ? d : 30;
}

/** Max expiry across a customer's currently-active preview grants (null if none). */
async function currentPreviewExpiry(customerId: string): Promise<number | null> {
  const ents = await stores().entitlements.forCustomer(customerId);
  const now = Date.now();
  const live = ents
    .filter((e) => e.state === "active" && e.licenseType === "preview")
    .map((e) => e.expiresAt)
    .filter((x): x is number => typeof x === "number" && x > now);
  return live.length ? Math.max(...live) : null;
}

/** The preview entitlement a customer was approved with (falls back to complete catalog). */
async function previewEntitlementFor(customerId: string): Promise<EntitlementId> {
  const rec = (await listPreviewRequests()).find((r) => r.customerId === customerId);
  return rec?.entitlementId ?? ("catalog.complete" as EntitlementId);
}

// ---------------------------------------------------------------------------
// POST — cohort operations
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  const guard = adminGuard(req);
  if (guard) return guard;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "");
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const customerId = typeof body.customerId === "string" ? body.customerId.trim() : "";

  try {
    switch (action) {
      // --- reads -----------------------------------------------------------
      case "list-requests": {
        const requests = await listPreviewRequests();
        return NextResponse.json({ ok: true, count: requests.length, requests });
      }
      case "view-request": {
        if (!email) return NextResponse.json({ error: "email-required" }, { status: 400 });
        const rec = await getPreviewRequest(email);
        if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
        return NextResponse.json({ ok: true, request: rec });
      }

      // --- lifecycle -------------------------------------------------------
      case "approve-request": {
        if (!email) return NextResponse.json({ error: "email-required" }, { status: 400 });
        const entitlementId = isEntitlementId(body.entitlementId)
          ? body.entitlementId
          : ("catalog.complete" as EntitlementId);
        // expiresAt = now + previewEntitlementDurationDays (owner may override with a future epoch ms).
        const expiresAt =
          typeof body.expiresAt === "number" && Number.isFinite(body.expiresAt) && body.expiresAt > Date.now()
            ? body.expiresAt
            : Date.now() + previewDurationDays() * DAY_MS;
        const result = await approveRequest({ email, entitlementId, expiresAt });
        const status = result.status === "error" ? 400 : 200;
        return NextResponse.json({ ok: result.status !== "error", result }, { status });
      }
      case "reject-request": {
        if (!email) return NextResponse.json({ error: "email-required" }, { status: 400 });
        const rec = await getPreviewRequest(email);
        if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
        // The preview-workflow module exposes no durable "rejected" transition
        // (docs/45), so rejection here is enforced at the access layer: if the
        // participant already holds a grant, revoke it (entitlements + tokens);
        // otherwise the request is simply left un-approved. No invented state.
        let revoked: { entitlements: number; tokens: number } | null = null;
        if (rec.customerId) {
          revoked = await revokeCustomer(rec.customerId, "preview-rejected", "preview-admin");
        }
        return NextResponse.json({
          ok: true,
          result: {
            status: "rejected",
            recordId: rec.id,
            accessRevoked: revoked,
            note: rec.customerId
              ? "Access revoked (entitlements + registry tokens). Durable 'rejected' record state is not exposed by the preview-workflow API (docs/45)."
              : "Left un-approved; no grant existed to revoke. Durable 'rejected' record state is not exposed by the preview-workflow API (docs/45).",
          },
        });
      }
      case "create-preview-customer": {
        if (!email) return NextResponse.json({ error: "email-required" }, { status: 400 });
        const customer = await ensureCustomer({ email });
        return NextResponse.json({ ok: true, customerId: customer.id, email: customer.email });
      }
      case "create-preview-entitlement": {
        if (!customerId) return NextResponse.json({ error: "customerId-required" }, { status: 400 });
        if (!isEntitlementId(body.entitlementId)) {
          return NextResponse.json({ error: "invalid-entitlement-id" }, { status: 400 });
        }
        const expiresAt =
          typeof body.expiresAt === "number" && Number.isFinite(body.expiresAt) && body.expiresAt > Date.now()
            ? body.expiresAt
            : Date.now() + previewDurationDays() * DAY_MS;
        const ent = await grantEntitlement({
          customerId,
          entitlementId: body.entitlementId,
          licenseType: "preview",
          source: "preview-activation",
          expiresAt,
        });
        return NextResponse.json({ ok: true, entitlementRecordId: ent.id, entitlementId: ent.entitlementId, expiresAt });
      }
      case "set-expiration": {
        if (!customerId) return NextResponse.json({ error: "customerId-required" }, { status: 400 });
        if (typeof body.expiresAt !== "number" || !Number.isFinite(body.expiresAt) || body.expiresAt <= Date.now()) {
          return NextResponse.json({ error: "future-expiresAt-required" }, { status: 400 });
        }
        // The store exposes no in-place expiry edit, so this issues a FRESH preview
        // grant expiring at the requested time. Access = any active, unexpired grant,
        // so this reliably EXTENDS to a later date; it cannot shorten an existing
        // later grant. To hard-shorten, use `revoke` then re-grant.
        const entitlementId = await previewEntitlementFor(customerId);
        const ent = await grantEntitlement({
          customerId,
          entitlementId,
          licenseType: "preview",
          source: "preview-activation",
          expiresAt: body.expiresAt,
        });
        return NextResponse.json({
          ok: true,
          entitlementRecordId: ent.id,
          entitlementId,
          expiresAt: body.expiresAt,
          note: "Issued a fresh preview grant at the requested expiry (interim: no in-place expiry edit).",
        });
      }
      case "extend": {
        if (!customerId) return NextResponse.json({ error: "customerId-required" }, { status: 400 });
        const days = typeof body.days === "number" && Number.isFinite(body.days) ? Math.round(body.days) : 0;
        if (days <= 0) return NextResponse.json({ error: "positive-days-required" }, { status: 400 });
        const base = (await currentPreviewExpiry(customerId)) ?? Date.now();
        const expiresAt = Math.max(base, Date.now()) + days * DAY_MS;
        const entitlementId = await previewEntitlementFor(customerId);
        const ent = await grantEntitlement({
          customerId,
          entitlementId,
          licenseType: "preview",
          source: "preview-activation",
          expiresAt,
        });
        return NextResponse.json({
          ok: true,
          entitlementRecordId: ent.id,
          entitlementId,
          expiresAt,
          note: `Extended by ${days} day(s) via a fresh preview grant (interim: no in-place expiry edit).`,
        });
      }
      case "invite": {
        if (!email) return NextResponse.json({ error: "email-required" }, { status: 400 });
        const result = await recordInvite(email);
        const status = result.status === "error" ? 400 : 200;
        return NextResponse.json({ ok: result.status !== "error", result }, { status });
      }
      case "activate": {
        if (!customerId) return NextResponse.json({ error: "customerId-required" }, { status: 400 });
        const result = await activate({ customerId });
        if (result.status === "error") {
          return NextResponse.json({ ok: false, result }, { status: 400 });
        }
        // result.token is the plaintext — returned exactly ONCE, never persisted/logged.
        return NextResponse.json({ ok: true, result });
      }
      case "revoke": {
        if (!customerId) return NextResponse.json({ error: "customerId-required" }, { status: 400 });
        // Fully close access: revoke entitlements + tokens, and mark the preview
        // record expired so downstream state is consistent.
        const revoked = await revokeCustomer(customerId, "preview-revoked", "preview-admin");
        const expired = await expirePreview(customerId);
        return NextResponse.json({ ok: true, result: { revoked, expired } });
      }
      case "convert": {
        if (!customerId) return NextResponse.json({ error: "customerId-required" }, { status: 400 });
        const result = await markConverted(customerId);
        const status = result.status === "error" ? 400 : 200;
        return NextResponse.json({ ok: result.status !== "error", result }, { status });
      }

      default:
        return NextResponse.json({ error: "unknown-action", action }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: "internal-error", message: (err as Error).message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET ?what=cohort-report — REDACTED cohort + analytics report.
// Reads the durable stores. Token PREFIXES only, email DOMAINS only, no source,
// honest ZERO states (missing signals report 0, never invented).
// ---------------------------------------------------------------------------
function emailDomain(email: string | null | undefined): string {
  if (!email) return "unknown";
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1).toLowerCase() : "unknown";
}

/** Classify a registry audit item by name against the catalog + packs. */
function classifyItem(item: string): { free: boolean; proComponent: boolean; block: boolean; pack: boolean } {
  const packItemNames = new Set(packs.map((p) => p.packRegistryItem));
  const entry = catalog.find((c) => c.registryItem === item);
  const kind = entry ? kindOf(entry) : "component";
  const pack = packItemNames.has(item) || kind === "pack";
  const block = kind === "block";
  const free = entry?.access === "free";
  const proComponent = entry?.access === "pro" && kind === "component";
  return { free, proComponent, block, pack };
}

export async function GET(req: Request) {
  const guard = adminGuard(req);
  if (guard) return guard;

  const url = new URL(req.url);
  if (url.searchParams.get("what") !== "cohort-report") {
    return NextResponse.json({ error: "unknown-query", hint: "GET ?what=cohort-report" }, { status: 400 });
  }

  // --- access requests (waitlist) — honest 0 if the provider isn't configured.
  let accessRequests = 0;
  try {
    accessRequests = (await waitlistProvider().list()).length;
  } catch {
    accessRequests = 0;
  }

  // --- preview cohort lifecycle.
  const requests: PreviewRequestRecord[] = await listPreviewRequests();
  const reached = (r: PreviewRequestRecord, state: string) =>
    r.state === state || r.history.some((h) => h.to === state);
  const byState: Record<string, number> = {
    "request-submitted": 0,
    approved: 0,
    invited: 0,
    activated: 0,
    expired: 0,
    converted: 0,
    rejected: 0,
    duplicate: 0,
  };
  for (const r of requests) byState[r.state] = (byState[r.state] ?? 0) + 1;

  const approvedCount = requests.filter((r) => reached(r, "approved")).length;
  const activatedCount = requests.filter((r) => reached(r, "activated")).length;
  const convertedCount = requests.filter((r) => reached(r, "converted")).length;

  // --- tokens created (scoped to preview-cohort customers). Prefixes only.
  const customerIds = Array.from(new Set(requests.map((r) => r.customerId).filter((x): x is string => !!x)));
  const tokenPrefixes: string[] = [];
  for (const cid of customerIds) {
    const meta = await listTokenMeta(cid); // metadata only — never plaintext
    for (const m of meta) tokenPrefixes.push(m.prefix);
  }

  // --- registry audit metrics (grants / denials / by item class).
  const audit = await stores().audit.recent(100_000);
  let grants = 0;
  let denials = 0;
  let freeInstalls = 0;
  let proRequests = 0;
  let blockRequests = 0;
  let packRequests = 0;
  for (const e of audit) {
    const granted = e.result === "granted";
    if (granted) grants++;
    else denials++;
    const cls = classifyItem(e.item);
    if (granted && cls.free) freeInstalls++;
    if (cls.proComponent) proRequests++;
    if (cls.block) blockRequests++;
    if (cls.pack) packRequests++;
  }

  // --- feedback submitted — no server-readable feedback store exists (the intake
  // route keeps entries in a module-private in-memory buffer). Report honest 0.
  const feedbackSubmitted = 0;

  // --- redacted per-participant view: email DOMAIN + state + token prefixes only.
  const participants = requests.map((r) => ({
    emailDomain: emailDomain(r.email),
    state: r.state,
    hasCustomer: !!r.customerId,
    entitlementId: r.entitlementId,
    expiresAt: r.expiresAt,
  }));

  return NextResponse.json({
    ok: true,
    generatedAt: Date.now(),
    launchMode: commerce.launchMode,
    cohortSize: commerce.previewCohortSize ?? null,
    previewDurationDays: previewDurationDays(),
    redaction: "Token prefixes only; email domains only; no source; no full tokens; no PII.",
    counts: {
      accessRequests,
      previewParticipants: requests.length,
      approved: approvedCount,
      invited: byState.invited,
      activated: activatedCount,
      converted: convertedCount,
      expired: byState.expired,
      rejected: byState.rejected,
      duplicate: byState.duplicate,
      tokensCreated: tokenPrefixes.length,
      registryRequests: audit.length,
      grants,
      denials,
      freeInstalls,
      proRequests,
      blockRequests,
      packRequests,
      feedbackSubmitted,
    },
    byState,
    tokenPrefixes, // e.g. "mk_test_AbCd" — identification only, never the full token
    participants,
    notes: {
      tokensCreated: "Counted across preview-cohort customers only (customers referenced by a preview request).",
      feedbackSubmitted: "No server-readable feedback store; the intake route buffers in memory (docs/47). Reported as 0.",
      zeroStates: "All counts default to 0 and reflect only real recorded data — nothing is invented.",
    },
  });
}
