# Pointer Alchemy wiring

Batch 07 · registry dir `packages/registry/registry/cursor` (new `cursor` category).
Source of truth: `artifacts/motion-lab-showpieces/01-pointer-alchemy.html`.

Files delivered:

- `packages/registry/registry/cursor/{magnetic-dock,cursor-comet,lens-card,torch-reveal,gooey-actions}.tsx`
- `packages/registry/registry/cursor/{…}.test.tsx` (5 files, 36 tests)
- `apps/docs/app/_previews/{magnetic-dock,cursor-comet,lens-card,torch-reveal,gooey-actions}.tsx`

## registry.json items

```json
    {
      "name": "magnetic-dock",
      "type": "registry:component",
      "title": "Magnetic Dock",
      "description": "A launcher dock whose icons live inside one shared gaussian attraction field instead of per-icon hover states, so neighbours cascade and the bar reads as liquid under a magnet. Influence drives scale, lift and lateral drift springs; a label chip springs to the dominant icon; a virtual pointer sweeps the bar at idle. Transform-only, offscreen-paused, reduced-motion hover fallback.",
      "dependencies": [],
      "registryDependencies": [
        "@motiq/utils",
        "@motiq/primitives"
      ],
      "files": [
        {
          "path": "registry/cursor/magnetic-dock.tsx",
          "type": "registry:component",
          "target": "components/motiq/magnetic-dock.tsx"
        }
      ],
      "meta": {
        "category": "cursor",
        "tier": "free",
        "signature": false,
        "keywords": [
          "dock",
          "cursor",
          "pointer",
          "magnetic",
          "spring",
          "nav",
          "launcher",
          "hover"
        ]
      }
    },
    {
      "name": "cursor-comet",
      "type": "registry:component",
      "title": "Cursor Comet",
      "description": "A canvas particle comet that reads pointer velocity, not just position: a tight ember when you drift, a long azure-to-cyan plume with coral sparks when you flick. Idle, the particles coil into an ambient orbit ring. Fixed particle pool, pre-rendered sprites with additive blending, DPR capped at 2x, one rAF loop, offscreen-paused, static orbit frame under reduced motion.",
      "dependencies": [],
      "registryDependencies": [
        "@motiq/utils",
        "@motiq/primitives"
      ],
      "files": [
        {
          "path": "registry/cursor/cursor-comet.tsx",
          "type": "registry:component",
          "target": "components/motiq/cursor-comet.tsx"
        }
      ],
      "meta": {
        "category": "cursor",
        "tier": "free",
        "signature": false,
        "keywords": [
          "cursor",
          "trail",
          "particles",
          "canvas",
          "comet",
          "velocity",
          "hero",
          "decorative"
        ]
      }
    },
    {
      "name": "lens-card",
      "type": "registry:component",
      "title": "Lens Card",
      "description": "A refraction lens that floats over your own content: everything under the glass magnifies with a chromatic fringe while the background grid physically bends around the rim. A duplicated scaled clone clipped by a moving circle() - no filters, no repaint storms - with a spring-lagged centre that drifts on its own when unattended. Clones are aria-hidden, so AT reads the content once.",
      "dependencies": [],
      "registryDependencies": [
        "@motiq/utils",
        "@motiq/primitives"
      ],
      "files": [
        {
          "path": "registry/cursor/lens-card.tsx",
          "type": "registry:component",
          "target": "components/motiq/lens-card.tsx"
        }
      ],
      "meta": {
        "category": "cursor",
        "tier": "free",
        "signature": false,
        "keywords": [
          "lens",
          "magnifier",
          "refraction",
          "cursor",
          "pointer",
          "dashboard",
          "clip-path",
          "canvas"
        ]
      }
    },
    {
      "name": "torch-reveal",
      "type": "registry:component",
      "title": "Torch Reveal",
      "description": "A finished hero with a second layer hiding above it: a soft, flickering torch around the pointer uncovers a blueprint twin, a wireframe, or a before/after render. The reveal is a CSS alpha mask driven by three custom properties per frame (never an SVG luminance mask, which silently no-ops in Chromium). Springs after the pointer, patrols a Lissajous path at idle, and degrades to a static split view.",
      "dependencies": [],
      "registryDependencies": [
        "@motiq/utils",
        "@motiq/primitives"
      ],
      "files": [
        {
          "path": "registry/cursor/torch-reveal.tsx",
          "type": "registry:component",
          "target": "components/motiq/torch-reveal.tsx"
        }
      ],
      "meta": {
        "category": "cursor",
        "tier": "free",
        "signature": false,
        "keywords": [
          "torch",
          "flashlight",
          "reveal",
          "mask",
          "cursor",
          "hero",
          "blueprint",
          "before after"
        ]
      }
    },
    {
      "name": "gooey-actions",
      "type": "registry:component",
      "title": "Gooey Actions",
      "description": "A floating action button that blooms into satellite actions through a gooey metaball merge - blur plus alpha contrast under the hood - with underdamped springs (~18% overshoot, 45ms stagger) and per-satellite magnetic hover. Crisp icons ride an unfiltered twin layer sharing the same transforms. Real buttons with menu semantics, roving focus, and Escape-to-close; instant fade under reduced motion.",
      "dependencies": [],
      "registryDependencies": [
        "@motiq/utils",
        "@motiq/primitives"
      ],
      "files": [
        {
          "path": "registry/cursor/gooey-actions.tsx",
          "type": "registry:component",
          "target": "components/motiq/gooey-actions.tsx"
        }
      ],
      "meta": {
        "category": "cursor",
        "tier": "free",
        "signature": false,
        "keywords": [
          "fab",
          "speed dial",
          "gooey",
          "metaball",
          "actions",
          "menu",
          "spring",
          "svg filter"
        ]
      }
    },
```

## catalog.ts entries

```ts
  {
    id: "magnetic-dock",
    name: "Magnetic Dock",
    slug: "magnetic-dock",
    description:
      "A launcher dock whose icons share one gaussian attraction field instead of per-icon hover states - neighbours cascade, the bar drifts like liquid under a magnet, and a label chip springs to the dominant icon. Idle sweep, keyboard parity, reduced-motion hover fallback.",
    category: "cursor",
    subcategory: "Cursor & pointer",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["dock", "cursor", "pointer", "magnetic", "spring", "nav", "launcher", "hover"],
    registryItem: "magnetic-dock",
    documentationPath: "/components/magnetic-dock",
    dateAdded: "2026-07-28",
    featured: false,
    supportsDarkMode: true,
    supportsReducedMotion: true,
    requiresClient: true,
    animationEngine: "css",
    stage: "interactive",
    complexity: "medium",
    releaseStatus: "released",
  },
  {
    id: "cursor-comet",
    name: "Cursor Comet",
    slug: "cursor-comet",
    description:
      "A canvas particle comet that reads pointer velocity: a tight ember when you drift, a long azure-to-cyan plume with coral sparks when you flick, and an ambient orbit ring when you leave. Fixed pool, additive sprites, DPR-capped, offscreen-paused.",
    category: "cursor",
    subcategory: "Cursor & pointer",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["cursor", "trail", "particles", "canvas", "comet", "velocity", "hero", "decorative"],
    registryItem: "cursor-comet",
    documentationPath: "/components/cursor-comet",
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
  {
    id: "lens-card",
    name: "Lens Card",
    slug: "lens-card",
    description:
      "A refraction lens over your own content: 1.35x magnification with a chromatic fringe and a background grid that physically bends around the rim. Clipped clone plus transform - compositor-side, no filters - with spring lag and an idle drift.",
    category: "cursor",
    subcategory: "Cursor & pointer",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["lens", "magnifier", "refraction", "cursor", "pointer", "dashboard", "clip-path", "canvas"],
    registryItem: "lens-card",
    documentationPath: "/components/lens-card",
    dateAdded: "2026-07-28",
    featured: false,
    supportsDarkMode: true,
    supportsReducedMotion: true,
    requiresClient: true,
    animationEngine: "css",
    stage: "canvas",
    complexity: "high",
    releaseStatus: "released",
  },
  {
    id: "torch-reveal",
    name: "Torch Reveal",
    slug: "torch-reveal",
    description:
      "A two-layer hero where a soft, flickering torch around the pointer uncovers the layer hiding above it - a blueprint twin, a wireframe, a before/after render. CSS alpha mask driven by custom properties, spring-lagged carry, idle patrol, static split view under reduced motion.",
    category: "cursor",
    subcategory: "Cursor & pointer",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["torch", "flashlight", "reveal", "mask", "cursor", "hero", "blueprint", "before after"],
    registryItem: "torch-reveal",
    documentationPath: "/components/torch-reveal",
    dateAdded: "2026-07-28",
    featured: false,
    supportsDarkMode: true,
    supportsReducedMotion: true,
    requiresClient: true,
    animationEngine: "css",
    stage: "interactive",
    complexity: "medium",
    releaseStatus: "released",
  },
  {
    id: "gooey-actions",
    name: "Gooey Actions",
    slug: "gooey-actions",
    description:
      "A floating action button that blooms into satellite actions through a gooey metaball merge, with underdamped springs, 45ms stagger, and magnetic satellite hover. Crisp icons stay outside the filter. Real buttons, menu semantics, roving focus, Escape to close.",
    category: "cursor",
    subcategory: "Cursor & pointer",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["fab", "speed dial", "gooey", "metaball", "actions", "menu", "spring", "svg filter"],
    registryItem: "gooey-actions",
    documentationPath: "/components/gooey-actions",
    dateAdded: "2026-07-28",
    featured: false,
    supportsDarkMode: true,
    supportsReducedMotion: true,
    requiresClient: true,
    animationEngine: "css",
    stage: "interactive",
    complexity: "high",
    releaseStatus: "released",
  },
```

## presentation map

```ts
  // Pointer alchemy — the effect IS the product, so give it the stage.
  "magnetic-dock": { previewSize: "full", stageFamily: "creative", cardSpan: 12 },
  "cursor-comet": { previewSize: "full", stageFamily: "creative", cardSpan: 12 },
  "lens-card": { previewSize: "full", stageFamily: "creative", cardSpan: 12 },
  "torch-reveal": { previewSize: "full", stageFamily: "creative", cardSpan: 12 },
  "gooey-actions": { previewSize: "wide", stageFamily: "creative", cardSpan: 8 },
```

## docs-content entries

```ts
  "magnetic-dock": {
    usage: `import { MagneticDock } from "@/components/motiq/magnetic-dock";

<MagneticDock
  items={[
    { id: "compose", label: "Compose", icon: <ComposeIcon /> },
    { id: "search", label: "Search", icon: <SearchIcon /> },
  ]}
  magnetRadius={78}
  onSelect={(id) => launch(id)}
/>`,
    api: [
      { prop: "items", type: "DockItem[]", def: "-", desc: "Each item is { id, label, icon?, tint? }. The label is the accessible name and the tooltip text; tint overrides the built-in gradient ramp." },
      { prop: "magnetRadius", type: "number", def: "78", desc: "Sigma of the shared gaussian field, in px. Larger values widen the cascade across neighbours." },
      { prop: "maxScale / lift", type: "number", def: "1.95 / 40", desc: "Scale of the icon directly under the pointer, and its peak vertical lift in px." },
      { prop: "stiffness / damping", type: "number", def: "420 / 26", desc: "Scale-spring constants (zeta about 0.63). Lift and drift springs are tuned relative to these." },
      { prop: "idleWave", type: "boolean", def: "true", desc: "Sweeps a virtual pointer across the bar at 42% strength when nothing is hovering, so the dock breathes on load." },
      { prop: "tooltip", type: "boolean", def: "true", desc: "Spring-chased label chip above the dominant icon (appears past 0.55 influence)." },
      { prop: "onSelect", type: "(id: string) => void", def: "-", desc: "Fired when an icon is activated by click, Enter, or Space." },
      { prop: "seed / pauseWhenHidden / reducedMotion", type: "misc", def: "1 / true / -", desc: "Deterministic idle phase (SSR-stable), offscreen + tab-hidden pause, and force-static regardless of system preference." },
    ],
    accessibility: [
      "Every icon is a real <button> with the item label as its accessible name, so the dock is fully operable by keyboard and reported correctly by assistive tech.",
      "Keyboard parity: a focused icon bends the field exactly like a hover, so Tab users see the same swell, lift, and label chip that pointer users get.",
      "Respects prefers-reduced-motion and the reducedMotion prop: the springs stop and each icon keeps a 120ms CSS hover/focus lift, so the affordance survives without any tracking.",
      "The tooltip chip is decorative and aria-hidden - it only mirrors the label already on the focused button - and icons are 52px targets, well past the 24px minimum.",
    ],
    performance: [
      "One requestAnimationFrame loop per dock with delta-time springs and substeps, driving transform only - no per-frame React state and no layout writes.",
      "Base icon centres are cached from offsetLeft/offsetTop, which ignore transforms, so a scaled icon can never feed back into the field it samples.",
      "Pauses when scrolled offscreen or the tab is hidden (IntersectionObserver + visibilitychange) and re-measures through a ResizeObserver, not on every frame.",
      "Pointer events cover mouse, pen and touch; touch-action: pan-y keeps the page scrollable while a finger sweeps the dock.",
    ],
  },
  "cursor-comet": {
    usage: `import { CursorComet } from "@/components/motiq/cursor-comet";

<CursorComet sparkThreshold={900} seed={7} className="rounded-2xl">
  <YourHeroContent />
</CursorComet>`,
    api: [
      { prop: "children", type: "ReactNode", def: "-", desc: "The region the comet paints over. Content stays fully interactive - the canvas never receives pointer events." },
      { prop: "particleBudget", type: "number", def: "240", desc: "Fixed pool size (clamped 24-800). Particles are recycled, so no allocation happens per frame." },
      { prop: "velocityGain / drag", type: "number", def: "0.22 / 2.2", desc: "Fraction of pointer velocity each particle inherits (reversed), and the exponential drag coefficient per second." },
      { prop: "headColor / tailColor / sparkColor", type: "string", def: "accent / secondary / signature", desc: "Any CSS color; token values are resolved against this component's own theme scope and re-read on theme changes." },
      { prop: "sparkThreshold", type: "number", def: "900", desc: "Pointer speed in px/s above which coral ionization sparks fire at the head." },
      { prop: "idleOrbit", type: "boolean", def: "true", desc: "Coils the particles into a 62px orbit ring around a wandering virtual head when the pointer is away." },
      { prop: "seed / pauseWhenHidden / reducedMotion", type: "misc", def: "1 / true / -", desc: "Deterministic jitter (SSR-stable markup), offscreen + tab-hidden pause, and force-static regardless of system preference." },
    ],
    accessibility: [
      "Purely decorative: the canvas is aria-hidden and pointer-events-none, so assistive tech skips it and the wrapped content stays clickable and focusable.",
      "Respects prefers-reduced-motion and the reducedMotion prop: renders a single static frame - an orbit ring of glow dots - redrawn only on resize, never looping.",
      "Carries no information by colour or motion alone; removing the effect entirely leaves the underlying content unchanged.",
      "Pointer handling covers mouse, pen and touch, and touch-action: pan-y keeps the page scrollable while a finger drags the comet.",
    ],
    performance: [
      "One <canvas> and one requestAnimationFrame loop with delta-time integration - no per-frame React state, no WebGL.",
      "Fixed particle pool (no GC churn) drawn from four pre-rendered 64px radial-gradient sprites with 'lighter' compositing, instead of per-particle gradients or shadowBlur.",
      "Device-pixel-ratio capped at 2x, and the canvas is re-measured through a ResizeObserver rather than per frame.",
      "Sprites are rebuilt only when the resolved token colours actually change (checked twice a second), and the loop hard-stops when scrolled offscreen or the tab is hidden.",
    ],
  },
  "lens-card": {
    usage: `import { LensCard } from "@/components/motiq/lens-card";

<LensCard magnification={1.35} chromatic={2.2} radius={104}>
  <YourMetricGrid />
</LensCard>`,
    api: [
      { prop: "children", type: "ReactNode", def: "-", desc: "The content under the glass - text, charts, images, code all work, since the lens is a clipped clone, not a filter." },
      { prop: "radius / magnification", type: "number", def: "104 / 1.35", desc: "Lens radius in px and the optical magnification of the clipped clone." },
      { prop: "chromatic", type: "number", def: "2.2", desc: "Chromatic fringe offset in px (a second clone, hue-rotated and blended). 0 removes the dispersion layer entirely." },
      { prop: "lag", type: "{ stiffness, damping }", def: "{ 300, 27 }", desc: "Follow spring for the lens centre - about 90ms of lag, which is what sells the glass having mass." },
      { prop: "gridBend", type: "boolean", def: "true", desc: "Draws the canvas grid whose lines displace radially around the lens rim (gaussian, sigma 60px, 16px amplitude)." },
      { prop: "idleDrift / showRing", type: "boolean", def: "true / true", desc: "Slow two-frequency orbit when the pointer is away, and the rim highlight ring." },
      { prop: "seed / pauseWhenHidden / reducedMotion", type: "misc", def: "1 / true / -", desc: "Deterministic drift phase (SSR-stable), offscreen + tab-hidden pause, and force-static regardless of system preference." },
    ],
    accessibility: [
      "The magnified and chromatic layers are clones of your content: both are aria-hidden and pointer-events-none, so assistive tech reads the base layer exactly once and base content stays clickable.",
      "Respects prefers-reduced-motion and the reducedMotion prop: the lens parks centre-stage as a still magnifier - the zoom affordance remains, the chase does not.",
      "The lens adds no information of its own; every value it magnifies is already legible in the base layer at full contrast.",
      "Pointer handling covers mouse, pen and touch, and touch-action: pan-y keeps the page scrollable while a finger carries the lens.",
    ],
    performance: [
      "clip-path plus transform are compositor-side in Chromium; the only CPU work is the grid canvas (about 90 warped polylines) on a single delta-time rAF loop.",
      "The optical trick is translate = (1 - scale) x lens on a scaled clone, so the point under the lens centre stays fixed with no filters and no repaint storms.",
      "Device-pixel-ratio capped at 2x, with resize handled by a ResizeObserver rather than per frame.",
      "Pauses when scrolled offscreen or the tab is hidden, and renders a single parked frame instead of looping under reduced motion.",
    ],
  },
  "torch-reveal": {
    usage: `import { TorchReveal } from "@/components/motiq/torch-reveal";

<TorchReveal
  front={<FinishedHero />}
  reveal={<BlueprintTwin />}
  radius={175}
  reducedFallback="split"
/>`,
    api: [
      { prop: "front", type: "ReactNode", def: "-", desc: "The finished, always-readable layer. It sits in flow and defines the component's height." },
      { prop: "reveal", type: "ReactNode", def: "-", desc: "The layer the torch uncovers - a blueprint twin, wireframe, or before/after render. Decorative by contract." },
      { prop: "radius / softness", type: "number", def: "175 / 0.48", desc: "Torch radius in px, and 0-1 edge softness (softness maps to the opaque core stop of the mask gradient)." },
      { prop: "flicker", type: "number", def: "0.35", desc: "0-1 flame flicker: two incommensurate sines (9Hz and 23Hz). 0 holds a perfectly steady beam." },
      { prop: "lag", type: "{ stiffness, damping }", def: "{ 260, 24 }", desc: "Follow spring - just enough lag that the torch feels hand-held rather than parented to the cursor." },
      { prop: "idlePatrol", type: "boolean", def: "true", desc: "Patrols a Lissajous path across the hero when the pointer is away, so the story tells itself." },
      { prop: "reducedFallback", type: '"split" | "off"', def: '"split"', desc: 'Static presentation when motion is off: a 55/45 comparison with a dashed divider, or hide the reveal layer.' },
      { prop: "revealClassName / seed / pauseWhenHidden / reducedMotion", type: "misc", def: "- / 1 / true / -", desc: "Classes for the reveal wrapper (it paints an opaque backdrop by default), deterministic patrol phase, offscreen pause, and force-static." },
    ],
    accessibility: [
      "The reveal twin is aria-hidden and pointer-events-none - the readable hero is always the front layer, torch or no torch, so nothing is gated behind pointer movement.",
      "Respects prefers-reduced-motion and the reducedMotion prop: swaps to a static 55/45 split with a dashed divider (or hides the twin), so the two-layer story survives without tracking.",
      "Interactive elements inside the front layer keep their own focus and semantics; the mask layer never intercepts events.",
      "Pointer handling covers mouse, pen and touch, and touch-action: pan-y keeps the page scrollable while a finger carries the torch.",
    ],
    performance: [
      "The reveal uses a CSS alpha mask (radial-gradient) whose centre and radius live in custom properties, so JS writes three numbers per frame and never a new layout.",
      "Alpha masks only, deliberately: SVG luminance masks with gradient content are a silent no-op in Chromium, which is why they are not used here.",
      "One delta-time requestAnimationFrame loop per instance; the glow halo animates with transform alone on a composited layer.",
      "Pauses when scrolled offscreen or the tab is hidden, and never starts the loop at all in the static path.",
    ],
  },
  "gooey-actions": {
    usage: `import { GooeyActions } from "@/components/motiq/gooey-actions";

<GooeyActions
  actions={[
    { id: "reply", label: "Reply", icon: <ReplyIcon /> },
    { id: "star", label: "Star", icon: <StarIcon /> },
  ]}
  onSelect={(id) => run(id)}
/>`,
    api: [
      { prop: "actions", type: "GooeyAction[]", def: "-", desc: "Each action is { id, label, icon? }. Three to six read best in the arc; the label is the accessible name and the hover/focus chip." },
      { prop: "radius / arc", type: "number / [number, number]", def: "118 / [-160, -20]", desc: "Distance from the core in px, and the degrees the satellites spread across (-90 is straight up)." },
      { prop: "stagger", type: "number", def: "45", desc: "Per-satellite launch delay in ms - the goo stretches, necks, then snaps free." },
      { prop: "stiffness / damping", type: "number", def: "230 / 13", desc: "Bloom springs, deliberately underdamped (zeta about 0.43, roughly 18% overshoot)." },
      { prop: "magnetRange", type: "number", def: "52", desc: "Pointer distance in px within which a satellite leans up to 35% of the gap toward the cursor and scales to 1.16." },
      { prop: "open / defaultOpen / onOpenChange", type: "boolean / boolean / fn", def: "- / false / -", desc: "Controlled or uncontrolled bloom state; the callback fires with the resolved value." },
      { prop: "onSelect / label", type: "(id: string) => void / string", def: '- / "Actions"', desc: "Commit callback for a satellite, and the accessible name of the core button and its menu." },
      { prop: "autoPeek / seed / pauseWhenHidden / reducedMotion", type: "misc", def: "true / 1 / true / -", desc: "Tease the bloom every ~7s until first interaction, deterministic ember phase, offscreen pause, and force-static." },
    ],
    accessibility: [
      "The core is a real button with aria-haspopup and aria-expanded pointing at a role=menu; satellites are role=menuitem buttons with roving tabindex, so exactly one is tabbable while open.",
      "Arrow keys, Home and End move focus between satellites; Escape closes the dial and returns focus to the core, and committing an action does the same.",
      "While closed the satellites are disabled and the menu is aria-hidden, so they are neither tabbable nor announced; opening with Enter or Space moves focus into the menu, opening with a click does not.",
      "Respects prefers-reduced-motion and the reducedMotion prop: the goo look stays but the dial opens instantly with a fade - no springs, no orbiting embers. Targets are 46px and 74px, well past the 24px minimum.",
    ],
    performance: [
      "One SVG filter (blur + alpha contrast) over a single fixed-size offscreen surface; blobs animate with transforms only, so the blur re-runs but nothing re-lays-out.",
      "Icons live on an unfiltered twin layer that shares the same transforms, so glyphs stay crisp and never enter the filtered subtree.",
      "One delta-time requestAnimationFrame loop with substepped springs - no per-frame React state; open/close is the only state change.",
      "Pauses when scrolled offscreen or the tab is hidden, and the static path never starts the loop.",
    ],
  },
```

## previews index

```tsx
import { MagneticDockPreview } from "./magnetic-dock";
import { CursorCometPreview } from "./cursor-comet";
import { LensCardPreview } from "./lens-card";
import { TorchRevealPreview } from "./torch-reveal";
import { GooeyActionsPreview } from "./gooey-actions";
```

```tsx
  "magnetic-dock": MagneticDockPreview,
  "cursor-comet": CursorCometPreview,
  "lens-card": LensCardPreview,
  "torch-reveal": TorchRevealPreview,
  "gooey-actions": GooeyActionsPreview,
```

## Orchestrator notes

- `cursor` is a NEW category. It needs a `CATEGORY_PRESENTATION["cursor"]` default and a category label ("Cursor & pointer") wherever categories are enumerated (catalog nav, hero pickers, category types).
- Registry source imports `@/lib/motiq` (the alias that actually exists in `packages/registry/tsconfig.json` + `vitest.config.ts` and that every other component uses), not `@/lib/motion`.
- No new tsconfig path aliases are required: these components import only `@/lib/utils` and `@/lib/motiq`. Previews import `@/registry/cursor/<name>`, which the existing `@/registry/*` alias already covers.

## verification

```
$ cd packages/registry && npx vitest run registry/cursor
 ✓ registry/cursor/cursor-comet.test.tsx   (7 tests)
 ✓ registry/cursor/lens-card.test.tsx      (7 tests)
 ✓ registry/cursor/torch-reveal.test.tsx   (7 tests)
 ✓ registry/cursor/magnetic-dock.test.tsx  (7 tests)
 ✓ registry/cursor/gooey-actions.test.tsx  (8 tests)
 Test Files  5 passed (5)
      Tests  36 passed (36)

$ cd packages/registry && npx tsc -p tsconfig.json --noEmit
registry/scroll/mask-wipe-sections.tsx(374,21): error TS1003: Identifier expected.
registry/scroll/mask-wipe-sections.tsx(388,17): error TS17002: Expected corresponding JSX closing tag for 'React.Fragment'.
# ^ pre-existing, unrelated to this batch (registry/scroll). Zero errors in registry/cursor.

$ cd apps/docs && npx tsc -p tsconfig.json --noEmit
# clean — no output (the 5 new previews typecheck against the real component props).
```

The docs app build and dev server were deliberately NOT run (integration is the orchestrator's step).
