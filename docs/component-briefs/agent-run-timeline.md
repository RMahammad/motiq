# Brief — Agent Run Timeline

- **Problem:** AI/automation UIs need to visualize a multi-step run (steps, tool calls, approvals, outputs) from app-provided events — without executing an agent, inventing reasoning, or faking success.
- **Use case:** agent execution, automation runs, research workflows, multi-tool orchestration, doc-processing jobs, human approval checkpoints.
- **Run statuses:** queued/running/waiting/completed/failed/cancelled/paused. **Step statuses:** pending/active/completed/failed/skipped/waiting_approval/cancelled (use `getStatusMeta`/`statusVars`).
- **Main interaction:** expand/collapse steps, select/follow current step (`activeStepId` controlled), inspect tool calls + outputs, retry-step / cancel-run / resume / approve / reject callbacks, copy run details (`useCopy`), compact completed steps.
- **Animation purpose:** run progression, new-step insertion, active-step transition, completion/failure, approval-waiting, step expansion, retry. No fake typing, no perpetual pulse after completion, no "thinking" theater.
- **API sketch:** `run` ({title,status,startedAt?,endedAt?,currentStepId?,steps[],summary?}), `activeStepId?`, `onActiveStepChange?`, `onRetryStep?`, `onCancelRun?`, `onResumeRun?`, `onApprove?`, `onReject?`, `compactCompleted?`, `followActive?`, `renderStepDetails?`, `renderOutput?`, `formatTimestamp?`.
- **Accessibility:** run + step status in text + icon; semantic ordered/structured list; keyboard step expansion + approval; reduced-motion; live-region discipline (announce lifecycle, not frames); focus preserved after retry/approval.
- **Mobile:** steps stack; details wrap; actions reachable.
- **Dependencies:** motion + `@motionstack/utils` + `@motionstack/primitives` (getStatusMeta, statusVars, useDisclosure, useCopy, formatTimestamp, useReducedMotion). No new deps.
- **Similarity concern:** distinct from Tool Call Activity (this is run-level orchestration with stages/approvals/outputs, not a flat call list). Low–moderate.
- **Tier:** Pro.
- **Release criteria:** rapid gate (render, interactions, responsive, themes, reduced-motion, keyboard, typecheck, build, registry validate, clean-fixture, no console/hydration errors, clean-room). Never claims a step succeeded without supplied state.
