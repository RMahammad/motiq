---
name: repository-orientation
description: Orient in the repository before any cross-cutting or first-in-session change. Use before editing code you haven't touched this session, before architecture/dependency/API changes, and whenever unsure which package or standard applies.
allowed-tools: Read, Grep, Glob, Bash
---
# Repository orientation

## Use this skill when
- It is the first substantive work in a session.
- The change is cross-cutting (touches boundaries, multiple packages, exports, tokens, or the build).
- You are unsure which package owns the code or which standard applies.

## Do not use this skill when
- You are making a tiny, localized edit in a package you already understand this session.
- You have already run orientation this session and nothing structural changed.

## Required context
- [`docs/README.md`](../../../docs/README.md) — the index and "current vs planned" legend.
- [`docs/03-architecture.md`](../../../docs/03-architecture.md) — boundaries and forbidden imports.
- [`CLAUDE.md`](../../../CLAUDE.md) — invariants + skill routing.
- Relevant ADRs in [`docs/adrs/`](../../../docs/adrs/).

## Inputs
- The task description.

## Procedure
1. **Read the map.** Read `docs/README.md` and `docs/03-architecture.md`. Note the current phase (today: pre-implementation — most things are 🔵 Planned).
2. **Inspect the workspace** (adapt as the repo grows):
   - `Glob` for `pnpm-workspace.yaml`, `turbo.json`, root `package.json`.
   - `Glob packages/*` and `apps/*`; list what actually exists vs what docs mark Planned.
   - Look at `package.json` `exports` maps and `scripts`.
   - Find design tokens (`packages/tokens`), at least two existing similar components, and the reference component (`Reveal` / `AnimatedDialog` in [`docs/09`](../../../docs/09-component-api-standard.md)).
   - Find tests, Storybook config, and docs pages related to the area.
3. **Identify the affected packages** and which boundary rules apply ([`03`](../../../docs/03-architecture.md#forbidden-import-matrix)).
4. **Identify the relevant standards** (API/tokens/tailwind/a11y/perf/testing) and the canonical doc for each.
5. **Note existing implementation patterns** to match (don't invent a new style).
6. **List risks** for this change (boundary, bundle, a11y, SSR, license).
7. **Recommend the next skill** to invoke (see [`CLAUDE.md` routing](../../../CLAUDE.md#skill-routing)).

## Required validation
- Confirm which paths actually exist before recommending edits (do not assume planned packages exist).
- Distinguish 🟢 implemented from 🔵 planned explicitly in your summary.

## Expected outputs
A short orientation report:
- Current architecture summary (what exists vs planned).
- Affected packages.
- Relevant standards + canonical docs.
- Existing patterns to follow.
- Risks.
- Recommended next skill.

## Documentation updates
- None by default (this skill is read-only). If you discover a doc is wrong or stale, note it and hand off to [`documentation-maintenance`](../documentation-maintenance/SKILL.md).

## Stop conditions
- If the task requires building a package that does not exist yet, stop and confirm scope/phase with the user before scaffolding.

## Prohibited actions
- Do not edit code or docs in this skill unless the user explicitly asks.
- Do not claim a package/command exists without verifying it on disk.
