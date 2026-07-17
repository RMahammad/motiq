#!/usr/bin/env node
// Verifies every ADR file has a unique number and appears in docs/adrs/README.md.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ADR_DIR = join(ROOT, "docs/adrs");

// Commercial ADRs are intentionally local-only (git-ignored) and absent in a
// clean/public checkout, though the index still lists them for maintainers.
function isLocalOnly(relFromAdrDir) {
  const rel = `docs/adrs/${relFromAdrDir}`;
  return spawnSync("git", ["-C", ROOT, "check-ignore", "-q", rel]).status === 0;
}
const INDEX = join(ADR_DIR, "README.md");

if (!existsSync(INDEX)) {
  console.error("check-adr-index: docs/adrs/README.md missing");
  process.exit(1);
}
const index = readFileSync(INDEX, "utf8");
const adrFiles = readdirSync(ADR_DIR)
  .filter((f) => /^\d{4}-.*\.md$/.test(f))
  .sort();

let problems = 0;
const seen = new Map();
for (const f of adrFiles) {
  const num = f.slice(0, 4);
  if (seen.has(num)) {
    console.error(`DUPLICATE ADR number ${num}: ${f} and ${seen.get(num)}`);
    problems++;
  }
  seen.set(num, f);
  if (!index.includes(f)) {
    console.error(`MISSING from ADR index: ${f}`);
    problems++;
  }
}
// Reverse: index links that have no file
const linkedRe = /\(([0-9]{4}-[a-z0-9-]+\.md)\)/g;
let lm;
const present = new Set(adrFiles);
while ((lm = linkedRe.exec(index)) !== null) {
  if (!present.has(lm[1]) && !isLocalOnly(lm[1])) {
    console.error(`ADR index links a missing file: ${lm[1]}`);
    problems++;
  }
}

console.log(`check-adr-index: ${adrFiles.length} ADRs, ${problems} problems.`);
process.exit(problems ? 1 : 0);
