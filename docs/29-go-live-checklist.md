# 29 — Go‑live checklist

> **Type:** 🟢 Canonical launch runbook · **Implementation status:** 🟡 Engineering MVP done (v0.1.0); launch is **decision‑gated** · **Last reviewed:** 2026-07-14
> **Owns:** the single list of what stands between the tested `v0.1.0` and a paid launch, each with a recommendation and what unblocks it.
> **Related:** [`23-open-questions.md`](23-open-questions.md) · [`01-product-strategy.md`](01-product-strategy.md) · [`16-commercial-packaging.md`](16-commercial-packaging.md) · [`18-release-process.md`](18-release-process.md) · [`08-remotion-license-analysis.md`](08-remotion-license-analysis.md) · [`20-mvp-roadmap.md`](20-mvp-roadmap.md)
> ⚠️ Legal items require a qualified attorney. **[REC]** = my recommendation; the decision is the owner's.

## Where we are

A shippable **v0.1.0**: 21 accessible, reduced‑motion‑safe, RSC‑safe, tested, size‑budgeted, documented components across `@scope/{tokens,motion,react,sections}`; working docs site + Storybook; full CI; first versioned release with changelogs. The remaining blockers are **decisions and go‑live wiring, not engineering gaps.**

## Critical path to the first paid sale (shortest route)

The minimum to sell the **compiled edition** of the current catalog:

1. **Pick the product name + npm scope** (G1) — everything else is mechanical once this is set.
2. **Confirm the pricing + license model** (G2, G3) and have an attorney draft the **EULA** (L2).
3. **Wire publishing**: flip `private:false` + `publishConfig` (restricted, private registry), stand up the **entitlement → token** flow, publish 1.0 with provenance (P1–P4).
4. **Freeze the public API for 1.0** (E1) so buyers get migration guarantees.

Everything below Phase 3 in [`20-mvp-roadmap.md`](20-mvp-roadmap.md) is otherwise complete. The **Remotion video line is a separate, later launch** gated on its own license questions (§R).

---

## G — Product & pricing decisions (owner: Founder)

| # | Decision | Priority | Recommendation [REC] | Unblocks |
|---|---|---|---|---|
| G1 | **Product name + npm scope + GitHub org + domain** | 🔴 Launch blocker | Pick per the [name criteria](01-product-strategy.md#product-name-criteria); then replace the `@scope` placeholder in every `package.json` + docs (mechanical, ~1 script). | All publishing; branding of docs site |
| G2 | **Free vs paid split** | 🔴 Blocker | Keep the funnel: free = MotionProvider/Reveal/Fade/Stagger/InView/ScrollProgress/GradientText/Skeleton; paid = everything else + sections ([`20`](20-mvp-roadmap.md#free-vs-premium-split)). | License text; packaging |
| G3 | **Pricing model** | 🔴 Blocker | **One‑time per major + optional annual "updates & new components" renewal**; individual / team (≤N devs) / agency (unlimited client projects) / enterprise (custom) ([`01`](01-product-strategy.md#commercial-terms-draft--lawyer-review-required)). | Checkout; EULA; entitlement tiers |
| G4 | **Compiled vs source (registry) editions** | 🟠 Pre‑1.0 | Offer **both**: compiled private‑npm for most; authed **shadcn‑style registry** for power users ([`16`](16-commercial-packaging.md)). Source edition can ship *after* the compiled launch. | `@scope/registry` + `@scope/cli` build |
| G5 | **Refund policy** | 🟠 Pre‑1.0 | 14‑day window, seat‑based, acknowledging source‑access risk — **have counsel word it** (L2). | Storefront terms |

## L — Legal (owner: Founder + qualified attorney) ⚠️

| # | Item | Priority | Note | Unblocks |
|---|---|---|---|---|
| L1 | **Remotion license questions** | 🔴 Blocker for the **video line only** | Send the 6 questions in [`08`](08-remotion-license-analysis.md#questions-that-must-be-answered-by-remotion) to Remotion **in writing** + counsel. Does **not** block the React component launch. | Phase 4 (§R) |
| L2 | **Commercial EULA / license text** | 🔴 Blocker | Attorney drafts: commercial‑use grant, **redistribution prohibition**, agency/client terms, enterprise, refunds, warranty/liability. Nothing in this repo is legal advice. | Selling anything |
| L3 | **Refund ↔ source‑access conflict** | 🟠 Pre‑1.0 | Buyer keeps source after refund — mitigate with short window + seat licensing + terms ([`16`](16-commercial-packaging.md)). | L2 |
| L4 | **Trademark clearance** for the chosen name | 🟠 Pre‑1.0 | Clear name + domain + npm scope before branding spend. | G1 branding |

## P — Publish & distribution wiring (owner: Eng; code‑ready, decision‑gated)

The **version → changelog → build → pack → publint** half is **validated at v0.1.0** ([`18`](18-release-process.md)). Remaining:

| # | Task | Priority | What to do | Status |
|---|---|---|---|---|
| P1 | **Flip `private: false` + `publishConfig`** on public packages | 🔴 Blocker | `"publishConfig": { "access": "restricted", "registry": "<private-registry-url>" }`; keep apps/fixtures private. | 🔵 pending (packages are `private:true`) |
| P2 | **Private npm org + entitlement → token flow** | 🔴 Blocker | Billing grants a **scoped, revocable** registry token per customer; **no runtime license checks; no secrets in client code** ([`16`](16-commercial-packaging.md)). | 🔵 pending |
| P3 | **Release CI job** (`changeset publish` w/ **provenance** + 2FA) | 🔴 Blocker | Add the publish job gated on the green `verify`/`fixtures` jobs; `npm publish --provenance` ([`17`](17-security-and-supply-chain.md)). | 🔵 pending (CI verifies; no publish job) |
| P4 | **Publish verification** | 🟠 Pre‑1.0 | After first publish, install the published package from a clean env into a fixture (the tarball rule applied to the published artifact — [`14`](14-testing-strategy.md)). | 🔵 pending |
| P5 | **Source edition**: build `@scope/registry` + `@scope/cli` | 🟢 Post‑launch | shadcn‑style `npx <name> add <component>` from an authed registry; watermark generated files with the license id ([`16`](16-commercial-packaging.md)). | 🔵 planned |

## E — Pre‑1.0 engineering gates (owner: Eng)

| # | Gate | Priority | Note |
|---|---|---|---|
| E1 | **Freeze the public API for 1.0** | 🔴 Blocker for **1.0** | Lock the component/prop surface; commit to migration guarantees + codemods thereafter ([`19`](19-support-and-deprecation.md), [`migration-authoring`](../.claude/skills/migration-authoring/SKILL.md)). |
| E2 | **Close ADR‑0009** — Storybook Vitest‑addon interaction/a11y/visual + Playwright cross‑browser/mobile in CI | 🟠 Pre‑1.0 | Needs a Playwright browser download in CI (deferred as heavier). [ADR‑0009](adrs/0009-testing-stack.md). |
| E3 | **`attw` (are‑the‑types‑wrong)** | 🟢 Nice‑to‑have | Blocked by an upstream crash under Node 24; `publint` + fixture typechecks cover exports meanwhile ([ADR‑0007](adrs/0007-package-format.md)). |
| E4 | **Finish MVP catalog stragglers** — `ImageReveal`, `LoadingButton` | 🟢 Pre‑1.0 | Small; same authoring loop. |
| E5 | **Docs‑site depth** — props tables + more component pages (auto‑generate from the inventory) | 🟠 Pre‑1.0 | Current site is a 5‑page stub that dogfoods the library ([`15`](15-documentation-strategy.md)). |
| E6 | **Compiled‑CSS fallback verification** for non‑Tailwind buyers | 🟠 Pre‑1.0 | Each package ships `styles.css`; add a fixture that consumes them without Tailwind ([`11`](11-tailwind-strategy.md)). |

## O — Ops, support & comms (owner: Founder/Support)

| # | Item | Priority | Recommendation [REC] |
|---|---|---|---|
| O1 | **Support tiers + response targets** | 🟠 Pre‑1.0 | Community (best‑effort) / paid (email, target TBD) / enterprise (private Slack + SLA) ([`19`](19-support-and-deprecation.md)). |
| O2 | **Supported‑version window** | 🟠 Pre‑1.0 | Latest major full; previous major security‑only for 6–12 months (pick one). |
| O3 | **Customer comms** | 🟢 | Changelog + GitHub releases (already generated), migration guides, security advisories ([`18`](18-release-process.md)). |
| O4 | **Storefront + checkout + entitlement integration** | 🔴 Blocker | Wire the payment provider → entitlement service → registry token (P2). Purchases of goods/services are the owner's to operate. |

## R — Remotion video line (separate, later launch)

Do **not** couple this to the component launch. Gated entirely on **L1** (license answers in writing) + the Phase‑4 plan in [`07`](07-remotion-strategy.md) / [`08`](08-remotion-license-analysis.md). The core packages must never import Remotion ([`03`](03-architecture.md#forbidden-import-matrix)); that firewall is CI‑enforced.

---

## Decisive summary

- **The component product can launch as soon as G1–G3, L2, and P1–P4 are done.** None require new engineering beyond the publish wiring; the catalog, tests, docs, and release tooling are ready at v0.1.0.
- **Freeze the API (E1) before calling it 1.0** so migration guarantees are real.
- **Ship the source/registry edition (P5) and the Remotion line (§R) as follow‑on launches**, not launch blockers.
- Everything marked 🟢 is post‑launch polish.

When an item resolves, record the decision in its canonical doc (and an ADR if durable), then check it off here.
