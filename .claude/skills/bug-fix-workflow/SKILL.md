---
name: bug-fix-workflow
description: Fix a bug in a component, block, hook, or shared primitive — reproduce first, fix at the right layer, add a targeted regression test, and validate without weakening checks.
---

# Bug fix workflow

## When to use

A reported or discovered defect: broken controlled state, focus loss, hydration mismatch, missing cleanup, wrong callback value, registry/access error, keyboard failure, or an incorrect visual/motion state.

## Inputs

- A concrete reproduction or the observed vs. expected behavior.
- The affected file(s) and whether the code is a shared primitive (`packages/registry/registry/lib/*`) or a single component.

## Steps

1. **Reproduce** the behavior first — in a test or in the rendered docs app. Do not fix what you cannot reproduce.
2. Find the root cause and fix it at the correct layer. If a shared primitive is at fault, fix the primitive, not each caller.
3. Prefer readable local code over a new abstraction. Do not add a helper to reduce line count.
4. Add a **targeted regression test** for the fixed behavior — controlled state, focus, hydration, security boundary, registry access, or critical keyboard behavior. No exhaustive tests for visual-only styling.
5. Verify the reproduction now passes and nothing adjacent regressed.

## Completion criteria

The reproduced behavior is fixed and confirmed by rerunning it. A regression test covers it. No check was weakened to pass.

## Required validation

`pnpm lint && pnpm typecheck && pnpm test`. If the change touches the registry, also `node packages/registry/scripts/build-registry.mjs` and `pnpm check:exposure`. If it touches rendered output, verify in the docs app.

## Output format

Root cause · the fix (file:line) · the regression test added · validation results · any deferred related issue with a reason.

## Non-goals

Not a feature or redesign. Not a place to relabel an unreproduced report as fixed. Do not change commercial, licensing, or entitlement behavior except to fix a security/correctness defect. See [`../../../docs/code-quality-standard.md`](../../../docs/code-quality-standard.md).
