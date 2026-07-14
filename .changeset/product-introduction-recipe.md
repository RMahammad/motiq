---
"@scope/recipes": minor
---

Add `@scope/recipes` — the workflow-recipe layer — and its first recipe, `ProductIntroduction`: a drop-in, choreographed product hero built on `MotionScene`. Content is supplied through slots (`eyebrow`, `title`, `subtitle`, `media`, `primaryAction`, `secondaryAction`); the recipe assigns each a semantic role/intent and plays them as one coordinated scene. Server-safe shell over a single client leaf, accessible (real `h1`/`h2` heading), SSR-safe and reduced-motion-aware (inherited from `MotionScene`), responsive (two-column with media, stacked on mobile). Ships `@scope/recipes/styles.css`.
