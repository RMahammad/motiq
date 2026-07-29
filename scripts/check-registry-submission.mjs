#!/usr/bin/env node
/**
 * Pre-flight for the shadcn registry-directory submission (LAUNCH.md § 0.3A).
 *
 * Checks the four published requirements against the LIVE site rather than the
 * local build, because the directory validator fetches the live URLs — a green
 * local build proves nothing if the deploy is behind.
 *
 *   https://ui.shadcn.com/docs/registry/registry-index
 *   1. open source and publicly accessible
 *   2. valid JSON conforming to the registry schema
 *   3. flat: /registry.json and /<item>.json at the registry root
 *   4. the `files` array must NOT include a `content` property
 *
 * Plus: the namespace must still be unclaimed in the official index.
 *
 * Usage: node scripts/check-registry-submission.mjs [--base https://motiq.dev/r]
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(ROOT, "product.config.json"), "utf8"));

const argBase = process.argv.indexOf("--base");
const BASE = (argBase > -1 ? process.argv[argBase + 1] : config.registryBaseUrl).replace(/\/$/, "");
const NAMESPACE = config.registryNamespace;
const INDEX_URL = "https://ui.shadcn.com/r/registries.json";

const results = [];
const check = (ok, label, detail = "") => results.push({ ok, label, detail });

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/* 1–2 · manifest reachable, public, schema-shaped ------------------------- */

let manifest;
try {
  manifest = await getJson(`${BASE}/registry.json`);
  check(true, "manifest is publicly reachable", `${BASE}/registry.json`);
} catch (err) {
  check(false, "manifest is publicly reachable", `${BASE}/registry.json — ${err.message}`);
}

if (manifest) {
  check(
    manifest.$schema === "https://ui.shadcn.com/schema/registry.json",
    "manifest declares the registry schema",
    manifest.$schema ?? "(missing $schema)",
  );
  check(Boolean(manifest.name), "manifest has a name", manifest.name ?? "(missing)");
  check(Boolean(manifest.homepage), "manifest has a homepage", manifest.homepage ?? "(missing)");
  check(Array.isArray(manifest.items) && manifest.items.length > 0, "manifest has items", `${manifest.items?.length ?? 0} items`);

  // The homepage is published to every consumer of the registry; a 404 there is
  // the kind of detail a reviewer notices.
  if (manifest.homepage) {
    try {
      const res = await fetch(manifest.homepage, { redirect: "follow" });
      check(res.ok, "manifest homepage resolves", `${manifest.homepage} → HTTP ${res.status}`);
    } catch (err) {
      check(false, "manifest homepage resolves", `${manifest.homepage} — ${err.message}`);
    }
  }
}

/* 3 · flat structure ------------------------------------------------------ */

if (manifest?.items?.length) {
  const nested = manifest.items.filter((i) => i.name.includes("/"));
  check(nested.length === 0, "no nested item names", nested.length ? nested.slice(0, 5).join(", ") : "all flat");

  // Spot-check that items actually resolve at the flat root path the directory
  // template implies, including one of each type present.
  const byType = new Map();
  for (const item of manifest.items) if (!byType.has(item.type)) byType.set(item.type, item.name);
  for (const [type, name] of byType) {
    try {
      const item = await getJson(`${BASE}/${name}.json`);
      const hasSource = (item.files ?? []).some((f) => typeof f.content === "string" && f.content.length > 0);
      check(hasSource, `${type} installs: ${name}.json serves source`, `${BASE}/${name}.json`);
    } catch (err) {
      check(false, `${type} installs: ${name}.json serves source`, `${BASE}/${name}.json — ${err.message}`);
    }
  }
}

/* 4 · no `content` in the manifest's files arrays -------------------------- */

if (manifest?.items?.length) {
  const withContent = manifest.items.filter((i) => (i.files ?? []).some((f) => "content" in f));
  check(
    withContent.length === 0,
    "manifest files[] carry no `content`",
    withContent.length ? `${withContent.length} offending item(s): ${withContent.slice(0, 5).map((i) => i.name).join(", ")}` : "0 of " + manifest.items.length,
  );
}

/* 5 · namespace still unclaimed ------------------------------------------- */

try {
  const index = await getJson(INDEX_URL);
  const entries = Array.isArray(index) ? index : Object.values(index.registries ?? index);
  const taken = entries.find((e) => e?.name?.toLowerCase() === NAMESPACE.toLowerCase());
  check(!taken, `${NAMESPACE} is unclaimed in the official index`, taken ? `ALREADY TAKEN → ${taken.homepage}` : `${entries.length} registries listed`);
} catch (err) {
  check(false, `${NAMESPACE} is unclaimed in the official index`, `could not read ${INDEX_URL} — ${err.message}`);
}

/* report ------------------------------------------------------------------ */

const failed = results.filter((r) => !r.ok);
for (const r of results) {
  console.log(`${r.ok ? "✓" : "✗"} ${r.label}${r.detail ? ` — ${r.detail}` : ""}`);
}
console.log("");
if (failed.length) {
  console.error(`${failed.length} of ${results.length} checks failed — do not open the directory PR yet.`);
  process.exit(1);
}
console.log(`All ${results.length} checks passed. Ready to submit ${NAMESPACE} to the shadcn registry directory.`);
console.log(`\nDirectory entry for apps/v4/registry/directory.json:`);
console.log(
  JSON.stringify(
    {
      name: NAMESPACE,
      homepage: manifest.homepage,
      url: `${BASE}/{name}.json`,
      description: config.description,
    },
    null,
    2,
  ),
);
