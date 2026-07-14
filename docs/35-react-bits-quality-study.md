# 35 — React Bits quality study (clean-room competitive research)

> **Type:** 🟢 Canonical for reference-product research and the do-not-recreate lists · **Last reviewed:** 2026-07-14
> **Method:** rendered-site + docs + repo-metadata research by independent research subagents. **No competitor source code was fetched into this repo, read for implementation, or copied.** Consumers: [`signature-component-conception`](../.claude/skills/signature-component-conception/SKILL.md), [`originality-review`](../.claude/skills/originality-review/SKILL.md), strategy [`docs/36`](36-premium-creative-component-strategy.md).

## 0. Licensing restrictions (read first — they bind everything below)

| Source | License | What it means for us |
|---|---|---|
| React Bits free (github.com/DavidHDev/react-bits) | **MIT + Commons Clause Condition v1.0** | Commercial *use* allowed, but you may **not "sell, sublicense, or redistribute the components themselves."** Selling a component library is precisely our business → **any copied React Bits code in our catalog would violate the license.** Clean-room only. |
| React Bits Pro (pro.reactbits.dev) | Proprietary per-developer license | Explicitly prohibits building **"competing products (template packs or UI kits)"** from it and any redistribution; DMCA enforcement threatened. **Never reference Pro code at all.** |
| Aceternity UI | Free tier reportedly MIT (secondhand); site's own licence page covers **Pro only**: no redistribution "regardless of modifications", no derivative resale; some items embed third-party-licensed code | Treat **all** Aceternity source as untouchable for our commercial product. Rendered-behavior study only. |
| Animate UI (github.com/imskyleen/animate-ui) | MIT | Legally permissive, but our clean-room rule still applies (attribution + differentiation): we reuse **no** code. |
| shadcn/ui | MIT, "free forever" | Our foundation per [ADR-0017](adrs/0017-shadcn-primitive-foundation.md); registry mechanics adopted wholesale. |

Beyond code: component **names, exact visual effects, animation sequences, shaders, layouts, APIs, docs text, marketing copy, preview compositions, and brand identity** are treated as off-limits regardless of license, both for legal safety (substantial similarity) and because imitation destroys our differentiation claim.

## 1. Catalog structure (React Bits free, July 2026)

~150 items in four categories: **Text Animations (~22) · Animations/effects & cursors (~37) · Components/UI (~47) · Backgrounds (~44)**. Backgrounds + effects ≈ 55% of the catalog — the product skews decorative, not functional-UI. Site adds `/showcase` (real sites built with it), `/favorites` (user bookmarking), sponsors, and an **MCP/AI-agent installation page**. Naming pattern: two-word evocative/material names ("Liquid …", "Electric …").

React Bits **Pro** adds ~100 premium components (Text 8 · **Backgrounds 45** · 3D & Shaders 17 · Cursor Effects 12 · UI & Cards 18), **238+ blocks in 21 categories** (Hero 24, Pricing 15, Navigation 15, Social Proof 16, Stats 15, CTA 14, …), and 11 full Next.js templates. Backgrounds/shaders dominate the premium component tier — the "wow" layer; blocks are the volume/utility layer.

## 2. Preview & showcase quality

- Component pages: **Preview / Code / CLI tabs**; live demo with **real-time prop controls**; per-component dependency list; code in **4 variants** (JS/TS × CSS/Tailwind).
- Previews are large, dark, full-bleed stages where the effect dominates the page — components are shown at hero scale, never in tiny uniform frames.
- Install: shadcn CLI (`@react-bits/<Component>-TS-TW` namespace or direct registry URL), jsrepo, or manual copy — a shadcn-compatible static JSON registry (~480 per-variant files). **The market leader uses exactly our distribution architecture.**
- Aceternity: demo-first pages with realistic staged content (product cards, real imagery) in cinematic dark environments; the premium *feel* comes from staging quality, not component complexity.
- Animate UI: foundation-grouped catalog (Radix/Base/Headless tiers), styled-components vs unstyled-primitives split, Motion `transition` object as a first-class prop, honest documented constraints.
- shadcn/ui: Preview/Code tabs on every example, CLI/Manual install tabs, composition-tree diagrams, blocks with responsive viewport toggles + full-screen preview.

## 3. Product desirability

- Traction: ~43.4k stars, #2 JS Rising Stars 2025; positioned as "largest & most creative library of animated React components".
- Most-adopted: **text effects** (their strongest category), the dark-hero background staple, cursor toys. Immediate full-bleed motion on every page + zero-friction source ownership + free is why developers browse many pages.
- Pro pricing: **$99 / $199 / $299 one-time, lifetime updates** (Starter components / +blocks / +templates + priority support). Aceternity all-access ≈ $199; Magic UI Pro $199. Category consensus: **one-time $199–299, blocks/templates as the paid layer, strong free tier as the funnel.** Nobody sells subscriptions; nobody sells "motion system" semantics — buyers are shown **finished outcomes** (sections/pages).
- Pro's upsell is **completeness, not component quality**: effects ($99) → composed sections ($199) → launch-ready sites ($299), plus "own the code" framing and explicit **AI-agent (Cursor/Claude Code) buyer persona** with a published SKILL.md and MCP story.

## 4. Installation & ownership

- Editable source in the buyer's repo; no npm runtime package; no runtime license checks — **the license gates registry access** (authenticated shadcn namespace via `components.json` env-token headers). This validates our gate-at-install rule ([`docs/16`](16-commercial-packaging.md)).
- Free tier trains the exact workflow the paid tier uses (same CLI).
- 4-variant matrix (JS/TS × CSS/Tailwind) is their flexibility flex; CSS-only variants are marketed as RSC-safe with near-zero bundle cost.

## 5. Weaknesses → our opportunities

| Weakness (observed/reported) | Evidence | Our differentiator |
|---|---|---|
| Accessibility retrofitted, not designed-in | Stream of GitHub issues adding keyboard support to Dock, Carousel, CircularGallery, Folder, CardNav after release; no WCAG claim | WCAG 2.2 AA + keyboard/touch parity as a release requirement, with per-component evidence |
| Reduced motion aspirational | Their materials describe consistent `prefers-reduced-motion` as *planned* | Reduced-motion behavior mandatory per component, tested |
| Performance problems on record | Closed issues: "CPU at almost 100%" background, "Extreme GPU Overhead on Mobile (LightPillar)"; guidance warns vs >2–3 components per page | Per-component budgets, offscreen pausing, mobile targets ([`creative-performance-review`](../.claude/skills/creative-performance-review/SKILL.md)); components that compose |
| No system coherence | 4 variants of standalone snippets; no shared tokens, no choreography, no theming | Semantic tokens, motion personalities, components designed to coexist |
| No tests as a product guarantee | Not observable in repo/product claims | Unit + a11y + SSR + reduced-motion tests per item |
| Docs depth: params/edge cases thin | Third-party review (PkgPulse) | Production-grade docs: states, limits, budgets |
| Vite SPA docs site — no SSR | Fetching returns title-only shell; weak SEO/agent readability | Server-rendered catalog (Next.js) — better SEO and AI-agent readability |
| Nobody documents a11y/perf with evidence | Same gap at Aceternity and Animate UI | Evidence-backed claims are whitespace across the whole category |

## 6. Lessons classified (adopt / avoid / implement independently / must-not-reuse)

**Product patterns we may adopt** (ideas, not implementations): shadcn-registry distribution with per-item JSON + namespace auth; Preview/Code/CLI page anatomy with real-prop controls; hero-scale staged previews with realistic content; favorites + showcase-of-real-sites pages; MCP/AI-agent install story; one-time lifetime pricing anchored $99–299 with blocks/templates as the premium layer; strong free tier as the funnel; foundation-grouped catalog tiers (Animate UI); honest documented constraints; `transition`-as-prop escape hatch (now table stakes).

**Visual patterns we must avoid copying:** every named effect in §7; React Bits' dark-neon effect identity; Aceternity's cinematic-dark showcase identity (we use Direction A violet studio, [`docs/30`](30-showcase-visual-system.md)); macOS-Dock-style magnification navigation; Vestaboard split-flap text; "lamp" heroes; aurora gradient blobs.

**Technical ideas we may implement independently:** per-variant static registry generation; spring-based content-height continuity; direction-parameterized overlay entrances; pointer state via CSS variables + single rAF; component-local heavy deps as peer/optional; scroll-linked storytelling; canvas/particle systems with DPR caps and offscreen pause.

**Licensed implementations we must not reuse:** all React Bits free component implementations (Commons Clause), all React Bits Pro content (proprietary + anti-compete), all Aceternity source (Pro license explicit; free tier unverified), Animate UI code (MIT but excluded by clean-room policy).

## 7. Do-not-recreate lists (names + recognizable effects)

Recorded so `originality-review` can check proposals against them. Recreating any of these as a recognizable effect — even renamed — is a High/Unacceptable similarity risk.

**React Bits — Text:** Split Text, Blur Text, Circular Text, Text Type, Shuffle, Shiny Text, Text Pressure, Curved Loop, Fuzzy Text, Gradient Text, Falling Text, Text Cursor, Decrypted Text, **True Focus**, Scroll Float, Scroll Reveal, ASCII Text, Scrambled Text, Rotating Text, Glitch Text, Scroll Velocity, **Variable Proximity**, Count Up.
**React Bits — Animations/effects:** Cursor Grid, Animated Content, Fade Content, Electric Border, Orbit Images, Pixel Transition, Glare Hover, Antigravity, Logo Loop, Target Cursor, Magic Rings, Laser Flow, Magnet Lines, Ghost Cursor, Gradual Blur, Click Spark, Magnet, Strands, Sticker Peel, Pixel Trail, Cubes, Metallic Paint, Noise, Shape Blur, Crosshair, Image Trail, Ribbons, Splash Cursor, Meta Balls, Blob Cursor, Star Border.
**React Bits — Components:** Specular Button, Option Wheel, Curved Input, Line Sidebar, Animated List, Scroll Stack, Bubble Menu, Magic Bento, Circular Gallery, Reflective Card, Card Nav, **Stack**, Fluid Glass, Pill Nav, Tilted Card, Masonry, Glass Surface, Dome Gallery, Chroma Grid, Folder, Staggered Menu, Model Viewer, Lanyard, Profile Card, **Dock**, Gooey Nav, Pixel Card, Carousel, Spotlight Card, Border Glow, Flying Posters, Card Swap, Glass Icons, Decay Card, Flowing Menu, Elastic Slider, Counter, Infinite Menu, Stepper, Bounce Cards.
**React Bits — Backgrounds:** Ferrofluid, Lightfall, Liquid Ether, Prism, Dark Veil, Light Pillar, Silk, Floating Lines, Side Rays, Light Rays, Pixel Blast, Color Bends, Evil Eye, Line Waves, Radar, Soft Aurora, Aurora, Plasma, Plasma Wave, Particles, Gradient Blinds, Grainient, Grid Scan, Beams, Pixel Snow, Lightning, Prismatic Burst, Galaxy, Dither, Faulty Terminal, Ripple Grid, Dot Field, Dot Grid, Threads, Hyperspeed, Iridescence, Waves, Grid Distortion, Ballpit, Orb, Letter Glitch, Grid Motion, Shape Grid, Liquid Chrome, Balatro.
**React Bits Pro (observed subset):** Glass Cursor, Agentic Ball, Black Hole, Blurred Rays, Click Stack, Fog Sphere, ASCII Tiles, Cursor Wave, Twilight Lines, Chroma Blinds, Chroma Card; numbered block slugs (`hero-7` style); template names (SaaS, Minimal, Agency, Finance, AI SaaS, Shader, Wireframe, Portfolio, 8 Bit, AI App, Security).
**Aceternity (representative):** 3D Card Effect, Aurora Background, Bento Grid, Floating Dock, Globe, Infinite Moving Cards, Lamp Effect, Macbook Scroll, Parallax Scroll, Sparkles, Text Generate Effect, Timeline, Wavy Background, flip-board text.
**Animate UI (representative):** directional-spring Dialog feel; Liquid/Ripple/Flip buttons; Bubble/Fireworks/Gradient/Gravity Stars/Hexagon/Hole/Stars backgrounds; Counting/Gradient/Highlight/Morphing/Rolling/Rotating/Shimmering/Sliding/Splitting/Typing Text; Magnetic/Tilt/Shine effects; animated Lucide icon line; GitHub Stars Wheel.

## 8. Tech notes (for engine decisions, not for copying)

React Bits is multi-engine: GSAP + Motion for React + Three.js/R3F + **OGL (lightweight WebGL for most backgrounds)** + matter-js + lenis, with heavy deps kept component-local. Confirms our ladder (CSS → SVG → Motion/WAAPI → Canvas → isolated WebGL) and that a lightweight GL micro-lib — not Three.js globally — is the right shape *if* WebGL is ever justified. Their composition warning (2–3 components max per page) is the strongest argument for our per-component budgets and offscreen pausing.
