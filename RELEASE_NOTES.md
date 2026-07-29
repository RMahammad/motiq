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
