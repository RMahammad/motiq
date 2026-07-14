# ADR-0008: Documentation platform — Storybook 9 + Next.js docs site

- Status: **Accepted** (Storybook validated by spike 2026-07-14; docs site still Planned)
- Date: 2026-07-14
- Owners: Eng, Docs
- Related documents: [`../15-documentation-strategy.md`](../15-documentation-strategy.md) (canonical), [`../14-testing-strategy.md`](../14-testing-strategy.md)
- Supersedes: —
- Superseded by: —

## Context
We need isolated component development + interaction/a11y/visual testing **and** a sellable, marketable, versioned documentation site. Storybook 9 ships a Vitest addon and redesigned a11y panel (verified 2026-07-14).

## Decision
Use **Storybook 9** (`apps/storybook`) for isolated dev + interaction/a11y/visual tests, and a **Next.js docs site** (`apps/docs`) for the catalog, marketing, and versioned reference. The engineering `docs/` folder remains the standards source of truth; the docs site presents and links, it does not restate standards.

## Decision drivers
- SB9 unifies interaction/a11y/visual testing with the component workbench ([`../14`](../14-testing-strategy.md)).
- Next.js docs site matches our framework and marketing needs.

## Alternatives considered
- **Ladle/Histoire** instead of Storybook — lighter but weaker integrated testing story.
- **Docusaurus/Nextra** for docs — viable; Next.js keeps one framework and enables live component embeds.

## Consequences
### Positive
- One place to develop + test; one place to sell + document.
### Negative
- Two apps to maintain; must prevent standards drift between `docs/` and the site.

## Validation
**Storybook validated — spike passed 2026-07-14.** `apps/storybook` (Storybook 9, `@storybook/react-vite`) **builds a static site** from co-located CSF3 stories (Reveal, GradientText, PricingCard, SpotlightCard, BentoGrid, HeroSection), consuming the library CSS + built packages; wired into CI (`build-storybook`). **Still Planned before this ADR is fully closed:** (a) the Vitest-addon interaction/a11y/visual tests run in CI (needs a Playwright browser in CI — see [ADR-0009](0009-testing-stack.md)); (b) the `apps/docs` Next.js docs site rendering a real component page.

## Revisit conditions
- Storybook testing direction changes materially.

## Sources
- storybook.js.org/announce/sb9, vitest-addon, accessibility-testing — verified 2026-07-14 ([`../05`](../05-dependency-decisions.md#sources)).
