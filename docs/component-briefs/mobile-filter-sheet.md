# Brief — Mobile Filter Sheet

- **Problem:** mobile browse/search needs a real filter workflow (draft vs applied, groups, chips, result count, apply/cancel/clear) in a bottom-sheet/full-screen surface — more than a sheet of checkboxes. Desktop needs a usable fallback (side panel/popover). Not a query language.
- **Use case:** product/project/asset/user/dashboard/doc/order/media filtering, saved searches, mobile browse.
- **Filter groups (app-defined):** checkbox / radio / range / date / search-within-options / hierarchical / custom; disabled options + reasons; option counts; clear-group; clear-all; apply; cancel.
- **State:** draft filters vs applied; cancel restores applied; reset; loading option counts; error; controlled `open` + `value`.
- **Main interaction:** open sheet, edit draft, live result count (`useAnimatedNumber`), apply commits draft, cancel restores, clear-all; collapsible groups; selected chips; unsaved-change confirm when configured; swipe-to-close when safe (never gesture-only close).
- **Mobile behavior:** bottom-sheet or full-screen mode; sticky header + scrollable body + sticky result footer; safe-area insets; keyboard-safe search; back-button integration point.
- **Desktop fallback:** side panel / popover / inline drawer (not mobile-only).
- **Animation purpose:** sheet entrance, group expansion, selected-chip insertion, result-count change, apply/cancel transitions, clear-all. No long stagger across every option.
- **API sketch:** `open`, `onOpenChange`, `groups`, `value`, `defaultValue`, `onValueChange`, `onApply`, `onCancel`, `onClear`, `resultCount?`, `loading?`, `error?`, `mode?` ("sheet"|"fullscreen"|"panel"), `confirmDiscard?`, `renderFilter?`, `renderFooter?`.
- **Accessibility:** dialog/sheet semantics; focus trap + restoration; keyboard-accessible controls; group labels; selected state; result-count announcement; reduced-motion; ≥44px targets; sticky footer reachable at 200% zoom; no gesture-only close.
- **Dependencies:** motion + `@motionstack/utils` + `@motionstack/primitives` (useControllableState, useAnimatedNumber, useReducedMotion, useDisclosure). No new deps.
- **Similarity concern:** filter sheets exist; differentiate via draft/apply model + group types + desktop fallback + focus/zoom safety. Low–moderate.
- **Tier:** Free.
- **Release criteria:** rapid gate + draft-vs-applied + apply + cancel-restore + clear-all + focus-trap + focus-restoration + result-count announcement + unsaved-change verified.
