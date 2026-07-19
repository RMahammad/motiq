# Brief — Queue Pulse Lanes

- **Problem:** queue/throughput products (job queues, build pipelines, message delivery, importers, workers) need a backdrop that reflects **lane state and congestion**, not decorative racing streaks.
- **Use case:** job queues, file processing, message delivery, build pipelines, data imports, background workers.
- **Common saturated alternatives:** neon "laser" trails, racing lines, comet streaks, meteor showers. Speed-as-decoration with no capacity meaning.
- **How this differs (originality):** app supplies `lanes` with `queued`/`active`/`completed`/`delayed`/`blocked` counts, `throughput`, and `capacity`. Pulses move through **restrained** lanes; **congestion changes spacing/rhythm** (denser, slower pulses under load); completed work **fades into a background history band**; **blocked** lanes stop with a clear **non-color stop marker** (bar cap + glyph); delayed lanes drift slower with a dashed cadence. Safe foreground zones stay quiet. Reduced motion shows a **meaningful static snapshot** (lane fill + status marks). Deliberately *not* neon.
- **Reject test:** rhythm/spacing encode congestion and blocked/delayed carry status → not decoration; keep.
- **Engine:** SVG + CSS/WAAPI (lane rects + pulse elements animated via transform/offset; deterministic seed). No canvas/WebGL.
- **Main states:** idle · flowing · congested · blocked · delayed · completed-fade · light · dark · reduced-motion static · offscreen-paused · resized.
- **API sketch:** `lanes?`, `safeArea?`, `density?`, `intensity?`, `speed?`, `interactive?`, `pauseWhenHidden?`, `reducedMotion?`, `className`, `children?`.
- **Accessibility:** decorative → `aria-hidden`; blocked/delayed via glyph + cap, not color; safe-area quiet; static reduced-motion snapshot conveys state.
- **Performance:** CSS/WAAPI only, no per-frame React state; pulse count scales with throughput but capped; pause offscreen/tab-hidden; mobile fewer lanes.
- **Dependencies:** `@motiq/utils` + `@motiq/primitives`. No new deps.
- **Similarity concern:** low (differentiator is queue semantics + congestion rhythm; must avoid neon-trail aesthetic).
- **Tier:** Free.
- **Release criteria:** congestion visibly changes rhythm, non-color blocked signal, reduced-motion snapshot, offscreen pause, light+dark, responsive, clean-room.
