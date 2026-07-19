# Brief — Comment Thread

- **Problem:** review/collaboration UIs need a real comment thread with replies, mentions, reactions, resolve, and optimistic send/edit — more than stacked bubbles. The app owns persistence + permissions.
- **Use case:** doc/design/code review, task discussion, approval feedback, annotations, product feedback, handoff.
- **Comment data:** id, author, avatar?, body, createdAt, editedAt?, parentId?, replies?, mentions?, reactions?, attachments?, status, resolved?, location?, permissions?.
- **States:** normal/pending/failed/edited/resolved/deleted-placeholder/unread/highlighted/selected.
- **Main interaction:** add / reply / edit / delete cb / resolve / reopen / react / mention / retry-failed / collapse-expand replies / copy link (`useCopy`); optional sort; optional unread divider (`unreadAfter`); optimistic pending state (pending→sent, failed→retry, replace temp id, preserve focus).
- **Animation purpose:** new comment + reply insertion, resolve/reopen, reaction change, pending→sent, failed, retry, reply expansion, thread collapse. No reaction explosions.
- **API sketch:** `comments`, `currentUser`, `onAddComment`, `onReply`, `onEdit`, `onDelete`, `onResolve`, `onReopen`, `onReact`, `onRetry`, `permissions?`, `sort?`, `unreadAfter?`, `renderAttachment?`, `renderComposer?`, `formatTimestamp?`.
- **Accessibility:** semantic article/list; author + timestamp + edited state; reply relationships; keyboard-accessible actions; mention suggestions accessible; focus preserved during optimistic updates; error association; reduced-motion; SR-safe reaction counts; resolved status in text.
- **Mobile:** single column; composer sticky; replies indent modestly.
- **Dependencies:** motion + `@motiq/utils` + `@motiq/primitives` (useDisclosure, useCopy, formatTimestamp, streamItemVariants, useReducedMotion). No new deps. Optimistic state handled internally.
- **Similarity concern:** comment UIs are common; differentiate via optimistic send/retry + resolve/reopen + mention + unread. Low–moderate.
- **Tier:** Pro.
- **Release criteria:** rapid gate + add/reply/optimistic-pending/failed-retry/resolve-reopen/reply-relationships/focus-preservation verified.
