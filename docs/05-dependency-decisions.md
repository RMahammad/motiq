# 05 — Dependency decisions

> **Type:** 🟢 Canonical for the dependency table · **Implementation status:** 🔵 Planned (nothing installed) · **Last reviewed:** 2026-07-14
> **Owns:** the single dependency table. **Do not** reproduce this table elsewhere — link here.
> **Related:** [`06-animation-engine-decision.md`](06-animation-engine-decision.md) · [`04-package-map.md`](04-package-map.md) · [`dependency-review` skill](../.claude/skills/component-review/SKILL.md)
> **[FACT]** = verified against a cited source on the verification date; **[REC]** = classification judgment. Verify versions again before install (see [`dependency-review`](../.claude/skills/component-review/SKILL.md)).

## Dependency classification rule

Only `clsx`, `tailwind-merge`, and `class-variance-authority` ship as **runtime deps** of `@scope/react`. Everything else is a **peer**, **dev**, or quarantined into the Remotion line. Before adding any runtime dependency, answer the checklist in [`dependency-review`](../.claude/skills/component-review/SKILL.md) — most notably: *can this be maintained safely in <100 lines?*

## Dependency review — `motion` (installed 2026-07-14)

Run through [`dependency-review`](../.claude/skills/component-review/SKILL.md); result: **approve**.

- **Exact package & version:** `motion@12.42.2` (the renamed `framer-motion` lineage; import surface `motion/react`).
- **License:** **MIT** (verified in the installed `package.json`). Safe for a commercial product; no copyleft, no attribution burden.
- **Why needed:** the pivot's animated catalog needs layout/shared-element animation (`layout`, `AnimatePresence`), spring gestures, and `useReducedMotion` — things CSS cannot do coherently (tab indicator that morphs between tabs, list add/remove exit animation, dialog spring scale). It is the stated default engine ([`06`](06-animation-engine-decision.md), [ADR-0002](adrs/0002-animation-engine.md)).
- **Runtime classification:** **client-only** (`"use client"`). In shipped **registry items** it is a **peer/`dependencies`** entry the *consumer* installs (their copied source imports `motion/react`). In our **`apps/docs`** it is a direct **dependency** so live previews render. It is **not** added to the core `@scope/*` build packages — those stay CSS-only unless a specific component needs it.
- **Bundle:** full ≈34 kB min+gzip; `sideEffects:false` → tree-shakeable; the `m` component + `LazyMotion` path drops to ≈4.6 kB. Per-registry-item, only items that import it pull it in — CSS-only items (SpotlightCard, backgrounds where CSS suffices) declare **no** motion dependency.
- **SSR:** client-only; components carry `"use client"`. `useReducedMotion`/`whileInView` are safe under React 19 App Router (no hydration flash when `initial` is set or reduced-motion returns final state).
- **Next.js compatibility:** works with Next 16 App Router / React 19; `apps/docs` is server-rendered with client islands for the animated leaves. No `transpilePackages` needed for `motion` itself (published ESM).
- **Registry-item dependency behavior:** items that use it declare `"dependencies": ["motion"]` in `registry.json`; `shadcn add` installs `motion` into the consumer's project. Items that don't use it must not list it (verified by [`catalog-consistency-review`](../.claude/skills/catalog-integration/SKILL.md)).
- **Why not in every item:** CSS transitions/keyframes are lighter and sufficient for simple entrances, shimmers, and pointer glows; adding Motion there would be dead weight in the consumer's bundle. Motion is reserved for meaningful layout/gesture/presence animation.
- **Why Remotion stays excluded:** Remotion is a video renderer (node + heavy, separate license, [`08`](08-remotion-license-analysis.md)); it has no role in browser UI and remains forbidden in core UI packages by the [import firewall](03-architecture.md#forbidden-import-matrix). Motion ≠ Remotion.

## Canonical dependency table

| Dependency | Purpose | Classification | License | Version / policy | Bundle | SSR | Alternatives | Status | Verified |
|---|---|---|---|---|---|---|---|---|---|
| `motion` (`motion/react`) | Core animation engine | **peer** (registry items) / **dep** in `apps/docs` demos | MIT [FACT] | **12.42.2 installed** [FACT]; pin, track majors | ~34kb full → ~4.6kb via `m`+LazyMotion; `sideEffects:false` (tree-shakeable) [FACT] | client-only (`"use client"`) | framer-motion (renamed to this), react-spring (weaker layout) | ✅ **installed 2026-07-14** (apps/docs) | 2026-07-14 |
| `react` / `react-dom` | Framework | **peer** | MIT | `>=18.3 <20` | — | — | — | ✅ | 2026-07-14 |
| `@radix-ui/react-*` | Accessible primitives | **peer/dep per-component** | MIT [FACT] | latest per primitive | SSR-safe | ✅ | Base UI (newer), React Aria (heavier; add later) | ✅ chosen | 2026-07-14 |
| `clsx` | Conditional classNames | **dep** | MIT | 2.x | tiny | safe | hand-rolled | ✅ | 2026-07-14 |
| `tailwind-merge` | Resolve Tailwind class conflicts | **dep** | MIT | 3.x | small | safe | — (needed for override contract) | ✅ | 2026-07-14 |
| `class-variance-authority` | Type-safe variants | **dep** | Apache-2.0 | 0.7.x | small | safe | `tailwind-variants` | ✅ chosen | 2026-07-14 |
| `tailwindcss` | Styling (consumer) | **peer/optional** | MIT [FACT] | 4.3.x [FACT] | build-time | — | — | ✅ | 2026-07-14 |
| `tsdown` (Rolldown) | Library bundler | **devDep** | MIT [FACT] | 0.15.12 (rolldown 1.0.0-beta.45) 🟢 | — | — | **tsup** (fallback, not needed), unbuild, rollup | ✅ **chosen — spike-validated: preserves `"use client"`** ([ADR-0006](adrs/0006-library-bundler.md)) | 2026-07-14 |
| `zod` | Remotion prop schemas | **dep (remotion pkg only)** | MIT | 3.x/4.x | node+browser | ✅ | valibot | ✅ | 2026-07-14 |
| `remotion` / `@remotion/*` | Video | **separate pkg dep** | **company license** [FACT] | latest, versions synced [FACT] | render=node / player=client | — | none (video niche) | ⚠️ license-gated ([`08`](08-remotion-license-analysis.md)) | 2026-07-14 |
| `@storybook/*` (v9) | Dev/test/docs workbench | **devDep** | MIT [FACT] | 9.x | — | — | Ladle, Histoire | ✅ | 2026-07-14 |
| `vitest` + `@vitest/browser` | Unit/interaction/browser tests | **devDep** | MIT | current | — | — | jest | ✅ | 2026-07-14 |
| `@testing-library/react` | Interaction tests | **devDep** | MIT | current | — | — | — | ✅ | 2026-07-14 |
| `playwright` | E2E/fixture/visual | **devDep** | Apache-2.0 | current | — | — | cypress | ✅ | 2026-07-14 |
| `axe-core` / `@axe-core/playwright` | A11y assertions | **devDep** | MPL-2.0 | current | — | — | pa11y | ✅ (MPL fine as devDep) | 2026-07-14 |
| `@changesets/cli` | Versioning/changelog | **devDep** | MIT | current | — | — | semantic-release | ✅ | 2026-07-14 |
| `turbo` | Task orchestration/cache | **devDep** | MIT | current | — | — | Nx (heavier) | ✅ | 2026-07-14 |
| `pnpm` | Package manager | tool | MIT | 11.x (11.13.0 present 🟢) | — | — | npm, yarn | ✅ 🟢 available | 2026-07-14 |
| `size-limit` + preset | Bundle budgets in CI | **devDep** | MIT | current | — | — | bundlewatch | ✅ | 2026-07-14 |
| `lucide-react` | Icons | **peer/optional** | ISC | current | tree-shakeable | ✅ | heroicons, tabler | ✅ (don't ship own icon pkg) | 2026-07-14 |
| `eslint` + `@typescript-eslint` + boundary plugin | Lint/import boundaries | **devDep** | MIT | current | — | — | biome | ✅ | 2026-07-14 |
| `prettier` | Formatting | **devDep** | MIT | current | — | — | biome, dprint | ✅ | 2026-07-14 |
| `publint` + `@arethetypeswrong/cli` | Export/type validation | **devDep** | MIT | current | — | — | — | ✅ | 2026-07-14 |
| `knip` | Unused-code detection | **devDep** | ISC | current | — | — | ts-prune | 🔵 optional | 2026-07-14 |

## Licensing flags

- **Remotion** — company license required at 4+ people; **template resale / Player embedding / hosted rendering are legally ambiguous.** Full analysis + open questions: [`08-remotion-license-analysis.md`](08-remotion-license-analysis.md). Do not add Remotion to any core package.
- **GSAP** — now free including all plugins (Webflow acquisition), but carries a clause prohibiting building a **competing no-code visual animation builder**. A component library is fine; document that we are *not* building an animation builder. Kept optional ([`06`](06-animation-engine-decision.md)).
- **axe-core (MPL-2.0)** — acceptable as a **dev dependency only**; never bundled into shipped packages.

## Sources

Verified 2026-07-14 (US web search + official docs):

- Remotion license/pricing: <https://www.remotion.dev/docs/license>, <https://www.remotion.pro/license>, <https://www.remotion.dev/blog/company-licenses>
- Motion (MIT, bundle sizes): <https://motion.dev/>, <https://motion.dev/docs/react-reduce-bundle-size>, <https://github.com/motiondivision/motion>, <https://www.npmjs.com/package/motion>
- GSAP free/license: <https://webflow.com/blog/gsap-becomes-free>, <https://gsap.com/pricing/>, <https://gsap.com/community/standard-license/>
- Next.js versions/App Router: <https://nextjs.org/blog>, <https://endoflife.date/nextjs>
- Tailwind v4: <https://tailwindcss.com/blog/tailwindcss-v4>, <https://github.com/tailwindlabs/tailwindcss/releases>
- Storybook 9: <https://storybook.js.org/announce/sb9>, <https://storybook.js.org/docs/writing-tests/integrations/vitest-addon>, <https://storybook.js.org/docs/writing-tests/accessibility-testing>
- tsdown: <https://tsdown.dev/guide/>, <https://tsdown.dev/guide/migrate-from-tsup>

> **Maintenance:** any version or license claim in this repo must carry a source + verification date. Stale-date detection is a planned check ([`tooling/check-stale-dates.mjs`](tooling/)).
