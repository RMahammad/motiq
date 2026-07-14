# Tooltip

> **Status:** 🟡 In progress (spike + tests) · **Version introduced:** v0.0.0 (pre-release) · **Tier:** Premium · **Package:** `@scope/react`
> **Built on:** [Radix Tooltip](https://www.radix-ui.com/primitives/docs/components/tooltip) ([ADR-0011](../adrs/0011-accessible-primitives.md)) · **Standards:** [API](../09-component-api-standard.md) · [A11y](../12-accessibility-standard.md) · [Perf](../13-performance-standard.md)
> Source: [`packages/react/src/tooltip.tsx`](../../packages/react/src/tooltip.tsx) · Tests: [`tooltip.test.tsx`](../../packages/react/src/tooltip.test.tsx)

Accessible hover/focus tooltip (`role="tooltip"`), CSS-faded via Radix's `data-state`. Opens on pointer hover **and keyboard focus**; `Escape`/blur closes.

## Import & example

```tsx
import { Tooltip } from "@scope/react"; // or "@scope/react/tooltip"
import "@scope/tokens/styles.css";
import "@scope/react/styles.css";

<Tooltip content="Save changes" side="top">
  <button type="button" className="scope-btn">Save</button>
</Tooltip>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `content` | `ReactNode` | — (required) | Tooltip content |
| `children` | `ReactNode` | — (required) | Trigger (focusable element via `asChild`) |
| `side` / `align` | position | `"top"` / `"center"` | Placement |
| `delayDuration` | `number` | `200` | Hover open delay (ms) |
| `open` / `defaultOpen` / `onOpenChange` | — | — | Controlled/uncontrolled |
| `className` | `string` | — | Merged onto the content |

## Accessibility (verified by tests)

Opens on **keyboard focus** (not hover-only), exposes `role="tooltip"`, wires the trigger's `aria-describedby`; `Escape` closes. axe: 0 violations at WCAG 2.2 AA when open. Trigger must be a focusable element.

## Reduced motion / performance / SSR

Fade disabled under `prefers-reduced-motion`. ~440 B brotli (Radix external). Portalled; renders nothing until opened. Includes a self-contained `Tooltip.Provider`; apps may add one root provider for a shared delay.

## Known limitations

- Not for interactive content — use [`Popover`](popover.md) for focusable panels.

## Related

- [`Popover`](popover.md) · [ADR-0011](../adrs/0011-accessible-primitives.md) · [Inventory](../21-component-inventory.md)
