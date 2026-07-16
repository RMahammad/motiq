---
name: protected-source-audit
description: Gate that verifies Pro/protected source never leaks into public build output and that all shipped source is clean-room (no competitor source, names, effects, or APIs copied).
---

# Protected source audit

Two concerns, one gate: (1) protected Pro source must never appear in publicly served build output; (2) all shipped source must be clean-room original — no competitor source, names, exact effects, sequences, or APIs copied. Canonical references (do not duplicate): [`../../../docs/security-model.md`](../../../docs/security-model.md), [`../../../docs/42-pro-source-delivery-audit.md`](../../../docs/42-pro-source-delivery-audit.md), [`../../../docs/49-commercial-threat-model.md`](../../../docs/49-commercial-threat-model.md), [`../../../docs/registry-authoring.md`](../../../docs/registry-authoring.md).

## When to use

- Adding or moving any registry item between free and Pro tiers.
- Changing the registry build, exposure audit, or anything that writes under a public dir.
- Before a release, and whenever a component may have been influenced by competitor source.
- Not for generic unownable patterns (a fade, a tabs indicator) — note as generic and move on.

## Inputs

- The registry item(s) changed and their tier (free vs Pro).
- Protected source root: `packages/registry/.protected/r`. Free source root: `apps/docs/public/r`.
- The static/public build output directory produced by the registry and docs builds.

## Steps

1. Run `pnpm check:exposure` (`scripts/audit-pro-exposure.mjs`) — asserts no protected item is served under any public dir.
2. Run the registry build (`packages/registry/scripts/build-registry.mjs`) — it asserts no protected source is written under the public dir. A failure here is a release blocker, not a warning.
3. Verify tier routing: Pro/protected items live only under `packages/registry/.protected/r`; free items only under `apps/docs/public/r`. No item exists in both.
4. Grep registry source for boundary leaks: no `@scope/*` specifiers and no imports from the docs app. Registry source uses the consumer convention `@/components/motionstack/<name>` and `@motionstack/{utils,primitives}` only.
5. Inspect the static output tree: confirm no protected filename, source, or Pro-only string appears in anything served publicly (built files, manifests, JSON indexes, source maps).
6. Clean-room check on new/changed source: confirm it was not copied from React Bits, Aceternity, Animate UI, Magic UI, or any library — no copied source, component names, exact effect recipes, shaders, sequences, layouts, APIs, docs text, or preview compositions.

## Completion criteria

- `pnpm check:exposure` passes and the registry build's protected-source assertion passes.
- Every changed item is in exactly one tier root; no protected source under a public dir.
- Registry source has zero `@scope/*` and zero docs-app imports.
- Static output contains no protected source, filenames, or Pro-only strings.
- All shipped source is clean-room; no copied competitor material.

## Required validation

- `pnpm check:exposure`
- registry build (`packages/registry/scripts/build-registry.mjs`)
- grep of registry source for `@scope/` and docs-app import paths
- grep of the static output tree for protected filenames/strings

## Output format

A short verdict: pass/fail per validation above; the tier of each changed item; any leak found (file + path); and for clean-room, the competitor comparables checked (names/URLs) with an original-value statement. Any failure or suspected licensing exposure blocks the release and is escalated to the user.

## Non-goals

- Not a visual/quality review (use `component-sellability-review` / `premium-visual-review`).
- Not runtime license enforcement — gating is at install/purchase, never in client code.
- No subjective similarity-risk scoring theatrics. The rule is binary: copied competitor source/names/effects/APIs is prohibited, and **renaming or restyling is never remediation** — change the implementation or reject it.
