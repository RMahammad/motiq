# Brief — Passkey Setup Flow

- **Tier:** Free · **Category:** Security & accounts
- **Problem:** Passkey/WebAuthn setup UIs are error-prone: apps must present device capability, the system-prompt wait, success/failure, existing-credential, and unsupported states without misrepresenting security.
- **Use case:** A presentation + orchestration layer for passkey registration. The **app** supplies WebAuthn operations and results; the component never implements crypto and never fakes success.
- **States:** intro · device-capability (app-supplied) · naming · registration-starting · system-prompt-waiting · success · failure · existing-credential · unsupported · cancelled · retry · recovery-guidance.
- **Interaction:** onBegin, onCancel, onRetry, onNameChange, onComplete, onUseAlternative.
- **Animation purpose:** step transitions + waiting affordance (no countdown pressure); reduced-motion static.
- **API sketch:** `<PasskeySetupFlow state capability error existingCredential onBegin onCancel onRetry onNameChange onComplete onUseAlternative alternativeLabel />`.
- **Accessibility:** ordered step semantics (`aria-current=step`); focus moves to the active phase; error associated (`aria-describedby`); keyboard access; reduced motion; status in text; **no countdown**; mobile.
- **Mobile:** single-column steps, large targets, alternative path always reachable.
- **Dependencies:** motion + `@motiq/{utils,primitives}`. **No crypto/WebAuthn deps.**
- **Similarity concern:** the honest, no-crypto, alternative-always-present framing is the differentiator; clean-room. Low.
- **Security invariants:** never collect/display key material; never claim "impossible to compromise"; never simulate success without app state; always offer an alternative; surface failure details.
- **Release criteria:** 6 tests (step progression, onBegin, onRetry, unsupported, failure semantics, onUseAlternative) + axe; rapid gate.
