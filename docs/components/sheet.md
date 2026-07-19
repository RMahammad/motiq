# Sheet (Drawer)

> **Status:** 🟡 In progress (spike + tests) · **Version introduced:** v0.0.0 (pre-release) · **Tier:** Premium · **Package:** `@scope/react`
> **Built on:** [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog) ([ADR-0011](../adrs/0011-accessible-primitives.md)) · **Standards:** [API](../09-component-api-standard.md) · [A11y](../12-accessibility-standard.md) · [Perf](../13-performance-standard.md)
> Source: [`packages/react/src/sheet.tsx`](../../packages/react/src/sheet.tsx) · Tests: [`sheet.test.tsx`](../../packages/react/src/sheet.test.tsx)

An edge-anchored modal drawer — a [Radix Dialog](dialog.md) that slides in from a `side`. Same a11y guarantees as [`AnimatedDialog`](dialog.md); a CSS slide animation per side (Radix waits for the exit animation). Ideal for mobile navigation and filter panels.

## Import & example

```tsx
import { Sheet } from "@scope/react"; // or "@scope/react/sheet"
import "@scope/tokens/styles.css";
import "@scope/react/styles.css";

<Sheet
  trigger={<button type="button" className="scope-btn">Filters</button>}
  title="Filters"
  description="Refine the results."
  side="right"
>
  {/* controls */}
</Sheet>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `ReactNode` | — (required) | Labels the dialog |
| `description` | `ReactNode` | — | Optional description (cleanly opted out when omitted) |
| `trigger` | `ReactNode` | — | Opens the sheet (`asChild`) |
| `side` | `"left" \| "right" \| "top" \| "bottom"` | `"right"` | Edge it slides from (`data-side`) |
| `open` / `defaultOpen` / `onOpenChange` | — | — | Controlled/uncontrolled |
| `children` | `ReactNode` | — | Body |
| `closeLabel` | `string` | `"Close"` | Accessible name for the ✕ button |
| `className` | `string` | — | Merged onto the content |

**Slots:** `data-slot="overlay" | content | title | description | close"`; `data-side` for per-side styling.

## Accessibility (verified by tests)

Focus trap on open, **focus restore to trigger** on close, `Escape` to close, `role="dialog"` labelled by `title`, `data-side` reflected. axe: 0 violations when open.

## Reduced motion / performance / SSR

Slide disabled under `prefers-reduced-motion` (appears instantly). ~550 B brotli (Radix external). Closed by default → SSRs only the trigger.

## Known limitations

- Modal only; for a non-blocking side panel compose your own with `Popover`/layout.
- Uses `100dvh`/`100vw` — verify against your app's safe-area/scroll setup.

## Related

- [`AnimatedDialog`](dialog.md) · [ADR-0011](../adrs/0011-accessible-primitives.md) · [Inventory](../21-component-inventory.md)
