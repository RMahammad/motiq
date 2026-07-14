# Brief — Two-Factor Setup Flow

- **Tier:** Free · **Category:** Security & accounts
- **Problem:** Adding a second auth factor spans many states (method choice, secret/QR, code entry, invalid/expired code, recovery codes) that apps routinely render inconsistently — often with misleading "your account is now secure" claims or SMS pushed as universally safe.
- **Use case:** A presentation + orchestration layer for enrolling a SECOND factor on an already-signed-in account. The **app** supplies every operation (secret generation, code delivery, verification, recovery-code issuance) and results; the component never implements crypto/TOTP/WebAuthn/SMS and never fakes success.
- **Methods:** authenticator · security-key · sms · email · recovery-codes · custom. SMS/email carry app-supplied tradeoff notes; none is ranked "most secure".
- **States:** introduction · method-selection · preparing · secret-or-QR-ready · waiting-for-code · verifying · success · invalid-code · expired-code · method-unavailable · cancelled · recovery-codes · complete.
- **Interaction:** onMethodChange, onBegin, onVerify, onResend, onCancel, onRetry, onUseAlternative, onCopySetupKey, onConfirmRecoveryCodes, onComplete.
- **Animation purpose:** step transitions + waiting affordance (no countdown pressure); reduced-motion is static (opacity-only) and swaps the spinner for a static progress mark.
- **API sketch:** `<TwoFactorSetupFlow state methods selectedMethod code error setupData recoveryCodes onMethodChange onBegin onVerify onResend onCancel onRetry onUseAlternative onCopySetupKey onConfirmRecoveryCodes onComplete alternativeLabel />`.
- **Accessibility:** ordered step semantics (`aria-current=step`); focus moves to the active phase (or the code input when present); code input is a normal `inputMode=numeric` `autoComplete=one-time-code` field so paste/autofill are the platform's; errors associated via `aria-describedby` / `aria-invalid`; reduced motion; status in text; **no countdown**; mobile single-column.
- **Security invariants:** never generate/verify codes; never display a real secret in the demo (placeholder setup key + recovery codes); never store codes; recovery codes are clearly SENSITIVE, `select-all`, never auto-copied, and never sent to analytics; the setup-key copy passes only the intent (not the key) to any callback; never claim the account is "secure" because setup completed; always offer an alternative factor; handle unsupported/failed methods honestly with a real exit.
- **Mobile:** single-column steps, large targets, alternative path reachable until completion.
- **Dependencies:** motion + `@motionkit/{utils,primitives}` (`useReducedMotion`, `useControllableState`, `useCopy`, `statusVars`). **No crypto/2FA deps.**
- **Similarity concern:** honest, no-crypto, tradeoff-transparent, alternative-always-present framing is the differentiator; sibling of PasskeySetupFlow with no shared code. Low.
- **Release criteria:** ~5 targeted logic tests (state progression, invalid + expired handling, onVerify/onUseAlternative callbacks, recovery-code confirmation gate) + axe; rapid gate.
