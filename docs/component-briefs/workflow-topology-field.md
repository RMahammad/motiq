# Brief — Workflow Topology Field

- **Problem:** orchestration/automation/pipeline products need an atmospheric background that *is* the app's workflow graph — showing which path is active, which completed, which failed — not a decorative node cloud.
- **Use case:** AI orchestration, automation builders, deployment tools, processing pipelines, workflow canvases (hero/feature backdrops).
- **Common saturated alternatives:** "beams between random points", generic force-directed node graphs, glowing-line connectors, particle constellations. All are decorative; none carry workflow state.
- **How this differs (originality):** the topology is **application-defined** (`nodes`, `connections`, grouping) and driven by real state — `activeNodeIds`/`activeConnectionIds` light the live path, completed paths *settle quietly*, failed nodes are marked with a **non-color glyph + ring** (understandable without color). Density **adapts around a `safeArea`**; nodes outside the focal band stay restrained. Static render still looks composed. Not a generic graph: edges animate as directional flow along the *active* path only.
- **Reject test:** if stripped of `activeNodeIds`/status it must still communicate structure; its primary value is state legibility, not sparkle → keep.
- **Engine:** SVG (deterministic seeded node/edge geometry; CSS/WAAPI dashoffset + opacity for flow; no canvas/WebGL; no `Math.random`/`Date.now` at render → SSR-stable).
- **Main states:** idle · active-path · completed-settle · failed-node · light · dark · reduced-motion static · forced-colors · offscreen-paused · resized.
- **API sketch:** `nodes?`, `connections?`, `activeNodeIds?`, `activeConnectionIds?`, `safeArea?` ({x,y,w,h} 0–1), `density?`, `depth?`, `intensity?`, `speed?`, `interactive?` (pointer reveals local neighbors), `pauseWhenHidden?`, `reducedMotion?`, `className`, `children?`. Ships deterministic fictional default topology.
- **Accessibility:** decorative → `aria-hidden`; failed state = glyph + ring, never color alone; foreground content readable over safe area; forced-colors fallback to CanvasText edges.
- **Performance:** CSS/WAAPI only, no per-frame React state; pause offscreen + tab-hidden; mobile drops far depth layer + thins density.
- **Dependencies:** `@motiq/utils` + `@motiq/primitives`. No new deps.
- **Similarity concern:** low–moderate (must not resemble any specific library's node-graph/beams effect; differentiator is workflow state + safe-area adaptation).
- **Tier:** Free.
- **Release criteria:** SSR-stable, reduced-motion static, non-color failure signal, no loop when paused, light+dark, foreground-readable, responsive, clean-room.
