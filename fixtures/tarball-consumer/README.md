# tarball-consumer fixture

Proves the **published artifacts** are consumable — the [`docs/14`](../../docs/14-testing-strategy.md) rule
"fixtures install the packed tarball, not monorepo source." Deliberately **outside** the pnpm workspace
globs (`packages/*`, `apps/*`) so it gets no workspace symlinks.

## Run

```bash
# from repo root
export npm_config_verify_deps_before_run=false
pnpm build                                   # build packages
for p in tokens motion react; do (cd packages/$p && pnpm pack --pack-destination ../../fixtures/tarball-consumer); done
cd fixtures/tarball-consumer
pnpm install --ignore-workspace              # installs @scope/* from the .tgz via pnpm.overrides
node smoke.mjs                               # resolution + "use client" + SSR checks
```

`pnpm pack` rewrites `workspace:*` inter-deps to real versions; the `pnpm.overrides` in
[package.json](./package.json) redirect those to the local tarballs so the whole
`@scope/react -> @scope/motion -> @scope/tokens` chain resolves from packed artifacts.

> The `*.tgz` files are git-ignored; regenerate with the steps above. Wiring this into CI needs a
> verdaccio (or tarball-cache) step — tracked in [`docs/14`](../../docs/14-testing-strategy.md).
