"use client";

import * as React from "react";

import { DeploymentCommandCenter } from "@/registry/blocks/deployment-command-center";

/* -------------------------------------------------------------------------
 * DEMO ONLY — a composed "deploy console" block. Every repo, endpoint, id,
 * header, and timing is fictional and provider-neutral; there is NO real API
 * and NO real deployment provider here. The block owns a small scripted state
 * machine and only feeds the four presentation-only components. Credential
 * headers are pre-masked placeholders ("Bearer ••••••").
 * ---------------------------------------------------------------------- */

export function DeploymentCommandCenterPreview() {
  return (
    <div className="w-full max-w-[1040px]">
      <DeploymentCommandCenter />
    </div>
  );
}

export default DeploymentCommandCenterPreview;
