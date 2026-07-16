# Brief — Checkout Progress

- **Problem:** multi-step checkout flows (commerce, booking, hire, digital-product) need to show where a shopper is, which steps are done and revisitable, which step needs attention, and drive navigation — without the component owning payment, pricing, or the cart.
- **Use case:** e-commerce checkout, equipment/booking hire, subscription sign-up, quote/order flows, any app-owned stepped form that ends in an order submit.
- **Steps (app-defined):** e.g. Cart · Customer details · Delivery · Billing · Payment · Review · Confirmation. Each step: `id`, `label`, `description?`, `state`, `summary?`, `editable?`, `optional?`, `blockedReason?`, `errors?`, `content?`.
- **Step states:** incomplete · current · valid · invalid · saving · completed · blocked · skipped (icon + text, never colour alone).
- **Checkout-level states:** editing · validating · submitting · processing · completed · failed · cancelled.
- **Behavior:** current step, completed + editable steps (jump back to edit), per-step validation with an error summary that links to the step, app-owned blocked-step reason, honest async step save (`onSaveStep` returns a promise → "saving" → app marks completed; no fake progress), return to previous, mobile compact summary, sticky order-summary integration slot (`orderSummary`), progress summary, error summary, guest/account `mode`, fully controlled navigation callbacks. **Does NOT collect or process payment** — the payment step's card field is the app's own `children`/`renderStep`.
- **Main interaction:** Continue/Back, jump to an editable completed step, Save step, submit order on the final step, retry on failure.
- **Animation purpose:** step-panel transition on change, progress-bar fill, active-step highlight, saving spinner, error-summary reveal. No confetti, no fake processing bar.
- **API sketch:** `steps`, `currentStepId?`, `state?`, `mode?`, `orderSummary?`, `renderStep?`, `onNext?`, `onPrevious?`, `onGoToStep?`, `onSaveStep?`, `onSubmit?`, `onRetry?`, `continueLabel?`, `submitLabel?`, `showSaveStep?`.
- **Accessibility:** ordered `<ol>` steps with `aria-current="step"`; status in text; error summary focused on invalid advance; focus moved to the active step heading after every step change; keyboard-operable Back/Continue/Save; blocked reason exposed; ≥44px targets; 200%-zoom-safe; reduced-motion renders final state; polite live region.
- **Mobile:** stepper hidden, replaced by a compact active-step summary; order summary drops below the steps; keyboard-safe touch targets.
- **Dependencies:** motion + `@motionstack/utils` + `@motionstack/primitives` (`useReducedMotion`, `useAsyncStatus`, `statusVars`). No new deps.
- **Similarity concern:** step/wizard progress UIs are common; differentiate via editable completed steps + per-step validation/blocked/async-save + checkout lifecycle + order-summary slot, and by explicitly not being a payment processor. Low–moderate.
- **Tier:** Pro.
- **Release criteria:** rapid gate + navigation callbacks + validation/blocked behavior + async-save transition verified.
