# Brief — Event Propagation Matrix

- **Problem:** event-driven/webhook/audit products want a **temporal** backdrop where events propagate through a **structured matrix** (origin → neighbors → regions), settling into a quiet history — not decorative expanding rings.
- **Use case:** webhook products, event-driven systems, collaboration events, data pipelines, messaging platforms, audit systems.
- **Common saturated alternatives:** expanding-circle "ripples", radar sweeps, concentric pulse rings, random blips. No structure; no severity; no history.
- **How this differs (originality):** the field is a **structured cell matrix** (rows = regions/streams, cols = time or lanes). App supplies `events` with `origin` cell, `category`, `severity`, `direction`, `affectedRegions`, `acknowledged`, `failed`. New events create **restrained, cell-to-cell propagation** along the matrix (not free-space circles); **multiple events overlap without chaos** (bounded active count, per-cell max intensity); **failed** propagation is marked with a non-color glyph and halts; **acknowledged** events dim; old events **settle into a quiet history layer** (low-opacity trail row). Content safe area stays readable. Reduced-motion shows **current event relationships statically** (lit cells + links, no movement).
- **Reject test:** propagation follows matrix structure + severity/ack/failed state → structural, not decoration; keep.
- **Engine:** SVG + CSS/WAAPI (matrix of cells; propagation via staggered cell opacity/scale keyframes driven by CSS vars). Deterministic seed. No canvas/WebGL. SSR-stable.
- **Main states:** idle · single-event · overlapping-events · failed · acknowledged · history-settle · light · dark · reduced-motion static · forced-colors · offscreen-paused · resized.
- **API sketch:** `events?`, `rows?`/`cols?` (matrix shape), `safeArea?`, `density?`, `intensity?`, `speed?`, `interactive?`, `pauseWhenHidden?`, `reducedMotion?`, `className`, `children?`.
- **Accessibility:** decorative → `aria-hidden`; failed/ack via glyph + weight, not color; safe area quiet; reduced-motion static relationship view; forced-colors fallback.
- **Performance:** CSS/WAAPI cell animations, no per-frame React state; active-event cap; pause offscreen/tab-hidden; mobile smaller matrix.
- **Dependencies:** `@motiq/utils` + `@motiq/primitives`. No new deps.
- **Similarity concern:** low–moderate (structured matrix propagation is the differentiator vs generic ripples).
- **Tier:** Pro.
- **Release criteria:** structured (non-circle) propagation, overlap without chaos, non-color failed, history layer, reduced-motion static relationships, offscreen pause, light+dark, clean-room.
