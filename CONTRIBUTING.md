# Contributing to Motiq

Thanks for your interest in improving Motiq! This guide covers how to get the
repo running and the bar every change is held to.

## Getting started

Requires **Node ≥ 20** and **pnpm**.

```bash
git clone https://github.com/RMahammad/motiq.git
cd motiq
pnpm install
pnpm build
pnpm --filter docs-site dev   # http://localhost:3000
```

## Project layout

- `packages/tokens` — design + motion tokens
- `packages/motion` — shared motion primitives
- `packages/react` / `packages/sections` — components and composed blocks
- `packages/registry` — the shadcn registry manifest and its build script
- `apps/docs` — the documentation site (and registry host at `/r`)

Core React packages must **not** import Remotion, Node built-ins, or `next/*` — these
boundaries are enforced by `pnpm lint`.

## Standards (release-blocking)

Every component change must:

- **Be accessible** — WCAG 2.2 AA: keyboard operable, visible focus, correct
  screen-reader semantics, sufficient contrast.
- **Respect reduced motion** — honor `prefers-reduced-motion`; provide a static or
  calmer variant. Continuous animation must pause when offscreen.
- **Be RSC-safe** — add `"use client"` only where genuinely needed.
- **Use semantic tokens** — no hardcoded one-off colors/spacing when a token exists.
- **Include tests** — targeted unit / SSR / reduced-motion / axe coverage.
- **Have a preview and docs** — so it appears in the catalog with a live demo.

## Before you open a PR

Run the full local gate:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm docs:check
node packages/registry/scripts/build-registry.mjs   # if you touched a component
```

## Opening a pull request

1. Fork the repo and create a feature branch (`feat/…` or `fix/…`).
2. Keep the change focused; one component or concern per PR.
3. Fill in the pull-request template.
4. Make sure CI is green.

## Reporting bugs & requesting features

Use the [issue templates](https://github.com/RMahammad/motiq/issues/new/choose).
For bugs, please include a minimal reproduction and your environment (React / Next.js /
Tailwind versions).

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](./LICENSE).
