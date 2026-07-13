# 10 — Design tokens

> **Type:** 🟢 Canonical for the token system · **Implementation status:** 🔵 Planned (`@scope/tokens` not yet built) · **Last reviewed:** 2026-07-14
> **Owns:** token categories, CSS-variable naming, TS representation, motion-intensity modes, deprecation policy.
> **Related:** [`11-tailwind-strategy.md`](11-tailwind-strategy.md) (how tokens reach Tailwind) · [`09-component-api-standard.md`](09-component-api-standard.md) · [ADR-0012](adrs/0012-design-token-contract.md) · [`design-system-consistency` skill](../.claude/skills/design-system-consistency/SKILL.md)

## Token categories

**Visual:** color, typography, spacing, radius, border, shadow, blur, z-index, opacity.
**Motion:** duration, delay, easing, distance, scale, opacity, stagger, perspective, spring configurations, motion-intensity.

## Semantic motion tokens (CSS custom properties)

```
--motion-duration-instant | --motion-duration-fast | --motion-duration-normal | --motion-duration-slow
--motion-ease-standard    | --motion-ease-emphasized
--motion-distance-sm      | --motion-distance-md    | --motion-distance-lg
--motion-stagger-sm       | --motion-stagger-md
--motion-scale-sm         | --motion-scale-md
--motion-spring-gentle    | --motion-spring-snappy   (expressed as TS spring configs; see below)
--motion-perspective-md
```

Level-1 component props map to these token **names**, never raw milliseconds (see [`09`](09-component-api-standard.md)).

## CSS-variable naming rules

- Global/semantic tokens: `--motion-*`, `--color-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--z-*`.
- Component-scoped tokens: `--<component>-*` (e.g. `--dialog-overlay-opacity`).
- Themes override tokens via the cascade — `:root`, `[data-theme="…"]`, `.dark` — **without touching component source.**

## TypeScript token representation

`@scope/tokens` exports both the CSS (for the stylesheet/preset) and typed constants for JS-driven animation (springs, staggers):

```ts
export const motion = {
  duration: { instant: 0, fast: 120, normal: 220, slow: 360 }, // ms
  ease: { standard: [0.2, 0, 0, 1], emphasized: [0.2, 0, 0, 1] },
  distance: { sm: 8, md: 16, lg: 32 }, // px
  stagger: { sm: 0.04, md: 0.08 }, // s
  spring: { gentle: { stiffness: 200, damping: 30 }, snappy: { stiffness: 300, damping: 24 } },
} as const;
```

CSS vars and TS constants must stay in sync — a single generator is the planned source (one file → both outputs) to avoid drift.

## Motion-intensity modes

Selectable via `MotionProvider` / `data-motion-intensity`:

| Mode | Behavior |
|---|---|
| `none` | No non-essential motion at all |
| `reduced` | Minimal, essential motion only (also the `prefers-reduced-motion` target) |
| `standard` | Default |
| `expressive` | Larger distances, springier easings |

**`prefers-reduced-motion: reduce` is respected automatically.** The app may set a **stricter** value than the OS preference, but never a looser one. See [`12-accessibility-standard.md`](12-accessibility-standard.md).

## Dark mode & themes

Dark mode and additional themes are **token overrides only** (`data-theme`/`.dark` + CSS var values). Components never branch on theme. Dark mode is **not** a naive color inversion — contrast must be re-checked per theme (see the [`design-system-consistency`](../.claude/skills/design-system-consistency/SKILL.md) skill). Keep shipped themes to a small number (2) to bound test/visual-regression cost ([`22`](22-risk-register.md)).

## Theme extension policy

Consumers extend by overriding CSS variables (and, for Tailwind users, the preset's `@theme`). They do **not** fork component source to re-theme. Adding a new token is allowed only when an existing semantic token **cannot** express the design.

## Token deprecation policy

- Deprecate a token by marking it in `@scope/tokens` with a `@deprecated` JSDoc + a replacement pointer, keeping it functional for one major version.
- Removal is a **breaking change** → changeset + migration guide ([`migration-authoring`](../.claude/skills/migration-authoring/SKILL.md), [ADR-0012](adrs/0012-design-token-contract.md)).
- Never rename a shared token silently.

## Rule against one-off values

No arbitrary hex colors, radii, shadows, spacings, durations, or easings when a semantic token exists. Never create a token named after a single component when the concept is reusable. Never mutate a shared token to fix one component. Enforced in review by [`design-system-consistency`](../.claude/skills/design-system-consistency/SKILL.md).
