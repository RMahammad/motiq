# ADR-0009: Testing stack — Vitest + RTL + SB9 + Playwright + axe, tarball fixtures

- Status: Proposed
- Date: 2026-07-14
- Owners: Eng
- Related documents: [`../14-testing-strategy.md`](../14-testing-strategy.md) (canonical), [`../18-release-process.md`](../18-release-process.md)
- Supersedes: —
- Superseded by: —

## Context
A paid library must catch RSC/`"use client"`, export-map, hydration, a11y, and bundle-size regressions before customers do. Line coverage is insufficient; we need behavior + artifact coverage.

## Decision
Layered stack: **Vitest** (unit) + **React Testing Library** and **Storybook 9 `play`** (interaction) + **axe** (a11y) + **Playwright** (E2E/visual/mobile) + type tests (`expect-type`) + export validation (`publint`/`attw`). **Consumer fixtures install the packed tarball** (`pnpm pack`), not monorepo source, for `playground-next` and `playground-vite`.

## Decision drivers
- Catch packaging failures on the real artifact.
- Reduced-motion, SSR, and a11y are release-blocking → must be tested.

## Alternatives considered
- **Jest** — slower; Vitest integrates with SB9.
- **Cypress** — Playwright covers our cross-browser/mobile + visual needs.
- **Importing monorepo source in fixtures** — hides export/`"use client"` bugs; rejected.

## Consequences
### Positive
- High confidence the published package works in real consumers.
### Negative
- Fixture pack/install adds CI time.

## Risks and mitigations
- Slow/expensive visual regression → labeled-PR only ([`../22`](../22-risk-register.md)).

## Validation
**Substantially validated (2026-07-14).** Vitest + React Testing Library proven for **unit + SSR + reduced-motion + axe a11y** on `Reveal` (**14 passing**, via Turbo). A `.github/workflows/ci.yml` gate wires lint/typecheck/build/test/doc-validators + fixture builds. A **packed-tarball consumer fixture** (`fixtures/tarball-consumer`) installs the `pnpm pack` artifacts (not source) and verifies cross-package resolution + `"use client"` + SSR — registry-free (a verdaccio publish is awkward in locked registries), wired into CI. **`publint` (export correctness) and `size-limit` (budgets) are now wired into CI and pass** for all packages / the three primitives. **Storybook 9 is now stood up** (`apps/storybook`, static build in CI — [ADR-0008](0008-documentation-platform.md)) with CSF3 stories for the hero components. **Still required before Accepted:** the Storybook **Vitest-addon interaction/a11y/visual tests run in CI** (needs a Playwright browser download in CI) and a Playwright cross-browser/mobile pass. (`attw` is blocked by an upstream crash under Node 24 — [ADR-0007](0007-package-format.md); `publint` + fixture typechecks cover the gap.)

## Revisit conditions
- Testing tools' integration story changes materially.

## Sources
- storybook.js.org (SB9 + Vitest addon), verified 2026-07-14 ([`../05`](../05-dependency-decisions.md#sources)).
