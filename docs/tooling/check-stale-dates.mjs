#!/usr/bin/env node
// Flags verification/review dates older than a threshold so version/license
// claims get re-checked. Default threshold: 180 days. Excludes the archive.
// Usage: node docs/tooling/check-stale-dates.mjs [--days N] [--reference YYYY-MM-DD]
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DOCS = join(ROOT, "docs");

const args = process.argv.slice(2);
const days = Number(args[args.indexOf("--days") + 1]) || 180;
const refArg = args.includes("--reference") ? args[args.indexOf("--reference") + 1] : null;
const reference = refArg ? new Date(refArg) : new Date();

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    if (e === "archive") continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (p.endsWith(".md")) acc.push(p);
  }
  return acc;
}

if (!existsSync(DOCS)) {
  console.error("check-stale-dates: docs/ missing");
  process.exit(1);
}

// Only inspect lines that assert a verification/review/date claim.
const dateRe = /(\d{4}-\d{2}-\d{2})/;
const claimRe = /(verified|verification|last reviewed|date verified|as of)/i;
let stale = 0;
let claims = 0;
for (const f of walk(DOCS)) {
  const lines = readFileSync(f, "utf8").split("\n");
  for (const line of lines) {
    if (!claimRe.test(line)) continue;
    const m = line.match(dateRe);
    if (!m) continue;
    claims++;
    const d = new Date(m[1]);
    const ageDays = (reference - d) / 86400000;
    if (ageDays > days) {
      stale++;
      console.error(`STALE (${Math.round(ageDays)}d) ${f.replace(ROOT + "/", "")}: ${line.trim().slice(0, 90)}`);
    }
  }
}
console.log(`check-stale-dates: ${claims} dated claims, ${stale} older than ${days}d (reference ${reference.toISOString().slice(0, 10)}).`);
process.exit(stale ? 1 : 0);
