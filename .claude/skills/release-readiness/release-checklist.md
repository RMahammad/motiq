# Release checklist (in-skill copy)

Canonical: [`docs/18-release-process.md`](../../../docs/18-release-process.md) and [`docs/templates/release-checklist.md`](../../../docs/templates/release-checklist.md). ⛔ = no-go if failing. **Run every command — do not assume results.**

## Pre-flight
- [ ] CI green: lint(+boundaries), typecheck, unit/interaction, ⛔ a11y, ⛔ SSR/hydration
- [ ] Changeset(s) consumed; CHANGELOG generated
- [ ] ⛔ Build preserves `"use client"`
- [ ] ⛔ `pnpm pack --dry-run` inspected (files correct; no secret-leaking maps; `"use client"` present)

## Artifact
- [ ] ⛔ Tarball installs in `playground-next` + `playground-vite`; both pass
- [ ] ⛔ `publint` clean · ⛔ `@arethetypeswrong/cli` clean
- [ ] Tree-shaking check passes · ⛔ `size-limit` within budget

## Docs & migration
- [ ] Docs deployed; link check passes
- [ ] Migration guide for any breaking change

## Publish
- [ ] ⛔ `npm publish --provenance`; 2FA; least-privilege token
- [ ] Git tag + GitHub release notes
- [ ] Post-publish smoke test from a clean fixture

## Sign-off
- [ ] Go/no-go report produced
