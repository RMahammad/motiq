# Architecture

> **Type:** Canonical front-door · Detail: [`03-architecture.md`](03-architecture.md) · package specs: [`04-package-map.md`](04-package-map.md) · dependency table: [`05-dependency-decisions.md`](05-dependency-decisions.md).

## Packages

| Package | Role |
| --- | --- |
| `@scope/tokens` | Semantic design tokens + CSS variables + `cn`. |
| `@scope/motion` | Low-level, engine-agnostic motion primitives (server-safe where possible). |
| `@scope/react` | Animated components built on Radix/shadcn primitives. |
| `@scope/sections` | Marketing sections composed from components. |
| `@scope/recipes` | Higher-level compositions. |
| `@scope/remotion` | Video-only compositions — **isolated**. |
| `packages/registry` | Editable registry source + generation + validation. |

## Hard boundaries

- **Core React packages must not import Remotion, Node built-ins, or `next/*`.** Enforced by the import-boundary firewall (`pnpm lint`, `packages/eslint-config/boundaries.js`).
- **Remotion is video-only** and never imported by browser UI packages.
- Public packages are **ESM-only** with `"use client"` preserved in client entry points ([ADR-0006](adrs/0006-library-bundler.md), [ADR-0007](adrs/0007-package-format.md)).
- Registry source imports only `@/lib/*`, `react`, `motion`, and declared runtime deps — never `@scope/*` internals.

## Delivery

Components ship as editable source through a shadcn-compatible registry. Free source is public under `apps/docs/public/r`; Pro/block/pack source is protected under `packages/registry/.protected/r` and served through the entitlement-gated API. See [`registry-authoring.md`](registry-authoring.md) and [`security-model.md`](security-model.md).

## Build and validation

`pnpm build` (turbo → tsdown) · `pnpm typecheck` · `pnpm test` · `pnpm lint` · `pnpm docs:check` · registry generation (`node packages/registry/scripts/build-registry.mjs`) · catalog validation (`node scripts/check-catalog-quality.mjs`) · exposure audit (`pnpm check:exposure`).

Durable choices are recorded as ADRs in [`adrs/`](adrs/).
