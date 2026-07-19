# ADR-0008: Documentation platform — Storybook 9 + Next.js docs site

- Status: **Accepted** (both surfaces validated by spike 2026-07-14)
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
**Both surfaces validated — spike passed 2026-07-14.**
- `apps/storybook` (Storybook 9, `@storybook/react-vite`) **builds a static site** from co-located CSF3 stories (Reveal, GradientText, PricingCard, SpotlightCard, BentoGrid, HeroSection).
- `apps/docs` (**Next.js 16 App Router**) **builds** and prerenders a landing page that **dogfoods the library** (`HeroSection` + `BentoGrid`, server-safe) plus live component pages (PricingCard, AnimatedDialog, SpotlightCard rendered from Server Components — the RSC boundary again proven).
- Both are wired into CI (`build-storybook`, `docs-site build`) and consume the library CSS + built packages.

The engineering `docs/` folder remains the standards source of truth; the site presents and links.
**Follow-on (not blocking this ADR):** the Storybook **Vitest-addon** interaction/a11y/visual tests in CI (needs a Playwright browser — see [ADR-0009](0009-testing-stack.md)), and fleshing out the full docs IA ([`../15`](../15-documentation-strategy.md)).

## Revisit conditions
- Storybook testing direction changes materially.

## Sources
- storybook.js.org/announce/sb9, vitest-addon, accessibility-testing — verified 2026-07-14 ([`../05`](../05-dependency-decisions.md#sources)).
