#!/usr/bin/env node
// Deterministic internal-link checker (zero dependencies).
// Scans Markdown files and verifies that relative links resolve on disk.
// Skips http(s)/mailto/pure-anchor links and fenced code blocks.
// Excludes the frozen archived plan (docs/archive/original-architecture-plan.md).
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
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
      broken++;
      console.error(`BROKEN  ${file.replace(ROOT + "/", "")}  ->  ${m[1]}`);
    }
  }
}

console.log(`check-links: ${files.length} files, ${checked} relative links, ${broken} broken.`);
process.exit(broken ? 1 : 0);
