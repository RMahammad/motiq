# Architecture Decision Records

> **Last reviewed:** 2026-07-14. Template: [`../templates/architecture-decision-template.md`](../templates/architecture-decision-template.md).

## Why most ADRs are "Proposed"

Per our ADR rule, a decision is **Accepted** only when it is *supported by the current project* (validated by a spike, fixture, or shipped code); otherwise it is **Proposed**. Each ADR's **Validation** section states what would move it to Accepted.

**Status as of the 2026-07-14 spikes:** **Accepted** — `0001` (monorepo), `0006` (bundler), `0007` (package format), `0008` (Storybook builds; docs site still Planned), and `0011` (Radix — full overlay set validated). The build shipped **16 `publint`-clean components** across `@scope/{tokens,motion,react,sections}` (88 tests + size-limit budgets), the Next 16 App Router + Vite + packed-tarball fixtures, and a static Storybook. `0009` (testing stack) is **near-accepted** (Vitest/RTL/axe/tarball/size-limit + Storybook build done; the Vitest-addon interaction + Playwright-in-CI passes remain). The rest are **Proposed** pending their own validation.

## Status table

| ADR | Title | Status | Owns / canonical doc | Legal-uncertain? |
|---|---|---|---|---|
| [0001](0001-monorepo-tool.md) | Monorepo tool (pnpm + Turborepo) | **Accepted** | [`03`](../03-architecture.md) | no |
| [0002](0002-animation-engine.md) | Animation engine (Motion for React + CSS/WAAPI) | Proposed | [`06`](../06-animation-engine-decision.md) | no |
| [0003](0003-remotion-boundary.md) | Remotion boundary (video-only, separate license) | Proposed | [`07`](../07-remotion-strategy.md), [`08`](../08-remotion-license-analysis.md) | **yes** ⚠️ |
| [0004](0004-styling-and-tailwind.md) | Styling & Tailwind (preset + CSS vars + fallback) | Proposed | [`11`](../11-tailwind-strategy.md) | no |
| [0005](0005-component-primitives.md) | Primitive-layer architecture (own primitives wrap engine) | Proposed | [`09`](../09-component-api-standard.md) | no |
| [0006](0006-library-bundler.md) | Library bundler (tsdown; tsup fallback) | **Accepted** (spike-validated) | [`05`](../05-dependency-decisions.md) | no |
| [0007](0007-package-format.md) | Package format (ESM-only, subpath exports, preserve directives) | **Accepted** (publint-clean) | [`03`](../03-architecture.md) | no |
| [0008](0008-documentation-platform.md) | Documentation platform (Storybook 9 + Next.js docs) | **Accepted** (both surfaces build) | [`15`](../15-documentation-strategy.md) | no |
| [0009](0009-testing-stack.md) | Testing stack (Vitest+RTL+SB9+Playwright+axe; tarball fixtures) | Proposed | [`14`](../14-testing-strategy.md) | no |
| [0010](0010-commercial-distribution.md) | Commercial distribution (private npm + authed registry; no runtime checks) | Proposed | [`16`](../16-commercial-packaging.md) | needs legal review |
| [0011](0011-accessible-primitives.md) | Accessible primitives (Radix default; React Aria later) | **Accepted** (Dialog spike-validated) | [`12`](../12-accessibility-standard.md) | no |
| [0012](0012-design-token-contract.md) | Design-token contract (semantic tokens, CSS vars + TS) | Proposed | [`10`](../10-design-tokens.md) | no |

## Rules

- Do not mark an ADR **Accepted** until the project validates it (see each ADR's **Validation**).
- Legal-uncertain decisions (0003; 0010's refund/terms angle) must not present interpretations as legal conclusions.
- Every ADR links to its canonical doc and does **not** restate it in full.
- Every ADR number is unique and appears in this table (checked by [`../tooling/check-adr-index.mjs`](../tooling/check-adr-index.mjs)).
- New ADRs: copy the [template](../templates/architecture-decision-template.md), take the next number, add a row here.
