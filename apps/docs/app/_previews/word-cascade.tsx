"use client";

import * as React from "react";

import { WordCascade } from "@/registry/text/word-cascade";
import {
  ControlBar,
  ControlButton,
  ControlDivider,
  ControlSegmented,
  ControlToggle,
} from "../_components/preview-controls";

export function WordCascadePreview() {
  const [rhythm, setRhythm] = React.useState("150");
  const [replayOnReenter, setReplayOnReenter] = React.useState(true);
  const [motion, setMotion] = React.useState(true);
  const [token, setToken] = React.useState(0);

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-6 py-14">
        <WordCascade
          lineStagger={Number(rhythm)}
          wordStagger={Math.round(Number(rhythm) * 0.27)}
          replayOnReenter={replayOnReenter}
          replayToken={token}
          reducedMotion={!motion || undefined}
          seed={5}
          className="mx-auto max-w-[620px]"
        >
          <h2 className="mb-4 text-[clamp(1.7rem,4.4vw,2.7rem)] font-extrabold leading-[1.14] tracking-[-0.025em] text-[var(--color-fg)]">
            Every launch deserves an entrance.
          </h2>
          <p className="max-w-[54ch] text-[clamp(1rem,2.1vw,1.14rem)] leading-[1.7] text-[var(--color-fg-secondary)]">
            Motiq&rsquo;s cascade drops each word into place with its own weight — a beat of blur, a breath of
            overshoot — until the line settles like it rehearsed. Wire it to the viewport and your hero copy
            directs itself.
          </p>
        </WordCascade>
      </div>

      <ControlBar label="Cascade controls">
        <ControlButton onClick={() => setToken((n) => n + 1)}>Replay</ControlButton>
        <ControlDivider />
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">Line rhythm</span>
        <ControlSegmented
          label="Line stagger"
          value={rhythm}
          onChange={setRhythm}
          options={[
            { value: "80", label: "Tight" },
            { value: "150", label: "Default" },
            { value: "260", label: "Loose" },
          ]}
        />
        <ControlDivider />
        <ControlToggle pressed={replayOnReenter} onPressedChange={setReplayOnReenter}>
          Replay on re-enter
        </ControlToggle>
        <ControlToggle pressed={motion} onPressedChange={setMotion}>
          Motion
        </ControlToggle>
      </ControlBar>
    </div>
  );
}

export default WordCascadePreview;
