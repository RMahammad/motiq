# Typography Theatre wiring

Batch 07 · prototype `artifacts/motion-lab-showpieces/02-typography-theatre.html`
5 components, registry dir `registry/text`. Every snippet below is drop-in verbatim.

## registry.json items

Append to `packages/registry/registry.json` → `items` (schema matches the existing
`registry:component` entries; `dependencies` stay empty — springs/stagger/rAF are inline).

```json
    {
      "name": "decrypt-text",
      "type": "registry:component",
      "title": "Decrypt Text",
      "description": "Copy that arrives decoded rather than typed: every glyph boils from the first frame and character i locks at 350 + i·55ms ± 120ms behind a 420ms accent flash. Mount / in-view / hover triggers, a monospace terminal variant, SSR-readable text, reduced-motion safe.",
      "dependencies": [],
      "registryDependencies": [
        "@motiq/utils",
        "@motiq/primitives"
      ],
      "files": [
        {
          "path": "registry/text/decrypt-text.tsx",
          "type": "registry:component",
          "target": "components/motiq/decrypt-text.tsx"
        }
      ],
      "meta": {
        "category": "text",
        "tier": "free",
        "signature": false,
        "keywords": [
          "text",
          "decrypt",
          "scramble",
          "terminal",
          "hero",
          "headline",
          "typography"
        ]
      }
    },
    {
      "name": "proximity-type",
      "type": "registry:component",
      "title": "Proximity Type",
      "description": "A headline with gravity: each character chases a numeric font weight (340 → 900) based on pointer distance with exponential smoothing, so the type visibly lags the cursor. Glow, letter-spacing falloff and an idle breathing wave. Reduced-motion safe.",
      "dependencies": [],
      "registryDependencies": [
        "@motiq/utils",
        "@motiq/primitives"
      ],
      "files": [
        {
          "path": "registry/text/proximity-type.tsx",
          "type": "registry:component",
          "target": "components/motiq/proximity-type.tsx"
        }
      ],
      "meta": {
        "category": "text",
        "tier": "free",
        "signature": false,
        "keywords": [
          "text",
          "proximity",
          "variable font",
          "pointer",
          "hero",
          "headline",
          "typography"
        ]
      }
    },
    {
      "name": "split-flap",
      "type": "registry:component",
      "title": "Split Flap",
      "description": "A departures board that actually flips: cells step through the charset drum-style with a col·38 + row·110 ± 90ms sweep, 3D top/bottom halves, motion blur on fast runs, a back-ease slap on the final flap and idle twitches. Polite live region announces each settled page.",
      "dependencies": [],
      "registryDependencies": [
        "@motiq/utils",
        "@motiq/primitives"
      ],
      "files": [
        {
          "path": "registry/text/split-flap.tsx",
          "type": "registry:component",
          "target": "components/motiq/split-flap.tsx"
        }
      ],
      "meta": {
        "category": "text",
        "tier": "free",
        "signature": false,
        "keywords": [
          "text",
          "split-flap",
          "board",
          "ticker",
          "departures",
          "mechanical",
          "status"
        ]
      }
    },
    {
      "name": "liquid-fill-headline",
      "type": "registry:component",
      "title": "Liquid Fill Headline",
      "description": "An outlined wordmark that fills bottom-up with a sloshing two-polygon clip-path wave rebuilt per frame, settles as the amplitude decays, then takes a coral shimmer sweep. Pure CSS-clipped text (never an SVG luminance mask), controllable level, reduced-motion safe.",
      "dependencies": [],
      "registryDependencies": [
        "@motiq/utils",
        "@motiq/primitives"
      ],
      "files": [
        {
          "path": "registry/text/liquid-fill-headline.tsx",
          "type": "registry:component",
          "target": "components/motiq/liquid-fill-headline.tsx"
        }
      ],
      "meta": {
        "category": "text",
        "tier": "free",
        "signature": false,
        "keywords": [
          "text",
          "liquid",
          "fill",
          "headline",
          "progress",
          "clip-path",
          "hero"
        ]
      }
    },
    {
      "name": "word-cascade",
      "type": "registry:component",
      "title": "Word Cascade",
      "description": "Hero copy that arrives cast rather than printed: words are measured into real visual lines and each runs its own underdamped spring (k=180, c=16) with blur, rotation and ~6% overshoot. Viewport-triggered, re-arms on exit, replay token, reduced-motion safe.",
      "dependencies": [],
      "registryDependencies": [
        "@motiq/utils",
        "@motiq/primitives"
      ],
      "files": [
        {
          "path": "registry/text/word-cascade.tsx",
          "type": "registry:component",
          "target": "components/motiq/word-cascade.tsx"
        }
      ],
      "meta": {
        "category": "text",
        "tier": "free",
        "signature": false,
        "keywords": [
          "text",
          "cascade",
          "words",
          "spring",
          "entrance",
          "hero",
          "paragraph"
        ]
      }
    },
```

Also add the five source paths to `packages/registry/tsconfig.json` → `compilerOptions.paths`
and `packages/registry/vitest.config.ts` → `resolve.alias` only if a consumer-style
`@/components/motiq/<name>` import is introduced; none of these five import each other,
so no alias is required today.

## catalog.ts entries

Append to `apps/docs/lib/catalog.ts` → `components` (house style; `ADDED` is the
file's shared constant — these use an explicit date instead).

```ts
  {
    id: "decrypt-text",
    name: "Decrypt Text",
    slug: "decrypt-text",
    description:
      "Copy that arrives decoded rather than typed: glyphs boil from the first frame and each character locks in behind a 420ms accent flash. Mount, in-view or hover triggers plus a monospace terminal variant.",
    category: "text",
    subcategory: "Text animations",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["text", "decrypt", "scramble", "terminal", "hero", "headline", "typography"],
    registryItem: "decrypt-text",
    documentationPath: "/components/decrypt-text",
    dateAdded: "2026-07-28",
    featured: false,
    supportsDarkMode: true,
    supportsReducedMotion: true,
    requiresClient: true,
    animationEngine: "css",
    stage: "text",
    complexity: "medium",
    releaseStatus: "released",
  },
  {
    id: "proximity-type",
    name: "Proximity Type",
    slug: "proximity-type",
    description:
      "A headline with gravity: every character chases a numeric font weight based on pointer distance, and the lag is the effect. Glow, tracking falloff, and an idle breathing wave when the pointer leaves.",
    category: "text",
    subcategory: "Text animations",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["text", "proximity", "variable font", "pointer", "hero", "headline", "typography"],
    registryItem: "proximity-type",
    documentationPath: "/components/proximity-type",
    dateAdded: "2026-07-28",
    featured: false,
    supportsDarkMode: true,
    supportsReducedMotion: true,
    requiresClient: true,
    animationEngine: "css",
    stage: "text",
    complexity: "medium",
    releaseStatus: "released",
  },
  {
    id: "split-flap",
    name: "Split Flap",
    slug: "split-flap",
    description:
      "A departures board that actually flips: cells step through the charset drum-style with a column-swept stagger, motion blur on fast runs, and a back-ease slap on the final flap. Settled pages are announced politely.",
    category: "text",
    subcategory: "Text animations",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["text", "split-flap", "board", "ticker", "departures", "mechanical", "status"],
    registryItem: "split-flap",
    documentationPath: "/components/split-flap",
    dateAdded: "2026-07-28",
    featured: false,
    supportsDarkMode: true,
    supportsReducedMotion: true,
    requiresClient: true,
    animationEngine: "css",
    stage: "text",
    complexity: "complex",
    releaseStatus: "released",
  },
  {
    id: "liquid-fill-headline",
    name: "Liquid Fill Headline",
    slug: "liquid-fill-headline",
    description:
      "An outlined wordmark that fills bottom-up with a sloshing clip-path wave, settles as the amplitude decays, then takes a coral shimmer sweep. Pure CSS-clipped text, so it recolors with the theme for free.",
    category: "text",
    subcategory: "Text animations",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["text", "liquid", "fill", "headline", "progress", "clip-path", "hero"],
    registryItem: "liquid-fill-headline",
    documentationPath: "/components/liquid-fill-headline",
    dateAdded: "2026-07-28",
    featured: false,
    supportsDarkMode: true,
    supportsReducedMotion: true,
    requiresClient: true,
    animationEngine: "css",
    stage: "text",
    complexity: "medium",
    releaseStatus: "released",
  },
  {
    id: "word-cascade",
    name: "Word Cascade",
    slug: "word-cascade",
    description:
      "Hero copy that arrives cast rather than printed: words are measured into real visual lines and each drops on its own underdamped spring with blur, rotation and a touch of overshoot. Viewport-triggered, replayable.",
    category: "text",
    subcategory: "Text animations",
    status: "beta",
    access: "free",
    dependencies: [],
    registryDependencies: [`${product.registryNamespace}/utils`, `${product.registryNamespace}/primitives`],
    tags: ["text", "cascade", "words", "spring", "entrance", "hero", "paragraph"],
    registryItem: "word-cascade",
    documentationPath: "/components/word-cascade",
    dateAdded: "2026-07-28",
    featured: false,
    supportsDarkMode: true,
    supportsReducedMotion: true,
    requiresClient: true,
    animationEngine: "css",
    stage: "text",
    complexity: "medium",
    releaseStatus: "released",
  },
```

## presentation map

Add to `apps/docs/lib/catalog.ts` → `PRESENTATION` (next to the other `text` rows).

```ts
  "decrypt-text": { previewSize: "wide", stageFamily: "editorial", cardSpan: 8 },
  "proximity-type": { previewSize: "wide", stageFamily: "editorial", cardSpan: 8 },
  "split-flap": { previewSize: "full", stageFamily: "editorial", cardSpan: 12 },
  "liquid-fill-headline": { previewSize: "wide", stageFamily: "editorial", cardSpan: 8 },
  "word-cascade": { previewSize: "full", stageFamily: "editorial", cardSpan: 12 },
```

## docs-content entries

Append to `apps/docs/lib/docs-content.ts` → the exported content record.

```ts
  "decrypt-text": {
    usage: `import { DecryptText } from "@/components/motiq/decrypt-text";

<DecryptText text="Ship interfaces that feel alive." as="h1" />

<DecryptText
  text="motiq add decrypt-text — resolved in 84ms"
  variant="terminal"
  startDelay={900}
  loop={7000}
/>`,
    api: [
      { prop: "text", type: "string", def: "-", desc: "The real string. Rendered readable on the server and exposed once to screen readers." },
      { prop: "glyphs", type: "string", def: "pool", desc: "Scramble pool. Defaults to a symbol pool for `display` and a hex/CLI pool for `terminal`." },
      { prop: "speed / stagger", type: "number", def: "45 / 55", desc: "Glyph cycle floor in ms (each char jitters up to +35ms) and per-character lock-in stagger." },
      { prop: "startDelay / jitter", type: "number", def: "350 / 120", desc: "Delay before the first lock, and the ± ms spread that makes the resolve ragged rather than metronomic." },
      { prop: "trigger", type: '"mount" | "inview" | "hover"', def: '"inview"', desc: "What starts the first run. `hover` leaves the line readable until the pointer arrives." },
      { prop: "variant", type: '"display" | "terminal"', def: '"display"', desc: "Headline scale, or a monospace CLI card with a prompt and a blinking caret." },
      { prop: "loop / retriggerOnHover", type: "number | false / boolean", def: "7000 / true", desc: "Auto re-run delay after settling, and hover re-scramble with a 1.5s cooldown." },
      { prop: "seed / as / reducedMotion / onDecrypted", type: "misc", def: "1 / \"p\" / - / -", desc: "Deterministic jitter seed (SSR-stable), element tag, forced-static override, and a callback per completed resolve." },
    ],
    accessibility: [
      "The real string is rendered in a visually-hidden sibling and the animated glyph layer is aria-hidden, so screen readers hear the sentence once and never the scramble.",
      "Server markup and no-JS render the finished, readable line - the scramble only ever exists after mount (progressive enhancement).",
      "Respects prefers-reduced-motion and the reducedMotion prop: the text renders resolved, hover re-triggering becomes a no-op, and the caret stops blinking.",
      "The animated layer is unselectable, so copying the headline copies the real sentence.",
    ],
    performance: [
      "One requestAnimationFrame loop per instance writes textContent plus a state attribute per glyph - zero layout writes and no per-character React state.",
      "The loop parks completely when the line scrolls offscreen or the tab is hidden (IntersectionObserver + visibilitychange) and re-arms when it returns.",
      "Per-character jitter comes from an inline mulberry32 seeded by `seed`, so runs are deterministic and never call Math.random during render.",
      "Lock-in colour and glow are a scoped CSS keyframe, not a per-frame style write.",
    ],
  },
  "proximity-type": {
    usage: `import { ProximityType } from "@/components/motiq/proximity-type";

<ProximityType
  text="Gravity has a typeface."
  as="h1"
  radius={180}
  weightRange={[340, 900]}
/>`,
    api: [
      { prop: "text", type: "string", def: "-", desc: "The real string. Rendered readable on the server and exposed once to screen readers." },
      { prop: "radius", type: "number", def: "180", desc: "Reaction radius around the pointer, in px." },
      { prop: "weightRange", type: "[number, number]", def: "[340, 900]", desc: "Numeric font weight far from the pointer, and directly under it." },
      { prop: "restWeight", type: "number", def: "430", desc: "Weight the line rests at, and the centre of the idle breathing wave (± 170)." },
      { prop: "spacing", type: "string", def: '"0.06em"', desc: "Peak letter-spacing under the pointer; falls off with the same curve as weight." },
      { prop: "glow / idleWave", type: "boolean", def: "true / true", desc: "Accent glow on the hottest characters, and the breathing wave that travels the line after 2s of pointer idle." },
      { prop: "falloff", type: '"smooth" | "linear"', def: '"smooth"', desc: "Distance curve. `smooth` is a smoothstep, which reads as gravity rather than a spotlight." },
      { prop: "as / reducedMotion", type: "misc", def: '"p" / -', desc: "Element tag, and the forced-static override (the line renders at `restWeight`)." },
    ],
    accessibility: [
      "The real string sits in a visually-hidden sibling; the per-character layer is aria-hidden and unselectable, so AT hears one clean sentence.",
      "Respects prefers-reduced-motion and the reducedMotion prop: the line renders static at its rest weight and the loop never starts.",
      "Pointer Events cover mouse, pen and touch identically - there is no mouse-only path, and nothing is conveyed by colour alone (weight and glow move together).",
      "Server markup renders the plain readable headline; weights are only ever applied after mount.",
    ],
    performance: [
      "One requestAnimationFrame loop per instance mutates inline fontWeight/color/letter-spacing directly on the character spans - no per-character React state.",
      "Character centres are measured once, cached, and refreshed at most every 0.7s while the pointer is active (plus a rAF-coalesced pass on resize/scroll) - never read mid-frame.",
      "font-weight is layout-affecting by design; the cost is bounded to one short line, and characters drop back to their plain rest style below a heat floor so idle work stays near zero.",
      "The loop pauses when the headline scrolls offscreen or the tab is hidden.",
    ],
  },
  "split-flap": {
    usage: `import { SplitFlap } from "@/components/motiq/split-flap";

<SplitFlap
  messages={[
    ["SHIP MOTION    ON TIME", "SPLIT-FLAP    BOARDING"],
    ["OPEN SOURCE    ALL DAY", "ZERO LOCK-IN   ON TIME"],
  ]}
  interval={6000}
/>`,
    api: [
      { prop: "messages", type: "(string | string[])[]", def: "-", desc: "Pages the board rotates through. A plain string is a one-row ticker page; an array is a multi-row board." },
      { prop: "cols", type: "number", def: "longest line", desc: "Cells per row. The board font-size is measured from the container so any width fits." },
      { prop: "interval", type: "number", def: "6000", desc: "ms each page is held. `0` disables auto-rotation (drive it with `index` instead)." },
      { prop: "flipMs / stagger", type: "number / {col,row,jitter}", def: "80 / {38,110,90}", desc: "One drum step in ms, and the per-column/per-row/random offsets that sweep the change across the board." },
      { prop: "charset", type: "string", def: "A-Z 0-9 + punctuation", desc: "Drum contents. Characters outside it fall back to a blank." },
      { prop: "flutter", type: "boolean", def: "true", desc: "Random idle twitches on settled cells - the mechanical restlessness of a real board." },
      { prop: "index / defaultIndex / onIndexChange", type: "number / number / (i) => void", def: "- / 0 / -", desc: "Controlled or uncontrolled page index; the callback fires with the resolved index." },
      { prop: "seed / reducedMotion", type: "number / boolean", def: "1 / -", desc: "Deterministic jitter + twitch seed (SSR-stable), and the forced-static override." },
    ],
    accessibility: [
      "The board itself is aria-hidden; a polite aria-live region announces each page as one sentence, and only once every cell has come to rest - so AT is never read a spinning drum.",
      "Respects prefers-reduced-motion and the reducedMotion prop: pages swap as instant text. The content still rotates; nothing flips.",
      "Status is carried by the words on the board, never by colour alone.",
      "Server markup renders the current page as static cells - no flip is required for the content to be correct.",
    ],
    performance: [
      "One requestAnimationFrame loop drives every cell on the board; flaps animate transform only (GPU-composited) and glyph text is written at flip boundaries, never per frame.",
      "The loop parks completely when the board scrolls offscreen or the tab is hidden, and auto-rotation stops with it.",
      "Long drum runs restart closer to their target (max 14 steps), so a full page change is bounded work rather than a 40-step spin.",
      "Board font-size is measured with a ResizeObserver and committed only when it actually changes - the cell grid itself never re-renders per frame.",
    ],
  },
  "liquid-fill-headline": {
    usage: `import { LiquidFillHeadline } from "@/components/motiq/liquid-fill-headline";

<LiquidFillHeadline text="Set it in motion" as="h1" />

{/* progress-driven */}
<LiquidFillHeadline text="Set it in motion" level={0.62} />`,
    api: [
      { prop: "text", type: "string", def: "-", desc: "The real string. Rendered readable on the server and exposed once to screen readers." },
      { prop: "fillMs / holdMs / drainMs", type: "number", def: "3000 / 1400 / 1000", desc: "Rise, hold-at-full and drain durations of the pour timeline." },
      { prop: "amplitude", type: "number", def: "4.5", desc: "Wave height at full slosh, in % of the headline box. Decays to zero as the liquid settles." },
      { prop: "gradient", type: "string[]", def: "cyan → azure", desc: "Two or more CSS colors for the liquid, top to bottom. Defaults to the theme's accent ramp." },
      { prop: "shimmer / loop", type: "boolean", def: "true / true", desc: "The coral signature sweep at the moment the headline fills, and whether the pour repeats." },
      { prop: "level", type: "number", def: "-", desc: "Controlled fill level 0-1. Supplying it replaces the timeline with a gently sloshing surface at that height." },
      { prop: "trigger / replayOnPointer", type: '"inview" | "manual" / boolean', def: '"inview" / true', desc: "What starts the pour, and whether a pointer press re-pours from empty." },
      { prop: "as / reducedMotion / onFilled", type: "misc", def: '"p" / - / -', desc: "Element tag, forced-static override (renders fully poured), and a callback each time the headline reaches full." },
    ],
    accessibility: [
      "All four text layers sit under one aria-hidden stack; the readable string is a visually-hidden sibling, so the headline is announced exactly once.",
      "Respects prefers-reduced-motion and the reducedMotion prop: the headline renders fully poured with no loop - still a handsome gradient wordmark.",
      "Server markup and no-JS render the filled headline; the glass is only emptied after mount.",
      "The coral shimmer is decoration on top of an already-legible fill, never the only way to read the state.",
    ],
    performance: [
      "Two clip-path writes and one background-position write per frame from a single rAF loop - no SVG filters, no canvas, no per-character work.",
      "Uses clip-path alpha clipping over background-clip: text, NOT an SVG luminance mask (gradient luminance masks silently no-op in Chromium).",
      "Pauses when the headline scrolls offscreen or the tab is hidden.",
      "The controlled `level` path skips the timeline entirely and only maintains a low-amplitude surface.",
    ],
  },
  "word-cascade": {
    usage: `import { WordCascade } from "@/components/motiq/word-cascade";

<WordCascade replayToken={step}>
  <h2>Every launch deserves an entrance.</h2>
  <p>Wire it to the viewport and your hero copy directs itself.</p>
</WordCascade>`,
    api: [
      { prop: "children", type: "ReactNode", def: "-", desc: "The passage: plain text, or headings/paragraphs containing plain text. Element structure is preserved in both layers." },
      { prop: "lineStagger / wordStagger", type: "number", def: "150 / 40", desc: "ms added per visual line and per word within that line - words are measured into their REAL wrapped lines after layout." },
      { prop: "stiffness / damping", type: "number", def: "180 / 16", desc: "Per-word spring constants (k and c). The default pair is underdamped, giving ~6% overshoot." },
      { prop: "fromY / blur / rotate", type: "number", def: "-44 / 8 / 7", desc: "Drop distance in px, entry blur in px, and the max random rotation per word in degrees." },
      { prop: "replayOnReenter", type: "boolean", def: "true", desc: "Re-run the cascade each time the block re-enters the viewport; false plays it once." },
      { prop: "replayToken", type: "string | number", def: "-", desc: "Change this value to replay on demand - no imperative ref needed." },
      { prop: "seed", type: "number", def: "1", desc: "Deterministic seed for the per-word rotation (SSR-stable)." },
      { prop: "reducedMotion / onSettled", type: "boolean / () => void", def: "- / -", desc: "Forced-static override, and a callback fired once the whole passage has settled." },
    ],
    accessibility: [
      "The animated copy is aria-hidden and the full passage lives in a visually-hidden block, so reading order, heading semantics and selection stay intact.",
      "Respects prefers-reduced-motion and the reducedMotion prop: words render in place instantly and replay is inert.",
      "Words are parked before the first client paint, so there is no flash of finished copy followed by a jump.",
      "Server markup and no-JS render the passage in place - the cascade is pure enhancement.",
    ],
    performance: [
      "Each word runs its own dt-integrated spring inside ONE rAF loop; the loop writes transform/opacity/filter directly and stops the moment every word settles.",
      "Blur is dropped as soon as a word is near rest and will-change is cleared after it settles, so a settled passage costs nothing.",
      "Line measurement is a single read pass per play, after the reset writes - never interleaved with writes, never per frame.",
      "The cascade pauses and re-arms when the block leaves the viewport, and per-word rotation comes from an inline seeded mulberry32.",
    ],
  },
```

## previews index

`apps/docs/app/_previews/index.tsx` — imports (with the other preview imports):

```tsx
import { DecryptTextPreview } from "./decrypt-text";
import { ProximityTypePreview } from "./proximity-type";
import { SplitFlapPreview } from "./split-flap";
import { LiquidFillHeadlinePreview } from "./liquid-fill-headline";
import { WordCascadePreview } from "./word-cascade";
```

…and map entries (in the `previews` record, next to the other `text` rows):

```tsx
  "decrypt-text": DecryptTextPreview,
  "proximity-type": ProximityTypePreview,
  "split-flap": SplitFlapPreview,
  "liquid-fill-headline": LiquidFillHeadlinePreview,
  "word-cascade": WordCascadePreview,
```

## verification

Commands actually run, with real results:

```
$ cd packages/registry && npx vitest run registry/text
✓ registry/text/word-cascade.test.tsx           (7 tests)
✓ registry/text/proximity-type.test.tsx         (6 tests)
✓ registry/text/liquid-fill-headline.test.tsx   (7 tests)
✓ registry/text/decrypt-text.test.tsx           (8 tests)
✓ registry/text/kinetic-emphasis.test.tsx       (9 tests)   ← pre-existing, unbroken
✓ registry/text/split-flap.test.tsx             (7 tests)
Test Files  6 passed (6) · Tests  44 passed (44)

$ cd packages/registry && npx tsc -p tsconfig.json --noEmit
(no output — clean, whole package)

$ cd apps/docs && npx tsc -p tsconfig.json --noEmit
(no output — clean; the five new preview files are inside the include glob)
```

Not run, per the batch brief: the docs app build and dev server.

### Notes for the orchestrator

- Registry sources import `@/lib/motiq` (the alias that actually maps to
  `registry/lib/motion.ts` in `packages/registry/tsconfig.json` and
  `vitest.config.ts`) — the same import every other rAF component in the repo uses.
  Hence `registryDependencies: ["@motiq/utils", "@motiq/primitives"]`.
- `dependencies` are empty for all five: springs, stagger, easing and the rAF loops
  are inline, matching the prototype's zero-dependency vanilla implementation.
- Deviations from the prototype, and why:
  1. **liquid-fill-headline wraps instead of `white-space: nowrap`.** The prototype
     pins the headline to one line; the registry rule is no horizontal overflow at
     320px. All four layers share the same box, so they wrap identically and the
     clip wave still reads correctly.
  2. **split-flap sizes itself from its container** (ResizeObserver → font-size)
     rather than the prototype's fixed `clamp(10px, 2.55vw, 20px)`, so a 22-column
     board fits a narrow card as well as a full-width page.
  3. **decrypt-text's auto re-run** is a `loop` prop (default 7000ms, matching the
     prototype's 7s) rather than a hard-coded timer, and the first trigger is a
     `trigger` prop; hover re-triggering keeps the prototype's 1.5s cooldown.
  4. **word-cascade takes `replayToken`** instead of the prototype's replay button,
     so replay stays declarative (no imperative ref), per the house API contract.
  5. **split-flap's `messages`** accepts `string | string[]` per page so the same
     component covers a one-row ticker and a four-row board.
