# Migration guide — vX → vY

> Used by the [`migration-authoring`](../../.claude/skills/registry-release/SKILL.md) skill. One guide per breaking major.

## Summary
What changed and why (link the ADR).

## Affected packages
- `@scope/…`

## Breaking changes
| Change | Before | After | Codemod? |
|---|---|---|---|
| … | `<Old/>` | `<New/>` | `npx <name> codemod <id>` / manual |

## Before / after examples
```tsx
// before (vX)

// after (vY)
```

## Deprecation timeline
- Deprecated in: vX.N (dev warning)
- Removed in: vY.0
- Compatibility window: at least one major ([`19`](../19-support-and-deprecation.md))

## Automated codemod
Feasibility + command, or state "manual migration required" and why.

## Versioning impact
major / minor / patch + changeset notes.

## Rollback guidance
How to pin the previous version safely.

## Related docs
- [`18-release-process.md`](../18-release-process.md) · [`09-component-api-standard.md`](../09-component-api-standard.md)
