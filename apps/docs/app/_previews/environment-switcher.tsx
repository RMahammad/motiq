"use client";

import * as React from "react";

import {
  EnvironmentSwitcher,
  type Environment,
} from "@/registry/developer-tools/environment-switcher";

/* -------------------------------------------------------------------------
 * DEMO ONLY — a fictional "deployment header" for the imaginary repo
 * acme/ledger-web. Every environment, region, branch, version, health number
 * and timestamp below is invented and local. There is NO real backend: the
 * switcher only reports whatever value/state this shell hands it, and the
 * "switch" is a local setTimeout — nothing is ever deployed or promoted.
 * ---------------------------------------------------------------------- */

// Fixed epoch so the server-rendered initial state is deterministic.
// Handlers advance from this same baseline — never wall-clock Date.now().
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
    permissions: ["read", "write"],
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
    permissions: ["read", "write"],
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
    permissions: ["read", "write"],
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
    permissions: ["read"],
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
    url: "https://ledger.acme.app",
    permissions: ["read"],
    group: "shared",
  },
  {
    id: "production-eu",
    name: "Production · EU",
    type: "production",
    status: "restricted",
    region: "fra1",
    branch: "main",
    version: "v2.8.4",
    lastDeploy: BASE_TS - 6 * 60 * MIN,
    disabled: true,
    disabledReason: "Requires the EU-operator role — request access in the console.",
    group: "shared",
  },
];

const GROUPS = [
  { id: "shared", label: "Shared environments" },
  { id: "personal", label: "Your environments" },
];

const controlBtn =
  "inline-flex min-h-[32px] items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))] disabled:cursor-not-allowed disabled:opacity-50";

const GitBranchGlyph = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="6" cy="18" r="2.5" />
    <circle cx="18" cy="7" r="2.5" />
    <path d="M6 8.5v7M18 9.5c0 3.5-3 4-6 4.5" />
  </svg>
);

export function EnvironmentSwitcherPreview() {
  const [value, setValue] = React.useState("development");
  const [switching, setSwitching] = React.useState(false);
  const [switchingId, setSwitchingId] = React.useState<string | undefined>(undefined);
  const [error, setError] = React.useState<string | null>(null);
  const [requireConfirm, setRequireConfirm] = React.useState(true);
  const [failMode, setFailMode] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const clear = () => { if (timer.current) clearTimeout(timer.current); };

  // Simulate the app performing the switch: brief pending, then commit or fail.
  const runSwitch = React.useCallback(
    (id: string) => {
      clear();
      setError(null);
      setSwitching(true);
      setSwitchingId(id);
      timer.current = setTimeout(() => {
        setSwitching(false);
        if (failMode) {
          const env = ENVIRONMENTS.find((e) => e.id === id);
          setError(`Switch to ${env?.name ?? "environment"} failed — origin unreachable (ECONNRESET).`);
        } else {
          setValue(id);
        }
        setSwitchingId(undefined);
      }, 1100);
    },
    [failMode],
  );

  const onValueChange = React.useCallback((id: string) => runSwitch(id), [runSwitch]);

  const retry = React.useCallback(() => {
    setFailMode(false);
    if (switchingId) runSwitch(switchingId);
    else setError(null);
  }, [switchingId, runSwitch]);

  const reset = React.useCallback(() => {
    clear();
    setValue("development");
    setSwitching(false);
    setSwitchingId(undefined);
    setError(null);
    setFailMode(false);
    setRequireConfirm(true);
  }, []);

  const current = ENVIRONMENTS.find((e) => e.id === value);

  return (
    <div className="w-full max-w-[760px]">
      {/* Deployment header — repo / branch bar ---------------------------- */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-fg)]">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-[var(--color-accent)] text-[11px] font-bold text-white" aria-hidden>A</span>
            acme<span className="text-[var(--color-muted)]">/</span>ledger-web
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[11.5px] font-medium text-[var(--color-muted)]">
            <GitBranchGlyph />
            <span className="font-mono">{current?.branch ?? "main"}</span>
          </span>
          <span className="text-[11.5px] text-[var(--color-muted)]">Demo data · no live backend</span>
          <span className="ml-auto text-[11.5px] tabular-nums text-[var(--color-muted)]">
            deploy <span className="font-mono text-[var(--color-fg)]">{current?.version ?? "—"}</span>
          </span>
        </div>

        {/* The switcher dominates the header body ------------------------ */}
        <div className="flex flex-col gap-3 px-4 py-5 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <EnvironmentSwitcher
              environments={ENVIRONMENTS}
              value={value}
              onValueChange={onValueChange}
              switching={switching}
              switchingId={switchingId}
              error={error}
              onRetry={retry}
              requireProductionConfirmation={requireConfirm}
              groups={GROUPS}
              recentIds={["staging", "preview-248"]}
              favoriteIds={["development"]}
              now={BASE_TS}
              label="Deploy target"
              className="max-w-none"
            />
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-muted)]">
              Open the switcher to search, arrow-key through environments, and try switching to Production —
              the confirmation guard is {requireConfirm ? "on" : "off"}.
            </p>
          </div>
        </div>
      </div>

      {/* Working controls ------------------------------------------------- */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Demo controls">
        <button type="button" className={controlBtn} onClick={() => { setFailMode(false); runSwitch("staging"); }}>
          Switch to staging
        </button>
        <button type="button" className={controlBtn} onClick={() => { setFailMode(false); runSwitch("production"); }}>
          Switch to production
        </button>
        <span className="mx-1 h-4 w-px bg-[var(--color-border)]" aria-hidden />
        <button type="button" className={controlBtn} onClick={() => { setFailMode(false); runSwitch("development"); }}>
          Simulate loading
        </button>
        <button type="button" className={controlBtn} onClick={() => { setFailMode(true); runSwitch("staging"); }}>
          Simulate failure
        </button>
        <span className="mx-1 h-4 w-px bg-[var(--color-border)]" aria-hidden />
        <button
          type="button"
          className={controlBtn}
          aria-pressed={requireConfirm}
          onClick={() => setRequireConfirm((c) => !c)}
        >
          Production confirm: {requireConfirm ? "on" : "off"}
        </button>
        <button type="button" className={controlBtn} onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}

export default EnvironmentSwitcherPreview;
