# Brief — Live Data Command Hero

- **Problem:** operational-data products need a hero centered on **continuity and changing state** — metrics that morph, refresh/stale/error transitions, a small live subset — as an editable block, not a generic analytics dashboard.
- **Use case:** ops dashboards, data platforms, monitoring, BI product landing/product hero.
- **Common saturated alternatives:** static KPI-card screenshots, fake chart images, dense dashboard mockups. No live continuity, no state transitions, no composed components.
- **How this differs (originality):** a `registry:block` composing released components at reduced complexity: **KPI Number Morph** (three metrics), **Data Refresh State** (current refresh state), **Streaming Data Rows** (small live subset), **Filter Result Transition** / **Data Quality Status** (one active filter or quality state). Editable hero: outcome headline + copy + CTAs beside the live surface. The point is *state changing over time*, driven by the app. Deterministic fictional data.
- **Reject test:** demonstrates live operational-data continuity with real components → keep.
- **Engine:** composition + layout + phase machine + reduced-motion. No new engine.
- **Required states:** initial · live · filtering · refreshing · partial-update · stale · error · recovery (app-supplied; demo cycles for preview).
- **API sketch:** `headline?`, `copy?`, `primaryCta?`, `secondaryCta?`, `phase?`, `onPhaseChange?`, `dataset?`, `background?` (optional Data Contour Surface), `reducedMotion?`, `className`.
- **Accessibility:** heading semantics; metric changes announced politely (live region), not per-frame; stale/error via text + glyph, never color alone; reduced-motion snaps values; no focus theft.
- **Performance:** static initial; streaming pauses offscreen; fixed-epoch timestamps; number morph respects reduced motion; SSR-safe.
- **Dependencies:** motion + `@motiq/utils` + `@motiq/primitives`; registryDependencies: kpi-number-morph, data-refresh-state, streaming-data-rows, filter-result-transition, data-quality-status. No new deps.
- **Similarity concern:** low (own-component composition; not a dashboard template).
- **Tier:** Pro. **Kind:** block.
- **Release criteria:** all eight states, three metrics + live subset, editable block, mobile layout, reduced-motion, no hydration errors, clean-room.
