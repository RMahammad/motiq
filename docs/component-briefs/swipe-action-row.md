# Brief — Swipe Action Row

- **Problem:** mobile lists want swipe actions, but they must also work with pointer + keyboard and never delete by accident.
- **Use case:** mail, tasks, notifications, saved items, files, messages, orders, queue items, admin lists.
- **Behavior:** swipe left/right actions, configurable `threshold`, snap open/closed, opt-in `fullSwipe`, cancelled swipe, multiple actions, programmatic `open`/`onOpenChange`, only-one-open within a `group`, pointer + touch drag, keyboard-accessible alternative actions, reduced-motion fallback.
- **Safety (required):** destructive actions must not trigger accidentally — full-swipe deletion is OFF by default; require ≥1 of: explicit confirmation (`confirmAction`), full-swipe opt-in, undo callback, minimum threshold, separate destructive button.
- **Desktop/keyboard:** visible overflow menu (`renderActionMenu`), action buttons on focus, focus-visible; not touch-only. Actions available without swiping.
- **Main states:** closed · dragging (resistance + threshold feedback) · open-left · open-right · confirming · removed (+ undo).
- **Animation purpose:** drag resistance, threshold feedback, snap, action reveal, row removal after confirmed action, undo restoration. No exaggerated elastic motion.
- **API sketch:** `leftActions?`, `rightActions?`, `threshold?`, `fullSwipe?`, `open?`, `onOpenChange?`, `onAction?`, `disabled?`, `group?`, `renderActionMenu?`, `confirmAction?`, `children`.
- **Accessibility:** actions available without swiping (buttons on focus + overflow menu); descriptive labels; focus management after row removal; reduced-motion; destructive safeguards; no gesture-only functionality; ≥44px touch targets; SR announcement for completed actions.
- **Mobile:** the primary surface — drag with resistance; full-swipe only when opted in.
- **Dependencies:** motion (drag / useMotionValue / animate) + `@motiq/utils` + `@motiq/primitives` (useReducedMotion). No new deps.
- **Similarity concern:** swipe rows are common; differentiate via keyboard/overflow parity + safety model + group behavior. Low–moderate.
- **Tier:** Free.
- **Release criteria:** rapid gate + threshold/open/close + keyboard actions + destructive safeguard + only-one-open group + reduced-motion verified.
