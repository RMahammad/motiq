# Brief — Approval Workflow

- **Problem:** review/ops/finance/deployment/security UIs need to display and control app-provided approval state (the app owns authorization).
- **Use case:** content/deployment/purchase/access/security/legal/design approval, sign-off, change management, AI human-in-the-loop.
- **Workflow data:** title, requester, reviewers, stages, currentStage, status, requiredApprovals, optional reviewers, comments, timestamps, deadline, attachments, risk/priority, decision history.
- **Main states:** draft · pending · in_review · approved · rejected · changes_requested · cancelled · expired (use `getStatusMeta`/`statusVars`).
- **Workflow behavior:** sequential/parallel approval, minimum approvals, required/optional approvers, current-user action state; approve / reject / request_changes / add_comment / cancel / resubmit. The app decides whether an action is allowed (`canAct`/disabled reasons).
- **Main interaction:** act on current stage, add comment (`useDisclosure` for history), collapse completed stages (`compactCompleted`), optional reject confirmation (`confirmReject`).
- **Animation purpose:** stage progression, reviewer status change, decision/comment insertion, approval/rejection state, collapsing completed stages. No confetti.
- **API sketch:** `workflow`, `currentUserId?`, `onApprove?`, `onReject?`, `onRequestChanges?`, `onComment?`, `onCancel?`, `renderAttachment?`, `renderReviewer?`, `compactCompleted?`, `confirmReject?`.
- **Accessibility:** status in text; stage semantics; keyboard-accessible actions; confirmation for destructive reject where configured; focus management after actions; comment labels; reduced-motion; state not color-only; app-supplied disabled reasons surfaced.
- **Mobile:** stages stack; actions become a bottom action bar; reviewers wrap.
- **Dependencies:** motion + `@motiq/utils` + `@motiq/primitives`. No new deps.
- **Similarity concern:** approval UIs exist; differentiate via sequential+parallel model + current-user action state + decision history. Low–moderate.
- **Tier:** Pro.
- **Release criteria:** rapid gate + action callbacks + disabled-action behavior verified.
