# v0.2.0 — installs that look like the previews

Two things a stranger installing Motiq would have hit, and one they asked for.

https://motiq.dev

---

## Design tokens now install with the component

Components style themselves with `var(--color-surface)`, `var(--color-fg)`, … . Those
tokens lived only in the docs app, so **motiq.dev looked right while a real install did
not**: in a stock `create-next-app` + `shadcn init` project, 11 of the 14 `--color-*`
properties a component used were undefined. Card and code-block backgrounds computed to
`rgba(0,0,0,0)`, and secondary text fell back to shadcn's near-white *background* colours
— about **1.09:1** contrast.

The registry now ships 29 tokens (light + dark) as a `cssVars` block on every item, so
`shadcn add` writes them into your `globals.css` once. Measured after the fix: **4.97:1**
in light, **7.52:1** in dark, cards and code surfaces solid in both themes.

Names shadcn and Tailwind own — `--background`, `--foreground`, `--border`, `--accent`,
`--ring`, `--font-sans`, `--font-mono`, `--shadow-sm/md/lg` — are deliberately **not**
shipped, so your own components are untouched. Verified: shadcn's `bg-muted`, `bg-accent`,
`shadow-sm` and `Button` render identically before and after.

## `npx shadcn@latest add @motiq/<name>`

[shadcn-ui/ui#11220](https://github.com/shadcn-ui/ui/pull/11220) merged, so `@motiq` ships
in the shadcn CLI's own registry directory and the short form resolves with **no
`components.json` entry**. The full registry URL keeps working for older CLI versions.

## Driving the live components

Many components animate content **as it arrives** — a response that types itself, a log
that scrolls, a pipeline that advances. That movement comes from your data, and the feed
that produced it in the previews was never part of what you installed. Hand one a finished
array and it animates once, then sits still.

- **`useSequence`**, a new primitive in `@motiq/primitives`, drives those props from a list
  over time — for demos, fixtures and onboarding tours.
- **“Driving the live data”** now appears on all **27** components whose motion depends on
  the app feeding them, each with a snippet matched to its own props.
- **[Connecting live data](https://motiq.dev/guides/live-data)** is a new guide covering
  real wiring: reading a `fetch` stream, subscribing to SSE/WebSocket, and polling — plus
  the identity rule that stops a list re-animating on every update. Its examples are
  typechecked *and* executed against a mocked network.

## Compatibility

No breaking changes; nothing to migrate. Installing a component adds the token block to
your `globals.css` — expected, and idempotent across further installs.

Verified on **motion 12.42.2 and 13.1.0** (696 tests pass on both), React 19, Next.js 16
App Router and Vite 7, in clean-room installs rather than only in-repo.

**Known limitations.** Verification is Chromium-only; there is no cross-browser E2E yet
(Safari QA is still outstanding for the `riso-registration` background). Two interaction
tests are order-dependent under heavy parallel load and pass in isolation. The `motion`
dependency is unpinned, so a future major reaches consumers untested.

---

# v0.1.0 — first public release

Motiq is a free, MIT-licensed catalog of animated React components for **product
interfaces** — AI response streams, deployment pipelines, live data, collaboration —
installed as editable source through a shadcn-compatible registry. There is no runtime
package, no account, and no vendor lock-in: the CLI copies TypeScript and Tailwind
source into your project and you own it from there.

https://motiq.dev

---

## What's in it

**86 components + 8 workflow blocks + 4 one-command packs**, across 20 categories —
94 catalog items in all, published as a 100-item shadcn registry.

## Install

```bash
npx shadcn@latest add https://motiq.dev/r/ai-response-stream
```

Every component page carries its own copy-ready command. The registry is public and
unauthenticated — nothing to sign up for, nothing to configure.

You can also install straight from this repository, which is itself a shadcn registry,
and pin to this tag:

```bash
npx shadcn@latest add RMahammad/motiq/ai-response-stream#v0.1.0
```

## Three to start with

| Component | What it does |
| --- | --- |
| [**AI Response Stream**](https://motiq.dev/components/ai-response-stream) | A streaming assistant response your app owns: text, fenced code with copy, inline `[n]` citations to a sources rail, and streaming / stopped / complete / error states with Stop, Retry, and Copy. Presentation only — it never calls a model. |
| [**Deployment Pipeline**](https://motiq.dev/components/deployment-pipeline) | A build-and-deploy run with real failure handling: stages progress, a test stage fails, logs expand in place, and Retry is focused and re-run to green. |
| [**KPI Number Morph**](https://motiq.dev/components/kpi-number-morph) | Metric values that morph digit-by-digit between states, with tabular alignment so the layout never jumps mid-transition. |

[Browse all 86 components with live previews →](https://motiq.dev/components)

## Compatibility

| Requirement | Supported |
| --- | --- |
| React | 18.3+ or 19 (`>=18.3 <20`) |
| Tailwind CSS | v4 (semantic tokens; v3 is not supported) |
| Project setup | A [shadcn-initialized](https://ui.shadcn.com/docs/installation) project |
| Frameworks | Next.js App Router (RSC-safe, explicit `"use client"` boundaries) and Vite — both proven by consumer fixtures in CI |
| Node.js (to build *this repo*; not needed to install components) | 22.13 or newer |
| Browsers | Modern evergreen — see limitations below |

## What "production-ready" means here

Every component in this release is held to the same baseline, enforced in CI:

- **Accessibility** — WCAG 2.2 AA target: keyboard operation, visible focus, correct
  screen-reader semantics, and state conveyed by more than color alone.
- **Reduced motion** — every animation has a deliberate `prefers-reduced-motion`
  behavior, and continuous animation pauses when scrolled offscreen.
- **RSC safety** — client boundaries are explicit and SSR-tested.
- **Tests** — 677 tests across unit, SSR, reduced-motion, and axe accessibility checks.

## Known limitations

Stated plainly, because a first release should be honest about its edges:

- **No live browser-matrix testing.** Modern evergreen browsers are assumed and
  unverified; there has been no Safari/Firefox/mobile pass. Riso- and mask-based
  backgrounds are the most likely to differ.
- **No live screen-reader pass.** Accessibility is covered by automated axe tests and
  manual source review, not by a session with VoiceOver/NVDA/JAWS.
- **No runtime performance profiling.** `size-limit` budgets pass; there has been no
  Lighthouse or runtime profiling run.
- **One flaky test.** `cart-item-transition` intermittently fails under full-suite
  parallel load and passes in isolation. It is a test-harness flake, not a component
  defect, and is tracked for a fix.
- **`@motiq/<name>` shorthand is not live yet.** Installs use the full registry URL
  (or the GitHub form above) until the namespace is accepted into the official shadcn
  registry directory. The submission is prepared and verified.
- **Versioning is catalog-wide.** Every item ships at `0.1.0`; per-component versions
  begin diverging in later releases.

## Links

- **Catalog:** https://motiq.dev/components
- **Workflow packs:** https://motiq.dev/packs
- **Getting started:** https://motiq.dev/getting-started
- **Contributing:** [CONTRIBUTING.md](./CONTRIBUTING.md)

MIT licensed — free for commercial use. If Motiq is useful to you, a
[star](https://github.com/RMahammad/motiq) is how other developers find it.
