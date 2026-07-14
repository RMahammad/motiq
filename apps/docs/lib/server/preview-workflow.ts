// SERVER-ONLY private-preview activation workflow. Never import from a client
// component. Built ON TOP of the waitlist (access request) + entitlement + token
// layers to drive a controlled "invite → activate → expire" lifecycle for
// gated preview access.
//
// Flow (states): request-submitted → approved → invited → activated
//   ... → expired (time-boxed) or converted (preview → real purchase).
//   duplicate / rejected are terminal off-ramps.
//
// A preview grant is a REAL, time-boxed entitlement (licenseType "preview",
// source "preview-activation") with a caller-supplied expiry. Activation issues
// a registry token whose PLAINTEXT is returned exactly ONCE (never persisted,
// never emailed) — the same one-time contract as lib/server/tokens.ts.
//
// INTERIM ADMIN GATING: approveRequest / recordInvite / activate / expirePreview
// are administrative operations. There is NO auth layer here yet — callers must
// run these only from trusted server contexts (internal tooling / seeded jobs).
// A real authentication + authorization layer (docs/45) REPLACES this interim
// "trusted-caller" assumption before any public exposure.
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { newId, stores } from "./stores";
import { ensureCustomer, grantEntitlement } from "./entitlement-service";
import { createToken, revokeToken } from "./tokens";
import type { EntitlementId } from "../commerce";
import type { LicenseType, TokenEnvironment } from "./model";

// ---------------------------------------------------------------------------
// Lifecycle state machine
// ---------------------------------------------------------------------------
export type PreviewState =
  | "request-submitted"
  | "duplicate"
  | "approved"
  | "rejected"
  | "invited"
  | "activated"
  | "expired"
  | "converted";

export interface PreviewStatusChange {
  at: number;
  from: PreviewState | null;
  to: PreviewState;
  reason: string;
}

/** Durable preview-request record. Keyed by id; email is stored lowercased. */
export interface PreviewRequestRecord {
  id: string;
  /** Lowercased email — the natural key for a preview participant. */
  email: string;
  state: PreviewState;
  /** Set once the participant is approved and a customer exists. */
  customerId: string | null;
  /** Preview entitlement granted on approval (e.g. pack.ai-interface). */
  entitlementId: EntitlementId | null;
  /** When the preview access expires (epoch ms), set at approval. */
  expiresAt: number | null;
  invitedAt: number | null;
  activatedAt: number | null;
  createdAt: number;
  updatedAt: number;
  /** Append-only status history. */
  history: PreviewStatusChange[];
}

// ---------------------------------------------------------------------------
// Durable JSON collection — mirrors lib/server/stores.ts's file-backed pattern
// (atomic write via temp-file rename; same MOTIONKIT_DATA_DIR). Kept local
// because stores.ts's collection helper is not exported and shared files are
// not edited here. A real DB replaces this behind the same access shape (docs/45).
// ---------------------------------------------------------------------------
function dataDir(): string {
  return process.env.MOTIONKIT_DATA_DIR ? resolve(process.env.MOTIONKIT_DATA_DIR) : resolve(process.cwd(), ".data");
}

class JsonCollection<T extends { id: string }> {
  private cache: Map<string, T> | null = null;
  constructor(private readonly file: string) {}

  private path(): string {
    return join(dataDir(), this.file);
  }
  private load(): Map<string, T> {
    if (this.cache) return this.cache;
    const m = new Map<string, T>();
    try {
      if (existsSync(this.path())) {
        const arr = JSON.parse(readFileSync(this.path(), "utf8")) as T[];
        for (const r of arr) m.set(r.id, r);
      }
    } catch (err) {
      // Fail closed: an unreadable store must not silently mis-drive the flow.
      throw new Error(`[preview-workflow] cannot read ${this.file}: ${(err as Error).message}`);
    }
    this.cache = m;
    return m;
  }
  private persist(m: Map<string, T>): void {
    mkdirSync(dataDir(), { recursive: true });
    const tmp = this.path() + ".tmp";
    writeFileSync(tmp, JSON.stringify([...m.values()], null, 2) + "\n");
    renameSync(tmp, this.path()); // atomic replace
  }
  all(): T[] {
    return [...this.load().values()];
  }
  find(pred: (r: T) => boolean): T | null {
    for (const r of this.load().values()) if (pred(r)) return r;
    return null;
  }
  upsert(r: T): T {
    const m = this.load();
    m.set(r.id, r);
    this.persist(m);
    return r;
  }
  /** Test/staging helper — clears the collection. Never call in real prod. */
  _clear(): void {
    this.cache = new Map();
    this.persist(this.cache);
  }
}

const previewRequests = new JsonCollection<PreviewRequestRecord>("preview-requests.json");

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function normalizeEmail(email: string): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function byEmail(email: string): PreviewRequestRecord | null {
  const key = normalizeEmail(email);
  if (!key) return null;
  return previewRequests.find((r) => r.email === key);
}

function byCustomerId(customerId: string): PreviewRequestRecord | null {
  return previewRequests.find((r) => r.customerId === customerId);
}

function transition(rec: PreviewRequestRecord, to: PreviewState, reason: string): PreviewRequestRecord {
  const now = Date.now();
  const next: PreviewRequestRecord = {
    ...rec,
    state: to,
    updatedAt: now,
    invitedAt: to === "invited" ? now : rec.invitedAt,
    activatedAt: to === "activated" ? now : rec.activatedAt,
    history: [...rec.history, { at: now, from: rec.state, to, reason }],
  };
  return previewRequests.upsert(next);
}

// ---------------------------------------------------------------------------
// Read helpers (server-only; admin views)
// ---------------------------------------------------------------------------
export async function getPreviewRequest(email: string): Promise<PreviewRequestRecord | null> {
  return byEmail(email);
}

export async function listPreviewRequests(): Promise<PreviewRequestRecord[]> {
  return previewRequests.all().sort((a, b) => b.createdAt - a.createdAt);
}

// ---------------------------------------------------------------------------
// approveRequest — admin op. Creates the customer + a time-boxed PREVIEW
// entitlement and records the approval. Idempotent-ish: re-approving an already
// approved/invited/activated participant returns "duplicate".
// ---------------------------------------------------------------------------
export interface ApproveInput {
  email: string;
  /** What the preview unlocks, e.g. "pack.ai-interface" or "catalog.complete". */
  entitlementId: EntitlementId;
  /** Caller-supplied expiry (epoch ms). REQUIRED — preview access is time-boxed. */
  expiresAt: number;
  /** Defaults to "preview". */
  licenseType?: LicenseType;
}

export type ApproveResult =
  | { status: "approved"; recordId: string; customerId: string; entitlementId: EntitlementId; expiresAt: number }
  | { status: "duplicate"; recordId: string }
  | { status: "error"; message: string };

export async function approveRequest(input: ApproveInput): Promise<ApproveResult> {
  const email = normalizeEmail(input.email);
  if (!email || !looksLikeEmail(email)) {
    return { status: "error", message: "A valid email is required to approve preview access." };
  }
  if (typeof input.expiresAt !== "number" || !Number.isFinite(input.expiresAt) || input.expiresAt <= Date.now()) {
    return { status: "error", message: "A future expiresAt (epoch ms) is required — preview access is time-boxed." };
  }

  const existing = byEmail(email);
  if (existing && (existing.state === "approved" || existing.state === "invited" || existing.state === "activated")) {
    return { status: "duplicate", recordId: existing.id };
  }

  // Real, time-boxed preview grant.
  const customer = await ensureCustomer({ email });
  await grantEntitlement({
    customerId: customer.id,
    entitlementId: input.entitlementId,
    licenseType: input.licenseType ?? "preview",
    source: "preview-activation",
    expiresAt: input.expiresAt,
  });

  const now = Date.now();
  const base: PreviewRequestRecord = existing ?? {
    id: newId("prev"),
    email,
    state: "request-submitted",
    customerId: null,
    entitlementId: null,
    expiresAt: null,
    invitedAt: null,
    activatedAt: null,
    createdAt: now,
    updatedAt: now,
    history: [{ at: now, from: null, to: "request-submitted", reason: "seeded" }],
  };
  const withGrant: PreviewRequestRecord = {
    ...base,
    customerId: customer.id,
    entitlementId: input.entitlementId,
    expiresAt: input.expiresAt,
  };
  const saved = transition(withGrant, "approved", "preview-approved");

  return {
    status: "approved",
    recordId: saved.id,
    customerId: customer.id,
    entitlementId: input.entitlementId,
    expiresAt: input.expiresAt,
  };
}

// ---------------------------------------------------------------------------
// recordInvite — admin op. Marks that the invitation was sent (the actual email
// is dispatched by lib/server/email.ts previewInvitation). No secrets here.
// ---------------------------------------------------------------------------
export type InviteResult =
  | { status: "invited"; recordId: string }
  | { status: "error"; message: string };

export async function recordInvite(email: string): Promise<InviteResult> {
  const rec = byEmail(email);
  if (!rec) return { status: "error", message: "No preview request found for this email." };
  if (rec.state !== "approved" && rec.state !== "invited") {
    return { status: "error", message: `Cannot invite from state "${rec.state}".` };
  }
  const saved = transition(rec, "invited", "invite-sent");
  return { status: "invited", recordId: saved.id };
}

// ---------------------------------------------------------------------------
// activate — participant claims access. Issues a registry token scoped to the
// preview entitlement, expiring with the preview. The PLAINTEXT is returned
// ONCE and never persisted (see lib/server/tokens.ts).
// ---------------------------------------------------------------------------
export interface ActivateInput {
  customerId: string;
  /** Token environment; preview tokens default to "test". */
  environment?: TokenEnvironment;
  label?: string;
}

export type ActivateResult =
  | {
      status: "activated";
      recordId: string;
      /** Registry token plaintext — return to the customer ONCE; never stored/emailed. */
      token: string;
      tokenId: string;
      tokenPrefix: string;
      expiresAt: number | null;
    }
  | { status: "error"; message: string };

export async function activate(input: ActivateInput): Promise<ActivateResult> {
  const rec = byCustomerId(input.customerId);
  if (!rec) return { status: "error", message: "No preview request found for this customer." };
  if (rec.state !== "invited" && rec.state !== "approved") {
    return { status: "error", message: `Cannot activate from state "${rec.state}".` };
  }
  if (rec.expiresAt != null && rec.expiresAt <= Date.now()) {
    transition(rec, "expired", "expired-before-activation");
    return { status: "error", message: "This preview invitation has expired." };
  }

  const issued = await createToken({
    customerId: input.customerId,
    environment: input.environment ?? "test",
    label: input.label ?? "Preview access",
    expiresAt: rec.expiresAt,
    scope: rec.entitlementId ? [rec.entitlementId] : [],
  });

  const saved = transition(rec, "activated", "preview-activated");
  return {
    status: "activated",
    recordId: saved.id,
    token: issued.plaintext, // ONE-TIME return; do not log or persist this value
    tokenId: issued.record.id,
    tokenPrefix: issued.record.prefix,
    expiresAt: issued.record.expiresAt,
  };
}

// ---------------------------------------------------------------------------
// expirePreview — admin/scheduled op. Ends a preview: marks the record expired
// and revokes the customer's registry tokens so protected downloads fail closed
// immediately (the entitlement's own expiresAt also stops granting).
// ---------------------------------------------------------------------------
export type ExpireResult =
  | { status: "expired"; recordId: string; tokensRevoked: number }
  | { status: "error"; message: string };

export async function expirePreview(customerId: string): Promise<ExpireResult> {
  const rec = byCustomerId(customerId);
  if (!rec) return { status: "error", message: "No preview request found for this customer." };

  // Fail closed: revoke any live tokens so access stops even before entitlement expiry is checked.
  const toks = await stores().tokens.forCustomer(customerId);
  let revoked = 0;
  for (const t of toks) {
    if (t.revokedAt == null) {
      await revokeToken(t.id);
      revoked++;
    }
  }

  const saved = transition(rec, "expired", "preview-expired");
  return { status: "expired", recordId: saved.id, tokensRevoked: revoked };
}

// ---------------------------------------------------------------------------
// markConverted — admin op. The participant purchased real access; the preview
// record is closed out as "converted" (their real entitlement lives in the
// entitlement layer, granted by checkout/webhook — not here).
// ---------------------------------------------------------------------------
export type ConvertResult =
  | { status: "converted"; recordId: string }
  | { status: "error"; message: string };

export async function markConverted(customerId: string): Promise<ConvertResult> {
  const rec = byCustomerId(customerId);
  if (!rec) return { status: "error", message: "No preview request found for this customer." };
  const saved = transition(rec, "converted", "preview-converted");
  return { status: "converted", recordId: saved.id };
}

/** Test/staging only — wipe the preview-request collection. Never in real prod. */
export function _resetPreviewWorkflowForTest(): void {
  previewRequests._clear();
}
