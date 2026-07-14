# AnimatedDialog

> **Status:** 🟡 In progress (spike + tests) · **Version introduced:** v0.0.0 (pre-release) · **Tier:** Premium · **Package:** `@scope/react`
> **Built on:** [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog) ([ADR-0011](../adrs/0011-accessible-primitives.md)) · **Canonical standards:** [API](../09-component-api-standard.md) · [A11y](../12-accessibility-standard.md) · [Perf](../13-performance-standard.md)
> Source: [`packages/react/src/dialog.tsx`](../../packages/react/src/dialog.tsx) · Tests: [`dialog.test.tsx`](../../packages/react/src/dialog.test.tsx), [`.a11y`](../../packages/react/src/dialog.a11y.test.tsx), [`.ssr`](../../packages/react/src/dialog.ssr.test.tsx)

An accessible modal dialog. **Accessibility is delegated to Radix** (focus trap + restore, `Escape` to close, `role="dialog"`, labelling); the animation is **pure CSS keyframes** keyed on Radix's `data-state` — Radix waits for the exit animation before unmounting, so no animation-engine dependency is needed ([docs/06 escalation](../06-animation-engine-decision.md)).

## Install / import

```tsx
import { AnimatedDialog } from "@scope/react"; // or "@scope/react/dialog"
import "@scope/tokens/styles.css";
import "@scope/react/styles.css";
// Radix is a dependency of @scope/react; consumers don't import it directly.
```

## Example (this is the fixture code)

```tsx
<AnimatedDialog
  trigger={<button type="button" className="scope-btn">Delete…</button>}
  title="Delete project"
  description="This action cannot be undone."
>
  <button type="button" className="scope-btn">Confirm delete</button>
</AnimatedDialog>
```

Controlled:
```tsx
const [open, setOpen] = useState(false);
<AnimatedDialog open={open} onOpenChange={setOpen} title="Settings">…</AnimatedDialog>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `ReactNode` | — (required) | Dialog title; labels the dialog (`aria-labelledby`) |
| `description` | `ReactNode` | — | Optional description (`aria-describedby`); opted out cleanly when omitted |
| `trigger` | `ReactNode` | — | Element that opens the dialog (Radix `Trigger asChild`) |
| `open` / `defaultOpen` / `onOpenChange` | controlled/uncontrolled | — | Standard Radix open-state API |
| `children` | `ReactNode` | — | Dialog body |
| `closeLabel` | `string` | `"Close"` | Accessible name for the ✕ close button |
| `className` | `string` | — | Merged onto the content via `cn()` |

**Slots (styling API):** `data-slot="overlay" | content | title | description | close"`.

## Accessibility notes (verified by tests)

- **Focus trap:** focus moves into the dialog on open and is trapped while open.
- **Focus restore:** closing returns focus to the trigger.
- **Keyboard:** `Escape` closes; `Tab` cycles within the dialog.
- **Semantics:** `role="dialog"`, labelled by `title`, described by `description` when present.
- **axe:** 0 violations at WCAG 2.2 AA scope, with and without a description.
- Close button has an accessible name (`closeLabel`); the ✕ glyph is `aria-hidden`.

## Reduced-motion behavior

Under `prefers-reduced-motion: reduce`, the enter/exit keyframe animations are disabled (`animation: none !important`) — the dialog appears/disappears instantly, fully functional. Radix's focus/scroll behavior is unaffected.

## Performance notes

Our wrapper is ~1 kB brotli (excl. Radix, which is a shared external dependency the consumer dedupes). CSS-only animation; no JS animation runtime. `"use client"`.

## SSR

Closed by default → only the trigger renders on the server (the portal content mounts on open). SSR test asserts no portal content leaks when closed.

## Known limitations

- Single-purpose modal; for non-modal popovers/menus use the planned Radix-backed `Popover`/`DropdownMenu`.
- Nested dialogs are supported by Radix but untested here.

## Related

- Standards: [A11y](../12-accessibility-standard.md) · [ADR-0011](../adrs/0011-accessible-primitives.md) · Inventory: [`21-component-inventory.md`](../21-component-inventory.md)
