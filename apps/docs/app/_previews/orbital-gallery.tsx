"use client";

import * as React from "react";

import { OrbitalGallery, type OrbitalGalleryItem } from "@/registry/media/orbital-gallery";
import { ControlBar, ControlDivider, ControlHint, ControlSegmented, ControlToggle } from "../_components/preview-controls";
import { useSceneImages, type SceneSpec } from "./media-scenes";

/** The Motion Lab's nine-card ring, generated in-canvas (nothing is fetched). */
const SPECS: SceneSpec[] = [
  { kind: "land", t: 0.3, seed: 11 },
  { kind: "geo", v: 0 },
  { kind: "land", t: 0.62, seed: 23 },
  { kind: "city" },
  { kind: "orbs" },
  { kind: "land", t: 0.08, seed: 31 },
  { kind: "geo", v: 2 },
  { kind: "land", t: 0.9, seed: 41 },
  { kind: "geo", v: 1 },
];

const CAPTIONS = [
  "Basin at noon",
  "Signal bloom",
  "Ridgeline, dusk",
  "Glass district",
  "Night transit",
  "First light",
  "Static tide",
  "Moon interval",
  "Coast strata",
];

export function OrbitalGalleryPreview() {
  const [motion, setMotion] = React.useState(true);
  const [drift, setDrift] = React.useState("0.14");
  const [haze, setHaze] = React.useState(true);
  const [active, setActive] = React.useState(0);

  const images = useSceneImages(SPECS, 380, 420);

  const items = React.useMemo<OrbitalGalleryItem[]>(
    () =>
      CAPTIONS.map((caption, i) => ({
        id: `card-${i}`,
        src: images[i],
        alt: caption,
        caption,
      })),
    [images],
  );

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <OrbitalGallery
        items={items}
        autoRotate={Number(drift)}
        dimRear={haze ? 0.78 : 0.28}
        blurRear={haze ? 2.2 : 0}
        reducedMotion={!motion || undefined}
        activeIndex={active}
        onActiveIndexChange={setActive}
        aria-label="Template gallery — nine covers on a perspective ring"
      />

      <ControlBar label="Gallery controls">
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
        <ControlToggle pressed={haze} onPressedChange={setHaze}>
          Rear haze
        </ControlToggle>
        <ControlDivider />
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Idle drift</span>
        <ControlSegmented
          label="Idle drift speed"
          value={drift}
          onChange={setDrift}
          options={[
            { value: "0", label: "Off" },
            { value: "0.14", label: "Calm" },
            { value: "0.4", label: "Lively" },
          ]}
        />
        <ControlHint live>
          Fronted: {CAPTIONS[active]} ({active + 1}/{CAPTIONS.length})
        </ControlHint>
      </ControlBar>
    </div>
  );
}

export default OrbitalGalleryPreview;
