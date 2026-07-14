# 26 — Current UI audit (pre‑redesign)

> **Type:** 🟢 Canonical audit of the pre‑redesign homepage + docs catalog · **Date:** 2026-07-14 · **Method:** live render of `apps/docs` (App Router) at `localhost` + source review.
> **Related:** [`27-product-differentiation.md`](27-product-differentiation.md) · [`28-visual-direction.md`](28-visual-direction.md) · [`15-documentation-strategy.md`](15-documentation-strategy.md)
> Audited **before** any redesign, per the task's Stage‑1 gate. Findings are candid; this is our own site.

## Files responsible for the current experience

| Surface | File |
|---|---|
| Homepage | [`apps/docs/app/page.tsx`](../apps/docs/app/page.tsx) |
| Layout / nav | [`apps/docs/app/layout.tsx`](../apps/docs/app/layout.tsx) |
| Site CSS | [`apps/docs/app/docs.css`](../apps/docs/app/docs.css) |
| Component pages | [`apps/docs/app/components/{pricing-card,dialog,spotlight-card}/page.tsx`](../apps/docs/app/components/) |
| Preview wrapper | [`apps/docs/app/_components/preview.tsx`](../apps/docs/app/_components/preview.tsx) |
| Reused library sections | `HeroSection`, `FeatureGrid`, `CTASection` ([`@scope/sections`](../packages/sections/src/)), `BentoGrid` ([`@scope/react`](../packages/react/src/bento-grid.tsx)) |

## Verdict (one line)

**The site looks like a competent Tailwind/shadcn starter, not a motion product.** It *describes* a motion system in text but **shows almost no motion above the fold**, uses centered columns + an equal‑card grid, and leads with a static `PricingCard` on the flagship component page. It fails its own core promise: *demonstrate the motion product immediately.*

## Visual identity

| Question | Finding |
|---|---|
| Recognizable without logo/name? | **No.** Neutral zinc palette + system sans + one indigo accent (`--color-accent: #4f46e5`) reads as default Tailwind. |
| Typography deliberate? | **Partly.** Reasonable scale (`clamp()` hero), but the display face is the system stack — no identity, no editorial contrast between display and body. |
| Color distinctive? | **No.** Single indigo accent, no secondary/semantic brand roles. This is the exact "generic blue/purple as the only identity" anti‑pattern. |
| Radius/border/surface/shadow coherent? | **Coherent but generic.** One `--radius-lg`, one border color, soft shadow — the shadcn card language, applied uniformly. |
| Motion visible above the fold? | **Barely.** The hero uses `HeroSection` whose entrance is a mount `Stagger` (a subtle fade‑up that runs once and stops). Nothing communicates "motion system." |
| Motion demonstrates product value? | **No.** No choreography, no controls, no semantic‑intent demonstration — the product's actual moat is invisible. |
| Mistakable for a generic starter? | **Yes** — this is the headline problem. |
| Supports a premium commercial product? | **No.** Nothing on screen justifies payment. |
| Clear focal point? | **Weak.** The hero headline competes with equal‑weight body text and two same‑weight buttons; no dominant live stage. |

## Layout

- **Centered column throughout** (`.docs-main { max-width: 960px; margin: 0 auto }`) — every section is the same narrow centered block. No asymmetry, no editorial hierarchy, poor use of wide screens.
- **`FeatureGrid` = 3 equal cards** ("Accessible / RSC‑safe / Tiny") — the canonical "three equal feature cards" anti‑pattern, and the claims are **unproven text badges**.
- **`BentoGrid` catalog = text‑only link cards** ("PricingCard / AnimatedDialog / SpotlightCard" + a one‑line description + "View →"). Components are represented as **text, not demonstrations**.
- **Weak section transitions** — sections are stacked blocks with uniform vertical padding; no rhythm or composition.
- **`CTASection`** is a bordered box centered at the bottom — fine, but generic.
- **Wide‑screen waste:** on a 1440px+ viewport the content is a 960px ribbon down the middle with large empty gutters used as "luxury whitespace" (an anti‑pattern here — it's just empty).

## Conversion

| Question | Finding |
|---|---|
| Value prop understandable in seconds? | Headline "Premium motion you can actually ship" is decent, but the page never *shows* it. |
| Main difference clear? | **No.** The semantic‑motion/choreography moat is not communicated at all. |
| Primary CTA visible? | Yes ("Browse components"), but it competes visually with the identical‑weight "GitHub" secondary. |
| Secondary CTA competes? | **Yes** — same `.scope-btn` style, same size → no hierarchy. |
| Experience the product without leaving? | **No.** You must navigate to a component page, and even there it's mostly static. |
| First viewport contains real product proof? | **No.** |
| Pricing understandable? | **No** — there is no pricing/offering section on the homepage at all. |
| Reason to pay? | **None visible.** |
| Claims backed by demos? | **No** — "Accessible", "Tiny", "RSC‑safe" are asserted, not shown. |
| Trust without fakery? | ✅ No fake testimonials/logos/metrics (good — keep this). |

## Component presentation (docs pages)

| Capability | Present? |
|---|---|
| Live preview | ✅ (the component renders live in [`Preview`](../apps/docs/app/_components/preview.tsx)) |
| Replay animation | ❌ |
| Change motion preset / intent | ❌ |
| Change motion intensity | ❌ |
| Toggle reduced motion | ❌ |
| Switch theme (light/dark) | ❌ (dark tokens exist in `@scope/tokens` but the site never toggles) |
| Switch viewport | ❌ |
| Code updates with settings | ❌ (code is a static string) |
| Accessibility behavior shown | ❌ (described in prose only) |
| SSR / client‑boundary shown | ❌ |
| Bundle info shown | ❌ |
| Install options shown | ⚠️ one static `pnpm add` line |
| Feels like a premium catalog | **No** |

The flagship component page (`/components/pricing-card`) leads with a **static card + a `<pre>` code block** — the least motion‑forward possible first impression for a motion product.

## Interaction quality

- **Hover:** only `.scope-btn:hover` (bg change) and `SpotlightCard` (which the homepage never surfaces). 
- **Focus‑visible:** relies on UA defaults; no branded focus ring token applied site‑wide.
- **Active/loading/disabled/open‑closed states:** not demonstrated anywhere on the homepage.
- **Keyboard:** links/buttons are native and fine; but there are **no interactive product controls to keyboard through**.
- **Motion continuity / interruption / replay:** none — the only motion is a one‑shot mount stagger that cannot be replayed.
- **Touch/mobile:** the centered column reflows acceptably, but there is no mobile‑specific motion story.
- **Reduced‑motion:** honored by the primitives (good), but **never demonstrated** so buyers can't see it.
- **Dark mode:** tokens support it; the site ships light‑only.

## Generic patterns explicitly present

- ✅ Repeated equal cards (`FeatureGrid` 3‑up; `BentoGrid` link cards).
- ✅ Generic single indigo accent as the only identity.
- ✅ Components represented by **text instead of demonstrations**.
- ✅ Generic heading **"Why this kit"** (in `FeatureGrid` eyebrow/title on the homepage).
- ✅ Claims ("accessible", "tiny", "RSC‑safe") **without visible evidence**.
- ✅ Centered everything; same alignment for every heading.
- ✅ Empty wide‑screen space used to imply premium.
- ✅ Default‑ish buttons (`.scope-btn` is close to a UA button with a border).
- ➖ No fake dashboards/blobs/particles/testimonials/metrics (these we avoided — keep avoiding them).

## What to preserve (do not regress)

- **No fabricated trust signals** — keep it.
- **Accessible, reduced‑motion‑safe primitives** underneath — the components are good; the *presentation* is the problem.
- **Server‑safe architecture** — the homepage is a Server Component composing client leaves; keep the page mostly server‑rendered with a small interactive client island.
- **Semantic tokens** in `@scope/tokens` — extend, don't bypass.
- **Core UI never imports Remotion** — unaffected by this work.

## Redesign implications (feeds [`28`](28-visual-direction.md))

1. **Lead with a live, controllable motion stage above the fold** — the hero must *be* a demonstration, with real controls (semantic intent, intensity, reduced‑motion, replay, theme) and code that updates.
2. **Kill the centered‑ribbon layout** — introduce an asymmetric editorial grid that uses wide screens.
3. **Replace text‑only catalog cards with live, replayable previews.**
4. **Make the moat visible** — a choreography section (code beside a coordinated scene) is the signature.
5. **Prove claims** — a production‑proof section that *shows* reduced‑motion, keyboard interruption, SSR/bundle facts, not badges.
6. **Give the site an identity** — a display typeface, a real accent system, an "instrument" surface language (see [`28`](28-visual-direction.md)).
7. **Add a proposed pricing/offering section** — no invented numbers ("Pricing coming soon" / clearly proposed).
