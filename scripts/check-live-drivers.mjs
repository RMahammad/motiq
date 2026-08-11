#!/usr/bin/env node
/**
 * Guards the gap that made an install look broken when it was working as designed.
 *
 * Most components here are presentation-only: they render the data they are handed and
 * animate each item AS IT ARRIVES. The docs previews feed them over time, so the preview
 * moves; an installed component handed a finished array does not. Nothing on the page
 * said so, which read as "the animations didn't come with the component".
 *
 * Every component whose preview drives it over time must therefore carry a `driving`
 * entry in docs-content.ts. This check fails when a new one appears without it.
 *
 * Timers alone are the wrong signal in both directions: a preview timer is often a
 * user-initiated affordance (a toast dismissing after a click, a stand-in request), and
 * `ai-response-stream` — the component that started this — has timers of its own purely
 * for the copy-reset. So the user-initiated ones are listed explicitly below: a human
 * looked at each and decided. A new component lands in neither list and must be triaged.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PREVIEWS = path.join(root, "apps/docs/app/_previews");
const DOCS = path.join(root, "apps/docs/lib/docs-content.ts");
const MANIFEST = path.join(root, "packages/registry/registry.json");

/** Anything that can make a preview move on its own over time. */
const MECHANISMS = [
  "setInterval(", "setTimeout(", "requestAnimationFrame(",
  "useAnimationFrame", "useTime(", "repeat: Infinity", "repeat:Infinity", "useSequence(",
];

/**
 * Previews whose time mechanism is USER-INITIATED — inside an onClick, a debounce, or a
 * stand-in request. An installed component reproduces these the moment someone interacts,
 * so there is nothing to document. Reviewed 2026-08-11.
 */
const USER_INITIATED = new Set([
  "source-citation-rail",  // a toast auto-dismissing after a citation click
  "keyboard-safe-form",    // a timer standing in for a submit request
  "swipe-action-row",      // focus restoration after a swipe
  "kinetic-emphasis",      // debounce on the demo's own controls
  "animated-button",       // onClick -> loading, reset after 1.6s
  "animated-icons",        // onClick -> copied, reset after 1.4s
]);

const indexSrc = readFileSync(path.join(PREVIEWS, "index.tsx"), "utf8");
const docsSrc = readFileSync(DOCS, "utf8");
const items = JSON.parse(readFileSync(MANIFEST, "utf8")).items;

const entries = [...docsSrc.matchAll(/\n {2}"([a-z0-9-]+)": \{/g)].map((m) => m[1]);
function hasDrivingDoc(name) {
  const i = entries.indexOf(name);
  if (i < 0) return false;
  const start = docsSrc.indexOf(`\n  "${name}": {`);
  const end = i + 1 < entries.length ? docsSrc.indexOf(`\n  "${entries[i + 1]}": {`) : docsSrc.length;
  return docsSrc.slice(start, end).includes("driving: `");
}

// Previews live either in their own file or inline in index.tsx — check both, or the
// inline ones stay invisible and the census silently under-reports.
const previewMap = Object.fromEntries([...indexSrc.matchAll(/"([a-z0-9-]+)":\s*(\w+)/g)].map((m) => [m[1], m[2]]));
function previewSource(name) {
  const own = path.join(PREVIEWS, `${name}.tsx`);
  if (existsSync(own)) return readFileSync(own, "utf8");
  const fn = previewMap[name];
  if (!fn) return null;
  const open = new RegExp(`function ${fn}\\s*\\([^)]*\\)\\s*\\{`).exec(indexSrc);
  if (!open) return null;
  let depth = 0;
  for (let j = open.index + open[0].length - 1; j < indexSrc.length; j++) {
    if (indexSrc[j] === "{") depth++;
    else if (indexSrc[j] === "}" && --depth === 0) return indexSrc.slice(open.index, j + 1);
  }
  return null;
}

const missing = [];
let documented = 0;
let userInitiated = 0;
let selfContained = 0;

for (const item of items) {
  if (item.type === "registry:lib") continue;
  const src = previewSource(item.name);
  if (!src) continue; // packs have no preview of their own
  const driven = MECHANISMS.some((m) => src.includes(m));
  if (hasDrivingDoc(item.name)) documented++;
  else if (!driven) selfContained++;
  else if (USER_INITIATED.has(item.name)) userInitiated++;
  else missing.push(item.name);
}

if (missing.length) {
  console.error(
    `❌ check-live-drivers: ${missing.length} component(s) have a preview that moves over time but no "driving" documentation:\n` +
      missing.map((n) => `   - ${n}`).join("\n") +
      `\n\nAdd a \`driving\` snippet in apps/docs/lib/docs-content.ts showing how the app feeds it` +
      `\n(see any of the ${documented} existing ones), or — if the motion is user-initiated —` +
      `\nadd it to USER_INITIATED in scripts/check-live-drivers.mjs with a one-line reason.\n`,
  );
  process.exit(1);
}

console.log(
  `check-live-drivers: OK — ${documented} components document their driver, ` +
    `${userInitiated} are user-initiated, ${selfContained} own their motion.`,
);
