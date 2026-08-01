"use client";

import * as React from "react";
import Link from "next/link";

import {
  RuntimeSignalMap,
  demoTopology,
  type ServiceData,
  type ConnectionData,
} from "@/registry/backgrounds/runtime-signal-map";
import { HeroContent, useHeroPlacement, type HeroCopy } from "./hero-frame";

/* -------------------------------------------------------------------------
 * The lead card of the homepage catalog grid (docs/61 §catalog). It is the one
 * card the visitor can *drive*: the Runtime Signal Map rendered the way it is
 * actually used — as a hero background with content over its safe area — plus a
 * state HUD that patches real `services` health through the component's public
 * API. Same card language as the rest of the grid (count chip, meta row with a
 * go-arrow), but its controls are real buttons, so the shell is a <div> and only
 * the title/arrow link out — never a whole-card link wrapping interactive
 * elements.
 * ---------------------------------------------------------------------- */

const COPY: HeroCopy = {
  eyebrow: "Signals live",
  title: "Every request, drawn across your services.",
  copy: "One request flows edge to database. Degraded and failed routes stay readable.",
  primary: "Open dashboard",
  secondary: "View services",
};

type Scenario = "nominal" | "degraded" | "incident";

const SCENARIOS: { value: Scenario; label: string; tone: string }[] = [
  { value: "nominal", label: "Nominal", tone: "var(--color-accent)" },
  { value: "degraded", label: "Degraded", tone: "var(--color-warning)" },
  { value: "incident", label: "Incident", tone: "var(--color-error)" },
];

/**
 * Scenario overrides on the shipped demo topology — the same six services in
 * three health states, driven through the public `services` / `connections`
 * API. Mirrors the component playground's scenarios so the homepage and the
 * docs demo can never drift apart.
 */
function scenarioTopology(scenario: Scenario): {
  services: ServiceData[];
  connections: ConnectionData[];
} {
  const { services, connections } = demoTopology();
  const patch: Record<string, ServiceData["health"]> =
    scenario === "nominal"
      ? { payments: "healthy", queue: "healthy" }
      : scenario === "degraded"
        ? { payments: "healthy" }
        : {};
  const statusPatch: Record<string, string> =
    scenario === "nominal"
      ? { payments: "authorizing", queue: "drained" }
      : scenario === "degraded"
        ? { payments: "authorizing" }
        : {};
  return {
    services: services.map((s) => ({
      ...s,
      health: patch[s.id] ?? s.health,
      status: statusPatch[s.id] ?? s.status,
    })),
    connections,
  };
}

export function RuntimeSignalHero({ count, href }: { count: number; href: string }) {
  const [scenario, setScenario] = React.useState<Scenario>("nominal");
  const placement = useHeroPlacement("left");
  // "incident" is the component's built-in demo default — pass no services so
  // its full demo extras render; the other scenarios patch health explicitly.
  const topology = React.useMemo(
    () => (scenario === "incident" ? null : scenarioTopology(scenario)),
    [scenario],
  );

  return (
    <div
      className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:border-[color-mix(in_oklab,var(--fam)_45%,var(--color-border))] hover:shadow-[var(--shadow-md)]"
      style={{ ["--fam" as string]: "#4f7cff" }}
    >
      <div className="relative flex-1 overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        {/* showLabels off + eased density: on the homepage this is a *background*
            carrying one state, not a diagnostic read-out. Health stays legible
            through node treatment and the HUD; the labelled, full-density read
            lives on the component page. */}
        <RuntimeSignalMap
          contentPlacement={placement}
          services={topology?.services}
          connections={topology?.connections}
          showLabels={false}
          density={0.85}
          className="w-full"
        >
          <div className="pb-24 pt-14">
            <HeroContent placement={placement} copy={COPY} minH="min-h-[520px] lg:min-h-[400px]" />
          </div>
        </RuntimeSignalMap>

        {/* count chip — same position and treatment as every other card */}
        <span
          className="pointer-events-none absolute left-[15px] top-[15px] z-[3] inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tabular-nums tracking-[0.04em]"
          style={{
            color: "var(--fam)",
            background: "color-mix(in oklab, var(--fam) 13%, var(--color-surface))",
            borderColor: "color-mix(in oklab, var(--fam) 32%, transparent)",
          }}
        >
          {count} components
        </span>

        {/* state HUD — the one thing on this page you can drive */}
        <div
          className="absolute inset-x-4 bottom-4 z-[3] flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Preview system state"
        >
          {SCENARIOS.map((s) => {
            const on = s.value === scenario;
            return (
              <button
                key={s.value}
                type="button"
                aria-pressed={on}
                onClick={() => setScenario(s.value)}
                className={`inline-flex h-[34px] items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold backdrop-blur transition-all ${
                  on
                    ? "text-[var(--color-fg)]"
                    : "border-[var(--color-border-strong)] bg-[color-mix(in_oklab,var(--color-surface)_72%,transparent)] text-[var(--color-fg-secondary)] hover:bg-[color-mix(in_oklab,var(--color-surface)_90%,transparent)]"
                }`}
                style={
                  on
                    ? {
                        borderColor: `color-mix(in oklab, ${s.tone} 62%, transparent)`,
                        background: `color-mix(in oklab, ${s.tone} 16%, var(--color-surface))`,
                        boxShadow: `0 0 20px color-mix(in oklab, ${s.tone} 22%, transparent)`,
                      }
                    : undefined
                }
              >
                <span
                  aria-hidden
                  className="h-[7px] w-[7px] rounded-full transition-colors"
                  style={on ? { background: s.tone, boxShadow: `0 0 9px ${s.tone}` } : { background: "var(--color-subtle)" }}
                />
                {s.label}
              </button>
            );
          })}
          <span className="ml-1 hidden text-[12px] text-[var(--color-subtle)] sm:inline">
            ← your app sets this · Runtime Signal Map
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3.5 px-[19px] py-[17px]">
        <span className="min-w-0">
          <h3 className="text-[16.5px] font-semibold tracking-[-0.012em] text-[var(--color-fg)]">
            <Link href={href} className="outline-none hover:text-[var(--color-accent-text)]">
              Product backgrounds
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-[13.5px] text-[var(--color-muted)]">
            Animated environments driven by your application state.
          </p>
        </span>
        <Link
          href={href}
          aria-label="Browse product backgrounds"
          className="ml-auto grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-[var(--color-border-strong)] text-[var(--color-muted)] transition-all duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] group-hover:-rotate-45 group-hover:border-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-accent-fg)]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
