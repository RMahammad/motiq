# Motionstack

Beautiful, production-ready **animated React & shadcn components** you install as
editable source. Accessible (WCAG 2.2 AA), reduced-motion-safe, RSC-safe, and
delivered through a [shadcn](https://ui.shadcn.com/docs/cli)-compatible registry.

Free and open source. The **entire catalog** — 60+ components, blocks, and packs —
is public and installable. No account, no paywall.

## Install a component

Every item installs straight into your app with the shadcn CLI:

```bash
npx shadcn@latest add https://motionstack.dev/r/<component>.json
```

For example:

```bash
npx shadcn@latest add https://motionstack.dev/r/ai-response-stream.json
```

The command copies real, editable source into your project — you own it and can
change it freely. Browse the full catalog and live previews at
**[motionstack.dev](https://motionstack.dev)**.

## What's inside

- `@scope/tokens` — design tokens
- `@scope/motion` — shared motion primitives (reduced-motion, offscreen pause, …)
- `@scope/react` — the component library
- `@scope/sections` — composed sections/blocks
- `packages/registry` — the shadcn registry manifest + build
- `apps/docs` — the docs site (also hosts the registry at `/r`)

## Develop

Requires Node ≥ 20 and pnpm.

```bash
pnpm install
pnpm build            # build packages
pnpm dev --filter docs-site   # run the docs site locally
```

Regenerate the registry after editing components:

```bash
node packages/registry/scripts/build-registry.mjs
```

## License

[MIT](./LICENSE) © Mahammad Rustamov. You may use, modify, and ship these
components in personal and commercial projects.
