<div align="center">

# Motiq

**Beautiful, production-ready animated React & shadcn components — installed as editable source.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![CI](https://github.com/RMahammad/motiq/actions/workflows/ci.yml/badge.svg)](https://github.com/RMahammad/motiq/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-19-149ECA.svg?logo=react&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-black.svg?logo=next.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38BDF8.svg?logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg?logo=typescript&logoColor=white)

[Documentation](https://motiq.dev) · [Browse the catalog](https://motiq.dev/components) · [Contributing](./CONTRIBUTING.md)

</div>

---

Motiq is a **free, open-source** collection of animated components for React and
Next.js. You don't `npm install` a runtime package — you install the **real, editable
source** straight into your project with the [shadcn](https://ui.shadcn.com/docs/cli)
CLI, then own and adapt it however you like.

Every component is **accessible (WCAG 2.2 AA)**, **reduced-motion-safe**, **RSC-safe**,
and themed through semantic design tokens — the parts that copy-paste snippet kits
usually skip.

## Why Motiq

- **You own the code.** Components are copied into your repo as source — no black-box
  dependency, no runtime lock-in, no license checks.
- **Accessible by default.** Keyboard support, focus management, screen-reader
  semantics, and `prefers-reduced-motion` handling are built in, not bolted on.
- **Server-Component safe.** `"use client"` boundaries are placed deliberately so
  components drop into the Next.js App Router without hydration surprises.
- **A coherent system.** Shared design tokens and motion primitives mean components
  look and move like they belong together — not four unrelated snippets.
- **Motion where it matters.** Built on [Motion for React](https://motion.dev); simple
  effects use CSS, heavier engines stay component-local and lazy.

## Quick start

Install any component with the shadcn CLI:

```bash
npx shadcn@latest add https://motiq.dev/r/<component>.json
```

For example:

```bash
npx shadcn@latest add https://motiq.dev/r/ai-response-stream.json
```

The command copies the component's source (and any shared helpers it needs) into your
project. Browse every component with a live preview and its install command at
**[motiq.dev](https://motiq.dev)**.

> **Requirements:** React 19, a Tailwind CSS v4 setup, and a shadcn-initialized project
> (`npx shadcn@latest init`).

## What's in the catalog

**70 installable items** — animated components, composed blocks, and multi-component
packs — across 17 categories:

| | |
| --- | --- |
| **AI interfaces** | response streams, tool-call activity, agent workspaces |
| **Developer tools** | deploy pipelines, log streams, request inspectors |
| **Collaboration** | presence stacks, comment threads, review workspaces |
| **Data motion** | KPI morphs, animated lists, live charts |
| **Commerce** | checkout progress, cart transitions, variant selectors |
| **Productivity** | kanban boards, timelines, approval workflows |
| **Text & creative UI** | reveal effects, gradient text, animated icons |
| **Backgrounds** | animated and state-driven product backgrounds |

…plus Mobile interactions, File workflows, Security & accounts, Communication, and
animated shadcn primitives. See the full, searchable catalog at
[motiq.dev/components](https://motiq.dev/components).

## Local development

Requires **Node ≥ 20** and **pnpm**.

```bash
pnpm install           # install workspace dependencies
pnpm build             # build the packages
pnpm --filter docs-site dev   # run the docs site locally
```

Regenerate the registry after editing a component:

```bash
node packages/registry/scripts/build-registry.mjs
```

Useful checks:

```bash
pnpm lint          # import-boundary + lint rules
pnpm typecheck     # strict TypeScript
pnpm test          # unit + SSR + reduced-motion + axe
pnpm docs:check    # documentation consistency
```

## Project structure

```
packages/
  tokens/      Design + motion tokens (CSS variables, TS constants)
  motion/      Shared motion primitives (reduced-motion, offscreen pause, …)
  react/       The component library
  sections/    Composed sections and blocks
  registry/    shadcn registry manifest + build script
apps/
  docs/        Documentation site (also hosts the registry at /r)
  storybook/   Component stories
docs/          Engineering docs, standards, and ADRs
```

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) for how to set up
the repo, the standards every component must meet (accessibility, reduced motion,
tests, docs), and how to open a pull request. Please also read our
[Code of Conduct](./CODE_OF_CONDUCT.md).

## License

[MIT](./LICENSE) © Mahammad Rustamov. Use, modify, and ship these components in
personal and commercial projects.
