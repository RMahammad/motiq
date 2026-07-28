"use client";

import * as React from "react";

import { LensCard } from "@/registry/cursor/lens-card";
import { ControlBar, ControlDivider, ControlSegmented, ControlToggle, ControlHint } from "../_components/preview-controls";

interface Tile {
  label: string;
  value: string;
  unit?: string;
  delta: string;
  tone: "up" | "down";
  spark?: string;
}

/** Deterministic demo data — no random, no clocks. */
const TILES: Tile[] = [
  { label: "Latency p95", value: "128", unit: "ms", delta: "▼ 11% wk/wk", tone: "up", spark: "M0 20 L14 16 L28 18 L42 10 L56 13 L70 7 L84 9 L100 4" },
  { label: "Throughput", value: "4.2", unit: "k rps", delta: "▲ 6.3% wk/wk", tone: "up", spark: "M0 18 L14 19 L28 14 L42 15 L56 9 L70 11 L84 6 L100 7" },
  { label: "Error budget", value: "98.4", unit: "%", delta: "on track · 21d left", tone: "up", spark: "M0 8 L14 9 L28 7 L42 10 L56 8 L70 12 L84 10 L100 11" },
  { label: "Active regions", value: "12", unit: "/14", delta: "iad + syd draining", tone: "down" },
  { label: "Queue depth", value: "341", delta: "▼ draining 84/s", tone: "up" },
  { label: "Spend today", value: "$212", unit: ".40", delta: "▲ 3.1% vs avg", tone: "down" },
];

function MetricGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 p-[clamp(20px,4vw,44px)] sm:grid-cols-3">
      {TILES.map((t) => (
        <div
          key={t.label}
          className="min-w-0 rounded-[10px] border border-[var(--color-border)] p-4"
          style={{ background: "color-mix(in oklab, var(--color-surface) 88%, transparent)" }}
        >
          <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--color-muted)]">{t.label}</div>
          <div className="mt-1.5 text-[clamp(18px,2.6vw,26px)] font-bold tabular-nums tracking-tight text-[var(--color-fg)]">
            {t.value}
            {t.unit ? <small className="ml-0.5 text-[0.55em] font-semibold text-[var(--color-muted)]">{t.unit}</small> : null}
          </div>
          <div
            className="mt-1 font-mono text-[11.5px]"
            style={{ color: t.tone === "up" ? "var(--color-success)" : "var(--color-warning)" }}
          >
            {t.delta}
          </div>
          {t.spark ? (
            <svg className="mt-2 block h-[26px] w-full" viewBox="0 0 100 26" preserveAspectRatio="none" aria-hidden>
              <path d={`${t.spark} L100 26 L0 26 Z`} fill="color-mix(in oklab, var(--color-accent) 14%, transparent)" />
              <path d={t.spark} fill="none" stroke="var(--color-accent)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function LensCardPreview() {
  const [magnification, setMagnification] = React.useState(1.35);
  const [chromatic, setChromatic] = React.useState(true);
  const [gridBend, setGridBend] = React.useState(true);
  const [motion, setMotion] = React.useState(true);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-md)]">
        <LensCard
          magnification={magnification}
          chromatic={chromatic ? 2.2 : 0}
          gridBend={gridBend}
          reducedMotion={!motion || undefined}
          seed={5}
        >
          <MetricGrid />
        </LensCard>
      </div>

      <ControlBar label="Lens controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Magnification</span>
        <ControlSegmented
          label="Magnification"
          value={String(magnification)}
          onChange={(v) => setMagnification(Number(v))}
          options={[
            { value: "1.2", label: "1.2×" },
            { value: "1.35", label: "1.35×" },
            { value: "1.7", label: "1.7×" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={chromatic} onPressedChange={setChromatic}>
          Chromatic fringe
        </ControlToggle>
        <ControlToggle pressed={gridBend} onPressedChange={setGridBend}>
          Grid bend
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
        <ControlHint>{motion ? "Glide the lens — it drifts on its own when you leave" : "Lens parked centre-stage"}</ControlHint>
      </ControlBar>
    </div>
  );
}

export default LensCardPreview;
