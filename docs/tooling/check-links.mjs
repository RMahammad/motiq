#!/usr/bin/env node
// Deterministic internal-link checker (zero dependencies).
// Scans Markdown files and verifies that relative links resolve on disk.
// Skips http(s)/mailto/pure-anchor links and fenced code blocks.
// Excludes the frozen archived plan (docs/archive/original-architecture-plan.md).
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

// A link may point at a file that is intentionally local-only (git-ignored):
// e.g. CLAUDE.md, .claude/skills/, and the business/strategy docs that never
// ship to the public repo. Those resolve on a maintainer's disk but are absent
// in a clean/CI checkout. Treat a missing-but-ignored target as intentional,
// not broken — genuine typos (missing AND tracked) are still reported.
const ignoreCache = new Map();
function isLocalOnly(abs) {
  const rel = abs.replace(ROOT + "/", "");
  if (ignoreCache.has(rel)) return ignoreCache.get(rel);
  const r = spawnSync("git", ["-C", ROOT, "check-ignore", "-q", rel]);
  const ignored = r.status === 0;
  ignoreCache.set(rel, ignored);
  return ignored;
}
const EXCLUDE = new Set([join(ROOT, "docs/archive/original-architecture-plan.md")]);
const SCAN_DIRS = ["docs", ".claude", "packages"];
const ROOT_FILES = ["CLAUDE.md"];

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e === ".git") continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, acc);
    else if (p.endsWith(".md")) acc.push(p);
  }
  return acc;
}

const files = [
  ...SCAN_DIRS.flatMap((d) => walk(join(ROOT, d))),
  ...ROOT_FILES.map((f) => join(ROOT, f)).filter(existsSync),
].filter((f) => !EXCLUDE.has(f));

const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
let broken = 0;
let checked = 0;
let localOnly = 0;

for (const file of files) {
  let text = readFileSync(file, "utf8");
  // strip fenced code blocks to avoid false positives from code samples
  text = text.replace(/```[\s\S]*?```/g, "");
  let m;
  while ((m = linkRe.exec(text)) !== null) {
    let target = m[1].trim().split(/\s+/)[0]; // drop optional "title"
    if (!target) continue;
    if (/^(https?:|mailto:|#)/.test(target)) continue; // external or pure-anchor
    target = target.replace(/#.*$/, ""); // strip anchor
    if (!target) continue;
    checked++;
    const abs = resolve(dirname(file), target);
    if (!existsSync(abs)) {
      if (isLocalOnly(abs)) {
        localOnly++;
        continue; // intentional local-only reference, absent in a clean checkout
      }
      broken++;
      console.error(`BROKEN  ${file.replace(ROOT + "/", "")}  ->  ${m[1]}`);
    }
  }
}

console.log(`check-links: ${files.length} files, ${checked} relative links, ${broken} broken, ${localOnly} local-only (skipped).`);
process.exit(broken ? 1 : 0);
