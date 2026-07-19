# Brief — File Upload Pipeline

- **Tier:** Free · **Category:** File workflows
- **Problem:** Apps rebuild upload queues (progress, pause/resume/retry/cancel, processing, partial failure) every time, usually inaccessibly and coupled to one storage backend.
- **Use case:** A file-manager/upload surface the app drives — the component presents app-supplied upload items and emits intent callbacks; it never uploads unless given an adapter.
- **States:** empty · drag-over · queue · uploading · paused · processing · completed · partial failure · total failure · offline · cancelled. Per-item: queued/preparing/uploading/paused/processing/completed/failed/cancelled.
- **Interaction:** add files, pause, resume, retry, cancel, remove, clear completed, reorder (opt), expand details, copy error.
- **Animation purpose:** communicate progress and state transitions (queued→uploading→processing→completed / →failed) — not decoration; reduced-motion renders final state.
- **API sketch:** `<FileUploadPipeline items onAddFiles onPause onResume onRetry onCancel onRemove onClearCompleted onReorder? />`; item = { id, fileName, fileType, fileSize, progress, status, speed?, remainingTime?, error?, retryCount?, processingStage?, thumbnail?, metadata? }.
- **Accessibility:** real `<input type=file>` + keyboard drop-zone alternative; `role=progressbar`; status in text; error association; focus preserved after removal; announcements throttled to status changes (not every %); no colour-only state.
- **Mobile:** stacked rows, large touch targets, drag-over works with file picker fallback.
- **Dependencies:** motion + `@motiq/{utils,primitives}`.
- **Similarity concern:** generic uploader pattern; clean-room implementation, original API + composition (app-controlled, adapter-optional). Low.
- **Release criteria:** 6 targeted tests (pause/resume, retry, cancel, progress semantics, focus-after-removal, error) + axe; rapid gate (desktop/mobile/light/dark/reduced/keyboard, typecheck, build, registry, clean-fixture, no forbidden imports, no console/hydration).
