"use client";

import * as React from "react";

import { DeploymentCommandCenter } from "@/registry/blocks/deployment-command-center";

/**
 * Compact catalog adapter (docs/55). Renders the REAL DeploymentCommandCenter
 * block in its default populated state — a finished successful run, so the
 * console, stages, and log all read richly. Full-width block layout; no extra
 * external controls. Provider-neutral fictional demo data.
 */

export function DeploymentCommandCenterCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[980px]">
      <DeploymentCommandCenter />
    </div>
  );
}

export default DeploymentCommandCenterCatalogPreview;
