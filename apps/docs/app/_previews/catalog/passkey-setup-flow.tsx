"use client";

import * as React from "react";

import { PasskeySetupFlow } from "@/registry/security/passkey-setup-flow";

/**
 * Compact catalog adapter (docs/55). Renders the REAL PasskeySetupFlow in one
 * calm, trustworthy state — the "intro" step, with the branded header, the
 * three-step progress, and the honest passkey reassurance. No demo-driving
 * control panel; the detail page keeps the full state rig. Deterministic and
 * clearly fictional (no real WebAuthn, no account).
 */

const CAPABILITY = {
  supported: true,
  platformAuthenticator: true,
  roamingAuthenticator: true,
};

export function PasskeySetupFlowCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[460px]">
      <PasskeySetupFlow
        state="intro"
        capability={CAPABILITY}
        relyingPartyName="Northwind Studio"
        userIdentifier="ada@northwind.example"
        className="max-w-none"
      />
    </div>
  );
}

export default PasskeySetupFlowCatalogPreview;
