# Release gate

> **Type:** Canonical checklist · Scope: shipping a component, block, or pack. Package-publish template: [`templates/release-checklist.md`](templates/release-checklist.md).

One pass, no subjective scoring. Full pipeline for package publishing (changesets, tarball fixture, provenance) is [`18-release-process.md`](18-release-process.md); the paid-launch gate is [`45-paid-launch-decision-gate.md`](45-paid-launch-decision-gate.md).

## Gate

- [ ] **Renders** correctly in the docs app (light + dark).
- [ ] **Interactions work** — every control maps to a real prop.
- [ ] **Responsive** — no horizontal overflow 320–1920px.
- [ ] **Reduced motion** — animation has a static/settled fallback.
- [ ] **Semantics + keyboard** — native elements, visible focus, Escape/focus-restore where relevant. No axe violations.
- [ ] **API** — controlled/uncontrolled correct; callbacks named per [`component-authoring.md`](component-authoring.md).
- [ ] **Comments** — concise, why-not-what; no commented-out code; no marketing prose.
- [ ] **Dependencies** — exact, component-local where heavy; no docs/preview dep in customer source.
- [ ] **Registry metadata** — exact files, runtime deps, registry deps, tier, release status.
- [ ] **Preview** — real live preview, deterministic data, offscreen-safe.
- [ ] **Docs** — brief/doc page present; install command generated from `product.config.json`.
- [ ] **Clean fixture** — installs and typechecks in a project with no `@scope/*`, `next/*`, or `node:*` leaks.
- [ ] **Public/protected routing** — Free source public, Pro source protected; `pnpm check:exposure` clean.
- [ ] **Build** — `pnpm build`, registry generation, catalog validation pass.
- [ ] **Console/hydration** — zero errors during normal use.

## Commands

```
pnpm lint && pnpm typecheck && pnpm test
node packages/registry/scripts/build-registry.mjs
node scripts/check-catalog-quality.mjs
pnpm check:exposure
pnpm docs:check
```
