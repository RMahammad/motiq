# Session Security Center

- **Category:** security · **Tier:** Pro · **Track:** default (rapid-component-release)
- **Export:** `SessionSecurityCenter` (`packages/registry/registry/security/session-security-center.tsx`)
- **Preview:** `SessionSecurityCenterPreview` (`apps/docs/app/_previews/session-security-center.tsx`)

## What it is

A presentation + control surface for reviewing and **managing** the active
sign-in sessions on an account (this laptop, a phone, a tablet, an office
desktop) and revoking the ones that shouldn't be there. It is the *management*
counterpart to `passkey-setup-flow` and `two-factor-setup-flow` — those are
single-flow **setup** wizards driven by a `state` prop; this is a list surface
over app-owned session data. No code overlaps.

The component owns none of the security: it never touches the network, never
geolocates, never derives an IP, and never decides a session is compromised. The
application owns the session list and every real mutation; the component renders
that data honestly and emits intent through callbacks.

## Why it's worth shipping (paid value)

A bare "signed-in devices" table is easy to get *dangerously* wrong. This
component bakes in the safeguards that a workflow team would otherwise re-derive:
the current session is unmistakable and protected, bulk revocation is confirmed
and provably excludes the current session, failed revocations are shown honestly
with retry, and focus survives row removal. It ships those guarantees as
editable source.

## Data model

`Session = { id, device, browser?, os?, deviceKind?, location?(app, approximate),
ipSummary?(app, verbatim), createdTime, lastActiveTime, current?, state?,
trustLabel?(app), risk?(app), authMethod?, organization?, metadata? }`

States (icon **and** text, never colour alone): `active · current · idle ·
expired · revoked · pending-revocation · suspicious(app) · unknown`.

## Interactions

`onInspect`, `onRevoke`, `onRevokeAllOthers`, `onRenameDevice`, `onMarkTrusted`,
`onRemoveTrust`, `onRefresh`; controllable `filter` (all/active/idle/flagged) and
`sort` (recent/device); confirmation before every revocation; app-owned
`error` + `onRetry`; empty state (no sessions vs. no matches).

## Security posture (enforced in UI)

- Only app-supplied fields render. Location is labelled approximate / app-reported;
  IP is shown exactly as summarised — never reconstructed to a full address.
- A risk label appears only when the app supplies one, as a **calm** icon+text
  badge — no alarming pulse, never invented by the component.
- Current session has no Revoke control and is excluded from "Revoke all other
  sessions" unless `allowRevokeCurrent` is set. `onRevokeAllOthers` receives the
  exact affected list (current never included by default).
- Bulk and single revocation are gated behind an accessible `alertdialog`.

## Accessibility

Semantic `<ul role="list">`; state by icon + text; revoke controls carry the
device name; confirmations are `role="alertdialog"` with a focus trap + Escape;
focus is preserved onto a neighbouring session after removal (falls back to the
heading); per-row Details disclosure surfaces full metadata for small screens;
timestamps are relative + human; all motion resolves to final state under
`prefers-reduced-motion`.

## Determinism

The preview uses fixed fictional data (RFC-5737 doc IPs, approximate city
labels) and a fixed `now` (`T0`), so timestamps don't drift between SSR and CSR.
Live ids are minted only inside handlers.
