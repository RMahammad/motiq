"use client";

import * as React from "react";

import {
  PromptComposer,
  type PromptModel,
  type PromptVariable,
  type PromptTemplate,
  type PromptAttachment,
} from "@/registry/ai/prompt-composer";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL PromptComposer in one
 * representative idle state — a populated draft with variable chips, a model
 * selection, and two ready attachments — trimmed for a card, with no
 * Simulate/Fail/Reset controls. The detail page keeps the full interactive rig.
 */

const MODELS: PromptModel[] = [
  { id: "swift", name: "Nimbus Swift", caption: "Fast · demo model" },
  { id: "atlas", name: "Nimbus Atlas", caption: "Balanced · demo model" },
  { id: "sage", name: "Nimbus Sage", caption: "Deep reasoning · demo model" },
];

const VARIABLES: PromptVariable[] = [
  { key: "customer_name", label: "Customer name", description: "Recipient's display name", sample: "Dana Okoro" },
  { key: "order_id", label: "Order id", description: "The ticket's order reference", sample: "AC-40192" },
  { key: "product", label: "Product", description: "Product the ticket is about", sample: "Ledger Pro" },
];

const TEMPLATES: PromptTemplate[] = [
  {
    id: "apology",
    label: "Apology + fix",
    description: "Acknowledge, apologise, offer a concrete next step",
    body: "Write a reply to {{customer_name}} about order {{order_id}}.",
  },
  {
    id: "howto",
    label: "How-to explainer",
    description: "Step-by-step walkthrough",
    body: "Explain to {{customer_name}} how to set up {{product}}.",
  },
];

const ATTACHMENTS: PromptAttachment[] = [
  { id: "screenshot", name: "error-screenshot.png", kind: "image", meta: "412 KB", status: "ready" },
  { id: "ticket", name: "ticket-AC-40192.json", kind: "data", meta: "3 KB", status: "ready" },
];

export function PromptComposerCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <PromptComposer
        value="Draft a warm reply to {{customer_name}} about their issue with {{product}}. Apologise for the delay and offer a concrete next step."
        label="Reply prompt"
        placeholder="Describe the reply you want…"
        variables={VARIABLES}
        templates={TEMPLATES}
        attachments={ATTACHMENTS}
        models={MODELS}
        selectedModelId="atlas"
        tokenCount={28}
        maxTokens={200}
        status="idle"
      />
    </div>
  );
}

export default PromptComposerCatalogPreview;
