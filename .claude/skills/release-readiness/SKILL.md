---
name: release-readiness
description: Drive a package release — changesets, changelog, build, lint, typecheck, tests, a11y, SSR/hydration, packed-tarball fixture install, export/type validation, tree-shaking, bundle budgets, docs deploy, migration guide for breaking changes, provenance, and a go/no-go report.
allowed-tools: Read, Edit, Bash, Grep, Glob
---
# Release readiness

## Use this skill when
- Preparing to publish one or more packages.

## Do not use this skill when
- Mid-development; use the authoring/review skills first.

## Required context
- [`docs/18-release-process.md`](../../../docs/18-release-process.md) (canonical)
- [`release-checklist.md`](./release-checklist.md)
- [`docs/14-testing-strategy.md`](../../../docs/14-testing-strategy.md), [`docs/17-security-and-supply-chain.md`](../../../docs/17-security-and-supply-chain.md)

## Inputs
- The packages + version bump(s) to release.

## Procedure
1. **Changesets** consumed; **changelog** generated.
2. **Build** — verify `"use client"` is preserved in published entry points ([ADR-0006](../../../docs/adrs/0006-library-bundler.md)).
3. **Lint** (+ boundaries) · **typecheck**.
4. **Tests** — unit/interaction · **a11y (axe)** · **SSR/hydration**.
5. **Pack & fixtures** — `pnpm pack`; install the tarball in `playground-next` + `playground-vite`; they pass.
6. **Export/type validation** — `publint` + `@arethetypeswrong/cli` clean.
7. **Tree-shaking** check.
8. **Bundle budgets** — `size-limit` within limits.
9. **Docs** deployed; internal link check passes.
10. **Migration guide** present for any breaking change ([`migration-authoring`](../migration-authoring/SKILL.md)).
11. **Provenance & publication** — `npm publish --provenance`; 2FA; least-privilege token ([`17`](../../../docs/17-security-and-supply-chain.md)).
12. **Go/no-go report.**

## Required validation
Run the full [`release-checklist.md`](./release-checklist.md). Every ⛔ item must pass. **Actually run** the commands — do not assume results.

## Expected outputs
A go/no-go report listing each gate's status, the packed file-list inspection, fixture results, and any blockers.

## Documentation updates
- Changelog + GitHub release notes; docs deploy. Run [`documentation-maintenance`](../documentation-maintenance/SKILL.md) if any public API changed.

## Stop conditions
- Any ⛔ gate fails (a11y, SSR/hydration, `"use client"` preserved, tarball fixture, export/type validation, size budget) → **no-go**.
- A breaking change without a migration guide → no-go.

## Prohibited actions
- Claiming a check passed without running it.
- Publishing with secrets in source maps or without provenance/2FA.
- Unpublishing a widely-installed version (deprecate + republish prior instead).
