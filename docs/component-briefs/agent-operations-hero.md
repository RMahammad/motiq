# Brief — Agent Operations Hero

- **Problem:** AI/automation products need a hero that *shows a real agent workflow* (idle→running→tool→approval→done/fail) beside outcome copy and CTAs — an editable block, not a screenshot.
- **Use case:** AI agents, automation, orchestration, copilots, research tools (landing/product hero).
- **Common saturated alternatives:** static product screenshots, fake chat mockups, "AI is typing" theater, generic gradient hero + image. None demonstrate a controllable workflow or real component composition.
- **How this differs (originality):** a genuine `registry:block` composing released Motionkit workflow components at *reduced* complexity: **Agent Run Timeline** (one workflow preview), **Prompt Composer** (one compact input), **Tool Call Activity** (one active tool), **Source Citation Rail** (one result), optionally **AI Response Stream**. Two-column editable hero: headline + copy + primary/secondary CTA on one side, live workflow on the other. App owns all `phase` state; never simulates a model or shows chain-of-thought. Ships deterministic fictional data.
- **Reject test:** demonstrates a real product workflow with real components → keep; not decoration.
- **Engine:** composition (children components use motion/CSS); block adds layout + a small phase state machine + reduced-motion. No new engine.
- **Required states:** idle · running · tool-active · waiting-for-approval · completed · failed (app-supplied; demo state machine cycles for preview).
- **API sketch:** `headline?`, `copy?`, `primaryCta?`, `secondaryCta?`, `phase?`, `onPhaseChange?`, `dataset?` (deterministic default), `background?` (optional Workflow Topology Field), `reducedMotion?`, `className`.
- **Accessibility:** headline is the section heading (h1/h2); CTAs are real links/buttons; status text + glyph, never color alone; approval controls keyboard-reachable; reduced-motion inherited from children; no focus theft.
- **Performance:** static initial state; children pause offscreen; no `Date.now`/`Math.random` at render (fixed epoch constants). SSR-safe.
- **Dependencies:** motion + `@motionstack/utils` + `@motionstack/primitives`; registryDependencies: agent-run-timeline, prompt-composer, tool-call-activity, source-citation-rail (+ ai-response-stream). No new deps.
- **Similarity concern:** low (composition of own components; not a landing-page template clone).
- **Tier:** Pro. **Kind:** block.
- **Release criteria:** all six states render, editable block, no simulated model/CoT, mobile stacks, reduced-motion, keyboard approval, no hydration errors, clean-room.
