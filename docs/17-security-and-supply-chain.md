# 17 — Security, supply chain & code quality

> **Type:** 🟢 Canonical for supply-chain, secrets, and code-quality standards · **Implementation status:** 🟡 Partial (OpenSSF posture shipped; release signing pending) · **Last reviewed:** 2026-09-04
> **Owns:** secret handling, publishing security, OpenSSF posture, strict-TS policy, coding conventions.
> **Related:** [`16-commercial-packaging.md`](16-commercial-packaging.md) · [`18-release-process.md`](18-release-process.md) · [`05-dependency-decisions.md`](05-dependency-decisions.md) · [`dependency-review` skill](../.claude/skills/component-review/SKILL.md)

## Security & supply chain

- **Secret handling** — **never** place commercial license secrets, tokens, or keys in any client package or frontend bundle. No runtime license checks ([`16`](16-commercial-packaging.md)).
- **License-key handling** — install-time only (private-registry token / registry auth), short-lived, scoped, revocable.
- **Client/server separation** — server-only code behind the `node` export condition; enforced by boundaries ([`03`](03-architecture.md)).
- **Publishing** — least-privilege npm publish permissions; **2FA required**; npm **provenance** (`--provenance`) or current equivalent; signed releases where practical.
- **CI permissions** — minimal scopes; publish tokens only in the release job.
- **Dependency hygiene** — committed lockfile; Renovate/Dependabot; vulnerability response process; minimal runtime deps to reduce malicious-dependency surface ([`05`](05-dependency-decisions.md), [`dependency-review`](../.claude/skills/component-review/SKILL.md)).
- **Source maps** — no secrets in maps; decide public vs private maps per package.
- **No customer-data collection.** **Telemetry off by default**, opt-in only, disclosed.
- **Build reproducibility** — pinned toolchain; deterministic builds.

## OpenSSF posture

Two OpenSSF numbers get confused with each other constantly, and only one of them is
something this repository can decide.

| | **Scorecard** | **Criticality score** |
|---|---|---|
| Measures | how safely this repo is *run* | how much the ecosystem *depends* on it |
| Range | 0–10 | 0–1 |
| Moved by | configuration and process — this section | adoption, contributors, issue traffic, time |
| Our control | direct | indirect and slow |

The "critical infrastructure" bar people cite — **criticality ≥ 0.4** — is the second one.
No file added to this repository moves it. It is a weighted mean of ten observed signals
(age, recency, contributor count, contributor-org count, commit frequency, releases,
issues opened/closed in 90 days, comment frequency, downstream mentions), each normalized
against a threshold set by projects like Kubernetes and Linux. Writing more workflows
scores exactly zero of it.

### Measuring criticality

[`scripts/openssf-criticality.mjs`](../scripts/openssf-criticality.mjs) reimplements
upstream's algorithm (`config/scorer/original_pike.yml` plus `internal/scorer/algorithm`)
against the GitHub API, so the number is measured rather than estimated:

```bash
pnpm openssf:criticality          # add GITHUB_TOKEN for the auth-only signals
```

It prints per-signal **headroom** — how much of the final score each signal is currently
leaving on the table — which is the only useful way to read it. A signal that cannot be
collected is dropped from the denominator, exactly as upstream does, so a partial run
reports an *optimistic* score; the script says which ones were dropped.

Baseline on 2026-09-04, nine of ten signals collected: **0.215**.

| signal | raw | normalized |
|---|---|---|
| created_since | 1.7 months | 0.21 |
| updated_since | 0.8 months | 1.00 |
| contributor_count | 1 | 0.08 |
| org_count | 0 | 0.00 |
| commit_frequency | 0.35 / week | 0.04 |
| recent_release_count | 2 | 0.33 |
| updated_issues_count | 0 | 0.00 |
| closed_issues_count | 0 | 0.00 |
| github_mention_count | 20 | 0.23 |

Recency is already maxed; everything else is adoption. The binding constraints are
contributor count, contributor orgs, issue traffic, and downstream mentions — none of
which CI can manufacture. Repo age accrues on its own schedule. This is the expected shape
for a young single-maintainer project and is not a defect to be fixed in a workflow.

(A run that drops a signal reports higher — 0.235 when commit-frequency stats were
unavailable — because the dropped weight leaves the denominator. Compare runs only when
the same signals were collected.)

### Scorecard — what is implemented

| Check | Status | Where |
|---|---|---|
| Security-Policy | ✅ | [`SECURITY.md`](../SECURITY.md) |
| License | ✅ | [`LICENSE`](../LICENSE) |
| CI-Tests | ✅ | [`ci.yml`](../.github/workflows/ci.yml) |
| SAST | ✅ CodeQL, `security-extended` | [`codeql.yml`](../.github/workflows/codeql.yml) |
| Dependency-Update-Tool | ✅ npm + github-actions | [`dependabot.yml`](../.github/dependabot.yml) |
| Pinned-Dependencies | ✅ actions by SHA; committed lockfile | [`ci.yml`](../.github/workflows/ci.yml) |
| Token-Permissions | ✅ explicit `permissions:` per workflow | all workflows |
| Dangerous-Workflow | ✅ no `pull_request_target`, no untrusted checkout | — |
| Scorecard itself | ✅ weekly, results published | [`scorecard.yml`](../.github/workflows/scorecard.yml) |

The README badge is deliberately **not** added yet. `publish_results` has to run on the
default branch once before `img.shields.io/ossf-scorecard/...` resolves to anything, and
the first score will be held down by the four checks below. Read the real number at
<https://scorecard.dev/viewer/?uri=github.com/RMahammad/motiq>, then decide whether it
belongs above the fold.

### Scorecard — what is not, and why

- **Branch-Protection** — a repository *setting*, not a file. Requires, on `main`: require
  a PR before merging, require status checks (`verify`, `fixtures`), and dismiss stale
  approvals. Must be set by the owner in repo settings.
- **Signed-Releases / Packaging** — needs a publish workflow with npm provenance
  (`npm publish --provenance`, `id-token: write`). Deliberately not written yet: the
  changeset config still declares `"access": "restricted"`, so the publishing target is an
  open decision ([`18`](18-release-process.md)). Provenance is the requirement recorded above.
- **Code-Review** — needs a second reviewer on merged PRs. Structurally unavailable to a
  single maintainer; will improve only with contributors.
- **Contributors** — needs contributors from ≥ 2 organizations. Same constraint.
- **Fuzzing** — not pursued. This is a presentational component library with no parser and
  no untrusted input surface; a fuzzer here would buy points, not safety.
- **CII-Best-Practices** — the OpenSSF Best Practices badge is a self-certification
  questionnaire at <https://www.bestpractices.dev>. Worth filling in; most criteria are
  already met by the rows above.

## Code-quality standards

### Strict TypeScript

Evaluate/enable per package: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`, `isolatedModules`, `noUncheckedSideEffectImports`.

Where a strict option causes disproportionate complexity, relax **per-package** with a documented reason (not globally). Known friction points:
- `exactOptionalPropertyTypes` with third-party prop spreads.
- `noPropertyAccessFromIndexSignature` on token maps.

### Also configure

ESLint (+ import-boundary plugin), Prettier, unused-code detection (`knip`), API surface checks (`publint` + `@arethetypeswrong/cli`), type-level tests (`expect-type`/`tsd`), Changesets, Renovate/Dependabot, security scanning, npm provenance, committed lockfile, reproducible builds. Conventional commits only if it earns its keep (Changesets already drive versioning).

### Coding conventions

| Concept | Convention |
|---|---|
| Component names | `PascalCase` |
| File names | `kebab-case.tsx` |
| Hooks | `useX` |
| Utilities | `camelCase` |
| Tokens | `--motion-*` / `--<comp>-*` |
| Stories | `*.stories.tsx` |
| Tests | `*.test.tsx` / `*.a11y.test.ts` / `*.ssr.test.tsx` |
| Public types | exported + documented |
| Internal types | not exported |
| Event callbacks | `onX` |
| Controlled props | `value` / `onValueChange` (+ `defaultValue`) |
| Boolean props | positive (`once`, not `disableRepeat`) |
| Data attributes | `data-slot` / `data-state` / `data-motion` |
| Motion presets | typed unions |

Detailed API rules live in [`09-component-api-standard.md`](09-component-api-standard.md) (the canonical owner of API conventions); this section owns the code-quality tooling.
