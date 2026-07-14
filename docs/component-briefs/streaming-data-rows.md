# Brief — Streaming Data Rows

- **Problem:** operational dashboards need live table rows that insert/update/resort smoothly — without a full data-grid library.
- **Use case:** transactions, orders, queue jobs, API requests, build runs, device/telemetry events.
- **Main states/behavior:** row insertion · update · status change · value change · removal · brief change emphasis · sort with continuity · paused · empty · error · loading.
- **Animation purpose:** row arrival, reposition after sort, changed-cell emphasis (brief, non-flashing, with a non-animated fallback), status transition, removal. Not every cell continuously.
- **Table behavior:** default renders a semantic HTML `<table>` (thead/th scope, tbody). Column defs + cell renderers + row keys + controlled sort + optional row actions + responsive compact/mobile row + horizontal overflow.
- **API sketch:** `rows`, `columns` ({key,header,render?,sortable?,align?}), `getRowId`, `sort?` ({key,dir}), `onSortChange?`, `paused?`, `highlightDuration?`, `renderMobileRow?`, `onRowAction?`, `announceUpdates?`.
- **Accessibility:** semantic headers, `aria-sort` state, change indication not color-only (icon/▲▼ or text), SR-safe update summaries (rate-limited), reduced-motion, keyboard row actions, no focus loss on resort/update (stable keys + layout).
- **Large data:** document this is for animated live subsets; integration guidance for virtualization; no data-table dep by default.
- **Mobile:** `renderMobileRow` or a stacked compact card view.
- **Dependencies:** motion + `@motionkit/utils` + `@motionkit/primitives`. No new deps.
- **Similarity concern:** many tables exist; differentiate via live insert/update/sort continuity + change emphasis. Low–moderate.
- **Tier:** Pro.
- **Release criteria:** rapid gate + stable row identity + focus preservation verified.
