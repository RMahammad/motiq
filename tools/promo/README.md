# Motiq promo renderer (internal)

Internal marketing tool that renders the promo GIFs in [`assets/promo/`](../../assets/promo/) with Remotion. It is **not** part of the product packages: it lives outside the pnpm workspace (plain `npm install`), is excluded from the root ESLint run, and nothing in `packages/*` or `apps/*` may import it.

## License note (recorded 2026-07-18)

This tool only renders our own marketing videos locally, by an individual — covered by Remotion's free tier for individuals/≤3-person orgs (see [`docs/08-remotion-license-analysis.md`](../../docs/08-remotion-license-analysis.md)). It does not redistribute `@remotion/player`, render for customers, or ship Remotion code to buyers, so the Phase-4 license gate is not triggered. Re-check that doc before expanding this tool's scope.

## Usage

```bash
cd tools/promo
npm install
npm run studio              # live-edit compositions in Remotion Studio
npm run render              # render all 5 GIFs to assets/promo/
npm run render -- motiq-intro   # render a single composition
npm run test:determinism    # same props -> identical frame hashes
```

Requires `ffmpeg` on PATH (used for the two-pass palette GIF encode).

## Compositions

All 1200×675 @ 30 fps; GIFs are encoded at 960 px wide, 20 fps, infinite loop.

| ID | Content |
| --- | --- |
| `motiq-intro` | Brand intro: logomark, kinetic wordmark, tagline |
| `motiq-install` | Terminal typing `npx shadcn add https://motiq.dev/r/spotlight-card` → live component pops in |
| `motiq-showcase` | "60+ production-ready components" grid with live micro-demos |
| `motiq-pillars` | Production-ready pillars: accessible, reduced-motion, SSR/RSC, editable source |
| `motiq-free` | Free & open source CTA with GitHub star button |
| `motiq-cat-product-backgrounds` | Category: Workflow Topology Field, Queue Pulse Lanes, Data Contour Surface |
| `motiq-cat-workflow-heroes` | Category: Agent Operations / Deployment Control / Live Data Command heroes |
| `motiq-cat-ai` | Category: AI Response Stream, Tool Call Activity, Prompt Composer |
| `motiq-cat-developer-tools` | Category: Deployment Pipeline, Live Log Stream, Environment Switcher |
| `motiq-cat-collaboration` | Category: Live Presence Stack, Comment Thread, Approval Workflow |
| `motiq-cat-data-motion` | Category: KPI Number Morph, Streaming Data Rows, Filter Result Transition |
| `motiq-cat-productivity` | Category: Kanban Card Movement, Task Dependency Map, Project Timeline |
| `motiq-cat-file-workflows` | Category: File Upload Pipeline, Multi-file Queue, Processing Timeline |
| `motiq-cat-commerce` | Category: Product Variant Selector, Cart Item Transition, Checkout Progress |
| `motiq-cat-security` | Category: Passkey Setup Flow, Two-Factor Setup Flow, Session Security Center |
| `motiq-cat-communication` | Category: Message Delivery States, Typing and Presence, Thread Expansion |

Category GIF tile labels must stay in sync with real component names in `apps/docs/lib/catalog.ts`.

## Social kit (`npm run render:social`)

| ID | Output | Format |
| --- | --- | --- |
| `motiq-trailer` | `motiq-trailer.mp4` | 16:9 1280×720, ~32s — hook → 4 category scenes → install → pillars → free/open outro. Built for muted autoplay (X/LinkedIn native upload). |
| `motiq-square` | `motiq-square.mp4` + `.gif` | 1:1 1080×1080, 12s loop for feeds |
| `motiq-vertical` | `motiq-vertical.mp4` | 9:16 1080×1920, 12s for Shorts/Reels/TikTok |
| `motiq-card` | `motiq-card.png` | 1200×675 static for X image posts / link cards |

Channel mapping + paste-ready captions: [`assets/README.md`](../../assets/README.md). Claim discipline: quantities must match the fact sheet in `LAUNCH.md` ("60+ components & blocks", never invented stats).

Brand colors/copy are mirrored from `packages/tokens/styles.css` (dark theme) and `product.config.json` into [`src/theme.ts`](src/theme.ts) — update there if the brand changes. All animation is deterministic (`useCurrentFrame()`-derived; seeded PRNG for particles), enforced by `npm run test:determinism`.
