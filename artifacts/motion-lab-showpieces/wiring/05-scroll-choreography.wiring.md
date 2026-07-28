# Scroll Choreography wiring

Batch 07 · prototype `artifacts/motion-lab-showpieces/05-scroll-choreography.html`.
Five components in the new registry dir `registry/scroll/`, category `scroll`
(the `CategoryId` union and the `categories` list already contain `"scroll"` — no
change needed there).

## registry.json items

Append these five objects to `items` in `packages/registry/registry.json`.

```json
{
  "name": "sticky-zoom-hero",
  "type": "registry:component",
  "title": "Sticky Zoom Hero",
  "description": "The opening move of a product page: a framed hero card held at arm's length scales to full bleed as you scroll, the corner radius closes to 0, the vignette lifts, and captions crossfade through the beats. One rAF loop, getBoundingClientRect progress smoothed through an exponential lerp, transform + opacity only; page or container scroll mode, SSR-settled markup, reduced-motion static layout.",
  "dependencies": [],
  "registryDependencies": [
    "@motiq/utils",
    "@motiq/primitives"
  ],
  "files": [
    {
      "path": "registry/scroll/sticky-zoom-hero.tsx",
      "type": "registry:component",
      "target": "components/motiq/sticky-zoom-hero.tsx"
    }
  ],
  "meta": {
    "category": "scroll",
    "tier": "free",
    "signature": false,
    "keywords": [
      "scroll",
      "hero",
      "zoom",
      "sticky",
      "parallax",
      "storytelling",
      "product"
    ]
  }
},
{
  "name": "depth-parallax-scene",
  "type": "registry:component",
  "title": "Depth Parallax Scene",
  "description": "A world behind the glass: consumer-supplied layers travel at depth-proportional rates as the scene passes through the viewport and drift subtly with the pointer, while the far layers slip out of focus as the near ones pass. translate3d only, quantized depth-of-field blur, one rAF loop, no scroll container in page mode, reduced-motion frozen composition.",
  "dependencies": [],
  "registryDependencies": [
    "@motiq/utils",
    "@motiq/primitives"
  ],
  "files": [
    {
      "path": "registry/scroll/depth-parallax-scene.tsx",
      "type": "registry:component",
      "target": "components/motiq/depth-parallax-scene.tsx"
    }
  ],
  "meta": {
    "category": "scroll",
    "tier": "free",
    "signature": false,
    "keywords": [
      "scroll",
      "parallax",
      "depth",
      "layers",
      "pointer",
      "depth of field",
      "hero"
    ]
  }
},
{
  "name": "mask-wipe-sections",
  "type": "registry:component",
  "title": "Mask Wipe Sections",
  "description": "Chaptered storytelling with hard cuts instead of crossfades: each section is revealed by a scroll-driven clip-path wipe - an angled sweep, an expanding iris, or a centre-split curtain - led by a lit accent edge. The iris ring is an SVG circle whose radius animates, so the stroke hugs the clip edge at constant width. Reduced motion collapses the sticky stack into plain stacked sections.",
  "dependencies": [],
  "registryDependencies": [
    "@motiq/utils",
    "@motiq/primitives"
  ],
  "files": [
    {
      "path": "registry/scroll/mask-wipe-sections.tsx",
      "type": "registry:component",
      "target": "components/motiq/mask-wipe-sections.tsx"
    }
  ],
  "meta": {
    "category": "scroll",
    "tier": "free",
    "signature": false,
    "keywords": [
      "scroll",
      "clip-path",
      "wipe",
      "iris",
      "curtain",
      "chapters",
      "storytelling"
    ]
  }
},
{
  "name": "scroll-count-stats",
  "type": "registry:component",
  "title": "Scroll Count Stats",
  "description": "A stats band that is a pure function of scroll progress, so scrolling back rewinds it digit by digit instead of counting once and going inert. Per-digit odometer columns roll with stagger and a small overshoot, the coral signature underline draws itself, and sparklines trace in. Fixed-height column crops, tabular-nums, true values always in the accessible tree.",
  "dependencies": [],
  "registryDependencies": [
    "@motiq/utils",
    "@motiq/primitives"
  ],
  "files": [
    {
      "path": "registry/scroll/scroll-count-stats.tsx",
      "type": "registry:component",
      "target": "components/motiq/scroll-count-stats.tsx"
    }
  ],
  "meta": {
    "category": "scroll",
    "tier": "free",
    "signature": false,
    "keywords": [
      "scroll",
      "stats",
      "counter",
      "odometer",
      "scrub",
      "sparkline",
      "metrics"
    ]
  }
},
{
  "name": "velocity-skew-feed",
  "type": "registry:component",
  "title": "Velocity Skew Feed",
  "description": "A feed whose cards shear and stretch with scroll velocity and rubber-snap back when you stop. Smoothed velocity drives a real spring (s\" = k(target - s) - c*s'), integrated with frame delta-time so a hard stop overshoots once and settles. Transforms only, one write per card per frame, and the loop stops writing entirely once the spring's energy falls under threshold.",
  "dependencies": [],
  "registryDependencies": [
    "@motiq/utils",
    "@motiq/primitives"
  ],
  "files": [
    {
      "path": "registry/scroll/velocity-skew-feed.tsx",
      "type": "registry:component",
      "target": "components/motiq/velocity-skew-feed.tsx"
    }
  ],
  "meta": {
    "category": "scroll",
    "tier": "free",
    "signature": false,
    "keywords": [
      "scroll",
      "velocity",
      "skew",
      "spring",
      "physics",
      "feed",
      "rubber"
    ]
  }
}
```

## catalog.ts entries

Append to `catalog` in `apps/docs/lib/catalog.ts`.

```ts
  {
    id: "sticky-zoom-hero",
    name: "Sticky Zoom Hero",
    slug: "sticky-zoom-hero",
    description:
      "A framed hero card scales from 45% to full bleed as you scroll: the corner radius closes to 0, the vignette lifts, and captions crossfade through the beats. Smoothed scroll progress, transform + opacity only, SSR-settled and reduced-motion-safe.",
    category: "scroll",
    subcategory: "Scroll animations",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["scroll", "hero", "zoom", "sticky", "parallax", "storytelling", "product"],
    registryItem: "sticky-zoom-hero",
    documentationPath: "/components/sticky-zoom-hero",
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
    id: "depth-parallax-scene",
    name: "Depth Parallax Scene",
    slug: "depth-parallax-scene",
    description:
      "Consumer-supplied layers travel at depth-proportional rates through the viewport and drift with the pointer, while the far layers slip out of focus as the near ones pass. translate3d only, quantized depth-of-field, no scroll container in page mode.",
    category: "scroll",
    subcategory: "Scroll animations",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["scroll", "parallax", "depth", "layers", "pointer", "depth of field", "hero"],
    registryItem: "depth-parallax-scene",
    documentationPath: "/components/depth-parallax-scene",
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
    id: "mask-wipe-sections",
    name: "Mask Wipe Sections",
    slug: "mask-wipe-sections",
    description:
      "Chapters that cut instead of crossfade: scroll-driven clip-path wipes in three styles - angled sweep, expanding iris, centre-split curtain - each led by a lit accent edge. Reduced motion collapses the sticky stack into plain stacked sections.",
    category: "scroll",
    subcategory: "Scroll animations",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["scroll", "clip-path", "wipe", "iris", "curtain", "chapters", "storytelling"],
    registryItem: "mask-wipe-sections",
    documentationPath: "/components/mask-wipe-sections",
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
    id: "scroll-count-stats",
    name: "Scroll Count Stats",
    slug: "scroll-count-stats",
    description:
      "A stats band scrubbed by scroll: per-digit odometer columns roll with stagger and a small overshoot, the coral signature underline draws itself, sparklines trace in - and scrolling back rewinds every bit of it. True values always in the accessible tree.",
    category: "scroll",
    subcategory: "Scroll animations",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["scroll", "stats", "counter", "odometer", "scrub", "sparkline", "metrics"],
    registryItem: "scroll-count-stats",
    documentationPath: "/components/scroll-count-stats",
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
    id: "velocity-skew-feed",
    name: "Velocity Skew Feed",
    slug: "velocity-skew-feed",
    description:
      "Cards that shear and stretch with scroll velocity and rubber-snap back at rest, driven by a real spring integrated with frame delta-time. Transforms only, one write per card per frame, and the loop sleeps once the spring settles.",
    category: "scroll",
    subcategory: "Scroll animations",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["scroll", "velocity", "skew", "spring", "physics", "feed", "rubber"],
    registryItem: "velocity-skew-feed",
    documentationPath: "/components/velocity-skew-feed",
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
```

## presentation map

Add to the presentation override map in `apps/docs/lib/catalog.ts` (~line 1988).

```ts
  // Scroll choreography — every stage needs full-width room to scroll inside.
  "sticky-zoom-hero": { previewSize: "full", stageFamily: "editorial", cardSpan: 12 },
  "depth-parallax-scene": { previewSize: "full", stageFamily: "editorial", cardSpan: 12 },
  "mask-wipe-sections": { previewSize: "full", stageFamily: "editorial", cardSpan: 12 },
  "scroll-count-stats": { previewSize: "full", stageFamily: "data", cardSpan: 12 },
  "velocity-skew-feed": { previewSize: "full", stageFamily: "console", cardSpan: 12 },
```

## docs-content entries

Add to `docsContent` in `apps/docs/lib/docs-content.ts`.

```ts
  "sticky-zoom-hero": {
    usage: `import { StickyZoomHero } from "@/components/motiq/sticky-zoom-hero";

// Page mode: a tall sticky wrapper drives the zoom from the document scroll.
<StickyZoomHero
  stages={[
    { caption: "Meet the workspace", body: "Every metric on one calm surface.", label: "framed", at: 0 },
    { caption: "Zoom into the detail", body: "The frame gives way.", label: "zooming", at: 0.34 },
    { caption: "Full bleed, full focus", body: "The border disappears.", label: "full bleed", at: 0.7 },
  ]}
  startScale={0.45}
  scrollLength={3.2}
  onStageChange={(i) => track("hero-beat", i)}
>
  <YourProductScreenshot />
</StickyZoomHero>`,
    api: [
      { prop: "children", type: "ReactNode", def: "-", desc: "The hero scene held inside the frame - a screenshot, a live UI, anything. You own it." },
      { prop: "stages", type: "StickyZoomStage[]", def: "-", desc: "{ caption, body?, label?, at? }. `at` is the 0-1 progress where the beat becomes active; it defaults to index / stages.length." },
      { prop: "scrollMode", type: '"page" | "container"', def: '"page"', desc: "Page mode drives the zoom from the document scroll with a tall sticky wrapper. Container mode gives the component its own keyboard-scrollable stage for cards and previews." },
      { prop: "startScale / scrollLength / radius", type: "number", def: "0.45 / 3.2 / 16", desc: "Resting scale of the framed card, scroll distance as a multiple of the scene height, and the corner radius at rest (it reaches 0 at full bleed)." },
      { prop: "vignette / showProgress", type: "boolean", def: "true / true", desc: "Lift a vignette off the scene as it opens, and render the progress bar + stage pills." },
      { prop: "height / smoothing", type: "number | string / number", def: "100vh (page), 540px (container) / 10", desc: "Scene height, and the progress smoothing rate (lambda per second) - higher tracks the scroll more tightly." },
      { prop: "onStageChange / label / reducedMotion", type: "misc", def: "-", desc: "Active-beat callback, the accessible name for the internal scroll region, and force-static regardless of system preference." },
      { prop: "--mk-progress / --mk-zoom", type: "CSS custom property", def: "1", desc: "Published on the scene every frame (raw progress and the eased zoom). Your children can choreograph off them in pure CSS with no React re-render." },
    ],
    accessibility: [
      "Container mode's stage is a real focusable region: arrow keys, Page Up/Down and Home/End scrub it, and the wheel is relayed to the page at both ends - the component never calls preventDefault on a wheel event, so there is no scroll jacking.",
      "Server markup is the settled scene at full size with every caption present, so the hero is complete and readable with JavaScript disabled.",
      "Reduced motion (system preference or the reducedMotion prop) pins the scene at full bleed and moves the captions into normal flow, so all beats are readable at once and the page stays plain scrollable content.",
      "The frame, glow, vignette and progress HUD are decorative and aria-hidden; only your children and the captions are in the accessible tree.",
    ],
    performance: [
      "One requestAnimationFrame loop per instance; progress is read with getBoundingClientRect inside the loop, never from a scroll event handler, so there is at most one layout read per frame.",
      "Only transform and opacity animate. The border-radius write is quantized to whole pixels, so a full pass costs at most `radius` repaints instead of one per frame.",
      "The loop pauses when the hero scrolls offscreen or the tab is hidden (IntersectionObserver + visibilitychange) and is fully cancelled on unmount.",
      "Caption crossfades are CSS transitions on class-free inline styles - no React state changes per frame, and the stage callback fires only when the beat actually changes.",
    ],
  },
  "depth-parallax-scene": {
    usage: `import { DepthParallaxScene } from "@/components/motiq/depth-parallax-scene";

// Layers are yours: SVG ridges, gradients, floating cards - anything renderable.
<DepthParallaxScene
  layers={[
    { node: <Sky />, depth: 0.06 },
    { node: <FarRidge />, depth: 0.16, blurAtDepth: 2.5 },
    { node: <City />, depth: 0.32 },
    { node: <FloatingCards />, depth: 0.78 },
  ]}
  range={180}
  height={560}
  label="Layered ridge scene with floating interface cards."
/>`,
    api: [
      { prop: "layers", type: "ParallaxLayer[]", def: "-", desc: "{ node, depth, blurAtDepth? } back to front. `depth` is 0 (far, barely travels) to 1 (near, travels most); `blurAtDepth` is the max depth-of-field blur in px for that layer." },
      { prop: "scrollMode", type: '"page" | "container"', def: '"page"', desc: "Page mode reads the scene's position in the viewport and creates no scroll container at all. Container mode brackets the scene with lead-in/lead-out spacers inside its own keyboard-scrollable stage." },
      { prop: "range / pointerStrength", type: "number", def: "180 / 26", desc: "Total vertical travel in px at depth 1 across the pass, and the horizontal pointer travel in px at depth 1 (vertical is ~54% of it)." },
      { prop: "pointer / depthOfField / ambientDrift", type: "boolean", def: "true", desc: "Pointer nudge, per-layer defocus, and the idle sine drift that gives the scene life before the pointer ever enters." },
      { prop: "height / scrollLength / smoothing", type: "misc", def: "560 / 2 / 8", desc: "Scene height, container-mode pass distance as a multiple of that height, and the progress smoothing rate (lambda per second)." },
      { prop: "label / reducedMotion", type: "string / boolean", def: "-", desc: "The single accessible description for the whole scene, and force-static regardless of system preference." },
    ],
    accessibility: [
      "The scene is purely decorative: it carries one role=\"img\" with your `label`, and every layer inside it is aria-hidden - assistive tech gets one description, not six anonymous divs.",
      "Page mode adds no scroll container, so there is nothing to trap the wheel or the keyboard; container mode's stage is focusable, arrow-key scrollable and overscroll-contained.",
      "Reduced motion freezes the centred composition with zero blur and no pointer response.",
      "Server markup is the centred composition with no transforms, so the scene is complete without JavaScript.",
    ],
    performance: [
      "One requestAnimationFrame loop per instance; the scene position is measured with getBoundingClientRect inside the loop and smoothed through an exponential lerp.",
      "Layers move on translate3d only. The depth-of-field blur is quantized to 0.2px steps and written only when it changes, so a filter is never re-parsed every frame.",
      "Layers are oversized 14% on each axis, so travel never reveals an edge and no layout ever reflows.",
      "The loop pauses when the scene scrolls offscreen or the tab is hidden, and pointer listeners are removed on unmount.",
    ],
  },
  "mask-wipe-sections": {
    usage: `import { MaskWipeSections } from "@/components/motiq/mask-wipe-sections";

// The first section is the base layer; each later one wipes over it.
<MaskWipeSections
  sections={[
    { node: <Draft />, label: "draft" },
    { node: <Build />, wipe: "sweep", label: "angled sweep" },
    { node: <Ship />, wipe: "iris", origin: [78, 30], label: "iris" },
    { node: <Learn />, wipe: "curtain", label: "curtain" },
  ]}
  scrollLength={3.8}
  dwell={0.05}
  onSectionChange={setChapter}
/>`,
    api: [
      { prop: "sections", type: "WipeSection[]", def: "-", desc: "{ node, wipe?, origin?, accent?, label? }. `wipe` is \"sweep\" | \"iris\" | \"curtain\" (ignored on the first section); `origin` is the iris centre as [x%, y%]; `accent` overrides the leading-edge colour." },
      { prop: "scrollMode", type: '"page" | "container"', def: '"page"', desc: "Page mode drives the cuts from the document scroll with a tall sticky wrapper. Container mode gives the component its own keyboard-scrollable stage." },
      { prop: "scrollLength / dwell", type: "number", def: "3.8 / 0.05", desc: "Scroll distance as a multiple of the scene height, and the held beat between wipes in progress units. Windows are derived from the section count, so 3 or 6 chapters both pace evenly." },
      { prop: "edgeGlow / showProgress", type: "boolean", def: "true / true", desc: "Render the lit leading edge on each cut, and the per-wipe progress HUD." },
      { prop: "height / smoothing", type: "misc", def: "100vh (page), 540px (container) / 9", desc: "Scene height and the progress smoothing rate (lambda per second)." },
      { prop: "onSectionChange / label / reducedMotion", type: "misc", def: "-", desc: "Frontmost-chapter callback, the accessible name for the internal scroll region, and force-static regardless of system preference." },
    ],
    accessibility: [
      "Reduced motion collapses the sticky stack entirely: all chapters render as plain stacked sections with no clip-path, fully readable and scrollable in normal flow.",
      "Server markup carries no clip-path either, so every chapter is readable with JavaScript disabled; the closed state is installed in a layout effect before the first paint.",
      "Container mode's stage is a focusable, arrow-key scrollable region with overscroll-behavior: contain, and the wheel is relayed to the page at both ends rather than trapped - the component never preventDefaults.",
      "Edge glows, the iris ring and the wipe HUD are decorative and aria-hidden; chapter content is ordinary DOM you own.",
    ],
    performance: [
      "Basic-shape clip-path (polygon/circle/inset) animates on the compositor in Chromium, and only the currently active wipe's style is written each frame.",
      "The iris ring is an SVG circle whose `r` attribute animates - a bordered element scaled to the same radius thickens its border as it grows, which is exactly the artefact this avoids.",
      "One requestAnimationFrame loop per instance, progress read from layout inside the loop and smoothed through an exponential lerp; edge glows are transform + opacity only.",
      "The loop pauses offscreen or when the tab is hidden and is cancelled on unmount; the chapter callback fires only when the frontmost chapter actually changes.",
    ],
  },
  "scroll-count-stats": {
    usage: `import { ScrollCountStats } from "@/components/motiq/scroll-count-stats";

<ScrollCountStats
  title="Numbers that rewind"
  description="scroll back — the whole band unwinds"
  stats={[
    { value: 48210, label: "registry installs, trailing 90 days", sparkline: [6, 10, 8, 14, 19, 24, 31] },
    { value: "99.98", suffix: "%", label: "of scroll frames inside the 16.6 ms budget" },
    { value: 312, label: "easing-curve commits behind this batch" },
  ]}
/>`,
    api: [
      { prop: "stats", type: "CountStat[]", def: "-", desc: "{ value, label, suffix?, sparkline?, format? }. Numbers are formatted with `format` (default: deterministic comma grouping); strings pass through verbatim, so \"48,210\" and \"99.98\" keep their separators." },
      { prop: "title / description / underline", type: "misc", def: '- / - / "signature"', desc: "Band heading, the small line under it, and whether the coral signature underline draws itself beneath the heading. This underline is the only place the batch spends --color-signature." },
      { prop: "scrollMode / scrollLength", type: "misc", def: '"page" / 2.6', desc: "Page mode scrubs the band from the document scroll with a tall sticky wrapper; container mode gives it its own keyboard-scrollable stage. scrollLength is the pass distance as a multiple of the scene height." },
      { prop: "stagger / overshoot", type: "number", def: "0.055 / 0.35", desc: "Per-digit roll stagger in progress units (most significant digit first), and the overshoot past the target in rows - it passes the target and settles exactly on it." },
      { prop: "rowHeight / height / smoothing", type: "misc", def: "46 / 100vh (page), 520px (container) / 9", desc: "Odometer row height in px (it drives the numeral size), scene height, and the progress smoothing rate." },
      { prop: "showProgress / label / reducedMotion", type: "misc", def: "false / - / -", desc: "The scrub percentage readout, the accessible name for the internal scroll region, and force-static regardless of system preference." },
    ],
    accessibility: [
      "Every stat's true value is in the accessible tree as visually-hidden text next to a visible label; the rolling glyph columns are aria-hidden decoration, so a screen reader hears \"48,210 registry installs\", never thirty digits.",
      "The band is a list (role=\"list\" / \"listitem\"), so the number of stats is announced.",
      "Reduced motion and the no-JS path both rest on the final values: the resting column transform is expressed in row units, so the real number is on screen before any script runs, with the underline and sparklines fully drawn.",
      "Container mode's stage is focusable and arrow-key scrollable with overscroll-behavior: contain; the wheel is relayed at both ends rather than trapped.",
    ],
    performance: [
      "Each digit column is a fixed-height overflow crop around a 30-row strip, so a roll is one translate3d per column - no layout, no text re-measure, and glyphs can never spill into the neighbouring column.",
      "Everything is a pure function of smoothed progress, which is why reversing the scroll rewinds perfectly rather than replaying an animation.",
      "The crop height is measured once after layout and re-measured on resize (ResizeObserver), so a font or zoom change never desyncs the roll from the crop.",
      "Digits use tabular-nums so columns never shift; the single rAF loop pauses offscreen and is cancelled on unmount.",
    ],
  },
  "velocity-skew-feed": {
    usage: `import { VelocitySkewFeed } from "@/components/motiq/velocity-skew-feed";

// You own the cards; each one gets its own shear/stretch wrapper.
<VelocitySkewFeed
  items={events.map((e) => <ActivityCard key={e.id} event={e} />)}
  scrollMode="container"
  height={540}
  maxSkew={6.5}
/>`,
    api: [
      { prop: "items", type: "ReactNode[]", def: "-", desc: "The feed cards. Each one is wrapped individually, so the cards shear as separate objects rather than the list shearing as one block." },
      { prop: "scrollMode / axis / height", type: "misc", def: '"container" / "y" / 540', desc: "Container mode scrolls the feed inside its own keyboard-operable stage; page mode reacts to the document scroll and flows at its content height. `axis` switches to a horizontal rail." },
      { prop: "maxSkew / stretch / sensitivity", type: "number", def: "6.5 / 0.008 / 0.0035", desc: "Maximum shear in degrees, extra stretch along the scroll axis per degree of shear, and degrees of target shear per px/s of smoothed velocity." },
      { prop: "stiffness / damping", type: "number", def: "90 / 14", desc: "The spring the shear is integrated through. Damping below ~2·sqrt(stiffness) overshoots once on a hard stop - that overshoot is the rubber snap." },
      { prop: "smoothing", type: "number", def: "12", desc: "Velocity smoothing rate (lambda per second) applied before the spring, so a jittery trackpad never reaches the cards raw." },
      { prop: "meter / meterScale", type: "boolean / number", def: "false / 2600", desc: "The velocity meter readout (a debugging surface, off by default) and its full-scale velocity in px/s." },
      { prop: "label / reducedMotion", type: "string / boolean", def: "-", desc: "The accessible name for the internal scroll region, and force-static regardless of system preference." },
    ],
    accessibility: [
      "Reduced motion disables shear, stretch and the meter entirely - the feed stays a plain, fully scrollable list, because the effect carries no information.",
      "The stage is a focusable region with overscroll-behavior: contain; arrow keys, Page Up/Down and Home/End scroll it, and the wheel is relayed to the page at both ends rather than trapped.",
      "The velocity meter is decorative and aria-hidden; its readouts use tabular-nums and refresh on a fixed cadence so nothing reflows.",
      "Server markup is an untransformed feed, so every card is readable without JavaScript.",
    ],
    performance: [
      "Velocity is a smoothed delta-scroll/delta-time read inside the single rAF loop, and the shear it targets is integrated with real frame time - a dropped frame changes the timing, never the destination.",
      "One transform write per card per frame, transforms only. The loop stops writing entirely once spring energy falls under threshold, with one final identity write so cards settle exactly square.",
      "The loop pauses when the feed scrolls offscreen or the tab is hidden and is cancelled on unmount.",
      "Meter text is written imperatively and only when the rounded value changes, so the readout never triggers a React re-render.",
    ],
  },
```

## previews index

In `apps/docs/app/_previews/index.tsx` — add the imports alongside the others:

```tsx
import { StickyZoomHeroPreview } from "./sticky-zoom-hero";
import { DepthParallaxScenePreview } from "./depth-parallax-scene";
import { MaskWipeSectionsPreview } from "./mask-wipe-sections";
import { ScrollCountStatsPreview } from "./scroll-count-stats";
import { VelocitySkewFeedPreview } from "./velocity-skew-feed";
```

…and the entries to the preview map:

```tsx
  "sticky-zoom-hero": StickyZoomHeroPreview,
  "depth-parallax-scene": DepthParallaxScenePreview,
  "mask-wipe-sections": MaskWipeSectionsPreview,
  "scroll-count-stats": ScrollCountStatsPreview,
  "velocity-skew-feed": VelocitySkewFeedPreview,
```

## verification

Commands actually run, with their real results:

```
$ cd packages/registry && npx vitest run registry/scroll
 ✓ registry/scroll/mask-wipe-sections.test.tsx   (8 tests)
 ✓ registry/scroll/depth-parallax-scene.test.tsx (8 tests)
 ✓ registry/scroll/velocity-skew-feed.test.tsx   (8 tests)
 ✓ registry/scroll/sticky-zoom-hero.test.tsx     (7 tests)
 ✓ registry/scroll/scroll-count-stats.test.tsx   (8 tests)
 Test Files  5 passed (5)
      Tests  39 passed (39)

$ cd packages/registry && npx tsc -p tsconfig.json --noEmit
(no output — clean; no pre-existing errors elsewhere either)

$ cd packages/registry && npx tsc --noEmit -p tsconfig.consumer-strict.json
(no errors in registry/scroll/**)

$ cd apps/docs && npx tsc -p tsconfig.json --noEmit
(no output — clean, including the five new preview files)
```

The docs app build and dev server were deliberately not run.

### Deviations from the prototype (and why)

1. **No auto-nudge.** The prototype programmatically scrolls each internal stage on
   load to advertise "you can scroll me". That writes to the user's scroll position
   without input, which is scroll jacking in a consumer app, so it is not in the
   registry source. The affordance lives in the docs previews instead, as the
   prototype's "scroll inside this stage" cue (which fades on first interaction).
2. **Wipe windows are derived, not hard-coded.** The prototype hard-codes
   `0.06–0.34 / 0.39–0.64 / 0.70–0.94` for exactly three wipes. `MaskWipeSections`
   derives them from `LEAD = 0.06`, the section count and `dwell`, which yields
   `0.06–0.32 / 0.37–0.63 / 0.68–0.94` for three wipes (within 0.02 of the
   prototype) and paces any other chapter count correctly.
3. **Chart-bar growth moved to a CSS custom property.** In the prototype the hero's
   chart bars are part of the component. Here the hero scene is consumer-supplied,
   so `StickyZoomHero` publishes `--mk-progress` / `--mk-zoom` on the scene each
   frame and the preview's bars grow off `--mk-zoom` in pure CSS. Same beat, no
   React re-render, and it generalises to any child content.
4. **Stat window derivation is unchanged but `format` is deterministic.** The
   prototype passes value strings through verbatim; numeric `value`s here are
   grouped with a locale-independent formatter rather than `toLocaleString`, so
   server and client markup always match.

### Notes for the orchestrator

- `CategoryId` already includes `"scroll"` and `categories` already has the
  `{ id: "scroll", label: "Scroll animations", … }` entry — no edit needed there.
- All five components are `w-full` with no hard-coded `max-w`; the `max-w-[960px]`
  wrapper lives only in the previews.
- `dependencies` are empty for all five: every spring and lerp is inline,
  delta-time rAF. Registry deps are `@motiq/utils` + `@motiq/primitives` only.
