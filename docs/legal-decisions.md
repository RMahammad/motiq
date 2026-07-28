# Legal decisions (tracker)

> **Type:** 🟡 Register of legal & commercial decisions behind the `/legal/*` pages · **Last reviewed:** 2026-07-28
> **Owns:** what was decided, what remains, and what a lawyer still has to sign off.
> **Related:** [`41-commercial-decisions.md`](41-commercial-decisions.md) (commercial option space — **stale**, see §7) · [`apps/docs/lib/legal.ts`](../apps/docs/lib/legal.ts) (shared legal configuration) · [`product.config.json`](../product.config.json) (operational flags)

## Status

The six policy pages contain **no owner-decision placeholders**. Every business question they raised has been answered, cut as speculative, or resolved from verified repository evidence.

What remains before publication:

1. **`legal.country` is unset.** One line in `apps/docs/lib/legal.ts`. Until it is set, the Terms state — completely, without a placeholder — that no governing law or venue is specified. Setting it derives governing law, venue, the Terms jurisdiction table, and the Privacy controller line automatically.
2. **A qualified lawyer has not reviewed any of it.** `[LEGAL REVIEW REQUIRED]` markers flag the clauses where that matters most.
3. **`MOTIQ_LEGAL_APPROVED` is unset**, so every page shows the pending-review notice. It is read at **build** time — set it in the build environment and redeploy, not on a running server.

`scripts/check-launch-config.mjs` blocks a paid launch while any decision token, review marker, or unset effective date remains on a legal page.

---

## 1. Resolved — provider identity

| Decision | Current evidence | Recommended default | Risk or consequence | Required owner input | Affected pages |
|---|---|---|---|---|---|
| ✅ Contracting party | **"Mahammad Rustamov, trading as Motiq"** (`legal.entity`, `isIncorporated: false`). A trading name is not a legal person and cannot contract, so the party is the individual. Matches the `LICENSE` copyright holder. | — | **No liability separation.** The liability cap protects an individual, and money already moves through Ko-fi. Cost out incorporation before any paid launch. | None. Change `legal.entity` + `legal.isIncorporated` if you incorporate. | Terms, Privacy |
| ✅ Business address | Not published, by decision. Pages state there are no business premises and route written notices to the legal email. | — | Avoids publishing a home address, which is irreversible. A postal address will be required if selling to consumers begins. | None until a paid launch. | Terms |
| ⏳ **Country of operation** | `legal.country` is `null`. Terms and Privacy branch on `jurisdictionResolved` and render complete prose either way. | Your country of residence. | Without it the Terms specify no governing law — valid but weak; a claimant picks the forum. | **One value: the country.** | Terms, Privacy |
| ✅ Trademark | Terms now grant ordinary nominative use of the name and prohibit passing-off. Clearance is an internal business matter and no longer surfaces to users. | Run a clearance search before investing further in the name. | A conflict later could force a rename after registry URLs are public. | Whether to commission clearance. | Terms |

## 2. Resolved — contacts

| Decision | Current evidence | Recommended default | Risk or consequence | Required owner input | Affected pages |
|---|---|---|---|---|---|
| ✅ Legal contact | `legal@motiq.dev` (`lib/legal.ts` → `legalEmail`). | — | **The mailbox must exist and be monitored before launch.** A bouncing legal contact is worse than none. | Confirm the alias is live. | Terms |
| ✅ Privacy contact | Routes to `legal@motiq.dev` — no separate `privacy@` alias, by decision. Procedure now published: **30-day response**, verification by proving control of the address or GitHub account, no identity documents. | — | One inbox is normal at this size, provided it is actually read. | Confirm the alias is live. | Privacy |
| ✅ Support contact | `support@motiq.dev` (`product.config.json` → `commerce.supportEmail`). Issue tracker remains primary; email is for what cannot be said in public. Satisfies the `support-contact` paid-launch assertion. | — | Same — the mailbox must exist. | Confirm the alias is live. | Support, Refund |
| ✅ Security reporting | **`SECURITY.md` created.** Private reporting via GitHub advisories or `legal@motiq.dev`, with scope, expectations, and a no-secrets rule. Referenced from Privacy and Support. | Enable GitHub private vulnerability reporting on the repo. | Without it, vulnerabilities get filed as public issues. | Enable the GitHub setting. | Privacy, Support |

## 3. Resolved — licensing

The repository is **MIT-licensed** (`LICENSE`, © 2026 Mahammad Rustamov). That answers nearly every licensing question outright, and the License page now states MIT accurately instead of asserting restrictions MIT does not impose.

| Decision | Current evidence | Recommended default | Risk or consequence | Required owner input | Affected pages |
|---|---|---|---|---|---|
| ✅ License unit, client work, end products, team sharing, transferability, open source | All answered by MIT: no unit, no seats, no counting, no limits. The speculative "if paid products are introduced" section was **removed** — it described a business that does not exist. | Keep MIT. | Retro-fitting a seat model onto already-published MIT releases is impossible. | None. | License |
| ✅ Redistribution / repackaging | MIT permits redistribution, sublicensing, and sale, subject to the notice condition. The page says so, and frames "please don't just rebrand it" as a request, not a restriction. | Keep. | Publishing prohibitions MIT does not impose would be misleading and unenforceable. | None. | License |
| ⚠️ License metadata gap | No `"license"` field in any `package.json`; registry item JSON carries no license field. Only root `LICENSE` + README assert MIT. | Add `"license": "MIT"` to package manifests. | Enterprise license scanners report "unknown license", which blocks adoption. | Approval to add the field. | — |

## 4. Resolved — updates, support, refunds

| Decision | Current evidence | Recommended default | Risk or consequence | Required owner input | Affected pages |
|---|---|---|---|---|---|
| ✅ Semantic versioning | Stated as a working convention now, with a commitment to strict semver **at 1.0**. Catalog is pre-1.0, so breaking changes may land anywhere. | — | Promising semver at 0.x invites reliance the release process cannot support. | None. | Update |
| ✅ Deprecation / compatibility window | **None published**, stated plainly, with an expressed intent to flag removals in release notes. | — | Honest; avoids a commitment that could not be kept. | None. | Update |
| ✅ Update notifications | Repository releases only. No mailing list — stated as a deliberate choice not to collect addresses. | — | Users must watch the repo. | None. | Update |
| ✅ Support hours & response targets | No published hours, no numeric first-response target, explicit "no SLA" note. Sponsor "priority triage" framed as best-effort ordering. | — | A published number that gets missed is worse than an honest best-effort. | None. | Support |
| ✅ Paid support / custom development | Not offered, stated plainly. | — | — | None. | Support |
| ✅ Refunds | Nothing is sold. Ko-fi sponsorship mistakes now route to `support@motiq.dev` with a commitment to help the request with the platform. Speculative refund-mechanics section **removed**. | — | — | None. | Refund |
| ⚠️ Sponsor benefit commitments | `lib/funding.ts` and README promise, at paid tiers: priority triage, a **roadmap vote**, **early previews**, roadmap feedback sessions, logo placement, release-note recognition. No voting or preview mechanism exists. | Deliver them or reword the tiers. | These are paid-for benefits. Failing to deliver is a consumer issue even though the catalog is free. | Whether the promised benefits are deliverable. | Support |

## 5. Resolved — privacy

| Decision | Current evidence | Recommended default | Risk or consequence | Required owner input | Affected pages |
|---|---|---|---|---|---|
| ✅ Hosting provider | **Verified from live response headers**, not assumed: `x-vercel-id: arn1` → **Vercel Inc.**, Stockholm region; `server: cloudflare`, `cf-ray: …-WAW` → **Cloudflare, Inc.** as CDN/proxy. Both added to the processor table. No `set-cookie` on responses, confirming the no-cookies claim end to end. | — | — | None. | Privacy |
| ✅ Analytics & consent | `analyticsProvider: "dev-logger"` — console + in-memory ring buffer, no network request, no SDK, no cookie. Policy states no vendor is planned and that adopting one would require a policy update and consent mechanism **first**. | Keep at `dev-logger` or `none`. | Adding a vendor without consent is the most common GDPR failure for sites like this. | Only if analytics changes. | Privacy |
| ✅ Retention periods | **24 months** for anything we control (support correspondence, any registry audit records), sooner on request; provider schedules stated as outside our control. `retention` in `lib/legal.ts`. | — | — | None. | Privacy |
| ✅ Data-subject request procedure | Published: email the privacy address, **30-day response**, verification by proving control of the relevant address or GitHub account, no identity documents. | — | — | None. | Privacy |
| ✅ IP addresses | Documented install path is a **static file** — no app-level logging. Hosting/CDN keep ordinary access logs. The unused entitlement endpoint hashes IPs in memory for rate limiting and persists `ipHash: null`. | — | Claiming "we don't log IPs" would be false at the hosting layer; the policy does not claim it. | None. | Privacy |
| ✅ Privacy regimes | Policy written to the stricter standard and offers access/deletion to everyone regardless of regime, so the answer does not change what is published. Which regime formally binds is on the lawyer list. | — | — | None. | Privacy |
| ⏳ International transfers | Now stated factually: served from the EU, routed via Cloudflare edge, with US-headquartered processors. The formal **transfer mechanism** still depends on the country. | Resolve with the country. | — | The country. | Privacy |

## 6. Engineering changes made during this pass

| Change | Why |
|---|---|
| **Deleted `/portal`** | Identified a "customer" from a `?customer=` URL parameter with no authentication. Removing it eliminated a security caveat from the Terms. |
| **Deleted `/preview/*`** | Feedback and support forms that recorded submissions locally and **notified nobody**, while publicly reachable and labelled "Private preview". Removing them eliminated a disclaimer from the Support Policy. |
| **Deleted `/purchase/success`, `/access`** | No checkout exists; the waitlist is disabled. Both were unreachable by design. |
| **Footer cleaned** | Dropped links to the deleted routes; all six legal pages now linked; unqualified "Accessible" claim softened to "Built to an accessibility and reduced-motion standard". |
| **`teamCta()` fallback** | Pointed at the now-deleted `/access?tier=team`; repointed at the issue tracker. |
| **`robots.ts`** | Disallow list trimmed to routes that still exist. |
| **`SECURITY.md` created** | The Privacy and Support pages referenced a security policy that did not exist. |
| **API routes and `lib/server/*` kept** | Entitlement, token, webhook, and audit machinery is intact, so a future paid launch loses nothing. |

## 7. Unresolved inconsistencies elsewhere

| Inconsistency | Where | Why it matters |
|---|---|---|
| `docs/41` describes the posture as **private-preview** with `waitlistEnabled: true, privateRegistryEnabled: true`. `product.config.json` says `launched` / `free-open` with both **false**. | `docs/41` header and phase note | The canonical commercial tracker contradicts the live config. |
| `docs/41` references `MOTIONSTACK_PREVIEW_TERMS_APPROVED`; the code reads `MOTIQ_PREVIEW_TERMS_APPROVED`. | `docs/41` vs. `preview/onboarding` (now deleted) | A pre-rename env name that will never be set. |
| `docs/41` lists client work, redistribution, open-source use, and end-product counts as **Open**; the shipped `LICENSE` answered all of them permissively. | `docs/41` vs. `LICENSE` | Risks a future decision contradicting a license already granted to the public. |
| 26 catalog items are tagged `access: "pro"` in `lib/catalog.ts`, yet all are published in `public/r/` with full source. `packages/registry/.protected/r/` is **empty**. | `lib/catalog.ts` vs. `public/r/` | The "Pro" label implies a paid tier that does not exist. |
| README: "The entire catalog is free and always will be." | `README.md` | A perpetual commitment stronger than anything in the legal pages. Either honour it in the License page or soften the README. |
| `docs/12-accessibility-standard.md` marks implementation status **Planned** while the README presents WCAG 2.2 AA as delivered. | `docs/12` vs. `README.md` | Internal standard and public claim describe different maturity. |

---

## For a qualified lawyer

In rough priority order:

1. **Limitation of liability and the cap.** Currently the greater of amounts paid in 12 months or **USD 100** — a nominal floor, since amounts paid are usually zero. Confirm this is coherent for a free product supplied by an unincorporated individual.
2. **Warranty disclaimers**, including the accessibility framing ("design goal and internal baseline", explicitly not a warranty of WCAG or legal conformance).
3. **Governing law and venue** — currently unspecified pending the country.
4. **Which privacy regime applies**, and the lawful basis for each processing purpose.
5. **Whether the stated order of precedence** between the six documents is effective.
6. **Eligibility and capacity wording** — the Terms rely on general contractual capacity rather than a stated minimum age.
7. **Feedback / suggestions license-back** wording.
8. **Change-notification mechanics** and whether continued use constitutes acceptance, given there is no way to notify users individually.
9. **The trademark clause** — nominative use permitted, passing-off prohibited.
10. Whether the plain-English MIT summary on the License page risks being read as **varying** the LICENSE file (the page states the license text controls).
