# <ComponentName>

> **Status:** 🔵 Planned / 🟡 In progress / 🟢 Stable · **Version introduced:** vX.Y · **Tier:** Free / Premium · **Package:** `@scope/<pkg>`
> **Related primitives:** [...] · **Canonical standards:** [API](../09-component-api-standard.md) · [A11y](../12-accessibility-standard.md) · [Perf](../13-performance-standard.md)

One-sentence description of what the component does and its buyer use case.

## Install / import

```bash
# compiled edition
pnpm add @scope/react
# source edition
npx <name> add <component>
```
```tsx
import { ComponentName } from "@scope/react/component-name";
```

## Interactive preview

<!-- docs-site embeds the live Storybook story here -->

## Example (real, runnable)

```tsx
<ComponentName variant="primary" duration="normal">…</ComponentName>
```

## Props

| Prop | Type | Default | Level | Description |
|---|---|---|---|---|
| `className` | `string` | — | 1 | merged last via `cn()` |
| … | | | | |

## Accessibility notes

- Keyboard: …
- Focus: …
- Screen reader: …
- Reduced motion: … (final-state render)
- Forced colors: …

## Reduced-motion behavior

Describe exactly what happens under `prefers-reduced-motion: reduce`.

## Performance notes

Budget, animation properties used, lazy-loading, mobile fallback. See [`13`](../13-performance-standard.md).

## Responsive behavior

Breakpoints, container-query behavior, mobile specifics.

## Dark mode & custom theme

```tsx
// dark example + token-override example
```

## Common recipes

- …

## Known limitations

- …

## Related

- Primitives: [...]
- Docs: [...]
