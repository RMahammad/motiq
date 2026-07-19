# Motiq marketing assets

Everything for promoting Motiq lives here:

- **[`campaign/`](campaign/)** — the primary set: README hero (2K MP4 / GIF / poster), pack spotlights, vertical cut, reduced-motion demo. Source: [`apps/promo/`](../apps/promo/README.md) (`pnpm render`), built from the real registry components.
- **[`showcase/`](showcase/)** — README mosaic + per-pack showcase cards. Source: `apps/promo` showcase compositions.
- **[`promo/`](promo/)** — **archive.** Final renders from the retired `tools/promo` (removed 2026-07-19): the ~32 s launch trailer and 11 per-category drip GIFs. No render source remains — treat these files as final; rebuild any category loop in `apps/promo` when it's next needed.
- **[`launch/`](launch/)** — Playwright-captured launch clips + social preview image, recorded from the live docs previews. Source: [`launch/tools/`](launch/tools/).

The rendered media (`*.gif`, `*.mp4`, `*.png`, `*.jpg`) is **gitignored** — regenerable from `apps/promo` — *except* the files the root README embeds (`campaign/motiq-readme-hero.gif`, `showcase/*.gif`, `showcase/motiq-showcase.png`), which must be committed so GitHub can render them. Distribute everything else via a GitHub Release or upload natively when posting.

Channel rules, timing, and the full launch sequence live in [`LAUNCH.md`](../LAUNCH.md); this file maps assets to channels and gives paste-ready captions. **All claims match LAUNCH.md's fact sheet** (56 components + 8 blocks → "60+ components & blocks"; free & open source; shadcn-registry install). Never add user counts or download numbers to a caption.

---

## `campaign/` — primary promo kit (from `apps/promo`, real components)

Rendered by [`apps/promo/`](../apps/promo/README.md): `pnpm render` (everything) or per-target (`pnpm render:readme`, `render:social`, `render:poster`).

| Asset | Format | Built for | Notes |
| --- | --- | --- | --- |
| `motiq-readme-hero.gif` | 1440×810 · 15 fps · ~22.7s loop | **GitHub README hero** (committed) | Full product story: agent run → pipeline retry-to-green → data refresh → approval → install. |
| `motiq-readme-hero-2k.mp4` | 16:9 · 2560×1440 · 30 fps | X/LinkedIn native upload, docs page | H.264 CRF 18; prefer this over the GIF anywhere video is allowed. |
| `motiq-readme-poster.png` | 2560×1440 static | Link cards, blog headers, video poster frame | Hero hold frame. |
| `deployment-pipeline-spotlight.mp4` | 16:9 · 1920×1080 · 8s | Dev-tools pack posts | Fail → logs → focused retry → green. |
| `agent-workflow-spotlight.mp4` | 1:1 · 1080×1080 · 9.5s | AI pack posts, LinkedIn feed | Composer → run/tools/approval → cited stream. |
| `live-data-spotlight.mp4` | 1:1 · 1080×1080 · 7s | Data pack posts | Refresh → morph → reorder → settle. |
| `motiq-social-vertical.mp4` | 9:16 · 1080×1920 · 10s | Shorts, Reels, TikTok | Component on screen from frame 0. |
| `motiq-reduced-motion.mp4` | 16:9 · 1200×674 · 7s | Accessibility posts, docs | The components' real reduced-motion path. |
| `motiq-poster.png` | 2400×1350 static | X image posts | Claims + install command + green pipeline. |

## `promo/` — archived first-generation kit (render source removed)

| Asset | Format | Built for | Notes |
| --- | --- | --- | --- |
| `motiq-trailer.mp4` | 16:9 · 1280×720 · ~32s | **X launch post**, LinkedIn, YouTube | Final render, no source. Upload natively (never link). |
| `motiq-cat-*.gif` (11) | 16:9 GIFs | Drip engine: one category per post; Reddit niche subs | Final renders, no source — rebuild in `apps/promo` when a category needs a refresh. |

## `launch/` — Playwright launch capture kit

Generated 2026-07-18 from the live docs previews (dark theme, real components, scripted interactions, demo control bars hidden).

- `gif/` — looping GIFs (seamless except the log stream, a continuous feed):
  - `ai-response-stream.gif` — restart → token stream → citations/code → complete
  - `kpi-number-morph.gif` — 4 snapshot updates, per-digit morphs, back to start
  - `deployment-pipeline.gif` — all passed → inject test failure → halt → retry → passed
  - `live-presence-stack.gif` — join/leave choreography, returns to initial roster
  - `live-log-stream.gif` — scripted deploy feed
- `mp4/` — same clips as H.264 MP4 (use these on X — it compresses GIFs badly)
- `social-preview.jpg` — 2560×1280 GitHub social preview (**upload this one**: GitHub's limit is 1MB; the PNG is over). Repo Settings → General → Social preview.
- `social-preview.png` — lossless version (Reddit fallback, Product Hunt gallery source)
- `tools/` — re-record pipeline for the drip engine:
  1. Start the docs dev server on :3000.
  2. `node tools/capture.mjs` (optionally append slugs to re-record a subset). Add a new target entry with its click choreography to record a new component.
  3. `zsh tools/convert.sh` → writes `gif/` + `mp4/` here.
  4. Social card: edit `tools/social-card.html`, render with `node tools/render-card.mjs` (both reference the scratchpad frame dir — update paths when re-running in a new session).

---

## Paste-ready captions

**X — launch post (attach `promo/motiq-trailer.mp4`):**
> Stop building UI animation from scratch.
>
> I built Motiq — 60+ animated React & shadcn components and blocks. Accessible, reduced-motion safe, RSC-safe, installed as editable source into your repo.
>
> 100% free & open source. No signup.
>
> motiq.dev

**X — drip post (attach one `promo/motiq-cat-*.gif`'s MP4, rotate categories, 2–3×/week):**
> [Category] components for [use case], animated and production-ready.
>
> `npx shadcn add https://motiq.dev/r/<component>`
>
> Free & open source → motiq.dev

**Reddit — r/reactjs or r/SideProject (native video upload of trailer or a category MP4, text-post framing per LAUNCH.md):**
> **I built a free library of 60+ animated React/shadcn components — all editable source, no paywall**
>
> After rebuilding the same animated cards/streams/checkout flows for the third client, I turned them into a catalog. Everything installs through the shadcn registry as plain source you own — no npm dependency, no lock-in. Accessibility and prefers-reduced-motion are handled on every component.
>
> It's fully free and open source. I'd genuinely love feedback on the API surface and what categories are missing.
>
> GitHub: github.com/RMahammad/motiq · Docs: motiq.dev

**r/webdev:** Showoff Saturday megathread only — same copy, shorter.

**LinkedIn (attach the trailer or square loop):**
> Shipping polished UI motion is still weirdly hard: engineers hand-roll animations, then accessibility and reduced-motion get skipped under deadline. I built Motiq to fix that — 60+ production-ready animated React components, free and open source, installed as editable source through the shadcn registry. motiq.dev

## Rules of thumb (from research — sources in LAUNCH.md)

- **X**: native MP4, 15–60s, one idea per post, CTA in the text not just the video; muted autoplay means on-screen text does the selling.
- **Reddit**: authenticity beats polish — "I built this + specific feedback ask" framing, native uploads, reply to every comment (including skeptics), respect the 9:1 participation ratio.
- **Everywhere**: show the product moving in the first 3 seconds; never open on a logo; never invent stats.
