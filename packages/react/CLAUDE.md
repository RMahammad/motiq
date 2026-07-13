# CLAUDE.md — `@scope/react`

> 🔵 **Planned package.** This directory is a scaffold: the package is not built yet. These rules apply once code lands here. Root rules: [`/CLAUDE.md`](../../CLAUDE.md). Package spec: [`docs/04-package-map.md`](../../docs/04-package-map.md).

## Purpose
Interactive components (buttons, cards, overlays, text effects) composed on the motion primitive layer.

## Public component API contract
Follow [`docs/09-component-api-standard.md`](../../docs/09-component-api-standard.md): three API levels, `forwardRef`, semantic props, token-based timing, namespaced `motionProps` escape hatch, `data-slot`/`data-state`/`data-motion` hooks. Use the [`component-authoring`](../../.claude/skills/component-authoring/SKILL.md) skill.

## Allowed dependencies
`@scope/motion`, `@scope/tokens`, `@radix-ui/*`; peers: `react`, `react-dom`, `motion`.

## Forbidden imports (CI-enforced)
❌ Remotion · ❌ Node built-ins (`node:*`) · ❌ `next/*`. See the [forbidden-import matrix](../../docs/03-architecture.md#forbidden-import-matrix).

## Accessibility (release-blocking)
WCAG 2.2 AA. Use **Radix** for overlays/menus/tabs/tooltips ([ADR-0011](../../docs/adrs/0011-accessible-primitives.md)). axe = 0; keyboard + focus trap/restore; reduced-motion fallback. See [`docs/12`](../../docs/12-accessibility-standard.md).

## Story & test expectations
Every component: Storybook stories (default/dark/theme/reduced-motion) + interaction test + axe test + SSR/hydration test. Fixtures install the **packed tarball** ([`docs/14`](../../docs/14-testing-strategy.md)).

## Styling & tokens
CVA + `cn()` (`clsx`+`tailwind-merge`); **no dynamic Tailwind class names**; theme via CSS-var tokens; ship a compiled-CSS fallback path. See [`docs/10`](../../docs/10-design-tokens.md), [`docs/11`](../../docs/11-tailwind-strategy.md).

## `"use client"`
Required on components using hooks/motion; must be **preserved** in the published build ([ADR-0006](../../docs/adrs/0006-library-bundler.md)).
