---
"@scope/react": minor
---

Complete the MVP overlay set on Radix + CSS: **`Tooltip`** (Radix Tooltip, `role="tooltip"`,
focus + hover, Escape), **`Popover`** (Radix Popover, focus move/restore, Escape, outside-click,
optional close), and **`Sheet`**/Drawer (Radix Dialog with a per-`side` CSS slide; full modal a11y).
Each ships structural CSS in `@scope/react/styles.css`, interaction + axe tests (SSR for the modal
ones), `size-limit` entries (all < 600 B brotli), and docs pages. Adds `@radix-ui/react-tooltip` and
`@radix-ui/react-popover` dependencies (kept external in the build).
