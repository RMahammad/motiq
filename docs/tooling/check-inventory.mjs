#!/usr/bin/env node
// Reconciles component source files against docs/21-component-inventory.md.
// Scans component packages (motion/react/sections) for *.tsx component files,
// skipping barrels (index.tsx) and documented non-catalog demos listed in
// inventory-exceptions.txt. Utility files (*.ts) and @scope/tokens are ignored.
// Pre-implementation: if no component .tsx exist yet, reports and exits 0.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const PKGS = join(ROOT, "packages");
const INVENTORY = join(ROOT, "docs/21-component-inventory.md");
const COMPONENT_PACKAGES = ["motion", "react", "sections"];

const exceptionsFile = join(HERE, "inventory-exceptions.txt");
const exceptions = existsSync(exceptionsFile)
  ? new Set(
      readFileSync(exceptionsFile, "utf8")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#")),
    )
  : new Set();

function componentFiles() {
  const out = [];
  if (!existsSync(PKGS)) return out;
  for (const pkg of COMPONENT_PACKAGES) {
    const src = join(PKGS, pkg, "src");
    if (!existsSync(src)) continue;
    for (const f of readdirSync(src)) {
      if (!f.endsWith(".tsx")) continue; // components are .tsx; utilities are .ts
      if (/\.(test|stories)\./.test(f)) continue;
      const base = f.replace(/\.tsx$/, "");
      if (base === "index") continue; // barrel
      if (exceptions.has(base)) continue; // documented non-catalog demo
      out.push({ pkg, base });
    }
  }
  return out;
}

const files = componentFiles();
if (files.length === 0) {
  console.log("check-inventory: no catalog component .tsx files yet — nothing to reconcile.");
  process.exit(0);
}
if (!existsSync(INVENTORY)) {
  console.error("check-inventory: docs/21-component-inventory.md missing");
  process.exit(1);
}
const inv = readFileSync(INVENTORY, "utf8").toLowerCase();
let missing = 0;
for (const { pkg, base } of files) {
  if (!inv.includes(base.toLowerCase())) {
    console.error(`Component source not found in inventory: ${pkg}/src/${base}.tsx`);
    missing++;
  }
}
console.log(`check-inventory: ${files.length} catalog component sources, ${missing} missing from inventory.`);
process.exit(missing ? 1 : 0);
