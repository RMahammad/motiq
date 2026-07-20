#!/usr/bin/env node
/** Validate the registry manifest + generated output. Exit non-zero on any problem. */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(pkgRoot, "..", "..");
const OUT = join(repoRoot, "apps", "docs", "public", "r");
const PROTECTED_OUT = join(pkgRoot, ".protected", "r");

// Protected = anything not Free. The catalog is fully free/open, so blocks and
// packs are public too; only a non-free tier routes an item to the protected
// store. This MUST match build-registry.mjs's isProtectedItem (docs/42).
const isProtectedItem = (item) => (item.meta?.tier ?? "free") !== "free";

const VALID_TYPES = new Set([
  "registry:block", "registry:component", "registry:ui", "registry:hook",
  "registry:lib", "registry:page", "registry:file", "registry:style",
  "registry:theme", "registry:base", "registry:font", "registry:item",
]);

const manifest = JSON.parse(readFileSync(join(pkgRoot, "registry.json"), "utf8"));
const problems = [];
const names = new Set();

for (const item of manifest.items) {
  if (!item.name) problems.push(`item without name`);
  if (names.has(item.name)) problems.push(`duplicate name: ${item.name}`);
  names.add(item.name);
  if (!VALID_TYPES.has(item.type)) problems.push(`${item.name}: invalid type ${item.type}`);
  for (const f of item.files || []) {
    if (!VALID_TYPES.has(f.type)) problems.push(`${item.name}: invalid file type ${f.type}`);
    if ((f.type === "registry:page" || f.type === "registry:file") && !f.target)
      problems.push(`${item.name}: ${f.type} requires a target`);
    if (!existsSync(join(pkgRoot, f.path))) problems.push(`${item.name}: missing source file ${f.path}`);
  }
  for (const rd of item.registryDependencies || []) {
    if (typeof rd !== "string" || !rd.length) problems.push(`${item.name}: bad registryDependency`);
  }
  // generated output present + non-empty content, in the correct (public vs protected) store
  const protectedItem = isProtectedItem(item);
  const outFile = join(protectedItem ? PROTECTED_OUT : OUT, `${item.name}.json`);
  if (protectedItem && existsSync(join(OUT, `${item.name}.json`))) {
    problems.push(`${item.name}: protected item leaked into public dir (docs/42)`);
  }
  if (!existsSync(outFile)) {
    problems.push(`${item.name}: generated ${item.name}.json missing from ${protectedItem ? ".protected/r" : "public/r"} (run the generator)`);
  } else {
    const doc = JSON.parse(readFileSync(outFile, "utf8"));
    if (!doc.files?.[0]?.content) problems.push(`${item.name}: generated file has empty content`);
    if (doc.$schema !== "https://ui.shadcn.com/schema/registry-item.json")
      problems.push(`${item.name}: wrong $schema`);
  }
}

if (problems.length) {
  console.error(`[validate] ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`[validate] OK — ${manifest.items.length} items, unique names, valid types, all files present, output generated.`);
