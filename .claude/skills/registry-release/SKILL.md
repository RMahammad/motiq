---
name: registry-release
description: Take a built component, block, or pack through registry wiring, the lightweight release gate, and (when publishing packages) the changeset/tarball/provenance publish pipeline. Also authors migration notes for breaking changes.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, browser and screenshot tools available in the environment
---

# Registry release

The single path from a built artifact to Released. The **default track** wires a catalog component/block/pack into the registry + docs and runs the 12-point gate. The **package-publish track** (changesets, tarball fixture, provenance) runs only when cutting an npm release. Breaking changes also get a migration note.

## When to use

- A component/block/pack is built and needs registry + preview + docs wiring and the release gate (default track).
- One or more `@scope/*` packages are being published to npm (publish track).
- A change breaks a public API/prop/token and needs a migration note.
- **Not** for building the component itself (use the authoring skills) or homepage-centerpiece / complex Pro creative approval (use the signature pipeline).

## Inputs

- The built component/block/pack: source slug, category, preview, brief, Free/Pro.
- For publishing: the packages + version bump(s).
- For a breaking change: the change + the ADR that motivated it.

## Steps

1. **Fast brief** (≤1 page, if not already written): Name · Problem · Use case · States · Animation · A11y requirement · Mobile · API sketch · Dependencies · Similarity concern · Free/Pro. No three-concepts for ordinary items.
2. **Wire registry + docs.** Add registry metadata to `packages/registry/registry.json`, catalog entry to `apps/docs/lib/catalog.ts`, concise docs (`usage`, `api`, `accessibility`, `performance`) to `apps/docs/lib/docs-content.ts`, preview to `apps/docs/app/_previews/<slug>.tsx` + `_previews/index.tsx`. Blocks/packs list every composed component + `@motionstack/utils` + `@motionstack/primitives` as `registryDependencies`; regenerate the tsconfig `paths` aliases (`apps/docs/tsconfig.json` + `packages/registry/tsconfig.json`) so `@/components/motionstack/*` resolves.
3. **Regenerate the registry:** `node packages/registry/scripts/build-registry.mjs`.
4. **Run the 12-point release gate** (below).
5. **Mark status** in [`docs/39`](../../../docs/39-catalog-production-board.md): **Released** (passes gate) or **Experimental** (shipped but rough). No subjective/"Sellable/Category-leading" labels — those are retired.
6. **Publish track (only when cutting a package release):** consume changesets + changelog → build (verify `"use client"` preserved) → `pnpm lint && pnpm typecheck && pnpm test` → a11y (axe) + SSR/hydration → `pnpm pack` and install the tarball into `playground-next` + `playground-vite` → `publint` + `@arethetypeswrong/cli` clean → tree-shaking + `size-limit` budgets → docs deploy → `npm publish --provenance` with 2FA + least-privilege token. Follow the canonical [`docs/18-release-process.md`](../../../docs/18-release-process.md) and run the full [`docs/release-checklist.md`](../../../docs/release-checklist.md) — every ⛔ item must pass.
7. **Breaking change → migration note.** Describe the break + link the ADR; list affected packages; real before/after examples; codemod command or "manual migration required" + why; deprecation timeline (deprecated vX.N dev-warning → removed vY.0, compatibility window ≥ one major); major-version changeset; changelog + affected doc links; rollback (how to pin the prior version). Use `docs/templates/migration-guide-template.md`.

## The 12-point release gate

1. Renders correctly in the real docs app. 2. Main interactions work. 3. Desktop **and** mobile layouts. 4. Light **and** dark where applicable. 5. Reasonable reduced-motion fallback. 6. Correct semantics + keyboard where interactive. 7. `pnpm typecheck`. 8. Docs app builds (`next build`). 9. Registry validates (`node packages/registry/scripts/build-registry.mjs`). 10. Installs into a clean fixture with **no** `next/*`, Node built-ins, or `remotion`. 11. No console/hydration errors. 12. Original + commercially safe (clean-room; record any similarity concern).

Verify 1–6 and 11 by rendered interaction (Playwright/`scripts/shoot.mjs` is enough). Canonical gate: [`docs/release-checklist.md`](../../../docs/release-checklist.md); registry authoring: [`docs/registry-authoring.md`](../../../docs/registry-authoring.md).

## Completion criteria

- All 12 gate points pass; status set to Released or Experimental in [`docs/39`](../../../docs/39-catalog-production-board.md).
- Publish track (if run): every ⛔ checklist item passed; tarball fixtures install and run; go/no-go decision recorded.
- Breaking change (if any): migration note published, major changeset present, deprecation window honored.

## Required validation

- `node packages/registry/scripts/build-registry.mjs` · `node scripts/check-catalog-quality.mjs` · `pnpm check:exposure` · `pnpm docs:check`.
- `pnpm lint && pnpm typecheck && pnpm test`.
- Publish track: the full [`docs/release-checklist.md`](../../../docs/release-checklist.md) + tarball install in both fixtures. **Actually run** every command — never assume results.

## Output format

- Default track: a short line-item pass/fail for the 12-point gate + the assigned status.
- Publish track: a go/no-go report with each gate's status, the packed file-list inspection, fixture results, and any blockers.
- Breaking change: the migration guide + changelog entry + updated doc links.

## Non-goals

- Not for building/redesigning the component (authoring skills) or homepage/Pro-creative approval (signature pipeline).
- **Parallel-development shared-file rule:** parallel workers create only their own isolated files. **Only the orchestrating agent edits the shared indexes** — `packages/registry/registry.json`, `apps/docs/lib/catalog.ts`, `apps/docs/lib/docs-content.ts`, `apps/docs/app/_previews/index.tsx`, the two tsconfig `paths` maps, and pack/block definitions — then integrates once and runs `catalog-consistency-review`.
- No Released status without the full 12-point gate (esp. clean-fixture install). No claiming a check passed without running it. No silent breaking change (no guide/changeset/deprecation). No publishing without provenance/2FA or with secrets in source maps.
