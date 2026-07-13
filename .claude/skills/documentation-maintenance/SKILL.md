---
name: documentation-maintenance
description: Keep docs and ADRs synchronized after any change to architecture, components, dependencies, public APIs, packages, releases, or accepted/superseded ADRs. Enforces one canonical owner per topic and updates only the affected summaries/links.
allowed-tools: Read, Edit, Write, Grep, Glob, Bash
---
# Documentation maintenance

## Use this skill when
- Architecture changes; a component is added/changed; a dependency changes; a public API changes; a package is added/removed; a release is prepared; an ADR is accepted or superseded.

## Do not use this skill when
- The change has no user-visible or architectural documentation impact (e.g. an internal refactor with identical public behavior and no standard affected).

## Required context
- [`docs/README.md`](../../../docs/README.md) — especially the "[Which document should I update?](../../../docs/README.md#which-document-should-i-update)" table.
- [`document-ownership-map.md`](./document-ownership-map.md) — canonical owner per topic.
- [`synchronization-checklist.md`](./synchronization-checklist.md) — the run checklist.

## Inputs
- The change that was just made (files/areas touched).

## Procedure
1. **Determine the canonical owner** of the information using the [ownership map](./document-ownership-map.md) / the README table.
2. **Update that canonical document** (the single source of truth). Bump its `Last reviewed` date.
3. **Find other documents that link to or summarize it** (`Grep` for the filename and topic keywords across `docs/`, `CLAUDE.md`, package `CLAUDE.md`).
4. **Update only affected summaries and links** — never copy the canonical content into another file.
5. **Check current-vs-planned accuracy** — if you implemented something, flip its 🔵→🟢 marker in the owning doc (and [`21-component-inventory.md`](../../../docs/21-component-inventory.md) for components).
6. **Check examples** against current exports and commands (no references to packages/commands that don't exist unless clearly marked Planned).
7. **Create/update an ADR** when the change is a durable architectural decision (use the [template](../../../docs/templates/architecture-decision-template.md); update [`adrs/README.md`](../../../docs/adrs/README.md)).
8. **Run the link + index checks** (see validation).
9. **Report every documentation file modified.**

## Required validation
Run the deterministic checks (from repo root):
```bash
node docs/tooling/check-links.mjs
node docs/tooling/check-adr-index.mjs
node docs/tooling/check-duplicate-titles.mjs
node docs/tooling/check-stale-dates.mjs
```
Confirm:
- No conflicting package names or outdated commands.
- No duplicated canonical tables.
- No dead internal links.
- No claim that unimplemented functionality already exists.
- No version/license claim without a source + verification date.

## Expected outputs
- Updated canonical doc(s) + refreshed summaries/links.
- Updated ADR + ADR index where applicable.
- A list of every file changed.
- Validation script output.

## Documentation updates
This skill **is** the documentation update. Always finish by listing changed files and the check results.

## Stop conditions
- If two documents both claim to be canonical for the same topic, stop and resolve ownership first (pick one; make the other link to it).
- If a version/license claim can't be sourced, stop and verify (hand to [`dependency-review`](../dependency-review/SKILL.md)).

## Prohibited actions
- Do not duplicate canonical content across files.
- Do not edit [`docs/archive/`](../../../docs/archive/) (the archived plan is frozen).
- Do not invent commands/packages; mark planned items as 🔵 Planned.
