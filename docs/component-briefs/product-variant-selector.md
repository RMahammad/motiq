# Brief — Product Variant Selector

- **Tier:** Free · **Category:** Commerce
- **Problem:** Storefronts re-implement variant pickers (colour/size/plan) with dependent options, unavailable combinations, and price adjustments — usually inaccessible and with deceptive scarcity.
- **Use case:** A product-page option selector the app drives with real inventory/pricing; the component orchestrates selection + presents availability/price, never inventing scarcity.
- **States:** idle · selecting · loading availability · unavailable combination · price-adjusted · invalid-combination recovery · reset.
- **Interaction:** controlled selection, dependent options, unavailable/disabled with reason, price-change presentation, product-image callback, selection summary, reset, mobile compact.
- **Animation purpose:** communicate selection, availability recalculation, price adjustment, image change — always mirrored in text (never price-by-animation).
- **API sketch:** `<ProductVariantSelector groups value onChange onPriceChange onImageChange formatPrice loadingAvailability />`; option = { value, label, swatch?, image?, priceAdjustment?, availability, inventoryState, disabledReason?, recommended?, metadata? }.
- **Accessibility:** `role=radiogroup/radio` where appropriate; text labels for swatches; unavailable reason via aria; keyboard arrows; focus-visible; price changes in text; reduced motion.
- **Mobile:** compact stacked groups, wrap long labels, localization-safe price formatting.
- **Dependencies:** motion + `@motionstack/{utils,primitives}`.
- **Similarity concern:** common commerce pattern; clean-room, original API (app-supplied inventory, no fake scarcity/discounts). Low.
- **Release criteria:** 6 tests (controlled selection, unavailable combo, disabled reason, price-change callback, keyboard selection, loading availability) + axe; rapid gate.
