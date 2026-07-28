"use client";

import * as React from "react";

import { FilmstripScrub, type FilmstripFrame } from "@/registry/media/filmstrip-scrub";
import { ControlBar, ControlDivider, ControlHint, ControlSegmented, ControlToggle } from "../_components/preview-controls";
import { phaseName, useSceneImages, type SceneSpec } from "./media-scenes";

const FRAME_COUNT = 12;
const SEED = 5;

/** Twelve stills of ONE valley, dawn → midnight — adjacent frames share geometry
 *  so the crossfade reads as time passing rather than a dissolve. */
const SPECS: SceneSpec[] = Array.from({ length: FRAME_COUNT }, (_, i) => ({
  kind: "land" as const,
  t: i / (FRAME_COUNT - 1),
  seed: SEED,
}));

export function FilmstripScrubPreview() {
  const [motion, setMotion] = React.useState(true);
  const [autoplay, setAutoplay] = React.useState(true);
  const [hoverScrub, setHoverScrub] = React.useState(true);
  const [fps, setFps] = React.useState("24");
  const [frame, setFrame] = React.useState(0);

  const images = useSceneImages(SPECS, 560, 315);

  const frames = React.useMemo<FilmstripFrame[]>(
    () =>
      SPECS.map((spec, i) => {
        const label = phaseName(spec.t ?? 0);
        return {
          id: `frame-${i}`,
          src: images[i],
          alt: `Valley at ${label}, frame ${i + 1} of ${FRAME_COUNT}`,
          label,
        };
      }),
    [images],
  );

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <FilmstripScrub
        frames={frames}
        fps={Number(fps)}
        idleSpeed={autoplay ? 0.9 : 0}
        hoverScrub={hoverScrub}
        reducedMotion={!motion || undefined}
        frameIndex={frame}
        onFrameIndexChange={setFrame}
        scrubberLabel="Valley timeline, 12 frames from dawn to midnight"
      />

      <ControlBar label="Filmstrip controls">
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
        <ControlToggle pressed={autoplay} onPressedChange={setAutoplay}>
          Idle autoplay
        </ControlToggle>
        <ControlToggle pressed={hoverScrub} onPressedChange={setHoverScrub}>
          Hover scrub
        </ControlToggle>
        <ControlDivider />
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Timecode</span>
        <ControlSegmented
          label="Timecode base"
          value={fps}
          onChange={setFps}
          options={[
            { value: "24", label: "24 fps" },
            { value: "25", label: "25 fps" },
            { value: "30", label: "30 fps" },
          ]}
        />
        <ControlHint live>Frame {frame + 1} — {frames[frame]?.label ?? ""}</ControlHint>
      </ControlBar>
    </div>
  );
}

export default FilmstripScrubPreview;
