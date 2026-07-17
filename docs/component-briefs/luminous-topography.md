# Brief — Luminous Topography

- **Problem:** teams want a distinctive, foreground-safe background environment that isn't another aurora/mesh-gradient/noise/dotted-grid.
- **Use case:** product heroes, feature sections, dashboard empty states, docs headers, data-story backgrounds.
- **Original concept:** layered topographic **contour lines** that flow **around configurable focal region(s)**; density thins near a foreground **safe area** to keep text readable; depth layers drift at subtly different speeds; optional secondary pointer influence (never the sole effect). Strong when static.
- **Engine:** SVG (contour paths + gradients + CSS/WAAPI animation of dashoffset/opacity/transform). No canvas required for v1; no WebGL; no global heavy dep. Deterministic path generation (seeded, no `Math.random()` at render → no hydration mismatch).
- **Main states:** light · dark · reduced-motion static · forced-colors fallback (contours as CanvasText-tone lines) · resized · offscreen-paused.
- **API sketch:** `density?`, `depth?`, `drift?`, `intensity?`, `focalPoint?` ({x,y} 0–1), `safeArea?` ({x,y,w,h} 0–1 where density thins), `accent?`, `lineWidth?`, `pauseWhenHidden?`, `interactive?`, `reducedMotion?`, `className`, `children?` (foreground content). No raw noise/shader uniforms as the main API.
- **Accessibility:** decorative → `aria-hidden`; foreground content readable over the safe area; contrast preserved via density/intensity; forced-colors fallback.
- **Performance:** CSS/WAAPI/SVG only; no continuous React re-renders (animate via CSS vars / attributes, not state); pause offscreen (`useVisibilityPause`) + when tab hidden; mobile reduced density; deterministic initial render.
- **Mobile:** reduced density preset, no pointer dependency.
- **Dependencies:** `@motiq/utils` + `@motiq/primitives` (visibility/reduced-motion). motion optional. No new deps.
- **Similarity concern:** must not copy recognizable contour/threads/waves implementations; the focal-region + safe-area behavior is the differentiator. Low–moderate.
- **Tier:** Free.
- **Release criteria:** stable SSR render (no hydration mismatch), reduced-motion static output, forced-colors fallback, no runtime loop when paused/hidden, light+dark, foreground-readable, responsive.
