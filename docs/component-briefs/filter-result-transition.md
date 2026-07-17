# Brief — Filter Result Transition

- **Problem:** filtered/searched collections need smooth enter/leave/reorder + result-count transitions without breaking focus or over-animating large sets. Not a data table or search library.
- **Use case:** product/project/doc search, asset browsers, user directories, dashboard filters, commerce categories, saved views, command results.
- **Main states:** results · empty · loading · error · active-filter summary. Works with cards/list/compact grid via `layout` + `renderItem`.
- **Behavior:** items entering after a filter change, items leaving, reordering, result-count morph (`useAnimatedNumber`), clear filters, query changes, optional grouping/load-more compatibility.
- **Critical interaction:** filtering must NOT destroy keyboard focus — if `focusedItemId` disappears, call `onFocusFallback` (or focus a stable anchor); do not move focus to page root; do not announce every change noisily; do not delay results for animation.
- **Animation purpose:** brief insertion/removal, stable layout movement (`layout`), direction-aware only when meaningful, count morph, empty-state transition, reduced-motion immediate update. Cap stagger (`staggerLimit`) — no long stagger on large sets; no replaying every card on minor changes.
- **API sketch:** `items`, `getItemId`, `renderItem`, `resultLabel?`, `loading?`, `error?`, `empty?`, `activeFilters?`, `onRemoveFilter?`, `onClearFilters?`, `focusedItemId?`, `onFocusFallback?`, `layout?`, `staggerLimit?`.
- **Accessibility:** updated result-count announcement (polite); semantic result container; clear active filters + keyboard-accessible removal; focus fallback when focused item disappears; reduced-motion; loading/error/empty labels + empty-state guidance.
- **Mobile:** single-column, filter chips wrap, tap-remove.
- **Dependencies:** motion (AnimatePresence + layout) + `@motiq/utils` + `@motiq/primitives` (useAnimatedNumber, streamItemVariants, useReducedMotion). No new deps.
- **Similarity concern:** generic; differentiate via focus-fallback contract + stagger cap + count morph. Low.
- **Tier:** Free.
- **Release criteria:** rapid gate + focus-fallback + stable item identity + count update verified.
