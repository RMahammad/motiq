# Media in Motion wiring

Batch 07 · prototype `artifacts/motion-lab-showpieces/04-media-in-motion.html` → registry `media/*`.

Files delivered (all new, no shared file touched):

- `packages/registry/registry/media/orbital-gallery.tsx` + `.test.tsx`
- `packages/registry/registry/media/flow-warp-image.tsx` + `.test.tsx`
- `packages/registry/registry/media/velocity-marquee.tsx` + `.test.tsx`
- `packages/registry/registry/media/filmstrip-scrub.tsx` + `.test.tsx`
- `packages/registry/registry/media/compare-reveal.tsx` + `.test.tsx`
- `apps/docs/app/_previews/{orbital-gallery,flow-warp-image,velocity-marquee,filmstrip-scrub,compare-reveal}.tsx`
- `apps/docs/app/_previews/media-scenes.ts` — **new shared preview helper.** The prototype's
  procedural valley/geo/city/orbs/blueprint painters live here (seeded mulberry32, generated
  post-mount, regenerated on `data-theme` change) and hand the components plain data-URL images.
  Nothing to wire; the five preview files import it directly.

`CategoryId "media"`, the `categories` entry, and `CATEGORY_PRESENTATION.media` already exist in
`apps/docs/lib/catalog.ts` — no union/category edits needed.

## registry.json items

```json
{
  "name": "orbital-gallery",
  "type": "registry:component",
  "title": "Orbital Gallery",
  "description": "Media cards on a perspective ring you can grab and flick: real inertia clamped to ±6 rad/s decaying as v·e^(−2.2t), an under-damped focus spring, and depth cues (scale, dim, quantized blur) driven by cos θ. Drag, wheel, click and arrow keys all drive one selection; reduced-motion jumps instantly, loop pauses offscreen.",
  "dependencies": [],
  "registryDependencies": ["@motiq/utils", "@motiq/primitives"],
  "files": [
    {
      "path": "registry/media/orbital-gallery.tsx",
      "type": "registry:component",
      "target": "components/motiq/orbital-gallery.tsx"
    }
  ],
  "meta": {
    "category": "media",
    "tier": "free",
    "signature": false,
    "keywords": ["gallery", "carousel", "ring", "3d", "inertia", "drag", "media", "portfolio"]
  }
},
{
  "name": "flow-warp-image",
  "type": "registry:component",
  "title": "Flow Warp Image",
  "description": "A media surface that liquefies under the pointer: a 32×20 spring mesh (k=90, c=8) displaces sub-rects of your image with a (1−d/R)² falloff and snaps back elastically, throws a radial splash on pointer exit, and swells on a Lissajous path while idle. One canvas, DPR capped at 2, arrow keys and Space as the keyboard equivalent.",
  "dependencies": [],
  "registryDependencies": ["@motiq/utils", "@motiq/primitives"],
  "files": [
    {
      "path": "registry/media/flow-warp-image.tsx",
      "type": "registry:component",
      "target": "components/motiq/flow-warp-image.tsx"
    }
  ],
  "meta": {
    "category": "media",
    "tier": "free",
    "signature": false,
    "keywords": ["image", "warp", "liquid", "mesh", "spring", "canvas", "pointer", "hero"]
  }
},
{
  "name": "velocity-marquee",
  "type": "registry:component",
  "title": "Velocity Marquee",
  "description": "Counter-rotating media rails that feed on page-scroll velocity: a smoothed reading surges them to ~6× and shears them ±10° while you scroll, then exhales back to a 36px/s drift over ~600ms. Hover or focus a rail to ease it to a quarter speed and lift the card out of the stream. One passive scroll listener, one rAF loop.",
  "dependencies": [],
  "registryDependencies": ["@motiq/utils", "@motiq/primitives"],
  "files": [
    {
      "path": "registry/media/velocity-marquee.tsx",
      "type": "registry:component",
      "target": "components/motiq/velocity-marquee.tsx"
    }
  ],
  "meta": {
    "category": "media",
    "tier": "free",
    "signature": false,
    "keywords": ["marquee", "logo wall", "scroll", "velocity", "ticker", "rail", "media", "skew"]
  }
},
{
  "name": "filmstrip-scrub",
  "type": "registry:component",
  "title": "Filmstrip Scrub",
  "description": "A filmstrip with a spring-loaded playhead (k=90, c=16, ζ≈0.84 — one soft overshoot): hover or drag the strip and the large preview crossfades ⌊p⌋ into ⌈p⌉ by the fractional part, with frame ticks and a monospace timecode. Scrubs itself at 0.9 frames/s when idle. The strip is a real slider with arrow/Home/End keys.",
  "dependencies": [],
  "registryDependencies": ["@motiq/utils", "@motiq/primitives"],
  "files": [
    {
      "path": "registry/media/filmstrip-scrub.tsx",
      "type": "registry:component",
      "target": "components/motiq/filmstrip-scrub.tsx"
    }
  ],
  "meta": {
    "category": "media",
    "tier": "free",
    "signature": false,
    "keywords": ["filmstrip", "scrubber", "timeline", "playhead", "timecode", "frames", "media", "slider"]
  }
},
{
  "name": "compare-reveal",
  "type": "registry:component",
  "title": "Compare Reveal",
  "description": "A before/after comparator whose divider chases the pointer through a spring (k=140, c=18, ζ≈0.76) so the lag reads as elastic resistance, demonstrates itself once on first viewport entry (50 → 96 → 4 → 50 over 2.6s), and snaps home on double-click. Coral signature handle; real slider semantics with 2% / Shift 10% arrow steps.",
  "dependencies": [],
  "registryDependencies": ["@motiq/utils", "@motiq/primitives"],
  "files": [
    {
      "path": "registry/media/compare-reveal.tsx",
      "type": "registry:component",
      "target": "components/motiq/compare-reveal.tsx"
    }
  ],
  "meta": {
    "category": "media",
    "tier": "free",
    "signature": false,
    "keywords": ["compare", "before after", "slider", "reveal", "divider", "clip-path", "media", "diff"]
  }
}
```

## catalog.ts entries

```ts
  {
    id: "orbital-gallery",
    name: "Orbital Gallery",
    slug: "orbital-gallery",
    description:
      "Media cards on a perspective ring you can grab and flick. The ring carries real momentum - clamped to ±6 rad/s and decaying as v·e^(−2.2t) - while the front card sharpens and scales and rear cards fall back into dimmed haze. Click or arrow-key a card and an under-damped spring brings it home.",
    category: "media",
    subcategory: "Media & galleries",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["gallery", "carousel", "ring", "3d", "inertia", "drag", "media", "portfolio"],
    registryItem: "orbital-gallery",
    documentationPath: "/components/orbital-gallery",
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
    id: "flow-warp-image",
    name: "Flow Warp Image",
    slug: "flow-warp-image",
    description:
      "A media surface that liquefies under the pointer: a spring mesh displaces your image where the cursor moves and snaps back elastically, leaving a ripple wake and throwing a radial splash when the pointer exits. The picture stays legible at rest, so it works over real product art.",
    category: "media",
    subcategory: "Media & galleries",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["image", "warp", "liquid", "mesh", "spring", "canvas", "pointer", "hero"],
    registryItem: "flow-warp-image",
    documentationPath: "/components/flow-warp-image",
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
    id: "velocity-marquee",
    name: "Velocity Marquee",
    slug: "velocity-marquee",
    description:
      "Counter-rotating media rails that feed on your scroll velocity: shove the page and they surge to roughly six times speed and shear, stop and they exhale back to a calm drift. Hover or focus a card to slow its rail and lift the card out of the stream.",
    category: "media",
    subcategory: "Media & galleries",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["marquee", "logo wall", "scroll", "velocity", "ticker", "rail", "media", "skew"],
    registryItem: "velocity-marquee",
    documentationPath: "/components/velocity-marquee",
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
    id: "filmstrip-scrub",
    name: "Filmstrip Scrub",
    slug: "filmstrip-scrub",
    description:
      "Scrub a sequence of stills like video: drag or hover the strip and a spring-loaded playhead chases your pointer while the large preview crossfades between frames, with frame ticks and a live timecode. It scrubs itself when you leave it alone.",
    category: "media",
    subcategory: "Media & galleries",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["filmstrip", "scrubber", "timeline", "playhead", "timecode", "frames", "media", "slider"],
    registryItem: "filmstrip-scrub",
    documentationPath: "/components/filmstrip-scrub",
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
    id: "compare-reveal",
    name: "Compare Reveal",
    slug: "compare-reveal",
    description:
      "A before/after comparator with weight: the divider chases your pointer with a hint of elastic resistance, demonstrates itself with one full sweep on first sight, and snaps home to 50% on double-click. The coral handle is the batch's single signature moment.",
    category: "media",
    subcategory: "Media & galleries",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["compare", "before after", "slider", "reveal", "divider", "clip-path", "media", "diff"],
    registryItem: "compare-reveal",
    documentationPath: "/components/compare-reveal",
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

Add to `PRESENTATION_OVERRIDES` in `apps/docs/lib/catalog.ts`:

```ts
  // Media in motion — the surface IS the product, so give the galleries the stage.
  "orbital-gallery": { previewSize: "full", stageFamily: "creative", cardSpan: 12 },
  "flow-warp-image": { previewSize: "full", stageFamily: "creative", cardSpan: 12 },
  "velocity-marquee": { previewSize: "full", stageFamily: "creative", cardSpan: 12 },
  "filmstrip-scrub": { previewSize: "full", stageFamily: "creative", cardSpan: 12 },
  "compare-reveal": { previewSize: "wide", stageFamily: "creative", cardSpan: 8 },
```

## docs-content entries

```ts
  "orbital-gallery": {
    usage: `import { OrbitalGallery, type OrbitalGalleryItem } from "@/components/motiq/orbital-gallery";

const items: OrbitalGalleryItem[] = [
  { id: "a", src: "/covers/basin.jpg", alt: "Basin at noon", caption: "Basin at noon" },
  { id: "b", node: <TemplateCard />, caption: "Signal bloom" },
  // 6-12 cards read best
];

<OrbitalGallery
  items={items}
  autoRotate={0.14}
  onActiveIndexChange={(i, item) => track(item.id)}
/>`,
    api: [
      { prop: "items", type: "OrbitalGalleryItem[]", def: "-", desc: "{ id, src?, alt?, node?, caption? }. `src` renders a plain <img>; `node` takes any media you like." },
      { prop: "radius / cardWidth / cardHeight", type: "number", def: "auto / 190 / 250", desc: "Ring radius (derived from card width and item count when unset) and card size; the ring auto-scales down on narrow containers." },
      { prop: "autoRotate / friction", type: "number", def: "0.14 / 2.2", desc: "Idle drift in rad/s after 2.5s of stillness, and the inertia decay constant - a flick decays as v·e^(−friction·t)." },
      { prop: "dimRear / blurRear", type: "number", def: "0.78 / 2.2", desc: "Depth cue at the back of the ring: dim amount (0-1) and blur in px, both driven by cos θ." },
      { prop: "activeIndex / defaultActiveIndex / onActiveIndexChange", type: "misc", def: "- / 0 / -", desc: "Controlled or uncontrolled fronted card; the callback fires with (index, item) whenever a different card reaches the front." },
      { prop: "showCaptionBar / hint", type: "misc", def: "true / drag · flick · arrows", desc: "Footer bar with the fronted caption + position, and its trailing affordance text." },
      { prop: "reducedMotion / pauseWhenHidden", type: "boolean", def: "- / true", desc: "Force the static variant (no drift, no inertia - input maps 1:1), and stop the loop offscreen or when the tab is hidden." },
    ],
    accessibility: [
      "The ring is a labelled carousel group with a roving tabindex: one tab stop, then arrows rotate a card, Home/End jump to the ends, and Enter/Space front the focused card.",
      "Every drag gesture has a keyboard equivalent, and the fronted card is announced through a polite live region as well as shown in the caption bar.",
      "Cards are real buttons at 190x250px (far past the 24px target minimum) with a visible focus ring; the floor bloom and depth dimmers are aria-hidden.",
      "Reduced motion (system preference or the prop) removes drift and inertia entirely - drag maps 1:1 and arrows jump instantly, with every card still reachable.",
    ],
    performance: [
      "One requestAnimationFrame loop per instance with delta-time integration; per frame it writes only transform, opacity and a quantized blur straight to the card elements - no per-frame React state.",
      "Blur is quantized to 0.25px steps so the filter string rarely invalidates, and only rotateY/translateZ/scale change, keeping the ring fully composited.",
      "The loop stops the moment the gallery scrolls offscreen or the tab is hidden (IntersectionObserver + visibilitychange).",
      "No runtime dependencies: the inertia, focus spring and drift are inline physics, and images are plain <img> elements you supply.",
    ],
  },
  "flow-warp-image": {
    usage: `import { FlowWarpImage } from "@/components/motiq/flow-warp-image";

<FlowWarpImage
  src="/photos/ridgeline.jpg"
  alt="Mountain ridgeline at dusk"
  grid={[32, 20]}
  overlay={<h2 className="absolute left-4 top-4">Ridgeline, dusk</h2>}
/>`,
    api: [
      { prop: "src / alt", type: "string | canvas | image / string", def: "- / \"\"", desc: "The picture sampled into the mesh (URL, or an already-painted canvas/image). An empty alt marks the whole surface decorative." },
      { prop: "grid", type: "[number, number]", def: "[32, 20]", desc: "Mesh resolution as [columns, rows] - 32x20 is 640 sub-rect draws per frame." },
      { prop: "stiffness / damping", type: "number", def: "90 / 8", desc: "Per-node return spring; the tuned pair makes the wake ripple for roughly 700ms." },
      { prop: "radius / strength", type: "number", def: "140 / 1", desc: "Pointer push radius in px (falloff is (1−d/R)²) and an overall impulse gain multiplier." },
      { prop: "splashOnLeave / idleWave", type: "boolean", def: "true / true", desc: "Radial splash from the last position on pointer exit, and a virtual pointer riding a Lissajous path after 3s of stillness." },
      { prop: "seed / overlay", type: "misc", def: "12 / -", desc: "Deterministic seed for the built-in fallback surface (used before/without `src`), and content rendered above the canvas." },
      { prop: "reducedMotion / pauseWhenHidden", type: "boolean", def: "- / true", desc: "Render the still image and never start the physics loop, and stop the loop offscreen or when the tab is hidden." },
    ],
    accessibility: [
      "With alt text the surface is a labelled image that takes focus; arrow keys steer a ripple point and Space fires a splash, so the pointer effect is never mouse-only.",
      "An empty alt marks the surface as pure decoration: it is aria-hidden AND not focusable, so no focusable node is ever hidden from assistive tech.",
      "The canvas itself is aria-hidden - the picture's meaning lives in the label, and the warp adds no information.",
      "Reduced motion renders the still image with the mesh at rest; touch-action is pan-y so horizontal strokes warp while vertical swipes still scroll the page.",
    ],
    performance: [
      "One canvas and one requestAnimationFrame loop; the picture is drawn once into an offscreen source and redrawn per frame as sub-rects - no per-pixel work, no getImageData.",
      "Device-pixel-ratio is capped at 2 so retina displays never over-render, and the mesh is one flat Float32Array (no per-node allocation).",
      "Pointer speed is clamped before it becomes impulse, so a fast flick can't blow the mesh apart or spike a frame.",
      "The loop pauses when scrolled offscreen or the tab is hidden, and never starts at all under reduced motion.",
    ],
  },
  "velocity-marquee": {
    usage: `import { VelocityMarquee, type VelocityMarqueeRow } from "@/components/motiq/velocity-marquee";

const rows: VelocityMarqueeRow[] = [
  { id: "media", label: "Recent work", direction: 1, items: shots.map((s) => ({ id: s.id, node: <ShotCard {...s} /> })) },
  { id: "logos", label: "Customers", direction: -1, items: logos.map((l) => ({ id: l.id, node: <LogoChip {...l} /> })) },
];

<VelocityMarquee rows={rows} baseSpeed={36} />`,
    api: [
      { prop: "rows", type: "VelocityMarqueeRow[]", def: "-", desc: "{ id, items, direction?, label? }; each item is { id, node }. Direction alternates by index when unset." },
      { prop: "baseSpeed", type: "number", def: "36", desc: "Resting drift speed in px/s." },
      { prop: "velocityGain / maxBoost", type: "number", def: "0.006 / 5", desc: "Scroll-velocity gain and its ceiling: boost = 1 + min(|v|·gain, maxBoost), so the default peaks at ~6× speed." },
      { prop: "maxSkew", type: "number", def: "10", desc: "Peak shear in degrees, signed by row direction; both boost and shear bleed off over roughly 600ms." },
      { prop: "hoverSlow", type: "number", def: "0.25", desc: "Speed multiplier for the rail under the pointer or keyboard focus." },
      { prop: "showMeter / gap", type: "misc", def: "true / 18", desc: "Live boost meter chip, and the gap between items in px (it also sets the seamless wrap distance)." },
      { prop: "reducedMotion / pauseWhenHidden", type: "boolean", def: "- / true", desc: "Freeze the rails at their rest offsets, and stop the loop offscreen or when the tab is hidden." },
    ],
    accessibility: [
      "Each rail is a named group and the content is duplicated only for a seamless wrap: the duplicate copy is aria-hidden and inert, so links and cards are announced exactly once.",
      "Rails slow on keyboard focus as well as hover, and the lift/scale treatment fires on focus-within - keyboard users get the same affordance as pointer users.",
      "The boost meter is decorative (aria-hidden); nothing in the component conveys state by colour alone.",
      "Reduced motion freezes both rails at their rest offsets while every item stays present, hoverable and focusable.",
    ],
    performance: [
      "Page scroll is read by ONE passive scroll listener that caches the position; the rAF loop never touches the DOM for layout, so scrolling stays smooth.",
      "Each row costs a single translate3d + skewX per frame; the card lift is a pure CSS transition, so hovering costs nothing in the loop.",
      "The boost meter is written imperatively and only when the rounded value actually changes - no React re-render per frame.",
      "The loop and its scroll listener are torn down when the marquee scrolls offscreen, the tab is hidden, or the component unmounts.",
    ],
  },
  "filmstrip-scrub": {
    usage: `import { FilmstripScrub, type FilmstripFrame } from "@/components/motiq/filmstrip-scrub";

const frames: FilmstripFrame[] = shots.map((s, i) => ({
  id: s.id,
  src: s.url,
  alt: \`Step \${i + 1}: \${s.title}\`,
  label: s.phase,
}));

<FilmstripScrub frames={frames} fps={24} onFrameIndexChange={setStep} />`,
    api: [
      { prop: "frames", type: "FilmstripFrame[]", def: "-", desc: "{ id, src?, alt?, node?, label? }; 8-24 stills read best. `label` is the phase name in the readout and the slider's value text." },
      { prop: "fps", type: "number", def: "24", desc: "Timecode base for the monospace readout." },
      { prop: "idleSpeed / resumeAfter / loop", type: "misc", def: "0.9 / 3 / true", desc: "Idle auto-scrub in frames/s (0 disables it), seconds of stillness before it resumes, and ping-pong at the ends." },
      { prop: "stiffness / damping", type: "number", def: "90 / 16", desc: "Playhead spring (ζ≈0.84) - it lands with exactly one soft overshoot." },
      { prop: "hoverScrub", type: "boolean", def: "true", desc: "Scrub on hover as well as drag." },
      { prop: "frameIndex / defaultFrameIndex / onFrameIndexChange", type: "misc", def: "- / 0 / -", desc: "Controlled or uncontrolled frame selection; the callback fires when the nearest frame changes." },
      { prop: "scrubberLabel / reducedMotion / pauseWhenHidden", type: "misc", def: "- / - / true", desc: "Accessible name for the strip, the forced-static variant, and offscreen/tab-hidden pausing." },
    ],
    accessibility: [
      "The strip is a real slider: focusable, arrow keys step one frame, Home/End jump to the ends, aria-valuenow tracks the frame and aria-valuetext reads \"Frame 3 of 12, midday\".",
      "Preview frames carry your alt text; the strip thumbnails are decorative duplicates and are aria-hidden, so the sequence is announced once.",
      "touch-action is pan-y on the strip, so dragging scrubs horizontally while a vertical swipe still scrolls the page.",
      "Reduced motion removes autoplay and the spring entirely - the playhead and preview snap directly to the pointer or key press.",
    ],
    performance: [
      "One requestAnimationFrame loop writes frame opacities, the playhead offset and the timecode straight to the DOM; React only re-renders when the nearest frame changes.",
      "The preview crossfades exactly two layers at a time (every other frame sits at opacity 0), and thumbnails are static.",
      "The playhead moves via a percentage offset on a composited layer, never through layout.",
      "The loop pauses when the strip scrolls offscreen or the tab is hidden, and never starts under reduced motion.",
    ],
  },
  "compare-reveal": {
    usage: `import { CompareReveal } from "@/components/motiq/compare-reveal";

<CompareReveal
  before={{ src: "/v1.png", alt: "Design v1 wireframe" }}
  after={{ src: "/v2.png", alt: "Design v2 render" }}
  labels={["v1 wireframe", "v2 render"]}
  onPositionChange={(pct) => console.log(pct)}
/>`,
    api: [
      { prop: "before / after", type: "ReactNode | { src, alt? }", def: "-", desc: "The two sides. Pass an image descriptor for a plain <img>, or any node (a live component, a video, a chart) to render yourself." },
      { prop: "position / defaultPosition / onPositionChange", type: "misc", def: "- / 50 / -", desc: "Controlled or uncontrolled divider percentage; every input path (drag, keys, double-click) commits through state." },
      { prop: "introSweep", type: "boolean", def: "true", desc: "Self-demonstrating sweep on first viewport entry - 50 → 96 → 4 → 50 over 2.6s, replayed only if it was interrupted." },
      { prop: "stiffness / damping", type: "number", def: "140 / 18", desc: "Divider spring (ζ≈0.76); the lag reads as elastic resistance and the release as a soft snap." },
      { prop: "labels", type: "[string, string]", def: "[\"Before\", \"After\"]", desc: "Corner chips; each fades out when its side narrows past 12%." },
      { prop: "snapOnDoubleClick", type: "number", def: "50", desc: "Percentage the divider snaps to on double-click." },
      { prop: "reducedMotion / pauseWhenHidden", type: "boolean", def: "- / true", desc: "Drop the sweep and the spring so the divider maps 1:1 to input, and stop the loop offscreen or when the tab is hidden." },
    ],
    accessibility: [
      "The handle is a native button with slider semantics: arrows move 2%, Shift+arrows 10%, Home/End pin the ends, and aria-valuenow/aria-valuetext track the reveal live.",
      "The 46px handle is well past the 24px target minimum and keeps a visible focus ring; the divider rule that contains it is never aria-hidden, so the control stays reachable.",
      "Both sides carry your alt text; the corner chips and the divider rule are decorative and add nothing to the accessibility tree.",
      "touch-action is pan-y so dragging the divider on touch never blocks page scrolling, and reduced motion removes the intro sweep and the spring while leaving the comparator fully operable.",
    ],
    performance: [
      "The reveal is a clip-path inset on a composited layer - both sides are painted once and never per frame.",
      "One requestAnimationFrame loop carries the intro sweep and the spring; it stops offscreen, when the tab is hidden, and never starts under reduced motion.",
      "Per frame the loop writes one clip-path, one left offset and two opacities imperatively - no per-frame React state.",
      "The coral signature glow is a static box-shadow, so the handle's emphasis costs nothing at runtime.",
    ],
  },
```

## previews index

Import lines (`apps/docs/app/_previews/index.tsx`):

```tsx
import { OrbitalGalleryPreview } from "./orbital-gallery";
import { FlowWarpImagePreview } from "./flow-warp-image";
import { VelocityMarqueePreview } from "./velocity-marquee";
import { FilmstripScrubPreview } from "./filmstrip-scrub";
import { CompareRevealPreview } from "./compare-reveal";
```

Map entries:

```tsx
  "orbital-gallery": OrbitalGalleryPreview,
  "flow-warp-image": FlowWarpImagePreview,
  "velocity-marquee": VelocityMarqueePreview,
  "filmstrip-scrub": FilmstripScrubPreview,
  "compare-reveal": CompareRevealPreview,
```

## verification

Commands actually run, with real results:

```
$ cd packages/registry && npx vitest run registry/media
 ✓ registry/media/flow-warp-image.test.tsx   (6 tests)
 ✓ registry/media/orbital-gallery.test.tsx   (7 tests)
 ✓ registry/media/velocity-marquee.test.tsx  (6 tests)
 ✓ registry/media/filmstrip-scrub.test.tsx   (6 tests)
 ✓ registry/media/compare-reveal.test.tsx    (7 tests)
 Test Files  5 passed (5)
      Tests  32 passed (32)

$ cd packages/registry && npx tsc -p tsconfig.json --noEmit
(no output — clean; no pre-existing errors elsewhere either)

$ cd apps/docs && npx tsc -p tsconfig.json --noEmit
(no output — clean, including the five new previews + media-scenes.ts)

$ cd packages/registry && npx vitest run registry/__tests__
 ✓ registry/__tests__/components.test.tsx (12 tests)   # nothing pre-existing broken
```

Not run, per instructions: the docs app build and dev server.

### Deviations from the prototype

- **Marquee scroll sampling.** The prototype reads `window.scrollY` inside the rAF loop; the
  registry component uses one `{ passive: true }` scroll listener that caches the position and a
  loop that only reads the cache (house perf rule). Identical physics, no per-frame layout read.
- **Orbital gallery selection API.** The spec rail's `onFocus(item, index)` became the house
  controlled/uncontrolled trio `activeIndex` / `defaultActiveIndex` / `onActiveIndexChange(index, item)`
  through `useControllableState`. Cards are real buttons with a roving tabindex (one tab stop)
  instead of the prototype's non-focusable divs.
- **Filmstrip preview layers.** The prototype crossfades two canvases; the component crossfades DOM
  layers so a frame can be an arbitrary ReactNode, not just an image. Same two-visible-layers-per-
  frame cost, same fractional blend.
- **Flow warp `src`.** Accepts a URL (loaded async, cover-fit into the offscreen source) or a
  canvas/image element. Without `src` it paints a seeded ridgeline fallback so the surface is never
  blank; the prototype's generated scene now lives in the preview instead.
- **Demo art.** All procedurally generated scenes (valley, geo, city, orbs, wireframe) moved out of
  the components into `apps/docs/app/_previews/media-scenes.ts` — customer source stays generic and
  takes consumer media.
