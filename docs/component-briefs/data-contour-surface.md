# Brief — Data Contour Surface

- **Problem:** analytics/finance/ops products want a contour backdrop whose shape is **driven by supplied data** (focal pressure, thresholds, active/comparison regions) — not a random topographic texture.
- **Use case:** analytics, financial products, infrastructure, operational dashboards, data stories, product metrics.
- **Common saturated alternatives:** decorative topographic-line textures, Perlin-noise fields, generic heatmap shaders. Random; no data meaning; shader-first APIs.
- **How this differs (originality):** app data (`points` with position + `value` + sign, `thresholds`, `activeRegion`, `comparisonRegions`) defines a scalar field; contours render at threshold bands and **change when the data changes** (smoothly transitioned). Positive/negative pressure raise/lower the field; threshold regions get emphasized bands; active region brightens; comparison regions render as ghosted overlays. Safe area supports readable content. **Server render is deterministic**; light/dark intentionally designed. Public API is data-shaped — **no raw shader uniforms**.
- **Reject test:** contours literally encode the supplied field → analytical, not decorative; keep.
- **Engine:** **Canvas 2D** marching-squares over a coarse scalar grid (cheap, smooth, DPR-aware). No WebGL, no global heavy dep — isolated to this item. SSR fallback is a deterministic static contour image (no hydration mismatch). Transitions interpolate the field, not React state per frame.
- **Main states:** initial · data-updated (transition) · threshold-crossed · active-region · comparison-overlay · light · dark · reduced-motion static · offscreen-paused · resized.
- **API sketch:** `points?`, `thresholds?`, `activeRegion?`, `comparisonRegions?`, `safeArea?`, `density?` (grid resolution), `intensity?`, `speed?`, `interactive?`, `pauseWhenHidden?`, `reducedMotion?`, `className`, `children?`.
- **Accessibility:** decorative → `aria-hidden`; threshold/active carried by band weight + label option, not color alone; safe area readable; reduced-motion = static field.
- **Performance:** single canvas + rAF for drift + eased field transitions; grid resolution capped; DPR-capped; pause offscreen/tab-hidden; mobile coarser grid. No per-frame React state.
- **Dependencies:** `@motionstack/utils` + `@motionstack/primitives`. Canvas native — no global WebGL dep.
- **Similarity concern:** moderate (must not resemble known topo-shader effects; differentiator is data-driven field + threshold semantics).
- **Tier:** Pro.
- **Release criteria:** contours provably respond to data, deterministic SSR, smooth data transitions, reduced-motion static, light+dark, mobile-stable, no shader-uniform API, clean-room.
