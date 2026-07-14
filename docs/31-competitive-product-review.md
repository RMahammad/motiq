# 31 — Competitive product review

> **Type:** 🟢 Canonical for competitor research & licensing posture · **Status:** Complete (2026-07-14) · **Owner:** product
> **Note on numbering:** The pivot brief requested `docs/29-competitive-product-review.md`, but `29-go-live-checklist.md` already exists and is linked from [`CLAUDE.md`](../CLAUDE.md) and [`README.md`](README.md). To avoid clobbering the launch runbook this review lives at **`31`**. See [`catalog-consistency`](#), [`27-product-differentiation.md`](27-product-differentiation.md), [`30-showcase-visual-system.md`](30-showcase-visual-system.md).
> **Related skill:** [`competitive-library-review`](../.claude/skills/competitive-library-review/SKILL.md) — the repeatable version of this research.

Research conducted **2026-07-14** against official websites, docs, and GitHub repos. Two facts flagged as *verify-before-publishing*: Aceternity's exact price (client-rendered) and Animate UI's exact `LICENSE.md` text (one fetch returned a Commons-Clause-flavored variant; repo signals say MIT).

---

## 0. Why this review exists

We are pivoting from an abstract "semantic motion system" landing page toward a **catalog of beautiful, production-ready animated React + shadcn components** that developers preview, customize, copy, and install. The four reference products are the state of the art for that experience. We study their **product organization, taxonomy, preview UX, install workflow, and free/premium presentation** — and we do **not** copy their code, branding, layouts, or assets.

---

## 1. Animate UI

**Sources:** [animate-ui.com/docs](https://animate-ui.com/docs) · [installation](https://animate-ui.com/docs/installation) · [github.com/animate-ui/animate-ui](https://github.com/animate-ui/animate-ui) · component pages ([liquid button](https://animate-ui.com/docs/components/buttons/liquid), [radix accordion](https://animate-ui.com/docs/primitives/radix/accordion))

| Dimension | Finding |
|---|---|
| Product model | shadcn-**registry distribution**, not an npm library. "Copy, modify, customize directly in your codebase." |
| OSS/commercial | **MIT** (© 2025 Elliot Sutton). *Verify LICENSE.md byte-for-byte before reusing any code.* Fully free. |
| Installation | Standard shadcn CLI + namespaced registry: `npx shadcn@latest add @animate-ui/primitives-texts-sliding-number`; import by local path afterward. |
| Categories | **Primitives** (animated, built on Radix / Base UI / Headless UI, source encoded in path e.g. `primitives/radix/...`), **Components** (styled), **Icons** (animated Lucide). |
| Registry install | `@animate-ui/` namespace resolves to their hosted registry; otherwise vanilla shadcn flow. |
| Preview controls | Real prop controls (variant/size toggles on live component) + "Open in v0.dev". Controls drive actual props, not fake sliders. |
| Motion props | Idiomatic pass-through: `...props` typed `HTMLMotionProps<"button">`; named convenience props (`delay`, `hoverScale`, `tapScale`); a **`transition` prop** typed `Transition` with documented defaults (Accordion content defaults `{ duration: 0.35, ease: 'easeInOut' }`); CSS-var escape hatches. |
| Accessibility | Tier-dependent: animated **primitives wrap accessible headless libs**; plain **components** use native semantics. Honest documented tradeoff: `asChild`/`forceMount` unsupported on `AccordionContent` because the animation layer needs the element. |

**Adopt:** namespaced shadcn registry; explicit primitive/component/icon tiering; idiomatic Motion pass-through as the Level-3 escape hatch of our [three-level API](09-component-api-standard.md); *honest* animation-vs-a11y docs.
**Avoid/defer:** wrapping three headless libs (Radix + Base + Headless) — testing-matrix sprawl that conflicts with our "coherence over count" rule; the broad effect-per-component philosophy.

---

## 2. React Bits

**Sources:** [reactbits.dev](https://reactbits.dev/) · [github.com/DavidHDev/react-bits](https://github.com/DavidHDev/react-bits) · [free LICENSE.md](https://raw.githubusercontent.com/DavidHDev/react-bits/main/LICENSE.md) · [pro.reactbits.dev/license](https://pro.reactbits.dev/license)

| Dimension | Finding |
|---|---|
| Product model | "Largest & most creative library of animated React components" — 130+ free, "growing weekly", copy-paste; plus a separate **React Bits Pro**. Also ships free creative tools: **Background Studio, Shape Magic, Texture Lab**. |
| License (free) | **MIT + Commons Clause.** Verbatim: *"You may use this Software … for any commercial purpose, so long as you do not sell or redistribute the components themselves in their original form"* (alone or bundled). |
| License (Pro) | Proprietary single-developer license; §1.3 forbids redistribution and building competing "component libraries / UI kits … derived from or substantially based on the Product." |
| Installation | shadcn CLI with variant-suffixed slug (`npx shadcn@latest add @react-bits/BlurText-TS-TW`), **jsrepo** CLI, or manual copy-paste. |
| Categories | **Text Animations · Animations · Components · Backgrounds** — all free, all prop-customizable. |
| Why previews excite | Motion-forward "wow" categories (split/blur/scramble text, shader backgrounds), live interactive previews, real-time Background Studio with **export to video/image/code**. |
| Code variants | Each component ships **4 variants: JS-CSS, JS-TW, TS-CSS, TS-TW**; the chosen variant changes the CLI slug. |
| Discoverability | Category nav + per-component pages; a third-party **MCP server** exposes 135+ components to AI tools (catalog is machine-consumable). |

**Adopt:** the **variant matrix from one source** DX (we'll start TS+Tailwind only — see [`27`](27-product-differentiation.md)); "creative tool as a product surface" (our future Background/Motion Lab); dual-CLI reach as a later option.
**Avoid/do NOT copy:** the count-driven "largest catalog" philosophy (directly against our moat); **any React Bits source (free or Pro) in our paid product** — the Commons Clause and Pro license both target exactly our use case.

---

## 3. Aceternity UI

**Sources:** [ui.aceternity.com](https://ui.aceternity.com/) · [pricing](https://ui.aceternity.com/pricing) · [licence](https://ui.aceternity.com/licence)

| Dimension | Finding |
|---|---|
| Product model | 200+ free copy-paste components; paid **All-Access Pass** unlocks premium **blocks** + **templates**. |
| Commercial | **One-time lifetime** purchase (~$169–$199, *client-rendered price — verify*), includes updates + priority support. |
| License | End products may be sold/distributed; but you **cannot** re-distribute the item/source, sell derivatives on a marketplace, or "create themes, templates, or derivative products to sell on any marketplace." |
| Tier ladder | **primitive → block → template** = increasing completeness of outcome; free primitives are top-of-funnel, paid = assembled outcomes. |
| Homepage proof | Above-the-fold live/looping demos; real logo wall + testimonials; live template previews; repeated CTA to pricing. |
| Animation tech | Framer Motion + Tailwind (v4), some WebGL/canvas shaders. |

**Adopt:** above-the-fold live demos of signature components; the explicit **primitive → block → template** product-tier story (maps to our `motion → react → sections → recipes`); copy-paste **and** CLI install directly under each demo; *honest, visible* proof.
**Avoid:** hiding prices behind CTAs (violates our [homepage-conversion](../.claude/skills/homepage-conversion-review/SKILL.md) honesty rule); vanity social-proof density; effect-maximalism; **no asset/code reuse** (restrictive license).

---

## 4. shadcn/ui (registry mechanics — the implementation basis)

**Sources:** [registry](https://ui.shadcn.com/docs/registry) · [getting-started](https://ui.shadcn.com/docs/registry/getting-started) · [registry-json](https://ui.shadcn.com/docs/registry/registry-json) · [registry-item-json](https://ui.shadcn.com/docs/registry/registry-item-json) · [namespace](https://ui.shadcn.com/docs/registry/namespace) · [authentication](https://ui.shadcn.com/docs/registry/authentication) · [LICENSE (MIT)](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md)

- **`registry.json`** (catalog): `$schema`, `name`, `homepage`, `items`, `include`. Root needs `items` **or** `include`.
- **`registry-item.json`** (one item): `$schema`, `name`, `type`, `title`, `description`, `author`, `dependencies`, `devDependencies`, `registryDependencies`, `files`, `cssVars`, `css`, `tailwind` (deprecated), `envVars`, `docs`, `categories`, `meta`.
- **Valid `type` values:** `registry:block`, `registry:component`, `registry:ui`, `registry:hook`, `registry:lib`, `registry:page` (needs `target`), `registry:file` (needs `target`), `registry:style`, `registry:theme`, `registry:base`, `registry:font`, `registry:item`.
- **`files[]`:** `{ path, type, target? }`. `target` supports aliases `@ui/ @components/ @lib/ @hooks/` and literal paths.
- **`registryDependencies`:** bare shadcn name (`"button"`), namespaced (`"@shadcn/card"`, `"@acme/input"`), or versioned/pathed (`"acme/ui/button#v1.2.0"`). CLI topologically sorts install order.
- **`cssVars`** grouped `theme`/`light`/`dark`; **`css`** injects `@layer`/`@keyframes`/utilities; `tailwind` is deprecated (use `cssVars`+`css` for Tailwind v4).
- **Install from remote:** `npx shadcn@latest add https://host/r/item.json`, or register a namespace (`registry add @acme=https://acme.com/r/{name}.json`) / `components.json` `registries` map.
- **Paid/private access (officially supported):** `components.json` `registries` entry with `headers` (`Authorization: Bearer ${REGISTRY_TOKEN}`) and/or `params`, `${ENV}` expansion; server returns 401/403. **This is our sanctioned paid-gating path — install-time auth, no runtime license check** (aligns with [`16`](16-commercial-packaging.md)).
- **`shadcn build`** reads `registry.json`, emits per-item JSON to `public/r/*.json` (override `--output`); each `/r/<name>.json` is what `add <url>` fetches.
- **License:** **MIT** — we may freely build a commercial shadcn-compatible registry on shadcn's primitives.

Concrete schema examples live in [ADR-0017](adrs/0017-shadcn-primitive-foundation.md) and the registry package once implemented.

---

## 5. Licensing posture (decision)

| Source | License | Adapt ideas? | Ship their code in our paid product? |
|---|---|---|---|
| Animate UI | MIT (verify) | ✅ | ✅ only if MIT confirmed + notice retained — but **adapt, don't adopt** (their patterns violate our own boundaries). |
| React Bits (free) | MIT + Commons Clause | ✅ ideas only | ❌ Commons Clause bars selling/redistributing the components. |
| React Bits Pro | Proprietary | ⚠️ arm's-length only | ❌ forbids competing kits. |
| Aceternity (paid) | Proprietary | ⚠️ ideas only | ❌ no marketplace derivatives. |
| shadcn/ui | MIT | ✅ | ✅ (retain notice). |

**Rule for this repo (binding):** Ideas, taxonomy, UX conventions, API shapes, and category structures are fair to learn from (not copyrightable). **Every component we ship is clean-room original**, built on our own motion utilities + MIT-licensed accessible primitives (Radix/shadcn). No competitor source is vendored. Enforced by [`dependency-review`](../.claude/skills/dependency-review/SKILL.md) and [`creative-component-authoring`](../.claude/skills/creative-component-authoring/SKILL.md).

---

## 6. What we adopt vs. reject (summary)

**Adopt:** shadcn-compatible registry with a namespace + install-time auth for premium; primitive/component/icon/background/block taxonomy; large live preview + working prop controls + copy/install directly under it; above-the-fold signature demos; primitive→block→template tier ladder; honest proof and honest pricing.

**Reject:** competing on component count; effect-per-card tiny catalogs; hidden pricing / vanity metrics; multi-headless-library sprawl; vendoring competitor code; leading with abstract motion-theory copy.

**Our differentiator (unchanged moat, re-sequenced):** production-readiness that is *shown, not claimed* (a11y/reduced-motion/SSR/bundle live per component) plus, later, semantic choreography — but the **first release leads with the catalog**, per [`27`](27-product-differentiation.md).
