# Popover

> **Status:** 🟡 In progress (spike + tests) · **Version introduced:** v0.0.0 (pre-release) · **Tier:** Premium · **Package:** `@scope/react`
> **Built on:** [Radix Popover](https://www.radix-ui.com/primitives/docs/components/popover) ([ADR-0011](../adrs/0011-accessible-primitives.md)) · **Standards:** [API](../09-component-api-standard.md) · [A11y](../12-accessibility-standard.md) · [Perf](../13-performance-standard.md)
> Source: [`packages/react/src/popover.tsx`](../../packages/react/src/popover.tsx) · Tests: [`popover.test.tsx`](../../packages/react/src/popover.test.tsx)

Click-triggered floating panel for interactive content. Manages focus (moves in on open, restores on close), `Escape` and outside-click dismiss. CSS-faded via Radix `data-state`.

## Import & example

```tsx
import { Popover } from "@scope/react"; // or "@scope/react/popover"
import "@scope/tokens/styles.css";
import "@scope/react/styles.css";

<Popover trigger={<button type="button" className="scope-btn">Filters</button>} closeLabel="Close">
  <form>{/* focusable controls */}</form>
</Popover>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `trigger` | `ReactNode` | — (required) | Trigger (`asChild`) |
| `children` | `ReactNode` | — (required) | Panel content |
| `side` / `align` | position | `"bottom"` / `"center"` | Placement |
| `open` / `defaultOpen` / `onOpenChange` | — | — | Controlled/uncontrolled |
| `closeLabel` | `string` | — | If set, renders an accessible ✕ close button |
| `className` | `string` | — | Merged onto the content |

**Slots:** `data-slot="popover" | close"`.

## Accessibility (verified by tests)

Opens on click; **focus moves into the panel and returns to the trigger on close**; `Escape` closes; optional close button has an accessible name. axe: 0 violations when open.

## Reduced motion / performance / SSR

Fade disabled under `prefers-reduced-motion`. ~476 B brotli (Radix external). Portalled; renders nothing until opened.

## Known limitations

- Non-modal by default; for a blocking dialog use [`AnimatedDialog`](dialog.md).

## Related

- [`Tooltip`](tooltip.md) · [`AnimatedDialog`](dialog.md) · [ADR-0011](../adrs/0011-accessible-primitives.md) · [Inventory](../21-component-inventory.md)
