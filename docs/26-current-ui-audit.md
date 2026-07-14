# 26 — Current UI audit (pre‑pivot)

> **Type:** 🟢 Canonical audit of the pre‑pivot homepage + docs catalog · **Status:** **Superseded by the 2026‑07‑14 pivot** — findings stand; the fixes now target a catalog‑first product, not an abstract motion system · **Method:** live render of `apps/docs` (App Router) at `localhost` + source review.
> **Related:** [`27-product-differentiation.md`](27-product-differentiation.md) (re‑sequenced positioning) · [`30-showcase-visual-system.md`](30-showcase-visual-system.md) (Direction A / Violet Studio) · [`31-competitive-product-review.md`](31-competitive-product-review.md) · [`28-visual-direction.md`](28-visual-direction.md)
> Audited **before** any redesign, per the task's Stage‑1 gate. Findings are candid; this is our own site.

## What changed since this audit was first written

The product pivoted from an abstract **"semantic motion system"** landing page to a **catalog of beautiful, production‑ready animated React + shadcn components** that developers preview, customize, and install as editable source via a shadcn registry ([`31`](31-competitive-product-review.md), [`27`](27-product-differentiation.md)). The visual incoherence documented below is resolved by **Direction A / Violet Studio** ([`30`](30-showcase-visual-system.md)). The audit is preserved as the honest record of *why* those decisions were made; the "what the redesign does instead" section at the end is updated to the catalog‑first target.

## Files responsible for the audited experience

| Surface | File |
|---|---|
| Homepage | [`apps/docs/app/page.tsx`](../apps/docs/app/page.tsx) |
| Layout / nav | [`apps/docs/app/layout.tsx`](../apps/docs/app/layout.tsx) |
| Docs chrome CSS | `apps/docs/app/docs.css` (removed in the pivot; replaced by `apps/docs/app/globals.css` + `@scope/tokens`) |
| Component‑preview tokens | [`packages/tokens/styles.css`](../packages/tokens/styles.css) |
| Component pages | [`apps/docs/app/components/{pricing-card,dialog,spotlight-card}/page.tsx`](../apps/docs/app/components/) |
| Preview wrapper (pre‑redesign) | `apps/docs/app/_components/preview.tsx` — static demo + code; **replaced** by the live `ComponentStage` in the redesign |
| Reused library sections | `HeroSection`, `FeatureGrid`, `CTASection` ([`@scope/sections`](../packages/sections/src/)), `BentoGrid` ([`@scope/react`](../packages/react/src/bento-grid.tsx)) |

## Verdict (one line)

**The site looked like a competent Tailwind/shadcn starter, not a product you would preview, customize, and install.** It *described* a motion system in text but showed almost no motion above the fold, ran **two clashing palettes** across the chrome and the component previews, used centered columns + an equal‑card grid, and had **no real catalog and no search**. It failed the pivot's core promise before the pivot even existed: *show the components, let people install them.*

## Color: the two‑palette incoherence (verified against source)

The old site ran **two independent, clashing accent systems** — this was the single most damaging identity problem, and every hex below was confirmed in the source, not inferred from a screenshot.

| Where | File | Colors actually in the code |
|---|---|---|
| Docs chrome (dark) | `apps/docs/app/docs.css` (removed in the pivot; replaced by `apps/docs/app/globals.css` + `@scope/tokens`) | **lime `#c8ff2f`** as the dominant accent |
| Docs chrome (light) | `apps/docs/app/docs.css` (removed in the pivot; replaced by `apps/docs/app/globals.css` + `@scope/tokens`) | flips to **beige `#faf9f6`** surface + **olive `#3a7d00`** accent |
| Component previews | [`packages/tokens/styles.css`](../packages/tokens/styles.css) | a **separate indigo `#4f46e5`** (light) / `#818cf8` (dark) |

The chrome and the previews therefore never agreed on a brand color: a lime/olive shell wrapped indigo demos. Two palettes reading as two products.

### Which suspected colors were real (fact‑check)

| Suspected color | Verdict |
|---|---|
| Beige `≈ #faf9f6` (light surface) | **Real** — the light‑mode docs‑chrome background in `docs.css`. |
| Olive `≈ #3a7d00` (light accent) | **Real** — the light‑mode docs‑chrome accent in `docs.css`. |
| Purple / indigo `≈ #4f46e5` | **Real** — but from a *different* file: the component‑preview accent in `packages/tokens/styles.css`, not the chrome. |
| Lime `#c8ff2f` | **Real — and the actual dominant accent** of the dark chrome. This, not the indigo, was the color the site led with. |
| Red "issue indicators" | **Not in the app code.** The red markers were **Next.js's dev overlay** (build/error indicator), not application styling or real errors. Nothing in `docs.css`, `styles.css`, or the pages sets a red brand color. |

## Visual identity

| Question | Finding |
|---|---|
| Recognizable without logo/name? | **No.** A lime/olive chrome wrapping indigo previews reads as two unrelated defaults, not one brand. |
| Typography deliberate? | **Partly, and too small.** Reasonable `clamp()` hero scale, but the display face is the system stack, body/metadata type is tiny, and there is no editorial contrast between display and body. |
| Color distinctive? | **No — and incoherent.** Two accent systems (lime/olive chrome vs. indigo previews) with no shared semantic roles. |
| Radius/border/surface/shadow coherent? | **Coherent but generic** within each palette; the two palettes don't share a language. |
| Motion visible above the fold? | **Barely.** The hero uses `HeroSection` whose entrance is a one‑shot mount `Stagger` (a subtle fade‑up that runs once and stops). |
| A catalog you can browse? | **No.** No catalog route, no search, no filterable grid — the thing a component‑catalog product exists to provide. |
| Mistakable for a generic starter? | **Yes** — the headline problem. |
| Supports a premium commercial product? | **No.** Nothing on screen justifies payment. |

## Typography, width, and labels

- **Tiny type.** Body and especially metadata sit well below the redesign's floor (`metadata ≥ 12–13`, body `15–18` — [`30`](30-showcase-visual-system.md)). The small type made the site feel like reference docs, not a premium showroom.
- **Terminal‑style micro‑labels.** All‑caps monospace micro‑labels used as a default decorative device — a "dev‑terminal" affectation that fights the premium register and is explicitly retired by Direction A ("no all‑caps micro‑labels as the default").
- **Narrow centered column throughout** (`.docs-main { max-width: 960px; margin: 0 auto }`). Every section is the same narrow centered block: no asymmetry, no editorial hierarchy, and on a 1440px+ viewport the content is a 960px ribbon with large empty gutters passed off as "luxury whitespace" (here it is just empty).

## Structure, catalog, and search

- **Single‑page anchor structure.** The site is essentially one long page with anchor navigation — no dedicated catalog route, no per‑category browsing.
- **No real catalog.** `BentoGrid` presents components as **text‑only link cards** ("PricingCard / AnimatedDialog / SpotlightCard" + a one‑line description + "View →"). Components are represented as text, not demonstrations you can play.
- **No search.** There is no way to find a component by name, category, or behavior — table stakes for a catalog product ([`31`](31-competitive-product-review.md) §Adopt).
- **`FeatureGrid` = 3 equal cards** ("Accessible / RSC‑safe / Tiny") — the canonical "three equal feature cards" anti‑pattern, with claims presented as **unproven text badges**.

## Copy: abstract motion‑theory hero

The homepage led with **motion‑theory abstractions**, not components a buyer recognizes:

- *"Author motion by intent"*
- *"Sell outcomes, not parts"*

This is exactly the "leading with abstract motion‑theory copy" pattern the competitive review says to **reject** ([`31`](31-competitive-product-review.md) §6). It asks the visitor to buy into a philosophy before they have seen a single component work.

## Claims and metrics

- **Unverified hero stats.** The hero surfaced counts like **"22 components / 123 tests."** Even where roughly accurate, these were **hardcoded strings**, not values generated from the registry or the test run — so they drift silently and read as marketing rather than proof. Any such number the redesign keeps must be **generated from real data** (registry item count, CI test count), never typed by hand.
- **Asserted, not shown.** "Accessible", "Tiny", "RSC‑safe" appeared as badges with no visible evidence — the production‑readiness the product actually has was invisible.

## Pricing (honest, but only proposed)

There was **no fake pricing and no dark pattern** — the only pricing treatment said, in effect, **"coming soon."** That is honest and worth preserving. But it is a *proposed* placeholder, not a decided offer: pricing is **not finalized** (`product.config.json → pricingFinalized: false`), so the redesign must keep pricing clearly marked as proposed and must **not invent numbers**.

## Interaction quality

- **Hover:** only `.scope-btn:hover` and `SpotlightCard` (which the homepage never surfaces).
- **Focus‑visible:** relies on UA defaults; no branded focus‑ring token applied site‑wide.
- **Replay / preset / intensity / reduced‑motion / theme / viewport toggles:** **none** on any preview — you cannot re‑run the animation or see its reduced‑motion form.
- **Code beside preview:** the code is a **static string** that never reflects the live component's state.
- **Dark mode:** tokens support it; the site shipped light‑only for the chrome.

## What to preserve (do not regress)

- **No fabricated trust signals** — no fake testimonials, logos, or metrics. Keep it.
- **Accessible, reduced‑motion‑safe primitives** underneath — the components are good; the *presentation* and *distribution* are the problem.
- **Server‑safe architecture** — the homepage is a Server Component composing client leaves; keep it mostly server‑rendered with small interactive client islands.
- **Semantic tokens** in `@scope/tokens` — extend, don't bypass. The fix is *one* token system, not a third palette.
- **Core UI never imports Remotion** — unaffected by this work.
- **Honest "coming soon" pricing** — keep the honesty; just label it clearly as proposed.

## What the redesign does instead (problem → fix)

Each audited problem now maps to the **catalog‑first product** on **Direction A / Violet Studio** ([`30`](30-showcase-visual-system.md), [`27`](27-product-differentiation.md), [`31`](31-competitive-product-review.md)):

| Problem (audited) | Fix |
|---|---|
| Two clashing palettes (lime/olive chrome `#c8ff2f`/`#3a7d00`/`#faf9f6` vs. indigo previews `#4f46e5`) | **One coherent identity** — Violet Studio, accent `#695CFF` (light) / `#8176FF` (dark), driven from `@scope/tokens`; the chrome no longer competes with demos. |
| Text‑only "catalog" of link cards | A **real catalog route** of large **live, replayable previews** in a `minmax(320px, 1fr)` grid — previews stay big, never 4–5 tiny cards per row. |
| No search / single‑page anchor structure | A **browsable, searchable catalog** with per‑component pages and category taxonomy (primitives / components / text / backgrounds / blocks). |
| Abstract motion‑theory hero ("Author motion by intent", "Sell outcomes, not parts") | Lead with **signature components working above the fold**, plus install/copy directly under each — recognizable value first, philosophy later. |
| Hardcoded "22 components / 123 tests" | Any surfaced count is **generated from the registry / CI**, or dropped. |
| Claims as badges ("Accessible / Tiny / RSC‑safe") | **Production‑readiness shown, not claimed** — a11y, reduced‑motion, SSR, and bundle facts rendered live per component ([`27`](27-product-differentiation.md)). |
| Tiny type + terminal micro‑labels | Direction A's larger type scale; no all‑caps micro‑labels as a default. |
| Narrow centered ribbon / wasted wide screens | Wider content field (~1200–1440) with an editorial grid that uses the viewport. |
| Static code, no replay/toggles on previews | Live previews with **replay, theme, and reduced‑motion** controls and **copy/install** actions under each. |
| "Coming soon" pricing (honest but undecided) | Keep it honest and **clearly proposed** — no invented numbers while `pricingFinalized: false`. |
| Red "errors" (were the **Next.js dev overlay**, not app code) | Nothing to fix in app styling; noted here so the dev‑overlay markers are not mistaken for a brand color or a real defect. |
