"use client";

import * as React from "react";

import {
  RuntimeSignalMap,
  demoTopology,
  type ServiceData,
  type ConnectionData,
} from "@/registry/backgrounds/runtime-signal-map";
import { type ContentPlacement } from "@/lib/motiq";
import { HeroContent, useHeroPlacement, type HeroCopy } from "../_components/hero-frame";
import {
  ControlBar,
  ControlSegmented,
  ControlToggle,
  ControlDivider,
} from "../_components/preview-controls";

const COPY: HeroCopy = {
  eyebrow: "Signals live",
  title: "Every request, drawn across your services.",
  copy: "One request flows edge to database. Degraded and failed routes stay readable.",
  primary: "Open dashboard",
  secondary: "View services",
};

type Scenario = "nominal" | "degraded" | "incident";

/**
 * Scenario overrides on the shipped demo topology — the same six services in
 * three health states so the playground can drive real state changes through the
 * public `services`/`connections` API (not a cosmetic toggle). The component
 * re-derives the active request path each time health changes.
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

export function RuntimeSignalMapPreview() {
  const [placement, setPlacement] = React.useState<ContentPlacement>("left");
  const [scenario, setScenario] = React.useState<Scenario>("incident");
  const [density, setDensity] = React.useState(1);
  const [speed, setSpeed] = React.useState(1);
  const [motion, setMotion] = React.useState(true);
  const [interactive, setInteractive] = React.useState(true);
  const [showSafe, setShowSafe] = React.useState(false);
  const effective = useHeroPlacement(placement);
  // "incident" is the component's built-in default — pass no services so the demo
  // extras (live-metric chips) show; the other scenarios override health.
  const topology = React.useMemo(
    () => (scenario === "incident" ? null : scenarioTopology(scenario)),
    [scenario],
  );

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-md)]">
        <RuntimeSignalMap
          contentPlacement={effective}
          services={topology?.services}
          connections={topology?.connections}
          density={density}
          speed={speed}
          interactive={interactive}
          reducedMotion={!motion || undefined}
          className="min-h-[440px]"
        >
          <HeroContent placement={effective} copy={COPY} showSafe={showSafe} minH="min-h-[500px] sm:min-h-[460px]" />
        </RuntimeSignalMap>
      </div>

      <ControlBar label="Background controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">State</span>
        <ControlSegmented
          label="Topology state"
          value={scenario}
          onChange={(v) => setScenario(v as Scenario)}
          options={[
            { value: "nominal", label: "Nominal" },
            { value: "degraded", label: "Degraded" },
            { value: "incident", label: "Incident" },
          ]}
        />
        <ControlDivider />
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Content</span>
        <ControlSegmented
          label="Content placement"
          value={placement}
          onChange={(v) => setPlacement(v as ContentPlacement)}
          options={[
            { value: "left", label: "Left" },
            { value: "right", label: "Right" },
            { value: "center", label: "Center" },
          ]}
        />
        <ControlDivider />
        <label className="flex items-center gap-2 whitespace-nowrap text-[12.5px] font-medium text-[var(--color-muted)]">
          Traffic
          <input
            type="range"
            min={0.4}
            max={1.6}
            step={0.1}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="h-1 w-20 cursor-pointer accent-[var(--color-accent)]"
            aria-label="Ambient traffic density"
          />
        </label>
        <label className="flex items-center gap-2 whitespace-nowrap text-[12.5px] font-medium text-[var(--color-muted)]">
          Speed
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="h-1 w-20 cursor-pointer accent-[var(--color-accent)]"
            aria-label="Flow speed"
          />
        </label>
        <ControlDivider />
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
        <ControlToggle pressed={interactive} onPressedChange={setInteractive}>
          Interactive
        </ControlToggle>
        <ControlToggle pressed={showSafe} onPressedChange={setShowSafe}>
          Show safe area
        </ControlToggle>
      </ControlBar>
    </div>
  );
}

export default RuntimeSignalMapPreview;
