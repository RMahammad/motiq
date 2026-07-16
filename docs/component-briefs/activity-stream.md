# Brief — Activity Stream

- **Problem:** product history/collaboration feeds need more than a dotted timeline — grouping, unread, date separators, filtering.
- **Use case:** project activity, document collaboration, team actions, account events, review workflows, audit summaries.
- **Event types (app-defined):** created · edited · commented · mentioned · assigned · approved · rejected · uploaded · published · archived · restored · joined · left.
- **Content:** actor, action, target, timestamp, avatar, metadata, optional preview/grouping key/action/link.
- **Distinguishing behavior:** group repeated actions (collapse/expand), date separators, unread divider, live arrival insertion, filter by event type / actor. Not just dots on a line.
- **Main interaction:** expand a group; toggle filters; jump to unread. Uses shared `formatTimestamp`, `streamItemVariants`.
- **API sketch:** `events: ActivityEvent[]`, `groupBy?`, `collapseThreshold?`, `filters?`, `onFiltersChange?`, `unreadAfter?`, `onEventAction?`, `renderMetadata?`, `formatTimestamp?`.
- **Accessibility:** semantic list; meaningful event text; avatar alt; keyboard-accessible groups; unread/status not color-only; reduced-motion insertion.
- **Mobile:** single column, wraps, avatars scale.
- **Dependencies:** motion + `@motionstack/utils` + `@motionstack/primitives`. No new deps.
- **Similarity concern:** timelines are generic; differentiate via grouping + unread + filtering. Low.
- **Tier:** Free.
- **Release criteria:** rapid gate.
