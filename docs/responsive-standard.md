# Responsive standard

> **Type:** Canonical standard · Scope: every component, block, and section.

Components are fluid and consumer-sized. The library never hard-codes `max-width` — the consumer owns width. Mobile rules that were proven in the grid/preview work are folded in here; the perf budget is [`13-performance-standard.md`](13-performance-standard.md).

## Breakpoints to verify

320 · 375 · 390 · 430 · 768 · 1024 · 1280 · 1440 · 1920 px.

## Rules

- **No horizontal overflow** at any width. Wide content (tables, timelines, code, diagrams) scrolls inside its own `overflow-x:auto` container — the page body never scrolls sideways.
- **Fluid layout** — flexbox/grid with relative units; `max-width:100%` on media. No fixed pixel widths that can't shrink.
- **Text pressure** — long labels, URLs, file names, and large numbers wrap or truncate with an accessible full value; they never blow out the layout.
- **Do not scale a whole interface down** to fit — reflow instead.
- **Touch** — interactive targets ≥24px (44px preferred for primary actions); respect safe areas; account for the virtual keyboard on inputs.
- **Mobile fallbacks** — provide a mobile-appropriate view for dense desktop layouts (tables, multi-column boards) rather than a shrunken desktop.

## Verification

Use the docs app at each breakpoint plus 200% zoom. Continuous animation must still pause offscreen at every size. Prefer the [`responsive-review`](../.claude/skills/responsive-review/SKILL.md) skill for the rendered pass.
