# Performance checklist

> Canonical standard + budgets: [`13-performance-standard.md`](../13-performance-standard.md). Skill: [`performance-review`](../../.claude/skills/performance-review/SKILL.md). ⛔ = release-blocking.

- [ ] ⛔ Single-component import within size budget (`size-limit`)
- [ ] Tree-shaking verified (importing one component doesn't pull siblings)
- [ ] No unnecessary `"use client"` on static content
- [ ] Animation properties: transform/opacity only (or justified)
- [ ] No layout thrashing (no read-after-write layout in loops)
- [ ] All observers/timers/rAF/listeners cleaned up
- [ ] Scroll handlers rAF-throttled or `useScroll`-based
- [ ] Blur/filter/compositing reviewed and bounded
- [ ] ⛔ Mobile fallback defined and tested (High-perf-risk components)
- [ ] ⛔ Reduced-motion fallback present
- [ ] Heavy effects lazy-loaded (dynamic import)
- [ ] Frame-rate / profiling checked where appropriate
- [ ] No duplicated React; peer dep resolves
- [ ] Compared against documented budgets
