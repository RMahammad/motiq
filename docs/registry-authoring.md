# Registry authoring standard

> **Type:** Canonical standard · Delivery architecture detail: [`43-private-registry-architecture.md`](43-private-registry-architecture.md).

The registry is the product's delivery mechanism: editable source installed through a shadcn-compatible registry. Generation is `packages/registry/scripts/build-registry.mjs`; it emits Free items to `apps/docs/public/r` and protected (Pro/block/pack) items to `packages/registry/.protected/r`, and asserts no protected source lands under the public dir.

## Every registry item

- **Exact `files`** — only the component's own sources.
- **Exact `dependencies`** — runtime npm deps actually imported.
- **Exact `registryDependencies`** — other registry items it needs. Author them in `registry.json` as namespaced names (`@scope/utils`, `@scope/primitives`); the generator rewrites them to **absolute URLs** (`https://motiq.dev/r/utils.json`) in the emitted payloads so a stranger's `npx shadcn add <url>` resolves every transitive item with zero `components.json` config. The docs UI shows the friendly `@motiq/<name>` form.
- **Install commands** — `@motiq` is listed in the shadcn CLI's own registry directory ([shadcn-ui/ui#11220](https://github.com/shadcn-ui/ui/pull/11220), merged 2026-08-11), so `npx shadcn@latest add @motiq/<name>` resolves with **no `components.json` entry**. That is the canonical form the docs and `index.json` `install` fields emit; the extensionless URL form stays available (`installUrl`, `registryUrlInstall()`) for CLI versions predating the directory. The directory hardcodes `https://motiq.dev/r/{name}.json`, so **that path and every item name are now a public contract** — renaming an item breaks strangers' installs.
- **Design tokens travel with the item.** Component sources style themselves with `var(--color-surface)`, `var(--color-fg)`, … . Those live in `packages/tokens/styles.css`, which only the docs app imports — so before 2026-08-11 a stranger's install produced transparent surfaces and ~1.09:1 contrast text. `build-registry.mjs` now emits them as a shadcn `cssVars` block (light + dark) on **every** item. Two rules it enforces, both load-bearing:
  1. **Only tokens the shipped sources actually reference** — computed from the sources at build time, so the set cannot drift.
  2. **Never a name shadcn/Tailwind owns.** `--background`, `--foreground`, `--border`, `--accent`, `--ring`, `--font-sans`, `--font-mono` and `--shadow-sm/md/lg` are *their* scale; writing ours into `:root` silently restyles the consumer's own components (measured: shipping `--shadow-*` changed their `shadow-sm` utility). Left out, `var(--shadow-md)` falls through to Tailwind's default and still renders. Our `--color-*` names are safe: shadcn reaches its own colours through `@theme inline`, which compiles utilities to `var(--muted)`, not `var(--color-muted)`.
  Every item carries the block because the CLI applies `cssVars` **only for the item named on the command line** — it installs a registryDependency's files but ignores its `cssVars` (verified against shadcn 4.16).
- **`tier`** (free/pro) and **release status**.
- No docs imports, no preview data, no `@scope/*` internal imports, no `next/*` (unless the item is explicitly framework-specific), no `node:*`, no test helpers, no development adapters, no commercial secrets.
- Installed source is self-contained and readable — a customer can edit it without the monorepo.

## Blocks and packs

- A **block** composes released components. Its source imports them via the consumer convention `@/components/motiq/<name>`; those specifiers are aliased to registry sources in the two tsconfig `paths` maps so the same source renders in docs and typechecks. A block lists every composed component + `@motiq/utils` + `@motiq/primitives` as `registryDependencies`.
- A **pack** installs its block (which pulls the components). Do not duplicate shared utility files.

## Free vs Pro routing

- Free source stays public and buildable by anyone.
- Pro source stays protected; it must never appear in public build output. `pnpm check:exposure` and the build-time source-protection assertion enforce this. See [`security-model.md`](security-model.md).

## Shared-file rule

Only the orchestrating context edits shared indexes: `registry.json`, `apps/docs/lib/catalog.ts`, `docs-content.ts`, `_previews/index.tsx`, the tsconfig `paths` maps, and pack/block definitions. Parallel work creates only its own isolated files. After changes: regenerate the registry and run catalog + exposure validation.
