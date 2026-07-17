# Brief — Message Delivery States

- **Tier:** Free · **Category:** Communication
- **Problem:** Chat/support/collaboration UIs re-implement message delivery state (sending→sent→delivered→read, failure/retry, scheduled/edited) with icon-only status and noisy live regions.
- **Use case:** A message list/thread that presents app-supplied delivery state and emits retry/cancel/edit/copy intents. The app owns delivery; the component never simulates the network.
- **States:** draft · sending · sent · delivered · read · failed · retrying · scheduled · cancelled · edited.
- **Interaction:** onRetry, onCancel, onEdit, onCopy; read recipients (app-supplied); attachment state (opt).
- **Animation purpose:** communicate sending→sent→delivered→read, failure, retry, edit, cancellation — **no constant bouncing/typing dots**; reduced-motion static.
- **API sketch:** `<MessageDeliveryStates messages onRetry onCancel onEdit onCopy formatTimestamp />`; message = { id, body, author, timestamp, deliveryState, readRecipients?, error?, attachmentState? }.
- **Accessibility:** delivery state as text (icon not alone); retry keyboard-accessible; error associated with the message; read receipts labelled; restrained live-region updates; body remains selectable; reduced motion.
- **Mobile:** stacked bubbles, state under each message, touch-friendly retry.
- **Dependencies:** motion + `@motiq/{utils,primitives}`.
- **Similarity concern:** common chat pattern; clean-room, original API + the restrained-a11y framing. Low.
- **Release criteria:** 6 tests (delivery progression, failure, retry, cancel, read-state label, reduced-motion) + axe; rapid gate.
