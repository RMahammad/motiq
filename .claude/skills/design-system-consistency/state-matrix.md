# Component state matrix

Every interactive visual component must define and review these states. Mark N/A with a reason.

| State | Visual token(s) | Motion | A11y note |
|---|---|---|---|
| Default | base color/space/radius | entrance only | — |
| Hover | hover surface/border | `--motion-duration-fast` | not the only affordance |
| Focus-visible | focus ring token | none/instant | ⛔ must be visible |
| Active/pressed | pressed surface | `--motion-duration-instant` | — |
| Disabled | muted tokens | none | `aria-disabled`; not focusable-trap |
| Loading | skeleton/spinner tokens | subtle, reduced-motion-safe | `aria-busy`/live region |
| Error | error color token | shake only if reduced-motion-safe | ⛔ not color-only; text/icon too |
| Selected/expanded | selected surface | `--motion-duration-normal` | `aria-selected`/`aria-expanded` |

Cross-cut every state against: **light / dark / forced-colors / reduced-motion** and **mobile / desktop**. See [`docs/12-accessibility-standard.md`](../../../docs/12-accessibility-standard.md) and [`docs/13-performance-standard.md`](../../../docs/13-performance-standard.md).
