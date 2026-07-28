"use client";

import * as React from "react";

import { DepthParallaxScene, type ParallaxLayer } from "@/registry/scroll/depth-parallax-scene";
import { ControlBar, ControlSegmented, ControlToggle, ControlDivider } from "../_components/preview-controls";

/* Every layer is generated from fixed geometry — no image assets, no randomness,
   fully token-themed, and therefore identical on the server and the client. */

const RIDGE_BACK =
  "M0 430 L110 330 L200 390 L330 280 L450 380 L560 300 L690 400 L800 320 L930 395 L1050 325 L1140 380 L1200 340 L1200 640 L0 640 Z";
const RIDGE_FRONT =
  "M0 470 L90 400 L210 450 L340 370 L470 450 L610 385 L740 460 L880 395 L1010 455 L1120 410 L1200 445 L1200 640 L0 640 Z";

const SLABS: Array<[number, number, number, number, string]> = [
  [70, 440, 70, 200, "var(--color-accent)"],
  [180, 400, 54, 240, "var(--color-secondary-accent)"],
  [300, 470, 90, 170, "var(--color-accent)"],
  [470, 420, 60, 220, "var(--color-accent)"],
  [590, 455, 80, 185, "var(--color-secondary-accent)"],
  [740, 405, 52, 235, "var(--color-accent)"],
  [850, 460, 96, 180, "var(--color-secondary-accent)"],
  [1010, 430, 64, 210, "var(--color-accent)"],
];

const PLANE_LINES: Array<[number, number, number, number]> = [
  [0, 588, 1200, 552],
  [0, 616, 1200, 586],
  [120, 556, 60, 640],
  [320, 549, 290, 640],
  [520, 543, 505, 640],
  [720, 536, 718, 640],
  [920, 529, 932, 640],
  [1120, 523, 1145, 640],
];

const CARDS = [
  { k: "Frame budget", v: "16.6 ms", w: 72, cls: "left-[12%] top-[26%] w-[172px]", delay: "0s", dur: "7s" },
  { k: "Layers live", v: "6 / 6", w: 100, cls: "right-[14%] top-[44%] w-[150px]", delay: "-2.1s", dur: "8.4s" },
  { k: "Travel", v: "±140 px", w: 54, cls: "left-[34%] top-[60%] w-[138px]", delay: "-3.7s", dur: "6.2s" },
];

function Sky() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(38%_34%_at_68%_26%,color-mix(in_oklab,var(--color-secondary-accent)_22%,transparent),transparent_70%),linear-gradient(180deg,color-mix(in_oklab,var(--color-accent)_14%,var(--color-bg))_0%,var(--color-bg)_62%,color-mix(in_oklab,var(--color-accent)_6%,var(--color-bg))_100%)]">
      <span className="absolute left-[66%] top-[18%] h-[84px] w-[84px] rounded-full bg-[radial-gradient(circle_at_38%_34%,color-mix(in_oklab,var(--color-secondary-accent)_65%,var(--color-bg-elevated)),color-mix(in_oklab,var(--color-accent)_50%,var(--color-bg))_72%)] shadow-[0_0_60px_12px_color-mix(in_oklab,var(--color-secondary-accent)_26%,transparent)]" />
    </div>
  );
}

function FarRidge() {
  return (
    <svg viewBox="0 0 1200 640" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
      <path d={RIDGE_BACK} fill="var(--color-surface-2)" />
      <path d={RIDGE_FRONT} fill="var(--color-surface)" opacity={0.9} />
    </svg>
  );
}

function HazeBand() {
  return (
    <div className="absolute inset-x-0 bottom-[26%] top-[46%] bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--color-secondary-accent)_10%,transparent)_55%,transparent)]" />
  );
}

function SlabCity() {
  return (
    <svg viewBox="0 0 1200 640" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
      {SLABS.map(([x, y, w, h, tint], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill="var(--color-surface-2)" stroke="var(--color-border-strong)" />
          <rect x={x} y={y} width={w} height={5} fill={tint} opacity={0.65} />
        </g>
      ))}
      <rect x={1120} y={470} width={70} height={170} fill="var(--color-surface-2)" stroke="var(--color-border-strong)" />
    </svg>
  );
}

function ForePlane() {
  return (
    <svg viewBox="0 0 1200 640" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
      <path d="M0 560 L1200 520 L1200 640 L0 640 Z" fill="var(--color-bg-elevated)" />
      <g stroke="var(--color-border-strong)" opacity={0.5}>
        {PLANE_LINES.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
      <path d="M0 560 L1200 520" stroke="var(--color-accent)" strokeWidth={2} opacity={0.5} />
    </svg>
  );
}

function FloatingCards() {
  return (
    <div className="absolute inset-0">
      {CARDS.map((c) => (
        <div
          key={c.k}
          className={`mk-px-card absolute rounded-[10px] border border-[var(--color-border-strong)] bg-[color-mix(in_oklab,var(--color-surface)_88%,transparent)] px-3.5 py-2.5 shadow-[0_18px_44px_-18px_rgba(0,3,10,0.6)] ${c.cls}`}
          style={{ animationDuration: c.dur, animationDelay: c.delay }}
        >
          <small className="mb-[3px] block font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--color-muted)]">
            {c.k}
          </small>
          <b className="text-[17px] text-[var(--color-fg)] tabular-nums">{c.v}</b>
          <span className="mt-[7px] block h-1 overflow-hidden rounded bg-[var(--color-surface-2)]">
            <span
              className="block h-full rounded bg-[linear-gradient(90deg,var(--color-accent),var(--color-secondary-accent))]"
              style={{ width: `${c.w}%` }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

const FLOAT_CSS = `
.mk-px-card { animation-name: mk-px-float; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
@keyframes mk-px-float { 0%, 100% { margin-top: 0; } 50% { margin-top: -6px; } }
@media (prefers-reduced-motion: reduce) { .mk-px-card { animation: none; } }
`.trim();

export function DepthParallaxScenePreview() {
  const [range, setRange] = React.useState("180");
  const [pointer, setPointer] = React.useState(true);
  const [dof, setDof] = React.useState(true);
  const [motion, setMotion] = React.useState(true);
  const [engaged, setEngaged] = React.useState(false);

  const layers = React.useMemo<ParallaxLayer[]>(
    () => [
      { node: <Sky />, depth: 0.06 },
      { node: <FarRidge />, depth: 0.16, blurAtDepth: 2.5 },
      { node: <HazeBand />, depth: 0.24, blurAtDepth: 1.4 },
      { node: <SlabCity />, depth: 0.32 },
      { node: <ForePlane />, depth: 0.52 },
      { node: <FloatingCards />, depth: 0.78 },
    ],
    [],
  );

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <style dangerouslySetInnerHTML={{ __html: FLOAT_CSS }} />
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
        onScrollCapture={() => setEngaged(true)}
        onPointerDown={() => setEngaged(true)}
      >
        <DepthParallaxScene
          scrollMode="container"
          height={460}
          scrollLength={3}
          layers={layers}
          range={Number(range)}
          pointer={pointer}
          depthOfField={dof}
          reducedMotion={!motion || undefined}
          label="Decorative layered landscape: gradient sky, mountain ridges, a slab city, and floating interface cards moving at different depths."
        />

        {motion ? (
          <span
            aria-hidden
            className={`pointer-events-none absolute bottom-3.5 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-[7px] rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg-elevated)_82%,transparent)] px-3 py-1.5 font-mono text-[11px] text-[var(--color-fg-secondary)] transition-opacity duration-300 ${
              engaged ? "opacity-0" : "opacity-100"
            }`}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="motion-safe:animate-bounce">
              <path
                d="M1 3.5 L5 7.5 L9 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            scroll inside · move the pointer
          </span>
        ) : null}
      </div>

      <ControlBar label="Depth parallax controls">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Travel</span>
        <ControlSegmented
          label="Layer travel range"
          value={range}
          onChange={setRange}
          options={[
            { value: "120", label: "120px" },
            { value: "180", label: "180px" },
            { value: "260", label: "260px" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={pointer} onPressedChange={setPointer}>
          Pointer drift
        </ControlToggle>
        <ControlToggle pressed={dof} onPressedChange={setDof}>
          Depth of field
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
      </ControlBar>
    </div>
  );
}

export default DepthParallaxScenePreview;
