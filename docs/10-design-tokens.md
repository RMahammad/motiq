# 10 — Design tokens

> **Type:** 🟢 Canonical for the token system · **Implementation status:** 🟡 In progress — `@scope/tokens` ships motion tokens (CSS vars + typed constants) **and** semantic visual tokens (`--color-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--font-sans`) with a `[data-theme="dark"]` / `.dark` override. Intensity modes + a single CSS↔TS generator still Planned · **Last reviewed:** 2026-07-14
> **Owns:** token categories, CSS-variable naming, TS representation, motion-intensity modes, deprecation policy.
> **Related:** [`11-tailwind-strategy.md`](11-tailwind-strategy.md) (how tokens reach Tailwind) · [`09-component-api-standard.md`](09-component-api-standard.md) · [ADR-0012](adrs/0012-design-token-contract.md) · [`design-system-consistency` skill](../.claude/skills/component-review/SKILL.md)

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
- **`--color-accent-text`** (added 2026-07-14): the accent used **as text** on `surface`/`bg`. Guaranteed ≥ 4.5:1 at body sizes in both themes (Direction "Deep Ink + Azure + Coral": light Azure `#244FD1` ≈ 6.7:1, dark Azure `#7F9FFF` ≈ 7.0:1) — use it instead of `--color-accent` whenever accent-colored *text* can appear below large-text sizes (first consumer: Kinetic Emphasis; see the WCAG 1.4.3 finding in its independent review). `--color-accent` remains the decorative/large-text accent.
- **Extended semantic color set** (added 2026-07-16 with the "Deep Ink + Azure + Coral" identity — see [`30-showcase-visual-system.md`](30-showcase-visual-system.md)). All theme-aware, all defined in `@scope/tokens/styles.css`:
  - **Backgrounds:** `--color-bg` (page) · `--color-bg-elevated` (subtle lifted band) · `--color-bg-secondary` / `--color-bg-muted`.
  - **Surfaces:** `--color-surface` (card) · `--color-surface-2` / `--color-surface-raised` (elevated) · `--color-surface-hover` · `--color-surface-strong` (highest elevation, e.g. the CTA panel).
  - **Text:** `--color-fg` · `--color-fg-secondary` · `--color-muted` · `--color-subtle` (least-important; large-text/decorative only in light).
  - **Borders:** `--color-border` (hairline) · `--color-border-strong` (emphasis rule).
  - **Accent (Azure):** `--color-accent` · `--color-accent-hover` · `--color-accent-pressed` · `--color-accent-text` · `--color-accent-fg` · `--color-accent-soft`. **Secondary accent (Cyan)** `--color-secondary-accent` + `--color-secondary-accent-soft` (mirrored as `--color-accent-2`/`-3` with AA `-text` pairs for preview templates). **Signature (Coral)** `--color-signature` · `--color-signature-hover` · `--color-signature-soft` · `--color-signature-text` — used rarely, never for danger (use `--color-error`) and never as the only signal.
  - **Atmosphere:** `--color-card-glow` · `--color-spotlight` (radial azure lighting) · `--color-gradient-start` / `--color-gradient-end` (azure→cyan, reserved).
  - **Requested aliases:** `--background`, `--background-subtle`, `--surface`, `--surface-elevated`, `--surface-hover`, `--surface-strong`, `--border`, `--border-strong`, `--foreground`, `--foreground-secondary`, `--foreground-muted`, `--foreground-subtle`, `--accent`, `--accent-hover`, `--accent-pressed`, `--accent-soft`, `--secondary-accent`, `--secondary-accent-soft`, `--signature`, `--signature-hover`, `--signature-soft`, `--success`, `--warning`, `--error`, `--info` are defined in `:root` as `var()` pointers to the themed `--color-*` tokens, so either naming resolves correctly per theme.
- Themes override tokens via the cascade — `:root`, `[data-theme="…"]`, `.dark` — **without touching component source.** (There is a single product identity; no `[data-brand]` alternates.)

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

Dark mode and additional themes are **token overrides only** (`data-theme`/`.dark` + CSS var values). Components never branch on theme. Dark mode is **not** a naive color inversion — contrast must be re-checked per theme (see the [`design-system-consistency`](../.claude/skills/component-review/SKILL.md) skill). Keep shipped themes to a small number (2) to bound test/visual-regression cost ([`22`](22-risk-register.md)).

## Theme extension policy

Consumers extend by overriding CSS variables (and, for Tailwind users, the preset's `@theme`). They do **not** fork component source to re-theme. Adding a new token is allowed only when an existing semantic token **cannot** express the design.

## Token deprecation policy

- Deprecate a token by marking it in `@scope/tokens` with a `@deprecated` JSDoc + a replacement pointer, keeping it functional for one major version.
- Removal is a **breaking change** → changeset + migration guide ([`migration-authoring`](../.claude/skills/registry-release/SKILL.md), [ADR-0012](adrs/0012-design-token-contract.md)).
- Never rename a shared token silently.

## Rule against one-off values

No arbitrary hex colors, radii, shadows, spacings, durations, or easings when a semantic token exists. Never create a token named after a single component when the concept is reusable. Never mutate a shared token to fix one component. Enforced in review by [`design-system-consistency`](../.claude/skills/component-review/SKILL.md).
