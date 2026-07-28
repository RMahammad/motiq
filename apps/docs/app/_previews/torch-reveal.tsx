"use client";

import * as React from "react";

import { TorchReveal } from "@/registry/cursor/torch-reveal";
import { ControlBar, ControlDivider, ControlSegmented, ControlToggle, ControlHint } from "../_components/preview-controls";

const BARS = [34, 52, 41, 66, 58, 78, 70, 92];

const LAYER = "grid min-h-[440px] items-center gap-[clamp(16px,3vw,40px)] p-[clamp(20px,4vw,48px)] md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]";

function FinishedHero() {
  return (
    <div
      className={LAYER}
      style={{
        background:
          "radial-gradient(70% 90% at 85% 15%, color-mix(in oklab, var(--color-accent) 16%, transparent), transparent 60%), radial-gradient(60% 80% at 10% 90%, color-mix(in oklab, var(--color-secondary-accent) 10%, transparent), transparent 55%), var(--color-bg-elevated)",
      }}
    >
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-secondary-accent)]">
          Relay · deploy pipeline
        </div>
        <h3 className="my-2.5 text-[clamp(24px,3.6vw,38px)] font-bold leading-[1.08] tracking-tight text-[var(--color-fg)]">
          Ship the interface.
          <br />
          Keep the blueprint.
        </h3>
        <p className="mb-[18px] max-w-[400px] text-[14.5px] text-[var(--color-fg-secondary)]">
          Every surface in this hero has a second life as its own spec sheet. Bring a light and read the construction
          lines.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13.5px] font-semibold"
          style={{
            background: "linear-gradient(140deg, var(--color-accent), color-mix(in oklab, var(--color-accent) 55%, var(--color-secondary-accent)))",
            color: "var(--color-bg)",
          }}
        >
          Start deploying
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
      <div
        className="hidden rounded-2xl border border-[var(--color-border)] p-[18px] md:block"
        style={{ background: "color-mix(in oklab, var(--color-surface) 88%, transparent)" }}
        aria-hidden
      >
        {[
          ["build", "passing · 41s", true],
          ["canary", "2% traffic", false],
          ["p99", "203 ms", false],
        ].map(([k, v, ok]) => (
          <div
            key={String(k)}
            className="flex items-center justify-between border-b border-[var(--color-border)] py-2.5 text-[12.5px] last:border-b-0"
          >
            <span className="font-mono text-[11px] text-[var(--color-muted)]">{k}</span>
            <span className="font-semibold tabular-nums" style={{ color: ok ? "var(--color-success)" : undefined }}>
              {v}
            </span>
          </div>
        ))}
        <div className="mt-2.5 flex h-11 items-end gap-1">
          {BARS.map((h, i) => (
            <i
              key={i}
              className="flex-1 rounded-t-[3px]"
              style={{
                height: `${h}%`,
                background:
                  "linear-gradient(to top, color-mix(in oklab, var(--color-accent) 65%, transparent), var(--color-secondary-accent))",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const anno =
  "absolute whitespace-nowrap rounded border px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-secondary-accent)]";
const annoStyle: React.CSSProperties = {
  background: "color-mix(in oklab, var(--color-bg) 85%, transparent)",
  borderColor: "color-mix(in oklab, var(--color-secondary-accent) 45%, transparent)",
};

function BlueprintTwin() {
  const wire: React.CSSProperties = {
    color: "transparent",
    WebkitTextStrokeWidth: "1px",
    WebkitTextStrokeColor: "color-mix(in oklab, var(--color-secondary-accent) 75%, transparent)",
  };
  return (
    <div
      className={LAYER}
      style={{
        background:
          "repeating-linear-gradient(to right, color-mix(in oklab, var(--color-secondary-accent) 14%, transparent) 0 1px, transparent 1px 28px), repeating-linear-gradient(to bottom, color-mix(in oklab, var(--color-secondary-accent) 14%, transparent) 0 1px, transparent 1px 28px), color-mix(in oklab, var(--color-bg) 92%, var(--color-secondary-accent))",
      }}
    >
      <div className="relative">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em]" style={wire}>
          Relay · deploy pipeline
        </div>
        <h3 className="my-2.5 text-[clamp(24px,3.6vw,38px)] font-bold leading-[1.08] tracking-tight" style={wire}>
          Ship the interface.
          <br />
          Keep the blueprint.
        </h3>
        <p className="mb-[18px] max-w-[400px] text-[14.5px]" style={{ ...wire, WebkitTextStrokeWidth: "0.6px" }}>
          Every surface in this hero has a second life as its own spec sheet. Bring a light and read the construction
          lines.
        </p>
        <span className="relative inline-block h-[38px] w-[132px] rounded-[10px] border-[1.5px] border-dashed border-[var(--color-secondary-accent)]">
          <span className={anno} style={{ ...annoStyle, top: -22, left: 0 }}>
            radius 10 · pad 9/16
          </span>
        </span>
        <span className={anno} style={{ ...annoStyle, top: "46%", left: -14 }}>
          leading 1.08
        </span>
      </div>
      <div className="relative hidden h-[232px] rounded-2xl border-[1.5px] border-dashed border-[var(--color-secondary-accent)] md:block">
        <span className={anno} style={{ ...annoStyle, top: -22, right: 0 }}>
          surface/88 · blur 0
        </span>
        <span className={anno} style={{ ...annoStyle, bottom: 10, left: 12 }}>
          bars: 8 × flex-1 · gap 4
        </span>
        <span className={anno} style={{ ...annoStyle, top: "38%", right: -10 }}>
          grid 8pt
        </span>
      </div>
    </div>
  );
}

export function TorchRevealPreview() {
  const [radius, setRadius] = React.useState(175);
  const [flicker, setFlicker] = React.useState(true);
  const [idlePatrol, setIdlePatrol] = React.useState(true);
  const [motion, setMotion] = React.useState(true);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="w-full overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-md)]">
        <TorchReveal
          front={<FinishedHero />}
          reveal={<BlueprintTwin />}
          radius={radius}
          flicker={flicker ? 0.35 : 0}
          idlePatrol={idlePatrol}
          reducedMotion={!motion || undefined}
          seed={3}
        />
      </div>

      <ControlBar label="Torch controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Radius</span>
        <ControlSegmented
          label="Torch radius"
          value={String(radius)}
          onChange={(v) => setRadius(Number(v))}
          options={[
            { value: "110", label: "110px" },
            { value: "175", label: "175px" },
            { value: "260", label: "260px" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={flicker} onPressedChange={setFlicker}>
          Flicker
        </ControlToggle>
        <ControlToggle pressed={idlePatrol} onPressedChange={setIdlePatrol}>
          Idle patrol
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
        <ControlHint>{motion ? "Carry the torch across the hero" : "Static 55/45 split with a dashed divider"}</ControlHint>
      </ControlBar>
    </div>
  );
}

export default TorchRevealPreview;
