"use client";

import * as React from "react";

import { FlowWarpImage } from "@/registry/media/flow-warp-image";
import { ControlBar, ControlDivider, ControlHint, ControlSegmented, ControlToggle } from "../_components/preview-controls";
import { useSceneImages, type SceneSpec } from "./media-scenes";

/** One generated dusk ridgeline — the component itself takes consumer media. */
const SPECS: SceneSpec[] = [{ kind: "land", t: 0.62, seed: 12 }];

const GRIDS: Record<string, [number, number]> = {
  coarse: [16, 10],
  standard: [32, 20],
  fine: [44, 28],
};

export function FlowWarpImagePreview() {
  const [motion, setMotion] = React.useState(true);
  const [mesh, setMesh] = React.useState<keyof typeof GRIDS>("standard");
  const [splash, setSplash] = React.useState(true);
  const [idle, setIdle] = React.useState(true);

  const [image] = useSceneImages(SPECS, 1200, 750);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <FlowWarpImage
        src={image}
        alt="Mountain ridgeline at dusk"
        grid={GRIDS[mesh]}
        splashOnLeave={splash}
        idleWave={idle}
        reducedMotion={!motion || undefined}
        overlay={
          <div className="absolute left-4 top-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(240,247,255,0.75)]">
              Field Study 12
            </div>
            <div
              className="text-[20px] font-bold tracking-[-0.01em] text-[#f5f9ff]"
              style={{ textShadow: "0 2px 18px rgba(3, 8, 20, 0.6)" }}
            >
              Ridgeline, dusk
            </div>
          </div>
        }
      />

      <ControlBar label="Warp controls">
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
        <ControlToggle pressed={splash} onPressedChange={setSplash}>
          Splash on exit
        </ControlToggle>
        <ControlToggle pressed={idle} onPressedChange={setIdle}>
          Idle swell
        </ControlToggle>
        <ControlDivider />
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Mesh</span>
        <ControlSegmented
          label="Mesh resolution"
          value={mesh}
          onChange={(v) => setMesh(v as keyof typeof GRIDS)}
          options={[
            { value: "coarse", label: "16×10" },
            { value: "standard", label: "32×20" },
            { value: "fine", label: "44×28" },
          ]}
        />
        <ControlHint>Sweep the surface, or focus it and steer with the arrow keys.</ControlHint>
      </ControlBar>
    </div>
  );
}

export default FlowWarpImagePreview;
