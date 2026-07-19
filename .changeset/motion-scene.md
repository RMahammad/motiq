---
"@scope/motion": minor
---

Add **`MotionScene` + `MotionStep`** — the semantic **choreography** primitive (the product moat,
[docs/27], [ADR-0015]). A scene coordinates its steps (heading → copy → preview → action) as one
sequence, typed by `role` and `intent` (13 typed intents) with `intensity` None/Reduced/Standard/
Expressive — instead of every child inventing timing. CSS‑driven; SSR‑safe (renders final/hidden
state, animates after hydrate); reduced‑motion aware; observer cleaned up; `onSequenceComplete`
callback; replay via React `key`. Exports `MotionIntent`, `ScenePreset`, `MotionIntensity`,
`StepRole` types and the `@scope/motion/motion-scene` subpath. Covered by unit + fake‑timer + SSR +
axe tests.
