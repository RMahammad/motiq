#!/usr/bin/env node
// Reconciles every hand-written catalog count in the repo against the two files
// that actually define the catalog.
//
// Why this exists: the counts in README/LAUNCH/docs were each hand-authored and
// froze at an old snapshot (56/8/4/17, and a loose "60+"), while batches of new
// components kept landing. Nothing failed, because nothing checked. This makes
// a stale count a red CI run instead of a launch-day embarrassment.
//
// Truth sources:
//   apps/docs/lib/catalog.ts        -> components, workflow blocks, categories
//   packages/registry/registry.json -> total registry items, packs
//
// The site itself never needs this check: every user-facing surface derives its
// numbers from catalog.ts at build time. This guards the *prose* — Markdown and
// metadata strings, where a number can only ever be typed by hand.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");

/* ---------------------------------------------------------------- truth ---- */

const catalogSrc = readFileSync(join(ROOT, "apps/docs/lib/catalog.ts"), "utf8");

// catalog.ts is TypeScript, so it cannot be imported from a plain .mjs script
// without a build step. Slicing the literal and counting its entries keeps this
// check dependency-free and fast; the shapes below are asserted, not assumed.
const catalogLiteral = catalogSrc.slice(
  catalogSrc.indexOf("export const catalog"),
  catalogSrc.indexOf("export const bySlug"),
);
const categoriesLiteral = catalogSrc.slice(
  catalogSrc.indexOf("export const categories"),
  catalogSrc.indexOf("export const catalog"),
);

const slugs = [...catalogLiteral.matchAll(/^ {4}slug: "([a-z0-9-]+)",$/gm)].map((m) => m[1]);
const blocks = [...catalogLiteral.matchAll(/^ {4}kind: "block",$/gm)].length;
const catalogPacks = [...catalogLiteral.matchAll(/^ {4}kind: "pack",$/gm)].length;
const categories = [...categoriesLiteral.matchAll(/^ {2}\{ id:/gm)].length;

const registry = JSON.parse(readFileSync(join(ROOT, "packages/registry/registry.json"), "utf8"));
// Packs are registry-level bundles (`*-pack`), not catalog rows — they are the
// one figure that cannot be derived from catalog.ts.
const packs = registry.items.filter((i) => /-pack$/.test(i.name)).length;

const COUNTS = {
  components: slugs.length - blocks - catalogPacks,
  blocks,
  packs,
  categories,
  catalogItems: slugs.length,
  registryItems: registry.items.length,
};

/* ------------------------------------------------------- sanity of truth ---- */

const problems = [];
const fail = (msg) => problems.push(msg);

if (slugs.length === 0) fail("parsed 0 catalog entries — catalog.ts shape changed; fix this script");
if (new Set(slugs).size !== slugs.length) fail("duplicate slugs in catalog.ts");
if (COUNTS.components <= 0) fail("parsed a non-positive component count");
if (COUNTS.packs === 0) fail("parsed 0 packs from registry.json — naming convention changed");

/* ------------------------------------------------------------- the prose ---- */

// Any number immediately followed by a catalog noun is a claim we can check.
// `60+`/`90+` style rounding is rejected outright: an approximate count is what
// let the real figure drift unnoticed in the first place.
const CLAIM = /(\b\d{2,3})(\+?)\s+(?:free\s+|animated\s+|composed\s+|released\s+|one-command\s+|shadcn\s+|React\s+|#React\s+|and\s+shadcn\s+|MIT-licensed\s+)*(components?|workflow blocks?|blocks?|packs?|categories|catalog items?|registry items?)\b/gi;

const EXPECTED = {
  component: COUNTS.components,
  components: COUNTS.components,
  block: COUNTS.blocks,
  blocks: COUNTS.blocks,
  "workflow block": COUNTS.blocks,
  "workflow blocks": COUNTS.blocks,
  pack: COUNTS.packs,
  packs: COUNTS.packs,
  categories: COUNTS.categories,
  "catalog item": COUNTS.catalogItems,
  "catalog items": COUNTS.catalogItems,
  "registry item": COUNTS.registryItems,
  "registry items": COUNTS.registryItems,
};

// Deliberately an allow-list, not a repo-wide sweep. Only these files make live
// first-person claims about how big Motiq is; `docs/**` is planning material full
// of historical targets ("ship 24 components") and competitor figures ("135+
// components"), which are not claims about today's catalog and must not be
// rewritten to match it.
const CLAIM_FILES = [
  "README.md",
  "CONTRIBUTING.md",
  "AGENTS.md",
  "CLAUDE.md", // gitignored twin of AGENTS.md; checked when present
  "LAUNCH.md",
  "RELEASE_NOTES.md",
  "assets/README.md",
  "docs/README.md",
  "apps/promo/README.md",
];

// A line may opt out with an inline `not-a-catalog-count` marker (an HTML comment
// in Markdown) when its number is real but scoped differently — the registry-type
// breakdown, one pack's contents, or a post format like "10 components, 10 slides".
const OPT_OUT = /not-a-catalog-count/;

let claimsChecked = 0;
for (const rel of CLAIM_FILES) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;

  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (OPT_OUT.test(line)) return;
      for (const m of line.matchAll(CLAIM)) {
        const [, num, plus, rawNoun] = m;
        const noun = rawNoun.toLowerCase();
        const expected = EXPECTED[noun];
        if (expected === undefined) continue;
        claimsChecked++;
        if (plus === "+") {
          fail(
            `${rel}:${i + 1} — rounded claim "${m[0].trim()}"; state the exact figure (${expected} ${noun})`,
          );
        } else if (Number(num) !== expected) {
          fail(`${rel}:${i + 1} — "${m[0].trim()}" but the catalog has ${expected} ${noun}`);
        }
      }
    });
}

/* ----------------------------------------------------------------- report ---- */

const summary =
  `${COUNTS.components} components + ${COUNTS.blocks} workflow blocks + ${COUNTS.packs} packs ` +
  `across ${COUNTS.categories} categories ` +
  `(${COUNTS.catalogItems} catalog items, ${COUNTS.registryItems} registry items)`;

if (problems.length) {
  console.error(`check-catalog-counts: canonical figures are ${summary}\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error(`\n${problems.length} stale or rounded count claim(s).`);
  process.exit(1);
}

console.log(`check-catalog-counts: ${summary} — ${claimsChecked} prose claim(s) agree.`);
