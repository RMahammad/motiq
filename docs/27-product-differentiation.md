# 27 — Product differentiation & positioning

> **Type:** 🟢 Canonical for product positioning · **Status:** **Re‑sequenced for the 2026‑07‑14 pivot** — catalog‑first primary positioning; the semantic‑motion moat is demoted to a supporting/future layer · **Related:** [ADR-0013](adrs/0013-product-moat.md) *(re‑sequenced — not the launch lead)*, [ADR-0015](adrs/0015-semantic-motion-api.md) *(demoted to roadmap)*, [ADR-0017](adrs/0017-shadcn-primitive-foundation.md) · [`30-showcase-visual-system.md`](30-showcase-visual-system.md) · [`31-competitive-product-review.md`](31-competitive-product-review.md) · [`06-animation-engine-decision.md`](06-animation-engine-decision.md) · [`09-component-api-standard.md`](09-component-api-standard.md) · [`16-commercial-packaging.md`](16-commercial-packaging.md)
> **[REC]** = recommendation; **[FACT]** = already implemented at v0.1.0; **[LATER]** = future roadmap, not the first release.

## Primary positioning (what we sell)

**Beautiful, production‑ready animated React and shadcn components that developers install directly into their applications as editable source.**

You browse a real catalog, see each component animate large and live, tweak it with working controls, then **copy it or install it via the shadcn CLI** — the code lands in *your* repo, yours to edit. Every component starts from a reliable accessible primitive, keeps that accessibility, adds motion that means something, and is proven production‑ready on the page — not asserted in a badge.

This is a deliberate re‑sequencing ([`31`](31-competitive-product-review.md) §6): the catalog leads; the deeper "semantic motion system" is a supporting story and a future layer, **not** the homepage and **not** the first release.

## What we are NOT

Not "the largest catalog", not an effect‑per‑card gallery chasing component count, not a screenshot‑only effects dump, not a thin wrapper around Motion for React, not a Remotion template pack. And — importantly for launch — **not an abstract motion‑theory pitch**: we do not lead with intent compilers, choreography grammar, or enterprise "motion‑system" language. We compete on **components that are genuinely good and genuinely production‑ready**, distributed as editable source.

## The standard workflow (how every component is built)

Every catalog item follows the same pipeline — this consistency *is* part of the value ([`animated-shadcn-authoring`](../.claude/skills/animated-shadcn-authoring/SKILL.md), [`creative-component-authoring`](../.claude/skills/creative-component-authoring/SKILL.md)):

1. **Start from a reliable primitive** — an accessible shadcn/Radix primitive (Radix is our sole primitive foundation, [ADR-0017](adrs/0017-shadcn-primitive-foundation.md)), or an original creative base for text/background effects.
2. **Preserve accessibility & semantics** — keyboard operation, focus management, ARIA roles/state, and composition (`asChild`, ref‑forwarding) survive the animation layer. Where a motion technique forces a tradeoff, we **document it honestly** ([`31`](31-competitive-product-review.md) §1).
3. **Add motion that means something** — a meaningful entrance / exit / state / gesture / layout animation, not decoration for a screenshot.
4. **Expose practical props** — real, typed controls (variant, size, timing, intensity), with idiomatic Motion pass‑through as the Level‑3 escape hatch ([`09`](09-component-api-standard.md#three-api-levels)).
5. **Guarantee reduced motion** — every animation has a defined reduced‑motion behavior that preserves final state ([`12`](12-accessibility-standard.md)).
6. **Distribute as editable source** — shipped through a shadcn‑compatible registry, so the code lands in the buyer's repo, editable, not hidden behind a compiled package.
7. **Show a large live preview** — the component animates at real size with **working controls** and **replay**, not a static thumbnail ([`30`](30-showcase-visual-system.md)).
8. **Install / copy directly under the demo** — shadcn CLI command and copy‑paste, right there.
9. **Document dependencies & behavior** — exact deps, motion behavior, a11y notes, SSR/boundary facts.
10. **Test in a clean fixture** — verified in an isolated Next.js/Vite consumer, not just in our monorepo.

## The engine (unchanged invariant)

**Motion for React** (`motion@12.42.2`, MIT) is the default engine; **CSS/WAAPI** handles simple effects and Motion is **not** pulled into every item — a component that only needs a CSS transition ships without the Motion dependency ([`06`](06-animation-engine-decision.md), [`13`](13-performance-standard.md)). **Remotion stays out of the browser UI entirely** (video‑only, isolated). The engine is a means; the value is the finished, accessible, production‑ready component.

## Differentiators that still matter at launch

These carry the first release — they are what makes "animated component" mean *more* here than in a free copy‑paste kit.

### 1. Production‑readiness shown, not claimed — **[MOAT, live now]**
Every component page *renders* the proof: **accessibility & keyboard behavior, reduced‑motion form, SSR/client‑boundary behavior, and bundle/deps** — as live panels, not badges. A buyer sees the reduced‑motion variant run, tabs through the component, and reads the real bundle cost before installing. Competitors mostly *assert* these; we *demonstrate* them ([`31`](31-competitive-product-review.md) §6, [`13`](13-performance-standard.md)).

### 2. Real accessibility, preserved from the primitive — **[MOAT, live now]**
Because every interactive component wraps an accessible Radix primitive ([ADR-0017](adrs/0017-shadcn-primitive-foundation.md)), it inherits correct roles, keyboard support, and focus management — and we keep them through the animation layer. Copying a free animated component usually means inheriting *none* of that ([`02`](02-market-analysis.md)).

### 3. Clean‑room & license‑safe — **[MOAT, structural]**
Ideas, taxonomy, and UX conventions are fair to learn from; **every component we ship is clean‑room original**, built on our own motion utilities + MIT‑licensed primitives (Radix/shadcn). We do **not** vendor competitor source. In particular, **React Bits (MIT + Commons Clause) and Aceternity / React Bits Pro code must never ship in this paid product** — their licenses target exactly our use case; Animate UI and shadcn are MIT and may be *adapted* (not copied) with notice retained. Binding rule and matrix: [`31`](31-competitive-product-review.md) §5. Enforced by [`dependency-review`](../.claude/skills/dependency-review/SKILL.md) and [`creative-component-authoring`](../.claude/skills/creative-component-authoring/SKILL.md).

## Distribution & paid gating

- **shadcn registry.** `registry.json` → generator (`shadcn build`) → per‑item JSON at [`apps/docs/public/r/*.json`](../apps/docs/public/r/); each `/r/<name>.json` is what `shadcn add <url>` fetches ([ADR-0017](adrs/0017-shadcn-primitive-foundation.md), [`31`](31-competitive-product-review.md) §4).
- **Premium gating is install‑time, not runtime.** Private/premium items are gated by **registry auth headers** (`components.json` `registries` entry with `Authorization: Bearer ${TOKEN}`; server returns 401/403). **No runtime license checks, no secrets in client code** — the sanctioned path per [`16`](16-commercial-packaging.md).

## Free vs Premium value

The premium tier is **more, better, and complete — plus time saved and support** — not access to abstract architecture. (Tier labels come from `product.config.json`; "Free" / "Pro".)

| | **Free** (funnel) | **Premium** (paid) |
|---|---|---|
| Components | A genuinely useful **animated shadcn set**; several **text animations**; shared **entrance primitives**; a **few animated icons**; **1–2 backgrounds** | The **full catalog** — advanced creative components, complete **blocks**, advanced **backgrounds**, premium **text effects**, a **larger icon set**, and **templates** |
| Distribution | **Public registry**, editable source | **Private registry access** (install‑time auth) |
| Ongoing | — | **Updates** + **support** |
| Value | Prove the quality is real, for free | Save assembly time on a complete, maintained, supported set |

Premium value = **quantity + quality + completeness + time savings + support**, delivered as editable source you own. It is explicitly *not* "pay to unlock a motion architecture."

> **Pricing is not finalized.** `product.config.json → pricingFinalized: false`. Do not publish or imply specific prices anywhere until it is decided; "Pro / coming soon" is honest, invented numbers are not.

## Why pay for this instead of a free copy‑paste kit?

- **A free animated component gives you one effect with none of the boring 80%.** Often no reduced‑motion, no keyboard support, broken in the App Router, untyped, untested, unmaintained. We ship the accessible, reduced‑motion‑safe, SSR‑correct, tested version — **and prove it on the page**.
- **You get a coherent, maintained set, not scattered snippets.** One consistent API and token system across the catalog, updated over time, with support on the paid tier.
- **It's editable source you own.** Installed into your repo via the registry — no compiled black box, no runtime license phone‑home.

## Future roadmap — the semantic‑motion layer — **[LATER, not first release]**

The deeper moat from the pre‑pivot strategy ([ADR-0013](adrs/0013-product-moat.md), [ADR-0015](adrs/0015-semantic-motion-api.md)) is **retained as a direction, demoted for launch**. **The first release does NOT lead with any of the following**, and none of it appears on the homepage:

- **Semantic choreography** — coordinating heading → copy → media → CTA as one scene.
- **Intent compilers** — a typed vocabulary (`introduce`, `emphasize`, `confirm`, …) compiling to timing/easing/spring + reduced‑motion.
- **`MotionScene` / `MotionSequence` / `MotionStep` grammar** — section‑level orchestration primitives.
- **Motion Inspector** — a dev‑only overlay for intent/timing/policy/layout‑shift diagnostics.
- **Enterprise "motion‑system" terminology** — org‑wide motion themes, versioned motion contracts.

These are strong ideas with real build cost and unproven launch‑stage demand. They layer **on top of** a catalog that has already earned trust — after the catalog and its production‑readiness proof have shipped and landed. Sequencing them here keeps the launch honest: we sell what a developer can install today, and grow into the system.

## Do not build everything at once

Ship the **catalog** — a useful free set plus signature premium components, each with a large live preview, working controls, install/copy, and live production‑readiness panels. Layer blocks, backgrounds, and templates. **Defer** the semantic‑motion / choreography / inspector layer to a later release. Every addition passes [`product-differentiation-review`](../.claude/skills/product-differentiation-review/SKILL.md).
