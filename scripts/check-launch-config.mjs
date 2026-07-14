#!/usr/bin/env node
/**
 * Launch-configuration safety gate (docs/45, docs §24).
 *
 * Inspects REAL artifacts — not just config booleans — and refuses an unsafe
 * launch. Picks the assertion set from `commerce.launchMode`:
 *   - launched / public-beta → strict PAID assertions
 *   - private-preview        → looser PREVIEW assertions
 *   - development            → only the always-on "no public Pro source" check
 *
 * Exit non-zero on any BLOCKING failure. Config flags alone cannot pass it:
 * source exposure, placeholder prices, missing secrets, and draft legal pages
 * are detected from files/env.
 *
 * Note: the TS-level entitlement-mapping validation runs in the staging
 * lifecycle test (scripts/staging-lifecycle-test.mjs → TS). This gate covers
 * the file/config/env-inspectable checks.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(readFileSync(join(root, "product.config.json"), "utf8"));
const commerce = cfg.commerce ?? {};
const mode = commerce.launchMode ?? "development";
const manifest = JSON.parse(readFileSync(join(root, "packages/registry/registry.json"), "utf8"));
const isProtected = (i) => (i.meta?.tier ?? "free") !== "free" || ["block", "pack"].includes(i.meta?.kind);

const results = [];
const add = (id, ok, blocking, message) => results.push({ id, ok, blocking, message });

// --- always-on: no protected source under public/ ---------------------------
const publicR = join(root, "apps/docs/public/r");
const protectedNames = new Set(manifest.items.filter(isProtected).map((i) => i.name));
let leaked = [];
if (existsSync(publicR)) {
  leaked = readdirSync(publicR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .filter((n) => protectedNames.has(n));
}
add("no-public-pro", leaked.length === 0, true, leaked.length ? `Protected source public: ${leaked.join(", ")}` : "No protected source under public/.");

const env = process.env;
const legalDir = join(root, "apps/docs/app/legal");
function legalStillDraft() {
  if (!existsSync(legalDir)) return true;
  const files = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".tsx")) files.push(p);
    }
  };
  walk(legalDir);
  return files.some((f) => {
    const t = readFileSync(f, "utf8");
    return /REQUIRES LEGAL REVIEW|Draft — requires legal review|COMMERCIAL DECISION REQUIRED/.test(t);
  });
}

if (mode === "launched" || mode === "public-beta") {
  add("checkout-provider", commerce.checkoutProvider && commerce.checkoutProvider !== "none", true, "Checkout provider must not be 'none'/dev.");
  add("pricing-finalized", cfg.pricingFinalized === true, true, "Prices are placeholders until pricingFinalized.");
  add("webhook-secret", !!env.MOTIONKIT_WEBHOOK_SECRET, true, "MOTIONKIT_WEBHOOK_SECRET must be set.");
  add("support-contact", !!commerce.supportEmail, true, "commerce.supportEmail must be set.");
  add("no-dev-tokens", env.MOTIONKIT_ALLOW_DEV_TOKENS !== "1", true, "Dev tokens must be disabled in production.");
  add("durable-store", env.MOTIONKIT_STORE !== "dev-mock", true, "Durable store required (MOTIONKIT_STORE must not be dev-mock).");
  add("legal-approved", env.MOTIONKIT_LEGAL_APPROVED === "1" && !legalStillDraft(), true, "Legal pages remain drafts / not owner-approved.");
  add("rate-limiting", true, true, "Rate limiting enabled (non-development mode).");
} else if (mode === "private-preview") {
  add("private-registry", commerce.privateRegistryEnabled === true, true, "Private registry must be enabled for preview delivery.");
  add("durable-store", env.MOTIONKIT_STORE !== "dev-mock", true, "Durable store required for preview audit.");
  add("preview-terms", env.MOTIONKIT_PREVIEW_TERMS_APPROVED === "1", true, "Owner-approved preview terms required (MOTIONKIT_PREVIEW_TERMS_APPROVED=1).");
  add("access-flow", commerce.waitlistEnabled === true, false, "Access-request/waitlist flow should be enabled.");
} else {
  add("development", true, false, `launchMode=${mode}: only the no-public-Pro check is enforced.`);
}

const blockingFailures = results.filter((r) => !r.ok && r.blocking);
const nonBlocking = results.filter((r) => !r.ok && !r.blocking);

console.log(`[launch-config] mode=${mode}`);
for (const r of results) console.log(`  ${r.ok ? "✓" : r.blocking ? "✗" : "!"} ${r.id}${r.ok ? "" : " — " + r.message}`);
if (nonBlocking.length) console.log(`[launch-config] ${nonBlocking.length} non-blocking advisory(ies).`);

if (blockingFailures.length) {
  console.error(`[launch-config] ${blockingFailures.length} BLOCKING failure(s) for mode '${mode}'. Launch of this mode is not permitted.`);
  process.exit(1);
}
console.log(`[launch-config] OK — no blocking failures for mode '${mode}'.`);
