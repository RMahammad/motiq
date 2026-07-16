# Brief — Typing and Presence

- **Tier:** Free · **Category:** Communication
- **Problem:** Messaging UIs ship "someone is typing…" as three bouncing dots and presence as a separate colour-only avatar dot, then re-implement both — with noisy live regions and no accessible overflow.
- **Use case:** One strip that answers "who is here, and who is doing something right now" — an app-supplied presence roster fused with an app-supplied typing signal, emitting participant-select intents. The app owns all data; the component never opens a socket or invents a status.
- **Presence states:** online · active · idle · away · offline · reconnecting (shape + text, never colour alone; away/offline render hollow).
- **Typing states:** typing · recording · uploading · editing · stopped.
- **Interaction:** `onParticipantSelect`; keyboard-accessible overflow disclosure (arrow/Home/End/Escape) listing every participant with presence label + activity + role.
- **Summary logic:** `typingSummary` → "Jamie is typing" · "Jamie and Morgan are typing" · "Three people are typing"; verb swaps for recording/uploading/editing. Exported + unit-tested.
- **Modes:** `mode` = compact (one dense line) · inline (cluster + divider + typing/presence slot) · floating-panel (elevated card with full list + typing footer). `compact` is a separate density modifier.
- **Animation purpose:** join/leave (layout, popLayout), presence-transition, typing start/stop (AnimatePresence), overflow "+N", reconnection pulse — **no endless high-energy typing loop**; the low-energy dot pulse and reconnect pip **pause offscreen/hidden** (`useVisibilityPause`) and are static under reduced motion.
- **API sketch:** `<TypingAndPresence participants typingParticipantIds context maxVisible mode compact onParticipantSelect renderParticipant formatActivity announceTyping />`; participant = { id, displayName, avatar?, presenceState, typingState?, activeContext?, lastActiveTime?, color?, role?, connectionState? }.
- **Accessibility:** presence as shape + text; initials avatar fallback; **non-spamming** polite live region (debounced 500 ms, voices the settled typing summary + reconnection, never every keystroke); `announceTyping` opt-out; keyboard overflow list; touch-friendly detail panel; reduced motion; no colour-only presence.
- **Mobile:** wraps to stacked rows; floating-panel is a full-width-capped card with touch-target rows.
- **Dependencies:** motion + `@motionstack/{utils,primitives}` (useReducedMotion, useVisibilityPause, statusVars).
- **Similarity concern:** typing indicators are ubiquitous; clean-room — original fused presence+typing API, restrained-a11y framing, and the pause-when-hidden low-energy motion. Low.
- **Release criteria:** typecheck + rendered interaction across modes/themes/reduced-motion; 2 targeted tests (`typingSummary` grammar + render/axe). Rapid gate.
