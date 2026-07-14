# Brief — Tool Call Activity

- **Problem:** AI/agent UIs need to show tool/step activity (search, read file, run code, await approval) with real state, not a fake terminal.
- **Use case:** assistant tool activity, agent inspection, retrieval steps, code execution status, human approval requests.
- **Main states:** queued · running · completed · failed · cancelled · waiting_approval · approved · rejected. (Use shared `getStatusMeta`/`statusVars`.)
- **Main interaction:** expand/collapse a call's details; approve/reject on approval calls; retry on failed; copy details; multiple concurrent calls; completed calls compress.
- **Animation purpose:** communicate queue movement, start, progress, completion, failure, expansion, new-call insertion. No fake typing, no perpetual spinner after completion, no decorative-only motion.
- **API sketch:** `calls: ToolCall[]` ({id,name,category?,status,startedAt?,durationMs?,input?,output?,error?,progress?,details?}), `activeCallId?`, `onToggle?`, `onApprove?`, `onReject?`, `onRetry?`, `defaultExpanded?`, `compactCompleted?`, `showDurations?`, `renderInput?`, `renderOutput?`.
- **Accessibility:** status via icon+label (not color alone); keyboard-accessible expand + approval; live region on lifecycle only; error associated with failed call; reduced-motion final state; logical focus after approve/retry.
- **Mobile:** stacks vertically; details wrap; controls reachable.
- **Dependencies:** motion + `@motionkit/utils` + `@motionkit/primitives`. No new deps.
- **Similarity concern:** avoid resembling any specific agent-UI product; original anatomy (compacting completed calls + inline approval). Low–moderate.
- **Tier:** Pro.
- **Release criteria:** renders, controls work, desktop+mobile, light+dark, reduced-motion, keyboard, typecheck, docs build, registry validate, clean-fixture, no console/hydration errors, clean-room.
