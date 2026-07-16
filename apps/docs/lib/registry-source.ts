// SERVER-ONLY registry source reader. Imported only by Server Components and
// server routes — never from a "use client" module. Uses node:fs, which is fine
// in the Next docs app (the no-Node-builtins rule applies to shipped core UI
// packages, not this app).
//
// Source-protection contract (docs/42):
//   - FREE items live in apps/docs/public/r/<name>.json and may be read + shown.
//   - PRO/block/pack items live in packages/registry/.protected/r/<name>.json,
//     which is NEVER under a public path. They are readable on the server for
//     local authoring and for the entitlement-aware route, but their full source
//     must NOT be rendered into prerendered HTML in a production build.
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export interface RegistryFile {
  path: string;
  type: string;
  target?: string;
  content: string;
}
export interface RegistryDoc {
  name?: string;
  type?: string;
  files: RegistryFile[];
  dependencies?: string[];
  registryDependencies?: string[];
  meta?: { tier?: string; kind?: string };
}

const publicDir = () => join(process.cwd(), "public", "r");
// apps/docs → repo root → packages/registry/.protected/r
const protectedDir = () => resolve(process.cwd(), "..", "..", "packages", "registry", ".protected", "r");

function readJson(dir: string, name: string): RegistryDoc | null {
  try {
    return JSON.parse(readFileSync(join(dir, `${name}.json`), "utf8"));
  } catch {
    return null;
  }
}

/** Free/public item document (from public/r). Returns null for protected items. */
export function readPublicRegistry(name: string): RegistryDoc | null {
  return readJson(publicDir(), name);
}

/** Protected (Pro/block/pack) item document. Server-only. */
export function readProtectedRegistry(name: string): RegistryDoc | null {
  return readJson(protectedDir(), name);
}

/** Read whichever store holds the item (public first, then protected). Server-only. */
export function readAnyRegistry(name: string): RegistryDoc | null {
  return readPublicRegistry(name) ?? readProtectedRegistry(name);
}

/**
 * Whether the FULL editable source of an item may be rendered into the page.
 * Free → always. Pro/block/pack → only in local development (never in a
 * production build, so paid source is never baked into static output).
 * A dev author can force-lock with MOTIONSTACK_DEV_LOCK=1 to preview the gated UX.
 */
export function canRenderFullSource(access: "free" | "pro"): boolean {
  if (access === "free") return true;
  if (process.env.NODE_ENV === "production") return false;
  return process.env.MOTIONSTACK_DEV_LOCK !== "1";
}

/** The non-source "preview policy" surface for a gated item: paths + deps only. */
export interface SourcePreview {
  files: { path: string; target?: string; type: string }[];
  dependencies: string[];
  registryDependencies: string[];
}
export function sourcePreview(doc: RegistryDoc | null, fallbackDeps: string[], fallbackRegDeps: string[]): SourcePreview {
  return {
    files: (doc?.files ?? []).map((f) => ({ path: f.path, target: f.target, type: f.type })),
    dependencies: doc?.dependencies ?? fallbackDeps,
    registryDependencies: doc?.registryDependencies ?? fallbackRegDeps,
  };
}
