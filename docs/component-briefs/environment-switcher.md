# Brief — Environment Switcher

- **Problem:** dev/ops apps need a rich environment picker (dev/staging/prod, regions, previews) that shows status/health and guards production — more than a `<select>`. The app owns the actual switch.
- **Use case:** environment/region/tenant/branch/preview selection, API console context.
- **Env data:** id, name, type, status, region?, branch?, version?, lastDeploy?, url?, health?, permissions?, warning?, metadata?.
- **States:** available/loading/active/degraded/offline/deploying/locked/restricted (use `getStatusMeta`/`statusVars`).
- **Main interaction:** current-env summary trigger → listbox/menu of environments with search + keyboard nav; quick switch; confirmation before production when configured; disabled envs with reasons; recent/favorite; optional groups; controlled `value`; `onValueChange`; loading/error during transition + retry.
- **Safety:** production switching visually clear (icon + label + warning text, not color alone); app can `requireProductionConfirmation`; never claims to change a real backend — the app owns it.
- **Animation purpose:** menu expansion, active-env movement, loading transition, successful switch, error restoration, status updates. No excessive card movement.
- **API sketch:** `environments`, `value`, `defaultValue`, `onValueChange`, `switching?`, `error?`, `onRetry?`, `requireProductionConfirmation?`, `recentIds?`, `favoriteIds?`, `groups?`, `renderEnvironment?`, `formatTimestamp?`.
- **Accessibility:** appropriate combobox/listbox/menu/dialog semantics; keyboard nav; current value announced; disabled reason; production warning in text; reduced-motion; focus restoration; touch-friendly.
- **Mobile:** trigger opens a full-width sheet/menu; targets ≥44px.
- **Dependencies:** motion + `@motionstack/utils` + `@motionstack/primitives` (useControllableState, useAsyncStatus, getStatusMeta, statusVars, useReducedMotion). No new deps.
- **Similarity concern:** avoid a generic combobox clone; differentiate via status/health + production guard + recents/favorites. Low.
- **Tier:** Free.
- **Release criteria:** rapid gate + controlled selection + production confirmation + disabled reason + error retry verified.
