# Brief — Adaptive Safe-Zone Grid

- **Problem:** hero sections want a structural grid backdrop that **actively protects foreground content** — quieting behind text/CTAs and detailing toward the edges — instead of a uniform moving grid that fights the copy.
- **Use case:** product heroes, feature sections, docs headers, CTA bands (any layout with defined content zones).
- **Common saturated alternatives:** moving dot grids, animated line grids, gradient-mesh grids, perspective "floor" grids. All uniform; none are content-aware.
- **How this differs (originality):** accepts one or many rectangular `safeArea`s and a `focalPoint`; grid **density/opacity attenuates inside the safe zones** and **increases toward the edges** via a computed mask, so text stays readable and the frame stays lively. Optional `perspective`/`depth` for a subtle floor without becoming a cliché. Layout **adapts when content moves** (safe areas are props). Mobile uses a simplified composition. Highlighted cells mark focal structure. Deterministic; no hydration mismatch; no continuous React re-render.
- **Reject test:** the safe-zone attenuation is a real layout utility (readability), not decoration → keep. Substantially more useful than a generic moving grid.
- **Engine:** SVG + CSS (grid lines/cells + radial/rect mask gradients for attenuation; CSS-var-driven; WAAPI for restrained cell shimmer). No canvas/WebGL.
- **Main states:** single safe zone · multi safe zone · edge-detail · highlighted cells · perspective on/off · light · dark · reduced-motion static · forced-colors · offscreen-paused · mobile-simplified.
- **API sketch:** `safeArea?` (rect | rect[]), `focalPoint?`, `density?`, `intensity?`, `speed?`, `perspective?`, `depth?`, `highlightCells?`, `interactive?`, `pauseWhenHidden?`, `reducedMotion?`, `className`, `children?`.
- **Accessibility:** decorative → `aria-hidden`; guarantees quiet region behind children; forced-colors fallback; no motion under reduced-motion.
- **Performance:** CSS/SVG only; mask via gradients not JS; no per-frame state; pause offscreen; mobile simplified grid.
- **Dependencies:** `@motiq/utils` + `@motiq/primitives`. No new deps.
- **Similarity concern:** low (content-aware attenuation is the differentiator vs any generic grid).
- **Tier:** Free.
- **Release criteria:** measurable quieting behind safe zones, multi-zone support, no hydration mismatch, no continuous rerender, reduced-motion static, mobile-simplified, clean-room.
