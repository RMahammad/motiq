"use client";

import * as React from "react";

import {
  TwoFactorSetupFlow,
  type TwoFactorMethod,
} from "@/registry/security/two-factor-setup-flow";

/**
 * Compact catalog adapter (docs/55). Renders the REAL TwoFactorSetupFlow in one
 * calm, trustworthy state — the "method selection" step, with the branded
 * header, the four-step progress, and an honest, populated method list (each
 * method carries its own tradeoff copy). No demo-driving control panel; the
 * detail page keeps the full state rig. Deterministic; no real crypto/verification.
 */

const METHODS: TwoFactorMethod[] = [
  {
    kind: "authenticator",
    label: "Authenticator app",
    description: "One-time codes from an app on your phone.",
    recommended: true,
  },
  {
    kind: "security-key",
    label: "Security key",
    description: "A hardware key you tap or plug in.",
  },
  {
    kind: "sms",
    label: "Text message (SMS)",
    description: "A code texted to your phone.",
    tradeoff: "Convenient, but SMS can be intercepted or SIM-swapped.",
  },
];

export function TwoFactorSetupFlowCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[460px]">
      <TwoFactorSetupFlow
        state="method-selection"
        methods={METHODS}
        defaultSelectedMethod="authenticator"
        relyingPartyName="Northwind Studio"
        userIdentifier="ada@northwind.example"
        className="max-w-none"
      />
    </div>
  );
}

export default TwoFactorSetupFlowCatalogPreview;
