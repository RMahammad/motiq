# Dimensional Surfaces wiring

Batch 07 · prototype `artifacts/motion-lab-showpieces/03-dimensional-surfaces.html`
Registry dir: `packages/registry/registry/creative/` · 5 components, all `registry:component`, zero runtime deps.

## registry.json items

```json
{
  "name": "holo-card",
  "type": "registry:component",
  "title": "Holo Card",
  "description": "A 3D tilt card that behaves like a physical foil pass: twin underdamped springs (k=120, d=10) chase the pointer so the card lags and overshoots ~6% on release, while the specular glare and iridescent conic foil stay pinned to the raw pointer — light is instant, mass is not. Counter-moving ground shadow, arrow-key tilt, touch drag, reduced-motion resting pose, offscreen-paused.",
  "dependencies": [],
  "registryDependencies": [
    "@motiq/utils",
    "@motiq/primitives"
  ],
  "files": [
    {
      "path": "registry/creative/holo-card.tsx",
      "type": "registry:component",
      "target": "components/motiq/holo-card.tsx"
    }
  ],
  "meta": {
    "category": "creative",
    "tier": "free",
    "signature": false,
    "keywords": [
      "card",
      "tilt",
      "3d",
      "holographic",
      "foil",
      "glare",
      "spring",
      "pointer"
    ]
  }
},
{
  "name": "border-beam-panel",
  "type": "registry:component",
  "title": "Border Beam Panel",
  "description": "A panel with twin comets orbiting a 2px border ring built from a rotating conic gradient cut by a two-layer CSS alpha mask (never an SVG luminance mask). The angular velocity itself is sprung (k=30, d=11), winding to 240 deg/s on hover and coasting back to 42 deg/s, with an optional coral signature comet 180 degrees opposed. One custom property per frame; content never repaints.",
  "dependencies": [],
  "registryDependencies": [
    "@motiq/utils",
    "@motiq/primitives"
  ],
  "files": [
    {
      "path": "registry/creative/border-beam-panel.tsx",
      "type": "registry:component",
      "target": "components/motiq/border-beam-panel.tsx"
    }
  ],
  "meta": {
    "category": "creative",
    "tier": "free",
    "signature": false,
    "keywords": [
      "border",
      "beam",
      "comet",
      "conic",
      "mask",
      "highlight",
      "panel",
      "changelog"
    ]
  }
},
{
  "name": "card-stack-deck",
  "type": "registry:component",
  "title": "Card Stack Deck",
  "description": "A deck that handles like physical cards: every card rides a continuous slot spring (k=90, d=12) and sending the front card drives a 210px side arc, a 150px z-lift and a full rotateY flip that reveals a patterned back before it tucks in behind. Drag, tap, prev/next buttons and arrow keys all drive one state, with an aria-live announcement per shuffle and instant reordering under reduced motion.",
  "dependencies": [],
  "registryDependencies": [
    "@motiq/utils",
    "@motiq/primitives"
  ],
  "files": [
    {
      "path": "registry/creative/card-stack-deck.tsx",
      "type": "registry:component",
      "target": "components/motiq/card-stack-deck.tsx"
    }
  ],
  "meta": {
    "category": "creative",
    "tier": "free",
    "signature": false,
    "keywords": [
      "deck",
      "stack",
      "cards",
      "shuffle",
      "flip",
      "drag",
      "carousel",
      "3d"
    ]
  }
},
{
  "name": "glass-refraction-panel",
  "type": "registry:component",
  "title": "Glass Refraction Panel",
  "description": "Frosted panes over a live scene: five gradient orbs drift on lissajous paths across a DPR-capped canvas (additive in dark, soft alpha in light, palette re-read from tokens on theme change) while each glass pane parallaxes at its own depth on a critically damped spring (k=110, d=21). A rotated specular band sweeps the main pane on every viewport entry. Translate3d-only layer motion, offscreen-paused.",
  "dependencies": [],
  "registryDependencies": [
    "@motiq/utils",
    "@motiq/primitives"
  ],
  "files": [
    {
      "path": "registry/creative/glass-refraction-panel.tsx",
      "type": "registry:component",
      "target": "components/motiq/glass-refraction-panel.tsx"
    }
  ],
  "meta": {
    "category": "creative",
    "tier": "free",
    "signature": false,
    "keywords": [
      "glass",
      "glassmorphism",
      "backdrop-filter",
      "parallax",
      "refraction",
      "canvas",
      "hero"
    ]
  }
},
{
  "name": "aurora-panel",
  "type": "registry:component",
  "title": "Aurora Panel",
  "description": "A product card that carries its own sky: three dual-sine ribbons drift across a canvas roof, softened by one GPU CSS blur at 116% scale with a seeded grain tile over the top and dark-only stars beneath. Pointer x retargets a lean spring (k=50, d=14) that shifts ribbon phase up to 90px and lifts amplitude ~20%, relaxing home on leave. One rAF loop, DPR capped at 2x, still-frame under reduced motion.",
  "dependencies": [],
  "registryDependencies": [
    "@motiq/utils",
    "@motiq/primitives"
  ],
  "files": [
    {
      "path": "registry/creative/aurora-panel.tsx",
      "type": "registry:component",
      "target": "components/motiq/aurora-panel.tsx"
    }
  ],
  "meta": {
    "category": "creative",
    "tier": "free",
    "signature": false,
    "keywords": [
      "aurora",
      "canvas",
      "card",
      "ribbons",
      "sky",
      "ambient",
      "product card"
    ]
  }
}
```

## catalog.ts entries

```ts
  {
    id: "holo-card",
    name: "Holo Card",
    slug: "holo-card",
    description:
      "A 3D tilt card that behaves like a physical foil pass: underdamped springs chase the pointer and overshoot on release, while the glare and iridescent foil stay pinned to the raw pointer. Counter-moving ground shadow, arrow-key tilt, reduced-motion resting pose.",
    category: "creative",
    subcategory: "Creative UI",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["card", "tilt", "3d", "holographic", "foil", "glare", "spring", "pointer"],
    registryItem: "holo-card",
    documentationPath: "/components/holo-card",
    dateAdded: "2026-07-28",
    featured: false,
    supportsDarkMode: true,
    supportsReducedMotion: true,
    requiresClient: true,
    animationEngine: "css",
    stage: "card",
    complexity: "medium",
    releaseStatus: "released",
  },
  {
    id: "border-beam-panel",
    name: "Border Beam Panel",
    slug: "border-beam-panel",
    description:
      "Twin comets orbiting a 2px border ring cut from a rotating conic gradient by a CSS alpha mask. The angular velocity itself is sprung, so the beams wind up on hover and coast back down instead of snapping between speeds.",
    category: "creative",
    subcategory: "Creative UI",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["border", "beam", "comet", "conic", "mask", "highlight", "panel", "changelog"],
    registryItem: "border-beam-panel",
    documentationPath: "/components/border-beam-panel",
    dateAdded: "2026-07-28",
    featured: false,
    supportsDarkMode: true,
    supportsReducedMotion: true,
    requiresClient: true,
    animationEngine: "css",
    stage: "card",
    complexity: "simple",
    releaseStatus: "released",
  },
  {
    id: "card-stack-deck",
    name: "Card Stack Deck",
    slug: "card-stack-deck",
    description:
      "A deck that handles like physical cards: the front card arcs sideways, lifts, flips to show its patterned back and tucks in behind while the rest ripple forward. Drag, tap, buttons and arrow keys all drive one state, with an aria-live announcement per shuffle.",
    category: "creative",
    subcategory: "Creative UI",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["deck", "stack", "cards", "shuffle", "flip", "drag", "carousel", "3d"],
    registryItem: "card-stack-deck",
    documentationPath: "/components/card-stack-deck",
    dateAdded: "2026-07-28",
    featured: false,
    supportsDarkMode: true,
    supportsReducedMotion: true,
    requiresClient: true,
    animationEngine: "css",
    stage: "interactive",
    complexity: "complex",
    releaseStatus: "released",
  },
  {
    id: "glass-refraction-panel",
    name: "Glass Refraction Panel",
    slug: "glass-refraction-panel",
    description:
      "Frosted panes over a live orb scene, depth-ranked by pointer parallax on critically damped springs, with a specular streak that sweeps the main pane on every viewport entry. Canvas palette re-reads theme tokens live.",
    category: "creative",
    subcategory: "Creative UI",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["glass", "glassmorphism", "backdrop-filter", "parallax", "refraction", "canvas", "hero"],
    registryItem: "glass-refraction-panel",
    documentationPath: "/components/glass-refraction-panel",
    dateAdded: "2026-07-28",
    featured: false,
    supportsDarkMode: true,
    supportsReducedMotion: true,
    requiresClient: true,
    animationEngine: "css",
    stage: "canvas",
    complexity: "complex",
    releaseStatus: "released",
  },
  {
    id: "aurora-panel",
    name: "Aurora Panel",
    slug: "aurora-panel",
    description:
      "A product card with a living roof: three sinusoidal ribbons drift across a canvas header, soften under one GPU blur with seeded grain and dark-only stars, and lean toward the pointer on a spring. A contained sky for cards, not another full-page background.",
    category: "creative",
    subcategory: "Creative UI",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["aurora", "canvas", "card", "ribbons", "sky", "ambient", "product card"],
    registryItem: "aurora-panel",
    documentationPath: "/components/aurora-panel",
    dateAdded: "2026-07-28",
    featured: false,
    supportsDarkMode: true,
    supportsReducedMotion: true,
    requiresClient: true,
    animationEngine: "css",
    stage: "canvas",
    complexity: "medium",
    releaseStatus: "released",
  },
```

## presentation map

```ts
  "holo-card": { previewSize: "standard", stageFamily: "creative", cardSpan: 6 },
  "border-beam-panel": { previewSize: "standard", stageFamily: "creative", cardSpan: 6 },
  "card-stack-deck": { previewSize: "wide", stageFamily: "creative", cardSpan: 8 },
  "glass-refraction-panel": { previewSize: "full", stageFamily: "creative", cardSpan: 12 },
  "aurora-panel": { previewSize: "standard", stageFamily: "creative", cardSpan: 6 },
```

## docs-content entries

```ts
  "holo-card": {
    usage: `import { HoloCard } from "@/components/motiq/holo-card";

<HoloCard foil="spectral" maxTilt={14} glare shadow>
  <div className="flex items-center justify-between">
    <span className="font-extrabold tracking-[0.22em]">MOTIQ</span>
    <span className="text-[9px] tracking-[0.2em]">OPEN PASS</span>
  </div>
  <div className="text-[26px] font-bold">128</div>
  <div className="font-mono text-[10px]">MIT · SINCE 2026</div>
</HoloCard>`,
    api: [
      { prop: "children", type: "ReactNode", def: "-", desc: "Card content, laid out as a full-height column so a header/mid/footer trio reads like a pass." },
      { prop: "maxTilt", type: "number", def: "14", desc: "Peak lean in degrees at the card edge; 14 reproduces the lab's ±11° rotateX / ±15° rotateY pair." },
      { prop: "spring", type: "{ stiffness, damping }", def: "{ 120, 10 }", desc: "Tilt spring. Deliberately underdamped (ζ≈0.46) so release overshoots ~6% once before settling." },
      { prop: "foil / glare / shadow", type: "\"azure\" | \"spectral\" | \"none\" / boolean / boolean", def: "\"spectral\" / true / true", desc: "Iridescent conic foil sheet, specular pointer hotspot, and the counter-moving ground shadow." },
      { prop: "idleSway / aspect", type: "boolean / number", def: "true / 1.586", desc: "Ambient sway before any input, and the card aspect ratio (pass 0 to let content size the card)." },
      { prop: "label / onTilt", type: "string / (rx, ry) => void", def: "\"Interactive tilt card\" / -", desc: "Accessible name for the tilt surface, and a callback with the settled spring angles." },
      { prop: "pauseWhenHidden / reducedMotion", type: "boolean", def: "true / -", desc: "Offscreen/tab-hidden pause, and force the static resting pose regardless of system preference." },
    ],
    accessibility: [
      "The foil, glare and ground shadow are decorative and aria-hidden; your children keep normal semantics and focus order.",
      "The card is a focusable group with a visible focus ring: arrow keys nudge the tilt targets ±4° per press and Escape levels it, described by an sr-only hint.",
      "Respects prefers-reduced-motion and the reducedMotion prop: renders a fixed -6°/8° pose with static light - still dimensional, zero movement.",
      "Pointer handling covers mouse and touch (touch-action is confined to the card, so the page still scrolls); under forced colors the light layers are dropped.",
    ],
    performance: [
      "One requestAnimationFrame loop per instance with delta-time clamped at 50ms - no per-frame React state.",
      "Motion is transform-only; the foil and glare are pre-painted layers whose custom properties move gradient origins, so card content never repaints.",
      "IntersectionObserver plus visibilitychange park the loop when the card scrolls offscreen or the tab is hidden.",
    ],
  },
  "border-beam-panel": {
    usage: `import { BorderBeamPanel } from "@/components/motiq/border-beam-panel";

<BorderBeamPanel beams={2} idleSpeed={42} hoverSpeed={240} glow>
  <h3>One command, zero setup</h3>
  <p>Every Motiq component installs straight from the registry.</p>
</BorderBeamPanel>`,
    api: [
      { prop: "children", type: "ReactNode", def: "-", desc: "Panel content - layout and semantics are entirely yours; the beams never touch them." },
      { prop: "beams / colors", type: "1 | 2 / [string, string?]", def: "2 / theme", desc: "One comet or two opposed comets. The second defaults to the rare coral signature." },
      { prop: "idleSpeed / hoverSpeed", type: "number", def: "42 / 240", desc: "Resting and hover angular velocity in deg/s (~8.5s per lap at 42)." },
      { prop: "spring", type: "{ stiffness, damping }", def: "{ 30, 11 }", desc: "The velocity spring - speed itself is sprung, so the comets wind up and coast instead of snapping." },
      { prop: "thickness / radius", type: "number", def: "2 / 16", desc: "Ring thickness and corner radius in px." },
      { prop: "glow / seed", type: "boolean / number", def: "true / 1", desc: "Blurred copy of the ring behind the panel as cast light, and the deterministic start angle (SSR-stable)." },
      { prop: "pauseWhenHidden / reducedMotion", type: "boolean", def: "true / -", desc: "Offscreen/tab-hidden pause, and force the parked lit-border state regardless of system preference." },
    ],
    accessibility: [
      "The ring and the cast glow are aria-hidden and pointer-events-none; content semantics are untouched.",
      "The surge fires on keyboard focus as well as hover, so keyboard users get the same affordance.",
      "Reduced motion parks the orbit at 40° with both comets visible - it reads as a lit border, not a broken one.",
      "Under forced colors the gradient layers are dropped and the panel falls back to a plain CanvasText border.",
    ],
    performance: [
      "Only one custom property (--mk-beam-a) changes per frame; the conic gradient re-rasterizes on the ring layer and content never repaints.",
      "The ring is a two-layer CSS alpha mask with mask-composite: exclude - SVG luminance masks are avoided because they silently no-op in Chromium.",
      "Delta-time integration means a janky or backgrounded tab can never skip the beam ahead; the loop is IntersectionObserver-paused offscreen.",
    ],
  },
  "card-stack-deck": {
    usage: `import { CardStackDeck } from "@/components/motiq/card-stack-deck";

<CardStackDeck
  items={categories.map((c) => ({ id: c.id, label: c.name, content: <CategoryFace {...c} /> }))}
  arcWidth={210}
  onTopChange={setTop}
/>`,
    api: [
      { prop: "items", type: "{ id, content?, label? }[]", def: "-", desc: "The cards, front to back at rest. `label` is what the live region announces." },
      { prop: "renderItem", type: "(item, { index, slot, isFront }) => ReactNode", def: "-", desc: "Render override for the front face; receives the card's live slot." },
      { prop: "topIndex / defaultTopIndex / onTopChange", type: "number / number / (index) => void", def: "- / 0 / -", desc: "Controlled or uncontrolled front card, and the change callback." },
      { prop: "fan / arcWidth / lift", type: "{ y, z, rotate } / number / number", def: "{ 18, 62, 2.2 } / 210 / 150", desc: "Rest-fan geometry per slot, and the peak sideways travel + z-lift of the sent card." },
      { prop: "spring", type: "{ stiffness, damping }", def: "{ 90, 12 }", desc: "Slot spring driving both the send arc and the one-slot ripple of the remaining cards." },
      { prop: "cardBack / dragToShuffle / showControls", type: "ReactNode / boolean / boolean", def: "pattern / true / true", desc: "Back face shown mid-flip, drag-and-tap shuffling, and the visible prev/next buttons." },
      { prop: "height / cardHeight / label", type: "number / number / string", def: "300 / 210 / \"Card deck\"", desc: "Scene height (room for the fan), card height, and the accessible group name." },
      { prop: "pauseWhenHidden / reducedMotion", type: "boolean", def: "true / -", desc: "Offscreen/tab-hidden pause, and force instant motion-free reordering." },
    ],
    accessibility: [
      "The deck is a focusable group with aria-roledescription=\"card deck\": ArrowRight/Enter/Space send the front card, ArrowLeft brings the previous one back, and the visible buttons do the same.",
      "An aria-live=\"polite\" region announces the new front card (name and position) after every shuffle.",
      "Only the front card is exposed to assistive tech; the cards behind it are aria-hidden, so a stack never reads as duplicate content.",
      "Reduced motion reorders instantly with no arc or flip - the fan itself stays as static depth and every control keeps working.",
    ],
    performance: [
      "One requestAnimationFrame loop drives the whole deck; springs stop the busy gate as soon as every card is within 0.002 of target.",
      "Transforms only - the depth dim is an opacity overlay rather than a filter, because a filter would flatten the preserve-3d context and kill the flip.",
      "preserve-3d lets the browser depth-sort the stack, so there is no per-frame z-index management, and the loop parks offscreen.",
    ],
  },
  "glass-refraction-panel": {
    usage: `import { GlassRefractionPanel } from "@/components/motiq/glass-refraction-panel";

<GlassRefractionPanel
  layers={[{ id: "stat", node: <InstallStat />, depth: 26, position: { top: "13%", left: "8%" } }]}
  blur={16}
>
  <h3>Everything ships free</h3>
  <p>The full Motiq catalog is open source and yours to keep.</p>
</GlassRefractionPanel>`,
    api: [
      { prop: "children", type: "ReactNode", def: "-", desc: "Content of the main (front) glass pane." },
      { prop: "layers", type: "{ id, node, depth?, position? }[]", def: "[]", desc: "Extra floating glass panes, each with its own parallax depth in px and percentage placement." },
      { prop: "scene / seed", type: "\"orbs\" | \"none\" / number", def: "\"orbs\" / 1", desc: "The live canvas scene behind the glass, and the deterministic seed for its orb phases (SSR-stable)." },
      { prop: "blur / tint", type: "number / string", def: "16 / -", desc: "Backdrop blur radius in px, and a glass fill override (any CSS color)." },
      { prop: "parallax / spring", type: "number / { stiffness, damping }", def: "1 / { 110, 21 }", desc: "Depth multiplier (0 disables parallax) and the critically damped spring (ζ≈1.0) each pane rides." },
      { prop: "mainDepth / paneWidth / minHeight", type: "number / string / number", def: "16 / \"min(340px, 82%)\" / 380", desc: "Depth, width and panel height. The panel itself is always fluid; only the inner pane has a width." },
      { prop: "streakOnEnter", type: "boolean", def: "true", desc: "Sweep a rotated specular band across the main pane on every viewport entry, delayed 180ms." },
      { prop: "pauseWhenHidden / reducedMotion", type: "boolean", def: "true / -", desc: "Offscreen/tab-hidden pause, and force one static orb frame with parallax and streak disabled." },
    ],
    accessibility: [
      "The scene canvas and the specular streak are aria-hidden; every real element lives in the DOM layers with normal semantics and focus order.",
      "Reduced motion paints a single static orb frame, parks all panes at zero offset and never sweeps the streak - the glass treatment itself carries the design.",
      "The canvas palette is read from theme tokens and re-read live on a prefers-color-scheme change or a data-theme/class swap, so the scene stays legible in both themes.",
      "Under forced colors the canvas and streak are hidden and the panes fall back to solid Canvas/CanvasText surfaces.",
    ],
    performance: [
      "One canvas plus one requestAnimationFrame loop, with the device pixel ratio capped at 2x so retina displays never over-render.",
      "Layer motion is translate3d-only and the backdrop blur cost is paid once per pane by the compositor.",
      "The orb loop pauses offscreen or when the tab is hidden; the entrance streak runs as a one-shot CSS animation rather than in JS.",
    ],
  },
  "aurora-panel": {
    usage: `import { AuroraPanel } from "@/components/motiq/aurora-panel";

<AuroraPanel roofHeight={210} ribbons={3} speed={1} overlay={<Badge>Live surface</Badge>}>
  <h3>aurora-panel</h3>
  <p>A contained sky for cards, not another full-page background.</p>
</AuroraPanel>`,
    api: [
      { prop: "children / overlay", type: "ReactNode", def: "-", desc: "Card body below the roof, and a badge slot pinned to the roof itself." },
      { prop: "roofHeight / ribbons", type: "number", def: "210 / 3", desc: "Roof height in px, and the ribbon count (clamped 2-5)." },
      { prop: "colors / intensity", type: "string[] / number", def: "theme / 1", desc: "Ribbon colors front to back (defaults to the theme cyan/azure pair) and an opacity multiplier (0-1.6)." },
      { prop: "speed", type: "number", def: "1", desc: "Time multiplier for the ribbon drift; 0 freezes the sky on a hand-tuned frame." },
      { prop: "lean / grain", type: "boolean / number", def: "true / 0.4", desc: "Pointer lean over the roof, and the grain overlay opacity (0-1)." },
      { prop: "seed", type: "number", def: "1", desc: "Deterministic seed for the grain tile and the star field (SSR-stable)." },
      { prop: "pauseWhenHidden / reducedMotion", type: "boolean", def: "true / -", desc: "Offscreen/tab-hidden pause, and force the still sky regardless of system preference." },
    ],
    accessibility: [
      "The roof canvas, the grain tile and the bottom fade are decorative and aria-hidden; the card body below is plain DOM with normal semantics.",
      "Reduced motion (and speed={0}) paints a single hand-tuned frame and never starts the loop - the roof reads as a still sky.",
      "touch-action: pan-y on the roof keeps mobile scrolling intact while the pointer lean still tracks horizontally.",
      "Sky, ribbon and star colors resolve from theme tokens and re-resolve on a theme change, so the roof is designed in both light and dark.",
    ],
    performance: [
      "Ribbon paths sample every 8px (~60 points each), so the per-frame cost is trivial; the expensive softening is a single CSS blur done once on the compositor.",
      "One canvas, one requestAnimationFrame loop, device pixel ratio capped at 2x, and the grain tile is generated once from a seeded PRNG.",
      "IntersectionObserver plus visibilitychange park the loop offscreen or in a hidden tab.",
    ],
  },
```

## previews index

```tsx
import { HoloCardPreview } from "./holo-card";
import { BorderBeamPanelPreview } from "./border-beam-panel";
import { CardStackDeckPreview } from "./card-stack-deck";
import { GlassRefractionPanelPreview } from "./glass-refraction-panel";
import { AuroraPanelPreview } from "./aurora-panel";
```

```tsx
  "holo-card": HoloCardPreview,
  "border-beam-panel": BorderBeamPanelPreview,
  "card-stack-deck": CardStackDeckPreview,
  "glass-refraction-panel": GlassRefractionPanelPreview,
  "aurora-panel": AuroraPanelPreview,
```

## registry tsconfig / vitest aliases

Not required — none of these five import another registry component (only `@/lib/utils` and `@/lib/motiq`), so no new `@/components/motiq/*` alias entries are needed in `packages/registry/tsconfig.json` or `vitest.config.ts`.

## verification

Run from `packages/registry`:

- `npx vitest run registry/creative` → **5 files, 35 tests, all passing** (holo-card 7, border-beam-panel 7, card-stack-deck 8, glass-refraction-panel 6, aurora-panel 7). jsdom logs "Not implemented: HTMLCanvasElement.prototype.getContext" for the two canvas components — expected noise; both guard the null context.
- `npx tsc -p tsconfig.json --noEmit` → **clean, no output.**
- `npx tsc --noEmit -p tsconfig.consumer-strict.json` → one **pre-existing** error only: `registry/text/split-flap.tsx(475,20): error TS6133: 'row' is declared but its value is never read.` None of the five new files appear.

Run from `apps/docs`:

- `npx tsc -p tsconfig.json --noEmit` → **clean, no output** (with the five new preview files present; the docs build/dev server was not run, per brief).
