# Brief — Runtime Signal Map

- **Problem:** developer-tool / observability / API-platform heroes need an infrastructure-flavored backdrop where signals move through a **service topology** with health and direction — without faking monitoring data.
- **Use case:** dev tools, observability, API platforms, cloud/service dashboards (hero/section backgrounds).
- **Common saturated alternatives:** star-fields, meteors, particle streams, "beams", generic dotted maps. None encode services/health/traffic; they are pure motion.
- **How this differs (originality):** application supplies `services`, `regions`, `connections`, per-edge `activity`/`direction`/`latencyBand`, per-service `health`. The visual shows **requests entering**, signals **moving between services** along real edges, **healthy vs degraded** paths (non-color: dashed + slower + glyph for degraded/error), **regional separation** (grouped clusters), and a quiet idle state. Remains legible behind a headline. No internally-invented telemetry — deterministic fictional defaults only.
- **Reject test:** without health/direction it would collapse to a particle map → those props are the point; keep.
- **Engine:** **Canvas 2D** (many concurrent signal packets along edges; cheaper than hundreds of animated SVG nodes). WebGL is *not* needed and is explicitly avoided. Deterministic seed; canvas draws post-mount so SSR markup is a static, deterministic fallback (no hydration mismatch).
- **Main states:** idle · request-in · healthy-flow · degraded-path · error · regional-cluster · light · dark · reduced-motion static · offscreen-paused · resized.
- **API sketch:** `services?`, `regions?`, `connections?`, `activity?`, `safeArea?`, `density?`, `intensity?`, `speed?`, `interactive?`, `pauseWhenHidden?`, `reducedMotion?`, `className`, `children?`. No raw shader uniforms exposed.
- **Accessibility:** decorative → `aria-hidden`; degraded/error carried by dash + glyph + label, not color; safe-area kept quiet; reduced-motion renders a static snapshot of current health/topology.
- **Performance:** single canvas + rAF, DPR-capped, packet count scales with `density` and container size; pause offscreen/tab-hidden; mobile reduces packet budget. No per-frame React state.
- **Dependencies:** `@motionstack/utils` + `@motionstack/primitives`. Canvas is native — **no global WebGL dep**, isolated to this item.
- **Similarity concern:** moderate (must avoid resembling known "world map beams" effects; differentiator is service-graph + health semantics).
- **Tier:** Pro.
- **Release criteria:** deterministic static fallback, reduced-motion snapshot, offscreen pause, DPR/resize correct, non-color health, light+dark, clean-room.
