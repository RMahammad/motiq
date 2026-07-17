# Brief — Collaborative Launch Hero

- **Problem:** collaboration/review products need a hero that shows **people active + a review in progress + one pending decision** — an editable block, not another generic social feed.
- **Use case:** review tools, docs collaboration, design review, approvals, team workspaces (landing/product hero).
- **Common saturated alternatives:** static "team" screenshots, generic activity-feed mockups, avatar-row + gradient hero images. No pending-decision workflow, no composed components.
- **How this differs (originality):** a `registry:block` composing released components at reduced complexity: **Live Presence Stack** (people active), **Activity Stream** (review underway), **Approval Workflow** (one pending decision), **Comment Thread** (one comment/change request), **Typing and Presence** (typing indicator). Editable hero: outcome headline + copy + CTAs beside the collaboration surface. Communicates an approaching product outcome (approval). App owns state; deterministic fictional data.
- **Reject test:** demonstrates a real review/approval workflow with real components → keep; not a social feed.
- **Engine:** composition + layout + phase machine + reduced-motion. No new engine.
- **Required states:** review-open · commenting · changes-requested · approval-pending · approved · rejected · resolved (app-supplied; demo cycles for preview).
- **API sketch:** `headline?`, `copy?`, `primaryCta?`, `secondaryCta?`, `phase?`, `onPhaseChange?`, `dataset?`, `reducedMotion?`, `className`.
- **Accessibility:** heading semantics; approval controls keyboard-operable; status via text + glyph, never color alone; presence/typing announced politely; reduced-motion; no focus theft.
- **Performance:** static initial; streams/typing pause offscreen; fixed-epoch timestamps; SSR-safe.
- **Dependencies:** motion + `@motionstack/utils` + `@motionstack/primitives`; registryDependencies: live-presence-stack, activity-stream, approval-workflow, comment-thread, typing-and-presence. No new deps.
- **Similarity concern:** low (own-component composition; not a feed clone).
- **Tier:** Pro. **Kind:** block.
- **Release criteria:** all seven states, pending decision clear, editable block, mobile layout, reduced-motion, keyboard approval, no hydration errors, clean-room.
