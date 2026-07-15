"use client";

import * as React from "react";

import { CheckoutProgress, type CheckoutStep } from "@/registry/commerce/checkout-progress";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL CheckoutProgress in one
 * representative mid-flow state — an editable completed step, the active step
 * (with its panel) and its upcoming neighbours. No external next/invalid/block
 * demo controls; navigation buttons stay as the component's inherent affordance.
 * Trimmed to 5 steps (active step + neighbours). Deterministic.
 */

function line(label: string, value: string) {
  return (
    <p className="flex items-baseline justify-between gap-4 text-[13px]">
      <span className="text-[var(--color-muted)]">{label}</span>
      <span className="font-medium text-[var(--color-fg)]">{value}</span>
    </p>
  );
}

const STEPS: CheckoutStep[] = [
  {
    id: "cart",
    label: "Hire cart",
    description: "The gear you’re booking for the trip.",
    state: "completed",
    editable: true,
    summary: "2 items · 4-day hire",
  },
  {
    id: "contact",
    label: "Contact details",
    description: "Where we send booking updates.",
    state: "current",
    editable: true,
    content: (
      <div className="space-y-2 text-[13px] leading-relaxed text-[var(--color-fg)]">
        {line("Name", "Sam Rivera (fictional)")}
        {line("Email", "sam@example.test")}
      </div>
    ),
  },
  { id: "delivery", label: "Delivery window", state: "incomplete", editable: true },
  { id: "payment", label: "Payment method", state: "incomplete", editable: true },
  { id: "review", label: "Review & place", state: "incomplete", editable: true },
];

export function CheckoutProgressCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <CheckoutProgress steps={STEPS} currentStepId="contact" state="editing" mode="guest" submitLabel="Place booking" />
    </div>
  );
}

export default CheckoutProgressCatalogPreview;
