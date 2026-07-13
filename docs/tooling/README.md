# Documentation validation tooling

> Zero-dependency Node ESM scripts (run with `node`, no install needed). They enforce documentation consistency deterministically instead of via prompt instructions ([`docs/24-claude-code-workflow.md`](../24-claude-code-workflow.md)).
> **Status:** 🟢 runnable now. **Not yet wired into CI** (no CI exists — Phase 1). Wire them as CI checks + the doc hooks when the repo is scaffolded.

## Scripts

| Script | Checks | Exit |
|---|---|---|
| `check-links.mjs` | relative Markdown links resolve on disk (skips http/mailto/anchors + code blocks; excludes the frozen archived plan) | non-zero on any broken link |
| `check-adr-index.mjs` | every ADR file has a unique number and appears in `adrs/README.md`; index has no dangling links | non-zero on mismatch |
| `check-duplicate-titles.mjs` | no two `docs/` files share a `# ` title (excludes archive) | non-zero on duplicates |
| `check-stale-dates.mjs` | verification/review dates not older than a threshold (`--days N`, default 180; `--reference YYYY-MM-DD`) | non-zero if stale |
| `check-inventory.mjs` | component inventory rows vs `packages/*/src` component files (no-op until packages exist) | non-zero on drift |

## Run all

```bash
node docs/tooling/check-links.mjs
node docs/tooling/check-adr-index.mjs
node docs/tooling/check-duplicate-titles.mjs
node docs/tooling/check-stale-dates.mjs
node docs/tooling/check-inventory.mjs
```

## Planned additions (need packages first)

- **Every public component has a doc page** — cross-check `packages/*/src` exports against `docs/` / docs-site pages.
- **Example exports valid** — parse component doc examples and confirm the imported symbols exist in the package `exports`.
- **References to removed packages** — flag doc mentions of packages no longer in the workspace.
