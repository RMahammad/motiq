# Motiq marketing assets

Everything for promoting Motiq lives here. Two kits, one place:

- **[`promo/`](promo/)** — Remotion-rendered promo & social kit (this is the primary set). Source: [`tools/promo/`](../tools/promo/README.md).
- **[`launch/`](launch/)** — Playwright-captured launch clips + social preview image, recorded from the live docs previews. Source: [`launch/tools/`](launch/tools/).

The rendered media (`*.gif`, `*.mp4`, `*.png`, `*.jpg`) is **gitignored** — it's regenerable from the tools and would bloat git history. This README, the captions, and the re-record tool source stay tracked. Distribute the rendered files via a GitHub Release or upload them natively when posting.

Channel rules, timing, and the full launch sequence live in [`LAUNCH.md`](../LAUNCH.md); this file maps assets to channels and gives paste-ready captions. **All claims match LAUNCH.md's fact sheet** (56 components + 8 blocks → "60+ components & blocks"; free & open source; shadcn-registry install). Never add user counts or download numbers to a caption.

---

## `promo/` — Remotion promo & social kit

Rendered by [`tools/promo/`](../tools/promo/README.md): `npm run render` (GIFs) and `npm run render:social` (trailer/square/vertical/card).

| Asset | Format | Built for | Notes |
| --- | --- | --- | --- |
| `motiq-trailer.mp4` | 16:9 · 1280×720 · ~32s | **X launch post**, LinkedIn, YouTube, docs page | Upload natively (never link). Designed for muted autoplay: text carries the story, product moves from frame 0, no logo cold-open. |
| `motiq-card.png` | 1200×675 static | X image posts, link-preview style shares, blog headers | Pair with a short text post when video feels too heavy. |
| `motiq-square.mp4` / `.gif` | 1:1 · 1080×1080 · 12s loop | X follow-ups, LinkedIn feed, Instagram, Threads | Loops seamlessly; good for drip posts. |
| `motiq-vertical.mp4` | 9:16 · 1080×1920 · 12s | YouTube Shorts, Reels, TikTok | Short-form discovery channel; re-post monthly. |
| `motiq-intro/-install/-showcase/-pillars/-free.gif` | 16:9 GIFs | GitHub README, dev.to posts, Reddit inline | README hero = intro or install. |
| `motiq-cat-*.gif` (11) | 16:9 GIFs | Drip engine: one category per post; docs pages; Reddit niche subs | Match the sub: `motiq-cat-ai` → AI-adjacent subs, `motiq-cat-developer-tools` → r/devtools etc. |
| `tools/promo/out/*.mp4` | source MP4s of every GIF | Anywhere video beats GIF | X re-encodes GIFs to video anyway — prefer the MP4. |

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
