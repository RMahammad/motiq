import { interpolate, spring } from "remotion";

// Deterministic PRNG (mulberry32) so particle layouts are stable per seed —
// Math.random() is banned in render paths.
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

type SpringIn = {
  frame: number;
  fps: number;
  delay?: number;
  durationInFrames?: number;
};

/** Settling spring for entrances (0 → 1). */
export const enter = ({ frame, fps, delay = 0, durationInFrames }: SpringIn): number =>
  spring({
    frame: frame - delay,
    fps,
    config: { damping: 26, stiffness: 190, mass: 0.9 },
    durationInFrames,
  });

/** Snappier spring for pops and icons. */
export const pop = ({ frame, fps, delay = 0, durationInFrames }: SpringIn): number =>
  spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, stiffness: 260, mass: 0.7 },
    durationInFrames,
  });

/** Clamped linear fade helper. */
export const fade = (frame: number, from: number, to: number): number =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
