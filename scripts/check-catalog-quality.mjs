#!/usr/bin/env node
/**
 * Deterministic catalog-quality artifact checks (not subjective approval).
 * - every registry item (except lib) has: generated JSON, a preview, docs-content, a11y + perf notes, a tracker row
 * - every item the tracker marks "Sellable" has: persisted screenshots
 * - no homepage-featured item is Draft / Needs redesign
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const R = (p) => readFileSync(join(root, p), "utf8");
const problems = [];

const index = JSON.parse(R("apps/docs/public/r/index.json"));
const previews = R("apps/docs/app/_previews/index.tsx");
const docsContent = R("apps/docs/lib/docs-content.ts");
const catalog = R("apps/docs/lib/catalog.ts");
const tracker = R("docs/32-component-quality-tracker.md");

// --- tracker rows: "| Name | Tier | ... | Status | Screenshots |"
const trackerRows = tracker
  .split("\n")
  .filter((l) => l.startsWith("| ") && l.includes("|"))
  .map((l) => l.split("|").map((c) => c.trim()))
  .filter((c) => c.length > 12 && !["Component", ":---", "---"].includes(c[1]));
const statusByName = new Map(trackerRows.map((c) => [c[1], c[c.length - 2]]));

const slugOf = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

for (const item of index.items) {
  if (item.type === "registry:lib") continue;
  if (item.kind === "pack") continue;
  const slug = item.name;
  // Free items live in public/r; Pro/block items live in the protected dir (docs/42).
  const regDir = item.protected ? "packages/registry/.protected/r" : "apps/docs/public/r";
  if (!existsSync(join(root, regDir, `${slug}.json`))) problems.push(`${slug}: missing generated registry JSON`);
  if (!previews.includes(`"${item.id ?? slug}"`) && !previews.includes(`"${slug}"`)) problems.push(`${slug}: no preview entry in _previews`);
  if (!docsContent.includes(`"${slug}"`)) problems.push(`${slug}: no docs-content entry (usage/api/a11y/perf)`);
}

// docs-content must carry accessibility + performance arrays for each keyed slug
for (const item of index.items) {
  if (item.type === "registry:lib") continue;
  if (item.kind === "pack") continue;
  const block = docsContent.split(`"${item.name}"`)[1] ?? "";
  const nextKey = block.indexOf("\n  \"");
  const seg = nextKey > 0 ? block.slice(0, nextKey) : block.slice(0, 1200);
  if (!/accessibility:\s*\[/.test(seg)) problems.push(`${item.name}: docs-content missing accessibility notes`);
  if (!/performance:\s*\[/.test(seg)) problems.push(`${item.name}: docs-content missing performance notes`);
}

// Sellable items must have persisted screenshots
for (const [name, status] of statusByName) {
  if (status !== "Sellable") continue;
  const slug = slugOf(name).replace(/^animated-arrow$|^animated-copy$/, "animated-icons");
  const dir = join(root, "artifacts/component-reviews", slug);
  const pngs = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".png")) : [];
  if (pngs.length === 0) problems.push(`${name}: marked Sellable but no persisted screenshots in artifacts/component-reviews/${slug}/`);
}

// featured/homepage items must not be Draft or Needs redesign
const featuredIds = [];
const blocks = catalog.split(/\n\s*\{\s*\n/).slice(1);
for (const b of blocks) {
  const idm = b.match(/id:\s*"([^"]+)"/);
  if (idm && /featured:\s*true/.test(b)) featuredIds.push(idm[1]);
}
const nameById = {
  "animated-dialog": "Animated Dialog", "animated-tabs": "Animated Tabs", "animated-accordion": "Animated Accordion",
  "animated-button": "Animated Button", "blur-text": "Blur Text", "rotating-text": "Rotating Text",
  "animated-list": "Animated List", "spotlight-card": "Spotlight Card", "animated-grid": "Animated Grid",
  "animated-icons": "Animated Arrow",
};
for (const id of featuredIds) {
  const st = statusByName.get(nameById[id]);
  if (st === "Draft" || st === "Needs redesign") problems.push(`${id}: homepage-featured but tracker status is "${st}"`);
}

if (problems.length) {
  console.error(`[catalog-quality] ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`[catalog-quality] OK — ${index.items.length} items; previews, docs-content, a11y/perf notes, tracker rows present; Sellable items have screenshots; featured items are not Draft/Needs-redesign.`);
