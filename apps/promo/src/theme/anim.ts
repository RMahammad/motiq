import { Easing, interpolate, spring } from "remotion";

/** House easing for fades/slides (ease-out-quint feel, no bounce). */
export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);

/** Clamped, eased 0→1 ramp — use for opacity/translate transitions. */
export const rampE = (frame: number, from: number, to: number): number => {
  if (to <= from) return frame < from ? 0 : 1;
  return interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
};

/** Deterministic PRNG (mulberry32) — Math.random is banned in render paths. */
export const seededRandom = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type SpringIn = { frame: number; fps: number; delay?: number; durationInFrames?: number };

/** Settling spring for panel/copy entrances (0 → 1). Restrained, no overshoot. */
export const enter = ({ frame, fps, delay = 0, durationInFrames }: SpringIn): number =>
  spring({
    frame: frame - delay,
    fps,
    config: { damping: 26, stiffness: 190, mass: 0.9 },
    durationInFrames,
  });

/** Snappier spring for pops (status flips, chips). Slight overshoot. */
export const pop = ({ frame, fps, delay = 0, durationInFrames }: SpringIn): number =>
  spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, stiffness: 260, mass: 0.7 },
    durationInFrames,
  });

/** Clamped 0→1 ramp between two frames. Zero-length ramps act as a step. */
export const ramp = (frame: number, from: number, to: number): number => {
  if (to <= from) return frame < from ? 0 : 1;
  return interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

/** Fade in over `fadeIn` frames and out over the last `fadeOut` frames of a window. */
export const inOut = (
  frame: number,
  from: number,
  to: number,
  fadeIn = 6,
  fadeOut = 6,
): number =>
  Math.min(
    fadeIn <= 0 ? 1 : ramp(frame, from, from + fadeIn),
    fadeOut <= 0 ? 1 : 1 - ramp(frame, to - fadeOut, to),
  );

/** Integer step count between frames — e.g. words revealed so far. */
export const countBetween = (frame: number, from: number, to: number, total: number): number =>
  Math.round(ramp(frame, from, to) * total);
