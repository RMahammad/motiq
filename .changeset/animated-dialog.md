---
"@scope/react": minor
---

Add `AnimatedDialog` — the first accessible overlay, built on **Radix Dialog** with a **CSS-keyframe**
enter/exit (no animation-engine dependency; Radix waits for the exit animation). Focus trap + restore,
Escape-to-close, `role="dialog"` labelled by its title, optional description, controlled/uncontrolled
open state, and an accessible close button. Reduced motion disables the animation. Ships structural CSS
in `@scope/react/styles.css`. Verified by focus/keyboard/SSR/axe tests. Adds `@radix-ui/react-dialog`
as a dependency (kept external in the build).
