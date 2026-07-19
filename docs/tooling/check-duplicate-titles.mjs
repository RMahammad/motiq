#!/usr/bin/env node
// Flags duplicate top-level (# ) titles across docs/ (excluding archive),
// which usually means two files claim to be canonical for the same subject.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DOCS = join(ROOT, "docs");

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    if (e === "archive") continue; // frozen
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (p.endsWith(".md")) acc.push(p);
  }
  return acc;
}

if (!existsSync(DOCS)) {
  console.error("check-duplicate-titles: docs/ missing");
  process.exit(1);
}

const titles = new Map();
let dups = 0;
for (const f of walk(DOCS)) {
  const first = readFileSync(f, "utf8")
    .split("\n")
    .find((l) => /^#\s+/.test(l));
  if (!first) continue;
  const title = first.replace(/^#\s+/, "").trim().toLowerCase();
  if (titles.has(title)) {
    console.error(`DUPLICATE title "${title}"\n  ${titles.get(title).replace(ROOT + "/", "")}\n  ${f.replace(ROOT + "/", "")}`);
    dups++;
  } else {
    titles.set(title, f);
  }
}
console.log(`check-duplicate-titles: ${titles.size} unique titles, ${dups} duplicates.`);
process.exit(dups ? 1 : 0);
