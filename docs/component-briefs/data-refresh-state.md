# Brief — Data Refresh State

- **Problem:** dashboards/data products need a rich refresh indicator (last-updated, next, progress, partial, stale, offline, error) with manual/auto controls — not just a spinner. The app owns the actual fetch + progress.
- **Use case:** dashboard/query refresh, sync, polling, cache revalidation, report generation, live metrics, offline recovery, manual refresh.
- **States:** idle/checking/refreshing/partially_updated/success/stale/offline/error/paused/cancelled (use `getStatusMeta`/`statusVars`).
- **Info:** lastUpdated, nextRefresh?, progress?, updatedCount?, totalCount?, source?, staleness?, connection?, errorSummary?, retryAt?, automatic mode.
- **Main interaction:** manual refresh, cancel, retry, pause/resume auto, change interval cb, view details, dismiss success, modes: compact / inline / panel.
- **Animation purpose:** start, progress, partial completion, success, stale transition, offline transition, error, recovery. No endless idle spinning, no fake progress, no color-only success/error.
- **API sketch:** `state`, `lastUpdated?`, `nextRefresh?`, `progress?`, `updatedCount?`, `totalCount?`, `source?`, `automatic?`, `interval?`, `onRefresh?`, `onCancel?`, `onRetry?`, `onPause?`, `onResume?`, `onIntervalChange?`, `mode?`, `formatTimestamp?`.
- **Accessibility:** state in text; progress semantics when determinate (role=progressbar + aria-valuenow); indeterminate labeled; reduced-motion fallback; retry/cancel keyboard access; live-region that doesn't spam; offline + stale in text; status not color-only.
- **Mobile:** compact/inline modes fit narrow; panel stacks.
- **Dependencies:** motion + `@motionkit/utils` + `@motionkit/primitives` (useAsyncStatus optional, useAnimatedNumber for counts, formatTimestamp, getStatusMeta, statusVars, useReducedMotion). No new deps.
- **Similarity concern:** refresh indicators exist; differentiate via partial/stale/offline states + auto-mode controls + modes. Low.
- **Tier:** Free.
- **Release criteria:** rapid gate + manual/cancel/retry callbacks + determinate progress semantics + offline/stale labels + reduced-motion verified.
