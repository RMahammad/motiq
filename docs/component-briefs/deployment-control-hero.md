# Brief — Deployment Control Hero

- **Problem:** developer-tool/infra products need a hero that shows a real deployment control surface (selected env + active deploy + stages + logs + one result) — editable, readable on laptop and mobile, not a crammed dashboard.
- **Use case:** CI/CD, PaaS, infra platforms, release tooling (landing/product hero).
- **Common saturated alternatives:** static dashboard screenshots, fake terminal GIFs, generic "code editor" hero images. No controllable stages or composed components.
- **How this differs (originality):** a `registry:block` composing released components at reduced complexity: **Environment Switcher** (selected env), **Deployment Pipeline** (four clear stages), **Live Log Stream** (one short log region), **API Request Inspector** (one request/release result), optionally **Deployment Command Center** patterns. Editable hero: outcome headline + copy + primary/secondary CTA beside the control surface. App owns state; deterministic fictional data.
- **Reject test:** demonstrates a real deployment workflow with real components → keep.
- **Engine:** composition + layout + phase machine + reduced-motion. No new engine.
- **Required states:** ready · deploying · validating · failed · retrying · completed (app-supplied; demo cycles for preview).
- **API sketch:** `headline?`, `copy?`, `primaryCta?`, `secondaryCta?`, `phase?`, `onPhaseChange?`, `dataset?`, `environments?`, `background?` (optional Runtime Signal Map), `reducedMotion?`, `className`.
- **Accessibility:** heading semantics; env switcher keyboard-operable; stage status text + glyph, never color alone; log region has accessible name; reduced-motion; no focus theft.
- **Performance:** static initial; log stream pauses offscreen; fixed-epoch timestamps; SSR-safe.
- **Dependencies:** motion + `@motionstack/utils` + `@motionstack/primitives`; registryDependencies: environment-switcher, deployment-pipeline, live-log-stream, api-request-inspector. No new deps.
- **Similarity concern:** low (own-component composition; original layout).
- **Tier:** Pro. **Kind:** block.
- **Release criteria:** all six states, four stages readable, editable block, laptop + mobile layouts, reduced-motion, no hydration errors, clean-room.
