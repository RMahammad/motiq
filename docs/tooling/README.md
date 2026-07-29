# Documentation validation tooling

> Zero-dependency Node ESM scripts (run with `node`, no install needed). They enforce documentation consistency deterministically instead of via prompt instructions ([`docs/24-claude-code-workflow.md`](../24-claude-code-workflow.md)).
> **Status:** 🟢 runnable now and **wired into CI** (`.github/workflows/ci.yml`) and the `pnpm docs:check` local gate.

## Scripts

| Script | Checks | Exit |
|---|---|---|
| `check-links.mjs` | relative Markdown links resolve on disk (skips http/mailto/anchors + code blocks; excludes the frozen archived plan) | non-zero on any broken link |
| `check-adr-index.mjs` | every ADR file has a unique number and appears in `adrs/README.md`; index has no dangling links | non-zero on mismatch |
| `check-duplicate-titles.mjs` | no two `docs/` files share a `# ` title (excludes archive) | non-zero on duplicates |
| `check-stale-dates.mjs` | verification/review dates not older than a threshold (`--days N`, default 180; `--reference YYYY-MM-DD`) | non-zero if stale |
| `check-inventory.mjs` | component inventory rows vs `packages/*/src` component files (no-op until packages exist) | non-zero on drift |
| `check-catalog-counts.mjs` | hand-written catalog counts in launch-facing docs vs `apps/docs/lib/catalog.ts` + `packages/registry/registry.json`; also rejects rounded claims like "90+ components" | non-zero on any stale or rounded count |

## Run all

```bash
node docs/tooling/check-links.mjs
node docs/tooling/check-adr-index.mjs
node docs/tooling/check-duplicate-titles.mjs
node docs/tooling/check-stale-dates.mjs
node docs/tooling/check-inventory.mjs
node docs/tooling/check-catalog-counts.mjs
```

…or all of them at once: `pnpm docs:check`.

### Counts

`check-catalog-counts.mjs` is the reconciliation the catalog never had. Every count in
README / LAUNCH / AGENTS / `assets/README.md` had been hand-authored and froze at an old
snapshot while new batches shipped. It checks an **allow-list** of launch-facing files only —
`docs/**` is planning material full of historical targets and competitor figures, which are
not claims about today's catalog. A line whose number is real but scoped differently (the
registry-type breakdown, one pack's contents) opts out with an inline
`<!-- not-a-catalog-count: why -->` marker.

Site pages never need the check: they derive their numbers from `catalog.ts` at build time.

## Planned additions (need packages first)

- **Every public component has a doc page** — cross-check `packages/*/src` exports against `docs/` / docs-site pages.
- **Example exports valid** — parse component doc examples and confirm the imported symbols exist in the package `exports`.
- **References to removed packages** — flag doc mentions of packages no longer in the workspace.
