# Brief — Live Log Stream

- **Problem:** dev tools need a live log view with follow/pause, filtering, and search that doesn't fight the user's scroll.
- **Use case:** deployment/build logs, background jobs, server events, local dev output, queue workers.
- **Main states:** streaming · paused · empty · error · completed. Levels: debug · info · success · warning · error (configurable).
- **Main interaction:** auto-follow with a new-lines indicator when paused (use shared `useAutoFollow`); pause/resume; level filter; search; clear; copy; jump-to-latest. Never disable user scrolling.
- **Animation purpose:** subtle new-line insertion (shared `streamItemVariants`); no per-frame React state; no flashing.
- **API sketch:** `entries: LogEntry[]` ({id,level,message,timestamp?,source?}), `follow?`, `onFollowChange?`, `paused?`, `onPausedChange?`, `maxEntries?`, `levels?`, `query?`, `onQueryChange?`, `formatTimestamp?`, `renderEntry?`, `onClear?`.
- **Accessibility:** level via label/icon/prefix not color alone; keyboard for search/filter/pause/copy/jump; preserve text selection; live region rate-limited.
- **Performance:** bounded retained history (`maxEntries`), efficient insertion, visibility pause; document where to integrate virtualization (no virtualization dep by default).
- **Mobile:** compact rows, horizontal scroll for long lines.
- **Dependencies:** motion + `@motionkit/utils` + `@motionkit/primitives`. No new deps.
- **Similarity concern:** generic log viewers exist; differentiate via follow/pause UX + filter/search + tokenized levels. Low.
- **Tier:** Free.
- **Release criteria:** as in the rapid gate (render, interactions, responsive, themes, reduced-motion, keyboard, typecheck, build, registry validate, clean-fixture, no errors, clean-room).
