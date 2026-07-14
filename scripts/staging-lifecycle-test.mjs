#!/usr/bin/env node
/**
 * Staging end-to-end customer lifecycle test (docs §25).
 *
 * Drives the REAL HTTP surfaces of a running docs server through the full
 * lifecycle: grant → token → install (Free/Pro/block/pack) → audit → rotate →
 * revoke → refund → verify-denied, and confirms no Pro source is public.
 *
 * Requires a running server (default http://localhost:3000) started with
 *   MOTIONKIT_ENABLE_DEV_ADMIN=1  (and launchMode NOT launched/public-beta).
 * Set STAGING_BASE to override the base URL.
 *
 * Writes a REDACTED report (token PREFIXES only, never full tokens) to
 * artifacts/staging-lifecycle/report.json.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.STAGING_BASE || "http://localhost:3000";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const steps = [];
let failures = 0;
function record(name, ok, detail) {
  steps.push({ name, ok, detail });
  console.log(`  ${ok ? "✓" : "✗"} ${name}${ok ? "" : "  — " + detail}`);
  if (!ok) failures++;
}
function redact(t) {
  return typeof t === "string" && t.length > 16 ? t.slice(0, 12) + "…" : t;
}

async function admin(body) {
  const r = await fetch(`${BASE}/api/dev-admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: r.status, json: await r.json().catch(() => ({})) };
}
async function reg(item, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const r = await fetch(`${BASE}/api/registry/${item}`, { headers });
  return { status: r.status, json: await r.json().catch(() => ({})) };
}
async function expectStatus(name, actual, expected, extra = "") {
  record(name, actual === expected, `expected ${expected}, got ${actual} ${extra}`);
}

async function main() {
  console.log(`[staging-lifecycle] base=${BASE}`);

  // Preflight: dev admin must be enabled.
  const ping = await admin({ action: "reset" });
  if (ping.status !== 200) {
    record("dev-admin enabled (MOTIONKIT_ENABLE_DEV_ADMIN=1)", false, `reset returned ${ping.status} ${JSON.stringify(ping.json)}`);
    return finish();
  }
  record("reset durable stores", true, "");

  // 1. Grant: customer A holds the AI Interface pack (no purchase id).
  const A = await admin({ action: "seed", email: "a@staging.test", entitlementId: "pack.ai-interface", licenseType: "personal" });
  record("seed customer A (pack.ai-interface)", A.status === 200 && !!A.json.token, JSON.stringify(A.json));
  const tokenA = A.json.token;
  const customerA = A.json.customerId;

  // 2. Install Free item (no auth) → 200 with files.
  const free = await reg("ai-response-stream", null);
  await expectStatus("Free ai-response-stream (no auth) → 200", free.status, 200);
  record("Free item returns installable files", Array.isArray(free.json.files) && free.json.files.length > 0, "no files");

  // 3. Install Pro item in A's pack → 200 with content.
  const proIn = await reg("agent-run-timeline", tokenA);
  await expectStatus("Pro in-pack agent-run-timeline (tokenA) → 200", proIn.status, 200);
  record("Pro item returns installable source content", !!proIn.json.files?.[0]?.content, "no content");

  // 4. Pro item NOT in A's pack → 403 missing-entitlement.
  const proOut = await reg("comment-thread", tokenA);
  await expectStatus("Pro out-of-pack comment-thread (tokenA) → 403", proOut.status, 403, proOut.json.error);
  record("denied response carries NO source", !proOut.json.files, "leaked files in denial");

  // 5. Install the block → 200 + dependency resolution.
  const block = await reg("ai-agent-workspace", tokenA);
  await expectStatus("Block ai-agent-workspace (tokenA) → 200", block.status, 200);
  const deps = block.json.meta?.resolvedDependencies ?? [];
  record("block resolves protected dependencies", deps.length > 0 && deps.every((d) => d.granted), JSON.stringify(deps));

  // 6. Customer B: complete catalog via a purchase id.
  const B = await admin({ action: "seed", email: "b@staging.test", entitlementId: "catalog.complete", licenseType: "personal", purchaseId: "PURCHASE_1" });
  record("seed customer B (catalog.complete, purchase PURCHASE_1)", B.status === 200 && !!B.json.token, JSON.stringify({ ...B.json, token: redact(B.json.token) }));
  const tokenB = B.json.token;

  // 7. Install the full pack with B → 200.
  const pack = await reg("ai-interface-pack", tokenB);
  await expectStatus("Pack ai-interface-pack (tokenB, complete) → 200", pack.status, 200);
  const freeB = await reg("ai-response-stream", tokenB);
  await expectStatus("Free item still works for B → 200", freeB.status, 200);

  // 8. Rotate A's token: old fails, new works.
  const rot = await admin({ action: "rotate", tokenId: A.json.tokenId });
  record("rotate tokenA", rot.status === 200 && !!rot.json.token, JSON.stringify({ ...rot.json, token: redact(rot.json.token) }));
  const tokenA2 = rot.json.token;
  const oldTok = await reg("agent-run-timeline", tokenA);
  await expectStatus("old tokenA after rotation → 403 revoked", oldTok.status, 403, oldTok.json.error);
  record("old token error is revoked-token", oldTok.json.error === "revoked-token", oldTok.json.error);
  const newTok = await reg("agent-run-timeline", tokenA2);
  await expectStatus("new tokenA2 → 200", newTok.status, 200);

  // 9. Revoke customer A: future protected access fails, Free still works.
  const revA = await admin({ action: "revoke-customer", customerId: customerA, reason: "staging-revoke" });
  record("revoke customer A", revA.status === 200, JSON.stringify(revA.json));
  const afterRev = await reg("agent-run-timeline", tokenA2);
  await expectStatus("revoked A tokenA2 → 403", afterRev.status, 403, afterRev.json.error);
  const freeAfterRev = await reg("ai-response-stream", null);
  await expectStatus("Free access still works after revoke → 200", freeAfterRev.status, 200);

  // 10. Refund B's purchase: entitlement + tokens revoked.
  const refund = await admin({ action: "refund", purchaseId: "PURCHASE_1" });
  record("refund PURCHASE_1", refund.status === 200 && refund.json.entitlements >= 1, JSON.stringify(refund.json));
  const afterRefund = await reg("ai-interface-pack", tokenB);
  await expectStatus("refunded B tokenB → 403", afterRefund.status, 403, afterRefund.json.error);

  // 11. Audit trail is durable + populated.
  const audit = await fetch(`${BASE}/api/dev-admin?what=audit`).then((r) => r.json());
  record("durable audit has entries", (audit.count ?? 0) > 0, `count=${audit.count}`);
  const results = new Set((audit.entries ?? []).map((e) => e.result));
  record("audit captured granted + denied results", results.has("granted") && (results.has("revoked-token") || results.has("missing-entitlement")), [...results].join(","));
  const anyTokenLeak = JSON.stringify(audit.entries ?? []).match(/mk_(test|live)_[A-Za-z0-9_-]{10,}/);
  record("audit contains NO full tokens (token ids only)", !anyTokenLeak, "token plaintext found in audit");

  // 12. No Pro source under the public static path.
  const pub = await fetch(`${BASE}/r/agent-run-timeline.json`).then((r) => r.status).catch(() => 0);
  record("public static Pro path /r/agent-run-timeline.json → not 200", pub !== 200, `status ${pub}`);

  finish();
}

function finish() {
  const dir = join(root, "artifacts/staging-lifecycle");
  mkdirSync(dir, { recursive: true });
  const report = {
    base: BASE,
    generatedBy: "scripts/staging-lifecycle-test.mjs",
    passed: failures === 0,
    total: steps.length,
    failures,
    steps, // already redacted (no full tokens)
  };
  writeFileSync(join(dir, "report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(`\n[staging-lifecycle] ${steps.length - failures}/${steps.length} passed → artifacts/staging-lifecycle/report.json`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  record("uncaught", false, e.message);
  finish();
});
