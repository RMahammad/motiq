---
name: testing-review
description: Review test completeness for a change — unit, interaction, a11y, reduced-motion, SSR, hydration, Next.js + Vite fixtures, type tests, export tests, packed-package tests, visual tests, and Remotion deterministic-frame tests. Identifies missing behavior coverage, not just line coverage.
allowed-tools: Read, Grep, Glob, Bash
---
# Testing review

## Use this skill when
- Reviewing whether a component/primitive/section/package is adequately tested before completion or release.

## Do not use this skill when
- Authoring the tests themselves in-line (do that in the authoring skill); use this to *review* completeness.

## Required context
- [`docs/14-testing-strategy.md`](../../../docs/14-testing-strategy.md) (canonical)
- [`docs/12-accessibility-standard.md`](../../../docs/12-accessibility-standard.md), [`docs/13-performance-standard.md`](../../../docs/13-performance-standard.md)

## Inputs
- The change and its existing tests.

## Procedure — verify presence and adequacy
1. **Unit** — motion math, easing, `cn`, token logic.
2. **Interaction** — RTL/`play` for real user flows.
3. **Accessibility** — axe = 0.
4. **Reduced-motion** — asserts final-state render.
5. **SSR** — `renderToString` correctness.
6. **Hydration** — no mismatch.
7. **Next.js App Router fixture** coverage.
8. **Vite fixture** coverage.
9. **Type tests** — `expect-type`/`tsd` on public types.
10. **Export tests** — `publint` + `attw` on the packed package.
11. **Packed-package tests** — fixtures install the tarball, not source.
12. **Tree-shaking + bundle-size** tests.
13. **Visual** — when appearance changes.
14. **Remotion** — deterministic-frame + render smoke, when applicable.

## Required validation
- Map each required suite ([`14`](../../../docs/14-testing-strategy.md#required-suites)) to present/absent.
- **Identify missing behavior coverage** (states, reduced-motion, SSR, keyboard) — not just line percentages.
- Confirm the packed-tarball fixture rule is honored.

## Expected outputs
A coverage-gap report: which required suites are missing or weak, and the specific behaviors untested, with recommended tests.

## Documentation updates
- None directly; if a test requirement changes, update [`14`](../../../docs/14-testing-strategy.md) via [`documentation-maintenance`](../documentation-maintenance/SKILL.md).

## Stop conditions
- A release-blocking suite (a11y, SSR/hydration, reduced-motion, tarball fixture) is missing → block completion.

## Prohibited actions
- Signing off on line coverage while behavior coverage (reduced-motion, SSR, keyboard) is missing.
- Accepting fixtures that import monorepo source instead of the packed tarball.
