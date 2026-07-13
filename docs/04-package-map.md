# 04 — Package map

> **Type:** 🟢 Canonical for per-package spec · **Implementation status:** 🔵 Planned (no package exists yet) · **Last reviewed:** 2026-07-14
> **Owns:** each package's purpose, tier, environment, deps, CSS/`"use client"` status, allowed/forbidden imports.
> **Related:** [`03-architecture.md`](03-architecture.md) (boundary rules & diagrams) · [`05-dependency-decisions.md`](05-dependency-decisions.md) (dependency evaluation) · package `CLAUDE.md` files.

When a package moves from 🔵 Planned to 🟢 Implemented, update its row's **Status** here and run [`tooling/check-inventory.mjs`](tooling/) (planned).

> **Spike status (2026-07-14):** `@scope/tokens`, `@scope/motion`, `@scope/react` exist as **minimal spike scaffolds** — real `tsdown` builds, strict TS, and consumed by the Next + Vite fixtures. They contain only the reference `Reveal` primitive and a demo `AnimatedButton`; they are **not** DoD-complete (no tests/stories/a11y/docs yet — see [`25`](25-definition-of-done.md)). `motion`/`react` will re-add `motion` and `@radix-ui/*` peers when those components land.

## Package table

| Package | Status | Public? | Env | `"use client"`? | Tree-shake | Ships CSS? | Tier | Needs Tailwind? | Needs Remotion? | Peer deps |
|---|---|---|---|---|---|---|---|---|---|---|
| `@scope/tokens` | 🟡 In progress (spike) | ✅ | universal | no | ✅ | yes (vars) | free | no | no | — |
| `@scope/motion` | 🟡 In progress (spike) | ✅ | browser | **yes** | ✅ | no | free | no | no | react, react-dom |
| `@scope/react` | 🟡 In progress (spike) | ✅ | browser | **yes** | ✅ | optional | paid | no (fallback) | no | react, react-dom |
| `@scope/sections` | 🔵 Planned | ✅ | browser | **yes** | ✅ | optional | paid | no (fallback) | no | react, react-dom |
| `@scope/tailwind-preset` | 🔵 Planned | ✅ | build-time | no | n/a | preset | free | Tailwind | no | tailwindcss |
| `@scope/styles` | 🔵 Planned | ✅ | build asset | no | n/a | **yes** | free | no | no | — |
| `@scope/cli` | 🔵 Planned | ✅ | node | no | n/a | no | free | no | no | — |
| `@scope/registry` | 🔵 Planned | ✅ (gated) | data | n/a | n/a | source | paid | no | no | — |
| `@scope/remotion` | 🔵 Planned | ✅ (gated) | browser+node | player=yes | ✅ | no | **paid, separate** | no | **yes** | react, remotion |
| `@scope/remotion/server` | 🔵 Planned | ✅ (gated) | **node only** | no | n/a | no | paid | no | yes | @remotion/renderer |
| `@scope/gsap-adapter` | 🔵 Planned (optional) | ✅ (gated) | browser | yes | ✅ | no | paid | no | no | gsap |
| `@scope/eslint-config` | 🟢 Implemented | ❌ | dev | no | n/a | no | — | — | — | — |
| `@scope/tsconfig` | 🔵 Planned | ❌ | dev | no | n/a | no | — | — | — | — |
| `@scope/test-utils` | 🔵 Planned | ❌ | dev | no | n/a | no | — | — | — | — |

> `@scope` is a placeholder for the final npm scope (an [open question](23-open-questions.md) tied to the product name).

## Per-package notes

### `@scope/tokens`
Purpose: design + motion tokens as CSS variables and TS constants. **Imports nothing internal.** No React runtime. Shipped as free tier. Allowed imports: none internal. Forbidden: everything internal, Remotion, Node, Next. Canonical token content: [`10-design-tokens.md`](10-design-tokens.md).

### `@scope/motion`
Purpose: the motion primitive layer (`Reveal`, `Stagger`, `InView`, `Fade/Slide/Scale`, `ScrollProgress`, `MotionProvider`, …) built on Motion for React, exposing a **stable semantic API** so components never touch engine internals. Allowed: `tokens`, peer `motion`, `react`. Forbidden: `react`(components pkg), Remotion, Node, Next. Contract: [`09`](09-component-api-standard.md), primitives list: [`21`](21-component-inventory.md).

### `@scope/react`
Purpose: interactive components (buttons, cards, overlays, text effects). Allowed: `motion`, `tokens`, `@radix-ui/*`. **Forbidden: Remotion, Node built-ins, `next/*`.** Overlays use Radix ([ADR-0011](adrs/0011-accessible-primitives.md)). Package rules: [`packages/react/CLAUDE.md`](../packages/react/CLAUDE.md) (planned scaffold).

### `@scope/sections`
Purpose: marketing sections (Hero, FeatureGrid, CTA, …) composed from `react`. Accepts content via props/slots — **no hard-coded marketing copy**. Adds no new engine. See [`animated-section-authoring`](../.claude/skills/animated-section-authoring/SKILL.md).

### `@scope/tailwind-preset`
Purpose: Tailwind v4 preset exposing tokens via `@theme`. Consumed at build time only; never in runtime bundles. See [`11`](11-tailwind-strategy.md).

### `@scope/styles`
Purpose: compiled, namespaced CSS fallback for **non-Tailwind consumers**. No Preflight assumptions. See [`11`](11-tailwind-strategy.md).

### `@scope/cli` + `@scope/registry`
Purpose: shadcn-style source edition — `npx <name> add <component>` pulls source from an authenticated registry. Commercial rationale: [`16`](16-commercial-packaging.md).

### `@scope/remotion` + `@scope/remotion/server`
Purpose: the video product line — compositions, templates, Player preview, server render. **Separate license** — see [`08`](08-remotion-license-analysis.md) before touching. Server render code is Node-only behind `./server`. Package rules: [`packages/remotion/CLAUDE.md`](../packages/remotion/CLAUDE.md) (planned scaffold).

### `@scope/gsap-adapter` (optional)
Purpose: opt-in adapter for unusually complex timelines. Not a core dependency. GSAP is free incl. all plugins but carries an anti-compete clause — see [`05`](05-dependency-decisions.md) and [`06`](06-animation-engine-decision.md).

### `@scope/eslint-config` (🟢 Implemented)
Purpose: the **import-boundary firewall** (`./boundaries`) — flat-config `no-restricted-imports` rules enforcing the [forbidden-import matrix](03-architecture.md#forbidden-import-matrix); consumed by the root `eslint.config.js` (`pnpm lint`). Verified 2026-07-14 to reject `node:*` / `@scope/remotion` imports in core packages and pass on clean code. `@scope/tsconfig` / `@scope/test-utils` remain planned (the shared TS base currently lives at root `tsconfig.base.json` 🟢).

## Packages deliberately NOT created (and why)

| Suggested in original example | Decision | Reason |
|---|---|---|
| `core/` | dropped | Folded into `tokens`+`motion`; an empty "core" invites a dumping ground |
| `primitives/` | dropped | Merged into `motion/` — one primitive layer, not two |
| `presets/` | dropped | Motion presets live in `tokens`/`motion` |
| `icons/` | dropped | Peer-dep on `lucide-react` instead of shipping an icon package ([`05`](05-dependency-decisions.md)) |
| `internal-admin/` | dropped | A hosted app, not a library concern; build only if hosted rendering ships |
| `internal-license/` | **dropped on purpose** | **No runtime license package.** Gate at install/purchase, not runtime ([`16`](16-commercial-packaging.md)) |
