---
name: api-consistency-review
description: Read-only review of any new or changed public API for naming, controlled/uncontrolled patterns, callbacks, tokens, variants, refs, slots/data-attrs, escape hatch, SSR behavior, semver impact, and internal-leak checks against the component API standard.
allowed-tools: Read, Grep, Glob
---
# API consistency review

## Use this skill when
- Any public API is added or changed (component prop, primitive, exported type, package export).

## Do not use this skill when
- No public surface changed (internal-only refactor).

## Required context
- [`docs/09-component-api-standard.md`](../../../docs/09-component-api-standard.md) (canonical)
- [`docs/17-security-and-supply-chain.md`](../../../docs/17-security-and-supply-chain.md#coding-conventions) (conventions)
- Sibling components for consistency.

## Inputs
- The diff / new API surface.

## Procedure — check each
1. **Naming** — `PascalCase` components, `useX` hooks, positive booleans (`once` not `disableRepeat`), `onX` callbacks.
2. **Controlled/uncontrolled** — `value`/`defaultValue` + `onValueChange` pattern present and consistent.
3. **Callback naming** — `onOpenChange`, `onVisibilityChange`, etc.
4. **Token usage** — Level-1 timing props accept token names, not raw ms.
5. **Variant naming** — typed unions, consistent with siblings.
6. **`className`/`style`** — accepted; `className` merged last via `cn()`.
7. **Ref behavior** — `forwardRef` to the primary node.
8. **Slots/data-attributes** — documented `data-slot`/`data-state`/`data-motion`.
9. **Escape hatch** — engine access only via a namespaced `motionProps` (Level 3), documented as unstable.
10. **SSR behavior** — SSR-safe defaults; no first-render measurement.
11. **Semver impact** — additive (minor) vs breaking (major); flag if a changeset of the right bump is missing.
12. **Internal leaks** — the API must not expose engine internals or implementation details as the only interface.

## Required validation
- Produce a findings list mapped to [`09`](../../../docs/09-component-api-standard.md) rules, each marked pass/violation with the fix.
- Flag the correct semver bump and whether a changeset exists.

## Expected outputs
A read-only review report: violations, recommended fixes, semver impact. No code edits.

## Documentation updates
- None directly; if the API standard itself is unclear, hand off to [`documentation-maintenance`](../documentation-maintenance/SKILL.md).

## Stop conditions
- If the API leaks engine internals as the sole interface → block; require a semantic wrapper.

## Prohibited actions
- Editing code (this is a read-only review skill).
- Approving an API that violates the standard without recording the deviation and a reason.
