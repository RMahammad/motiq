---
name: visual-direction
description: Establish or change the visual system before a homepage/docs redesign, major brand change, new product area, or catalog redesign. Produces three real alternatives, a decision, and token implications — so individual pages can't invent unrelated styles.
allowed-tools: Read, Edit, Write, Grep, Glob
---

# Visual direction

## Use this skill when
Before a homepage/documentation redesign, a major brand change, a new product area, a large component‑catalog redesign, or introducing a new visual system.

## Do not use this skill when
Making a small, in‑system visual tweak (use `design-system-consistency`).

## Required context
Product brief + audience + positioning ([`27`](../../../docs/27-product-differentiation.md)); the current‑UI audit ([`26`](../../../docs/26-current-ui-audit.md)); existing tokens/typography/components ([`10`](../../../docs/10-design-tokens.md), [`11`](../../../docs/11-tailwind-strategy.md)); the anti‑pattern list ([`28`](../../../docs/28-visual-direction.md)); and the `design-taste-frontend` skill (visual guidance, **lower precedence** than project rules).

## Inputs
Brand attributes, audience, references, quiet constraints (a11y‑first? regulated?).

## Procedure
1. State a one‑line **design read** and set the three dials (VARIANCE / MOTION / DENSITY).
2. Produce **three meaningfully different** directions (not three blue‑white SaaS variants). For each define: concept · impression · brand attributes · display/body/mono type · color · neutrals · accent behavior · surface/radius/border/shadow · grid · spacing · section composition · nav · code presentation · motion character/intensity · product‑preview strategy · illustration · icon · dark mode · advantages · risks · a11y · performance · how it avoids common patterns.
3. Score with a weighted **decision matrix**; select one; justify against the moat.
4. Derive **token implications** (docs‑brand layer — do not impose a brand on `@scope/tokens`).
5. Append/confirm the **anti‑pattern list**.

## Required validation
The selection must dramatize the product moat and pass accessibility + performance headroom checks. "Premium because dark/gradient/large‑type/glow" is **rejected** reasoning.

## Expected outputs
Three directions · decision matrix · selected direction · token implications · homepage/docs/component implications · a11y risks · performance risks · required ADR/doc changes.

## Documentation updates
Write to [`docs/28-visual-direction.md`](../../../docs/28-visual-direction.md); create/update [ADR-0014](../../../docs/adrs/0014-visual-direction.md).

## Stop conditions
Stop if the three directions are minor variations of each other, or if any relies on decoration instead of structure.

## Prohibited actions
Do not let individual pages invent unrelated styles. Do not edit `@scope/tokens` brand values for a docs‑only brand. Do not treat Taste Skill as higher authority than project rules.
