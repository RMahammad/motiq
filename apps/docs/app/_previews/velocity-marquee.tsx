"use client";

import * as React from "react";

import { VelocityMarquee, type VelocityMarqueeRow } from "@/registry/media/velocity-marquee";
import { ControlBar, ControlDivider, ControlHint, ControlSegmented, ControlToggle } from "../_components/preview-controls";
import { useSceneImages, type SceneSpec } from "./media-scenes";

const SPECS: SceneSpec[] = [
  { kind: "land", t: 0.3, seed: 11 },
  { kind: "geo", v: 0 },
  { kind: "land", t: 0.62, seed: 23 },
  { kind: "orbs" },
  { kind: "geo", v: 1 },
  { kind: "city" },
  { kind: "land", t: 0.08, seed: 31 },
  { kind: "geo", v: 2 },
  { kind: "land", t: 0.9, seed: 41 },
  { kind: "land", t: 0.66, seed: 53 },
];

const MEDIA = [
  ["Basin at noon", "RAW"],
  ["Signal bloom", "GEN"],
  ["Ridgeline, dusk", "RAW"],
  ["Night transit", "GEN"],
  ["Coast strata", "GEN"],
  ["Glass district", "RAW"],
  ["First light", "RAW"],
  ["Static tide", "GEN"],
  ["Moon interval", "RAW"],
  ["Amber field", "RAW"],
];

const LOGOS = [
  "Northbeam",
  "Kelp Audio",
  "Arcline",
  "Fjordworks",
  "Halbach",
  "Prism & Co",
  "Tidewater",
  "Moraine",
  "Cobalt Labs",
  "Ostara",
];

const MARKS = [
  <>
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
    <path d="M12 4v16" stroke="currentColor" strokeWidth="2" />
  </>,
  <path key="tri" d="M12 3 21 20 H3 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  <>
    <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </>,
  <path key="bars" d="M4 18V9M10 18V4M16 18v-8M22 18v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  <path key="hex" d="M12 2l8.5 5v10L12 22l-8.5-5V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  <>
    <path d="M3 16a9 9 0 0 1 18 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="16" r="2.4" fill="currentColor" />
  </>,
];

export function VelocityMarqueePreview() {
  const [motion, setMotion] = React.useState(true);
  const [speed, setSpeed] = React.useState("36");
  const [shear, setShear] = React.useState("10");
  const [meter, setMeter] = React.useState(true);

  const images = useSceneImages(SPECS, 336, 208);

  const rows = React.useMemo<VelocityMarqueeRow[]>(
    () => [
      {
        id: "media",
        label: "Recent captures",
        direction: 1,
        items: MEDIA.map(([name, tag], i) => ({
          id: `media-${i}`,
          node: (
            <div className="w-[168px] overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--color-accent)] hover:shadow-[0_20px_38px_-18px_rgba(3,8,22,0.5)]">
              {images[i] ? (
                <img src={images[i]} alt={name} className="block h-[104px] w-full object-cover" />
              ) : (
                <div className="h-[104px] w-full bg-[var(--color-surface-2)]" />
              )}
              <div className="flex justify-between gap-2 px-3 py-2 text-[11.5px] font-semibold text-[var(--color-fg-secondary)]">
                {name}
                <span className="font-mono text-[10px] text-[var(--color-muted)]">{tag}</span>
              </div>
            </div>
          ),
        })),
      },
      {
        id: "logos",
        label: "Customers",
        direction: -1,
        items: LOGOS.map((name, i) => ({
          id: `logo-${i}`,
          node: (
            <div className="flex h-[58px] items-center gap-2.5 whitespace-nowrap rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-[14px] font-semibold tracking-[-0.01em] text-[var(--color-muted)] transition-colors duration-200 hover:border-[var(--color-accent)] hover:text-[var(--color-accent-text)]">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-5 w-5">
                {MARKS[i % MARKS.length]}
              </svg>
              {name}
            </div>
          ),
        })),
      },
    ],
    [images],
  );

  return (
    <div className="flex w-full max-w-[1080px] flex-col gap-4">
      <VelocityMarquee
        rows={rows}
        baseSpeed={Number(speed)}
        maxSkew={Number(shear)}
        showMeter={meter}
        reducedMotion={!motion || undefined}
        aria-label="Media and customer marquee"
      />

      <ControlBar label="Marquee controls">
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
        <ControlToggle pressed={meter} onPressedChange={setMeter}>
          Boost meter
        </ControlToggle>
        <ControlDivider />
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Drift</span>
        <ControlSegmented
          label="Base drift speed"
          value={speed}
          onChange={setSpeed}
          options={[
            { value: "18", label: "Slow" },
            { value: "36", label: "Base" },
            { value: "72", label: "Fast" },
          ]}
        />
        <ControlDivider />
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Shear</span>
        <ControlSegmented
          label="Maximum shear"
          value={shear}
          onChange={setShear}
          options={[
            { value: "0", label: "0°" },
            { value: "10", label: "10°" },
            { value: "20", label: "20°" },
          ]}
        />
        <ControlHint>Scroll the page quickly — the rails surge to ~6× and shear, then exhale.</ControlHint>
      </ControlBar>
    </div>
  );
}

export default VelocityMarqueePreview;
