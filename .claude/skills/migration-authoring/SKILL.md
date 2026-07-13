---
name: migration-authoring
description: Author migration documentation for breaking changes — description, affected packages, before/after examples, codemod feasibility, deprecation timeline, compatibility window, changelog, versioning impact, doc links, and rollback guidance.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---
# Migration authoring

## Use this skill when
- A change breaks a public API, removes/renames a prop or token, or otherwise requires consumers to act.

## Do not use this skill when
- The change is additive/backward-compatible (minor/patch) — a changelog entry suffices.

## Required context
- [`docs/templates/migration-guide-template.md`](../../../docs/templates/migration-guide-template.md)
- [`docs/18-release-process.md`](../../../docs/18-release-process.md), [`docs/19-support-and-deprecation.md`](../../../docs/19-support-and-deprecation.md)
- [`docs/09-component-api-standard.md`](../../../docs/09-component-api-standard.md) / [`docs/10-design-tokens.md`](../../../docs/10-design-tokens.md) as relevant.

## Inputs
- The breaking change + the ADR that motivated it.

## Procedure
1. **Describe the breaking change** and link the ADR.
2. **List affected packages.**
3. **Before/after examples** — real, runnable.
4. **Codemod feasibility** — provide a codemod command if feasible; otherwise state "manual migration required" and why.
5. **Deprecation timeline** — deprecated in vX.N (dev-only warning), removed in vY.0; **compatibility window ≥ one major** ([`19`](../../../docs/19-support-and-deprecation.md)).
6. **Versioning impact** — major; ensure the changeset reflects it.
7. **Changelog** update.
8. **Documentation links** — update affected doc pages/standards.
9. **Rollback guidance** — how to pin the previous version safely.

## Required validation
- Guide follows the [template](../../../docs/templates/migration-guide-template.md); before/after examples compile against the new API.
- A major-version changeset exists.
- Deprecation lead time honored (not removed in the same release it's deprecated).

## Expected outputs
A migration guide + changelog entry + updated doc links + (optional) codemod.

## Documentation updates
- Publish the migration guide; update the canonical standard(s) that changed. Run [`documentation-maintenance`](../documentation-maintenance/SKILL.md).

## Stop conditions
- A breaking change being shipped without a deprecation window where one is feasible → stop and add the window.

## Prohibited actions
- Silent breaking changes (no guide, no changeset, no deprecation).
- Removing a shared token/prop in the same release it is deprecated.
