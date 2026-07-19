# Release checklist

> Canonical process: [`18-release-process.md`](../18-release-process.md). Skill: [`release-readiness`](../../.claude/skills/registry-release/SKILL.md). ⛔ = release-blocking.

## Pre-flight
- [ ] All CI green: lint (+boundaries), typecheck, unit/interaction, ⛔ a11y (axe), ⛔ SSR/hydration
- [ ] Changeset(s) consumed; CHANGELOG generated
- [ ] ⛔ Build preserves `"use client"` in published entry points
- [ ] ⛔ `pnpm pack --dry-run` inspected: file list correct, no secret-leaking source maps, `"use client"` present

## Artifact verification
- [ ] ⛔ Fixtures (`playground-next`, `playground-vite`) install the **packed tarball** and pass
- [ ] ⛔ `publint` clean
- [ ] ⛔ `@arethetypeswrong/cli` clean
- [ ] Tree-shaking check passes
- [ ] ⛔ `size-limit` budgets met

## Docs & migration
- [ ] Docs deployed; internal link check passes
- [ ] Migration guide present for any breaking change

## Publish
- [ ] ⛔ `npm publish --provenance`; 2FA; least-privilege token
- [ ] Git tag + GitHub release notes
- [ ] Post-publish: install published package into a clean fixture and smoke-test

## Sign-off
- [ ] Go/no-go report produced
