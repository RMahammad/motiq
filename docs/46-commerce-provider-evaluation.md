# 46 — Commerce provider evaluation

> **Type:** 🟢 Research for the commerce-provider decision · **Last reviewed:** 2026-07-14 · **Status:** Research — recommendation **Proposed (pending human approval + credentials)** · **Owner:** product
> **Scope:** Which real payment/commerce provider to plug into the existing provider-neutral `CommerceProvider` interface later. This document does **not** authorize implementing any live provider.
> **Related:** [`16-commercial-packaging.md`](16-commercial-packaging.md) · [`27-product-differentiation.md`](27-product-differentiation.md) · [`packages/registry`](../packages/registry/)

## 0. What this product actually sells

"Motionstack" (temporary preview brand — never hardcode it; comes from [`product.config.json`](../product.config.json)) sells **editable React component source** as **one-time purchases** — individual components, packs, and the complete catalog — delivered through an **entitlement-aware private registry**. Source is a **digital good** (not a physical/shipped item), so provider capabilities around shipping/inventory are irrelevant; what matters is:

- Checkout + tax handling
- Webhooks with signature verification (to grant entitlements reliably)
- Customer records + a customer/billing portal
- One-time purchases now; subscriptions **maybe** later
- Refunds (and refund events, to revoke entitlements)
- Team / quantity / seat purchases (agency licenses later)
- **Metadata** on a purchase → mapped to an internal entitlement (component / pack / catalog SKU)

The commerce layer is already **provider-neutral** (a `CommerceProvider` interface exists). This doc informs *which* real provider to plug in; the interface stays unchanged regardless of the choice.

### Method & honesty note

Research conducted **2026-07-14** against **official docs/pricing pages only** (stripe.com/docs, docs.lemonsqueezy.com + lemonsqueezy.com, developer.paddle.com + paddle.com, polar.sh/docs). Where a page was unreachable or a value was not verifiable, it is marked **"Unknown (verify at <url>)"**. **No fee, country count, or feature below is invented.** Two fetch caveats to know:

- **Lemon Squeezy** doc/pricing pages returned **HTTP 403** to direct fetch; its facts below come from Lemon Squeezy's **own** search-indexed doc/pricing snippets (URLs cited), not from a third party. Re-verify against the live pages before implementation.
- **stripe.com/pricing** served a **geolocated (Poland / PLN)** page on fetch, so some Stripe rates below appear in EEA/PLN terms. Stripe's headline **US** online rate (commonly published as **2.9% + $0.30**) is **not** confirmed from the fetched page — **verify at** https://stripe.com/pricing.

---

## 1. Stripe

Stripe is a **payment service provider (PSP)**, not a merchant of record. Stripe Tax is an *add-on* that **calculates and collects** tax and helps **monitor/register/file** — but **you remain the merchant of record and the party liable** for registration, filing, and remittance (optionally via Stripe or integrated partners). This is the central trade-off for a solo/small vendor.

| Criterion | Finding (official docs) |
| --- | --- |
| Supported countries (scope) | Businesses supported in 40+ countries; sells globally. Exact list Unknown (verify at https://stripe.com/global) |
| **Merchant-of-record status** | **No — you are the MoR.** "Stripe Tax does not make Stripe the merchant of record; merchants retain responsibility for registration, filing, and remittance." (https://docs.stripe.com/tax/faq) |
| Tax handling | Stripe Tax **calculates & collects** sales tax/VAT/GST; monitors thresholds; can help register "on your behalf" and file "directly or through integrated partners" — **liability stays with you** (https://docs.stripe.com/tax, https://docs.stripe.com/tax/faq) |
| One-time purchases | Yes — Payment Links / Checkout / Payment Intents (https://docs.stripe.com) |
| Subscriptions | Yes — Stripe Billing (https://docs.stripe.com/billing) |
| Customer / billing portal | Yes — hosted Customer Portal: manage billing info, tax IDs, payment methods, invoices (pay/download), cancel. No-code or API-configurable (https://docs.stripe.com/customer-management) |
| Webhooks (+ signature) | Yes. HTTPS POST of Event objects; **HMAC-SHA256** via `Stripe-Signature` header (`t=` timestamp + `v1=` sig) verified against per-endpoint signing secret; retries up to 3 days live (https://docs.stripe.com/webhooks) |
| Refund events | Yes — e.g. `charge.refunded` (event types at https://docs.stripe.com/api/events/types); confirm exact set (verify) |
| Team / quantity purchases | Yes — quantities/multiple line items in Checkout; seat modeling is app-side (https://docs.stripe.com/payments/checkout) |
| Metadata (entitlement mapping) | Yes — `metadata` key/value on most objects (PaymentIntent, Checkout Session, Customer), returned in webhook payloads (https://docs.stripe.com/api/metadata) |
| API quality | Excellent — mature, best-in-class docs, official SDKs (JS/TS, Python, etc.) |
| Test / sandbox mode | Yes — test mode + sandboxes; Stripe CLI for local webhook forwarding (https://docs.stripe.com/webhooks) |
| Pricing model (fees) | Processing fees vary by region/card; fetched page localized to EEA/PLN. **US 2.9% + $0.30 is unverified — verify at https://stripe.com/pricing.** Stripe **Tax Basic**: "0.5% per transaction, where you're registered to collect taxes" (no-code); Billing pay-as-you-go "0.7% of Billing volume" (fetched pricing page) |
| Payout constraints | Standard bank payouts on a rolling schedule; you receive gross minus fees but **owe your own tax remittance** (verify at https://docs.stripe.com/payouts) |
| Integration complexity | Moderate — most flexible, but **you build tax registration/filing ops, entitlement logic, and portal config yourself** |
| Vendor lock-in | Moderate — provider-neutral interface limits code lock-in; **tax compliance liability is the real stickiness** |
| Data export | Strong — full API + dashboard/CSV exports (verify at https://docs.stripe.com) |
| Current limitations | **Not a MoR:** you are liable for global VAT/GST/sales-tax registration, filing & remittance — significant overhead for a solo digital-source vendor |
| **Fit for this product** | **Powerful but heavy.** Best control/flexibility and lowest per-txn fee, but shifts **all tax compliance burden onto us** — the opposite of what a small source-selling catalog wants at launch |

---

## 2. Lemon Squeezy (Merchant of Record)

Purpose-built MoR for **digital products and software** — the closest category match to "sell editable source." Now owned by Stripe (see 2026 update blog) but still operates as an MoR product.
> ⚠️ Fetch caveat: docs/pricing returned 403; values below are from Lemon Squeezy's own indexed doc/pricing snippets — **re-verify on the live pages**.

| Criterion | Finding (official docs) |
| --- | --- |
| Supported countries (scope) | Sells globally; specific list Unknown (verify at https://docs.lemonsqueezy.com) |
| **Merchant-of-record status** | **Yes — MoR.** "Lemon Squeezy is a Merchant of Record… takes on all of the liability so that sellers don't have to." (https://docs.lemonsqueezy.com/help/payments/merchant-of-record) |
| Tax handling | MoR **calculates, collects, and remits** digital sales tax/VAT/GST for you (https://www.lemonsqueezy.com/reporting/merchant-of-record) |
| One-time purchases | Yes — digital products, one-time (https://docs.lemonsqueezy.com) |
| Subscriptions | Yes (https://docs.lemonsqueezy.com) |
| Customer / billing portal | Yes — hosted customer portal / billing management (verify at https://docs.lemonsqueezy.com/guides/tutorials/nextjs-saas-billing) |
| Webhooks (+ signature) | Yes. Signing secret → **HMAC hash** in **`X-Signature`** header; verify by recomputing over raw body (https://docs.lemonsqueezy.com/help/webhooks/signing-requests) |
| Refund events | Yes — `order_refunded` event (https://docs.lemonsqueezy.com/help/webhooks) |
| Team / quantity purchases | Quantity supported; seat/team licensing modeling — verify at https://docs.lemonsqueezy.com |
| Metadata (entitlement mapping) | Yes — checkout `custom_data` appears in the `meta` field of Order/Subscription/License-key webhook events; ideal for entitlement IDs (https://docs.lemonsqueezy.com/help/webhooks/webhook-requests) |
| API quality | Good — REST API, JS SDK, License API; strong Next.js guides |
| Test / sandbox mode | Yes — test mode (verify at https://docs.lemonsqueezy.com) |
| Pricing model (fees) | "5% + 50¢" per transaction; **+1.5%** for international (non-US); **+5%** on abandoned-cart-recovered payments; **+3%** on affiliate-referred orders (https://docs.lemonsqueezy.com/help/getting-started/fees) |
| Payout constraints | MoR pays out net of fees & tax on a schedule; specifics Unknown (verify at https://docs.lemonsqueezy.com) |
| Integration complexity | Low — MoR removes tax ops; built-in **license keys** map naturally to entitlements |
| Vendor lock-in | Moderate — MoR owns the buyer relationship of record; code lock-in limited by our interface |
| Data export | Available via dashboard/API (verify at https://docs.lemonsqueezy.com) |
| Current limitations | Post-Stripe-acquisition roadmap uncertainty (see https://www.lemonsqueezy.com/blog/2026-update); surcharges stack (intl + affiliate + cart) |
| **Fit for this product** | **Strong.** MoR + native **license keys** + `custom_data` metadata map almost 1:1 onto "purchase → entitlement" for digital source |

---

## 3. Paddle (Merchant of Record)

MoR **purpose-built for SaaS and apps**. Strong subscription heritage; one-time supported.

| Criterion | Finding (official docs) |
| --- | --- |
| Supported countries (scope) | Sells to **200+ countries/territories**, auto-tax, blocks sanctioned regions (https://developer.paddle.com/concepts/sell/supported-countries-locales/) |
| **Merchant-of-record status** | **Yes — MoR.** "The only complete Merchant of Record solution purpose-built for SaaS and apps"; handles end-to-end tax registration, filing, remittance (https://www.paddle.com/pricing) |
| Tax handling | MoR calculates, collects, files & remits global sales tax/VAT/GST (https://www.paddle.com/pricing) |
| One-time purchases | Yes — one-time products/transactions (verify at https://developer.paddle.com) |
| Subscriptions | Yes — mature subscription billing (https://developer.paddle.com) |
| Customer / billing portal | Yes — Paddle-hosted customer portal / invoice management (verify at https://developer.paddle.com) |
| Webhooks (+ signature) | Yes. **`Paddle-Signature`** header (`ts` + `h1`), **HMAC-SHA256** over `ts:rawBody` using a per-destination secret (`pdl_ntfset_…`); SDKs enforce a 5s tolerance (https://developer.paddle.com/webhooks/signature-verification) |
| Refund events | Refunds surface via **adjustment** events (`adjustment.created`/`adjustment.updated`) + transaction events (https://developer.paddle.com/webhooks/overview) |
| Team / quantity purchases | Quantities supported; seat modeling app-side (verify at https://developer.paddle.com) |
| Metadata (entitlement mapping) | Custom data supported on transactions/products — exact field mechanics **Unknown (verify at https://developer.paddle.com/webhooks/overview)** |
| API quality | Good — Billing API v2, official SDKs, clear webhook docs |
| Test / sandbox mode | Yes — Paddle sandbox environment (verify at https://developer.paddle.com) |
| Pricing model (fees) | "5% + 50¢ per Checkout transaction" (pay-as-you-go); products under $10 / invoicing → custom pricing (https://www.paddle.com/pricing) |
| Payout constraints | Payouts net of fees/tax; minimum-balance & schedule rules — Unknown specifics (verify at https://www.paddle.com/help) |
| Integration complexity | Low–moderate — MoR removes tax ops; approval/onboarding review can be stricter |
| Vendor lock-in | Moderate — MoR owns buyer-of-record relationship |
| Data export | Dashboard + API reporting (verify at https://developer.paddle.com) |
| Current limitations | SaaS/subscription-leaning; **seller approval/onboarding vetting**; sub-$10 items need custom pricing |
| **Fit for this product** | **Good.** Solid MoR; entitlement mapping via custom data needs verification, and its subscription-first framing is a looser fit for a one-time source catalog than Lemon Squeezy/Polar |

---

## 4. Polar (Merchant of Record, developer-focused)

Open-source, **developer-first** MoR. Uses Stripe under the hood for processing/Tax but is **itself the reseller/MoR** and issues payouts via Stripe Connect Express.

| Criterion | Finding (official docs) |
| --- | --- |
| Supported countries (scope) | Global payments; payouts via **Stripe Connect Express** to supported countries — list at https://polar.sh/docs/merchant-of-record/supported-countries (verify) |
| **Merchant-of-record status** | **Yes — MoR.** "As your Merchant of Record, we handle all international tax compliance. We calculate, collect, and remit taxes worldwide." (https://polar.sh/docs) — "we are liable… as your reseller" (https://polar.sh/docs/merchant-of-record/tax) |
| Tax handling | Captures sales tax via Stripe Tax; **remits** through globally registered entities; manages thresholds/filings; B2B EU VAT supported (https://polar.sh/docs/merchant-of-record/tax) |
| One-time purchases | Yes — one-time products + subscriptions (https://polar.sh/docs) |
| Subscriptions | Yes (https://polar.sh/docs) |
| Customer / billing portal | Yes — customer management; hosted customer portal (verify at https://polar.sh/docs) |
| Webhooks (+ signature) | Yes — Orders (created/paid/updated/**refunded**), **Refunds** (created/updated), Subscriptions, Benefit Grants, Customers. Signature/secret method Unknown from fetched page — Polar uses the **Standard Webhooks** spec (verify at https://polar.sh/docs/integrate/webhooks/events) |
| Refund events | Yes — `order.refunded` + `refund.created`/`refund.updated` (https://polar.sh/docs/integrate/webhooks/events) |
| Team / quantity purchases | Quantity supported; seat modeling app-side (verify at https://polar.sh/docs) |
| Metadata (entitlement mapping) | Metadata supported on checkouts/orders; exact schema **Unknown (verify at https://polar.sh/docs)**. Native **benefits** (license keys, file downloads, GitHub/Discord access) map directly to entitlements |
| API quality | Strong developer focus — SDKs (TS, Python, Go, PHP) + framework adapters (Next.js, Laravel); open source (https://polar.sh/docs) |
| Test / sandbox mode | Yes — sandbox environment (verify at https://polar.sh/docs) |
| Pricing model (fees) | "5% + 50¢ per transaction" (https://polar.sh/docs/merchant-of-record/tax notes MoRs carry higher per-payment fees; rate per https://polar.sh/resources/pricing — verify) |
| Payout constraints | Payouts via **Stripe Connect Express**; Polar (US) is buyer-of-record so payout reach can exceed standalone Stripe availability; thresholds/schedule — verify at https://polar.sh/features/finance |
| Integration complexity | Low — developer-first; **built-in benefits (license keys / file access)** designed for exactly this use case |
| Vendor lock-in | Low–moderate — open source + our neutral interface; MoR still owns buyer relationship |
| Data export | Via API/dashboard (verify at https://polar.sh/docs) |
| Current limitations | Youngest/smallest of the four (maturity, track record, jurisdiction coverage still expanding); cannot independently deduct inbound VAT under MoR |
| **Fit for this product** | **Very strong on paper.** Developer-first MoR with native license-key/file-access **benefits** that model "component/pack/catalog entitlement" directly; main risk is **relative maturity** |

---

## Comparison

| Criterion | Stripe | Lemon Squeezy | Paddle | Polar |
| --- | --- | --- | --- | --- |
| Merchant of record | ❌ You are MoR | ✅ MoR | ✅ MoR | ✅ MoR |
| Tax registration/filing/remittance owned by | **You** (Stripe assists) | Provider | Provider | Provider |
| One-time purchases | ✅ | ✅ | ✅ | ✅ |
| Subscriptions (later) | ✅ | ✅ | ✅ (mature) | ✅ |
| Customer/billing portal | ✅ | ✅ | ✅ | ✅ |
| Webhook signature | HMAC-SHA256 `Stripe-Signature` | HMAC `X-Signature` | HMAC-SHA256 `Paddle-Signature` | Standard Webhooks (verify) |
| Refund events | ✅ `charge.refunded` | ✅ `order_refunded` | ✅ adjustment events | ✅ `order.refunded`/`refund.*` |
| Metadata → entitlement | ✅ `metadata` | ✅ `custom_data` + license keys | ⚠️ custom data (verify) | ✅ metadata + native benefits |
| Team/quantity | ✅ | ✅ | ✅ | ✅ |
| Digital-source fit | Heavy (DIY tax) | Strong | Good | Very strong |
| Headline fee | Lowest per-txn (verify US rate) | 5% + 50¢ (+surcharges) | 5% + 50¢ | 5% + 50¢ |
| Tax-compliance burden on us | **High** | Low | Low | Low |
| Maturity / track record | Highest | High | High | Newest |
| API/DX | Excellent | Good | Good | Strong (dev-first) |

Fee sources: Lemon Squeezy https://docs.lemonsqueezy.com/help/getting-started/fees · Paddle https://www.paddle.com/pricing · Polar https://polar.sh/resources/pricing (verify) · Stripe https://stripe.com/pricing (US rate unverified).

---

## Recommendation

**Proposed — pending human approval + credentials: Lemon Squeezy** (with **Polar** as the close runner-up / strong alternative).

**Why, tied to this product's needs:** We sell **editable digital source** as **one-time purchases** as a **small/solo operation**. The dominant risk is **global tax compliance**, not payment flexibility. All three MoR options (Lemon Squeezy, Paddle, Polar) remove that liability; Stripe alone does **not** — it would make us the merchant of record responsible for worldwide VAT/GST/sales-tax registration, filing, and remittance, which is exactly the overhead a small source catalog should avoid at launch. Stripe's lower per-transaction fee does not offset that operational and legal burden for us today.

Among the MoRs, **Lemon Squeezy** is recommended because it is **purpose-built for selling digital products/software**, its **`custom_data` → webhook `meta`** flow and **native license keys** map almost 1:1 onto our "purchase → internal entitlement" requirement, and its webhook model (`X-Signature` HMAC, `order_refunded`) covers grant/revoke cleanly. **Polar** is an extremely close second and is arguably the best *developer-experience* fit (native benefits for license keys / file downloads / access, open source, first-class TS SDK); its main disadvantage is being the **youngest/least battle-tested** provider. If Lemon Squeezy's post-Stripe-acquisition roadmap becomes a concern during approval, **switch the recommendation to Polar** — the two are interchangeable behind our interface. **Paddle** remains a solid MoR but leans subscription-first and its entitlement-metadata mechanics need verification, making it a weaker fit for a one-time source catalog.

### Hard constraints (do not skip)

- **Do NOT implement a live provider** before the owner **approves the choice** and **supplies credentials**. This document is research only.
- The **provider-neutral `CommerceProvider` interface stays unchanged** regardless of which provider is chosen — the decision affects only the concrete adapter plugged in later.
- Before implementation, **re-verify every value marked "verify"** against the live official pages (notably: Lemon Squeezy pages that 403'd here, the Stripe **US** headline rate, and Polar's webhook-signature method + fee page).
- Per [`16-commercial-packaging.md`](16-commercial-packaging.md): **no runtime license checks, no secrets in client code** — gate entitlements server-side at install/purchase using signed webhook events.

### Open items to confirm at approval time

- Lemon Squeezy: live-page re-verification (403 during research); team/agency-license modeling; data-export completeness.
- Polar: exact webhook signature/secret scheme; metadata schema; jurisdiction/maturity due-diligence.
- Paddle: custom-data → entitlement mechanics; sub-$10 pricing implications; onboarding/vetting timeline.
- Stripe (if reconsidered): full cost of running our own tax registration/filing/remittance ops before it could be viable.
