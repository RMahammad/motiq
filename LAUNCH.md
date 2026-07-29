# Motiq Launch Playbook — researched, per-channel, copy-paste ready

Research date: 2026-07-18. Built from three deep research passes (Reddit rules & precedents,
X/social meta, dev communities & aggregators). Every channel below has current rules, timing,
and ready-to-paste content. This is a personal growth doc, not shipped product.

**Repo:** https://github.com/RMahammad/motiq · **Site:** https://motiq.dev
**Facts you may claim (all true, verified 2026-07-28):** 86 components + 8 workflow blocks + 4
packs across 20 categories (94 catalog items, published as a 100-item shadcn registry) · MIT ·
free, no signup · shadcn-registry install (`npx shadcn@latest add https://motiq.dev/r/<name>`) ·
Tailwind v4 · React 18.3+/19 · WCAG 2.2 AA target · reduced-motion behavior on every animation ·
offscreen pause · RSC-safe.
**Headline figure — always exact, never rounded:** "86 animated React components" (or the full
"86 components + 8 workflow blocks + 4 packs" where the space allows). An exact number is stronger
and more credible than "90+"; a rounded claim invites the reader to check it, and every rounded
variant is one more string to keep in sync. Re-verify against motiq.dev/components before a launch
post; the homepage stat tiles, the README, /sponsor, and this line all come from the same catalog.
**Never claim:** user counts, download numbers, "trusted by" anything. One fake stat kills a launch.

---

## The one strategic insight

Your closest comps grew on two engines, not one launch:

- **react-bits** (43K+ stars): dev.to launch post → ~1K stars week one → then a *continuous
  drip* of individual component demos. #2–3 in JS Rising Stars 2025.
- **Aceternity UI**: almost entirely Manu Arora's cadence of short looping component videos
  on X — one component, one 15–30s dark-background clip, minimal caption, near-daily.

So this playbook = **Week 0 prep → Week 1–2 launch wave → indefinite drip engine**.
The drip engine is what compounds toward 15K, not the launch wave.

---

## WEEK 0 — Prep (everything here happens before any post)

### 0.1 Assets to produce (the whole launch runs on these)

Record **5 looping demo videos** (MP4, not GIF — X compresses GIFs badly), 15–30s each,
dark background, seamless loop, **must work muted** (assume autoplay, no sound):

1. **AI Response Stream** — your most zeitgeisty component; lead with it everywhere
2. **KPI Number Morph** — instant "whoa" in 3 seconds
3. **Deployment Pipeline** — devtool audience bait
4. **Live Presence Stack** — collaboration audience
5. **A 20s catalog montage** — 6–8 components, 2–3s each (for launch posts)

Tools: Screen Studio or Kap (mac). Export ≤1080p, ≤5MB where possible for inline autoplay.
Also export a **static 1280×640 hero collage** (GitHub social preview + Reddit fallback)
and **1270×760 gallery images ×4** (Product Hunt spec).

### 0.2 Repo conversion hygiene

- [ ] GitHub Settings → Social preview → upload the 1280×640 collage
- [ ] Repo topics: `react` `nextjs` `tailwindcss` `shadcn` `shadcn-ui` `components`
      `animation` `motion` `framer-motion` `ui-components` `component-library`
      `typescript` `react-components` `design-system`
- [ ] Hero looping GIF/video at the top of the README (static screenshot underperforms
      badly for an animation library)
- [ ] Star-history chart embed + 2–3 pinned `good first issue`s
- [ ] **Cold-machine test:** `npx shadcn@latest add https://motiq.dev/r/ai-response-stream`
      in a fresh Next.js project. HN data shows 92% of stars arrive within 48h of a post —
      everything must already work.
- [ ] **Publish a tagged GitHub Release.** A large repo with zero releases reads as an
      unfinished code dump; releases also surface in followers' dashboards. Notes are
      drafted in [`RELEASE_NOTES.md`](RELEASE_NOTES.md); ship smaller ones regularly after.
- [ ] **Enable Discussions** (below) before the launch wave, so the first arrivals have
      somewhere to land that isn't the issue tracker.

#### Discussions setup

Enable it:

```bash
gh repo edit RMahammad/motiq --enable-discussions
```

GitHub seeds default categories (Announcements, General, Ideas, Polls, Q&A, Show and
tell). There is no API for creating categories, so adjust them by hand under
**Settings → Discussions → Categories** to:

| Category | Format | Purpose |
| --- | --- | --- |
| Announcements | Announcement | Releases and breaking changes. Maintainer-only posting. |
| Show and tell | Open-ended | What people built with Motiq — the category that does the most recruiting. |
| Component requests | Open-ended | Catalog gaps. Ask for the *product problem*, not the effect. |
| Help | Q&A | Install, Tailwind v4, and RSC setup questions. Q&A format so answers get marked. |
| Ideas | Open-ended | Direction, API shape, and roadmap argument. |
| Accessibility feedback | Open-ended | Screen-reader, keyboard, contrast, reduced-motion reports. A confirmed defect graduates to a bug issue. |

Delete the unused defaults (General, Polls) so the list is not mostly empty rooms.
`.github/ISSUE_TEMPLATE/config.yml` already routes people to these categories from the
"New issue" screen — those links 404 until Discussions is on, so enable it first.

Seed each category with one real post before the launch wave. An empty Discussions tab
is weaker evidence of a community than no Discussions tab at all.

### 0.3 High-intent directory submissions (quiet, permanent, do these FIRST)

These are the highest-ROI actions in the entire playbook — the audience is people who
already run `npx shadcn add`.

**A. Official shadcn registry directory** — the single highest-value distribution
item in this playbook. It turns a long URL into `npx shadcn@latest add @motiq/<name>`,
and puts Motiq inside `shadcn search`, where the audience is already installing things.

**Requirements, each verified against production on 2026-07-29:**

| Requirement | Status |
| --- | --- |
| Registry is open source and publicly accessible | ✓ MIT, public repo, no auth on `/r/*` |
| Valid JSON conforming to the registry schema | ✓ `$schema: ui.shadcn.com/schema/registry.json` |
| Flat — `/registry.json` + `/<item>.json` at the registry root | ✓ `motiq.dev/r/registry.json` + `motiq.dev/r/<item>.json`, no nested item names |
| `files` array must NOT include `content` | ✓ 0 of 100 manifest items carry `content` (per-item files still inline it, which is what the CLI installs) |
| `@motiq` namespace is unclaimed | ✓ absent from `ui.shadcn.com/r/registries.json` (255 registries) |

Re-verify with `node scripts/check-registry-submission.mjs` immediately before opening
the PR — it re-runs all of the above against the live site.

**The PR:** add this entry to `apps/v4/registry/directory.json` in `shadcn-ui/ui`,
alphabetically (between `@motion-primitives` and `@mvpblocks`, wherever `@motiq` sorts).
Run `pnpm validate:registries` in that repo before pushing.

```json
{
  "name": "@motiq",
  "homepage": "https://motiq.dev",
  "url": "https://motiq.dev/r/{name}.json",
  "description": "Animated React components for product interfaces — AI response streams, deployment pipelines, live data, and collaboration — with reduced-motion behavior, offscreen pause, and WCAG 2.2 AA semantics built in. Free and MIT."
}
```

- Note: the extensionless `/r/:name` rewrite is a convenience, not the submitted form.
  The directory entry uses the explicit `.json` template above; both resolve (verified).
- Payoff: `npx shadcn add @motiq/<component>` surfaced in official docs + shadcn MCP server.
  Also becomes a credential for every later pitch ("listed in the official shadcn directory").

**A2. GitHub-repo registry (no submission needed, works today).** The repo root now
carries a generated `registry.json`, so the public repo is itself a shadcn registry:

```bash
npx shadcn@latest add RMahammad/motiq/ai-response-stream
```

This is the fallback route while the directory PR is in review, and it pins cleanly
(`RMahammad/motiq/ai-response-stream#v0.1.0`).

**B. awesome-shadcn-ui** (github.com/birobirobiro/awesome-shadcn-ui — 20K stars, merges
within days). One PR, two sections. Entry text:

> ```
> - [Motiq](https://motiq.dev) - 86 free animated components for product UI (AI
>   interfaces, dev tools, collaboration, data) with reduced-motion and a11y built in.
>   Installable via shadcn registry. MIT.
> ```

**C. registry.directory** — PR to `rbadillap/registry.directory` ("Add your Registry").

**D. awesome-tailwindcss** (aniftyco) — "UI libraries, components & templates" section,
fast merges. Same entry style, mention Tailwind v4.

**E. awesome-react-components** (brillout) — "UI Animation" section. ⚠️ Their rule: your
PR must ALSO remove one or more stale/dead entries. Find an archived/404 project to remove
and say so in the PR description. Merging here also auto-feeds react.libhunt.com.

**F. Quick free listings (30 min total):** devhunt.org (dev-tools PH alternative, weekly
leaderboard, dofollow) · openhunts.com · Peerlist Launchpad (weekly cycle, ~50 slots —
submit early in the week) · AlternativeTo (list as alternative to Magic UI / Aceternity;
new accounts wait ~1 week, so create the account NOW).

### 0.4 Warm up accounts (2 weeks before posting)

- **Reddit:** comment genuinely in r/reactjs, r/nextjs, r/webdev for 2 weeks. Most subs
  autofilter young/zero-karma accounts posting links. The site-wide norm is still ~9:1
  (be a redditor with a project, not a project with a Reddit account).
- **X:** reply thoughtfully to @shadcn, @mannupaaji, @mattgperry (creator of Motion — the
  engine you use), @adamwathan posts for 1–2 weeks so your launch isn't your first signal.
  Consider X Premium for launch month (~$8/mo) — it reduces the heavy link/reach penalty
  on non-Premium accounts.
- **Bluesky:** follow through 2–3 "Front-End" starter packs (blueskystarterpack.com).

### 0.5 Voice rule (matters more in 2026 than ever)

Communities added anti-AI-slop filters in 2025–26 (r/programming banned LLM content
outright; r/SideProject filters AI-written text; OSS communities are mid-backlash).
**Write every post yourself, in plain first person, with specific engineering detail.**
Use my drafts below as skeletons — rewrite 20–30% into your own words, add one imperfect
honest detail ("the docs search is still rough"), and never volunteer an AI-built
narrative. Marketing-polished prose reads as generated and gets filtered.

---

## WEEK 1–2 — The launch wave (calendar)

Never post identical text to two subs, never two subs on the same day, never use the
native crosspost button. Reddit's ML flags coordinated promo.

| Day | Channel | Slot |
| --- | --- | --- |
| **Sun 19:00 ET** | Show HN | Statistically best window (10.8% odds of 50+ pts) |
| **Mon** | Reactiflux #showcase + Next.js Discord showcase | any time |
| **Tue 10–13 ET** | r/reactjs (flair: **Show /r/reactjs**) | Tue 14–17 UTC is the peak devtool window |
| **Tue** | X launch thread (after the Reddit post is live) | 9–11am ET |
| **Wed** | dev.to article (best day for top tags) + canonical cross-post to Hashnode + daily.dev "New Post" | morning ET |
| **Wed** | Cooperpress email + This Week In React DM | after article is live |
| **Thu 10–13 ET** | r/nextjs | |
| **Fri** | r/opensource (flair: **Promotional**) + r/coolgithubprojects | |
| **Sat morning ET** | r/webdev **Showoff Saturday** (flaired standalone post — biggest reachable audience, 3.3M) | Saturday only, hard rule |
| **Sat** | r/SideProject (weekends work there) | 10am ET |
| **Mon wk2** | r/tailwindcss | |
| **Tue wk2** | r/react (rewritten, don't mirror r/reactjs) | |
| **Wed wk2** | LinkedIn story post + carousel | |
| **Weekend wk2 or wk3** | Product Hunt self-launch (weekend = easier to rank; page can cite HN/Reddit traction by then) | 00:01 PT |
| **Ongoing** | X per-component drip, near-daily | Tue–Thu 9–11am ET best |

Skip entirely: r/programming (showcases removed + anti-LLM regime), r/ExperiencedDevs
(self-promo off-topic, will generate hostility), r/SaaS (wrong audience), r/web_design
(promo-restricted, designer audience). r/Frontend: rules unverifiable — read the sidebar
first, else skip.

---

## COPY — paste-ready per channel

Every draft is honest and rule-compliant. Personalize before posting (see 0.5).

### 1. Show HN (Sunday ~7pm ET)

**Title (pick one — story-driven beats generic; the closest comp, "I reverse engineered
top websites to build an animated UI library", hit 156 points):**

> Show HN: Motiq – 86 animated React components with reduced-motion built in (MIT)

or

> Show HN: I spent 6 months making animated React components accessible by default

**Text (Show HN posts allow text — keep it under ~150 words):**

> Hi HN, I'm Mahammad. I built Motiq because most animated component libraries stop at
> the effect: a great-looking demo that breaks the moment you ship it — no
> prefers-reduced-motion behavior, focus loss, RSC errors, animation loops running
> offscreen forever.
>
> Motiq is 86 components for product UI (AI response streams, deployment pipelines,
> live presence, streaming data) where every animation has a deliberate reduced-motion
> fallback, keyboard/screen-reader semantics, and explicit client boundaries for
> Next.js. Continuous effects pause offscreen.
>
> It's distributed shadcn-registry style: `npx shadcn add https://motiq.dev/r/<name>`
> copies the TypeScript + Tailwind source into your project. No package, no lock-in,
> no signup. Everything is MIT.
>
> Live previews: https://motiq.dev/components
>
> The hardest part was making "reduced motion" mean something better than
> "animation: none" — happy to get into that in comments.

**Immediately add a first comment** with technical depth: how you test reduced-motion,
the offscreen-pause approach, why editable source over an npm package. HN rewards a
falsifiable engineering discussion, punishes "yet another library."

**Rules:** never ask anyone to upvote (voting-ring detection). Reply to every comment for
the first 3 hours. If it flops, email hn@ycombinator.com politely asking for a
second-chance pool review — that's an accepted practice. Expect ~1.4 stars per upvote.

---

### 2. r/reactjs (Tue, flair: `Show /r/reactjs`)

**Title:**

> I open-sourced Motiq: 86 animated React components where reduced-motion and
> accessibility aren't an afterthought (MIT, shadcn registry)

**Body:**

> Hey r/reactjs — I've spent the last months building Motiq, and it's now fully free
> and MIT, so I wanted to share it here.
>
> **What it is:** 86 components, 8 composed blocks, and 4 packs for *product* UI —
> AI response streaming, agent run timelines, deployment pipelines, live log streams,
> presence stacks, KPI morphs, streaming table rows. Not landing-page confetti;
> the states and interactions apps actually need.
>
> **How you install it:** it's a shadcn-compatible registry, so the source gets copied
> into your project:
>
> ```
> npx shadcn@latest add https://motiq.dev/r/ai-response-stream
> ```
>
> You own the TypeScript/Tailwind code from that point. No runtime package, no signup.
>
> **The part I care most about:** every animation has a deliberate
> `prefers-reduced-motion` behavior (reduced ≠ removed — state changes still
> communicate), continuous effects pause offscreen via IntersectionObserver, focus and
> screen-reader semantics are part of the component contract, and client boundaries
> are explicit so it works in RSC/Next.js without "use client" whack-a-mole.
>
> Live previews for everything: https://motiq.dev/components
> Source: https://github.com/RMahammad/motiq
>
> Honest question for the sub: the API exposes three levels (simple props → slots →
> full source editing). If you've maintained a design system, where do you draw the
> line between props and "just edit the source"? That's the tradeoff I keep
> re-litigating.

Attach the catalog montage video or 2–3 GIFs. Reply to every comment for 3 hours.

---

### 3. r/webdev — Showoff Saturday (Saturday morning ET, flair: `Showoff Saturday`)

**Title:**

> Showoff Saturday: I made 86 animated React components free and open source —
> every one has reduced-motion support and pauses offscreen

**Body (shorter — webdev rewards the visual):**

> Been building this for months and open-sourced the whole catalog under MIT: Motiq,
> animated components for product interfaces — AI streams, deploy pipelines, live
> presence, data motion.
>
> The gimmick is that there's no gimmick: reduced-motion fallbacks on every animation,
> keyboard + screen-reader support, offscreen pause for continuous effects, and you
> install the actual source (shadcn registry style) instead of a black-box package.
>
> Live previews: https://motiq.dev/components · Code: https://github.com/RMahammad/motiq
>
> Would love brutal feedback on the previews page — especially performance on
> mid-range phones, which I've been fighting.

Lead with the montage video. Visual posts get 2–3× engagement here.

---

### 4. r/nextjs (Thu)

**Title:**

> Free shadcn registry with 86 animated components — RSC-safe, Tailwind v4,
> reduced-motion handled (MIT)

**Body:**

> Sharing a project I open-sourced: Motiq, an animated component catalog built
> specifically to behave in modern Next.js apps.
>
> What "built for Next.js" means here concretely:
>
> - Explicit, tested `"use client"` boundaries — server components stay server
> - SSR-stable IDs and no browser globals during render (no hydration mismatches)
> - Tailwind v4, React 18.3+/19
> - shadcn registry install: `npx shadcn@latest add https://motiq.dev/r/deployment-pipeline`
>   copies editable source into your app
>
> Catalog is product-UI focused: AI response streaming, agent timelines, deploy
> pipelines, log streams, presence, KPI/data motion. All free, MIT, no signup.
>
> Previews: https://motiq.dev/components · Repo: https://github.com/RMahammad/motiq
>
> If anyone hits an RSC edge case I didn't cover, I genuinely want the bug report.

---

### 5. r/SideProject (Saturday, builder-story angle)

**Title:**

> I built an animated React component library for 6+ months, then made the whole
> thing free instead of selling it

**Body:**

> The plan was a paid component library. Somewhere along the way I realized the
> libraries I most admired (and that actually grew) gave the code away, so I
> open-sourced the entire catalog: 86 animated components, 8 workflow blocks, and 4 packs. MIT,
> no signup, no "pro" tier.
>
> It's called Motiq. Components for product UI — AI response streams, deployment
> pipelines, live presence, animated data. You install the editable source via the
> shadcn registry with one command, so there's nothing to subscribe to and no lock-in.
>
> What I over-invested in (deliberately): accessibility and reduced-motion. Every
> animation has a real `prefers-reduced-motion` behavior and continuous effects pause
> when offscreen. It's the unsexy work but it's what makes animation shippable.
>
> Live demo: https://motiq.dev · Code: https://github.com/RMahammad/motiq
>
> What's still rough: [add one honest item — e.g. docs search / mobile previews].
> Feedback very welcome — and if it's useful to you, a GitHub star genuinely helps
> an independent project get found.

(This is the ONE channel where a soft star ask is culturally fine. Rules here: show the
real product, no landing-page gates, engage in comments.)

---

### 6. r/opensource (Fri, flair: `Promotional`)

**Title:**

> Motiq — MIT-licensed catalog of 86 animated React components, distributed as
> editable source rather than a package

**Body:**

> Posting with the Promotional flair. Motiq is a fully open-source (MIT) catalog of
> animated React components. Two things this community might find interesting beyond
> "another UI library":
>
> 1. **Distribution model:** it ships as a shadcn-compatible registry — the install
>    command copies TypeScript/Tailwind source files into your project. You own and
>    modify the code; there's no runtime dependency on me, no telemetry, no account.
>    The registry endpoint is just static JSON.
>
> 2. **Accessibility as the contract:** WCAG 2.2 AA target, deliberate
>    reduced-motion behavior on every animation, keyboard/screen-reader semantics,
>    continuous effects pause offscreen.
>
> Everything is public: https://github.com/RMahammad/motiq · previews at
> https://motiq.dev. Contributions welcome — pinned good-first-issues if anyone wants
> an entry point.

(This sub cares about license clarity and independence, not visuals. Human voice
especially important here — the OSS community is mid AI-slop backlash.)

---

### 7. r/tailwindcss (Mon wk2)

**Title:**

> 86 animated components built on Tailwind v4 semantic tokens — free, MIT,
> installable as source via shadcn registry

**Body:**

> Made this for people building product UI with Tailwind: Motiq, an animated
> component catalog where everything is Tailwind v4 + semantic design tokens (no
> hardcoded one-off values), so it themes coherently when several components share
> a screen.
>
> Install copies the source into your project: `npx shadcn@latest add
> https://motiq.dev/r/kpi-number-morph` — then it's your code to restyle.
>
> Previews: https://motiq.dev/components · Repo: https://github.com/RMahammad/motiq
>
> Curious how folks here handle motion tokens (durations/easings) in Tailwind v4
> config — I ended up with a small motion-token layer and would love to compare.

---

### 8. r/coolgithubprojects (Fri — link post to the repo)

**Title:**

> Motiq — 86 free animated React components with accessibility and reduced-motion
> built in [MIT, TypeScript]

Link post directly to the GitHub repo (the sub auto-assigns language flair). The README
hero GIF does the selling — make sure it's in place first.

---

### 9. X / Twitter

**Rules of the road (2026):** no hashtags on launch posts (optionally #buildinpublic on
progress posts) · native MP4 video, never a bare link · **no URL in the post body — put
links in the first reply** ("link below 👇") · Tue–Thu 9–11am ET · reply to every comment
fast · X Communities no longer exist (shut down May 2026).

**Launch thread (Tue, after r/reactjs is live):**

> **1/** I just open-sourced 6+ months of work: Motiq — 86 animated React components
> for product UI. Free. MIT. Install the source, own the code.
> [attach: catalog montage video]
>
> **2/** These aren't landing-page effects. They're the components apps are actually
> made of: AI response streaming, deployment pipelines, live presence, log streams,
> animated data.
> [attach: AI Response Stream clip]
>
> **3/** Every animation has a real prefers-reduced-motion behavior. Not
> `animation: none` — a deliberate fallback that still communicates state.
> Continuous effects pause when offscreen. This is the part nobody demos and
> everybody ships broken.
> [attach: side-by-side motion vs reduced-motion clip if you have one]
>
> **4/** Distribution is shadcn-registry style. One command copies the TypeScript +
> Tailwind source into your project. No package to depend on. No signup. Nothing
> to cancel.
> [attach: 10s terminal clip of the install + component appearing]
>
> **5/** Tailwind v4, React 18/19, RSC-safe client boundaries, WCAG 2.2 AA target,
> strict TypeScript. 86 components, 8 blocks, 4 packs, 20 categories. All of it free.
>
> **6/** Live previews + repo linked below. If Motiq saves you time, a star helps
> more people find it ⭐️
> **↳ first reply:** 🔗 Previews: https://motiq.dev/components — Code:
> https://github.com/RMahammad/motiq

**The drip engine (near-daily, indefinitely — this is the Aceternity playbook):**

One component per post. Template:

> [15–30s looping video of ONE component]
>
> <Component name>. <One line on what it does>. <One line on one real detail —
> reduced-motion, keyboard nav, offscreen pause.>
>
> Free + MIT. Link below.
> **↳ reply:** https://motiq.dev/components/<slug>

Examples to queue:

> KPI Number Morph — numbers that morph per-digit instead of flickering. Respects
> reduced motion (it crossfades instead). Free + MIT, link below.

> Deployment Pipeline — animated stage-by-stage deploy progress with real
> success/fail/rollback states. Pauses offscreen so it's not burning frames in a
> background tab. Free + MIT, link below.

> Live Presence Stack — avatar presence with join/leave choreography that doesn't
> reflow your layout. Keyboard-accessible overflow list. Free + MIT, link below.

**Ecosystem engagement (weekly):** when @shadcn posts about the registry, reply with a
relevant Motiq demo clip (not a pitch — a demo). Same for @mattgperry (Motion) and
@mannupaaji. One genuine reply beats ten mentions.

---

### 10. Bluesky (cross-post, links allowed in-post, hashtags DO work)

> I open-sourced Motiq — 86 animated React components for product UI (AI streams,
> deploy pipelines, live presence, data motion). Every animation is
> reduced-motion-safe. Install the editable source via shadcn registry. Free, MIT,
> no signup.
>
> 🔗 https://motiq.dev · https://github.com/RMahammad/motiq
>
> #webdev #react #frontend
>
> [attach montage video]

Cross-post 2–3 drip videos per week with the same 2–3 tags (custom feeds key on them).

---

### 11. dev.to (Wednesday, tags: `webdev` `react` `javascript` `opensource`)

**Title:**

> I open-sourced 86 animated React components — here's how I made every animation
> reduced-motion-safe

**Structure (this exact "launch + how I built it" format is what took react-bits to
~1K stars in week one):**

1. **Cold open:** the montage video/GIF, then: "Motiq is now fully free and MIT — 86
   components, 8 blocks, 4 packs. Here's the engineering that went into making
   animated components actually shippable."
2. **The problem:** animation libraries that demo well and ship badly (no
   reduced-motion, focus bugs, RSC errors, offscreen loops draining batteries).
3. **Reduced motion ≠ no motion:** your real approach, with a code snippet of the
   pattern (motion tokens + fallback behavior). This section is the shareable asset.
4. **Offscreen pause:** the IntersectionObserver pattern, with code.
5. **Why editable source beats an npm package:** the shadcn registry model, the
   install command, what "you own the code" means for maintenance.
6. **What's in the catalog:** category table with 2–3 embedded preview links/GIFs.
7. **Close:** repo link, "MIT, free forever, star it if it's useful, PRs welcome,"
   pinned good-first-issues.

Then: set the canonical URL and cross-post to Hashnode; submit the article via
daily.dev "New Post"; later syndicate to Medium's *JavaScript in Plain English* (has a
writer form) and Hackernoon (8 tags + feature image, 3–5 day review).

---

### 12. Newsletters (Wednesday, after the article is live)

**A. One email covers React Status + JavaScript Weekly + Frontend Focus
(→ editor@cooperpress.com):**

> Subject: Motiq — open-source animated React component registry (86 components, MIT)
>
> Hi — I'm Mahammad, sharing a project for possible inclusion in React Status (or
> JavaScript Weekly / Frontend Focus if a better fit).
>
> Motiq is a free, MIT-licensed catalog of 86 animated React components for product
> UI — AI response streaming, deployment pipelines, live presence, animated data.
> The angle that might interest readers: every animation has a deliberate
> prefers-reduced-motion behavior, continuous effects pause offscreen, and it's
> distributed shadcn-registry-style, so developers install editable TypeScript/
> Tailwind source rather than a package. Tailwind v4, React 18/19, RSC-safe.
>
> Live previews: https://motiq.dev/components
> Repo: https://github.com/RMahammad/motiq
> Write-up on the reduced-motion engineering: <dev.to link>
>
> Thanks for the newsletters — long-time reader.
> Mahammad

**B. This Week In React (~62K subs — no form; features shadcn-registry projects
regularly). DM @sebastienlorber on X:**

> Hi Sébastien — long-shot pitch for This Week In React: I open-sourced Motiq,
> 86 animated React components distributed as a shadcn registry (editable source
> install). The differentiator is reduced-motion + a11y engineering on every
> component. Previews: https://motiq.dev/components · Repo:
> https://github.com/RMahammad/motiq. Thanks for the newsletter either way!

(Also make sure your launch thread is visible on X the same week — he curates from an
X list. Bytes/TLDR/Tailwind Weekly have no free submission route — they pick up what
trends, so they're a byproduct, not a target.)

---

### 13. Discord (Monday — before Reddit, low-stakes warm-up)

**Reactiflux `#showcase`** (explicitly sanctioned for library launches —
reactiflux.com/promotion; be an active member first, post once, don't repost updates):

> Just open-sourced Motiq — 86 animated React components for product UI (AI
> streams, deploy pipelines, presence, data motion). Every animation is
> reduced-motion-safe, continuous effects pause offscreen, and it installs as
> editable source via the shadcn registry — free + MIT, no signup.
> Previews: https://motiq.dev/components · Code: https://github.com/RMahammad/motiq
> Would love feedback on the component APIs 🙏
> [attach montage video]

**Next.js Discord:** find the showcase channel after joining (rules pinned there),
adapt the r/nextjs angle (RSC-safety + registry install). **No official shadcn Discord
exists** — the ecosystem lives on X and GitHub; there's an unofficial "Shadcn.io"
community server if you want one more venue.

---

### 14. Product Hunt (weekend, week 2–3 — badge/backlink play, weakest for stars)

- **Tagline (≤60 chars):** `Animated React components you install as editable source`
- Topics: Open Source, Developer Tools, GitHub, React · Gallery: 4× 1270×760, first
  image = best montage frame · Launch 00:01 PT · Comment *depth* now outranks raw
  votes; steady beats spike; no vote-begging.

**Maker first comment (post within minutes of launch):**

> Hey Product Hunt 👋 I'm Mahammad, maker of Motiq.
>
> I spent 6+ months building an animated component library and then made the whole
> thing free and open source. 86 React components for product UI — AI response
> streams, deployment pipelines, live presence, animated data — installable as
> editable source through the shadcn registry. One command, and the TypeScript +
> Tailwind code is yours.
>
> What I'd love feedback on: the balance between "component with props" and "source
> you edit". Motiq bets on editable source — curious whether that matches how your
> team actually consumes UI libraries.
>
> Everything's MIT and live at motiq.dev — no signup anywhere. AMA in the comments
> all day.

---

### 15. LinkedIn (Wed wk2 — credibility play, weak for stars)

Personal profile (5×+ page reach), 3–5 hashtags max: `#opensource #react
#webdevelopment #frontend #tailwindcss`.

**Text post:**

> For the last 6+ months I built an animated React component library on nights and
> weekends. The original plan was to sell it. Last week I open-sourced all of it.
>
> Motiq is 86 components for product interfaces — AI response streaming, deployment
> pipelines, live collaboration, animated data. MIT-licensed, installable as
> editable source, free with no signup.
>
> The engineering I'm proudest of isn't visible in the demos: every animation has a
> deliberate reduced-motion behavior, continuous effects pause offscreen, and
> keyboard/screen-reader support is part of each component's contract — because
> "accessible animation" shouldn't be a contradiction.
>
> What building this taught me about accessibility, API design, and knowing when to
> stop adding features — happy to share in the comments.
>
> Live previews and code in the comments 👇

Plus one **document/carousel post** ("10 components, 10 slides" of screenshots — <!-- not-a-catalog-count: post format, not the catalog size -->
carousels are LinkedIn's top-engagement format).

---

### 16. Mastodon & Threads (5-minute cross-posts)

**Mastodon (fosstodon/hachyderm — hashtags drive discovery; no promo-spam tone; CoC
prohibits commercial promotion, which free+MIT satisfies):**

> I made Motiq, and it's fully open source: 86 animated #React components where
> every animation has a real reduced-motion fallback and a11y is part of the
> contract. Installable as editable source (shadcn registry), MIT, no signup, no
> telemetry. https://github.com/RMahammad/motiq #opensource #webdev #a11y

**Threads (one tag only — that's the platform rule; links are fine):**

> Open-sourced my animated React component library today — 86 components, MIT,
> install the editable source with one command. motiq.dev #react
> [attach montage video]

---

### 17. YouTuber outreach (week 2–3 — one mention beats months of posting)

Email/DM Fireship, Theo (@t3dotgg), Syntax (Wes Bos/Scott Tolinski), and
"open-source roundup" channels. Star-history analyses show creator mentions produce
the biggest single-day spikes.

> Subject: Motiq — free animated React component registry (b-roll included)
>
> Hi <name> — I open-sourced Motiq: 86 animated React components (AI streams,
> deploy pipelines, presence, data motion) installable as editable source via the
> shadcn registry. MIT, no signup. The angle that might fit your audience: every
> animation is reduced-motion-safe and pauses offscreen — "animation you can
> actually ship."
>
> If it's ever useful for a video, here's a folder of ready-made demo clips (loops,
> dark bg, no audio needed): <link to clips folder>
> Site: https://motiq.dev · Repo: https://github.com/RMahammad/motiq
> No expectations — thanks for the content either way.

---

## AFTER THE WAVE — the compounding engine (path to 15K)

Realistic math: a strong wave = 500–3,000 stars. react-bits took ~a year of continuous
drip to add 26K. Your levers, in order:

1. **X drip, near-daily.** One component, one video. Batch-record 10 clips per session.
2. **Recurring Showoff Saturday.** Wasp credits recurring (not one-off) Showoff Saturday
   posts for 6K stars in 6 months. Re-post monthly with a *different* component focus —
   r/coolgithubprojects allows reposts after 6 months with new features.
3. **Answer standing questions.** Search Reddit/X weekly for "animated component
   library", "shadcn animation", "framer motion components", "aceternity alternative" —
   reply helpfully where Motiq genuinely fits. High-intent, evergreen.
4. **Ship visibly.** Inventory is frozen, so frame drip content as hardening: "made all
   94 catalog items pass reduced-motion audit", "cut bundle cost of X by Y%". Each is a
   post.
5. **More articles.** Each deep-dive (offscreen pause pattern, motion tokens, RSC
   boundaries) is a dev.to/HN-able asset. Articles are the only format that works on
   r/programming — never link the repo there directly.
6. **Directory long-tail.** The Week-0 submissions (official shadcn directory,
   awesome-lists → LibHunt) keep paying passively.

Track: https://star-history.com/#RMahammad/motiq&Date

## DO-NOT list (each one can permanently sink the project)

- ❌ Buying stars / star-exchange schemes — GitHub ToS violation, easily detected
- ❌ Invented metrics ("10K developers use Motiq")
- ❌ Same-day identical posts across subs, or the native crosspost button for promo
- ❌ Asking for upvotes on HN or Reddit (voting-ring detection auto-kills)
- ❌ AI-sounding marketing prose in community posts (2026 filters are real; write it yourself)
- ❌ Arguing with critics — thank, note, move on
- ❌ Posting to r/programming (repo links removed), r/ExperiencedDevs (hostile to promo)
