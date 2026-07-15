"use client";

import * as React from "react";

import {
  EnvironmentSwitcher,
  type Environment,
  type EnvironmentGroup,
} from "@/registry/developer-tools/environment-switcher";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL EnvironmentSwitcher in
 * one representative resting state — the trigger showing the active Development
 * environment with its status chip — trimmed to 5 environments, with no
 * switch/simulate/confirm controls and a fixed `now` for deterministic times.
 * The detail page keeps the full deploy-header rig.
 */

const BASE_TS = 1_700_000_000_000;
const MIN = 60_000;

const ENVIRONMENTS: Environment[] = [
  {
    id: "local",
    name: "Local",
    type: "local",
    status: "available",
    branch: "feature/checkout",
    version: "dev",
    lastDeploy: BASE_TS - 2 * MIN,
    group: "personal",
  },
  {
    id: "development",
    name: "Development",
    type: "development",
    status: "active",
    region: "iad1",
    branch: "develop",
    version: "v2.9.0-rc.3",
    lastDeploy: BASE_TS - 11 * MIN,
    health: 98,
    group: "shared",
  },
  {
    id: "staging",
    name: "Staging",
    type: "staging",
    status: "degraded",
    region: "iad1",
    branch: "release/2.9",
    version: "v2.9.0-rc.2",
    lastDeploy: BASE_TS - 42 * MIN,
    health: 71,
    warning: "One replica failing health checks",
    group: "shared",
  },
  {
    id: "preview-248",
    name: "Preview PR-248",
    type: "preview",
    status: "deploying",
    region: "iad1",
    branch: "feat/coupon-stacking",
    version: "8f1c2a0",
    lastDeploy: BASE_TS - 30_000,
    health: 88,
    group: "shared",
  },
  {
    id: "production",
    name: "Production",
    type: "production",
    status: "available",
    region: "iad1 · +3 regions",
    branch: "main",
    version: "v2.8.4",
    lastDeploy: BASE_TS - 6 * 60 * MIN,
    health: 99,
    warning: "Live customer traffic and data",
    group: "shared",
  },
];

const GROUPS: EnvironmentGroup[] = [
  { id: "shared", label: "Shared environments" },
  { id: "personal", label: "Your environments" },
];

export function EnvironmentSwitcherCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[460px]">
      <EnvironmentSwitcher
        environments={ENVIRONMENTS}
        defaultValue="development"
        groups={GROUPS}
        now={BASE_TS}
        label="Deploy target"
        className="max-w-none"
      />
    </div>
  );
}

export default EnvironmentSwitcherCatalogPreview;
