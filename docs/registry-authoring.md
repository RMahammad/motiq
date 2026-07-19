# Registry authoring standard

> **Type:** Canonical standard · Delivery architecture detail: [`43-private-registry-architecture.md`](43-private-registry-architecture.md).

The registry is the product's delivery mechanism: editable source installed through a shadcn-compatible registry. Generation is `packages/registry/scripts/build-registry.mjs`; it emits Free items to `apps/docs/public/r` and protected (Pro/block/pack) items to `packages/registry/.protected/r`, and asserts no protected source lands under the public dir.

## Every registry item

- **Exact `files`** — only the component's own sources.
- **Exact `dependencies`** — runtime npm deps actually imported.
- **Exact `registryDependencies`** — other registry items it needs. Author them in `registry.json` as namespaced names (`@scope/utils`, `@scope/primitives`); the generator rewrites them to **absolute URLs** (`https://motiq.dev/r/utils.json`) in the emitted payloads so a stranger's `npx shadcn add <url>` resolves every transitive item with zero `components.json` config. The docs UI shows the friendly `@motiq/<name>` form.
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
