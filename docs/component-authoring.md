# Component authoring standard

> **Type:** Canonical standard · Scope: every catalog component, block, and section.

The default workflow is the [`rapid-component-release`](../.claude/skills/registry-release/SKILL.md) track (a one-page brief → build → wire → 12-point gate). This page is the structural contract that every component meets regardless of track. The full API contract is [`09-component-api-standard.md`](09-component-api-standard.md); tokens are [`10-design-tokens.md`](10-design-tokens.md).

## File and export naming

- One component per file, kebab-case filename matching the registry name (`prompt-composer.tsx`).
- Default export is the component; named export of the props type (`PromptComposerProps`).
- Registry source imports shared helpers from `@/lib/utils` and `@/lib/motion` only.

## File structure (where it helps readability)

Imports → public types → internal types → constants → small internal helpers → main component → small internal subcomponents → `displayName` → exports. Do not force this order when it makes a file harder to read.

## Props and callbacks

| Concern | Prop |
| --- | --- |
| Controlled value | `value` |
| Uncontrolled initial | `defaultValue` |
| Change | `onValueChange(next)` |
| Open state | `open` / `defaultOpen` / `onOpenChange` |
| Selected id | descriptive (`activeStepId`) |
| Async state | `status` or a named domain state |
| Render override | `renderItem`, `renderDetails` |
| Styling | `className` |

Avoid multiple props for one state, boolean explosions, `handle*` public callbacks, animation internals as primary props, and props that exist only for a preview.

## Controlled / uncontrolled

Use `useControllableState` from `@/lib/motion`. Controlled and uncontrolled must both work; callbacks fire with the resolved value; state must not reset on rerender; IDs (`useId`) are stable across SSR/CSR.

## Accessibility

Native semantics first, ARIA only to fill gaps. Keyboard operable, visible focus, focus restore on close, Escape for overlays, error/`aria-describedby` association, ≥24px targets, status never by color alone. Full contract: [`accessibility-standard.md`](accessibility-standard.md). Release-blocking.

## Motion

Use the four personalities (Precise · Fluid · Expressive · Ambient) and token-based timing. Every animation has a reduced-motion path; continuous motion pauses offscreen. See [`motion-standard.md`](motion-standard.md).

## Responsive and theme

Fluid width (no hard-coded `max-w`; the consumer owns width), no horizontal overflow 320–1920px, works in light/dark. Only semantic tokens for color/spacing/radius. See [`responsive-standard.md`](responsive-standard.md).

## Dependencies and registry

Heavy deps are component-local and lazy. Registry entry lists exact files, runtime deps, and registry deps; no docs/preview code ships in customer source. See [`registry-authoring.md`](registry-authoring.md).

## Preview, docs, tests

Every component has a working live preview ([`preview-authoring.md`](preview-authoring.md)), a concise doc/brief, and targeted tests for logic/focus/controlled-state/async — not exhaustive tests for visual-only styling. See [`14-testing-strategy.md`](14-testing-strategy.md).

## Release status

Track status on [`39-catalog-production-board.md`](39-catalog-production-board.md): `Idea · Building · Preview-ready · Registry-ready · Released · Experimental · Deprecated`. Ship via the [`release-checklist.md`](release-checklist.md).

## Template

```tsx
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useControllableState } from "@/lib/motion";

export interface WidgetProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (next: string) => void;
  className?: string;
}

export function Widget({ value, defaultValue, onValueChange, className }: WidgetProps) {
  const [current, setCurrent] = useControllableState({ value, defaultValue: defaultValue ?? "", onChange: onValueChange });
  return (
    <div className={cn("w-full", className)}>
      {/* ... */}
    </div>
  );
}

export default Widget;
```
