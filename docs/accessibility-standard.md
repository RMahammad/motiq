# Accessibility standard

> **Type:** Canonical front-door · Full contract: [`12-accessibility-standard.md`](12-accessibility-standard.md).

WCAG 2.2 AA and reduced motion are **release-blocking**. The detailed contract, per-pattern requirements, and axe setup are in [`12-accessibility-standard.md`](12-accessibility-standard.md). The enforceable baseline every component meets:

- **Semantics first** — native elements; ARIA only to fill a real gap. No nested interactive elements, no duplicate IDs, valid HTML.
- **Keyboard** — every action operable by keyboard; logical focus order; visible focus (`:focus-visible`); focus trapped in modals and restored on close; Escape closes overlays.
- **Names** — every control has an accessible name; icon-only controls have a label.
- **Overlays** — dialog/sheet/popover/menu carry correct roles and semantics.
- **Structure** — tables, lists, trees, and progress use correct semantics.
- **Live regions** — status announced via `aria-live` with discipline; never move DOM focus to a non-interactive heading.
- **Not color alone** — status also conveyed by text/icon/shape.
- **Errors** — associated with their control (`aria-describedby`); disabled reasons explained.
- **Targets** — ≥24px (44px preferred for primary).
- **Reduced motion, 200% zoom, forced-colors** — all supported.

Run the [`accessibility-review`](../.claude/skills/accessibility-review/SKILL.md) skill before completion. axe tests run inside `pnpm test`.
