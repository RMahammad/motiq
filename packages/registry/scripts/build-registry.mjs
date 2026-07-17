#!/usr/bin/env node
/**
 * Registry generator. Reads registry.json (the authoring manifest, shadcn
 * catalog shape), inlines each item's file contents, and emits per-item JSON.
 *
 * SOURCE-PROTECTION SPLIT (see docs/42):
 *   - FREE items  → apps/docs/public/r/<name>.json   (served publicly; `npx shadcn add <url>` works)
 *   - PRO / block / pack items → packages/registry/.protected/r/<name>.json
 *     (git-ignored, NEVER under any public/ path; delivered only through the
 *      entitlement-aware registry route, docs/43)
 *   - index.json (public) → metadata ONLY for every item (no `content`), so the
 *     catalog UI can list Pro items without leaking their source.
 *   - registry.json (public) → shadcn catalog manifest: file PATHS only, no content.
 *
 * A build-time assertion fails the build if any protected item's source lands
 * under the public directory.
 *
 * Env overrides: REGISTRY_OUT (public dir), REGISTRY_PROTECTED_OUT (private dir),
 * REGISTRY_BASE_URL (served base URL), REGISTRY_PROTECTED_BASE_URL (protected route base).
 *
 * This is a build-time Node tool — the boundary rule that forbids Node built-ins
 * applies to the shipped core UI packages, not to tooling scripts.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const repoRoot = resolve(pkgRoot, "..", "..");

// Single source of truth for brand/namespace/URL — nothing hardcoded.
const config = JSON.parse(readFileSync(join(repoRoot, "product.config.json"), "utf8"));
const OUT = process.env.REGISTRY_OUT
  ? resolve(process.env.REGISTRY_OUT)
  : join(repoRoot, "apps", "docs", "public", "r");
const PROTECTED_OUT = process.env.REGISTRY_PROTECTED_OUT
  ? resolve(process.env.REGISTRY_PROTECTED_OUT)
  : join(pkgRoot, ".protected", "r");
const BASE_URL = process.env.REGISTRY_BASE_URL || config.registryBaseUrl;
const PROTECTED_BASE_URL = process.env.REGISTRY_PROTECTED_BASE_URL || `${config.documentationUrl.replace(/\/docs$/, "")}/api/registry`;
const NAMESPACE = config.registryNamespace; // e.g. "@motiq"
const ITEM_SCHEMA = "https://ui.shadcn.com/schema/registry-item.json";

const manifest = JSON.parse(readFileSync(join(pkgRoot, "registry.json"), "utf8"));

// Start each build from a clean protected dir so removed Pro items don't linger.
if (existsSync(PROTECTED_OUT)) rmSync(PROTECTED_OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
mkdirSync(PROTECTED_OUT, { recursive: true });

/** Protected = anything not Free. The catalog is fully free/open, so blocks and
 *  packs are public too; only a non-free tier would route an item to the
 *  protected store. */
function isProtectedItem(item) {
  const tier = item.meta?.tier ?? "free";
  return tier !== "free";
}

/** Bare item name from an authoring dep like "@scope/utils" → "utils". */
function bareName(dep) {
  return dep.startsWith("@") && dep.includes("/") ? dep.split("/").slice(1).join("/") : dep;
}

/** Rewrite any namespaced registry dep to the configured namespace (display form). */
function normalizeDeps(deps) {
  return (deps || []).map((d) => (d.startsWith("@") && d.includes("/") ? `${NAMESPACE}/${bareName(d)}` : d));
}

/**
 * Machine-consumed registryDependencies as absolute URLs. This lets a stranger run
 * `npx shadcn add <item-url>` and have every transitive item resolve with ZERO
 * consumer config — no `registries` entry in their components.json. (A bare
 * `@motiq/utils` would only resolve if they first registered the namespace.)
 * The whole catalog is free, so every dep points at the public base URL.
 * Non-namespaced deps (shadcn built-ins like "button") pass through untouched.
 */
function depsToUrls(deps) {
  return (deps || []).map((d) => (d.startsWith("@") && d.includes("/") ? `${BASE_URL}/${bareName(d)}.json` : d));
}

/** Build one installable registry-item document with file contents inlined. */
function buildItem(item) {
  const files = (item.files || []).map((f) => {
    const content = readFileSync(join(pkgRoot, f.path), "utf8");
    return { path: f.path, type: f.type, target: f.target, content };
  });
  return {
    $schema: ITEM_SCHEMA,
    ...item,
    // URLs so `npx shadcn add <this item's url>` resolves every dep zero-config.
    registryDependencies: depsToUrls(item.registryDependencies),
    files,
  };
}

const catalogItems = [];
let freeCount = 0;
let protectedCount = 0;

for (const item of manifest.items) {
  if (!item.name || !item.type) {
    throw new Error(`registry.json: item missing name/type: ${JSON.stringify(item)}`);
  }
  const doc = buildItem(item);
  const protectedItem = isProtectedItem(item);
  const targetDir = protectedItem ? PROTECTED_OUT : OUT;
  writeFileSync(join(targetDir, `${item.name}.json`), JSON.stringify(doc, null, 2) + "\n");
  protectedItem ? protectedCount++ : freeCount++;

  const tier = item.meta?.tier ?? "free";
  catalogItems.push({
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    category: item.meta?.category ?? "misc",
    tier,
    kind: item.meta?.kind ?? "component",
    // Whether the source is delivered publicly (free) or via the protected route.
    protected: protectedItem,
    keywords: item.meta?.keywords ?? [],
    dependencies: item.dependencies ?? [],
    registryDependencies: normalizeDeps(item.registryDependencies),
    // Public install URL for free items; protected route reference for Pro.
    url: protectedItem ? `${PROTECTED_BASE_URL}/${item.name}` : `${BASE_URL}/${item.name}.json`,
    install: protectedItem
      ? `npx shadcn@latest add ${PROTECTED_BASE_URL}/${item.name}` // requires auth header (see docs/43)
      : `npx shadcn@latest add ${BASE_URL}/${item.name}.json`,
  });
}

// shadcn-shaped catalog manifest (file PATHS only, no inlined content — safe public)
writeFileSync(
  join(OUT, "registry.json"),
  JSON.stringify(
    {
      $schema: manifest.$schema,
      name: config.shortName.toLowerCase(),
      homepage: config.documentationUrl,
      items: manifest.items.map((it) => ({ ...it, registryDependencies: depsToUrls(it.registryDependencies) })),
    },
    null,
    2,
  ) + "\n",
);

// docs-facing index the catalog UI reads (metadata + install command, NO source)
writeFileSync(
  join(OUT, "index.json"),
  JSON.stringify({ name: manifest.name, count: catalogItems.length, items: catalogItems }, null, 2) + "\n",
);

// --- Build-time source-protection assertion (docs/42 standing rule) ----------
// Every JSON physically in the public dir must NOT belong to a protected item.
const protectedNames = new Set(manifest.items.filter(isProtectedItem).map((i) => i.name));

// Remove stale protected-item JSON left in the public dir by earlier builds.
for (const f of readdirSync(OUT).filter((f) => f.endsWith(".json"))) {
  const base = f.replace(/\.json$/, "");
  if (protectedNames.has(base)) {
    rmSync(join(OUT, f));
    console.log(`[registry] removed stale public Pro artifact: r/${f}`);
  }
}

const leaked = [];
for (const f of readdirSync(OUT).filter((f) => f.endsWith(".json"))) {
  const base = f.replace(/\.json$/, "");
  if (protectedNames.has(base)) leaked.push(f);
  if (base === "index.json" || base === "registry.json") continue;
}
// Also assert index.json carries no source content.
const indexRaw = readFileSync(join(OUT, "index.json"), "utf8");
if (indexRaw.includes('"content"')) leaked.push("index.json (contains content field)");
if (leaked.length > 0) {
  throw new Error(
    `[registry] SOURCE-PROTECTION FAILURE: protected source found under public dir: ${leaked.join(", ")}. ` +
      `Pro/block/pack items must be written to ${PROTECTED_OUT}, never ${OUT}.`,
  );
}

const publicWritten = readdirSync(OUT).filter((f) => f.endsWith(".json"));
const protWritten = readdirSync(PROTECTED_OUT).filter((f) => f.endsWith(".json"));
console.log(`[registry] PUBLIC  ${publicWritten.length} files → ${OUT} (${freeCount} free items + index + manifest)`);
console.log(`[registry] PROTECTED ${protWritten.length} files → ${PROTECTED_OUT} (${protectedCount} pro/block/pack items)`);
console.log(`[registry] ${catalogItems.length} catalog items · public base ${BASE_URL} · protected base ${PROTECTED_BASE_URL}`);
console.log(`[registry] source-protection assertion: OK (no protected source under public dir)`);
